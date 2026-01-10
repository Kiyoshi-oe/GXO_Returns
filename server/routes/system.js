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

module.exports = router;
