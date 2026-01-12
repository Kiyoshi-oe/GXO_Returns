// LVS Returns - System API Routes (User, Init, etc.)
// ============================================

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { getStatements } = require('../database/statements');
const { getCached } = require('../utils/cache');

const execAsync = promisify(exec);

// GET /api/current-user/windows-username - Nur Windows Username zurückgeben (für Auto-Login)
router.get('/current-user/windows-username', async (req, res) => {
  try {
    let username = process.env.USERNAME || process.env.USER || process.env.LOGNAME;
    
    // Bereinige Username (lowercase, trim)
    if (username) {
      username = username.toLowerCase().trim();
    }
    
    if (username) {
      res.json({ 
        ok: true, 
        username: username
      });
    } else {
      res.status(404).json({ 
        ok: false, 
        error: 'Could not detect Windows username' 
      });
    }
  } catch (err) {
    console.error('Error getting Windows username:', err);
    res.status(500).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

// GET /api/current-user - Windows-Benutzer abrufen
router.get('/current-user', async (req, res) => {
  try {
    const computerName = process.env.COMPUTERNAME || process.env.HOSTNAME || "";
    let username = process.env.USERNAME || "Unbekannt";
    let displayName = username;
    
    // Profilbild suchen
    let profilePicturePath = null;
    try {
      const userProfilePath = process.env.USERPROFILE || path.join('C:', 'Users', username);
      const accountPicturesPath = path.join(userProfilePath, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'AccountPictures');
      
      if (fs.existsSync(accountPicturesPath)) {
        const files = fs.readdirSync(accountPicturesPath);
        const pictureFile = files.find(f => {
          const ext = path.extname(f).toLowerCase();
          return ext === '.jpg' || ext === '.png' || ext === '.jpeg';
        });
        
        if (pictureFile) {
          profilePicturePath = `/api/user-profile-picture?username=${encodeURIComponent(username)}`;
        }
      }
    } catch (err) {
      // Profilbild nicht gefunden - kein Fehler
    }
    
    // Versuche Display-Name über PowerShell zu bekommen (optional)
    try {
      const { stdout } = await execAsync(`powershell -NoProfile -Command "[System.Security.Principal.WindowsIdentity]::GetCurrent().Name"`);
      const fullName = stdout.trim();
      if (fullName.includes('\\')) {
        username = fullName.split('\\')[1];
      }
    } catch (e) {
      // PowerShell fehlgeschlagen - verwende Fallback
    }
    
    res.json({ 
      ok: true, 
      username,
      displayName: displayName || username,
      computerName,
      hasProfilePicture: !!profilePicturePath,
      profilePicturePath
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerinformationen:", error);
    res.json({ 
      ok: true, 
      username: process.env.USERNAME || "Unbekannt",
      displayName: process.env.USERNAME || "Unbekannt",
      computerName: process.env.COMPUTERNAME || "",
      hasProfilePicture: false,
      profilePicturePath: null
    });
  }
});

// GET /api/user-profile-picture - Profilbild servieren
router.get('/user-profile-picture', (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ ok: false, error: 'Username erforderlich' });
    }
    
    const userProfilePath = path.join('C:', 'Users', username);
    const accountPicturesPath = path.join(userProfilePath, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'AccountPictures');
    
    if (!fs.existsSync(accountPicturesPath)) {
      return res.status(404).json({ ok: false, error: 'Profilbild nicht gefunden' });
    }
    
    const files = fs.readdirSync(accountPicturesPath);
    const pictureFile = files.find(f => {
      const ext = path.extname(f).toLowerCase();
      return ext === '.jpg' || ext === '.png' || ext === '.jpeg';
    });
    
    if (!pictureFile) {
      return res.status(404).json({ ok: false, error: 'Profilbild nicht gefunden' });
    }
    
    const picturePath = path.join(accountPicturesPath, pictureFile);
    const ext = path.extname(pictureFile).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(picturePath);
  } catch (err) {
    console.error("Fehler beim Servieren des Profilbilds:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/wareneingang/init - Initialisierungsdaten für Wareneingang
router.get('/wareneingang/init', (req, res) => {
  try {
    const stmts = getStatements();
    
    const data = {
      carriers: getCached('carriers', () => stmts.carriers.all()),
      areas: getCached('dropdown-area', () => stmts.dropdownOptions.area.all()),
      lands: getCached('dropdown-land', () => stmts.dropdownOptions.land.all()),
      locations: getCached('locations', () => stmts.locations.all())
    };
    
    res.json(data);
  } catch (err) {
    console.error("Fehler beim Initialisieren der Wareneingang-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/inventory - Legacy-Endpunkt für Kompatibilität
router.get('/inventory', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    
    const rows = db.prepare(`
      SELECT
        l.id, l.code, l.description,
        IFNULL(COUNT(DISTINCT p.id), 0) as pallet_count,
        IFNULL(COUNT(c.id), 0) as carton_count
      FROM location l
      LEFT JOIN pallet p ON p.location_id = l.id AND p.status = 'aktiv'
      LEFT JOIN carton c ON c.pallet_id = p.id
      WHERE l.is_active = 1
      GROUP BY l.id, l.code, l.description
      ORDER BY l.code
    `).all();
    
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen des Inventars:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/settings/verify-pin - PIN verifizieren
router.post('/settings/verify-pin', (req, res) => {
  const config = require('../config');
  const { pin } = req.body;
  
  if (pin === config.security.settingsPassword) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: "Falscher PIN" });
  }
});

// GET /api/audit-logs - Audit-Logs abrufen
router.get('/audit-logs', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    const { limit = 100, inbound_id, field_name, changed_by, from_date, to_date } = req.query;
    
    let sql = `
      SELECT 
        a.*,
        i.cw,
        i.olpn,
        i.carrier_name
      FROM inbound_audit a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (inbound_id) {
      sql += ` AND a.inbound_id = ?`;
      params.push(inbound_id);
    }
    
    if (field_name) {
      sql += ` AND a.field_name = ?`;
      params.push(field_name);
    }
    
    if (changed_by) {
      sql += ` AND a.changed_by LIKE ?`;
      params.push(`%${changed_by}%`);
    }
    
    if (from_date) {
      sql += ` AND DATE(a.changed_at) >= ?`;
      params.push(from_date);
    }
    
    if (to_date) {
      sql += ` AND DATE(a.changed_at) <= ?`;
      params.push(to_date);
    }
    
    sql += ` ORDER BY a.changed_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const logs = db.prepare(sql).all(...params);
    
    res.json(logs);
  } catch (err) {
    console.error("Fehler beim Abrufen der Audit-Logs:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/audit-logs/fields - Verfügbare Feldnamen für Filter
router.get('/audit-logs/fields', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    
    const fields = db.prepare(`
      SELECT DISTINCT field_name FROM inbound_audit WHERE field_name IS NOT NULL ORDER BY field_name
    `).all().map(row => row.field_name);
    
    res.json(fields);
  } catch (err) {
    console.error("Fehler beim Abrufen der Audit-Feldnamen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/audit-logs/users - Verfügbare Benutzer für Filter
router.get('/audit-logs/users', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    
    const users = db.prepare(`
      SELECT DISTINCT changed_by FROM inbound_audit WHERE changed_by IS NOT NULL ORDER BY changed_by
    `).all().map(row => row.changed_by);
    
    res.json(users);
  } catch (err) {
    console.error("Fehler beim Abrufen der Audit-Benutzer:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/audit-logs/export - Audit-Logs als Excel exportieren
router.get('/audit-logs/export', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    const { inbound_id, field_name, changed_by, from_date, to_date } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.inbound_id,
        a.field_name,
        a.old_value,
        a.new_value,
        a.changed_by,
        a.change_reason,
        a.changed_at,
        i.cw,
        i.olpn,
        i.carrier_name
      FROM inbound_audit a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (inbound_id) {
      sql += ` AND a.inbound_id = ?`;
      params.push(inbound_id);
    }
    if (field_name) {
      sql += ` AND a.field_name = ?`;
      params.push(field_name);
    }
    if (changed_by) {
      sql += ` AND a.changed_by LIKE ?`;
      params.push(`%${changed_by}%`);
    }
    if (from_date) {
      sql += ` AND DATE(a.changed_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND DATE(a.changed_at) <= ?`;
      params.push(toDate);
    }
    
    sql += ` ORDER BY a.changed_at DESC`;
    
    const logs = db.prepare(sql).all(...params);
    
    // Excel-Export (vereinfacht - könnte mit xlsx-Bibliothek verbessert werden)
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit-Log');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Eintrag-ID', key: 'inbound_id', width: 12 },
      { header: 'Feld', key: 'field_name', width: 20 },
      { header: 'Alter Wert', key: 'old_value', width: 30 },
      { header: 'Neuer Wert', key: 'new_value', width: 30 },
      { header: 'Benutzer', key: 'changed_by', width: 20 },
      { header: 'Grund', key: 'change_reason', width: 40 },
      { header: 'Zeitstempel', key: 'changed_at', width: 20 }
    ];
    
    logs.forEach(log => {
      worksheet.addRow({
        id: log.id,
        inbound_id: log.inbound_id,
        field_name: log.field_name,
        old_value: log.old_value || '',
        new_value: log.new_value || '',
        changed_by: log.changed_by || '',
        change_reason: log.change_reason || '',
        changed_at: log.changed_at ? new Date(log.changed_at).toLocaleString('de-DE') : ''
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=audit-log-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (err) {
    console.error("Fehler beim Export der Audit-Logs:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/audit-logs/compliance-report - Compliance-Report generieren
router.get('/audit-logs/compliance-report', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    const { from_date, to_date, format = 'pdf' } = req.query;
    
    let sql = `
      SELECT 
        a.*,
        i.cw,
        i.olpn,
        i.carrier_name
      FROM inbound_audit a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (from_date) {
      sql += ` AND DATE(a.changed_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND DATE(a.changed_at) <= ?`;
      params.push(to_date);
    }
    
    sql += ` ORDER BY a.changed_at DESC`;
    
    const logs = db.prepare(sql).all(...params);
    
    // Statistiken
    const stats = {
      total_changes: logs.length,
      unique_users: new Set(logs.map(l => l.changed_by)).size,
      unique_entries: new Set(logs.map(l => l.inbound_id)).size,
      changes_by_field: {}
    };
    
    logs.forEach(log => {
      stats.changes_by_field[log.field_name] = (stats.changes_by_field[log.field_name] || 0) + 1;
    });
    
    // PDF-Export (vereinfacht - könnte mit pdfkit verbessert werden)
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=compliance-report-${from_date}-${to_date}.pdf`);
      res.json({ ok: true, logs, stats, message: 'PDF-Export wird implementiert' });
    } else {
      res.json({ ok: true, logs, stats });
    }
  } catch (err) {
    console.error("Fehler beim Generieren des Compliance-Reports:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/audit-logs/user-activity - Benutzer-Aktivität abrufen
router.get('/audit-logs/user-activity', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    const { user_id, from_date, to_date } = req.query;
    
    let sql = `
      SELECT 
        ual.*,
        u.username
      FROM user_audit_log ual
      LEFT JOIN users u ON ual.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (user_id) {
      sql += ` AND ual.user_id = ?`;
      params.push(user_id);
    }
    if (from_date) {
      sql += ` AND DATE(ual.created_at) >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND DATE(ual.created_at) <= ?`;
      params.push(to_date);
    }
    
    sql += ` ORDER BY ual.created_at DESC LIMIT 1000`;
    
    const activity = db.prepare(sql).all(...params);
    
    res.json(activity);
  } catch (err) {
    console.error("Fehler beim Abrufen der Benutzer-Aktivität:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/audit-logs/integrity-check - Daten-Integritäts-Prüfung
router.get('/audit-logs/integrity-check', (req, res) => {
  try {
    const { getDb } = require('../database');
    const db = getDb();
    
    const issues = [];
    const stats = {
      total_entries: 0,
      checked_fields: 0
    };
    
    // Prüfe auf fehlende Referenzen
    const orphanedAudits = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inbound_audit a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      WHERE i.id IS NULL
    `).get();
    
    if (orphanedAudits.count > 0) {
      issues.push(`${orphanedAudits.count} Audit-Einträge mit ungültiger Eintrag-ID gefunden`);
    }
    
    // Prüfe auf fehlende Benutzer
    const auditsWithoutUser = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inbound_audit 
      WHERE changed_by IS NULL OR changed_by = ''
    `).get();
    
    if (auditsWithoutUser.count > 0) {
      issues.push(`${auditsWithoutUser.count} Audit-Einträge ohne Benutzer-Information gefunden`);
    }
    
    // Prüfe auf doppelte Einträge
    const duplicateAudits = db.prepare(`
      SELECT inbound_id, field_name, changed_at, COUNT(*) as count
      FROM inbound_audit
      GROUP BY inbound_id, field_name, changed_at
      HAVING count > 1
    `).all();
    
    if (duplicateAudits.length > 0) {
      issues.push(`${duplicateAudits.length} mögliche doppelte Audit-Einträge gefunden`);
    }
    
    // Gesamtstatistiken
    stats.total_entries = db.prepare('SELECT COUNT(*) as count FROM inbound_audit').get().count;
    stats.checked_fields = db.prepare('SELECT COUNT(DISTINCT field_name) as count FROM inbound_audit').get().count;
    
    res.json({ ok: true, issues, stats });
  } catch (err) {
    console.error("Fehler bei der Daten-Integritäts-Prüfung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
