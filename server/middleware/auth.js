// LVS Returns - Authentication & Authorization Middleware
// ============================================

const { getDb } = require('../database');

/**
 * Middleware: Benutzer-Authentifizierung prüfen
 * Erwartet Username im Header 'x-username' oder in der Session
 */
function requireAuth(req, res, next) {
  try {
    // Username aus Header oder Session holen
    const username = req.headers['x-username'] || req.session?.username;
    
    if (!username) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Nicht authentifiziert',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const db = getDb();
    const user = db.prepare(`
      SELECT u.*, r.permissions, r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role = r.name
      WHERE u.username = ? AND u.is_active = 1
    `).get(username);
    
    if (!user) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Benutzer nicht gefunden oder inaktiv',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Parse permissions
    if (user.permissions && typeof user.permissions === 'string') {
      user.permissions = JSON.parse(user.permissions);
    }
    
    // Benutzer an Request anhängen
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    res.status(500).json({ 
      ok: false, 
      error: 'Authentifizierungsfehler',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware: Prüft ob Benutzer eine bestimmte Berechtigung hat
 * @param {string} module - Modul-Name (z.B. 'inbound', 'inventory')
 * @param {string} action - Aktion (z.B. 'read', 'write', 'delete', 'export')
 */
function requirePermission(module, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Nicht authentifiziert',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Admin hat immer alle Rechte
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Prüfe Berechtigung
    const permissions = req.user.permissions || {};
    const hasPermission = permissions[module]?.[action] === true;
    
    if (!hasPermission) {
      return res.status(403).json({ 
        ok: false, 
        error: `Keine Berechtigung für ${action} auf ${module}`,
        code: 'PERMISSION_DENIED',
        required: { module, action }
      });
    }
    
    next();
  };
}

/**
 * Middleware: Prüft ob Benutzer eine bestimmte Rolle hat
 * @param {string|string[]} roles - Rolle(n) die erlaubt sind
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Nicht authentifiziert',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = roles.flat(); // Flatten array für Flexibilität
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        ok: false, 
        error: `Rolle '${userRole}' nicht ausreichend`,
        code: 'ROLE_DENIED',
        required: allowedRoles
      });
    }
    
    next();
  };
}

/**
 * Middleware: Erlaubt nur Admins und Managern
 */
function requireAdminOrManager(req, res, next) {
  return requireRole('admin', 'manager')(req, res, next);
}

/**
 * Middleware: Erlaubt nur Admins
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Optional: Authentifizierung prüfen, aber nicht erzwingen
 * Fügt req.user hinzu wenn vorhanden, aber schlägt nicht fehl
 */
function optionalAuth(req, res, next) {
  try {
    const username = req.headers['x-username'] || req.session?.username;
    
    if (username) {
      const db = getDb();
      const user = db.prepare(`
        SELECT u.*, r.permissions, r.display_name as role_display_name
        FROM users u
        LEFT JOIN roles r ON u.role = r.name
        WHERE u.username = ? AND u.is_active = 1
      `).get(username);
      
      if (user) {
        if (user.permissions && typeof user.permissions === 'string') {
          user.permissions = JSON.parse(user.permissions);
        }
        req.user = user;
      }
    }
  } catch (err) {
    console.error('Optional Auth Error:', err);
  }
  
  next();
}

module.exports = {
  requireAuth,
  requirePermission,
  requireRole,
  requireAdminOrManager,
  requireAdmin,
  optionalAuth
};
