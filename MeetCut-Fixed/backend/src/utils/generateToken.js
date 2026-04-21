import jwt from 'jsonwebtoken';

// Accept userId directly (a string or ObjectId) — NOT a user object
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export default generateToken;
