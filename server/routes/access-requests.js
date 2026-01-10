// LVS Returns - Access Request API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/access-requests - Alle Zugriffs-Anfragen abrufen
router.get('/', (req, res) => {
  try {
    const db = getDb();
    
    const requests = db.prepare(`
      SELECT 
        ar.*,
        u.username as reviewed_by_username,
        u.full_name as reviewed_by_name
      FROM access_requests ar
      LEFT JOIN users u ON ar.reviewed_by = u.id
      ORDER BY 
        CASE ar.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        ar.created_at DESC
    `).all();
    
    res.json(requests);
  } catch (err) {
    console.error('Fehler beim Abrufen der Zugriffs-Anfragen:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/access-requests - Neue Zugriffs-Anfrage erstellen
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { username, email, full_name, reason, requested_role } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Benutzername ist erforderlich' });
    }
    
    // Prüfe ob Benutzername bereits existiert
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existingUser) {
      return res.status(400).json({ ok: false, error: 'Benutzername existiert bereits' });
    }
    
    // Prüfe ob bereits eine Anfrage existiert
    const existingRequest = db.prepare(`
      SELECT id FROM access_requests 
      WHERE username = ? AND status = 'pending'
    `).get(username.trim());
    
    if (existingRequest) {
      return res.status(400).json({ ok: false, error: 'Es existiert bereits eine ausstehende Anfrage für diesen Benutzernamen' });
    }
    
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO access_requests (username, email, full_name, reason, requested_role, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      username.trim(), 
      email || null, 
      full_name || null, 
      reason || null, 
      requested_role || 'operator',
      now
    );
    
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Fehler beim Erstellen der Zugriffs-Anfrage:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/access-requests/:id - Anfrage aktualisieren (z.B. Rolle ändern)
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { requested_role } = req.body;
    
    const request = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Anfrage nicht gefunden' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ ok: false, error: 'Nur ausstehende Anfragen können bearbeitet werden' });
    }
    
    // Update requested_role
    if (requested_role) {
      db.prepare(`
        UPDATE access_requests
        SET requested_role = ?
        WHERE id = ?
      `).run(requested_role, id);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Anfrage:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/access-requests/:id/approve - Anfrage genehmigen
router.put('/:id/approve', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { reviewed_by, review_notes, assigned_role } = req.body;
    
    const request = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Anfrage nicht gefunden' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ ok: false, error: 'Anfrage wurde bereits bearbeitet' });
    }
    
    const now = new Date().toISOString();
    
    // Erstelle Benutzer
    const userResult = db.prepare(`
      INSERT INTO users (username, email, full_name, role, is_active, created_at, created_by)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(
      request.username,
      request.email,
      request.full_name,
      assigned_role || request.requested_role,
      now,
      reviewed_by
    );
    
    // Update Anfrage
    db.prepare(`
      UPDATE access_requests
      SET status = 'approved', reviewed_by = ?, reviewed_at = ?, review_notes = ?
      WHERE id = ?
    `).run(reviewed_by, now, review_notes || null, id);
    
    res.json({ ok: true, userId: userResult.lastInsertRowid });
  } catch (err) {
    console.error('Fehler beim Genehmigen der Anfrage:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/access-requests/:id/reject - Anfrage ablehnen
router.put('/:id/reject', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { reviewed_by, review_notes } = req.body;
    
    const request = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Anfrage nicht gefunden' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ ok: false, error: 'Anfrage wurde bereits bearbeitet' });
    }
    
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE access_requests
      SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, review_notes = ?
      WHERE id = ?
    `).run(reviewed_by, now, review_notes || null, id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Ablehnen der Anfrage:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/access-requests/:id - Anfrage löschen
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    db.prepare('DELETE FROM access_requests WHERE id = ?').run(id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Löschen der Anfrage:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
