import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    const user = await User.create({ fullName, email, password });

    res.status(201).json({ 
      success: true,
      message: 'User created successfully' 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      token, 
      name: user.fullName 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get current user (protected route)
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is set by protect middleware
    res.json({ 
      success: true,
      user: req.user 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

export default router;