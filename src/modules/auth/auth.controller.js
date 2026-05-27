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
}

module.exports = new AuthController();

