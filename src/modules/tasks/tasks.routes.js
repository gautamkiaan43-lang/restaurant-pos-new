const express = require('express');
const router = express.Router();
const tasksController = require('./tasks.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', tasksController.getAllTasks);
router.post('/', authorize('admin', 'manager'), tasksController.createTask);
router.patch('/:id/status', tasksController.updateStatus);
router.delete('/:id', authorize('admin', 'manager'), tasksController.deleteTask);

module.exports = router;
