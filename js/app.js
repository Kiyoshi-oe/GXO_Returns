// LVS Returns - Haupt-App-Logik
// Globale Variablen
let carriersData = [];
let currentWindowsUser = "Unbekannt";
let currentCarrier = null;
let areaOptions = [];
let landOptions = [];
let isBulkMode = false;
let bulkDefaults = {};
let bulkSavedCount = 0;

// View Metadaten
const viewMeta = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Überblick über Lager und Retouren"
  },
  inventory: {
    title: "Lagerbestand",
    subtitle: "Stellplätze mit Anzahl der Paletten und Kartons aus der Datenbank"
  },
  inbound: {
    title: "Wareneingang",
    subtitle: "Einfache Erfassung neuer Paletten und Kartons"
  },
  move: {
    title: "Umlagerung",
    subtitle: "Stellplatz Wechsel von Palette oder Karton"
  },
  archive: {
    title: "Archiv",
    subtitle: "Übersicht archivierter Bestände"
  },
  ra: {
    title: "RA Import",
    subtitle: "Layout für den späteren Abgleich mit Excel Bericht"
  },
  settings: {
    title: "Einstellungen",
    subtitle: "Carrier-Konfiguration und Dropdown-Optionen verwalten"
  },
  export: {
    title: "Export",
    subtitle: "Lagerbestand als Excel-Datei exportieren"
  }
};

// Initialisierung
console.log("✅ App.js geladen");





