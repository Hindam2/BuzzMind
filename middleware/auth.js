const User = require('../models/User');
const jwt = require('jsonwebtoken');
// Middleware to authenticate JWT (JSON Web Tokens) tokens so no user can post or get data without a valid token. This is used for API routes that require authentication.
// gonna use this for the API routes that require authentication, like creating a post or getting user info, this will check if the token is valid and attach the user info to the request object for further use in the route handlers.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);// Verify token and decode user info, VERIFY() FOR CHECKING IF TOKEN IS VALID AND NOT EXPIRED, sign() FOR CREATING A TOKEN
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
// Middleware to check if user is authenticated by checking session, this is used for page routes that require authentication.
async function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    if (!req.user) {
      req.user = await User.findById(req.session.userId).select('-Password');
    }
    if (!req.user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
// Middleware to check if user has required role for certain routes, this is used for API routes that require specific roles like admin or editor.
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.session.role || req.user?.Role;
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
// Middleware to check if user is authenticated and has required role for certain page routes, this is used for page routes that require specific roles like admin or editor.
function requirePageAuth(role) {
  return (req, res, next) => {
    if (!req.session.userId) return res.redirect('/');
    if (role && req.session.role !== role) return res.redirect('/');
    next();
  };
}

module.exports = { requireAuth, requireRole, requirePageAuth, authenticateToken };
