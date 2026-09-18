const express = require('express');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ACCOUNT_NUMBER_REGEX } = require('../utils/constants');
const controller = require('../controllers/adminController');

const router = express.Router();

// Every admin route requires a valid session AND the admin role.
router.use(auth, requireRole('admin'));

router.patch(
  '/accounts/:accountNumber/status',
  param('accountNumber').matches(ACCOUNT_NUMBER_REGEX).withMessage('Account number must be exactly 12 digits'),
  body('status').isIn(['ACTIVE', 'FROZEN']).withMessage("Status must be 'ACTIVE' or 'FROZEN'"),
  body('reason')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 280 })
    .withMessage('Reason must be at most 280 characters'),
  validate,
  controller.updateAccountStatus
);

router.get(
  '/transactions',
  query('status').optional().isIn(['PENDING', 'SUCCESS', 'FAILED']).withMessage('Invalid status filter'),
  query('accountNumber').optional().matches(ACCOUNT_NUMBER_REGEX).withMessage('Account number must be exactly 12 digits'),
  query('rangeType').optional().isIn(['week', 'month', 'all']).withMessage('Invalid date range'),
  query('search').optional().isString().isLength({ max: 128 }).withMessage('Search is too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate,
  controller.listAllTransactions
);

module.exports = router;
