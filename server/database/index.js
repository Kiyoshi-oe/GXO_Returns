// LVS Returns - Datenbank-Modul
// ============================================

const { initConnection, getDb, closeConnection, setDb } = require('./connection');
const { createTables, runMigrations } = require('./schema');
const { runAllSeeds } = require('./seeds');
const { initStatements, getStatements, reinitStatements } = require('./statements');

/**
 * Initialisiert die gesamte Datenbank
 */
function initDatabase() {
  // Verbindung herstellen
  initConnection();
  
  // Schema erstellen
  createTables();
  
  // Migrationen ausführen
  runMigrations();
  
  // Seeds ausführen
  runAllSeeds();
  
  // Prepared Statements initialisieren
  initStatements();
  
  console.log('✅ Datenbank vollständig initialisiert');
}

module.exports = {
  // Verbindung
  initConnection,
  getDb,
  closeConnection,
  setDb,
  
  // Schema & Seeds
  createTables,
  runMigrations,
  runAllSeeds,
  
  // Statements
  initStatements,
  getStatements,
  reinitStatements,
  
  // Convenience
  initDatabase
};
