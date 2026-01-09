// LVS Returns - Archive API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/archive - Alle archivierten Einträge
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { limit = 500, search, reason } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.inbound_id,
        a.location_id,
        a.archived_at,
        a.archived_by,
        a.reason,
        a.notes,
        i.cw,
        i.olpn,
        i.carrier_name,
        i.carrier_tracking_nr,
        i.customer_name,
        i.actual_carton,
        i.aufgenommen_am,
        l.code as location_code,
        l.description as location_description
      FROM archive a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      LEFT JOIN location l ON a.location_id = l.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search && search.trim() !== '') {
      sql += ` AND (i.cw LIKE ? OR i.olpn LIKE ? OR i.carrier_tracking_nr LIKE ? OR a.reason LIKE ? OR a.notes LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (reason && reason !== 'all') {
      sql += ` AND a.reason = ?`;
      params.push(reason);
    }
    
    sql += ` ORDER BY a.archived_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Archive:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/archive/reasons - Alle Archivierungsgründe
router.get('/reasons', (req, res) => {
  try {
    const db = getDb();
    const reasons = db.prepare(`
      SELECT DISTINCT reason, COUNT(*) as count
      FROM archive
      WHERE reason IS NOT NULL AND reason != ''
      GROUP BY reason
      ORDER BY count DESC
    `).all();
    
    res.json(reasons);
  } catch (err) {
    console.error("Fehler beim Abrufen der Archiv-Gründe:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/archive/:id - Einzelner Archiv-Eintrag
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const entry = db.prepare(`
      SELECT 
        a.*,
        i.cw, i.olpn, i.carrier_name, i.carrier_tracking_nr,
        i.customer_name, i.actual_carton, i.aufgenommen_am,
        l.code as location_code, l.description as location_description
      FROM archive a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      LEFT JOIN location l ON a.location_id = l.id
      WHERE a.id = ?
    `).get(id);
    
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Archiv-Eintrag nicht gefunden" });
    }
    
    res.json(entry);
  } catch (err) {
    console.error("Fehler beim Abrufen des Archiv-Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/archive - Neuen Archiv-Eintrag erstellen
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { inbound_id, reason, notes, archived_by } = req.body;
    
    if (!inbound_id) {
      return res.status(400).json({ ok: false, error: "Inbound-ID ist erforderlich" });
    }
    
    // Prüfen ob Eintrag existiert
    const inbound = db.prepare("SELECT * FROM inbound_simple WHERE id = ?").get(inbound_id);
    if (!inbound) {
      return res.status(404).json({ ok: false, error: "Wareneingang nicht gefunden" });
    }
    
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO archive (inbound_id, location_id, archived_at, archived_by, reason, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(inbound_id, inbound.location_id, now, archived_by || 'System', reason || 'Archiviert', notes || null);
    
    // Eintrag als ignoriert markieren
    db.prepare("UPDATE inbound_simple SET ignore_flag = 1 WHERE id = ?").run(inbound_id);
    
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Archivieren:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/archive/bulk - Mehrere Einträge archivieren
router.post('/bulk', (req, res) => {
  try {
    const db = getDb();
    const { inbound_ids, reason, notes, archived_by } = req.body;
    
    if (!inbound_ids || !Array.isArray(inbound_ids) || inbound_ids.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Einträge ausgewählt" });
    }
    
    const now = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;
    
    const archiveStmt = db.prepare(`
      INSERT INTO archive (inbound_id, location_id, archived_at, archived_by, reason, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const updateStmt = db.prepare("UPDATE inbound_simple SET ignore_flag = 1 WHERE id = ?");
    
    const transaction = db.transaction(() => {
      for (const inbound_id of inbound_ids) {
        try {
          const inbound = db.prepare("SELECT location_id FROM inbound_simple WHERE id = ?").get(inbound_id);
          if (inbound) {
            archiveStmt.run(inbound_id, inbound.location_id, now, archived_by || 'System', reason || 'Bulk-Archivierung', notes || null);
            updateStmt.run(inbound_id);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }
    });
    
    transaction();
    
    res.json({
      ok: true,
      total: inbound_ids.length,
      success: successCount,
      errors: errorCount
    });
  } catch (err) {
    console.error("Fehler bei Bulk-Archivierung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/archive/:id/restore - Archiv-Eintrag wiederherstellen
router.post('/:id/restore', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { location_id } = req.body;
    
    const archive = db.prepare("SELECT * FROM archive WHERE id = ?").get(id);
    if (!archive) {
      return res.status(404).json({ ok: false, error: "Archiv-Eintrag nicht gefunden" });
    }
    
    // Wareneingang wieder aktivieren
    const targetLocation = location_id || archive.location_id;
    db.prepare("UPDATE inbound_simple SET ignore_flag = 0, location_id = ? WHERE id = ?")
      .run(targetLocation, archive.inbound_id);
    
    // Archiv-Eintrag löschen
    db.prepare("DELETE FROM archive WHERE id = ?").run(id);
    
    res.json({ ok: true, inbound_id: archive.inbound_id });
  } catch (err) {
    console.error("Fehler beim Wiederherstellen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/archive/:id - Archiv-Eintrag endgültig löschen
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { delete_inbound } = req.body;
    
    const archive = db.prepare("SELECT * FROM archive WHERE id = ?").get(id);
    if (!archive) {
      return res.status(404).json({ ok: false, error: "Archiv-Eintrag nicht gefunden" });
    }
    
    // Archiv-Eintrag löschen
    db.prepare("DELETE FROM archive WHERE id = ?").run(id);
    
    // Optional: Wareneingang auch löschen
    if (delete_inbound) {
      db.prepare("DELETE FROM inbound_simple WHERE id = ?").run(archive.inbound_id);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Archiv-Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/archive/stats - Archiv-Statistiken
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    
    const stats = {
      total: db.prepare("SELECT COUNT(*) as c FROM archive").get().c,
      thisWeek: db.prepare(`
        SELECT COUNT(*) as c FROM archive 
        WHERE archived_at >= datetime('now', '-7 days')
      `).get().c,
      thisMonth: db.prepare(`
        SELECT COUNT(*) as c FROM archive 
        WHERE archived_at >= datetime('now', '-30 days')
      `).get().c,
      byReason: db.prepare(`
        SELECT reason, COUNT(*) as count FROM archive 
        GROUP BY reason ORDER BY count DESC LIMIT 10
      `).all()
    };
    
    res.json(stats);
  } catch (err) {
    console.error("Fehler beim Abrufen der Archiv-Statistiken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
