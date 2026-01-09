// LVS Returns - Dropdown Options API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { getStatements } = require('../database/statements');
const { getCached, invalidateCache } = require('../utils/cache');

// GET /api/dropdown-options/:fieldName - Dropdown-Optionen abrufen
router.get('/:fieldName', (req, res) => {
  try {
    const { fieldName } = req.params;
    const stmts = getStatements();
    
    let rows;
    if (fieldName === 'area' && stmts.dropdownOptions.area) {
      rows = getCached(`dropdown-${fieldName}`, () => stmts.dropdownOptions.area.all());
    } else if (fieldName === 'land' && stmts.dropdownOptions.land) {
      rows = getCached(`dropdown-${fieldName}`, () => stmts.dropdownOptions.land.all());
    } else {
      const db = getDb();
      rows = db.prepare(`
        SELECT id, option_value, option_label, sort_order 
        FROM dropdown_options 
        WHERE field_name = ? AND is_active = 1 
        ORDER BY sort_order
      `).all(fieldName);
    }
    
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Dropdown-Optionen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/dropdown-options - Neue Option erstellen
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { field_name, option_value, option_label, sort_order = 0 } = req.body;
    
    if (!field_name || !option_value || !option_label) {
      return res.status(400).json({ ok: false, error: "Alle Felder sind erforderlich" });
    }
    
    const result = db.prepare(`
      INSERT INTO dropdown_options (field_name, option_value, option_label, sort_order, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(field_name, option_value, option_label, sort_order);
    
    invalidateCache(`dropdown-${field_name}`);
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Erstellen der Dropdown-Option:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/dropdown-options/:id - Option aktualisieren
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { option_value, option_label, sort_order, is_active } = req.body;
    
    const existing = db.prepare("SELECT * FROM dropdown_options WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Option nicht gefunden" });
    }
    
    db.prepare(`
      UPDATE dropdown_options 
      SET option_value = ?, option_label = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).run(
      option_value || existing.option_value,
      option_label || existing.option_label,
      sort_order !== undefined ? sort_order : existing.sort_order,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );
    
    invalidateCache(`dropdown-${existing.field_name}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren der Dropdown-Option:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/dropdown-options/:id - Option löschen
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const existing = db.prepare("SELECT * FROM dropdown_options WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Option nicht gefunden" });
    }
    
    db.prepare("DELETE FROM dropdown_options WHERE id = ?").run(id);
    invalidateCache(`dropdown-${existing.field_name}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen der Dropdown-Option:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
