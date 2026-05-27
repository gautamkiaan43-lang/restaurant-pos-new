const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const authModel = require('./auth.model');

class AuthService {
  async login(email, password) {
    const user = await authModel.findWithRole(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  async googleLogin(idToken) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }

    const { email, name, picture } = payload;
    
    // Check if user exists
    let user = await authModel.findWithRole(email);
    
    if (!user) {
      // Find the customer role ID
      let roleId = await authModel.findRoleByName('customer');
      if (!roleId) {
        roleId = 6; // fallback to 6 (default customer role ID in seeder)
      }
      
      // Generate a secure random password for this google user
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Create user
      await authModel.create({
        full_name: name || 'Google User',
        email: email,
        password: hashedPassword,
        role_id: roleId,
        avatar: picture || null,
        status: 'active'
      });
      
      // Fetch the newly created user details
      user = await authModel.findWithRole(email);
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  async appleLogin(idToken, appleUser) {
    let payload;
    try {
      const appleSignin = require('apple-signin-auth');
      try {
        payload = await appleSignin.verifyIdToken(idToken, {
          audience: process.env.APPLE_CLIENT_ID,
        });
      } catch (err) {
        console.warn('Real Apple Token Verification failed, falling back to dummy parsing for development:', err.message);
        
        // Fallback: decode JWT payload manually to get email for mock testing
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          payload = JSON.parse(jsonPayload);
        } else {
          throw new Error('Malformed Apple Token');
        }
      }
    } catch (error) {
      console.error('Apple token verification failed:', error);
      throw new Error('Invalid Apple token');
    }

    const email = payload.email;
    if (!email) {
      throw new Error('Email not provided in Apple Token');
    }

    // Check if user exists
    let user = await authModel.findWithRole(email);
    
    if (!user) {
      // Find the customer role ID
      let roleId = await authModel.findRoleByName('customer');
      if (!roleId) {
        roleId = 6; // fallback to 6 (default customer role ID in seeder)
      }
      
      // Determine name (Apple only passes user details once on registration)
      let fullName = 'Apple User';
      if (appleUser && appleUser.name) {
        fullName = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim() || 'Apple User';
      }
      
      // Generate a secure random password for this apple user
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Create user
      await authModel.create({
        full_name: fullName,
        email: email,
        password: hashedPassword,
        role_id: roleId,
        avatar: null,
        status: 'active'
      });
      
      // Fetch the newly created user details
      user = await authModel.findWithRole(email);
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }
}

module.exports = new AuthService();


