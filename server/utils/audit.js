// LVS Returns - Audit Trail Utility
// ============================================

const { getDb } = require('../database');

/**
 * Loggt eine Benutzeraktion im Audit Trail
 * @param {number} userId - Benutzer-ID
 * @param {string} action - Aktion (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
 * @param {string} entityType - Typ der Entität (inbound, location, user, etc.)
 * @param {number|null} entityId - ID der Entität
 * @param {object|null} oldValue - Alter Wert (vor Änderung)
 * @param {object|null} newValue - Neuer Wert (nach Änderung)
 * @param {string|null} ipAddress - IP-Adresse des Benutzers
 */
function logAudit(userId, action, entityType, entityId = null, oldValue = null, newValue = null, ipAddress = null) {
  try {
    const db = getDb();
    
    db.prepare(`
      INSERT INTO user_audit_log (
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        old_value, 
        new_value, 
        ip_address, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      new Date().toISOString()
    );
    
    return true;
  } catch (err) {
    console.error('❌ Audit Log Fehler:', err);
    // Nicht fehlschlagen, nur loggen
    return false;
  }
}

/**
 * Middleware: Automatisches Audit-Logging für Änderungen
 * Fügt eine logChange Funktion zu req hinzu
 */
function auditMiddleware(req, res, next) {
  req.logChange = (action, entityType, entityId, oldValue, newValue) => {
    if (req.user && req.user.id) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      logAudit(req.user.id, action, entityType, entityId, oldValue, newValue, ipAddress);
    }
  };
  
  next();
}

/**
 * Loggt einen Login-Versuch
 */
function logLogin(userId, username, success, ipAddress, reason = null) {
  try {
    const db = getDb();
    
    db.prepare(`
      INSERT INTO user_audit_log (
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        old_value, 
        new_value, 
        ip_address, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      'user',
      userId || null,
      null,
      JSON.stringify({ username, success, reason }),
      ipAddress,
      new Date().toISOString()
    );
    
    // Update last_login bei Erfolg
    if (success && userId) {
      db.prepare(`
        UPDATE users 
        SET last_login = ? 
        WHERE id = ?
      `).run(new Date().toISOString(), userId);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Login Audit Fehler:', err);
    return false;
  }
}

/**
 * Loggt einen Logout
 */
function logLogout(userId, username, ipAddress) {
  try {
    const db = getDb();
    
    db.prepare(`
      INSERT INTO user_audit_log (
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        new_value, 
        ip_address, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'LOGOUT',
      'user',
      userId,
      JSON.stringify({ username }),
      ipAddress,
      new Date().toISOString()
    );
    
    return true;
  } catch (err) {
    console.error('❌ Logout Audit Fehler:', err);
    return false;
  }
}

/**
 * Ruft Audit-Log-Einträge ab
 * @param {object} filters - Filter-Optionen
 * @param {number} filters.userId - Benutzer-ID
 * @param {string} filters.action - Aktion
 * @param {string} filters.entityType - Entitäts-Typ
 * @param {string} filters.startDate - Start-Datum
 * @param {string} filters.endDate - End-Datum
 * @param {number} filters.limit - Anzahl der Einträge
 */
function getAuditLog(filters = {}) {
  try {
    const db = getDb();
    
    let sql = `
      SELECT 
        a.*,
        u.username,
        u.full_name
      FROM user_audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.userId) {
      sql += ` AND a.user_id = ?`;
      params.push(filters.userId);
    }
    
    if (filters.action) {
      sql += ` AND a.action = ?`;
      params.push(filters.action);
    }
    
    if (filters.entityType) {
      sql += ` AND a.entity_type = ?`;
      params.push(filters.entityType);
    }
    
    if (filters.startDate) {
      sql += ` AND a.created_at >= ?`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      sql += ` AND a.created_at <= ?`;
      params.push(filters.endDate);
    }
    
    sql += ` ORDER BY a.created_at DESC`;
    
    if (filters.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }
    
    return db.prepare(sql).all(...params);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen des Audit Logs:', err);
    return [];
  }
}

/**
 * Statistiken für Audit-Log
 */
function getAuditStats(filters = {}) {
  try {
    const db = getDb();
    
    let sql = `
      SELECT 
        action,
        entity_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM user_audit_log
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.startDate) {
      sql += ` AND created_at >= ?`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      sql += ` AND created_at <= ?`;
      params.push(filters.endDate);
    }
    
    sql += ` GROUP BY action, entity_type, DATE(created_at)`;
    sql += ` ORDER BY created_at DESC`;
    
    return db.prepare(sql).all(...params);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Audit-Statistiken:', err);
    return [];
  }
}

module.exports = {
  logAudit,
  auditMiddleware,
  logLogin,
  logLogout,
  getAuditLog,
  getAuditStats
};
