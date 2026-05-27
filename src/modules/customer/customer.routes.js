const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/favorites', customerController.getFavorites);
router.post('/favorites', customerController.toggleFavorite);
router.put('/profile', customerController.updateProfile);

module.exports = router;
