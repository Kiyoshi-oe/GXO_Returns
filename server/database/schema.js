// LVS Returns - Datenbank-Schema
// ============================================

const { getDb } = require('./connection');

/**
 * Erstellt alle Tabellen
 */
function createTables() {
  const db = getDb();
  
  db.exec(`
    -- Stellplätze
    CREATE TABLE IF NOT EXISTS location (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      area TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      created_by TEXT
    );

    -- Paletten (Legacy)
    CREATE TABLE IF NOT EXISTS pallet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pallet_number TEXT NOT NULL UNIQUE,
      location_id INTEGER,
      status TEXT DEFAULT 'aktiv',
      created_at TEXT,
      archived_at TEXT,
      FOREIGN KEY(location_id) REFERENCES location(id)
    );

    -- RA-Nummern
    CREATE TABLE IF NOT EXISTS ra_number (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ra_number TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'offen',
      customer TEXT,
      created_at TEXT,
      closed_at TEXT
    );

    -- Kartons (Legacy)
    CREATE TABLE IF NOT EXISTS carton (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carton_number TEXT NOT NULL,
      sku TEXT,
      quantity INTEGER,
      pallet_id INTEGER,
      ra_number_id INTEGER,
      received_at TEXT,
      registered_at TEXT,
      is_valid_ra INTEGER,
      FOREIGN KEY(pallet_id) REFERENCES pallet(id),
      FOREIGN KEY(ra_number_id) REFERENCES ra_number(id)
    );

    -- Umlagerungen
    CREATE TABLE IF NOT EXISTS movement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carton_id INTEGER,
      pallet_id INTEGER,
      inbound_id INTEGER,
      from_location_id INTEGER,
      to_location_id INTEGER,
      moved_at TEXT,
      moved_by TEXT,
      reason TEXT,
      FOREIGN KEY(carton_id) REFERENCES carton(id),
      FOREIGN KEY(pallet_id) REFERENCES pallet(id),
      FOREIGN KEY(inbound_id) REFERENCES inbound_simple(id),
      FOREIGN KEY(from_location_id) REFERENCES location(id),
      FOREIGN KEY(to_location_id) REFERENCES location(id)
    );

    -- Carrier Stammdaten
    CREATE TABLE IF NOT EXISTS carrier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      country TEXT,
      is_active INTEGER DEFAULT 1,
      default_area TEXT,
      default_stage TEXT,
      default_last_stage TEXT,
      default_ship_status TEXT,
      label_image TEXT,
      label_help_text TEXT,
      visible_fields TEXT,
      field_placeholders TEXT,
      olpn_validation TEXT,
      tracking_validation TEXT,
      bulk_fixed_fields TEXT,
      bulk_variable_fields TEXT,
      field_requirements TEXT,
      show_labels_1to1 INTEGER DEFAULT 0,
      operator_fields_config TEXT,
      created_at TEXT
    );

    -- Dropdown Optionen
    CREATE TABLE IF NOT EXISTS dropdown_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_name TEXT NOT NULL,
      option_value TEXT NOT NULL,
      option_label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    -- Wareneingänge (Haupttabelle)
    CREATE TABLE IF NOT EXISTS inbound_simple (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cw TEXT,
      aufgenommen_am TEXT,
      ignore_flag INTEGER DEFAULT 0,
      area TEXT,
      stage TEXT,
      last_stage TEXT,
      carrier_name TEXT,
      land TEXT,
      ship_status TEXT,
      planned_carton INTEGER,
      actual_carton INTEGER,
      olpn TEXT,
      dn TEXT,
      shi TEXT,
      carrier_tracking_nr TEXT,
      customer_id TEXT,
      customer_name TEXT,
      asn_ra_no TEXT,
      neue_ra TEXT,
      new_reopen_ra TEXT,
      mh_status TEXT,
      kommentar TEXT,
      added_by TEXT,
      created_at TEXT,
      location_id INTEGER,
      FOREIGN KEY(location_id) REFERENCES location(id)
    );
    
    -- Lager-Buchungen
    CREATE TABLE IF NOT EXISTS warehouse_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inbound_id INTEGER,
      location_id INTEGER NOT NULL,
      carton_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      booked_at TEXT,
      booked_by TEXT,
      moved_at TEXT,
      moved_by TEXT,
      FOREIGN KEY(inbound_id) REFERENCES inbound_simple(id),
      FOREIGN KEY(location_id) REFERENCES location(id)
    );
    
    -- Audit-Log
    CREATE TABLE IF NOT EXISTS inbound_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inbound_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT,
      change_reason TEXT,
      changed_at TEXT,
      FOREIGN KEY(inbound_id) REFERENCES inbound_simple(id)
    );
    
    -- Archiv
    CREATE TABLE IF NOT EXISTS archive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inbound_id INTEGER,
      location_id INTEGER,
      archived_at TEXT,
      archived_by TEXT,
      reason TEXT,
      notes TEXT,
      FOREIGN KEY(inbound_id) REFERENCES inbound_simple(id),
      FOREIGN KEY(location_id) REFERENCES location(id)
    );
  `);
  
  console.log('✅ Datenbank-Schema erstellt');
}

/**
 * Führt Migrationen durch (neue Spalten hinzufügen)
 */
function runMigrations() {
  const db = getDb();
  
  const migrations = [
    // Carrier-Validierungsspalten
    { table: 'carrier', column: 'olpn_validation', sql: 'ALTER TABLE carrier ADD COLUMN olpn_validation TEXT' },
    { table: 'carrier', column: 'tracking_validation', sql: 'ALTER TABLE carrier ADD COLUMN tracking_validation TEXT' },
    { table: 'carrier', column: 'bulk_fixed_fields', sql: 'ALTER TABLE carrier ADD COLUMN bulk_fixed_fields TEXT' },
    { table: 'carrier', column: 'bulk_variable_fields', sql: 'ALTER TABLE carrier ADD COLUMN bulk_variable_fields TEXT' },
    { table: 'carrier', column: 'field_requirements', sql: 'ALTER TABLE carrier ADD COLUMN field_requirements TEXT' },
    { table: 'carrier', column: 'show_labels_1to1', sql: 'ALTER TABLE carrier ADD COLUMN show_labels_1to1 INTEGER DEFAULT 0' },
    { table: 'carrier', column: 'operator_fields_config', sql: 'ALTER TABLE carrier ADD COLUMN operator_fields_config TEXT' },
    
    // Location-Spalten
    { table: 'location', column: 'area', sql: 'ALTER TABLE location ADD COLUMN area TEXT' },
    { table: 'location', column: 'created_at', sql: 'ALTER TABLE location ADD COLUMN created_at TEXT' },
    { table: 'location', column: 'created_by', sql: 'ALTER TABLE location ADD COLUMN created_by TEXT' },
    
    // Inbound-Spalten
    { table: 'inbound_simple', column: 'location_id', sql: 'ALTER TABLE inbound_simple ADD COLUMN location_id INTEGER' },
    
    // Movement-Spalten
    { table: 'movement', column: 'inbound_id', sql: 'ALTER TABLE movement ADD COLUMN inbound_id INTEGER' }
  ];
  
  for (const migration of migrations) {
    try {
      db.prepare(`SELECT ${migration.column} FROM ${migration.table} LIMIT 1`).get();
    } catch (e) {
      try {
        db.exec(migration.sql);
        console.log(`✅ Migration: ${migration.column} zu ${migration.table} hinzugefügt`);
      } catch (err) {
        // Spalte existiert bereits oder anderer Fehler
      }
    }
  }
  
  console.log('✅ Migrationen abgeschlossen');
}

module.exports = {
  createTables,
  runMigrations
};
