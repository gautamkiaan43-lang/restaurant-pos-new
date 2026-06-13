const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/google-login', authController.googleLogin);
router.post('/apple-login', authController.appleLogin);
router.put('/update-credentials', authenticate, authController.updateCredentials);
router.post('/update-avatar', authenticate, upload.single('avatar'), authController.updateAvatar);
// router.get('/me', authenticate, authController.getMe);

module.exports = router;
