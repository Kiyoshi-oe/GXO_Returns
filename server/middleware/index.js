// LVS Returns - Middleware Index
// ============================================

const { notFoundHandler, errorHandler, asyncHandler } = require('./errorHandler');
const { requireAuth, requirePermission, requireRole, requireAdminOrManager, requireAdmin, optionalAuth } = require('./auth');

module.exports = {
  // Error Handling
  notFoundHandler,
  errorHandler,
  asyncHandler,
  
  // Authentication & Authorization
  requireAuth,
  requirePermission,
  requireRole,
  requireAdminOrManager,
  requireAdmin,
  optionalAuth
};
