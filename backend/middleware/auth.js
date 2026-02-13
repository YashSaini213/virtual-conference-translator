// middleware/auth.js - Authentication middleware

const { verifyToken: clerkVerifyToken } = require('@clerk/clerk-sdk-node');

// Verify token middleware using Clerk
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const payload = await clerkVerifyToken(token);
    req.user = {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };
