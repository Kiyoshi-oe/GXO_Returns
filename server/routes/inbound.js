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
    const { limit = 50, with_ra_only = false } = req.query;
    
    let sql = `
      SELECT 
        id, cw, aufgenommen_am, carrier_name, area, stage, 
        planned_carton, actual_carton, olpn, dn, mh_status, 
        carrier_tracking_nr, kommentar, created_at, added_by, location_id,
        asn_ra_no, ra_assigned_at, ra_assigned_by
      FROM inbound_simple 
      WHERE ignore_flag = 0
    `;
    
    const params = [];
    
    if (with_ra_only === 'true') {
      sql += ` AND (asn_ra_no IS NOT NULL AND asn_ra_no != '' AND asn_ra_no != 'NULL')`;
    }
    
    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const rows = db.prepare(sql).all(...params);
    
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

// GET /api/inbound/check-duplicate - Duplikat-Prüfung mit Details
router.get('/check-duplicate', (req, res) => {
  try {
    const db = getDb();
    const { olpn, tracking, carrier, carrier_name } = req.query;
    
    let existing = null;
    let query = '';
    let params = [];
    
    if (olpn) {
      query = `
        SELECT 
          i.id,
          i.olpn,
          i.carrier_name,
          i.carrier_tracking_nr,
          i.actual_carton,
          i.created_at,
          i.added_by,
          i.location_id,
          l.code as location_code,
          l.description as location_description
        FROM inbound_simple i
        LEFT JOIN location l ON i.location_id = l.id
        WHERE i.olpn = ? AND i.ignore_flag = 0
        LIMIT 1
      `;
      params = [olpn.trim()];
      
      // Optional: Carrier-Filter
      if (carrier || carrier_name) {
        query = query.replace('WHERE', 'WHERE (i.carrier_name = ? OR i.carrier_name = ?) AND');
        params.unshift(carrier_name || carrier, carrier || carrier_name);
      }
    } else if (tracking) {
      query = `
        SELECT 
          i.id,
          i.olpn,
          i.carrier_name,
          i.carrier_tracking_nr,
          i.actual_carton,
          i.created_at,
          i.added_by,
          i.location_id,
          l.code as location_code,
          l.description as location_description
        FROM inbound_simple i
        LEFT JOIN location l ON i.location_id = l.id
        WHERE i.carrier_tracking_nr = ? AND i.ignore_flag = 0
        LIMIT 1
      `;
      params = [tracking.trim()];
      
      if (carrier || carrier_name) {
        query = query.replace('WHERE', 'WHERE (i.carrier_name = ? OR i.carrier_name = ?) AND');
        params.unshift(carrier_name || carrier, carrier || carrier_name);
      }
    }
    
    if (query) {
      existing = db.prepare(query).get(...params);
    }
    
    if (existing) {
      res.json({
        exists: true,
        details: {
          id: existing.id,
          olpn: existing.olpn,
          carrier_name: existing.carrier_name,
          tracking: existing.carrier_tracking_nr,
          actual_carton: existing.actual_carton,
          created_at: existing.created_at,
          added_by: existing.added_by,
          location_code: existing.location_code,
          location: existing.location_description || existing.location_code,
          user: existing.added_by
        }
      });
    } else {
      res.json({
        exists: false,
        details: null
      });
    }
  } catch (err) {
    console.error("Fehler bei Duplikat-Check:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/inbound-simple/filter-ra - Gefilterte RA-Daten für Levis (MUSS VOR /:id stehen!)
router.get('/filter-ra', (req, res) => {
  try {
    const db = getDb();
    const { filter_type = 'all', search = '' } = req.query;
    
    let sql = `
      SELECT 
        id, olpn, dn, carrier_name, carrier_tracking_nr,
        asn_ra_no, mh_status, ra_assigned_at, ra_assigned_by,
        customer_name, area, stage, created_at
      FROM inbound_simple
      WHERE ignore_flag = 0
    `;
    const params = [];
    
    // Filter nach Typ
    if (filter_type === 'request') {
      sql += ` AND (mh_status LIKE ? OR mh_status LIKE ?)`;
      params.push('%Request%', '%request%');
    } else if (filter_type === 'missing_ra') {
      sql += ` AND (asn_ra_no IS NULL OR asn_ra_no = '' OR asn_ra_no = 'NULL')`;
      sql += ` AND (olpn IS NOT NULL AND olpn != '' OR dn IS NOT NULL AND dn != '')`;
    }
    
    // Zusätzliche Suche
    if (search && search.trim() !== '') {
      sql += ` AND (
        olpn LIKE ? OR 
        dn LIKE ? OR 
        carrier_name LIKE ? OR
        carrier_tracking_nr LIKE ?
      )`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    sql += ` ORDER BY id DESC LIMIT 500`;
    
    const rows = db.prepare(sql).all(...params);
    
    res.json({
      ok: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error("Fehler beim Abrufen gefilterter RA-Daten:", err);
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

// PUT /api/inbound-simple/:id/ra - RA-Nummer setzen (für Levis-Rolle, ohne change_reason)
router.put('/:id/ra', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { asn_ra_no } = req.body;
    const currentUser = req.headers['x-user'] || 'System';
    
    const existing = db.prepare("SELECT * FROM inbound_simple WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden" });
    }
    
    if (!asn_ra_no || asn_ra_no.trim() === "") {
      return res.status(400).json({ ok: false, error: "RA-Nummer ist erforderlich" });
    }
    
    const now = new Date().toISOString();
    
    // Update RA-Nummer mit Timestamp (für Levis-Rolle)
    db.prepare(`
      UPDATE inbound_simple 
      SET asn_ra_no = ?, ra_assigned_at = ?, ra_assigned_by = ?
      WHERE id = ?
    `).run(asn_ra_no.trim(), now, currentUser, id);
    
    // Optional: Audit-Log ohne change_reason
    db.prepare(`
      INSERT INTO inbound_audit (inbound_id, field_name, old_value, new_value, changed_by, change_reason, changed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 'asn_ra_no',
      existing.asn_ra_no || null,
      asn_ra_no.trim(),
      currentUser,
      'RA-Nummer zugeordnet (Levis)',
      now
    );
    
    res.json({ ok: true, message: "RA-Nummer erfolgreich zugeordnet", ra_assigned_at: now });
  } catch (err) {
    console.error("Fehler beim Setzen der RA-Nummer:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/inbound-simple/bulk-update-ra - Bulk RA-Nummern zuordnen
router.post('/bulk-update-ra', (req, res) => {
  try {
    const db = getDb();
    const { updates } = req.body; // Array von { identifier: 'OLPN123', identifier_type: 'olpn', asn_ra_no: 'RA123' }
    const currentUser = req.headers['x-user'] || 'System';
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Updates bereitgestellt" });
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const { identifier, identifier_type, asn_ra_no } = update;
        
        if (!identifier || !identifier_type || !asn_ra_no) {
          errors.push({ identifier, error: "Fehlende Felder" });
          continue;
        }
        
        // Suche Eintrag basierend auf identifier_type
        let existing;
        if (identifier_type === 'olpn') {
          existing = db.prepare("SELECT * FROM inbound_simple WHERE olpn = ? AND ignore_flag = 0 LIMIT 1").get(identifier.trim());
        } else if (identifier_type === 'dn') {
          existing = db.prepare("SELECT * FROM inbound_simple WHERE dn = ? AND ignore_flag = 0 LIMIT 1").get(identifier.trim());
        } else if (identifier_type === 'tracking') {
          existing = db.prepare("SELECT * FROM inbound_simple WHERE carrier_tracking_nr = ? AND ignore_flag = 0 LIMIT 1").get(identifier.trim());
        } else {
          errors.push({ identifier, error: "Ungültiger identifier_type" });
          continue;
        }
        
        if (!existing) {
          errors.push({ identifier, error: "Eintrag nicht gefunden" });
          continue;
        }
        
        // Update RA-Nummer
        db.prepare("UPDATE inbound_simple SET asn_ra_no = ? WHERE id = ?").run(asn_ra_no.trim(), existing.id);
        
        // Audit-Log
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO inbound_audit (inbound_id, field_name, old_value, new_value, changed_by, change_reason, changed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          existing.id, 'asn_ra_no',
          existing.asn_ra_no || null,
          asn_ra_no.trim(),
          currentUser,
          'RA-Nummer zugeordnet (Bulk Import)',
          now
        );
        
        results.push({ identifier, id: existing.id, success: true });
      } catch (err) {
        errors.push({ identifier: update.identifier, error: err.message });
      }
    }
    
    res.json({ 
      ok: true, 
      success_count: results.length, 
      error_count: errors.length,
      results,
      errors 
    });
  } catch (err) {
    console.error("Fehler beim Bulk-Update der RA-Nummern:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/inbound-simple/search - Suche nach OLPN/DN/Tracking
router.get('/search', (req, res) => {
  try {
    const db = getDb();
    const { q, type } = req.query; // q = Suchbegriff, type = 'olpn'|'dn'|'tracking'|'all'
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }
    
    const searchTerm = `%${q.trim()}%`;
    let sql;
    let params;
    
    if (type === 'olpn') {
      sql = `SELECT * FROM inbound_simple WHERE olpn LIKE ? AND ignore_flag = 0 LIMIT 50`;
      params = [searchTerm];
    } else if (type === 'dn') {
      sql = `SELECT * FROM inbound_simple WHERE dn LIKE ? AND ignore_flag = 0 LIMIT 50`;
      params = [searchTerm];
    } else if (type === 'tracking') {
      sql = `SELECT * FROM inbound_simple WHERE carrier_tracking_nr LIKE ? AND ignore_flag = 0 LIMIT 50`;
      params = [searchTerm];
    } else {
      // Suche in allen Feldern
      sql = `
        SELECT * FROM inbound_simple 
        WHERE (olpn LIKE ? OR dn LIKE ? OR carrier_tracking_nr LIKE ?) 
        AND ignore_flag = 0 
        LIMIT 50
      `;
      params = [searchTerm, searchTerm, searchTerm];
    }
    
    const results = db.prepare(sql).all(...params);
    res.json(results);
  } catch (err) {
    console.error("Fehler bei der Suche:", err);
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
    
    // Pflichtkommentar bei Änderungen (außer für RA-Import)
    if (!payload.skip_change_reason && (!payload.change_reason || payload.change_reason.trim() === "")) {
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

// POST /api/inbound-simple/test-data - Erstelle 5 Test-Einträge mit verschiedenen RA-Nummern und MH-Status
router.post('/test-data', (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const currentUser = req.headers['x-user'] || 'System';
    
    // 5 Test-Einträge mit verschiedenen RA-Nummern und MH-Status
    const testEntries = [
      {
        cw: 'CW01',
        olpn: 'TEST001',
        carrier_tracking_nr: '88' + Math.random().toString().slice(2, 14).padStart(10, '0'),
        asn_ra_no: 'RA123456',
        mh_status: 'In Transit',
        ship_status: 'In Transit',
        carrier_name: 'FedEx',
        actual_carton: 5,
        planned_carton: 5,
        customer_name: 'Test Kunde 1',
        added_by: currentUser
      },
      {
        cw: 'CW02',
        olpn: 'TEST002',
        carrier_tracking_nr: '88' + Math.random().toString().slice(2, 14).padStart(10, '0'),
        asn_ra_no: 'RA234567',
        mh_status: 'In Receiving',
        ship_status: 'In Receiving',
        carrier_name: 'DHL',
        actual_carton: 3,
        planned_carton: 3,
        customer_name: 'Test Kunde 2',
        added_by: currentUser
      },
      {
        cw: 'CW03',
        olpn: 'TEST003',
        carrier_tracking_nr: '88' + Math.random().toString().slice(2, 14).padStart(10, '0'),
        asn_ra_no: 'RA345678',
        mh_status: 'Cancelled',
        ship_status: 'Cancelled',
        carrier_name: 'UPS',
        actual_carton: 2,
        planned_carton: 2,
        customer_name: 'Test Kunde 3',
        added_by: currentUser
      },
      {
        cw: 'CW04',
        olpn: 'TEST004',
        carrier_tracking_nr: '88' + Math.random().toString().slice(2, 14).padStart(10, '0'),
        asn_ra_no: 'RA456789',
        mh_status: 'Verifiziert',
        ship_status: 'Verifiziert',
        carrier_name: 'DPD',
        actual_carton: 8,
        planned_carton: 8,
        customer_name: 'Test Kunde 4',
        added_by: currentUser
      },
      {
        cw: 'CW05',
        olpn: 'TEST005',
        carrier_tracking_nr: '88' + Math.random().toString().slice(2, 14).padStart(10, '0'),
        asn_ra_no: null, // Keine RA-Nummer -> #NV
        mh_status: null,
        ship_status: 'Pending',
        carrier_name: 'GLS',
        actual_carton: 1,
        planned_carton: 1,
        customer_name: 'Test Kunde 5',
        added_by: currentUser
      }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO inbound_simple (
        cw, aufgenommen_am, ignore_flag, area, stage, last_stage,
        carrier_name, land, ship_status, planned_carton, actual_carton,
        olpn, dn, shi, carrier_tracking_nr, customer_id, customer_name,
        asn_ra_no, mh_status, kommentar,
        added_by, created_at
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertedIds = [];
    for (const entry of testEntries) {
      const result = stmt.run(
        entry.cw,
        now,
        null, // area
        null, // stage
        null, // last_stage
        entry.carrier_name,
        null, // land
        entry.ship_status,
        entry.planned_carton,
        entry.actual_carton,
        entry.olpn,
        null, // dn
        null, // shi
        entry.carrier_tracking_nr,
        null, // customer_id
        entry.customer_name,
        entry.asn_ra_no,
        entry.mh_status,
        'Test-Eintrag für RA-Status-Anzeige',
        entry.added_by,
        now
      );
      insertedIds.push(result.lastInsertRowid);
    }
    
    res.json({ 
      ok: true, 
      message: '5 Test-Einträge erfolgreich erstellt',
      inserted_ids: insertedIds,
      entries: testEntries.map((e, i) => ({
        id: insertedIds[i],
        olpn: e.olpn,
        asn_ra_no: e.asn_ra_no,
        mh_status: e.mh_status
      }))
    });
  } catch (err) {
    console.error("Fehler beim Erstellen der Test-Einträge:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
