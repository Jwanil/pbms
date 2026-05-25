const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access token missing or malformed', 401, [], 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, email, role_id }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token has expired', 401, [], 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid access token', 401, [], 'INVALID_TOKEN');
  }
};

module.exports = { verifyToken };
