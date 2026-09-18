const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { isDuplicateKeyError } = require('../utils/mongoErrors');
const { BCRYPT_ROUNDS, OPENING_BALANCE_CENTS } = require('../config/env');
const { TREASURY_ACCOUNT_NUMBER } = require('../utils/constants');

// '88' prefix + 10 random digits = 12-digit account number.
const randomAccountNumber = () => '88' + crypto.randomInt(0, 10_000_000_000).toString().padStart(10, '0');

const generateUniqueAccountNumber = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = randomAccountNumber();
    if (!(await Account.exists({ accountNumber: candidate }))) return candidate;
  }
  throw new AppError(503, 'Could not allocate an account number. Please retry', 'ACCOUNT_NUMBER_EXHAUSTED');
};

const assertUnique = async (username, email) => {
  const [emailTaken, usernameTaken] = await Promise.all([
    User.exists({ email: email.toLowerCase() }),
    User.exists({ username }),
  ]);
  if (emailTaken) throw new AppError(409, 'Email already registered', 'EMAIL_ALREADY_EXISTS');
  if (usernameTaken) throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
};

/**
 * Creates the user, their account and the opening-deposit ledger entry atomically,
 * so there is never a user without an account or a balance without a ledger entry.
 *
 * `role` and `openingBalanceCents` are for trusted callers (seed scripts, tests) only:
 * the public signup controller never forwards them from the request body.
 */
const createUserWithAccount = async ({
  username,
  email,
  password,
  role = 'user',
  openingBalanceCents = OPENING_BALANCE_CENTS,
}) => {
  await assertUnique(username, email);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const accountNumber = await generateUniqueAccountNumber();

  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      [user] = await User.create([{ username, email, passwordHash, accountNumber, role }], { session });
      await Account.create([{ userId: user._id, accountNumber, balanceCents: openingBalanceCents }], { session });
      if (openingBalanceCents > 0) {
        await Transaction.create(
          [
            {
              referenceId: `opening-${accountNumber}`,
              kind: 'OPENING_DEPOSIT',
              senderAccountNumber: TREASURY_ACCOUNT_NUMBER,
              receiverAccountNumber: accountNumber,
              amountCents: openingBalanceCents,
              status: 'SUCCESS',
              note: 'Welcome to IronVault — opening deposit',
            },
          ],
          { session }
        );
      }
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      // Lost a race with a concurrent signup using the same email/username.
      await assertUnique(username, email);
      throw new AppError(409, 'Account already exists', 'DUPLICATE');
    }
    throw err;
  } finally {
    await session.endSession();
  }
  return user;
};

module.exports = { createUserWithAccount, randomAccountNumber };
