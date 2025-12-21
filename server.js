const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const cors = require("cors");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const fs = require("fs");

const app = express();
const port = 3000;

const SETTINGS_PASSWORD = "0000";

// Middleware
app.use(cors());
app.use(express.json());

// Datenbank öffnen
const db = new Database(path.join(__dirname, "lager.db"));

function initDb() {
  db.exec(`
    create table if not exists location (
      id integer primary key autoincrement,
      code text not null unique,
      description text,
      area text,
      is_active integer default 1,
      created_at text,
      created_by text
    );

    create table if not exists pallet (
      id integer primary key autoincrement,
      pallet_number text not null unique,
      location_id integer,
      status text default 'aktiv',
      created_at text,
      archived_at text,
      foreign key(location_id) references location(id)
    );

    create table if not exists ra_number (
      id integer primary key autoincrement,
      ra_number text not null unique,
      status text default 'offen',
      customer text,
      created_at text,
      closed_at text
    );

    create table if not exists carton (
      id integer primary key autoincrement,
      carton_number text not null,
      sku text,
      quantity integer,
      pallet_id integer,
      ra_number_id integer,
      received_at text,
      registered_at text,
      is_valid_ra integer,
      foreign key(pallet_id) references pallet(id),
      foreign key(ra_number_id) references ra_number(id)
    );

    create table if not exists movement (
      id integer primary key autoincrement,
      carton_id integer,
      pallet_id integer,
      from_location_id integer,
      to_location_id integer,
      moved_at text,
      moved_by text,
      reason text,
      foreign key(carton_id) references carton(id),
      foreign key(pallet_id) references pallet(id),
      foreign key(from_location_id) references location(id),
      foreign key(to_location_id) references location(id)
    );

    /* Carrier Stammdaten für Buttons und Regeln */
    create table if not exists carrier (
      id integer primary key autoincrement,
      name text not null unique,          -- interner Name, zum Beispiel 'DPD'
      display_name text not null,         -- Anzeige Text
      country text,                       -- Standard Land zum Beispiel 'FR'
      is_active integer default 1,
      default_area text,                  -- zum Beispiel 'Waiting / Zombieland'
      default_stage text,                 -- zum Beispiel 'Waiting Area Returns Line 68'
      default_last_stage text,
      default_ship_status text,
      label_image text,                   -- Pfad zum Label-Beispiel-Bild
      label_help_text text,               -- Hilfetext für Label-Felder
      visible_fields text,                -- JSON Array der sichtbaren Felder
      field_placeholders text,            -- JSON Object mit Platzhalter-Texten
      olpn_validation text,               -- JSON Object mit OLPN Validierungsregeln
      tracking_validation text,           -- JSON Object mit Tracking Number Validierungsregeln
      created_at text
    );


    /* Dropdown Optionen */
    create table if not exists dropdown_options (
      id integer primary key autoincrement,
      field_name text not null,           -- 'area' oder 'land'
      option_value text not null,
      option_label text not null,
      sort_order integer default 0,
      is_active integer default 1
    );

    /* Einfache Wareneingangs Tabelle entsprechend deiner Excel Zeile */
    create table if not exists inbound_simple (
      id integer primary key autoincrement,
      cw text,
      aufgenommen_am text,
      ignore_flag integer default 0,
      area text,
      stage text,
      last_stage text,
      carrier_name text,
      land text,
      ship_status text,
      planned_carton integer,
      actual_carton integer,
      olpn text,
      dn text,
      shi text,
      carrier_tracking_nr text,
      customer_id text,
      customer_name text,
      asn_ra_no text,
      neue_ra text,
      new_reopen_ra text,
      mh_status text,
      kommentar text,
      added_by text,
      created_at text,
      location_id integer,
      foreign key(location_id) references location(id)
    );
    
    /* Lager-Buchungen für detaillierte Tracking */
    create table if not exists warehouse_stock (
      id integer primary key autoincrement,
      inbound_id integer,
      location_id integer not null,
      carton_count integer default 1,
      status text default 'active',
      booked_at text,
      booked_by text,
      moved_at text,
      moved_by text,
      foreign key(inbound_id) references inbound_simple(id),
      foreign key(location_id) references location(id)
    );
    
    /* Audit-Log für Änderungen an inbound_simple Einträgen */
    create table if not exists inbound_audit (
      id integer primary key autoincrement,
      inbound_id integer not null,
      field_name text not null,
      old_value text,
      new_value text,
      changed_by text,
      change_reason text,
      changed_at text,
      foreign key(inbound_id) references inbound_simple(id)
    );
  `);

  // Stellplätze Beispiel
  const countLocation = db.prepare("select count(*) as c from location").get().c;
  if (countLocation === 0) {
    const insertLoc = db.prepare("insert into location (code, description, area, is_active, created_at) values (?, ?, ?, ?, ?)");
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

  // Prüfe ob die neuen Spalten existieren, falls nicht, füge sie hinzu
  try {
    db.prepare("select olpn_validation from carrier limit 1").get();
  } catch (e) {
    // Spalten existieren nicht, füge sie hinzu
    console.log("Füge neue Validierungsspalten hinzu...");
    db.exec(`
      alter table carrier add column olpn_validation text;
      alter table carrier add column tracking_validation text;
    `);
  }
  
  // Prüfe ob Bulk-Felder Spalten existieren
  try {
    db.prepare("select bulk_fixed_fields from carrier limit 1").get();
  } catch (e) {
    console.log("Füge Bulk-Felder Spalten hinzu...");
    db.exec(`
      alter table carrier add column bulk_fixed_fields text;
      alter table carrier add column bulk_variable_fields text;
    `);
  }
  
  // Prüfe ob location area Spalte existiert
  try {
    db.prepare("select area from location limit 1").get();
  } catch (e) {
    console.log("Füge area Spalte zu location hinzu...");
    db.exec(`
      alter table location add column area text;
      alter table location add column created_at text;
      alter table location add column created_by text;
    `);
  }
  
  // Prüfe ob inbound_simple location_id Spalte existiert
  try {
    db.prepare("select location_id from inbound_simple limit 1").get();
  } catch (e) {
    console.log("Füge location_id Spalte zu inbound_simple hinzu...");
    db.exec(`
      alter table inbound_simple add column location_id integer;
    `);
  }
  
  // Prüfe ob inbound_audit Tabelle existiert
  try {
    db.prepare("select * from inbound_audit limit 1").get();
  } catch (e) {
    console.log("Erstelle inbound_audit Tabelle...");
    db.exec(`
      create table if not exists inbound_audit (
        id integer primary key autoincrement,
        inbound_id integer not null,
        field_name text not null,
        old_value text,
        new_value text,
        changed_by text,
        change_reason text,
        changed_at text,
        foreign key(inbound_id) references inbound_simple(id)
      );
    `);
  }
  
  // Prüfe ob movement Tabelle inbound_id Spalte hat
  try {
    db.prepare("select inbound_id from movement limit 1").get();
  } catch (e) {
    console.log("Erweitere movement Tabelle um inbound_id...");
    db.exec(`
      alter table movement add column inbound_id integer;
      create index if not exists idx_movement_inbound on movement(inbound_id);
      create index if not exists idx_movement_from_location on movement(from_location_id);
      create index if not exists idx_movement_to_location on movement(to_location_id);
    `);
  }
  
  // Prüfe ob archive Tabelle existiert
  try {
    db.prepare("select * from archive limit 1").get();
  } catch (e) {
    console.log("Erstelle archive Tabelle...");
    db.exec(`
      create table if not exists archive (
        id integer primary key autoincrement,
        inbound_id integer not null,
        location_id integer,
        archived_at text not null,
        archived_by text,
        reason text,
        notes text,
        foreign key(inbound_id) references inbound_simple(id),
        foreign key(location_id) references location(id)
      );
      create index if not exists idx_archive_inbound on archive(inbound_id);
      create index if not exists idx_archive_location on archive(location_id);
      create index if not exists idx_archive_date on archive(archived_at);
    `);
  }
  
  // Entferne cw49 und cw50 Spalten aus inbound_simple (falls vorhanden)
  try {
    // Prüfe ob cw49 Spalte existiert
    db.prepare("select cw49 from inbound_simple limit 1").get();
    console.log("Entferne cw49 und cw50 Spalten aus inbound_simple...");
    // SQLite unterstützt DROP COLUMN ab Version 3.35.0
    // Falls die Version älter ist, wird ein Fehler geworfen, aber das ist OK
    try {
      db.exec(`alter table inbound_simple drop column cw49`);
      db.exec(`alter table inbound_simple drop column cw50`);
      console.log("✅ cw49 und cw50 Spalten erfolgreich entfernt");
    } catch (dropError) {
      // Falls DROP COLUMN nicht unterstützt wird, erstelle neue Tabelle ohne diese Spalten
      console.log("⚠️ DROP COLUMN nicht unterstützt, erstelle neue Tabelle...");
      db.exec(`
        create table inbound_simple_new (
          id integer primary key autoincrement,
          cw text,
          aufgenommen_am text,
          ignore_flag integer default 0,
          area text,
          stage text,
          last_stage text,
          carrier_name text,
          land text,
          ship_status text,
          planned_carton integer,
          actual_carton integer,
          olpn text,
          dn text,
          shi text,
          carrier_tracking_nr text,
          customer_id text,
          customer_name text,
          asn_ra_no text,
          neue_ra text,
          new_reopen_ra text,
          mh_status text,
          kommentar text,
          added_by text,
          created_at text,
          location_id integer,
          foreign key(location_id) references location(id)
        );
      `);
      db.exec(`
        insert into inbound_simple_new 
        select id, cw, aufgenommen_am, ignore_flag, area, stage, last_stage, carrier_name, land, 
               ship_status, planned_carton, actual_carton, olpn, dn, shi, carrier_tracking_nr, 
               customer_id, customer_name, asn_ra_no, neue_ra, new_reopen_ra, mh_status, 
               kommentar, added_by, created_at, location_id
        from inbound_simple;
      `);
      db.exec(`drop table inbound_simple`);
      db.exec(`alter table inbound_simple_new rename to inbound_simple`);
      console.log("✅ Tabelle erfolgreich neu erstellt ohne cw49 und cw50");
    }
  } catch (e) {
    // Spalten existieren nicht, alles OK
    console.log("ℹ️ cw49 und cw50 Spalten existieren nicht (bereits entfernt oder nie vorhanden)");
  }

  // Carrier Stammdaten hinterlegen, falls leer
  const countCarrier = db.prepare("select count(*) as c from carrier").get().c;
  if (countCarrier === 0) {
    const insertCarrier = db.prepare(`
      insert into carrier (
        name, display_name, country,
        default_area, default_stage, default_last_stage,
        default_ship_status, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    insertCarrier.run(
      "DPD",
      "DPD",
      "FR",
      "Waiting / Zombieland",
      "Waiting Area Returns Line 68",
      "",
      "",
      now
    );
    // Carrier mit erweiterten Feldern
    const allFields = JSON.stringify([
      "cw", "aufgenommenAm", "ignoreFlag", "area", "stage", "lastStage",
      "carrierName", "land", "shipStatus", "plannedCarton", "actualCarton",
      "olpn", "dn", "shi", "carrierTrackingNr", "customerId", "customerName",
      "asnRaNo", "neueRa", "newReOpenRa", "mhStatus", "kommentar"
    ]);

    const defaultPlaceholders = JSON.stringify({
      olpn: "z.B. 00050197980027746580",
      carrierTrackingNr: "z.B. 885733208991",
      customerId: "z.B. 20062673",
      asnRaNo: "z.B. 70378154"
    });

    const insertCarrierExtended = db.prepare(`
      insert into carrier (
        name, display_name, country,
        default_area, default_stage, default_last_stage,
        default_ship_status, label_image, label_help_text,
        visible_fields, field_placeholders, olpn_validation, tracking_validation, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Standard OLPN Validierung: Startet mit 0005 oder 0008, 20 Stellen lang
    const standardOlpnValidation = JSON.stringify({
      enabled: true,
      required: true,
      length: 20,
      startsWith: ["0005", "0008"],
      pattern: "^(0005|0008)\\d{16}$",
      errorMessage: "OLPN muss mit 0005 oder 0008 beginnen und genau 20 Stellen lang sein"
    });

    // Standard Tracking Validierung (falls benötigt)
    const standardTrackingValidation = JSON.stringify({
      enabled: false,
      required: false,
      length: null,
      startsWith: [],
      pattern: "",
      errorMessage: ""
    });

    // FedEx spezielle Validierung: AWB Nummer, startet mit 88, 12 Stellen
    const fedexTrackingValidation = JSON.stringify({
      enabled: true,
      required: true,
      length: 12,
      startsWith: ["88"],
      pattern: "^88\\d{10}$",
      errorMessage: "AWB Nummer muss mit 88 beginnen und genau 12 Stellen lang sein"
    });

    const fedexOlpnValidation = JSON.stringify({
      enabled: false,
      required: false,
      length: null,
      startsWith: [],
      pattern: "",
      errorMessage: "FedEx verwendet keine OLPN"
    });

    try {
      insertCarrierExtended.run("DPD", "DPD", "FR", "Waiting / Zombieland", "Waiting Area Returns Line 68", "", "", "/images/CarrierLabels/DPD.jpg", "Standard Label-Hilfe", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("Geodis", "Geodis", "", "", "", "", "", "/images/CarrierLabels/Geodis.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("DHL", "DHL", "DE", "", "", "", "", "/images/CarrierLabels/DHL.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("BRT", "BRT", "IT", "", "", "", "", "/images/CarrierLabels/BRT.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("FedEx", "FedEx", "US", "", "", "", "", "/images/CarrierLabels/FedEx.jpg", "", allFields, defaultPlaceholders, fedexOlpnValidation, fedexTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("Zalando Ware", "Zalando Ware", "", "", "", "", "", "/images/CarrierLabels/Zalando.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("Postnord", "Postnord", "SE", "", "", "", "", "/images/CarrierLabels/Postnord.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("Lost and Found", "Lost & Found", "", "", "", "", "", "", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("Dachser", "Dachser", "DE", "", "", "", "", "/images/CarrierLabels/Dachser.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
    try {
      insertCarrierExtended.run("Duwensee", "Duwensee", "", "", "", "", "", "/images/CarrierLabels/Duwensee.jpg", "", allFields, defaultPlaceholders, standardOlpnValidation, standardTrackingValidation, now);
    } catch (e) { /* Carrier existiert bereits */ }
  }

  // Dropdown Optionen initialisieren
  const countDropdown = db.prepare("select count(*) as c from dropdown_options").get().c;
  if (countDropdown === 0) {
    const insertDropdown = db.prepare(`
      insert into dropdown_options (field_name, option_value, option_label, sort_order)
      values (?, ?, ?, ?)
    `);

    // Area Optionen
    insertDropdown.run("area", "Area D", "Area D", 1);
    insertDropdown.run("area", "Crack", "Crack", 2);
    insertDropdown.run("area", "Waiting / Zombieland", "Waiting / Zombieland", 3);
    insertDropdown.run("area", "Gültige Gasse", "Gültige Gasse", 4);
    insertDropdown.run("area", "Customize", "Customize", 5);
    insertDropdown.run("area", "Oben", "Oben", 6);
    insertDropdown.run("area", "Unbekannt/ altlast", "Unbekannt/ altlast", 7);

    // Land Optionen
    insertDropdown.run("land", "DE", "Deutschland (DE)", 1);
    insertDropdown.run("land", "FR", "Frankreich (FR)", 2);
    insertDropdown.run("land", "IT", "Italien (IT)", 3);
    insertDropdown.run("land", "ES", "Spanien (ES)", 4);
    insertDropdown.run("land", "NL", "Niederlande (NL)", 5);
    insertDropdown.run("land", "BE", "Belgien (BE)", 6);
    insertDropdown.run("land", "AT", "Österreich (AT)", 7);
    insertDropdown.run("land", "CH", "Schweiz (CH)", 8);
    insertDropdown.run("land", "PL", "Polen (PL)", 9);
    insertDropdown.run("land", "SE", "Schweden (SE)", 10);
    insertDropdown.run("land", "DK", "Dänemark (DK)", 11);
    insertDropdown.run("land", "US", "USA (US)", 12);
    insertDropdown.run("land", "GB", "Großbritannien (GB)", 13);
  }

}

initDb();

/* API Lagerbestand - Erweiterte Sicht mit Stellplätzen */
app.get("/api/warehouse/locations", (req, res) => {
  try {
    const { area, active_only, search } = req.query;
    
    let sql = `
      select
        l.id,
        l.code,
        l.description,
        l.area,
        l.is_active,
        l.created_at,
        ifnull(count(distinct i.id), 0) as carton_count,
        ifnull(sum(i.actual_carton), 0) as total_cartons,
        max(i.created_at) as last_booked_at
      from location l
      left join inbound_simple i on i.location_id = l.id and i.ignore_flag = 0
      where 1=1
    `;
    
    const params = [];
    
    // Filter: Nur aktive Stellplätze
    if (active_only === 'true') {
      sql += ` and l.is_active = 1`;
    }
    
    // Filter: Area
    if (area && area !== 'all') {
      sql += ` and l.area = ?`;
      params.push(area);
    }
    
    // Filter: Suche
    if (search && search.trim() !== '') {
      sql += ` and (l.code like ? or l.description like ?)`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }
    
    sql += `
      group by l.id, l.code, l.description, l.area, l.is_active, l.created_at
      order by l.area, l.code
    `;
    
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Stellplätze:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* API Stellplatz-Details mit allen Kartons */
app.get("/api/warehouse/locations/:id/details", (req, res) => {
  try {
    const { id } = req.params;
    
    // Stellplatz-Info
    const location = db.prepare(`
      select id, code, description, area, is_active, created_at
      from location
      where id = ?
    `).get(id);
    
    if (!location) {
      return res.status(404).json({ ok: false, error: "Stellplatz nicht gefunden" });
    }
    
    // Alle Kartons auf diesem Stellplatz - ALLE Felder
    const cartons = db.prepare(`
      select
        i.id,
        i.cw,
        i.aufgenommen_am,
        i.ignore_flag,
        i.area,
        i.carrier_name,
        i.land,
        i.ship_status,
        i.planned_carton,
        i.actual_carton,
        i.olpn,
        i.dn,
        i.shi,
        i.carrier_tracking_nr,
        i.customer_id,
        i.customer_name,
        i.asn_ra_no,
        i.kommentar,
        i.added_by,
        i.created_at
      from inbound_simple i
      where i.location_id = ? and i.ignore_flag = 0
      order by i.created_at desc
    `).all(id);
    
    res.json({
      location,
      cartons,
      total_cartons: cartons.reduce((sum, c) => sum + (c.actual_carton || 0), 0)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Stellplatz-Details:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* API Alle Areas abrufen */
app.get("/api/warehouse/areas", (req, res) => {
  try {
    const areas = db.prepare(`
      select distinct area
      from location
      where area is not null and area != ''
      order by area
    `).all();
    
    res.json(areas.map(a => a.area));
  } catch (err) {
    console.error("Fehler beim Abrufen der Areas:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* API Stellplatz erstellen */
app.post("/api/warehouse/locations", (req, res) => {
  console.log("📥 POST /api/warehouse/locations - Request erhalten");
  console.log("Body:", req.body);
  
  try {
    const { code, description, area, created_by } = req.body;
    
    if (!code || code.trim() === '') {
      console.log("❌ Fehler: Stellplatz-Code fehlt");
      return res.status(400).json({ ok: false, error: "Stellplatz-Code ist erforderlich" });
    }
    
    console.log("💾 Speichere Stellplatz in Datenbank...");
    const stmt = db.prepare(`
      insert into location (code, description, area, is_active, created_at, created_by)
      values (?, ?, ?, 1, ?, ?)
    `);
    
    const now = new Date().toISOString();
    const createdBy = created_by || 'System';
    
    const info = stmt.run(
      code.trim(),
      description || '',
      area || '',
      now,
      createdBy
    );
    
    console.log("✅ Stellplatz erfolgreich erstellt mit ID:", info.lastInsertRowid);
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error("❌ Fehler beim Erstellen des Stellplatzes:", err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ ok: false, error: "Stellplatz-Code existiert bereits" });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* API Stellplatz aktualisieren */
app.put("/api/warehouse/locations/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, area, is_active } = req.body;
    
    const stmt = db.prepare(`
      update location
      set code = ?, description = ?, area = ?, is_active = ?
      where id = ?
    `);
    
    stmt.run(code, description || '', area || '', is_active ? 1 : 0, id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Stellplatzes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* API Stellplatz löschen */
app.delete("/api/warehouse/locations/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Prüfen ob Stellplatz Kartons hat
    const cartonCount = db.prepare(`
      select count(*) as count
      from inbound_simple
      where location_id = ?
    `).get(id).count;
    
    if (cartonCount > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: `Stellplatz kann nicht gelöscht werden. Es sind noch ${cartonCount} Kartons gebucht.` 
      });
    }
    
    db.prepare("delete from location where id = ?").run(id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Stellplatzes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* API Legacy Inventory Endpunkt (für Kompatibilität) */
app.get("/api/inventory", (req, res) => {
  const sql = `
    select
      l.id,
      l.code,
      l.description,
      ifnull(count(distinct p.id), 0) as pallet_count,
      ifnull(count(c.id), 0) as carton_count
    from location l
    left join pallet p on p.location_id = l.id and p.status = 'aktiv'
    left join carton c on c.pallet_id = p.id
    where l.is_active = 1
    group by l.id, l.code, l.description
    order by l.code
  `;
  const rows = db.prepare(sql).all();
  res.json(rows);
});

/* Carrier Liste für Buttons */
app.get("/api/carriers", (req, res) => {
  const rows = db
    .prepare(
      `select id, name, display_name, country, default_area, default_stage, 
       default_last_stage, default_ship_status, label_image, label_help_text,
       visible_fields, field_placeholders, olpn_validation, tracking_validation,
       bulk_fixed_fields, bulk_variable_fields 
       from carrier where is_active = 1 order by display_name`
    )
    .all();
  res.json(rows);
});

/* Dropdown Optionen */
app.get("/api/dropdown-options/:fieldName", (req, res) => {
  const { fieldName } = req.params;
  const rows = db
    .prepare(
      "select id, option_value, option_label, sort_order from dropdown_options where field_name = ? and is_active = 1 order by sort_order"
    )
    .all(fieldName);
  res.json(rows);
});

/* Windows Benutzername abrufen */
app.get("/api/current-user", (req, res) => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  const computerName = process.env.COMPUTERNAME || process.env.HOSTNAME || "";
  
  // Verwende PowerShell, um den aktuellen Benutzer und Display-Name zu bekommen
  // PowerShell-Befehl, der sowohl Benutzername als auch Display-Name zurückgibt
  const psCommand = `powershell -Command "$user = [System.Security.Principal.WindowsIdentity]::GetCurrent(); $username = $user.Name.Split('\\\\')[-1]; $account = Get-LocalUser -Name $username -ErrorAction SilentlyContinue; if ($account) { $displayName = $account.FullName; if ([string]::IsNullOrWhiteSpace($displayName)) { $displayName = $username } } else { $displayName = $username }; Write-Output \"USERNAME=$username|DISPLAYNAME=$displayName\""`;
  
  execAsync(psCommand)
    .then(({ stdout }) => {
      let username = process.env.USERNAME || "Unbekannt";
      let displayName = username;
      
      // Parse PowerShell Output
      const output = stdout.trim();
      const usernameMatch = output.match(/USERNAME=([^|]+)/);
      const displayNameMatch = output.match(/DISPLAYNAME=(.+)/);
      
      if (usernameMatch && usernameMatch[1]) {
        username = usernameMatch[1].trim();
      }
      
      if (displayNameMatch && displayNameMatch[1]) {
        displayName = displayNameMatch[1].trim();
        // Falls Display-Name leer ist, verwende Benutzername
        if (!displayName || displayName === username) {
          // Versuche alternativen Weg über wmic
          return execAsync(`wmic useraccount where name="${username}" get fullname /value`)
            .then(({ stdout }) => {
              const match = stdout.match(/FullName=(.+)/);
              if (match && match[1] && match[1].trim()) {
                displayName = match[1].trim();
              }
              
              res.json({ 
                ok: true, 
                username: username,
                displayName: displayName || username,
                computerName: computerName
              });
            })
            .catch(() => {
              res.json({ 
                ok: true, 
                username: username,
                displayName: displayName || username,
                computerName: computerName
              });
            });
        } else {
          res.json({ 
            ok: true, 
            username: username,
            displayName: displayName,
            computerName: computerName
          });
        }
      } else {
        // Fallback: verwende wmic
        return execAsync(`wmic useraccount where name="${username}" get fullname /value`)
          .then(({ stdout }) => {
            const match = stdout.match(/FullName=(.+)/);
            if (match && match[1] && match[1].trim()) {
              displayName = match[1].trim();
            }
            
            res.json({ 
              ok: true, 
              username: username,
              displayName: displayName || username,
              computerName: computerName
            });
          })
          .catch(() => {
            res.json({ 
              ok: true, 
              username: username,
              displayName: username,
              computerName: computerName
            });
          });
      }
    })
    .catch(() => {
      // Fallback: verwende whoami und wmic
      execAsync('whoami')
        .then(({ stdout }) => {
          let username = stdout.trim();
          if (username.includes('\\')) {
            username = username.split('\\')[1];
          }
          username = username.trim();
          
          return execAsync(`wmic useraccount where name="${username}" get fullname /value`)
            .then(({ stdout }) => {
              let displayName = username;
              const match = stdout.match(/FullName=(.+)/);
              if (match && match[1] && match[1].trim()) {
                displayName = match[1].trim();
              }
              
              res.json({ 
                ok: true, 
                username: username,
                displayName: displayName,
                computerName: computerName
              });
            })
            .catch(() => {
              res.json({ 
                ok: true, 
                username: username,
                displayName: username,
                computerName: computerName
              });
            });
        })
        .catch(() => {
          const username = process.env.USERNAME || "Unbekannt";
          res.json({ 
            ok: true, 
            username: username,
            displayName: username,
            computerName: computerName
          });
        });
    });
});

/* Einstellungen Zugriff testen, sehr simpel */
app.post("/api/settings/auth", (req, res) => {
  const { password } = req.body || {};
  if (password === SETTINGS_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "Passwort falsch" });
});

/* Carrier aktualisieren (Settings) */
app.put("/api/carriers/:id", (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const stmt = db.prepare(`
      update carrier set
        display_name = ?,
        country = ?,
        default_area = ?,
        default_stage = ?,
        default_last_stage = ?,
        default_ship_status = ?,
        label_image = ?,
        label_help_text = ?,
        visible_fields = ?,
        field_placeholders = ?,
        olpn_validation = ?,
        tracking_validation = ?,
        bulk_fixed_fields = ?,
        bulk_variable_fields = ?
      where id = ?
    `);

    stmt.run(
      payload.display_name || "",
      payload.country || "",
      payload.default_area || "",
      payload.default_stage || "",
      payload.default_last_stage || "",
      payload.default_ship_status || "",
      payload.label_image || "",
      payload.label_help_text || "",
      payload.visible_fields || "[]",
      payload.field_placeholders || "{}",
      payload.olpn_validation || "{}",
      payload.tracking_validation || "{}",
      payload.bulk_fixed_fields || "[]",
      payload.bulk_variable_fields || "[]",
      id
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Update Carrier:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Dropdown Option hinzufügen */
app.post("/api/dropdown-options", (req, res) => {
  try {
    const { field_name, option_value, option_label, sort_order } = req.body || {};
    
    const stmt = db.prepare(`
      insert into dropdown_options (field_name, option_value, option_label, sort_order)
      values (?, ?, ?, ?)
    `);

    const info = stmt.run(field_name, option_value, option_label, sort_order || 0);
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Hinzufügen Dropdown Option:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Dropdown Option aktualisieren */
app.put("/api/dropdown-options/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { option_label } = req.body;
    
    if (!option_label || option_label.trim() === "") {
      return res.status(400).json({ ok: false, error: "Option Label darf nicht leer sein" });
    }
    
    db.prepare("update dropdown_options set option_label = ?, option_value = ? where id = ?")
      .run(option_label.trim(), option_label.trim(), id);
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren Dropdown Option:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Dropdown Optionen Reihenfolge aktualisieren */
app.put("/api/dropdown-options/reorder/:fieldName", (req, res) => {
  try {
    const { fieldName } = req.params;
    const { orderedIds } = req.body; // Array von IDs in neuer Reihenfolge
    
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ ok: false, error: "orderedIds muss ein Array sein" });
    }
    
    const updateStmt = db.prepare("update dropdown_options set sort_order = ? where id = ?");
    
    orderedIds.forEach((id, index) => {
      updateStmt.run(index, id);
    });
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Neuordnen Dropdown Optionen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Dropdown Option löschen */
app.delete("/api/dropdown-options/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("delete from dropdown_options where id = ?").run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Löschen Dropdown Option:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Wareneingang Simple Modus speichern */
app.post("/api/inbound-simple", (req, res) => {
  try {
    const payload = req.body || {};

    console.log("Empfangene Daten:", JSON.stringify(payload, null, 2));

    // Validierung
    if (!payload.carrierName || (typeof payload.carrierName === 'string' && payload.carrierName.trim() === "")) {
      return res.status(400).json({ ok: false, error: "Carrier Name ist erforderlich" });
    }

    const stmt = db.prepare(`
      insert into inbound_simple (
        cw,
        aufgenommen_am,
        ignore_flag,
        area,
        stage,
        last_stage,
        carrier_name,
        land,
        ship_status,
        planned_carton,
        actual_carton,
        olpn,
        dn,
        shi,
        carrier_tracking_nr,
        customer_id,
        customer_name,
        asn_ra_no,
        kommentar,
        added_by,
        created_at,
        location_id
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    // Zahlenfelder sicher konvertieren
    let plannedCarton = null;
    let actualCarton = null;
    
    if (payload.plannedCarton !== null && payload.plannedCarton !== undefined && payload.plannedCarton !== "") {
      plannedCarton = parseInt(payload.plannedCarton, 10);
      if (isNaN(plannedCarton)) plannedCarton = null;
    }
    
    if (payload.actualCarton !== null && payload.actualCarton !== undefined && payload.actualCarton !== "") {
      actualCarton = parseInt(payload.actualCarton, 10);
      if (isNaN(actualCarton)) actualCarton = null;
    }

    // Location ID validieren
    let locationId = null;
    if (payload.locationId !== null && payload.locationId !== undefined) {
      locationId = parseInt(payload.locationId, 10);
      if (isNaN(locationId)) locationId = null;
      
      // Prüfen ob Stellplatz existiert
      if (locationId) {
        const locationCheck = db.prepare("select id from location where id = ?").get(locationId);
        if (!locationCheck) {
          console.warn(`Stellplatz ${locationId} existiert nicht, wird als null gespeichert`);
          locationId = null;
        }
      }
    }

    const info = stmt.run(
      payload.cw || null,
      payload.aufgenommenAm || null,
      payload.ignoreFlag ? 1 : 0,
      payload.area || null,
      payload.stage || null,
      payload.lastStage || null,
      payload.carrierName || null,
      payload.land || null,
      payload.shipStatus || null,
      plannedCarton,
      actualCarton,
      payload.olpn || null,
      payload.dn || null,
      payload.shi || null,
      payload.carrierTrackingNr || null,
      payload.customerId || null,
      payload.customerName || null,
      payload.asnRaNo || null,
      payload.kommentar || null,
      payload.addedBy || null,
      now,
      locationId
    );

    console.log("Erfolgreich gespeichert mit ID:", info.lastInsertRowid);
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error("Fehler beim Speichern inbound simple:", err);
    res.status(500).json({ ok: false, error: err.message || "Datenbankfehler" });
  }
});

/* Kleine Liste für Tests */
app.get("/api/inbound-simple", (req, res) => {
  const rows = db
    .prepare(
      `select 
        id, cw, aufgenommen_am, carrier_name, area, stage, 
        planned_carton, actual_carton, olpn, mh_status, 
        carrier_tracking_nr, kommentar, created_at, added_by, location_id
      from inbound_simple 
      order by id desc 
      limit 50`
    )
    .all();
  res.json(rows);
});

/* Einzelnen Eintrag abrufen */
app.get("/api/inbound-simple/:id", (req, res) => {
  try {
    const { id } = req.params;
    const entry = db.prepare(`
      select * from inbound_simple where id = ?
    `).get(id);
    
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden" });
    }
    
    res.json(entry);
  } catch (err) {
    console.error("Fehler beim Abrufen des Eintrags:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Wareneingang Eintrag aktualisieren */
app.put("/api/inbound-simple/:id", (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const currentUser = req.headers['x-user'] || req.body.addedBy || 'System';
    
    // Prüfen ob Eintrag existiert
    const existing = db.prepare("select * from inbound_simple where id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden" });
    }
    
    // Validierung: Keine negativen Werte
    if (payload.planned_carton !== undefined && payload.planned_carton !== null && payload.planned_carton < 0) {
      return res.status(400).json({ ok: false, error: "Planned Carton darf nicht negativ sein" });
    }
    if (payload.actual_carton !== undefined && payload.actual_carton !== null && payload.actual_carton < 0) {
      return res.status(400).json({ ok: false, error: "Actual Carton darf nicht negativ sein" });
    }
    
    // Pflichtkommentar bei Änderungen
    if (!payload.change_reason || payload.change_reason.trim() === "") {
      return res.status(400).json({ ok: false, error: "Bitte geben Sie einen Grund für die Änderung an" });
    }
    
    const now = new Date().toISOString();
    
    // ALLE Felder die aktualisiert werden können
    const updatableFields = {
      cw: payload.cw,
      aufgenommen_am: payload.aufgenommen_am,
      carrier_name: payload.carrier_name,
      area: payload.area,
      land: payload.land,
      ship_status: payload.ship_status,
      stage: payload.stage,
      last_stage: payload.last_stage,
      planned_carton: payload.planned_carton,
      actual_carton: payload.actual_carton,
      olpn: payload.olpn,
      carrier_tracking_nr: payload.carrier_tracking_nr,
      dn: payload.dn,
      shi: payload.shi,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      asn_ra_no: payload.asn_ra_no,
      mh_status: payload.mh_status,
      neue_ra: payload.neue_ra,
      new_reopen_ra: payload.new_reopen_ra,
      kommentar: payload.kommentar,
      ignore_flag: payload.ignore_flag
    };
    
    // Audit-Log erstellen für geänderte Felder
    const auditLogs = [];
    Object.keys(updatableFields).forEach(field => {
      if (payload[field] !== undefined) {
        const oldValue = existing[field];
        const newValue = updatableFields[field];
        
        // Nur loggen wenn sich der Wert geändert hat
        if (oldValue !== newValue) {
          auditLogs.push({
            inbound_id: parseInt(id),
            field_name: field,
            old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
            new_value: newValue !== null && newValue !== undefined ? String(newValue) : null,
            changed_by: currentUser,
            change_reason: payload.change_reason,
            changed_at: now
          });
        }
      }
    });
    
    // Update durchführen - ALLE Felder
    const updateFields = [];
    const updateValues = [];
    
    // Text-Felder
    const textFields = ['cw', 'carrier_name', 'area', 'land', 'ship_status', 'stage', 'last_stage', 
                        'olpn', 'carrier_tracking_nr', 'dn', 'shi', 'customer_id', 'customer_name', 
                        'asn_ra_no', 'mh_status', 'neue_ra', 'new_reopen_ra', 'kommentar'];
    
    textFields.forEach(field => {
      if (payload[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(payload[field] ? payload[field].trim() : null);
      }
    });
    
    // Datum-Feld
    if (payload.aufgenommen_am !== undefined) {
      updateFields.push("aufgenommen_am = ?");
      updateValues.push(payload.aufgenommen_am || null);
    }
    
    // Zahl-Felder
    if (payload.planned_carton !== undefined) {
      updateFields.push("planned_carton = ?");
      updateValues.push(payload.planned_carton !== null && payload.planned_carton !== "" ? parseInt(payload.planned_carton) : null);
    }
    if (payload.actual_carton !== undefined) {
      updateFields.push("actual_carton = ?");
      updateValues.push(payload.actual_carton !== null && payload.actual_carton !== "" ? parseInt(payload.actual_carton) : null);
    }
    
    // Boolean-Feld
    if (payload.ignore_flag !== undefined) {
      updateFields.push("ignore_flag = ?");
      updateValues.push(payload.ignore_flag === 1 || payload.ignore_flag === "1" ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Felder zum Aktualisieren angegeben" });
    }
    
    updateValues.push(id);
    
    const updateStmt = db.prepare(`
      update inbound_simple
      set ${updateFields.join(", ")}
      where id = ?
    `);
    
    updateStmt.run(...updateValues);
    
    // Audit-Logs speichern
    if (auditLogs.length > 0) {
      const insertAudit = db.prepare(`
        insert into inbound_audit (inbound_id, field_name, old_value, new_value, changed_by, change_reason, changed_at)
        values (?, ?, ?, ?, ?, ?, ?)
      `);
      
      auditLogs.forEach(log => {
        insertAudit.run(
          log.inbound_id,
          log.field_name,
          log.old_value,
          log.new_value,
          log.changed_by,
          log.change_reason,
          log.changed_at
        );
      });
    }
    
    console.log(`✅ Eintrag ${id} aktualisiert von ${currentUser}`);
    res.json({ ok: true, id: parseInt(id), audit_logs: auditLogs.length });
  } catch (err) {
    console.error("Fehler beim Aktualisieren inbound simple:", err);
    res.status(500).json({ ok: false, error: err.message || "Datenbankfehler" });
  }
});

/* Audit-Logs abrufen */
/* Dashboard API Endpunkte */

// Dashboard KPI-Statistiken
app.get("/api/dashboard/stats", (req, res) => {
  try {
    // Gesamt Stellplätze
    const totalLocations = db.prepare("select count(*) as c from location where is_active = 1").get().c;
    
    // Belegte Stellplätze (mit mindestens einem Eintrag)
    const occupiedLocations = db.prepare(`
      select count(distinct location_id) as c 
      from inbound_simple 
      where location_id is not null and ignore_flag = 0
    `).get().c;
    
    // Gesamt Kartons
    const totalCartons = db.prepare(`
      select coalesce(sum(actual_carton), 0) as total
      from inbound_simple
      where ignore_flag = 0 and actual_carton is not null
    `).get().total || 0;
    
    // Gesamt Einträge (Kartons)
    const totalEntries = db.prepare(`
      select count(*) as c
      from inbound_simple
      where ignore_flag = 0
    `).get().c;
    
    // Offene RA Positionen (mit asn_ra_no aber ohne mh_status oder mh_status != 'geschlossen')
    const openRAs = db.prepare(`
      select count(*) as c
      from inbound_simple
      where asn_ra_no is not null and asn_ra_no != '' 
        and (mh_status is null or mh_status != 'geschlossen')
        and ignore_flag = 0
    `).get().c;
    
    // RA Positionen mit unklarer Nummer (neue_ra oder new_reopen_ra)
    const unclearRAs = db.prepare(`
      select count(*) as c
      from inbound_simple
      where (neue_ra is not null and neue_ra != '') 
         or (new_reopen_ra is not null and new_reopen_ra != '')
         and ignore_flag = 0
    `).get().c;
    
    res.json({
      totalLocations,
      occupiedLocations,
      totalCartons,
      totalEntries,
      openRAs,
      unclearRAs
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Dashboard-Statistiken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Chart: Wareneingänge nach Kalenderwoche
app.get("/api/dashboard/charts/week", (req, res) => {
  try {
    const rows = db.prepare(`
      select 
        cw,
        count(*) as count,
        coalesce(sum(actual_carton), 0) as total_cartons
      from inbound_simple
      where ignore_flag = 0 and cw is not null and cw != ''
      group by cw
      order by cw desc
      limit 12
    `).all();
    
    // Sortiere nach CW (neueste zuerst, dann umkehren für Chart)
    const sorted = rows.sort((a, b) => {
      const cwA = parseInt(a.cw) || 0;
      const cwB = parseInt(b.cw) || 0;
      return cwA - cwB;
    });
    
    res.json({
      labels: sorted.map(r => `CW ${r.cw}`),
      data: sorted.map(r => r.count),
      cartons: sorted.map(r => r.total_cartons)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Wochen-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Chart: Retouren nach Carrier
app.get("/api/dashboard/charts/carrier", (req, res) => {
  try {
    const rows = db.prepare(`
      select 
        carrier_name,
        count(*) as count,
        coalesce(sum(actual_carton), 0) as total_cartons
      from inbound_simple
      where ignore_flag = 0 and carrier_name is not null and carrier_name != ''
      group by carrier_name
      order by count desc
      limit 10
    `).all();
    
    res.json({
      labels: rows.map(r => r.carrier_name || 'Unbekannt'),
      data: rows.map(r => r.count),
      cartons: rows.map(r => r.total_cartons)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Carrier-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Chart: RA Status Übersicht
app.get("/api/dashboard/charts/status", (req, res) => {
  try {
    // Gültig: mh_status = 'geschlossen' oder ähnlich
    const valid = db.prepare(`
      select count(*) as c
      from inbound_simple
      where ignore_flag = 0 
        and mh_status is not null 
        and mh_status != ''
        and (mh_status like '%geschlossen%' or mh_status like '%abgeschlossen%' or mh_status like '%fertig%')
    `).get().c;
    
    // Offen: asn_ra_no vorhanden aber mh_status nicht geschlossen
    const open = db.prepare(`
      select count(*) as c
      from inbound_simple
      where ignore_flag = 0
        and asn_ra_no is not null 
        and asn_ra_no != ''
        and (mh_status is null or mh_status = '' or (mh_status not like '%geschlossen%' and mh_status not like '%abgeschlossen%' and mh_status not like '%fertig%'))
    `).get().c;
    
    // Konflikt: neue_ra oder new_reopen_ra vorhanden
    const conflict = db.prepare(`
      select count(*) as c
      from inbound_simple
      where ignore_flag = 0
        and ((neue_ra is not null and neue_ra != '') or (new_reopen_ra is not null and new_reopen_ra != ''))
    `).get().c;
    
    res.json({
      labels: ["gültig", "offen", "Konflikt"],
      data: [valid, open, conflict]
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Status-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Chart: Retouren nach Area
app.get("/api/dashboard/charts/area", (req, res) => {
  try {
    const rows = db.prepare(`
      select 
        area,
        count(*) as count,
        coalesce(sum(actual_carton), 0) as total_cartons
      from inbound_simple
      where ignore_flag = 0 and area is not null and area != ''
      group by area
      order by count desc
      limit 10
    `).all();
    
    res.json({
      labels: rows.map(r => r.area || 'Unbekannt'),
      data: rows.map(r => r.count),
      cartons: rows.map(r => r.total_cartons)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Area-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Chart: Top Stellplätze nach Kartons
app.get("/api/dashboard/charts/locations", (req, res) => {
  try {
    const rows = db.prepare(`
      select 
        l.code as location_code,
        coalesce(sum(i.actual_carton), 0) as total_cartons,
        count(i.id) as entry_count
      from location l
      left join inbound_simple i on l.id = i.location_id and i.ignore_flag = 0
      where l.is_active = 1
      group by l.id, l.code
      having total_cartons > 0
      order by total_cartons desc
      limit 10
    `).all();
    
    res.json({
      labels: rows.map(r => r.location_code || 'Unbekannt'),
      data: rows.map(r => r.total_cartons),
      entries: rows.map(r => r.entry_count)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Location-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Umlagerung: Einzelne Karton von einem Stellplatz zum anderen */
app.post("/api/movement/single", (req, res) => {
  try {
    const { inbound_id, from_location_id, to_location_id, moved_by, reason } = req.body;
    
    if (!inbound_id || !from_location_id || !to_location_id) {
      return res.status(400).json({ ok: false, error: "inbound_id, from_location_id und to_location_id sind erforderlich" });
    }
    
    if (from_location_id === to_location_id) {
      return res.status(400).json({ ok: false, error: "Quell- und Ziel-Stellplatz dürfen nicht identisch sein" });
    }
    
    // Prüfe ob Eintrag existiert
    const inbound = db.prepare("select id, location_id from inbound_simple where id = ? and ignore_flag = 0").get(inbound_id);
    if (!inbound) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden oder ignoriert" });
    }
    
    // Prüfe ob Eintrag auf dem angegebenen Quell-Stellplatz ist
    if (inbound.location_id != from_location_id) {
      return res.status(400).json({ ok: false, error: "Eintrag befindet sich nicht auf dem angegebenen Quell-Stellplatz" });
    }
    
    // Prüfe ob Ziel-Stellplatz existiert
    const toLocation = db.prepare("select id, is_active from location where id = ?").get(to_location_id);
    if (!toLocation) {
      return res.status(404).json({ ok: false, error: "Ziel-Stellplatz nicht gefunden" });
    }
    if (!toLocation.is_active) {
      return res.status(400).json({ ok: false, error: "Ziel-Stellplatz ist nicht aktiv" });
    }
    
    const now = new Date().toISOString();
    const movedBy = moved_by || 'System';
    
    // Transaction: Umlagerung durchführen
    const transaction = db.transaction(() => {
      // 1. Movement-Eintrag erstellen
      const insertMovement = db.prepare(`
        insert into movement (inbound_id, from_location_id, to_location_id, moved_at, moved_by, reason)
        values (?, ?, ?, ?, ?, ?)
      `);
      insertMovement.run(inbound_id, from_location_id, to_location_id, now, movedBy, reason || null);
      
      // 2. location_id im inbound_simple aktualisieren
      const updateInbound = db.prepare("update inbound_simple set location_id = ? where id = ?");
      updateInbound.run(to_location_id, inbound_id);
    });
    
    transaction();
    
    res.json({ ok: true, message: "Umlagerung erfolgreich durchgeführt" });
  } catch (err) {
    console.error("Fehler bei Einzel-Umlagerung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Umlagerung: Mehrere ausgewählte Kartons von einem Stellplatz zum anderen */
app.post("/api/movement/multiple", (req, res) => {
  try {
    const { inbound_ids, from_location_id, to_location_id, moved_by, reason } = req.body;
    
    if (!inbound_ids || !Array.isArray(inbound_ids) || inbound_ids.length === 0) {
      return res.status(400).json({ ok: false, error: "inbound_ids (Array) ist erforderlich" });
    }
    
    if (!from_location_id || !to_location_id) {
      return res.status(400).json({ ok: false, error: "from_location_id und to_location_id sind erforderlich" });
    }
    
    if (from_location_id === to_location_id) {
      return res.status(400).json({ ok: false, error: "Quell- und Ziel-Stellplatz dürfen nicht identisch sein" });
    }
    
    // Prüfe ob Ziel-Stellplatz existiert und aktiv ist
    const toLocation = db.prepare("select id, is_active from location where id = ?").get(to_location_id);
    if (!toLocation) {
      return res.status(404).json({ ok: false, error: "Ziel-Stellplatz nicht gefunden" });
    }
    if (!toLocation.is_active) {
      return res.status(400).json({ ok: false, error: "Ziel-Stellplatz ist nicht aktiv" });
    }
    
    // Prüfe ob alle Einträge existieren und auf dem Quell-Stellplatz sind
    const placeholders = inbound_ids.map(() => '?').join(',');
    const inboundEntries = db.prepare(`
      select id, location_id from inbound_simple 
      where id in (${placeholders}) and ignore_flag = 0
    `).all(...inbound_ids);
    
    if (inboundEntries.length !== inbound_ids.length) {
      return res.status(400).json({ ok: false, error: "Einige Einträge wurden nicht gefunden oder sind ignoriert" });
    }
    
    // Prüfe ob alle Einträge auf dem angegebenen Quell-Stellplatz sind
    const invalidEntries = inboundEntries.filter(entry => entry.location_id != from_location_id);
    if (invalidEntries.length > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: `${invalidEntries.length} Einträge befinden sich nicht auf dem angegebenen Quell-Stellplatz` 
      });
    }
    
    const now = new Date().toISOString();
    const movedBy = moved_by || 'System';
    
    // Transaction: Mehrere Umlagerungen durchführen
    const transaction = db.transaction(() => {
      const insertMovement = db.prepare(`
        insert into movement (inbound_id, from_location_id, to_location_id, moved_at, moved_by, reason)
        values (?, ?, ?, ?, ?, ?)
      `);
      const updateInbound = db.prepare("update inbound_simple set location_id = ? where id = ?");
      
      inboundEntries.forEach(entry => {
        // Movement-Eintrag erstellen
        insertMovement.run(entry.id, from_location_id, to_location_id, now, movedBy, reason || null);
        // location_id aktualisieren
        updateInbound.run(to_location_id, entry.id);
      });
    });
    
    transaction();
    
    res.json({ 
      ok: true, 
      message: `Umlagerung erfolgreich: ${inboundEntries.length} Karton${inboundEntries.length > 1 ? 's' : ''} verschoben`,
      moved_count: inboundEntries.length
    });
  } catch (err) {
    console.error("Fehler bei Mehrfach-Umlagerung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Umlagerung: Alle Kartons von einem Stellplatz zum anderen */
app.post("/api/movement/bulk", (req, res) => {
  try {
    const { from_location_id, to_location_id, moved_by, reason } = req.body;
    
    if (!from_location_id || !to_location_id) {
      return res.status(400).json({ ok: false, error: "from_location_id und to_location_id sind erforderlich" });
    }
    
    if (from_location_id === to_location_id) {
      return res.status(400).json({ ok: false, error: "Quell- und Ziel-Stellplatz dürfen nicht identisch sein" });
    }
    
    // Prüfe ob Quell-Stellplatz existiert
    const fromLocation = db.prepare("select id from location where id = ?").get(from_location_id);
    if (!fromLocation) {
      return res.status(404).json({ ok: false, error: "Quell-Stellplatz nicht gefunden" });
    }
    
    // Prüfe ob Ziel-Stellplatz existiert und aktiv ist
    const toLocation = db.prepare("select id, is_active from location where id = ?").get(to_location_id);
    if (!toLocation) {
      return res.status(404).json({ ok: false, error: "Ziel-Stellplatz nicht gefunden" });
    }
    if (!toLocation.is_active) {
      return res.status(400).json({ ok: false, error: "Ziel-Stellplatz ist nicht aktiv" });
    }
    
    // Alle Einträge auf dem Quell-Stellplatz finden
    const inboundEntries = db.prepare(`
      select id from inbound_simple 
      where location_id = ? and ignore_flag = 0
    `).all(from_location_id);
    
    if (inboundEntries.length === 0) {
      return res.status(400).json({ ok: false, error: "Keine Einträge auf dem Quell-Stellplatz gefunden" });
    }
    
    const now = new Date().toISOString();
    const movedBy = moved_by || 'System';
    
    // Transaction: Massen-Umlagerung durchführen
    const transaction = db.transaction(() => {
      const insertMovement = db.prepare(`
        insert into movement (inbound_id, from_location_id, to_location_id, moved_at, moved_by, reason)
        values (?, ?, ?, ?, ?, ?)
      `);
      const updateInbound = db.prepare("update inbound_simple set location_id = ? where id = ?");
      
      inboundEntries.forEach(entry => {
        // Movement-Eintrag erstellen
        insertMovement.run(entry.id, from_location_id, to_location_id, now, movedBy, reason || null);
        // location_id aktualisieren
        updateInbound.run(to_location_id, entry.id);
      });
    });
    
    transaction();
    
    res.json({ 
      ok: true, 
      message: `Umlagerung erfolgreich: ${inboundEntries.length} Einträge verschoben`,
      moved_count: inboundEntries.length
    });
  } catch (err) {
    console.error("Fehler bei Massen-Umlagerung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Archivierung: Eintrag ins Archiv verschieben */
app.post("/api/archive", (req, res) => {
  try {
    const { inbound_id, reason, notes, archived_by } = req.body;
    
    if (!inbound_id) {
      return res.status(400).json({ ok: false, error: "inbound_id ist erforderlich" });
    }
    
    // Prüfe ob Eintrag existiert und noch nicht archiviert ist
    const inbound = db.prepare(`
      select i.id, i.location_id, i.olpn, i.carrier_tracking_nr, i.carrier_name, i.actual_carton
      from inbound_simple i
      left join archive a on a.inbound_id = i.id
      where i.id = ? and i.ignore_flag = 0 and a.id is null
    `).get(inbound_id);
    
    if (!inbound) {
      return res.status(404).json({ ok: false, error: "Eintrag nicht gefunden oder bereits archiviert" });
    }
    
    const now = new Date().toISOString();
    const archivedBy = archived_by || 'System';
    
    // Transaction: Archivierung durchführen
    const transaction = db.transaction(() => {
      // 1. Archive-Eintrag erstellen
      const insertArchive = db.prepare(`
        insert into archive (inbound_id, location_id, archived_at, archived_by, reason, notes)
        values (?, ?, ?, ?, ?, ?)
      `);
      insertArchive.run(
        inbound_id,
        inbound.location_id,
        now,
        archivedBy,
        reason || null,
        notes || null
      );
      
      // 2. location_id im inbound_simple auf null setzen (aus Lager entfernen)
      const updateInbound = db.prepare("update inbound_simple set location_id = null where id = ?");
      updateInbound.run(inbound_id);
    });
    
    transaction();
    
    res.json({ 
      ok: true, 
      message: "Eintrag erfolgreich archiviert",
      archived_id: inbound_id
    });
  } catch (err) {
    console.error("Fehler bei Archivierung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Archiv: Liste aller archivierten Einträge */
app.get("/api/archive", (req, res) => {
  try {
    const { limit = 100, search } = req.query;
    
    let query = `
      select 
        a.id,
        a.inbound_id,
        a.location_id,
        a.archived_at,
        a.archived_by,
        a.reason,
        a.notes,
        l.code as location_code,
        i.olpn,
        i.carrier_tracking_nr,
        i.carrier_name,
        i.actual_carton,
        i.cw,
        i.customer_name,
        i.asn_ra_no
      from archive a
      left join inbound_simple i on a.inbound_id = i.id
      left join location l on a.location_id = l.id
      where 1=1
    `;
    
    const params = [];
    
    if (search && search.trim() !== '') {
      query += " and (i.olpn like ? or i.carrier_tracking_nr like ? or i.customer_name like ? or l.code like ?)";
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    query += " order by a.archived_at desc limit ?";
    params.push(parseInt(limit));
    
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Archiv-Liste:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Archiv: Einzelnen Eintrag wiederherstellen */
app.post("/api/archive/restore", (req, res) => {
  try {
    const { archive_id, location_id, restored_by } = req.body;
    
    if (!archive_id) {
      return res.status(400).json({ ok: false, error: "archive_id ist erforderlich" });
    }
    
    // Prüfe ob Archive-Eintrag existiert
    const archiveEntry = db.prepare(`
      select a.inbound_id, a.location_id as original_location_id
      from archive a
      where a.id = ?
    `).get(archive_id);
    
    if (!archiveEntry) {
      return res.status(404).json({ ok: false, error: "Archiv-Eintrag nicht gefunden" });
    }
    
    // Prüfe ob Ziel-Stellplatz existiert (falls angegeben)
    if (location_id) {
      const location = db.prepare("select id, is_active from location where id = ?").get(location_id);
      if (!location) {
        return res.status(404).json({ ok: false, error: "Ziel-Stellplatz nicht gefunden" });
      }
      if (!location.is_active) {
        return res.status(400).json({ ok: false, error: "Ziel-Stellplatz ist nicht aktiv" });
      }
    }
    
    const targetLocationId = location_id || archiveEntry.original_location_id;
    const restoredBy = restored_by || 'System';
    
    // Transaction: Wiederherstellung durchführen
    const transaction = db.transaction(() => {
      // 1. location_id im inbound_simple wieder setzen
      const updateInbound = db.prepare("update inbound_simple set location_id = ? where id = ?");
      updateInbound.run(targetLocationId, archiveEntry.inbound_id);
      
      // 2. Archive-Eintrag löschen
      db.prepare("delete from archive where id = ?").run(archive_id);
    });
    
    transaction();
    
    res.json({ 
      ok: true, 
      message: "Eintrag erfolgreich wiederhergestellt",
      inbound_id: archiveEntry.inbound_id
    });
  } catch (err) {
    console.error("Fehler bei Wiederherstellung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Umlagerungs-Historie abrufen */
app.get("/api/movement/history", (req, res) => {
  try {
    const { location_id, inbound_id, limit = 100 } = req.query;
    
    let query = `
      select 
        m.id,
        m.inbound_id,
        m.from_location_id,
        m.to_location_id,
        m.moved_at,
        m.moved_by,
        m.reason,
        l_from.code as from_location_code,
        l_to.code as to_location_code,
        i.olpn,
        i.carrier_tracking_nr,
        i.cw,
        i.carrier_name,
        i.actual_carton
      from movement m
      left join location l_from on m.from_location_id = l_from.id
      left join location l_to on m.to_location_id = l_to.id
      left join inbound_simple i on m.inbound_id = i.id
      where 1=1
    `;
    
    const params = [];
    
    if (location_id) {
      query += " and (m.from_location_id = ? or m.to_location_id = ?)";
      params.push(location_id, location_id);
    }
    
    if (inbound_id) {
      query += " and m.inbound_id = ?";
      params.push(inbound_id);
    }
    
    query += " order by m.moved_at desc limit ?";
    params.push(parseInt(limit));
    
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Umlagerungs-Historie:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Alle Bewegungen (Wareneingang, Umlagerung, Archivierung) */
app.get("/api/movements/all", (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit);
    const movements = [];
    
    // Mehr Einträge holen, da wir später sortieren und limitieren
    const fetchLimit = limitNum * 3;
    
    // Wareneingänge
    const inboundQuery = `
      select 
        i.id as inbound_id,
        i.created_at as timestamp,
        i.added_by as user,
        i.olpn,
        i.carrier_tracking_nr,
        i.actual_carton,
        i.cw,
        l.code as location_code,
        'Wareneingang' as type,
        'Annahme' as from_location,
        l.code as to_location
      from inbound_simple i
      left join location l on i.location_id = l.id
      where i.created_at is not null
      order by i.created_at desc
      limit ?
    `;
    const inbounds = db.prepare(inboundQuery).all(fetchLimit);
    inbounds.forEach(i => {
      const object = i.cw ? `Karton ${i.cw}` : (i.olpn || i.carrier_tracking_nr || `#${i.inbound_id}`);
      movements.push({
        type: 'Wareneingang',
        timestamp: i.timestamp,
        user: i.user || '-',
        object: object,
        from_location: 'Annahme',
        to_location: i.to_location || '-',
        inbound_id: i.inbound_id
      });
    });
    
    // Umlagerungen
    const movementQuery = `
      select 
        m.inbound_id,
        m.moved_at as timestamp,
        m.moved_by as user,
        l_from.code as from_location,
        l_to.code as to_location,
        i.olpn,
        i.carrier_tracking_nr,
        i.cw,
        i.actual_carton,
        'Umlagerung' as type
      from movement m
      left join location l_from on m.from_location_id = l_from.id
      left join location l_to on m.to_location_id = l_to.id
      left join inbound_simple i on m.inbound_id = i.id
      where m.moved_at is not null
      order by m.moved_at desc
      limit ?
    `;
    const moves = db.prepare(movementQuery).all(fetchLimit);
    moves.forEach(m => {
      const object = m.cw ? `Karton ${m.cw}` : (m.olpn || m.carrier_tracking_nr || `#${m.inbound_id}`);
      movements.push({
        type: 'Umlagerung',
        timestamp: m.timestamp,
        user: m.user || '-',
        object: object,
        from_location: m.from_location || '-',
        to_location: m.to_location || '-',
        inbound_id: m.inbound_id
      });
    });
    
    // Archivierungen
    const archiveQuery = `
      select 
        a.inbound_id,
        a.archived_at as timestamp,
        a.archived_by as user,
        l.code as location_code,
        i.olpn,
        i.carrier_tracking_nr,
        i.cw,
        i.actual_carton,
        'Archivierung' as type
      from archive a
      left join location l on a.location_id = l.id
      left join inbound_simple i on a.inbound_id = i.id
      where a.archived_at is not null
      order by a.archived_at desc
      limit ?
    `;
    const archives = db.prepare(archiveQuery).all(fetchLimit);
    archives.forEach(a => {
      const object = a.cw ? `Karton ${a.cw}` : (a.olpn || a.carrier_tracking_nr || `#${a.inbound_id}`);
      movements.push({
        type: 'Archivierung',
        timestamp: a.timestamp,
        user: a.user || '-',
        object: object,
        from_location: a.location_code || '-',
        to_location: 'Archivzone',
        inbound_id: a.inbound_id
      });
    });
    
    // Nach Zeitstempel sortieren (neueste zuerst)
    movements.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
    
    // Limit auf die neuesten Einträge
    res.json(movements.slice(0, limitNum));
  } catch (err) {
    console.error("Fehler beim Abrufen aller Bewegungen:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/audit-logs", (req, res) => {
  try {
    const { inbound_id, field_name, changed_by, from_date, to_date } = req.query;
    
    let query = `
      select 
        a.id,
        a.inbound_id,
        a.field_name,
        a.old_value,
        a.new_value,
        a.changed_by,
        a.change_reason,
        a.changed_at,
        i.olpn,
        i.carrier_tracking_nr,
        i.cw,
        i.carrier_name
      from inbound_audit a
      left join inbound_simple i on a.inbound_id = i.id
      where 1=1
    `;
    
    const params = [];
    
    if (inbound_id) {
      query += " and a.inbound_id = ?";
      params.push(inbound_id);
    }
    
    if (field_name) {
      query += " and a.field_name like ?";
      params.push(`%${field_name}%`);
    }
    
    if (changed_by) {
      query += " and a.changed_by like ?";
      params.push(`%${changed_by}%`);
    }
    
    if (from_date) {
      query += " and a.changed_at >= ?";
      params.push(from_date);
    }
    
    if (to_date) {
      query += " and a.changed_at <= ?";
      params.push(to_date);
    }
    
    query += " order by a.changed_at desc limit 1000";
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Audit-Logs:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Dummy Wareneingang komplex, aus alter Version, falls du ihn brauchst
   Du kannst ihn vorerst nutzen oder später durch die neue Logik ersetzen
*/
app.post("/api/inbound", (req, res) => {
  try {
    const { locationCode, palletNumber, cartons } = req.body;

    let location = db
      .prepare("select id from location where code = ?")
      .get(locationCode);

    if (!location) {
      const info = db
        .prepare("insert into location (code, description) values (?, ?)")
        .run(locationCode, "Auto angelegter Stellplatz");
      location = { id: info.lastInsertRowid };
    }

    const palletInfo = db
      .prepare(
        "insert into pallet (pallet_number, location_id, status, created_at) values (?, ?, ?, ?)"
      )
      .run(palletNumber, location.id, "aktiv", new Date().toISOString());

    const palletId = palletInfo.lastInsertRowid;

    const insertRa = db.prepare(`
      insert into ra_number (ra_number, status, created_at)
      values (?, ?, ?)
      on conflict(ra_number) do update set status = excluded.status
    `);

    const selectRa = db.prepare(`
      select id from ra_number where ra_number = ?
    `);

    const insertCarton = db.prepare(`
      insert into carton (
        carton_number, sku, quantity, pallet_id,
        ra_number_id, received_at, registered_at, is_valid_ra
      ) values (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const c of cartons || []) {
        if (c.raNumber) {
          insertRa.run(c.raNumber, c.raStatus || "offen", new Date().toISOString());
        }
        const raRow = c.raNumber ? selectRa.get(c.raNumber) : { id: null };

        insertCarton.run(
          c.cartonNumber,
          c.sku,
          c.quantity || 0,
          palletId,
          raRow ? raRow.id : null,
          new Date().toISOString(),
          new Date().toISOString(),
          c.raStatus === "gültig" ? 1 : 0
        );
      }
    });

    tx();

    res.json({ ok: true, palletId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Export API - Excel-Export */
app.get("/api/export", async (req, res) => {
  try {
    const { type, columns, location_ids, areas, preview, limit, date_from, date_to } = req.query;
    
    if (!type || !columns) {
      return res.status(400).json({ ok: false, error: "type und columns sind erforderlich" });
    }
    
    const selectedColumns = columns.split(',').filter(c => c);
    if (selectedColumns.length === 0) {
      return res.status(400).json({ ok: false, error: "Mindestens eine Spalte muss ausgewählt sein" });
    }
    
    let data = [];
    let sql = '';
    const params = [];
    
    // Helper-Funktion für Datumsfilter
    const addDateFilter = (dateColumn) => {
      if (date_from) {
        sql += ` and ${dateColumn} >= ?`;
        params.push(date_from);
      }
      if (date_to) {
        sql += ` and ${dateColumn} <= ?`;
        params.push(date_to + ' 23:59:59');
      }
    };
    
    if (type === 'locations') {
      // Stellplätze exportieren
      sql = `
        select
          l.id,
          l.code,
          l.description,
          l.area,
          l.is_active,
          l.created_at,
          ifnull(count(distinct i.id), 0) as carton_count,
          ifnull(sum(i.actual_carton), 0) as total_cartons,
          max(i.created_at) as last_booked_at
        from location l
        left join inbound_simple i on i.location_id = l.id and i.ignore_flag = 0
        where 1=1
      `;
      
      if (location_ids) {
        const ids = location_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          sql += ` and l.id in (${placeholders})`;
          params.push(...ids);
        }
      }
      
      sql += ` group by l.id, l.code, l.description, l.area, l.is_active, l.created_at order by l.area, l.code`;
      
      const rows = db.prepare(sql).all(...params);
      data = rows.map(row => ({
        id: row.id,
        code: row.code,
        description: row.description || '',
        area: row.area || '',
        is_active: row.is_active ? 'Ja' : 'Nein',
        carton_count: row.carton_count,
        total_cartons: row.total_cartons,
        last_booked_at: row.last_booked_at || '',
        created_at: row.created_at || ''
      }));
      
    } else if (type === 'inbounds') {
      // Wareneingänge exportieren
      sql = `
        select
          i.id,
          i.created_at as timestamp,
          i.added_by as user,
          i.cw,
          i.olpn,
          i.carrier_tracking_nr,
          i.carrier_name,
          i.land,
          i.actual_carton,
          l.code as location_code,
          i.asn_ra_no,
          i.customer_name,
          i.kommentar
        from inbound_simple i
        left join location l on i.location_id = l.id
        where i.ignore_flag = 0 and i.created_at is not null
      `;
      addDateFilter('i.created_at');
      sql += ` order by i.created_at desc`;
      
      if (preview === 'true' && limit) {
        sql += ` limit ?`;
        params.push(parseInt(limit) || 50);
      }
      
      const rows = db.prepare(sql).all(...params);
      data = rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp || '',
        user: row.user || '-',
        cw: row.cw || '',
        olpn: row.olpn || '',
        carrier_tracking_nr: row.carrier_tracking_nr || '',
        carrier_name: row.carrier_name || '',
        land: row.land || '',
        actual_carton: row.actual_carton || 0,
        location_code: row.location_code || '',
        asn_ra_no: row.asn_ra_no || '',
        customer_name: row.customer_name || '',
        kommentar: row.kommentar || ''
      }));
      
    } else if (type === 'movements') {
      // Umlagerungen exportieren
      sql = `
        select
          m.id,
          m.moved_at as timestamp,
          m.moved_by as user,
          m.inbound_id,
          i.cw,
          i.olpn,
          i.carrier_tracking_nr,
          l_from.code as from_location,
          l_to.code as to_location,
          m.reason,
          i.actual_carton
        from movement m
        left join location l_from on m.from_location_id = l_from.id
        left join location l_to on m.to_location_id = l_to.id
        left join inbound_simple i on m.inbound_id = i.id
        where m.moved_at is not null
      `;
      addDateFilter('m.moved_at');
      sql += ` order by m.moved_at desc`;
      
      if (preview === 'true' && limit) {
        sql += ` limit ?`;
        params.push(parseInt(limit) || 50);
      }
      
      const rows = db.prepare(sql).all(...params);
      data = rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp || '',
        user: row.user || '-',
        inbound_id: row.inbound_id || '',
        cw: row.cw || '',
        olpn: row.olpn || '',
        carrier_tracking_nr: row.carrier_tracking_nr || '',
        from_location: row.from_location || '',
        to_location: row.to_location || '',
        reason: row.reason || '',
        actual_carton: row.actual_carton || 0
      }));
      
    } else if (type === 'archives') {
      // Archivierungen exportieren
      sql = `
        select
          a.id,
          a.archived_at as timestamp,
          a.archived_by as user,
          a.inbound_id,
          i.cw,
          i.olpn,
          i.carrier_tracking_nr,
          l.code as location_code,
          a.reason,
          a.notes
        from archive a
        left join inbound_simple i on a.inbound_id = i.id
        left join location l on a.location_id = l.id
        where a.archived_at is not null
      `;
      addDateFilter('a.archived_at');
      sql += ` order by a.archived_at desc`;
      
      if (preview === 'true' && limit) {
        sql += ` limit ?`;
        params.push(parseInt(limit) || 50);
      }
      
      const rows = db.prepare(sql).all(...params);
      data = rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp || '',
        user: row.user || '-',
        inbound_id: row.inbound_id || '',
        cw: row.cw || '',
        olpn: row.olpn || '',
        carrier_tracking_nr: row.carrier_tracking_nr || '',
        location_code: row.location_code || '',
        reason: row.reason || '',
        notes: row.notes || ''
      }));
      
    } else if (type === 'activities') {
      // Alle Aktivitäten exportieren (Wareneingänge, Umlagerungen, Archivierungen)
      const activities = [];
      
      // Wareneingänge
      const inboundQuery = `
        select
          i.id as inbound_id,
          i.created_at as timestamp,
          i.added_by as user,
          i.olpn,
          i.carrier_tracking_nr,
          i.actual_carton,
          i.cw,
          l.code as location_code,
          'Wareneingang' as type,
          'Annahme' as from_location,
          l.code as to_location
        from inbound_simple i
        left join location l on i.location_id = l.id
        where i.created_at is not null
      `;
      let inboundSql = inboundQuery;
      const inboundParams = [];
      if (date_from) {
        inboundSql += ` and i.created_at >= ?`;
        inboundParams.push(date_from);
      }
      if (date_to) {
        inboundSql += ` and i.created_at <= ?`;
        inboundParams.push(date_to + ' 23:59:59');
      }
      inboundSql += ` order by i.created_at desc`;
      if (preview === 'true' && limit) {
        inboundSql += ` limit ?`;
        inboundParams.push(parseInt(limit) || 50);
      }
      const inbounds = db.prepare(inboundSql).all(...inboundParams);
      inbounds.forEach(i => {
        const object = i.cw ? `Karton ${i.cw}` : (i.olpn || i.carrier_tracking_nr || `#${i.inbound_id}`);
        activities.push({
          type: 'Wareneingang',
          timestamp: i.timestamp,
          user: i.user || '-',
          object: object,
          from_location: 'Annahme',
          to_location: i.to_location || '-',
          inbound_id: i.inbound_id
        });
      });
      
      // Umlagerungen
      const movementQuery = `
        select
          m.inbound_id,
          m.moved_at as timestamp,
          m.moved_by as user,
          l_from.code as from_location,
          l_to.code as to_location,
          i.olpn,
          i.carrier_tracking_nr,
          i.cw,
          i.actual_carton,
          'Umlagerung' as type
        from movement m
        left join location l_from on m.from_location_id = l_from.id
        left join location l_to on m.to_location_id = l_to.id
        left join inbound_simple i on m.inbound_id = i.id
        where m.moved_at is not null
      `;
      let movementSql = movementQuery;
      const movementParams = [];
      if (date_from) {
        movementSql += ` and m.moved_at >= ?`;
        movementParams.push(date_from);
      }
      if (date_to) {
        movementSql += ` and m.moved_at <= ?`;
        movementParams.push(date_to + ' 23:59:59');
      }
      movementSql += ` order by m.moved_at desc`;
      if (preview === 'true' && limit) {
        movementSql += ` limit ?`;
        movementParams.push(parseInt(limit) || 50);
      }
      const moves = db.prepare(movementSql).all(...movementParams);
      moves.forEach(m => {
        const object = m.cw ? `Karton ${m.cw}` : (m.olpn || m.carrier_tracking_nr || `#${m.inbound_id}`);
        activities.push({
          type: 'Umlagerung',
          timestamp: m.timestamp,
          user: m.user || '-',
          object: object,
          from_location: m.from_location || '-',
          to_location: m.to_location || '-',
          inbound_id: m.inbound_id
        });
      });
      
      // Archivierungen
      const archiveQuery = `
        select
          a.inbound_id,
          a.archived_at as timestamp,
          a.archived_by as user,
          i.olpn,
          i.carrier_tracking_nr,
          i.cw,
          l.code as location_code,
          'Archivierung' as type
        from archive a
        left join inbound_simple i on a.inbound_id = i.id
        left join location l on a.location_id = l.id
        where a.archived_at is not null
      `;
      let archiveSql = archiveQuery;
      const archiveParams = [];
      if (date_from) {
        archiveSql += ` and a.archived_at >= ?`;
        archiveParams.push(date_from);
      }
      if (date_to) {
        archiveSql += ` and a.archived_at <= ?`;
        archiveParams.push(date_to + ' 23:59:59');
      }
      archiveSql += ` order by a.archived_at desc`;
      if (preview === 'true' && limit) {
        archiveSql += ` limit ?`;
        archiveParams.push(parseInt(limit) || 50);
      }
      const archives = db.prepare(archiveSql).all(...archiveParams);
      archives.forEach(a => {
        const object = a.cw ? `Karton ${a.cw}` : (a.olpn || a.carrier_tracking_nr || `#${a.inbound_id}`);
        activities.push({
          type: 'Archivierung',
          timestamp: a.timestamp,
          user: a.user || '-',
          object: object,
          from_location: a.location_code || '-',
          to_location: 'Archiv',
          inbound_id: a.inbound_id
        });
      });
      
      // Nach Zeitstempel sortieren
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Limit für Preview
      if (preview === 'true' && limit) {
        data = activities.slice(0, parseInt(limit) || 50);
      } else {
        data = activities;
      }
      
    } else {
      // Kartons exportieren (type === 'all' oder 'cartons' oder 'areas')
      sql = `
        select
          i.id,
          l.code as location_code,
          l.description as location_description,
          l.area,
          i.cw,
          i.aufgenommen_am,
          i.carrier_name,
          i.land,
          i.ship_status,
          i.planned_carton,
          i.actual_carton,
          i.olpn,
          i.carrier_tracking_nr,
          i.customer_id,
          i.customer_name,
          i.asn_ra_no,
          i.mh_status,
          i.kommentar,
          i.created_at,
          i.added_by
        from inbound_simple i
        left join location l on i.location_id = l.id
        where i.ignore_flag = 0
      `;
      
      if (type === 'areas' && areas) {
        const areaList = areas.split(',').filter(a => a);
        if (areaList.length > 0) {
          const placeholders = areaList.map(() => '?').join(',');
          sql += ` and l.area in (${placeholders})`;
          params.push(...areaList);
        }
      }
      
      sql += ` order by i.created_at desc`;
      
      if (preview === 'true' && limit) {
        sql += ` limit ?`;
        params.push(parseInt(limit) || 50);
      }
      
      const rows = db.prepare(sql).all(...params);
      data = rows.map(row => ({
        id: row.id,
        location_code: row.location_code || '',
        location_description: row.location_description || '',
        area: row.area || '',
        cw: row.cw || '',
        aufgenommen_am: row.aufgenommen_am || '',
        carrier_name: row.carrier_name || '',
        land: row.land || '',
        ship_status: row.ship_status || '',
        planned_carton: row.planned_carton || 0,
        actual_carton: row.actual_carton || 0,
        olpn: row.olpn || '',
        carrier_tracking_nr: row.carrier_tracking_nr || '',
        customer_id: row.customer_id || '',
        customer_name: row.customer_name || '',
        asn_ra_no: row.asn_ra_no || '',
        mh_status: row.mh_status || '',
        kommentar: row.kommentar || '',
        created_at: row.created_at || '',
        added_by: row.added_by || ''
      }));
    }
    
    // Spaltennamen-Mapping für Übersetzung
    const columnNameMapping = {
      'id': 'ID',
      'location_code': 'Stellplatz',
      'location_description': 'Stellplatz Beschreibung',
      'code': 'Stellplatz-Code',
      'description': 'Beschreibung',
      'area': 'Bereich',
      'is_active': 'Aktiv',
      'carton_count': 'Anzahl Kartons',
      'total_cartons': 'Gesamt Kartons',
      'last_booked_at': 'Zuletzt gebucht',
      'created_at': 'Erstellt am',
      'cw': 'CW',
      'aufgenommen_am': 'Aufgenommen am',
      'carrier_name': 'Carrier',
      'land': 'Land',
      'ship_status': 'Ship Status',
      'planned_carton': 'Geplante Kartons',
      'actual_carton': 'Tatsächliche Kartons',
      'olpn': 'OLPN',
      'carrier_tracking_nr': 'Tracking-Nr.',
      'customer_id': 'Kunden-ID',
      'customer_name': 'Kundenname',
      'asn_ra_no': 'ASN/RA-Nr.',
      'mh_status': 'MH Status',
      'kommentar': 'Kommentar',
      'added_by': 'Erstellt von',
      'timestamp': 'Datum/Zeit',
      'user': 'Benutzer',
      'inbound_id': 'Karton-ID',
      'from_location': 'Von Stellplatz',
      'to_location': 'Nach Stellplatz',
      'reason': 'Grund',
      'notes': 'Notizen',
      'type': 'Typ',
      'object': 'Objekt'
    };
    
    // Nur ausgewählte Spalten filtern und Namen übersetzen
    const filteredData = data.map(row => {
      const filtered = {};
      selectedColumns.forEach(col => {
        const translatedName = columnNameMapping[col] || col;
        filtered[translatedName] = row[col] !== null && row[col] !== undefined ? row[col] : '';
      });
      return filtered;
    });
    
    // Wenn Preview, JSON zurückgeben (mit originalen Spaltennamen für Frontend)
    if (preview === 'true') {
      const previewData = data.map(row => {
        const filtered = {};
        selectedColumns.forEach(col => {
          filtered[col] = row[col] !== null && row[col] !== undefined ? row[col] : '';
        });
        return filtered;
      });
      return res.json(previewData);
    }
    
    // Excel-Datei mit ExcelJS erstellen
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GXO Returns System';
    workbook.created = new Date();
    
    // Tabellenname basierend auf Typ
    const sheetNames = {
      'all': 'Lagerbestand',
      'locations': 'Stellplätze',
      'cartons': 'Kartons',
      'areas': 'Bereiche',
      'activities': 'Aktivitäten',
      'inbounds': 'Wareneingänge',
      'movements': 'Umlagerungen',
      'archives': 'Archivierungen'
    };
    const sheetName = sheetNames[type] || 'Export';
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Header-Bereich mit Logo und Export-Informationen
    let headerStartRow = 1;
    
    // Logo hinzufügen (falls vorhanden)
    const logoPath = path.join(__dirname, 'images', 'GXO_logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png'
        });
        // Logo in Zeile 1-3, Spalte A einfügen
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          ext: { width: 150, height: 50 }
        });
      } catch (logoError) {
        console.warn("Logo konnte nicht geladen werden:", logoError.message);
      }
    }
    
    // Export-Informationen rechts neben dem Logo
    const infoRow1 = worksheet.addRow([]);
    const infoRow2 = worksheet.addRow([]);
    const infoRow3 = worksheet.addRow([]);
    const infoRow4 = worksheet.addRow([]);
    
    // Export-Typ
    worksheet.getCell('E1').value = 'Export-Typ:';
    worksheet.getCell('E1').font = { bold: true, size: 11 };
    worksheet.getCell('F1').value = sheetName;
    worksheet.getCell('F1').font = { size: 11 };
    
    // Export-Datum
    worksheet.getCell('E2').value = 'Export-Datum:';
    worksheet.getCell('E2').font = { bold: true, size: 11 };
    worksheet.getCell('F2').value = new Date().toLocaleString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    worksheet.getCell('F2').font = { size: 11 };
    
    // Anzahl Datensätze
    worksheet.getCell('E3').value = 'Anzahl Datensätze:';
    worksheet.getCell('E3').font = { bold: true, size: 11 };
    worksheet.getCell('F3').value = filteredData.length;
    worksheet.getCell('F3').font = { size: 11 };
    
    // System-Info
    worksheet.getCell('E4').value = 'GXO Returns System v1.0';
    worksheet.getCell('E4').font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    
    // Leere Zeile für Abstand
    worksheet.addRow([]);
    headerStartRow = 6; // Start der Tabelle nach Logo und Infos
    
    // Prüfe ob Daten vorhanden sind
    if (filteredData.length === 0) {
      // Keine Daten - nur Header mit Meldung
      const headerRow = worksheet.addRow(['Keine Daten gefunden']);
      headerRow.getCell(1).font = { bold: true, size: 12 };
      headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      // Header-Zeile mit Überschriften
      const headerKeys = Object.keys(filteredData[0]);
      const headerRow = worksheet.addRow(headerKeys);
      
      // Header-Formatierung: Orange Hintergrund, weiße Schrift, fett
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF53B01' } // GXO Orange
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      // Daten-Zeilen hinzufügen
      filteredData.forEach((row, index) => {
        const dataRow = worksheet.addRow(Object.values(row));
        
        // Abwechselnde Zeilenfarben für bessere Lesbarkeit
        if (index % 2 === 0) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9F9F9' } // Sehr helles Grau
            };
          });
        }
        
        // Zell-Formatierung
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
      });
      
      // Spaltenbreiten automatisch anpassen
      worksheet.columns.forEach((column, index) => {
        let maxLength = 10;
        const header = headerRow.getCell(index + 1);
        if (header.value) {
          maxLength = Math.max(maxLength, String(header.value).length);
        }
        
        filteredData.forEach(row => {
          const value = Object.values(row)[index];
          if (value !== null && value !== undefined) {
            maxLength = Math.max(maxLength, String(value).length);
          }
        });
        
        column.width = Math.min(maxLength + 2, 50);
      });
      
      // Header-Zeile einfrieren (nach Logo-Bereich)
      worksheet.views = [{
        state: 'frozen',
        ySplit: headerStartRow - 1 // Einfrieren ab der Tabellen-Header-Zeile
      }];
      
      // Tabellenformat hinzufügen (Excel-Tabelle) - nur wenn mindestens 1 Datenzeile vorhanden ist
      if (filteredData.length > 0 && headerKeys.length > 0) {
        try {
          const numCols = headerKeys.length;
          const lastCol = numCols <= 26 
            ? String.fromCharCode(64 + numCols)
            : String.fromCharCode(64 + Math.floor((numCols - 1) / 26)) + String.fromCharCode(65 + ((numCols - 1) % 26));
          // Tabellen-Bereich beginnt bei headerStartRow
          const tableRange = `A${headerStartRow}:${lastCol}${headerStartRow + filteredData.length}`;
          
          // ExcelJS benötigt mindestens Header + 1 Datenzeile für Tabellen
          if (filteredData.length >= 1) {
            worksheet.addTable({
              name: 'ExportTable',
              ref: tableRange,
              headerRow: true,
              style: {
                theme: 'TableStyleMedium2',
                showFirstColumn: false,
                showLastColumn: false,
                showRowStripes: true,
                showColumnStripes: false
              },
              columns: headerKeys.map(key => ({ name: key }))
            });
          }
        } catch (tableError) {
          // Wenn Tabellen-Erstellung fehlschlägt, einfach ohne Tabelle fortfahren
          console.warn("Tabellenformat konnte nicht erstellt werden:", tableError.message);
        }
      }
    }
    
    // Spaltenbreiten für Info-Spalten anpassen
    worksheet.getColumn('E').width = 18;
    worksheet.getColumn('F').width = 25;
    
    // Excel-Datei generieren
    const excelBuffer = await workbook.xlsx.writeBuffer();
    
    // Dateiname mit Timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${sheetName}_Export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
    
  } catch (err) {
    console.error("Fehler beim Export:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 404 Handler für API-Routes - gibt immer JSON zurück (NACH allen API-Routen)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.error(`❌ API-Endpunkt nicht gefunden: ${req.method} ${req.path}`);
    return res.status(404).json({ 
      ok: false, 
      error: `API-Endpunkt nicht gefunden: ${req.method} ${req.path}` 
    });
  }
  next();
});

// Statischer Ordner für index.html und Bilder (NACH allen API-Routen)
app.use(express.static(path.join(__dirname)));

// Globaler Error-Handler - muss nach allen Routes kommen
app.use((err, req, res, next) => {
  console.error("❌ Unerwarteter Fehler:", err);
  res.status(err.status || 500).json({ 
    ok: false, 
    error: err.message || "Interner Serverfehler" 
  });
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
