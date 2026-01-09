// LVS Returns - Carrier API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { getStatements } = require('../database/statements');
const { getCached, invalidateCache } = require('../utils/cache');

// GET /api/carriers - Alle aktiven Carrier
router.get('/', (req, res) => {
  try {
    const stmts = getStatements();
    const rows = getCached('carriers', () => stmts.carriers.all());
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Carrier:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/carriers/all - Alle Carrier (auch inaktive)
router.get('/all', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM carrier ORDER BY display_name
    `).all();
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Carrier:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/carriers/:id - Einzelner Carrier
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const carrier = db.prepare("SELECT * FROM carrier WHERE id = ?").get(id);
    if (!carrier) {
      return res.status(404).json({ ok: false, error: "Carrier nicht gefunden" });
    }
    
    res.json(carrier);
  } catch (err) {
    console.error("Fehler beim Abrufen des Carriers:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/carriers - Neuen Carrier erstellen
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { 
      name, display_name, country, is_active = 1,
      default_area, default_stage, default_last_stage, default_ship_status,
      label_image, label_help_text, visible_fields, field_placeholders,
      olpn_validation, tracking_validation, field_requirements, show_labels_1to1
    } = req.body;
    
    if (!name || !display_name) {
      return res.status(400).json({ ok: false, error: "Name und Display-Name sind erforderlich" });
    }
    
    // Prüfen ob Name bereits existiert
    const existing = db.prepare("SELECT id FROM carrier WHERE name = ?").get(name);
    if (existing) {
      return res.status(400).json({ ok: false, error: "Carrier-Name existiert bereits" });
    }
    
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO carrier (
        name, display_name, country, is_active, default_area, default_stage,
        default_last_stage, default_ship_status, label_image, label_help_text,
        visible_fields, field_placeholders, olpn_validation, tracking_validation,
        field_requirements, show_labels_1to1, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, display_name, country || null, is_active ? 1 : 0,
      default_area || null, default_stage || null, default_last_stage || null,
      default_ship_status || null, label_image || null, label_help_text || null,
      visible_fields || null, field_placeholders || null,
      olpn_validation || null, tracking_validation || null,
      field_requirements || null, show_labels_1to1 ? 1 : 0, now
    );
    
    invalidateCache('carriers');
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen des Carriers:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/carriers/:id - Carrier aktualisieren
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updates = req.body;
    
    const existing = db.prepare("SELECT * FROM carrier WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Carrier nicht gefunden" });
    }
    
    // Dynamisches Update erstellen
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'name', 'display_name', 'country', 'is_active',
      'default_area', 'default_stage', 'default_last_stage', 'default_ship_status',
      'label_image', 'label_help_text', 'visible_fields', 'field_placeholders',
      'olpn_validation', 'tracking_validation', 'bulk_fixed_fields', 'bulk_variable_fields',
      'field_requirements', 'show_labels_1to1', 'operator_fields_config'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Felder zum Aktualisieren" });
    }
    
    values.push(id);
    db.prepare(`UPDATE carrier SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    invalidateCache('carriers');
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Carriers:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/carriers/:id - Carrier löschen
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Prüfen ob Carrier verwendet wird
    const usageCount = db.prepare(`
      SELECT COUNT(*) as count FROM inbound_simple 
      WHERE carrier_name = (SELECT name FROM carrier WHERE id = ?)
    `).get(id).count;
    
    if (usageCount > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: `Carrier kann nicht gelöscht werden. Er wird in ${usageCount} Einträgen verwendet.` 
      });
    }
    
    db.prepare("DELETE FROM carrier WHERE id = ?").run(id);
    invalidateCache('carriers');
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Carriers:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
