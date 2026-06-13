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
      return sum + base;
    }, 0);

    const discount = parseFloat(orderData.discount) || 0;
    const tax = parseFloat(orderData.tax) || 0;

    // Support both camelCase and snake_case for service charge percent and amount
    let serviceChargePercent = 0;
    if (orderData.serviceChargePercent !== undefined) {
      serviceChargePercent = parseFloat(orderData.serviceChargePercent);
    } else if (orderData.service_charge_percent !== undefined) {
      serviceChargePercent = parseFloat(orderData.service_charge_percent);
    }

    let serviceChargeAmount = 0;
    if (orderData.serviceChargeAmount !== undefined) {
      serviceChargeAmount = parseFloat(orderData.serviceChargeAmount);
    } else if (orderData.service_charge_amount !== undefined) {
      serviceChargeAmount = parseFloat(orderData.service_charge_amount);
    } else if (serviceChargePercent > 0) {
      // Validate percent is only allowed values [0, 5, 10, 30] if calculated automatically
      if (![0, 5, 10, 30].includes(serviceChargePercent)) {
        throw new Error('Invalid service charge percentage. Allowed values are 0, 5, 10, 30.');
      }
      serviceChargeAmount = parseFloat((calculatedSubtotal * (serviceChargePercent / 100)).toFixed(2));
    }

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
      // 1. Create or Update Order
      let orderId;
      let existingOrder = null;

      if (dbOrderData.table_id) {
        const [rows] = await connection.execute(
          'SELECT id, order_number FROM orders WHERE table_id = ? AND payment_status = "pending" AND deletedAt IS NULL LIMIT 1',
          [dbOrderData.table_id]
        );
        if (rows.length > 0) {
          existingOrder = rows[0];
        }
      }

      if (existingOrder) {
        orderId = existingOrder.id;
        dbOrderData.order_number = existingOrder.order_number; // Keep the same order number
        
        await connection.execute(
          `UPDATE orders SET 
            subtotal = ?, tax = ?, discount = ?, 
            service_charge_percent = ?, service_charge_amount = ?, grand_total = ?, 
            payment_status = ?, order_status = ?, notes = ?
           WHERE id = ?`,
          [
            dbOrderData.subtotal,
            dbOrderData.tax,
            dbOrderData.discount,
            dbOrderData.service_charge_percent,
            dbOrderData.service_charge_amount,
            dbOrderData.grand_total,
            dbOrderData.payment_status,
            dbOrderData.order_status,
            dbOrderData.notes,
            orderId
          ]
        );

        // Delete previous items for this running order so we can re-insert them cleanly
        await connection.execute(
          'DELETE FROM order_items WHERE order_id = ?',
          [orderId]
        );
      } else {
        orderId = await ordersRepository.create(dbOrderData);
      }

      // If paid via House Tab/Khata, insert a CHARGE transaction in the ledger
      if ((orderData.paymentMethod === 'House Tab' || orderData.payment_method === 'House Tab') && orderData.houseAccountId) {
        await connection.execute(
          `INSERT INTO house_account_transactions (house_account_id, order_id, amount, transaction_type, notes)
           VALUES (?, ?, ?, 'CHARGE', ?)`,
          [
            orderData.houseAccountId,
            orderId,
            grandTotal,
            `Charged to Tab: Order #${dbOrderData.order_number}`
          ]
        );
      }

      // 2. Create Order Items — now with addons, size_name, size_price, notes
      // Filter out corrupted items that have no valid menu_item_id
      const validItems = items.filter(i => i.menu_item_id && String(i.menu_item_id).length < 12);
      
      for (const item of validItems) {
        // Serialize addons array to JSON string
        const addonsStr = item.addons
          ? (typeof item.addons === 'string' ? item.addons : JSON.stringify(item.addons))
          : null;

        // Calculate total_price = unit_price × qty (unit_price already includes addons from frontend)
        const itemUnitPrice = parseFloat(item.unit_price);
        const itemQty = parseInt(item.quantity);
        const computedTotalPrice = parseFloat((itemUnitPrice * itemQty).toFixed(2));

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

      // Update restaurant table status based on order payment status
      if (dbOrderData.table_id) {
        const nextTableStatus = dbOrderData.payment_status === 'paid' ? 'available' : 'occupied';
        await connection.execute(
          'UPDATE restaurant_tables SET status = ? WHERE id = ?',
          [nextTableStatus, dbOrderData.table_id]
        );
      }

      await connection.commit();

      // 3. Socket Notification
      const io = getIO();
      io.emit('new_order', { id: orderId, order_number: dbOrderData.order_number });
      io.to('chef').emit('new_kitchen_ticket', { orderId });
      
      if (dbOrderData.table_id) {
        const nextTableStatus = dbOrderData.payment_status === 'paid' ? 'available' : 'occupied';
        io.emit('table_status_update', { id: dbOrderData.table_id, status: nextTableStatus });
      }

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
