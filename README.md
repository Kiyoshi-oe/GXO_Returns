# LVS Returns - Warehouse Management System

Ein modernes Warehouse Management System für GXO Logistics, entwickelt für die Verwaltung von Retouren und Lagerbeständen.

## 📋 Inhaltsverzeichnis

- [Projektstruktur](#projektstruktur)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [Entwicklung](#entwicklung)
- [API-Dokumentation](#api-dokumentation)
- [Technologien](#technologien)

## 📁 Projektstruktur

Siehe [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) für eine detaillierte Übersicht.

```
GXO_Returns/
├── public/              # Statische Dateien (Client-seitig)
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript-Module
│   │   ├── core/       # Kern-Funktionalität
│   │   ├── features/   # Feature-Module
│   │   ├── navigation/ # Navigation & Routing
│   │   └── layout/     # Layout-Komponenten
│   ├── images/         # Bilder und Assets
│   └── pages/          # HTML-Seiten
├── server/             # Server-seitiger Code (zukünftig modularisiert)
└── docs/               # Dokumentation
```

## 🚀 Installation

### Voraussetzungen

- Node.js (v14 oder höher)
- npm oder yarn

### Setup

1. Repository klonen oder herunterladen
2. Dependencies installieren:

```bash
npm install
```

3. Datenbank wird automatisch beim ersten Start erstellt (`lager.db`)

## 💻 Verwendung

### Server starten

```bash
npm start
```

Der Server läuft standardmäßig auf `http://localhost:3000`

### Verfügbare Seiten

- `/` oder `/dashboard` - Dashboard mit Übersicht
- `/lagerbestand` - Lagerbestand-Verwaltung
- `/wareneingang` - Wareneingang erfassen
- `/umlagerung` - Umlagerungen durchführen
- `/archive` - Archivierte Bestände
- `/ra-import` - RA Import (zukünftig)
- `/einstellungen` - System-Einstellungen (PIN: 0000)
- `/import` - Excel-Import
- `/export` - Excel-Export

## 🛠️ Entwicklung

### Code-Struktur

#### Client-seitig (`public/js/`)

- **`core/`**: Basis-Funktionalität (app.js, utils.js, theme.js)
- **`features/`**: Feature-spezifische Module
- **`navigation/`**: Routing und Navigation
- **`layout/`**: Layout-Generierung

#### Server-seitig (`server.js`)

Aktuell monolithisch, zukünftig modularisiert in:
- `server/routes/` - API-Routen
- `server/database/` - Datenbank-Logik
- `server/utils/` - Server-Utilities

### Neue Features hinzufügen

1. **Feature-Modul erstellen**:
   ```javascript
   // public/js/features/mein-feature.js
   export function initMeinFeature() {
     // Feature-Logik
   }
   ```

2. **HTML-Seite erstellen**:
   ```html
   <!-- public/pages/mein-feature.html -->
   ```

3. **Route in `server.js` hinzufügen**:
   ```javascript
   '/mein-feature': 'mein-feature.html'
   ```

4. **Navigation aktualisieren**:
   - In `public/js/layout/layout.js` Navigation-Item hinzufügen

### Naming Conventions

- **Dateien**: camelCase für JavaScript, kebab-case für HTML/CSS
- **Ordner**: lowercase, Plural für Collections
- **JavaScript-Module**: ESM-ready, klare Exporte

## 📡 API-Dokumentation

### Endpunkte

#### Wareneingang
- `GET /api/inbound` - Liste aller Wareneingänge
- `POST /api/inbound` - Neuen Wareneingang erstellen
- `PUT /api/inbound/:id` - Wareneingang aktualisieren

#### Lagerbestand
- `GET /api/warehouse` - Lagerbestand abrufen
- `GET /api/locations` - Stellplätze abrufen

#### Einstellungen
- `GET /api/carriers` - Carrier-Liste
- `POST /api/carriers` - Carrier erstellen/aktualisieren

Vollständige API-Dokumentation folgt.

## 🗄️ Datenbank

Das System verwendet SQLite (`lager.db`) mit folgenden Haupt-Tabellen:

- `location` - Stellplätze
- `inbound` - Wareneingänge
- `carrier` - Versanddienstleister
- `audit_log` - Änderungshistorie

## 🎨 Technologien

- **Backend**: Node.js, Express.js
- **Datenbank**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js
- **Excel**: ExcelJS, XLSX

## 📝 Lizenz

Proprietär - GXO Logistics

## 👥 Entwickler

Für Fragen zur Code-Struktur oder Erweiterungen, siehe [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).



