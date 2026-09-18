const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { createUserWithAccount } = require('../services/userService');
const { issueToken } = require('../services/tokenService');
const { BCRYPT_ROUNDS } = require('../config/env');

// Compared against when the email is unknown, so response timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('ironvault-timing-guard', 10);

const authResponse = (user) => ({ success: true, token: issueToken(user), user: user.toPublicJSON() });

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  const user = await createUserWithAccount({ username, email, password });
  res.status(201).json(authResponse(user));
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordOk) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  if (!user.isActive) {
    throw new AppError(403, 'This account has been disabled', 'ACCOUNT_DISABLED');
  }
  res.json(authResponse(user));
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
  res.json(user.toPublicJSON());
};

// Revokes every token issued so far and hands the current device a fresh one.
exports.logoutAll = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } }, { returnDocument: 'after' });
  res.json({ ...authResponse(user), message: 'Signed out of all other devices' });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Current password is incorrect', 'INVALID_CREDENTIALS');
  }
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.tokenVersion += 1;
  await user.save();
  res.json({ ...authResponse(user), message: 'Password updated. Other devices have been signed out' });
};
