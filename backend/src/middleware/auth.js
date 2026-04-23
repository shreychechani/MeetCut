// ─── Auth middleware — verifies JWT and attaches req.user ─────────────────────
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired — please log in again' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token — please log in again' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found — account may have been deleted' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

export default protect;
