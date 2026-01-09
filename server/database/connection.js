// LVS Returns - Datenbankverbindung
// ============================================

const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

let db = null;

/**
 * Initialisiert die Datenbankverbindung
 * @returns {Database} Die Datenbankinstanz
 */
function initConnection() {
  if (!db) {
    db = new Database(config.database.path);
    console.log('✅ Datenbankverbindung hergestellt');
  }
  return db;
}

/**
 * Gibt die aktuelle Datenbankinstanz zurück
 * @returns {Database} Die Datenbankinstanz
 */
function getDb() {
  if (!db) {
    return initConnection();
  }
  return db;
}

/**
 * Schließt die Datenbankverbindung
 */
function closeConnection() {
  if (db) {
    db.close();
    db = null;
    console.log('✅ Datenbankverbindung geschlossen');
  }
}

/**
 * Setzt die Datenbankinstanz (z.B. nach Backup-Restore)
 * @param {Database} newDb - Neue Datenbankinstanz
 */
function setDb(newDb) {
  db = newDb;
}

module.exports = {
  initConnection,
  getDb,
  closeConnection,
  setDb
};
