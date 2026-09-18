const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { transferLimiter } = require('../middleware/rateLimit');
const { ACCOUNT_NUMBER_REGEX, MAX_TRANSFER_AMOUNT_CENTS } = require('../utils/constants');
const controller = require('../controllers/transferController');

const router = express.Router();

router.post(
  '/',
  auth,
  transferLimiter,
  body('toAccountNumber')
    .isString()
    .withMessage('Recipient account number is required')
    .trim()
    .matches(ACCOUNT_NUMBER_REGEX)
    .withMessage('Recipient account number must be exactly 12 digits'),
  // Must be a JSON integer, not a numeric string or a float: money is integer cents end to end.
  body('amountCents')
    .custom((v) => Number.isSafeInteger(v) && v >= 1 && v <= MAX_TRANSFER_AMOUNT_CENTS)
    .withMessage(`Amount must be a whole number of cents between 1 and ${MAX_TRANSFER_AMOUNT_CENTS}`),
  body('referenceId')
    .isString()
    .withMessage('Reference ID (idempotency key) is required')
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage('Reference ID must be between 8 and 128 characters')
    .matches(/^[A-Za-z0-9_.:-]+$/)
    .withMessage('Reference ID may only contain letters, numbers and _ . : -'),
  body('note')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 140 })
    .withMessage('Note must be at most 140 characters'),
  validate,
  controller.createTransfer
);

module.exports = router;
