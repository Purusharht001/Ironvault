/**
 * An error that is safe to show to the client. Anything else becomes a generic 500.
 */
class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

module.exports = AppError;
