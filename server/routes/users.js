// LVS Returns - User Management API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/users - Alle Benutzer abrufen
router.get('/', (req, res) => {
  try {
    const db = getDb();
    
    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role = r.name
      ORDER BY u.created_at DESC
    `).all();
    
    res.json(users);
  } catch (err) {
    console.error('Fehler beim Abrufen der Benutzer:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/users/by-username/:username - Benutzer nach Benutzernamen abrufen
router.get('/by-username/:username', (req, res) => {
  try {
    const db = getDb();
    const { username } = req.params;
    
    const user = db.prepare(`
      SELECT 
        u.*,
        r.display_name as role_display_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role = r.name
      WHERE u.username = ?
    `).get(username);
    
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Benutzer nicht gefunden' });
    }
    
    // Parse permissions
    if (user.permissions) {
      user.permissions = JSON.parse(user.permissions);
    }
    
    res.json(user);
  } catch (err) {
    console.error('Fehler beim Abrufen des Benutzers:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/users/:id - Einzelnen Benutzer abrufen
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const user = db.prepare(`
      SELECT 
        u.*,
        r.display_name as role_display_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role = r.name
      WHERE u.id = ?
    `).get(id);
    
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Benutzer nicht gefunden' });
    }
    
    // Parse permissions
    if (user.permissions) {
      user.permissions = JSON.parse(user.permissions);
    }
    
    res.json(user);
  } catch (err) {
    console.error('Fehler beim Abrufen des Benutzers:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/users - Neuen Benutzer erstellen
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { username, email, full_name, role = 'operator' } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Benutzername ist erforderlich' });
    }
    
    // Prüfe ob Benutzername bereits existiert
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(400).json({ ok: false, error: 'Benutzername existiert bereits' });
    }
    
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO users (username, email, full_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(username.trim(), email || null, full_name || null, role, now);
    
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Fehler beim Erstellen des Benutzers:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/users/:id - Benutzer aktualisieren
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { username, email, full_name, role, is_active } = req.body;
    
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Benutzer nicht gefunden' });
    }
    
    // Wenn Benutzername geändert wird, prüfen ob neuer Name bereits existiert
    if (username && username.trim() !== existing.username) {
      const duplicate = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
        .get(username.trim(), id);
      if (duplicate) {
        return res.status(400).json({ ok: false, error: 'Benutzername existiert bereits' });
      }
    }
    
    db.prepare(`
      UPDATE users 
      SET username = ?, email = ?, full_name = ?, role = ?, is_active = ?
      WHERE id = ?
    `).run(
      username ? username.trim() : existing.username,
      email !== undefined ? email : existing.email,
      full_name !== undefined ? full_name : existing.full_name,
      role !== undefined ? role : existing.role,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Benutzers:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/users/:id - Benutzer löschen
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Benutzer nicht gefunden' });
    }
    
    // Verhindere Löschen des letzten Admins
    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1").get().count;
      if (adminCount <= 1) {
        return res.status(400).json({ ok: false, error: 'Der letzte aktive Administrator kann nicht gelöscht werden' });
      }
    }
    
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Benutzers:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/users/roles - Alle Rollen abrufen
router.get('/roles/list', (req, res) => {
  try {
    const db = getDb();
    
    const roles = db.prepare(`
      SELECT id, name, display_name, description, permissions
      FROM roles
      ORDER BY 
        CASE name
          WHEN 'admin' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'operator' THEN 3
          ELSE 4
        END
    `).all();
    
    // Parse permissions
    roles.forEach(role => {
      if (role.permissions) {
        role.permissions = JSON.parse(role.permissions);
      }
    });
    
    res.json(roles);
  } catch (err) {
    console.error('Fehler beim Abrufen der Rollen:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/users/:id/audit-log - Audit Log für Benutzer
router.get('/:id/audit-log', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { limit = 100 } = req.query;
    
    const logs = db.prepare(`
      SELECT *
      FROM user_audit_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(id, parseInt(limit));
    
    res.json(logs);
  } catch (err) {
    console.error('Fehler beim Abrufen des Audit Logs:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/users/roles/:id - Einzelne Rolle abrufen
router.get('/roles/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const role = db.prepare(`
      SELECT *
      FROM roles
      WHERE id = ?
    `).get(id);
    
    if (!role) {
      return res.status(404).json({ ok: false, error: 'Rolle nicht gefunden' });
    }
    
    res.json(role);
  } catch (err) {
    console.error('Fehler beim Abrufen der Rolle:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /api/users/roles/:id/permissions - Rollen-Berechtigung aktualisieren
router.patch('/roles/:id/permissions', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { module, action, value } = req.body;
    
    // Lade aktuelle Rolle
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    if (!role) {
      return res.status(404).json({ ok: false, error: 'Rolle nicht gefunden' });
    }
    
    // Parse permissions
    const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    
    // Update permission
    if (!permissions[module]) {
      permissions[module] = {};
    }
    permissions[module][action] = value;
    
    // Speichere aktualisierte Berechtigungen
    db.prepare(`
      UPDATE roles
      SET permissions = ?
      WHERE id = ?
    `).run(JSON.stringify(permissions), id);
    
    res.json({ ok: true, message: 'Berechtigung aktualisiert' });
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Berechtigung:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
