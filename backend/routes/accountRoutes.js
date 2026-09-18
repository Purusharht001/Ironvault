const express = require('express');
const { param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ACCOUNT_NUMBER_REGEX } = require('../utils/constants');
const controller = require('../controllers/accountController');

const router = express.Router();

router.use(auth);

router.get('/', controller.getAccount);
router.get('/balance', controller.getBalance);
router.get('/stats', controller.getStats);
router.get('/activity', controller.getActivity);
router.get(
  '/lookup/:accountNumber',
  param('accountNumber').matches(ACCOUNT_NUMBER_REGEX).withMessage('Account number must be exactly 12 digits'),
  validate,
  controller.lookupAccount
);

module.exports = router;
