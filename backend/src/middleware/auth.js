import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {

    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password'); // attach user to request, exclude password
        
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        next();
        
    } catch(error) {
    // Token invalid or expired
    return res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired'
    })
  }
}