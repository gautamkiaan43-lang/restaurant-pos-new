const authService = require('./auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        message: err.message
      });
    }
  }

  async register(req, res) {
    try {
      const { fullName, email, password } = req.body;
      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name, email, and password are required'
        });
      }

      const result = await authService.register(fullName, email, password);

      res.json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async googleLogin(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const result = await authService.googleLogin(token);

      res.json({
        success: true,
        message: 'Google login successful',
        data: result
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        message: err.message
      });
    }
  }

  async appleLogin(req, res) {
    try {
      const { token, user } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const result = await authService.appleLogin(token, user);

      res.json({
        success: true,
        message: 'Apple login successful',
        data: result
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        message: err.message
      });
    }
  }

  async getMe(req, res) {

    // req.user is set by auth middleware
    res.json({
      success: true,
      message: 'User data fetched successfully',
      data: req.user
    });
  }
  async updateCredentials(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      const { email, currentPassword, newPassword } = req.body;
      
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      await authService.updateCredentials(userId, email, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Credentials updated successfully'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async updateAvatar(req, res) {
    try {
      const userId = req.user.id;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      // Build public URL path
      const avatarUrl = `/uploads/profiles/${req.file.filename}`;
      await authService.updateAvatar(userId, avatarUrl);
      res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: { avatar: avatarUrl }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();

