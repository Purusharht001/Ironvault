const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains and turns failures into a single 400 response.
 */
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({
    success: false,
    code: 'VALIDATION_ERROR',
    message: errors[0].message,
    errors,
  });
};
