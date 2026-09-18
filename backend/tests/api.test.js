process.env.NODE_ENV = 'test';
process.env.BCRYPT_ROUNDS = '4';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const connectDB = require('../config/db');
const app = require('../app');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { createUserWithAccount } = require('../services/userService');

let replSet;

const signup = async (username) => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ username, email: `${username}@example.com`, password: 'Password123!' });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { token: res.body.token, user: res.body.user };
};

const authed = (token) => ({
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
});

const balanceOf = async (token) => (await authed(token).get('/api/account/balance')).body.balanceCents;

let refCounter = 0;
const newRef = () => `test-ref-${Date.now()}-${(refCounter += 1)}`;

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await connectDB(replSet.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

describe('auth', () => {
  it('signs up with a 12-digit account number and $1,000 opening balance', async () => {
    const { token, user } = await signup('carol');
    assert.match(user.accountNumber, /^88\d{10}$/);
    assert.equal(await balanceOf(token), 100000);

    const account = (await authed(token).get('/api/account')).body;
    assert.equal(account.accountNumber, user.accountNumber);
  });

  it('rejects duplicate email and username', async () => {
    await signup('dave');
    const dupEmail = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'dave2', email: 'DAVE@example.com', password: 'Password123!' });
    assert.equal(dupEmail.status, 409);
    assert.equal(dupEmail.body.code, 'EMAIL_ALREADY_EXISTS');

    const dupName = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'dave', email: 'other@example.com', password: 'Password123!' });
    assert.equal(dupName.body.code, 'USERNAME_TAKEN');
  });

  it('validates signup input', async () => {
    const res = await request(app).post('/api/auth/signup').send({ username: 'x', email: 'bad', password: '1' });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'VALIDATION_ERROR');
  });

  it('signs in, returns the profile from /me, and rejects bad passwords', async () => {
    await signup('erin');
    const ok = await request(app).post('/api/auth/signin').send({ email: 'erin@example.com', password: 'Password123!' });
    assert.equal(ok.status, 200);
    const me = await authed(ok.body.token).get('/api/auth/me');
    assert.equal(me.body.username, 'erin');
    assert.equal(me.body.passwordHash, undefined);

    const bad = await request(app).post('/api/auth/signin').send({ email: 'erin@example.com', password: 'wrong-pass' });
    assert.equal(bad.status, 401);
  });

  it('requires a token and revokes old tokens on logout-all', async () => {
    assert.equal((await request(app).get('/api/account')).status, 401);

    const { token } = await signup('frank');
    const res = await authed(token).post('/api/auth/logout-all');
    assert.equal(res.status, 200);
    assert.equal((await authed(token).get('/api/account')).status, 401);
    assert.equal((await authed(res.body.token).get('/api/account')).status, 200);
  });

  it('changes password and signs out other sessions', async () => {
    const { token } = await signup('gina');
    const wrong = await authed(token).post('/api/auth/change-password', {
      currentPassword: 'nope-nope',
      newPassword: 'NewPassword456!',
    });
    assert.equal(wrong.status, 400);

    const res = await authed(token).post('/api/auth/change-password', {
      currentPassword: 'Password123!',
      newPassword: 'NewPassword456!',
    });
    assert.equal(res.status, 200);
    assert.equal((await authed(token).get('/api/auth/me')).status, 401);
    const signin = await request(app).post('/api/auth/signin').send({ email: 'gina@example.com', password: 'NewPassword456!' });
    assert.equal(signin.status, 200);
  });
});

describe('transfers', () => {
  let alice;
  let bob;

  before(async () => {
    alice = await signup('alice');
    bob = await signup('bob');
  });

  it('moves money atomically between accounts', async () => {
    const res = await authed(bob.token).post('/api/transfers', {
      toAccountNumber: alice.user.accountNumber,
      amountCents: 5000,
      referenceId: newRef(),
      note: 'Lunch',
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.type, 'SEND');
    assert.equal(res.body.status, 'SUCCESS');
    assert.equal(res.body.counterparty.name, 'alice');
    assert.equal(res.body.balanceAfterCents, 95000);

    assert.equal(await balanceOf(bob.token), 95000);
    assert.equal(await balanceOf(alice.token), 105000);
  });

  it('replays the cached response for a repeated reference ID without debiting twice', async () => {
    const body = { toAccountNumber: alice.user.accountNumber, amountCents: 100, referenceId: newRef() };
    const before = await balanceOf(bob.token);

    const first = await authed(bob.token).post('/api/transfers', body);
    const second = await authed(bob.token).post('/api/transfers', body);
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(second.headers['idempotent-replayed'], 'true');
    assert.equal(second.body.id, first.body.id);
    assert.equal(await balanceOf(bob.token), before - 100);
  });

  it('processes concurrent duplicate requests exactly once', async () => {
    const body = { toAccountNumber: alice.user.accountNumber, amountCents: 250, referenceId: newRef() };
    const before = await balanceOf(bob.token);

    const results = await Promise.all(Array.from({ length: 5 }, () => authed(bob.token).post('/api/transfers', body)));
    for (const r of results) assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(new Set(results.map((r) => r.body.id)).size, 1);
    assert.equal(await balanceOf(bob.token), before - 250);
    assert.equal(await Transaction.countDocuments({ referenceId: body.referenceId }), 1);
  });

  it('never overdraws under concurrent transfers', async () => {
    const poor = await signup('poorpete');
    // 10 concurrent $200 transfers from a $1,000 account: exactly 5 can succeed.
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        authed(poor.token).post('/api/transfers', {
          toAccountNumber: alice.user.accountNumber,
          amountCents: 20000,
          referenceId: newRef(),
        })
      )
    );
    const succeeded = results.filter((r) => r.status === 201).length;
    const rejected = results.filter((r) => r.status === 422 && r.body.code === 'INSUFFICIENT_FUNDS').length;
    assert.equal(succeeded, 5);
    assert.equal(rejected, 5);
    assert.equal(await balanceOf(poor.token), 0);
  });

  it('rejects a reused reference ID with different parameters', async () => {
    const referenceId = newRef();
    await authed(bob.token).post('/api/transfers', { toAccountNumber: alice.user.accountNumber, amountCents: 10, referenceId });
    const res = await authed(bob.token).post('/api/transfers', {
      toAccountNumber: alice.user.accountNumber,
      amountCents: 99,
      referenceId,
    });
    assert.equal(res.status, 422);
    assert.equal(res.body.code, 'IDEMPOTENCY_KEY_REUSED');
  });

  it("does not leak another user's cached response for the same reference ID", async () => {
    const referenceId = newRef();
    await authed(bob.token).post('/api/transfers', { toAccountNumber: alice.user.accountNumber, amountCents: 10, referenceId });
    const res = await authed(alice.token).post('/api/transfers', {
      toAccountNumber: bob.user.accountNumber,
      amountCents: 10,
      referenceId,
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.transaction, undefined);
  });

  it('records insufficient funds as a FAILED ledger entry and leaves balances untouched', async () => {
    const before = await balanceOf(bob.token);
    const res = await authed(bob.token).post('/api/transfers', {
      toAccountNumber: alice.user.accountNumber,
      amountCents: 999999999,
      referenceId: newRef(),
    });
    assert.equal(res.status, 422);
    assert.equal(res.body.code, 'INSUFFICIENT_FUNDS');
    assert.equal(res.body.transaction.status, 'FAILED');
    assert.equal(await balanceOf(bob.token), before);

    // The failed attempt is visible to the sender but not to the would-be recipient.
    const bobFailed = await authed(bob.token).get('/api/transactions?status=FAILED');
    assert.ok(bobFailed.body.transactions.some((t) => t.id === res.body.transaction.id));
    const aliceFailed = await authed(alice.token).get('/api/transactions?status=FAILED');
    assert.equal(aliceFailed.body.total, 0);
  });

  it('rejects unknown recipients, self transfers, and non-integer amounts', async () => {
    const unknown = await authed(bob.token).post('/api/transfers', {
      toAccountNumber: '881234567890',
      amountCents: 100,
      referenceId: newRef(),
    });
    assert.equal(unknown.status, 404);
    assert.equal(unknown.body.code, 'RECIPIENT_NOT_FOUND');

    const self = await authed(bob.token).post('/api/transfers', {
      toAccountNumber: bob.user.accountNumber,
      amountCents: 100,
      referenceId: newRef(),
    });
    assert.equal(self.status, 400);
    assert.equal(self.body.code, 'SELF_TRANSFER');

    for (const amountCents of [10.5, '100', -5, 0]) {
      const res = await authed(bob.token).post('/api/transfers', {
        toAccountNumber: alice.user.accountNumber,
        amountCents,
        referenceId: newRef(),
      });
      assert.equal(res.status, 400, `amount ${JSON.stringify(amountCents)} should be rejected`);
    }
  });

  it('keeps total money constant (ledger balances)', async () => {
    const accounts = await Account.find().lean();
    const totalBalance = accounts.reduce((sum, a) => sum + a.balanceCents, 0);
    const [deposits] = await Transaction.aggregate([
      { $match: { kind: 'OPENING_DEPOSIT', status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } },
    ]);
    assert.equal(totalBalance, deposits.total);
  });

  it('blocks mutation of ledger entries', async () => {
    const txn = await Transaction.findOne();
    await assert.rejects(Transaction.updateOne({ _id: txn._id }, { amountCents: 1 }), /immutable/);
    await assert.rejects(Transaction.deleteOne({ _id: txn._id }), /immutable/);
    txn.amountCents = 1;
    await assert.rejects(txn.save(), /immutable/);
  });
});

describe('account and history', () => {
  let alice;
  let bob;

  before(async () => {
    alice = await signup('hana');
    bob = await signup('ivan');
    for (const amountCents of [1000, 2000, 3000]) {
      await authed(bob.token).post('/api/transfers', {
        toAccountNumber: alice.user.accountNumber,
        amountCents,
        referenceId: newRef(),
        note: `payment ${amountCents}`,
      });
    }
  });

  it('shows each side the right direction', async () => {
    const bobList = (await authed(bob.token).get('/api/transactions?type=SEND')).body;
    assert.equal(bobList.total, 3);
    assert.ok(bobList.transactions.every((t) => t.type === 'SEND'));

    const aliceList = (await authed(alice.token).get('/api/transactions')).body;
    assert.equal(aliceList.total, 4); // 3 transfers + opening deposit
    assert.ok(aliceList.transactions.every((t) => t.type === 'RECEIVE'));
    assert.equal(aliceList.transactions.at(-1).kind, 'OPENING_DEPOSIT');
  });

  it('paginates, searches, and fetches a single transaction', async () => {
    const page = (await authed(alice.token).get('/api/transactions?page=2&limit=2')).body;
    assert.equal(page.transactions.length, 2);
    assert.equal(page.totalPages, 2);

    const search = (await authed(alice.token).get('/api/transactions?search=payment%202000')).body;
    assert.equal(search.total, 1);
    assert.equal(search.transactions[0].amountCents, 2000);

    const one = await authed(alice.token).get(`/api/transactions/${search.transactions[0].id}`);
    assert.equal(one.status, 200);
    assert.equal(one.body.note, 'payment 2000');

    const outsider = await signup('mallory');
    assert.equal((await authed(outsider.token).get(`/api/transactions/${search.transactions[0].id}`)).status, 404);
  });

  it('computes monthly stats and daily activity', async () => {
    const stats = (await authed(bob.token).get('/api/account/stats')).body;
    assert.equal(stats.totalSentCents, 6000);
    assert.equal(stats.totalReceivedCents, 100000);
    assert.equal(stats.transferCount, 3);

    const activity = (await authed(bob.token).get('/api/account/activity?days=7')).body;
    assert.equal(activity.series.length, 7);
    assert.equal(activity.series.at(-1).sentCents, 6000);
  });

  it('looks up recipients by account number', async () => {
    const found = await authed(bob.token).get(`/api/account/lookup/${alice.user.accountNumber}`);
    assert.equal(found.body.name, 'hana');
    assert.equal(found.body.isSelf, false);
    assert.equal((await authed(bob.token).get('/api/account/lookup/881234567890')).status, 404);
    assert.equal((await authed(bob.token).get('/api/account/lookup/123')).status, 400);
  });
});

describe('RBAC and account freezes', () => {
  let admin;
  let customer;
  let other;

  const setStatus = (token, accountNumber, body) =>
    request(app).patch(`/api/admin/accounts/${accountNumber}/status`).set('Authorization', `Bearer ${token}`).send(body);

  before(async () => {
    await createUserWithAccount({
      username: 'opsadmin',
      email: 'ops@ironvault.com',
      password: 'AdminPassword123!',
      role: 'admin',
      openingBalanceCents: 0,
    });
    const res = await request(app).post('/api/auth/signin').send({ email: 'ops@ironvault.com', password: 'AdminPassword123!' });
    admin = { token: res.body.token, user: res.body.user };
    customer = await signup('customer1');
    other = await signup('customer2');
  });

  it('puts the role in the profile and the JWT, and ignores a role sent to signup', async () => {
    assert.equal(admin.user.role, 'admin');
    const claims = JSON.parse(Buffer.from(admin.token.split('.')[1], 'base64url').toString());
    assert.equal(claims.role, 'admin');

    const sneaky = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'sneaky', email: 'sneaky@example.com', password: 'Password123!', role: 'admin' });
    assert.equal(sneaky.status, 201);
    assert.equal(sneaky.body.user.role, 'user');
    assert.equal((await authed(sneaky.body.token).get('/api/admin/transactions')).status, 403);
  });

  it('returns 403 to non-admins and 401 to anonymous callers on admin routes', async () => {
    const list = await authed(customer.token).get('/api/admin/transactions');
    assert.equal(list.status, 403);
    assert.deepEqual(list.body, {
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied: insufficient permissions',
    });

    const freeze = await setStatus(customer.token, other.user.accountNumber, { status: 'FROZEN' });
    assert.equal(freeze.status, 403);
    assert.equal((await request(app).get('/api/admin/transactions')).status, 401);
  });

  it('lets an admin list every transaction in the bank, with filters', async () => {
    const res = await authed(admin.token).get('/api/admin/transactions?limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, await Transaction.countDocuments());
    assert.equal(res.body.transactions.length, 5);
    assert.ok(res.body.transactions[0].sender.accountNumber);
    assert.ok(res.body.transactions[0].receiver.accountNumber);

    const scoped = await authed(admin.token).get(`/api/admin/transactions?accountNumber=${customer.user.accountNumber}`);
    assert.equal(scoped.body.total, 1); // just the opening deposit
    assert.equal(scoped.body.transactions[0].receiver.name, 'customer1');
  });

  it('lets an admin freeze an account, with an audit trail', async () => {
    const res = await setStatus(admin.token, customer.user.accountNumber, { status: 'FROZEN', reason: 'KYC review' });
    assert.equal(res.status, 200);
    assert.equal(res.body.previousStatus, 'ACTIVE');
    assert.equal(res.body.account.status, 'FROZEN');
    assert.equal(res.body.account.statusReason, 'KYC review');
    assert.equal(res.body.account.statusUpdatedBy, admin.user.id);

    // The customer sees the status but not the compliance reason.
    const own = await authed(customer.token).get('/api/account');
    assert.equal(own.body.status, 'FROZEN');
    assert.equal(own.body.statusReason, undefined);
  });

  it('blocks transfers from a FROZEN account without moving money', async () => {
    const before = await balanceOf(customer.token);
    const res = await authed(customer.token).post('/api/transfers', {
      toAccountNumber: other.user.accountNumber,
      amountCents: 100,
      referenceId: newRef(),
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'ACCOUNT_FROZEN');
    assert.equal(res.body.message, 'Account is frozen. Transactions are disabled.');
    assert.equal(res.body.transaction.status, 'FAILED');
    assert.equal(await balanceOf(customer.token), before);
  });

  it('blocks transfers to a FROZEN account without moving money', async () => {
    const before = await balanceOf(other.token);
    const res = await authed(other.token).post('/api/transfers', {
      toAccountNumber: customer.user.accountNumber,
      amountCents: 100,
      referenceId: newRef(),
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'ACCOUNT_FROZEN');
    assert.equal(await balanceOf(other.token), before);
  });

  it('allows transfers again after the admin unfreezes the account', async () => {
    const res = await setStatus(admin.token, customer.user.accountNumber, { status: 'ACTIVE' });
    assert.equal(res.status, 200);
    assert.equal(res.body.account.statusReason, null);

    const transfer = await authed(customer.token).post('/api/transfers', {
      toAccountNumber: other.user.accountNumber,
      amountCents: 100,
      referenceId: newRef(),
    });
    assert.equal(transfer.status, 201);
  });

  it('validates status changes', async () => {
    assert.equal((await setStatus(admin.token, customer.user.accountNumber, { status: 'CLOSED' })).status, 400);
    assert.equal((await setStatus(admin.token, customer.user.accountNumber, {})).status, 400);
    assert.equal((await setStatus(admin.token, '881234567890', { status: 'FROZEN' })).status, 404);
    const self = await setStatus(admin.token, admin.user.accountNumber, { status: 'FROZEN' });
    assert.equal(self.status, 403);
    assert.equal(self.body.code, 'SELF_STATUS_CHANGE');
  });
});
