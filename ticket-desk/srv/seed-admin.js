// Run once with: node srv/seed-admin.js
// Creates username: admin / password: admin123 with role ADMIN.
const cds = require('@sap/cds');
const { randomUUID } = require('crypto');
const { hashPassword } = require('./lib/auth');

async function main() {
  const db = await cds.connect.to('db');

  const existing = await db.run(
    SELECT.one.from('ticketdesk.Users').where({ username: 'admin' })
  );
  if (existing) {
    console.log('Admin account already exists — nothing to do.');
    return;
  }

  const passwordHash = await hashPassword('admin123');
  await db.run(
    INSERT.into('ticketdesk.Users').entries({
      ID: randomUUID(),
      username: 'admin',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    })
  );

  console.log('Admin account created — username: admin, password: admin123');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });