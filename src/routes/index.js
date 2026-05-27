const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('../modules/auth/auth.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const menuRoutes = require('../modules/menu/menu.routes');
const orderRoutes = require('../modules/orders/orders.routes');
const tableRoutes = require('../modules/tables/tables.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const staffRoutes = require('../modules/staff/staff.routes');
const reservationRoutes = require('../modules/reservations/reservations.routes');
const taskRoutes = require('../modules/tasks/tasks.routes');
const billingRoutes = require('../modules/billing/billing.routes');
const roomRoutes = require('../modules/rooms/rooms.routes');
const conciergeRoutes = require('../modules/concierge/concierge.routes');
const customerRoutes = require('../modules/customer/customer.routes');
const notificationRoutes = require('../modules/notifications/notifications.routes');
const serviceRoutes = require('../modules/services/services.routes');
const serviceBookingRoutes = require('../modules/services/service-bookings.routes');
const settingsRoutes = require('../modules/settings/settings.routes');

// Use routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/tables', tableRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/staff', staffRoutes);
router.use('/reservations', reservationRoutes);
router.use('/tasks', taskRoutes);
router.use('/billing', billingRoutes);
router.use('/rooms', roomRoutes);
router.use('/concierge', conciergeRoutes);
router.use('/customer', customerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/services', serviceRoutes);
router.use('/service-bookings', serviceBookingRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
