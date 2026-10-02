const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Demo-only secret. For anything beyond a local demo, move this to an
// environment variable and never commit it.
const JWT_SECRET = 'ticket-desk-demo-secret-change-me';

module.exports = {
  JWT_SECRET,
  hashPassword: (plain) => bcrypt.hash(plain, 10),
  comparePassword: (plain, hash) => bcrypt.compare(plain, hash),
  signToken: (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }),
  verifyToken: (token) => jwt.verify(token, JWT_SECRET),
};
