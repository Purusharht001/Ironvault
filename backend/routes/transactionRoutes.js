const express = require('express');
const { query } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const controller = require('../controllers/transactionController');

const router = express.Router();

router.use(auth);

router.get(
  '/',
  query('status').optional().isIn(['PENDING', 'SUCCESS', 'FAILED']).withMessage('Invalid status filter'),
  query('type').optional().isIn(['SEND', 'RECEIVE']).withMessage('Invalid type filter'),
  query('rangeType').optional().isIn(['week', 'month', 'all']).withMessage('Invalid date range'),
  query('search').optional().isString().isLength({ max: 128 }).withMessage('Search is too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate,
  controller.listTransactions
);

router.get('/:id', controller.getTransaction);

module.exports = router;
