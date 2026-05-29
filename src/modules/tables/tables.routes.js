const express = require('express');
const router = express.Router();
const tablesController = require('./tables.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', tablesController.getAllTables);
router.get('/zones', tablesController.getZones);
router.post('/', authorize('admin', 'manager'), tablesController.createTable);
router.patch('/:id/status', authorize('admin', 'manager', 'waiter'), tablesController.updateStatus);
router.patch('/:id', authorize('admin', 'manager'), tablesController.updateTable);
router.delete('/:id', authorize('admin', 'manager'), tablesController.deleteTable);

module.exports = router;
