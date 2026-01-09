// LVS Returns - Movement (Umlagerung) API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/movements - Alle Umlagerungen
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { limit = 100, inbound_id } = req.query;
    
    let sql = `
      SELECT 
        m.*,
        l_from.code as from_location_code,
        l_from.description as from_location_description,
        l_to.code as to_location_code,
        l_to.description as to_location_description,
        i.cw, i.olpn, i.carrier_tracking_nr
      FROM movement m
      LEFT JOIN location l_from ON m.from_location_id = l_from.id
      LEFT JOIN location l_to ON m.to_location_id = l_to.id
      LEFT JOIN inbound_simple i ON m.inbound_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (inbound_id) {
      sql += ` AND m.inbound_id = ?`;
      params.push(inbound_id);
    }
    
    sql += ` ORDER BY m.moved_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Umlagerungen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/movements/recent - Letzte Umlagerungen (für Dashboard)
router.get('/recent', (req, res) => {
  try {
    const db = getDb();
    const { limit = 20 } = req.query;
    
    const rows = db.prepare(`
      SELECT 
        m.id,
        m.moved_at,
        m.moved_by,
        m.reason,
        l_from.code as from_location,
        l_to.code as to_location,
        i.cw,
        i.olpn,
        i.carrier_tracking_nr,
        i.actual_carton
      FROM movement m
      LEFT JOIN location l_from ON m.from_location_id = l_from.id
      LEFT JOIN location l_to ON m.to_location_id = l_to.id
      LEFT JOIN inbound_simple i ON m.inbound_id = i.id
      ORDER BY m.moved_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der letzten Umlagerungen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/movements - Neue Umlagerung
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { inbound_id, from_location_id, to_location_id, reason, moved_by } = req.body;
    
    if (!inbound_id || !to_location_id) {
      return res.status(400).json({ ok: false, error: "Inbound-ID und Ziel-Stellplatz sind erforderlich" });
    }
    
    // Prüfen ob Eintrag existiert
    const inbound = db.prepare("SELECT * FROM inbound_simple WHERE id = ?").get(inbound_id);
    if (!inbound) {
      return res.status(404).json({ ok: false, error: "Wareneingang nicht gefunden" });
    }
    
    // Prüfen ob Ziel-Stellplatz existiert
    const targetLocation = db.prepare("SELECT * FROM location WHERE id = ?").get(to_location_id);
    if (!targetLocation) {
      return res.status(404).json({ ok: false, error: "Ziel-Stellplatz nicht gefunden" });
    }
    
    const now = new Date().toISOString();
    const actualFromLocation = from_location_id || inbound.location_id;
    
    // Umlagerung erstellen
    const result = db.prepare(`
      INSERT INTO movement (inbound_id, from_location_id, to_location_id, moved_at, moved_by, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(inbound_id, actualFromLocation, to_location_id, now, moved_by || 'System', reason || null);
    
    // Inbound aktualisieren
    db.prepare("UPDATE inbound_simple SET location_id = ? WHERE id = ?").run(to_location_id, inbound_id);
    
    res.json({ 
      ok: true, 
      id: result.lastInsertRowid,
      from_location: actualFromLocation,
      to_location: to_location_id
    });
  } catch (err) {
    console.error("Fehler beim Erstellen der Umlagerung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/movements/multiple - Mehrfach-Umlagerung (Alias für bulk)
router.post('/multiple', (req, res) => {
  try {
    const db = getDb();
    const { inbound_ids, to_location_id, reason, moved_by } = req.body;
    
    if (!inbound_ids || !Array.isArray(inbound_ids) || inbound_ids.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Einträge ausgewählt" });
    }
    
    if (!to_location_id) {
      return res.status(400).json({ ok: false, error: "Ziel-Stellplatz ist erforderlich" });
    }
    
    const now = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    const movementStmt = db.prepare(`
      INSERT INTO movement (inbound_id, from_location_id, to_location_id, moved_at, moved_by, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const updateStmt = db.prepare("UPDATE inbound_simple SET location_id = ? WHERE id = ?");
    
    const transaction = db.transaction(() => {
      for (const inbound_id of inbound_ids) {
        try {
          const inbound = db.prepare("SELECT id, location_id, cw, olpn FROM inbound_simple WHERE id = ?").get(inbound_id);
          if (inbound) {
            const result = movementStmt.run(inbound_id, inbound.location_id, to_location_id, now, moved_by || 'System', reason || 'Mehrfach-Umlagerung');
            updateStmt.run(to_location_id, inbound_id);
            successCount++;
            results.push({
              inbound_id,
              movement_id: result.lastInsertRowid,
              success: true
            });
          } else {
            errorCount++;
            results.push({
              inbound_id,
              success: false,
              error: 'Eintrag nicht gefunden'
            });
          }
        } catch (err) {
          errorCount++;
          results.push({
            inbound_id,
            success: false,
            error: err.message
          });
        }
      }
    });
    
    transaction();
    
    res.json({
      ok: successCount > 0,
      total: inbound_ids.length,
      success: successCount,
      errors: errorCount,
      results
    });
  } catch (err) {
    console.error("Fehler bei Mehrfach-Umlagerung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/movements/bulk - Bulk-Umlagerung
router.post('/bulk', (req, res) => {
  try {
    const db = getDb();
    const { inbound_ids, to_location_id, reason, moved_by } = req.body;
    
    if (!inbound_ids || !Array.isArray(inbound_ids) || inbound_ids.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Einträge ausgewählt" });
    }
    
    if (!to_location_id) {
      return res.status(400).json({ ok: false, error: "Ziel-Stellplatz ist erforderlich" });
    }
    
    const now = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;
    
    const movementStmt = db.prepare(`
      INSERT INTO movement (inbound_id, from_location_id, to_location_id, moved_at, moved_by, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const updateStmt = db.prepare("UPDATE inbound_simple SET location_id = ? WHERE id = ?");
    
    const transaction = db.transaction(() => {
      for (const inbound_id of inbound_ids) {
        try {
          const inbound = db.prepare("SELECT location_id FROM inbound_simple WHERE id = ?").get(inbound_id);
          if (inbound) {
            movementStmt.run(inbound_id, inbound.location_id, to_location_id, now, moved_by || 'System', reason || 'Bulk-Umlagerung');
            updateStmt.run(to_location_id, inbound_id);
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
    console.error("Fehler bei Bulk-Umlagerung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/movements/stats - Umlagerungs-Statistiken
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const stats = {
      today: db.prepare("SELECT COUNT(*) as c FROM movement WHERE moved_at >= ?").get(todayStart).c,
      week: db.prepare("SELECT COUNT(*) as c FROM movement WHERE moved_at >= ?").get(weekStart).c,
      month: db.prepare("SELECT COUNT(*) as c FROM movement WHERE moved_at >= ?").get(monthStart).c,
      total: db.prepare("SELECT COUNT(*) as c FROM movement").get().c
    };
    
    res.json(stats);
  } catch (err) {
    console.error("Fehler beim Abrufen der Umlagerungs-Statistiken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/movements/all - Alle Umlagerungen (für Bewegungsjournal)
router.get('/all', (req, res) => {
  try {
    const db = getDb();
    const { limit = 500 } = req.query;
    
    const rows = db.prepare(`
      SELECT 
        m.id,
        m.inbound_id,
        m.moved_at,
        m.moved_by,
        m.reason,
        l_from.code as from_location,
        l_from.description as from_location_description,
        l_to.code as to_location,
        l_to.description as to_location_description,
        i.cw,
        i.olpn,
        i.carrier_tracking_nr,
        i.carrier_name,
        i.actual_carton
      FROM movement m
      LEFT JOIN location l_from ON m.from_location_id = l_from.id
      LEFT JOIN location l_to ON m.to_location_id = l_to.id
      LEFT JOIN inbound_simple i ON m.inbound_id = i.id
      ORDER BY m.moved_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    // Transformiere die Daten für das Frontend (Bewegungsjournal-Format)
    const transformed = rows.map(row => ({
      id: row.id,
      type: 'Umlagerung',
      object: row.cw || row.olpn || row.carrier_tracking_nr || `#${row.inbound_id}`,
      from_location: row.from_location || '-',
      to_location: row.to_location || '-',
      user: row.moved_by || '-',
      timestamp: row.moved_at,
      reason: row.reason,
      // Original-Daten für erweiterte Ansicht
      inbound_id: row.inbound_id,
      carrier_name: row.carrier_name,
      actual_carton: row.actual_carton
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Umlagerungen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/movements/history - Bewegungshistorie (alias für /all)
router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const { limit = 100, type, from, to } = req.query;
    
    let sql = `
      SELECT 
        m.id,
        m.inbound_id,
        m.moved_at as timestamp,
        m.moved_by as user,
        m.reason,
        l_from.code as from_location,
        l_to.code as to_location,
        i.cw,
        i.olpn,
        i.carrier_tracking_nr,
        i.carrier_name,
        'Umlagerung' as type
      FROM movement m
      LEFT JOIN location l_from ON m.from_location_id = l_from.id
      LEFT JOIN location l_to ON m.to_location_id = l_to.id
      LEFT JOIN inbound_simple i ON m.inbound_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (from) {
      sql += ` AND m.moved_at >= ?`;
      params.push(from);
    }
    
    if (to) {
      sql += ` AND m.moved_at <= ?`;
      params.push(to);
    }
    
    sql += ` ORDER BY m.moved_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const rows = db.prepare(sql).all(...params);
    
    // Transformiere für Frontend - mit allen erwarteten Feldnamen
    const transformed = rows.map(row => ({
      id: row.id,
      type: row.type,
      inbound_id: row.inbound_id,
      object: row.cw || row.olpn || row.carrier_tracking_nr || `#${row.inbound_id}`,
      // Beide Varianten für Kompatibilität
      from_location: row.from_location || '-',
      to_location: row.to_location || '-',
      from_location_code: row.from_location || '-',
      to_location_code: row.to_location || '-',
      user: row.user || '-',
      moved_by: row.user || '-',
      timestamp: row.timestamp,
      moved_at: row.timestamp,
      reason: row.reason,
      carrier_name: row.carrier_name,
      cw: row.cw,
      olpn: row.olpn,
      carrier_tracking_nr: row.carrier_tracking_nr
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error("Fehler beim Abrufen der Bewegungshistorie:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
