const express = require('express');
const router = express.Router();
const houseAccountsController = require('./house-accounts.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('admin', 'manager', 'cashier', 'waiter'), houseAccountsController.getAllAccounts);
router.post('/', authorize('admin', 'manager'), houseAccountsController.createAccount);
router.get('/:id/statement', authorize('admin', 'manager', 'cashier'), houseAccountsController.getStatement);
router.post('/:id/payments', authorize('admin', 'manager', 'cashier'), houseAccountsController.recordPayment);
router.put('/:id', authorize('admin', 'manager'), houseAccountsController.updateAccount);
router.delete('/:id', authorize('admin', 'manager'), houseAccountsController.deleteAccount);

module.exports = router;
