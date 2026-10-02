const cds = require('@sap/cds');
const { randomUUID } = require('crypto');
const { hashPassword, comparePassword, signToken } = require('./lib/auth');

module.exports = cds.service.impl(async function () {
  const { Tickets } = this.entities;

  // Populated by the JWT-check middleware in srv/server.js
  const currentUser = (req) => req.http?.req?.user;

  // ---------- Auth ----------

  this.on('register', async (req) => {
    const { username, password, name } = req.data;
    if (!username || !password) req.reject(400, 'Username and password are required');

    const existing = await SELECT.one.from('ticketdesk.Users').where({ username });
    if (existing) req.reject(409, 'That username is already taken');

    const passwordHash = await hashPassword(password);
    const user = { ID: randomUUID(), username, passwordHash, name, role: 'USER' };
    await INSERT.into('ticketdesk.Users').entries(user);

    const token = signToken({ ID: user.ID, username, role: 'USER' });
    return { token, user: { ID: user.ID, username, name, role: 'USER' } };
  });

  this.on('login', async (req) => {
    const { username, password } = req.data;
    const user = await SELECT.one.from('ticketdesk.Users').where({ username });
    if (!user) req.reject(401, 'Invalid username or password');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) req.reject(401, 'Invalid username or password');

    const token = signToken({ ID: user.ID, username: user.username, role: user.role });
    return {
      token,
      user: { ID: user.ID, username: user.username, name: user.name, role: user.role },
    };
  });

  // ---------- Ticket visibility & creation ----------

  this.before('READ', 'Tickets', (req) => {
    const user = currentUser(req);
    if (!user) req.reject(401, 'Login required');
    if (user.role !== 'ADMIN') {
      req.query.where({ raisedBy_ID: user.ID });
    }
  });

  this.before('CREATE', 'Tickets', (req) => {
    const user = currentUser(req);
    if (!user) req.reject(401, 'Login required');
    if (!req.data.title) req.reject(400, 'Title is required');
    req.data.raisedBy_ID = user.ID;
    req.data.status = 'PENDING';
  });

  // ---------- Admin workflow actions ----------

  this.on('approveTicket', async (req) => {
    const user = currentUser(req);
    if (user?.role !== 'ADMIN') req.reject(403, 'Admin only');
    const { ID, comment } = req.data;
    await UPDATE(Tickets, ID).with({ status: 'APPROVED', adminComment: comment });
    return SELECT.one.from(Tickets).where({ ID });
  });

  this.on('rejectTicket', async (req) => {
    const user = currentUser(req);
    if (user?.role !== 'ADMIN') req.reject(403, 'Admin only');
    const { ID, comment } = req.data;
    await UPDATE(Tickets, ID).with({ status: 'REJECTED', adminComment: comment });
    return SELECT.one.from(Tickets).where({ ID });
  });

  this.on('requestRevision', async (req) => {
    const user = currentUser(req);
    if (user?.role !== 'ADMIN') req.reject(403, 'Admin only');
    const { ID, comment } = req.data;
    await UPDATE(Tickets, ID).with({ status: 'REVISION_REQUESTED', adminComment: comment });
    return SELECT.one.from(Tickets).where({ ID });
  });

  // ---------- User resubmission ----------

  this.on('resubmitTicket', async (req) => {
    const user = currentUser(req);
    if (!user) req.reject(401, 'Login required');

    const ticket = await SELECT.one.from(Tickets).where({ ID: req.data.ID });
    if (!ticket || ticket.raisedBy_ID !== user.ID) req.reject(403, 'Not your ticket');

    await UPDATE(Tickets, req.data.ID).with({
      status: 'PENDING',
      description: req.data.description,
    });
    return SELECT.one.from(Tickets).where({ ID: req.data.ID });
  });
});