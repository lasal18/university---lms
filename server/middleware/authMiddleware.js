const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token, exclude password
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to authorize specific roles (e.g. lecturer, instructor, admin)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }
    
    const userRole = req.user.role;
    const allowedRoles = [...roles];
    if (roles.includes('lecturer') && !allowedRoles.includes('instructor')) {
      allowedRoles.push('instructor');
    }
    if (roles.includes('instructor') && !allowedRoles.includes('lecturer')) {
      allowedRoles.push('lecturer');
    }
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `User role '${userRole}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
