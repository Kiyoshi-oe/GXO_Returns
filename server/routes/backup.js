// LVS Returns - Backup API Routes
// ============================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getDb, setDb, reinitStatements } = require('../database');
const Database = require('better-sqlite3');

const backupsDir = config.database.backupsDir;
const backupSettingsFile = config.database.settingsFile;

// Stelle sicher, dass Backups-Ordner existiert
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Backup-Einstellungen laden
function loadBackupSettings() {
  try {
    if (fs.existsSync(backupSettingsFile)) {
      return JSON.parse(fs.readFileSync(backupSettingsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Fehler beim Laden der Backup-Einstellungen:', err);
  }
  return {
    enabled: false,
    interval: config.backup.defaultInterval,
    maxBackups: config.backup.maxBackups,
    lastBackup: null,
    nextBackup: null
  };
}

// Backup-Einstellungen speichern
function saveBackupSettings(settings) {
  try {
    fs.writeFileSync(backupSettingsFile, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Fehler beim Speichern der Backup-Einstellungen:', err);
    return false;
  }
}

// Backup erstellen
function createBackup(customName = null) {
  try {
    const db = getDb();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const name = customName ? `${customName}_${timestamp}` : `backup_${timestamp}`;
    const backupFileName = `${name}.db`;
    const backupPath = path.join(backupsDir, backupFileName);
    const dbPath = config.database.path;
    
    // Datenbank schließen, kopieren, wieder öffnen
    db.close();
    fs.copyFileSync(dbPath, backupPath);
    const newDb = new Database(dbPath);
    setDb(newDb);
    
    // Prepared Statements neu initialisieren
    reinitStatements();
    
    const stats = fs.statSync(backupPath);
    return {
      ok: true,
      filename: backupFileName,
      path: backupPath,
      size: stats.size,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Fehler beim Erstellen des Backups:', err);
    // Versuche Datenbank wieder zu öffnen
    try {
      const newDb = new Database(config.database.path);
      setDb(newDb);
    } catch (e) {
      console.error('Kritischer Fehler: Datenbank konnte nicht wieder geöffnet werden:', e);
    }
    throw err;
  }
}

// Alte Backups aufräumen
function cleanupOldBackups() {
  try {
    const settings = loadBackupSettings();
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.db') && file.startsWith('auto_'))
      .map(file => ({
        name: file,
        path: path.join(backupsDir, file),
        time: fs.statSync(path.join(backupsDir, file)).birthtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Lösche alte Auto-Backups über dem Limit
    if (files.length > settings.maxBackups) {
      const toDelete = files.slice(settings.maxBackups);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Altes Backup gelöscht: ${file.name}`);
      }
    }
  } catch (err) {
    console.error('Fehler beim Aufräumen alter Backups:', err);
  }
}

// GET /api/backup/list - Backup-Liste
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          isAuto: file.startsWith('auto_')
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ ok: true, backups: files });
  } catch (err) {
    console.error("Fehler beim Abrufen der Backup-Liste:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/backup/create - Manuelles Backup erstellen
router.post('/create', (req, res) => {
  try {
    const { name } = req.body;
    const backup = createBackup(name);
    res.json({ ok: true, backup });
  } catch (err) {
    console.error("Fehler beim Erstellen des Backups:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/backup/restore - Backup wiederherstellen
router.post('/restore', (req, res) => {
  try {
    const db = getDb();
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ ok: false, error: 'Dateiname erforderlich' });
    }
    
    const backupPath = path.join(backupsDir, filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ ok: false, error: 'Backup nicht gefunden' });
    }
    
    const dbPath = config.database.path;
    
    // Aktuelles Backup erstellen vor Wiederherstellung
    try {
      createBackup('vor-wiederherstellung');
    } catch (e) {
      console.warn('Konnte kein Sicherungs-Backup erstellen:', e);
    }
    
    // Datenbank schließen
    db.close();
    
    // Backup wiederherstellen
    fs.copyFileSync(backupPath, dbPath);
    
    // Datenbank wieder öffnen
    const newDb = new Database(dbPath);
    setDb(newDb);
    reinitStatements();
    
    res.json({ ok: true, message: 'Backup erfolgreich wiederhergestellt' });
  } catch (err) {
    console.error("Fehler bei der Wiederherstellung:", err);
    // Versuche Datenbank wieder zu öffnen
    try {
      const newDb = new Database(config.database.path);
      setDb(newDb);
    } catch (e) {
      console.error('Kritischer Fehler:', e);
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/backup/:filename - Backup löschen
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(backupsDir, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ ok: false, error: 'Backup nicht gefunden' });
    }
    
    fs.unlinkSync(backupPath);
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Backups:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/backup/settings - Backup-Einstellungen abrufen
router.get('/settings', (req, res) => {
  try {
    const settings = loadBackupSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/backup/settings - Backup-Einstellungen speichern
router.put('/settings', (req, res) => {
  try {
    const { enabled, interval, maxBackups } = req.body;
    const settings = loadBackupSettings();
    
    if (enabled !== undefined) settings.enabled = enabled;
    if (interval !== undefined) settings.interval = interval;
    if (maxBackups !== undefined) settings.maxBackups = maxBackups;
    
    saveBackupSettings(settings);
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Export für Auto-Backup Funktion
module.exports = router;
module.exports.createBackup = createBackup;
module.exports.cleanupOldBackups = cleanupOldBackups;
module.exports.loadBackupSettings = loadBackupSettings;
module.exports.saveBackupSettings = saveBackupSettings;
