// LVS Returns - Inbound (Wareneingang) API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { getStatements } = require('../database/statements');
const { getCached, invalidateCache } = require('../utils/cache');

// GET /api/inbound-simple - Letzte Einträge
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { limit = 50 } = req.query;
    
    const rows = db.prepare(`
      SELECT 
        id, cw, aufgenommen_am, carrier_name, area, stage, 
        planned_carton, actual_carton, olpn, mh_status, 
        carrier_tracking_nr, kommentar, created_at, added_by, location_id
      FROM inbound_simple 
      ORDER BY id DESC 
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Einträge:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/inbound-simple/check-olpn - OLPN prüfen
router.get('/check-olpn', (req, res) => {
  try {
    const db = getDb();
    const { olpn } = req.query;
    
    if (!olpn || olpn.trim() === '') {
      return res.json({ ok: true, exists: false, valid: false });
    }
    
    const existing = db.prepare(`
      SELECT id, olpn, carrier_name, created_at 
      FROM inbound_simple 
      WHERE olpn = ? AND ignore_flag = 0
      LIMIT 1
    `).get(olpn.trim());
    
    res.json({ 
      ok: true, 
      exists: !!existing,
      entry: existing || null
    });
  } catch (err) {
    console.error("Fehler bei OLPN-Check:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/inbound-simple/check-tracking - Tracking prüfen
router.get('/check-tracking', (req, res) => {
  try {
    const db = getDb();
    const { tracking } = req.query;
    
    if (!tracking || tracking.trim() === '') {
      return res.json({ ok: true, exists: false, valid: false });
    }
    
    const existing = db.prepare(`
      SELECT id, carrier_tracking_nr, carrier_name, created_at 
      FROM inbound_simple 
      WHERE carrier_tracking_nr = ? AND ignore_flag = 0
      LIMIT 1
    `).get(tracking.trim());
    
    res.json({ 
      ok: true, 
      exists: !!existing,
      entry: existing || null
    });
  } catch (err) {
    console.error("Fehler bei Tracking-Check:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/inbound-simple/:id - Einzelner Eintrag
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const entry = db.prepare("SELECT * FROM inbound_simple WHERE id = ?").get(id);
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden" });
    }
    
    res.json(entry);
  } catch (err) {
    console.error("Fehler beim Abrufen des Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/inbound-simple - Neuen Eintrag erstellen
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const payload = req.body;
    const now = new Date().toISOString();
    
    // CW normalisieren
    let cw = payload.cw;
    if (cw && typeof cw === 'string') {
      cw = cw.trim().toUpperCase();
      if (/^\d+$/.test(cw)) {
        cw = `CW${cw.padStart(2, '0')}`;
      }
    }
    
    const result = db.prepare(`
      INSERT INTO inbound_simple (
        cw, aufgenommen_am, ignore_flag, area, stage, last_stage,
        carrier_name, land, ship_status, planned_carton, actual_carton,
        olpn, dn, shi, carrier_tracking_nr, customer_id, customer_name,
        asn_ra_no, neue_ra, new_reopen_ra, mh_status, kommentar,
        added_by, created_at, location_id
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cw || null,
      payload.aufgenommen_am || now,
      payload.area || null,
      payload.stage || null,
      payload.last_stage || null,
      payload.carrier_name || null,
      payload.land || null,
      payload.ship_status || null,
      payload.planned_carton || null,
      payload.actual_carton || null,
      payload.olpn || null,
      payload.dn || null,
      payload.shi || null,
      payload.carrier_tracking_nr || null,
      payload.customer_id || null,
      payload.customer_name || null,
      payload.asn_ra_no || null,
      payload.neue_ra || null,
      payload.new_reopen_ra || null,
      payload.mh_status || null,
      payload.kommentar || null,
      payload.added_by || 'System',
      now,
      payload.location_id || null
    );
    
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen des Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/inbound-simple/:id - Eintrag aktualisieren
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const payload = req.body;
    const currentUser = req.headers['x-user'] || payload.addedBy || 'System';
    
    const existing = db.prepare("SELECT * FROM inbound_simple WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden" });
    }
    
    // Pflichtkommentar bei Änderungen
    if (!payload.change_reason || payload.change_reason.trim() === "") {
      return res.status(400).json({ ok: false, error: "Bitte geben Sie einen Grund für die Änderung an" });
    }
    
    const now = new Date().toISOString();
    
    // Audit-Log für wichtige Felder
    const importantFields = ['carrier_name', 'location_id', 'olpn', 'carrier_tracking_nr', 'actual_carton', 'stage'];
    const auditStmt = db.prepare(`
      INSERT INTO inbound_audit (inbound_id, field_name, old_value, new_value, changed_by, change_reason, changed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const field of importantFields) {
      if (payload[field] !== undefined && payload[field] !== existing[field]) {
        auditStmt.run(
          id, field,
          existing[field] !== null ? String(existing[field]) : null,
          payload[field] !== null ? String(payload[field]) : null,
          currentUser, payload.change_reason, now
        );
      }
    }
    
    // Update durchführen
    const updateFields = [];
    const updateValues = [];
    
    const allowedFields = [
      'cw', 'aufgenommen_am', 'carrier_name', 'area', 'land', 'ship_status',
      'stage', 'last_stage', 'planned_carton', 'actual_carton', 'olpn',
      'carrier_tracking_nr', 'dn', 'shi', 'customer_id', 'customer_name',
      'asn_ra_no', 'mh_status', 'neue_ra', 'new_reopen_ra', 'kommentar',
      'ignore_flag', 'location_id'
    ];
    
    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(payload[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Felder zum Aktualisieren" });
    }
    
    updateValues.push(id);
    db.prepare(`UPDATE inbound_simple SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/inbound-simple/:id - Eintrag löschen (archivieren)
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { reason, notes, user } = req.body;
    
    const existing = db.prepare("SELECT * FROM inbound_simple WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden" });
    }
    
    const now = new Date().toISOString();
    
    // In Archiv verschieben
    db.prepare(`
      INSERT INTO archive (inbound_id, location_id, archived_at, archived_by, reason, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, existing.location_id, now, user || 'System', reason || 'Gelöscht', notes || null);
    
    // Als ignoriert markieren
    db.prepare("UPDATE inbound_simple SET ignore_flag = 1 WHERE id = ?").run(id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/inbound-simple/bulk - Bulk-Insert
router.post('/bulk', (req, res) => {
  try {
    const db = getDb();
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Einträge übergeben" });
    }
    
    const now = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    const stmt = db.prepare(`
      INSERT INTO inbound_simple (
        cw, aufgenommen_am, ignore_flag, area, stage, last_stage,
        carrier_name, land, ship_status, planned_carton, actual_carton,
        olpn, dn, shi, carrier_tracking_nr, customer_id, customer_name,
        asn_ra_no, kommentar, added_by, created_at, location_id
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        try {
          stmt.run(
            entry.cw || null,
            entry.aufgenommen_am || now,
            entry.area || null,
            entry.stage || null,
            entry.last_stage || null,
            entry.carrier_name || null,
            entry.land || null,
            entry.ship_status || null,
            entry.planned_carton || null,
            entry.actual_carton || null,
            entry.olpn || null,
            entry.dn || null,
            entry.shi || null,
            entry.carrier_tracking_nr || null,
            entry.customer_id || null,
            entry.customer_name || null,
            entry.asn_ra_no || null,
            entry.kommentar || null,
            entry.added_by || 'Bulk-Import',
            now,
            entry.location_id || null
          );
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push({ index: i, error: err.message });
        }
      }
    });
    
    transaction();
    
    res.json({
      ok: true,
      total: entries.length,
      success: successCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 50)
    });
  } catch (err) {
    console.error("Fehler beim Bulk-Insert:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
