const cds = require('@sap/cds');
const cors = require('cors');
const { verifyToken } = require('./lib/auth');

cds.on('bootstrap', (app) => {
  app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Decodes the JWT if present and attaches it to req.user.
  // Doesn't block unauthenticated requests here — individual service
  // handlers decide what needs a logged-in user (see srv/service.js).
  app.use((req, res, next) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        req.user = verifyToken(header.slice(7));
      } catch (err) {
        // invalid/expired token — leave req.user undefined
      }
    }
    next();
  });
});

module.exports = cds.server;
