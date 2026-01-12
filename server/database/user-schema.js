// LVS Returns - User Management Schema
// ============================================

const { getDb } = require('./connection');

/**
 * Erstellt Benutzer- und Rechteverwaltungs-Tabellen
 */
function createUserTables() {
  const db = getDb();
  
  db.exec(`
    -- Benutzer
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password_hash TEXT,
      full_name TEXT,
      role TEXT DEFAULT 'operator',
      custom_permissions TEXT, -- JSON für benutzerspezifische Berechtigungen
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT,
      created_by TEXT
    );

    -- Rollen
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at TEXT
    );

    -- Zugriffs-Anfragen
    CREATE TABLE IF NOT EXISTS access_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      requested_role TEXT DEFAULT 'operator',
      reviewed_by INTEGER,
      reviewed_at TEXT,
      review_notes TEXT,
      created_at TEXT,
      FOREIGN KEY(reviewed_by) REFERENCES users(id)
    );

    -- Benutzer-Sessions
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT,
      expires_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Audit Log für Benutzeraktionen
    CREATE TABLE IF NOT EXISTS user_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  
  console.log('✅ Benutzer-Tabellen erstellt');
}

/**
 * Fügt Standard-Rollen hinzu
 */
function seedRoles() {
  const db = getDb();
  const now = new Date().toISOString();
  
  const roles = [
    {
      name: 'admin',
      display_name: 'Administrator',
      description: 'Vollzugriff auf alle Funktionen',
      permissions: JSON.stringify({
        dashboard: { read: true, write: true, delete: true, export: true },
        inbound: { read: true, write: true, delete: true, export: true },
        inventory: { read: true, write: true, delete: true, export: true },
        movement: { read: true, write: true, delete: true, export: true },
        archive: { read: true, write: true, delete: true, export: true },
        settings: { read: true, write: true, delete: true, export: true },
        users: { read: true, write: true, delete: true, export: true, approve_requests: true },
        reports: { read: true, write: true, delete: true, export: true },
        audit: { read: true, write: false, delete: false, export: true },
        backup: { read: true, write: true, delete: true, export: true },
        system: { read: true, write: true, delete: true, export: true },
        warehouse_map: { read: true, write: true, delete: false, export: true }
      })
    },
    {
      name: 'manager',
      display_name: 'Manager',
      description: 'Erweiterte Rechte mit Genehmigungsbefugnis',
      permissions: JSON.stringify({
        dashboard: { read: true, write: true, delete: false, export: true },
        inbound: { read: true, write: true, delete: true, export: true },
        inventory: { read: true, write: true, delete: true, export: true },
        movement: { read: true, write: true, delete: true, export: true },
        archive: { read: true, write: false, delete: false, export: true },
        settings: { read: true, write: false, delete: false, export: false },
        users: { read: true, write: false, delete: false, export: true, approve_requests: true },
        reports: { read: true, write: true, delete: false, export: true },
        audit: { read: true, write: false, delete: false, export: true },
        backup: { read: true, write: false, delete: false, export: true },
        system: { read: true, write: false, delete: false, export: false },
        warehouse_map: { read: true, write: false, delete: false, export: true }
      })
    },
    {
      name: 'teamlead',
      display_name: 'Teamlead',
      description: 'Team-Management und Überwachung',
      permissions: JSON.stringify({
        dashboard: { read: true, write: true, delete: false, export: true },
        inbound: { read: true, write: true, delete: false, export: true },
        inventory: { read: true, write: true, delete: false, export: true },
        movement: { read: true, write: true, delete: false, export: true },
        archive: { read: true, write: false, delete: false, export: true },
        settings: { read: true, write: false, delete: false, export: false },
        users: { read: true, write: false, delete: false, export: false, approve_requests: false },
        reports: { read: true, write: true, delete: false, export: true },
        audit: { read: true, write: false, delete: false, export: false },
        backup: { read: false, write: false, delete: false, export: false },
        system: { read: true, write: false, delete: false, export: false },
        warehouse_map: { read: true, write: false, delete: false, export: true }
      })
    },
    {
      name: 'process_assistant',
      display_name: 'Process Assistant',
      description: 'Prozessunterstützung und Datenerfassung',
      permissions: JSON.stringify({
        dashboard: { read: true, write: false, delete: false, export: false },
        inbound: { read: true, write: true, delete: false, export: true },
        inventory: { read: true, write: true, delete: false, export: true },
        movement: { read: true, write: true, delete: false, export: true },
        archive: { read: true, write: false, delete: false, export: false },
        settings: { read: false, write: false, delete: false, export: false },
        users: { read: false, write: false, delete: false, export: false, approve_requests: false },
        reports: { read: true, write: false, delete: false, export: true },
        audit: { read: false, write: false, delete: false, export: false },
        backup: { read: false, write: false, delete: false, export: false },
        system: { read: false, write: false, delete: false, export: false },
        warehouse_map: { read: true, write: false, delete: false, export: false }
      })
    },
    {
      name: 'trainer',
      display_name: 'Trainer',
      description: 'Schulung und Anleitung, Lesezugriff auf alle Module',
      permissions: JSON.stringify({
        dashboard: { read: true, write: false, delete: false, export: true },
        inbound: { read: true, write: true, delete: false, export: true },
        inventory: { read: true, write: false, delete: false, export: true },
        movement: { read: true, write: true, delete: false, export: true },
        archive: { read: true, write: false, delete: false, export: true },
        settings: { read: true, write: false, delete: false, export: false },
        users: { read: true, write: false, delete: false, export: false, approve_requests: false },
        reports: { read: true, write: false, delete: false, export: true },
        audit: { read: true, write: false, delete: false, export: false },
        backup: { read: false, write: false, delete: false, export: false },
        system: { read: true, write: false, delete: false, export: false },
        warehouse_map: { read: true, write: false, delete: false, export: true }
      })
    },
    {
      name: 'operator',
      display_name: 'Operator',
      description: 'Basis-Zugriff für tägliche Operationen',
      permissions: JSON.stringify({
        dashboard: { read: true, write: false, delete: false, export: false },
        inbound: { read: true, write: true, delete: false, export: false },
        inventory: { read: true, write: false, delete: false, export: false },
        movement: { read: true, write: true, delete: false, export: false },
        archive: { read: true, write: false, delete: false, export: false },
        settings: { read: false, write: false, delete: false, export: false },
        users: { read: false, write: false, delete: false, export: false, approve_requests: false },
        reports: { read: true, write: false, delete: false, export: false },
        audit: { read: false, write: false, delete: false, export: false },
        backup: { read: false, write: false, delete: false, export: false },
        system: { read: false, write: false, delete: false, export: false },
        warehouse_map: { read: true, write: false, delete: false, export: false }
      })
    },
    {
      name: 'levis',
      display_name: 'Levis',
      description: 'Zugriff nur auf RA Import für RA-Nummern-Verwaltung',
      permissions: JSON.stringify({
        dashboard: { read: false, write: false, delete: false, export: false },
        inbound: { read: false, write: false, delete: false, export: false },
        inventory: { read: false, write: false, delete: false, export: false },
        movement: { read: false, write: false, delete: false, export: false },
        archive: { read: false, write: false, delete: false, export: false },
        settings: { read: false, write: false, delete: false, export: false },
        users: { read: false, write: false, delete: false, export: false, approve_requests: false },
        reports: { read: false, write: false, delete: false, export: false },
        audit: { read: false, write: false, delete: false, export: false },
        backup: { read: false, write: false, delete: false, export: false },
        system: { read: false, write: false, delete: false, export: false },
        warehouse_map: { read: false, write: false, delete: false, export: false },
        ra_import: { read: true, write: true, delete: false, export: true }
      })
    }
  ];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO roles (name, display_name, description, permissions, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  roles.forEach(role => {
    stmt.run(role.name, role.display_name, role.description, role.permissions, now);
  });
  
  console.log('✅ Standard-Rollen hinzugefügt (7 Rollen: Admin, Manager, Teamlead, Process Assistant, Trainer, Operator, Levis)');
}

/**
 * Fügt Standard-Admin-Benutzer hinzu
 */
function seedDefaultUser() {
  const db = getDb();
  const now = new Date().toISOString();
  
  // Prüfe ob bereits Benutzer existieren
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount === 0) {
    // Erstelle Standard-Admin "paypa" mit höchsten Rechten
    db.prepare(`
      INSERT INTO users (username, email, full_name, role, is_active, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('paypa', 'paypa@gxo.com', 'PayPa Administrator', 'admin', 1, now, 'system');
    
    console.log('✅ Standard-Admin-Benutzer erstellt (username: paypa, role: admin)');
  } else {
    // Prüfe ob paypa bereits existiert, wenn nicht erstelle ihn
    const paypaUser = db.prepare('SELECT * FROM users WHERE username = ?').get('paypa');
    
    if (!paypaUser) {
      db.prepare(`
        INSERT INTO users (username, email, full_name, role, is_active, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('paypa', 'paypa@gxo.com', 'PayPa Administrator', 'admin', 1, now, 'system');
      
      console.log('✅ Admin-Benutzer "paypa" hinzugefügt');
    } else if (paypaUser.role !== 'admin') {
      // Stelle sicher dass paypa Admin ist
      db.prepare('UPDATE users SET role = ?, is_active = 1 WHERE username = ?').run('admin', 'paypa');
      console.log('✅ Benutzer "paypa" auf Admin-Rolle gesetzt');
    }
  }
}

module.exports = {
  createUserTables,
  seedRoles,
  seedDefaultUser
};
