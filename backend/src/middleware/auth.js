import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware - verifies JWT token
 * Use this on routes that require authentication
 */
export const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - User not found'
      });
    }

    // Attach user to request object
    req.user = user;

    next(); // Continue to the next middleware/route handler

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Invalid token'
    });
  }
};