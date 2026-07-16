const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect - Verifies Bearer JWT token and attaches user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'lifedrop_jwt_secret_change_this_in_production_2024'
    );

    // Fetch the user from DB (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found or account deleted',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token has expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed.',
    });
  }
};

/**
 * authorize - Role-based access control middleware factory.
 * Use AFTER protect middleware.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user context found.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not permitted for this action. Required: [${roles.join(', ')}]`,
      });
    }

    // For hospitals: check that they are verified/approved before accessing protected hospital routes
    if (req.user.role === 'hospital' && req.user.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: `Hospital account is ${req.user.verificationStatus}. Please wait for admin approval before accessing this feature.`,
        verificationStatus: req.user.verificationStatus,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
