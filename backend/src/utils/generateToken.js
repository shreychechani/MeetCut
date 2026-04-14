import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    {id : user.id}, //user.id instead of userID
    process.env.JWT_SECRET,
    {expiresIn: '7d'} // Token valid for 7 days
  );
};

export default generateToken;