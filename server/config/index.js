// LVS Returns - Konfiguration
// ============================================

const path = require('path');

module.exports = {
  // Server-Konfiguration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // Datenbank-Konfiguration
  database: {
    path: path.join(__dirname, '../../lager.db'),
    backupsDir: path.join(__dirname, '../../backups'),
    settingsFile: path.join(__dirname, '../../backup-settings.json')
  },
  
  // Sicherheit
  security: {
    settingsPassword: process.env.SETTINGS_PASSWORD || '0000'
  },
  
  // Upload-Konfiguration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.xlsx', '.xls', '.csv']
  },
  
  // Cache-Konfiguration
  cache: {
    ttl: 5 * 60 * 1000 // 5 Minuten
  },
  
  // Backup-Konfiguration
  backup: {
    defaultInterval: 24, // Stunden
    maxBackups: 10
  },
  
  // Pfade
  paths: {
    root: path.join(__dirname, '../..'),
    public: path.join(__dirname, '../../public'),
    pages: path.join(__dirname, '../../public/pages')
  }
};
