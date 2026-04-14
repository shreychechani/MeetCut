import express from 'express';
import {body} from 'express-validator';
import { signup, login ,getMe} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Signup route : POST /api/auth/signup
router.post('/signup', [
    body('fullName').not().isEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], signup);

// Login route : POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').not().isEmpty().withMessage('Password is required')
], login);

// Get current user : GET /api/auth/me (protected route)
router.get('/me', protect, getMe);

export default router;
