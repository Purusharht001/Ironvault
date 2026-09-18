const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const controller = require('../controllers/authController');

const router = express.Router();

const email = body('email').isString().trim().toLowerCase().isEmail().withMessage('Please enter a valid email');
const password = (field) =>
  body(field)
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters');

router.post(
  '/signup',
  authLimiter,
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 32 })
    .withMessage('Username must be between 3 and 32 characters')
    .matches(/^[A-Za-z0-9_.-]+$/)
    .withMessage('Username may only contain letters, numbers, dots, dashes and underscores'),
  email,
  password('password'),
  validate,
  controller.signup
);

router.post(
  '/signin',
  authLimiter,
  email,
  body('password').isString().notEmpty().withMessage('Password is required'),
  validate,
  controller.signin
);

router.get('/me', auth, controller.me);

router.post('/logout-all', auth, controller.logoutAll);

router.post(
  '/change-password',
  authLimiter,
  auth,
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  password('newPassword'),
  body('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must differ from the current one'),
  validate,
  controller.changePassword
);

module.exports = router;
