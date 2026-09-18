const User = require('../models/User');
const { createUserWithAccount } = require('../services/userService');

const DEMO_PASSWORD = 'Password123!';
const ADMIN_PASSWORD = 'AdminPassword123!';

const DEMO_USERS = [
  { username: 'alice', email: 'alice@example.com', password: DEMO_PASSWORD },
  { username: 'bob', email: 'bob@example.com', password: DEMO_PASSWORD },
  // Bank operations / compliance. Starts with no money: it is a staff login, not a customer.
  { username: 'admin', email: 'admin@ironvault.com', password: ADMIN_PASSWORD, role: 'admin', openingBalanceCents: 0 },
];

/**
 * Creates any demo users that don't exist yet. Existing users are left untouched; in
 * particular an existing admin@ironvault.com that is NOT an admin is never promoted, since
 * anyone could have registered that email through public signup.
 */
const seedDemoUsers = async (log = console.log) => {
  for (const demo of DEMO_USERS) {
    const role = demo.role || 'user';
    const existing = await User.findOne({ email: demo.email });
    if (existing) {
      if (existing.role !== role) {
        log(`⚠ ${demo.email} exists with role '${existing.role}', expected '${role}'. Left unchanged.`);
      } else {
        log(`• ${demo.email} already exists (${role}, account ${existing.accountNumber})`);
      }
      continue;
    }
    const user = await createUserWithAccount(demo);
    log(`✓ Created ${demo.email.padEnd(20)} ${role.padEnd(5)} account ${user.accountNumber}  password ${demo.password}`);
  }
  log('\n⚠ Change the admin password before using this database for anything real.');
};

module.exports = { seedDemoUsers, DEMO_USERS };
