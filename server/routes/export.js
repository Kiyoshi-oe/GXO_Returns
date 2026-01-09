// LVS Returns - Export API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/export/preview - Vorschau der Export-Daten
router.get('/preview', (req, res) => {
  try {
    const db = getDb();
    const { 
      table = 'inbound_simple',
      limit = 100,
      include_archived = 'false',
      columns
    } = req.query;
    
    let sql = '';
    let countSql = '';
    
    if (table === 'inbound_simple') {
      const whereClause = include_archived === 'true' ? '' : 'WHERE i.ignore_flag = 0';
      
      sql = `
        SELECT 
          i.id,
          i.cw,
          i.aufgenommen_am,
          i.carrier_name,
          i.carrier_tracking_nr,
          i.olpn,
          i.dn,
          i.shi,
          i.customer_id,
          i.customer_name,
          i.asn_ra_no,
          i.area,
          i.stage,
          i.land,
          i.ship_status,
          i.planned_carton,
          i.actual_carton,
          i.mh_status,
          i.kommentar,
          i.created_at,
          i.added_by,
          l.code as location_code,
          l.description as location_description
        FROM inbound_simple i
        LEFT JOIN location l ON i.location_id = l.id
        ${whereClause}
        ORDER BY i.created_at DESC
        LIMIT ?
      `;
      
      countSql = `SELECT COUNT(*) as total FROM inbound_simple i ${whereClause}`;
    } else if (table === 'locations') {
      sql = `
        SELECT 
          l.id,
          l.code,
          l.description,
          l.area,
          l.is_active,
          l.created_at,
          COUNT(DISTINCT i.id) as entry_count,
          SUM(i.actual_carton) as total_cartons
        FROM location l
        LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
        GROUP BY l.id
        ORDER BY l.code
        LIMIT ?
      `;
      countSql = `SELECT COUNT(*) as total FROM location`;
    } else if (table === 'movements') {
      sql = `
        SELECT 
          m.id,
          m.inbound_id,
          m.moved_at,
          m.moved_by,
          m.reason,
          l_from.code as from_location,
          l_to.code as to_location,
          i.cw,
          i.olpn,
          i.carrier_tracking_nr
        FROM movement m
        LEFT JOIN location l_from ON m.from_location_id = l_from.id
        LEFT JOIN location l_to ON m.to_location_id = l_to.id
        LEFT JOIN inbound_simple i ON m.inbound_id = i.id
        ORDER BY m.moved_at DESC
        LIMIT ?
      `;
      countSql = `SELECT COUNT(*) as total FROM movement`;
    } else if (table === 'archive') {
      sql = `
        SELECT 
          a.id,
          a.inbound_id,
          a.archived_at,
          a.archived_by,
          a.reason,
          a.notes,
          i.cw,
          i.olpn,
          i.carrier_name,
          i.carrier_tracking_nr,
          l.code as location_code
        FROM archive a
        LEFT JOIN inbound_simple i ON a.inbound_id = i.id
        LEFT JOIN location l ON a.location_id = l.id
        ORDER BY a.archived_at DESC
        LIMIT ?
      `;
      countSql = `SELECT COUNT(*) as total FROM archive`;
    } else if (table === 'carriers') {
      sql = `
        SELECT 
          id,
          name,
          display_name,
          country,
          is_active,
          default_area,
          default_stage,
          created_at
        FROM carrier
        ORDER BY display_name
        LIMIT ?
      `;
      countSql = `SELECT COUNT(*) as total FROM carrier`;
    } else {
      return res.status(400).json({ ok: false, error: 'Ungültige Tabelle' });
    }
    
    const rows = db.prepare(sql).all(parseInt(limit));
    const totalResult = db.prepare(countSql).get();
    
    res.json({
      ok: true,
      data: rows,
      total: totalResult.total,
      preview: rows.length,
      table
    });
  } catch (err) {
    console.error("Fehler bei Export-Vorschau:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/export/excel - Excel-Export
router.post('/excel', async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const db = getDb();
    
    const { 
      table = 'inbound_simple',
      include_archived = false,
      columns,
      filename = 'export'
    } = req.body;
    
    let sql = '';
    let sheetName = 'Daten';
    
    if (table === 'inbound_simple') {
      const whereClause = include_archived ? '' : 'WHERE i.ignore_flag = 0';
      sql = `
        SELECT 
          i.id as "ID",
          i.cw as "CW",
          i.aufgenommen_am as "Aufgenommen am",
          i.carrier_name as "Carrier",
          i.carrier_tracking_nr as "Tracking Nr",
          i.olpn as "OLPN",
          i.dn as "DN",
          i.shi as "SHI",
          i.customer_id as "Kunden-ID",
          i.customer_name as "Kundenname",
          i.asn_ra_no as "ASN/RA Nr",
          i.area as "Area",
          i.stage as "Stage",
          i.land as "Land",
          i.ship_status as "Ship Status",
          i.planned_carton as "Geplante Kartons",
          i.actual_carton as "Tatsächliche Kartons",
          i.mh_status as "MH Status",
          i.kommentar as "Kommentar",
          i.created_at as "Erstellt am",
          i.added_by as "Hinzugefügt von",
          l.code as "Stellplatz",
          l.description as "Stellplatz-Beschreibung"
        FROM inbound_simple i
        LEFT JOIN location l ON i.location_id = l.id
        ${whereClause}
        ORDER BY i.created_at DESC
      `;
      sheetName = 'Wareneingänge';
    } else if (table === 'locations') {
      sql = `
        SELECT 
          l.id as "ID",
          l.code as "Code",
          l.description as "Beschreibung",
          l.area as "Area",
          CASE WHEN l.is_active = 1 THEN 'Aktiv' ELSE 'Inaktiv' END as "Status",
          l.created_at as "Erstellt am",
          COUNT(DISTINCT i.id) as "Einträge",
          IFNULL(SUM(i.actual_carton), 0) as "Kartons gesamt"
        FROM location l
        LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
        GROUP BY l.id
        ORDER BY l.code
      `;
      sheetName = 'Stellplätze';
    } else if (table === 'movements') {
      sql = `
        SELECT 
          m.id as "ID",
          m.moved_at as "Umgelagert am",
          m.moved_by as "Umgelagert von",
          m.reason as "Grund",
          l_from.code as "Von Stellplatz",
          l_to.code as "Nach Stellplatz",
          i.cw as "CW",
          i.olpn as "OLPN",
          i.carrier_tracking_nr as "Tracking Nr"
        FROM movement m
        LEFT JOIN location l_from ON m.from_location_id = l_from.id
        LEFT JOIN location l_to ON m.to_location_id = l_to.id
        LEFT JOIN inbound_simple i ON m.inbound_id = i.id
        ORDER BY m.moved_at DESC
      `;
      sheetName = 'Umlagerungen';
    } else if (table === 'archive') {
      sql = `
        SELECT 
          a.id as "ID",
          a.archived_at as "Archiviert am",
          a.archived_by as "Archiviert von",
          a.reason as "Grund",
          a.notes as "Notizen",
          i.cw as "CW",
          i.olpn as "OLPN",
          i.carrier_name as "Carrier",
          i.carrier_tracking_nr as "Tracking Nr",
          l.code as "Stellplatz"
        FROM archive a
        LEFT JOIN inbound_simple i ON a.inbound_id = i.id
        LEFT JOIN location l ON a.location_id = l.id
        ORDER BY a.archived_at DESC
      `;
      sheetName = 'Archiv';
    } else if (table === 'carriers') {
      sql = `
        SELECT 
          id as "ID",
          name as "Name",
          display_name as "Anzeigename",
          country as "Land",
          CASE WHEN is_active = 1 THEN 'Aktiv' ELSE 'Inaktiv' END as "Status",
          default_area as "Standard-Area",
          default_stage as "Standard-Stage",
          created_at as "Erstellt am"
        FROM carrier
        ORDER BY display_name
      `;
      sheetName = 'Carrier';
    } else {
      return res.status(400).json({ ok: false, error: 'Ungültige Tabelle' });
    }
    
    const rows = db.prepare(sql).all();
    
    // Excel erstellen
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LVS Returns';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet(sheetName);
    
    if (rows.length > 0) {
      // Header aus ersten Zeile
      const headers = Object.keys(rows[0]);
      worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: Math.max(header.length + 2, 15)
      }));
      
      // Header-Styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      // Daten hinzufügen
      rows.forEach(row => {
        worksheet.addRow(row);
      });
      
      // AutoFilter
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + headers.length)}1`
      };
    }
    
    // Als Buffer senden
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error("Fehler beim Excel-Export:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/export/tables - Verfügbare Tabellen für Export
router.get('/tables', (req, res) => {
  res.json({
    ok: true,
    tables: [
      { id: 'inbound_simple', name: 'Wareneingänge', description: 'Alle Wareneingangs-Daten' },
      { id: 'locations', name: 'Stellplätze', description: 'Alle Lagerstellplätze' },
      { id: 'movements', name: 'Umlagerungen', description: 'Alle Umlagerungsbewegungen' },
      { id: 'archive', name: 'Archiv', description: 'Archivierte Einträge' },
      { id: 'carriers', name: 'Carrier', description: 'Spediteur-Konfigurationen' }
    ]
  });
});

module.exports = router;
