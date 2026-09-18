/**
 * Allows the request through only if the authenticated user has one of `allowedRoles`.
 * Must run after the `auth` middleware, which sets `req.user.role` from the database.
 *
 *   router.use(auth, requireRole('admin'));
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied: insufficient permissions',
    });
  }
  return next();
};

module.exports = { requireRole };
