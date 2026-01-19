// LVS Returns - Prepared Statements
// ============================================

const { getDb } = require('./connection');

let stmts = {};

/**
 * Initialisiert alle Prepared Statements
 */
function initStatements() {
  const db = getDb();
  
  stmts = {
    // Carrier
    carriers: db.prepare(`
      SELECT id, name, display_name, country, is_active, default_area, default_stage, 
             default_last_stage, default_ship_status, label_image, label_help_text,
             visible_fields, field_placeholders, olpn_validation, tracking_validation,
             bulk_fixed_fields, bulk_variable_fields, field_requirements, show_labels_1to1,
             operator_fields_config
      FROM carrier 
      WHERE is_active = 1 
      ORDER BY display_name
    `),
    
    carrierById: db.prepare(`
      SELECT * FROM carrier WHERE id = ?
    `),
    
    carrierByName: db.prepare(`
      SELECT * FROM carrier WHERE name = ?
    `),
    
    // Locations
    locations: db.prepare(`
      SELECT id, code, description, area, is_active, created_at
      FROM location
      WHERE is_active = 1
      ORDER BY code
    `),
    
    locationById: db.prepare(`
      SELECT * FROM location WHERE id = ?
    `),
    
    locationByCode: db.prepare(`
      SELECT * FROM location WHERE code = ?
    `),
    
    // Dropdown Options
    dropdownOptions: {
      area: db.prepare(`
        SELECT id, option_value, option_label, sort_order
        FROM dropdown_options
        WHERE field_name = 'area' AND is_active = 1
        ORDER BY sort_order
      `),
      land: db.prepare(`
        SELECT id, option_value, option_label, sort_order
        FROM dropdown_options
        WHERE field_name = 'land' AND is_active = 1
        ORDER BY sort_order
      `)
    },
    
    // Dashboard Stats
    dashboardStats: {
      totalLocations: db.prepare(`
        SELECT COUNT(*) as c FROM location WHERE is_active = 1
      `),
      occupiedLocations: db.prepare(`
        SELECT COUNT(DISTINCT location_id) as c 
        FROM inbound_simple 
        WHERE location_id IS NOT NULL AND ignore_flag = 0
      `),
      totalCartons: db.prepare(`
        SELECT COALESCE(SUM(actual_carton), 0) as total
        FROM inbound_simple
        WHERE ignore_flag = 0 AND actual_carton IS NOT NULL
      `),
      totalEntries: db.prepare(`
        SELECT COUNT(*) as c FROM inbound_simple WHERE ignore_flag = 0
      `),
      openRAs: db.prepare(`
        SELECT COUNT(*) as c
        FROM inbound_simple
        WHERE asn_ra_no IS NOT NULL AND asn_ra_no != '' 
          AND (mh_status IS NULL OR mh_status != 'geschlossen')
          AND ignore_flag = 0
      `),
      unclearRAs: db.prepare(`
        SELECT COUNT(*) as c
        FROM inbound_simple
        WHERE (asn_ra_no IS NULL OR asn_ra_no = '')
          AND ignore_flag = 0
      `)
    },
    
    // Warehouse
    warehouseAreas: db.prepare(`
      SELECT DISTINCT area
      FROM location
      WHERE area IS NOT NULL AND area != '' AND is_active = 1
      ORDER BY area
    `),
    
    // Inbound
    inboundById: db.prepare(`
      SELECT * FROM inbound_simple WHERE id = ?
    `),
    
    inboundByOlpn: db.prepare(`
      SELECT * FROM inbound_simple WHERE olpn = ? AND ignore_flag = 0 LIMIT 1
    `),
    
    inboundByTracking: db.prepare(`
      SELECT * FROM inbound_simple WHERE carrier_tracking_nr = ? AND ignore_flag = 0 LIMIT 1
    `)
  };
  
  console.log("✅ Prepared Statements initialisiert");
  return stmts;
}

/**
 * Gibt die Prepared Statements zurück
 * @returns {Object} Die Prepared Statements
 */
function getStatements() {
  if (Object.keys(stmts).length === 0) {
    return initStatements();
  }
  return stmts;
}

/**
 * Reinitialisiert die Prepared Statements (nach DB-Änderungen)
 */
function reinitStatements() {
  stmts = {};
  return initStatements();
}

module.exports = {
  initStatements,
  getStatements,
  reinitStatements
};
