// LVS Returns - Datenbank-Seeds (Initialdaten)
// ============================================

const { getDb } = require('./connection');

/**
 * Erstellt Beispiel-Stellplätze
 */
function seedLocations() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM location").get().c;
  
  if (count === 0) {
    const insertLoc = db.prepare(`
      INSERT INTO location (code, description, area, is_active, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    
    // Area D Stellplätze
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 5; col++) {
        const code = `D-${String(row).padStart(2, '0')}-${String(col).padStart(2, '0')}`;
        insertLoc.run(code, `Area D Reihe ${row} Position ${col}`, "Area D", 1, now);
      }
    }
    
    // Crack Area Stellplätze
    for (let row = 1; row <= 5; row++) {
      for (let col = 1; col <= 3; col++) {
        const code = `CRACK-${String(row).padStart(2, '0')}-${String(col).padStart(2, '0')}`;
        insertLoc.run(code, `Crack Area Reihe ${row} Position ${col}`, "Crack", 1, now);
      }
    }
    
    // Waiting Area Stellplätze
    for (let i = 1; i <= 20; i++) {
      const code = `WAIT-${String(i).padStart(3, '0')}`;
      insertLoc.run(code, `Waiting Area Position ${i}`, "Waiting", 1, now);
    }
    
    console.log("✅ Beispiel-Stellplätze erstellt");
  }
}

/**
 * Erstellt Standard-Carrier
 */
function seedCarriers() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM carrier").get().c;
  
  if (count === 0) {
    const now = new Date().toISOString();
    
    // Standard-Felder für alle Carrier
    const allFields = JSON.stringify([
      "cw", "aufgenommen_am", "carrier_name", "land", "ship_status",
      "planned_carton", "actual_carton", "olpn", "carrier_tracking_nr",
      "customer_id", "customer_name", "asn_ra_no", "mh_status", "kommentar"
    ]);
    
    const defaultPlaceholders = JSON.stringify({
      cw: "z.B. CW01",
      olpn: "OLPN scannen",
      carrier_tracking_nr: "Tracking-Nr. scannen"
    });
    
    const standardOlpnValidation = JSON.stringify({
      pattern: "^[A-Z0-9]{6,20}$",
      minLength: 6,
      maxLength: 20,
      message: "OLPN muss 6-20 alphanumerische Zeichen haben"
    });
    
    const standardTrackingValidation = JSON.stringify({
      pattern: "^[A-Z0-9]{8,30}$",
      minLength: 8,
      maxLength: 30,
      message: "Tracking-Nr. muss 8-30 alphanumerische Zeichen haben"
    });
    
    const insertCarrier = db.prepare(`
      INSERT INTO carrier (
        name, display_name, country, default_area, default_stage, 
        default_last_stage, default_ship_status, label_image, label_help_text,
        visible_fields, field_placeholders, olpn_validation, tracking_validation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const carriers = [
      { name: "DPD", display: "DPD", country: "FR" },
      { name: "GLS", display: "GLS", country: "DE" },
      { name: "DHL", display: "DHL", country: "DE" },
      { name: "UPS", display: "UPS", country: "US" },
      { name: "FedEx", display: "FedEx", country: "US" },
      { name: "Hermes", display: "Hermes", country: "DE" },
      { name: "Amazon", display: "Amazon", country: "" },
      { name: "Zalando", display: "Zalando", country: "" },
      { name: "Postnord", display: "Postnord", country: "SE" },
      { name: "Dachser", display: "Dachser", country: "DE" }
    ];
    
    for (const carrier of carriers) {
      try {
        insertCarrier.run(
          carrier.name, carrier.display, carrier.country,
          "", "", "", "",
          `/images/CarrierLabels/${carrier.name}.jpg`, "",
          allFields, defaultPlaceholders,
          standardOlpnValidation, standardTrackingValidation, now
        );
      } catch (e) {
        // Carrier existiert bereits
      }
    }
    
    console.log("✅ Standard-Carrier erstellt");
  }
}

/**
 * Erstellt Dropdown-Optionen
 */
function seedDropdownOptions() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM dropdown_options").get().c;
  
  if (count === 0) {
    const insertDropdown = db.prepare(`
      INSERT INTO dropdown_options (field_name, option_value, option_label, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    // Area Optionen
    const areas = [
      { value: "Area D", label: "Area D", order: 1 },
      { value: "Crack", label: "Crack", order: 2 },
      { value: "Waiting / Zombieland", label: "Waiting / Zombieland", order: 3 },
      { value: "Gültige Gasse", label: "Gültige Gasse", order: 4 },
      { value: "Customize", label: "Customize", order: 5 },
      { value: "Oben", label: "Oben", order: 6 },
      { value: "Unbekannt/ altlast", label: "Unbekannt/ altlast", order: 7 }
    ];
    
    for (const area of areas) {
      insertDropdown.run("area", area.value, area.label, area.order);
    }

    // Land Optionen
    const countries = [
      { value: "DE", label: "Deutschland (DE)", order: 1 },
      { value: "FR", label: "Frankreich (FR)", order: 2 },
      { value: "IT", label: "Italien (IT)", order: 3 },
      { value: "ES", label: "Spanien (ES)", order: 4 },
      { value: "NL", label: "Niederlande (NL)", order: 5 },
      { value: "BE", label: "Belgien (BE)", order: 6 },
      { value: "AT", label: "Österreich (AT)", order: 7 },
      { value: "CH", label: "Schweiz (CH)", order: 8 },
      { value: "PL", label: "Polen (PL)", order: 9 },
      { value: "SE", label: "Schweden (SE)", order: 10 },
      { value: "DK", label: "Dänemark (DK)", order: 11 },
      { value: "US", label: "USA (US)", order: 12 },
      { value: "GB", label: "Großbritannien (GB)", order: 13 }
    ];
    
    for (const country of countries) {
      insertDropdown.run("land", country.value, country.label, country.order);
    }
    
    console.log("✅ Dropdown-Optionen erstellt");
  }
}

/**
 * Führt alle Seeds aus
 */
function runAllSeeds() {
  seedLocations();
  seedCarriers();
  seedDropdownOptions();
  console.log('✅ Alle Seeds abgeschlossen');
}

module.exports = {
  seedLocations,
  seedCarriers,
  seedDropdownOptions,
  runAllSeeds
};
