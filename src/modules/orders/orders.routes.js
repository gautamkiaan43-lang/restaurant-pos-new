const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../validators/common.validator');
const { createOrderSchema, updateOrderStatusSchema } = require('./orders.validation');

router.use(authenticate);

router.get('/', ordersController.getAllOrders);
router.get('/:id', ordersController.getOrderById);
router.post('/', authorize('waiter', 'customer', 'manager', 'admin'), validate(createOrderSchema), ordersController.createOrder);
router.patch('/:id/status', authorize('chef', 'manager', 'admin', 'waiter'), validate(updateOrderStatusSchema), ordersController.updateStatus);

module.exports = router;
