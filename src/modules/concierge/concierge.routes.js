const express = require('express');
const router = express.Router();
const conciergeController = require('./concierge.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Guest Routes (Public or simplified auth)
router.get('/guest/ticket/:guestId', conciergeController.getGuestTicket);
router.post('/guest/messages', conciergeController.sendGuestMessage);

// Staff Routes (Protected)
router.use(authenticate);
router.get('/tickets', conciergeController.getTickets);
router.post('/tickets', conciergeController.createTicket);
router.get('/tickets/:id/messages', conciergeController.getMessages);
router.post('/messages', conciergeController.sendMessage);

module.exports = router;
