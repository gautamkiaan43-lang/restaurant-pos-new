const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Only Admins can manage global settings
router.get('/', authenticate, settingsController.getSettings);
router.patch('/', authenticate, authorize('admin'), settingsController.updateSettings);

module.exports = router;
