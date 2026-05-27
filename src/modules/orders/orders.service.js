const ordersRepository = require('./orders.repository');
const { getIO } = require('../../sockets/socket.manager');
const notificationService = require('../notifications/notifications.service');
const pool = require('../../database/connection');

class OrdersService {
  async getAllOrders(filters) {
    return await ordersRepository.findWithItems(filters);
  }

  async getOrderById(id) {
    return await ordersRepository.getOrderWithItems(id);
  }

  async createOrder(orderData, items) {
    // 1. Recalculate subtotal securely from items
    //    unit_price already includes size adjustment from the frontend
    //    addon prices are added separately per item
    const calculatedSubtotal = items.reduce((sum, item) => {
      const base = parseFloat(item.unit_price) * parseInt(item.quantity);

      // Sum selected addon prices for this item
      let addonTotal = 0;
      if (item.addons) {
        const parsedAddons = typeof item.addons === 'string'
          ? (() => { try { return JSON.parse(item.addons); } catch { return []; } })()
          : (Array.isArray(item.addons) ? item.addons : []);
        addonTotal = parsedAddons.reduce((s, a) => s + (parseFloat(a.price) || 0), 0) * parseInt(item.quantity);
      }

      return sum + base + addonTotal;
    }, 0);

    const discount = parseFloat(orderData.discount) || 0;
    const tax = parseFloat(orderData.tax) || 0;

    // Support both camelCase and snake_case for service charge percent
    let serviceChargePercent = 0;
    if (orderData.serviceChargePercent !== undefined) {
      serviceChargePercent = parseFloat(orderData.serviceChargePercent);
    } else if (orderData.service_charge_percent !== undefined) {
      serviceChargePercent = parseFloat(orderData.service_charge_percent);
    }

    // Validate percent is only allowed values [0, 5, 10, 30]
    if (![0, 5, 10, 30].includes(serviceChargePercent)) {
      throw new Error('Invalid service charge percentage. Allowed values are 0, 5, 10, 30.');
    }

    const serviceChargeAmount = parseFloat((calculatedSubtotal * (serviceChargePercent / 100)).toFixed(2));
    const grandTotal = parseFloat((calculatedSubtotal + tax - discount + serviceChargeAmount).toFixed(2));

    // Prepare data for database insertion (matching DB column names)
    const dbOrderData = {
      order_number: orderData.order_number,
      customer_id: orderData.customer_id || null,
      user_id: orderData.user_id || null,
      table_id: orderData.table_id || null,
      order_type: orderData.order_type,
      subtotal: calculatedSubtotal,
      tax: tax,
      discount: discount,
      service_charge_percent: serviceChargePercent,
      service_charge_amount: serviceChargeAmount,
      grand_total: grandTotal,
      payment_status: orderData.payment_status || 'pending',
      order_status: orderData.order_status || 'new',
      assigned_waiter: orderData.assigned_waiter || null,
      assigned_chef: orderData.assigned_chef || null,
      notes: orderData.notes || null
    };

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Create Order
      const orderId = await ordersRepository.create(dbOrderData);

      // 2. Create Order Items — now with addons, size_name, size_price, notes
      for (const item of items) {
        // Serialize addons array to JSON string
        const addonsStr = item.addons
          ? (typeof item.addons === 'string' ? item.addons : JSON.stringify(item.addons))
          : null;

        // Calculate total_price = (unit_price + addon prices) × qty
        let addonPricePerUnit = 0;
        if (item.addons) {
          const parsedAddons = typeof item.addons === 'string'
            ? (() => { try { return JSON.parse(item.addons); } catch { return []; } })()
            : (Array.isArray(item.addons) ? item.addons : []);
          addonPricePerUnit = parsedAddons.reduce((s, a) => s + (parseFloat(a.price) || 0), 0);
        }
        const itemUnitPrice = parseFloat(item.unit_price);
        const itemQty = parseInt(item.quantity);
        const computedTotalPrice = parseFloat(((itemUnitPrice + addonPricePerUnit) * itemQty).toFixed(2));

        await connection.execute(
          `INSERT INTO order_items 
            (order_id, menu_item_id, quantity, unit_price, total_price, addons, size_name, size_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.menu_item_id,
            itemQty,
            itemUnitPrice,
            computedTotalPrice,
            addonsStr,
            item.size_name || null,
            item.size_price !== undefined ? parseFloat(item.size_price) : null
          ]
        );
      }

      await connection.commit();

      // 3. Socket Notification
      const io = getIO();
      io.emit('new_order', { id: orderId, order_number: dbOrderData.order_number });
      io.to('chef').emit('new_kitchen_ticket', { orderId });

      // 4. Save Notification
      await notificationService.createNotification({
        notification_type: 'ORDER',
        message: `New Order Received: #${dbOrderData.order_number}`,
        targetRole: 'CHEF'
      });

      await notificationService.createNotification({
        notification_type: 'ORDER',
        message: `New Order Placed: #${dbOrderData.order_number}`,
        targetRole: 'ADMIN'
      });

      return {
        orderId,
        serviceChargeAmount,
        grandTotal
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateOrderStatus(id, status) {
    const result = await ordersRepository.update(id, { order_status: status });

    // Socket Notification
    const io = getIO();
    io.emit('order_update', { id, status });

    // Save Notification
    await notificationService.createNotification({
      notification_type: 'ORDER_UPDATE',
      message: `Order #${id} is now ${status}`,
      targetRole: status === 'ready' ? 'WAITER' : 'ADMIN'
    });

    return result;
  }
}

module.exports = new OrdersService();
