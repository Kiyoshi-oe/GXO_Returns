// LVS Returns - Warehouse API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { getStatements } = require('../database/statements');
const { getCached } = require('../utils/cache');

// GET /api/warehouse/locations - Alle Stellplätze mit Statistiken
router.get('/locations', (req, res) => {
  try {
    const db = getDb();
    const { area, active_only, search } = req.query;
    
    let sql = `
      SELECT
        l.id,
        l.code,
        l.description,
        l.area,
        l.is_active,
        l.created_at,
        IFNULL(COUNT(DISTINCT i.id), 0) as carton_count,
        IFNULL(SUM(i.actual_carton), 0) as total_cartons,
        MAX(i.created_at) as last_booked_at
      FROM location l
      LEFT JOIN inbound_simple i ON i.location_id = l.id AND i.ignore_flag = 0
      WHERE 1=1
    `;
    
    const params = [];
    
    if (active_only === 'true') {
      sql += ` AND l.is_active = 1`;
    }
    
    if (area && area !== 'all') {
      sql += ` AND l.area = ?`;
      params.push(area);
    }
    
    if (search && search.trim() !== '') {
      sql += ` AND (l.code LIKE ? OR l.description LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }
    
    sql += `
      GROUP BY l.id, l.code, l.description, l.area, l.is_active, l.created_at
      ORDER BY l.area, l.code
    `;
    
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Stellplätze:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/warehouse/locations/:id - Einzelner Stellplatz mit Details
router.get('/locations/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const location = db.prepare(`
      SELECT l.*, 
        IFNULL(COUNT(DISTINCT i.id), 0) as carton_count,
        IFNULL(SUM(i.actual_carton), 0) as total_cartons
      FROM location l
      LEFT JOIN inbound_simple i ON i.location_id = l.id AND i.ignore_flag = 0
      WHERE l.id = ?
      GROUP BY l.id
    `).get(id);
    
    if (!location) {
      return res.status(404).json({ ok: false, error: "Stellplatz nicht gefunden" });
    }
    
    // Kartons auf diesem Stellplatz
    const cartons = db.prepare(`
      SELECT id, cw, olpn, carrier_name, carrier_tracking_nr, actual_carton, 
             aufgenommen_am, created_at
      FROM inbound_simple
      WHERE location_id = ? AND ignore_flag = 0
      ORDER BY created_at DESC
    `).all(id);
    
    res.json({ ...location, cartons });
  } catch (err) {
    console.error("Fehler beim Abrufen des Stellplatzes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/warehouse/locations - Neuen Stellplatz erstellen
router.post('/locations', (req, res) => {
  try {
    const db = getDb();
    const { code, description, area, is_active = 1 } = req.body;
    
    if (!code || code.trim() === '') {
      return res.status(400).json({ ok: false, error: "Code ist erforderlich" });
    }
    
    // Prüfen ob Code bereits existiert
    const existing = db.prepare("SELECT id FROM location WHERE code = ?").get(code.trim());
    if (existing) {
      return res.status(400).json({ ok: false, error: "Stellplatz-Code existiert bereits" });
    }
    
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO location (code, description, area, is_active, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(code.trim(), description || null, area || null, is_active ? 1 : 0, now);
    
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen des Stellplatzes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/warehouse/locations/:id - Stellplatz aktualisieren
router.put('/locations/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { code, description, area, is_active } = req.body;
    
    const existing = db.prepare("SELECT * FROM location WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Stellplatz nicht gefunden" });
    }
    
    // Wenn Code geändert wird, prüfen ob neuer Code bereits existiert
    if (code && code.trim() !== existing.code) {
      const duplicate = db.prepare("SELECT id FROM location WHERE code = ? AND id != ?")
        .get(code.trim(), id);
      if (duplicate) {
        return res.status(400).json({ ok: false, error: "Stellplatz-Code existiert bereits" });
      }
    }
    
    db.prepare(`
      UPDATE location 
      SET code = ?, description = ?, area = ?, is_active = ?
      WHERE id = ?
    `).run(
      code ? code.trim() : existing.code,
      description !== undefined ? description : existing.description,
      area !== undefined ? area : existing.area,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Stellplatzes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/warehouse/locations/:id - Stellplatz löschen
router.delete('/locations/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Prüfen ob Kartons gebucht sind
    const cartonCount = db.prepare(`
      SELECT COUNT(*) as count FROM inbound_simple WHERE location_id = ?
    `).get(id).count;
    
    if (cartonCount > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: `Stellplatz kann nicht gelöscht werden. Es sind noch ${cartonCount} Kartons gebucht.` 
      });
    }
    
    db.prepare("DELETE FROM location WHERE id = ?").run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Stellplatzes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/warehouse/areas - Alle Areas
router.get('/areas', (req, res) => {
  try {
    const stmts = getStatements();
    const areas = getCached('warehouse-areas', () => stmts.warehouseAreas.all());
    res.json(areas.map(a => a.area));
  } catch (err) {
    console.error("Fehler beim Abrufen der Areas:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/warehouse/all-entries - Alle Einträge (Overall Inventory)
router.get('/all-entries', (req, res) => {
  try {
    const db = getDb();
    const { limit = 10000 } = req.query;
    
    const entries = db.prepare(`
      SELECT 
        i.*,
        l.code as location_code,
        l.description as location_description,
        l.area as location_area
      FROM inbound_simple i
      LEFT JOIN location l ON i.location_id = l.id
      WHERE i.ignore_flag = 0
      ORDER BY i.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json(entries);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Einträge:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/warehouse/locations/:id/details - Erweiterte Stellplatz-Details
router.get('/locations/:id/details', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Basis-Informationen
    const location = db.prepare(`
      SELECT l.*, 
        IFNULL(COUNT(DISTINCT i.id), 0) as carton_count,
        IFNULL(SUM(i.actual_carton), 0) as total_cartons
      FROM location l
      LEFT JOIN inbound_simple i ON i.location_id = l.id AND i.ignore_flag = 0
      WHERE l.id = ?
      GROUP BY l.id
    `).get(id);
    
    if (!location) {
      return res.status(404).json({ ok: false, error: "Stellplatz nicht gefunden" });
    }
    
    // Kartons auf diesem Stellplatz
    const cartons = db.prepare(`
      SELECT id, cw, olpn, carrier_name, carrier_tracking_nr, actual_carton, 
             aufgenommen_am, created_at, ship_status, mh_status, customer_name
      FROM inbound_simple
      WHERE location_id = ? AND ignore_flag = 0
      ORDER BY created_at DESC
      LIMIT 50
    `).all(id);
    
    // Letzte Bewegungen zu/von diesem Stellplatz
    const movements = db.prepare(`
      SELECT 
        m.id,
        m.moved_at,
        m.moved_by,
        m.reason,
        l_from.code as from_location,
        l_to.code as to_location,
        i.cw,
        i.olpn
      FROM movement m
      LEFT JOIN location l_from ON m.from_location_id = l_from.id
      LEFT JOIN location l_to ON m.to_location_id = l_to.id
      LEFT JOIN inbound_simple i ON m.inbound_id = i.id
      WHERE m.from_location_id = ? OR m.to_location_id = ?
      ORDER BY m.moved_at DESC
      LIMIT 20
    `).all(id, id);
    
    // Statistiken
    const stats = {
      totalCartons: location.carton_count,
      totalPieces: location.total_cartons,
      lastActivity: movements.length > 0 ? movements[0].moved_at : null,
      carrierBreakdown: db.prepare(`
        SELECT carrier_name, COUNT(*) as count
        FROM inbound_simple
        WHERE location_id = ? AND ignore_flag = 0 AND carrier_name IS NOT NULL
        GROUP BY carrier_name
        ORDER BY count DESC
      `).all(id)
    };
    
    res.json({
      ok: true,
      location,
      cartons,
      movements,
      stats,
      // Für Frontend-Kompatibilität auf oberster Ebene
      total_cartons: location.total_cartons,
      carton_count: location.carton_count
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Stellplatz-Details:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/warehouse/stats - Lager-Statistiken
router.get('/stats', (req, res) => {
  try {
    const stmts = getStatements();
    
    const stats = {
      totalLocations: stmts.dashboardStats.totalLocations.get().c,
      occupiedLocations: stmts.dashboardStats.occupiedLocations.get().c,
      totalCartons: stmts.dashboardStats.totalCartons.get().total || 0,
      totalEntries: stmts.dashboardStats.totalEntries.get().c
    };
    
    stats.utilizationPercent = stats.totalLocations > 0 
      ? Math.round((stats.occupiedLocations / stats.totalLocations) * 100) 
      : 0;
    
    res.json(stats);
  } catch (err) {
    console.error("Fehler beim Abrufen der Statistiken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
