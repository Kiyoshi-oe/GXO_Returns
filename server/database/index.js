// LVS Returns - Datenbank-Modul
// ============================================

const { initConnection, getDb, closeConnection, setDb } = require('./connection');
const { createTables, runMigrations } = require('./schema');
const { runAllSeeds } = require('./seeds');
const { initStatements, getStatements, reinitStatements } = require('./statements');
const { createUserTables, seedRoles, seedDefaultUser } = require('./user-schema');

/**
 * Initialisiert die gesamte Datenbank
 */
function initDatabase() {
  // Verbindung herstellen
  initConnection();
  
  // Schema erstellen
  createTables();
  
  // Benutzer-Tabellen erstellen
  createUserTables();
  
  // Migrationen ausführen
  runMigrations();
  
  // Seeds ausführen
  runAllSeeds();
  
  // Benutzer-Seeds
  seedRoles();
  seedDefaultUser();
  
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
