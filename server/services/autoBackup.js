// LVS Returns - Auto-Backup Service
// ============================================

const { createBackup, cleanupOldBackups, loadBackupSettings, saveBackupSettings } = require('../routes/backup');

let autoBackupTimer = null;

/**
 * Startet das automatische Backup-System
 */
function startAutoBackup() {
  const settings = loadBackupSettings();
  
  if (!settings.enabled) {
    console.log('ℹ️ Automatische Backups sind deaktiviert');
    return;
  }
  
  console.log(`🔄 Auto-Backup aktiviert (Intervall: ${settings.interval} Stunden)`);
  
  // Prüfen ob Backup fällig ist
  function checkAndBackup() {
    const currentSettings = loadBackupSettings();
    
    if (!currentSettings.enabled) {
      stopAutoBackup();
      return;
    }
    
    const now = new Date();
    const lastBackup = currentSettings.lastBackup ? new Date(currentSettings.lastBackup) : null;
    const intervalMs = currentSettings.interval * 60 * 60 * 1000;
    
    // Backup erstellen wenn fällig
    if (!lastBackup || (now - lastBackup) >= intervalMs) {
      try {
        console.log('🔄 Erstelle automatisches Backup...');
        createBackup('auto');
        
        // Einstellungen aktualisieren
        currentSettings.lastBackup = now.toISOString();
        currentSettings.nextBackup = new Date(now.getTime() + intervalMs).toISOString();
        saveBackupSettings(currentSettings);
        
        // Alte Backups aufräumen
        cleanupOldBackups();
        
        console.log('✅ Automatisches Backup erstellt');
      } catch (err) {
        console.error('❌ Fehler beim automatischen Backup:', err);
      }
    }
  }
  
  // Sofort prüfen
  checkAndBackup();
  
  // Timer starten (alle 60 Minuten prüfen)
  autoBackupTimer = setInterval(checkAndBackup, 60 * 60 * 1000);
}

/**
 * Stoppt das automatische Backup-System
 */
function stopAutoBackup() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
    console.log('⏹️ Auto-Backup gestoppt');
  }
}

/**
 * Neustart des Auto-Backup-Systems
 */
function restartAutoBackup() {
  stopAutoBackup();
  startAutoBackup();
}

module.exports = {
  startAutoBackup,
  stopAutoBackup,
  restartAutoBackup
};
