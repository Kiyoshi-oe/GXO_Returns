# LVS Returns - Projektstruktur

## 📁 Ordnerstruktur

```
GXO_Returns/
├── server.js                 # Haupt-Server-Datei (Express)
├── package.json              # Node.js Dependencies
├── package-lock.json
├── lager.db                  # SQLite Datenbank
│
├── public/                   # Öffentliche/statische Dateien
│   ├── css/
│   │   └── style.css         # Haupt-Stylesheet
│   │
│   ├── js/
│   │   ├── core/            # Kern-Funktionalität
│   │   │   ├── app.js       # Haupt-App-Logik
│   │   │   ├── utils.js    # Utility-Funktionen
│   │   │   └── theme.js    # Theme-Management
│   │   │
│   │   ├── features/        # Feature-spezifische Module
│   │   │   ├── wareneingang.js  # Wareneingang-Logik
│   │   │   ├── import.js        # Import-Funktionalität
│   │   │   ├── export.js        # Export-Funktionalität
│   │   │   └── charts.js        # Chart-Initialisierung
│   │   │
│   │   ├── navigation/      # Navigation & Routing
│   │   │   ├── routing.js       # Client-seitiges Routing
│   │   │   ├── navigation.js   # Navigation-Handler
│   │   │   └── nav-init.js      # Navigation-Initialisierung
│   │   │
│   │   └── layout/          # Layout-Komponenten
│   │       └── layout.js        # Layout-Generierung
│   │
│   ├── images/              # Bilder und Assets
│   │   ├── CarrierLabels/   # Carrier-Label-Beispiele
│   │   ├── favicon.svg
│   │   └── GXO_logo.png
│   │
│   └── pages/               # HTML-Seiten
│       ├── dashboard.html
│       ├── lagerbestand.html
│       ├── wareneingang.html
│       ├── umlagerung.html
│       ├── archive.html
│       ├── ra-import.html
│       ├── einstellungen.html
│       ├── import.html
│       └── export.html
│
├── server/                  # Server-seitiger Code
│   ├── routes/             # API-Routen (zukünftig)
│   │   └── api.js          # API-Route-Handler
│   ├── database/           # Datenbank-Logik (zukünftig)
│   │   └── db.js           # Datenbank-Initialisierung
│   └── utils/              # Server-Utilities (zukünftig)
│       └── helpers.js       # Server-Helper-Funktionen
│
└── docs/                    # Dokumentation
    └── README.md            # Projekt-Dokumentation
```

## 📝 Beschreibung der Ordner

### `/public`
Enthält alle statischen Dateien, die direkt an den Client ausgeliefert werden.

- **`css/`**: Stylesheets
- **`js/`**: JavaScript-Module, organisiert nach Funktionalität
  - **`core/`**: Kern-Funktionalität, die von allen Features genutzt wird
  - **`features/`**: Feature-spezifische Module (Wareneingang, Import, Export, etc.)
  - **`navigation/`**: Navigation und Routing-Logik
  - **`layout/`**: Layout-Komponenten und Template-Generierung
- **`images/`**: Bilder, Icons, Logos
- **`pages/`**: HTML-Seiten für die Multi-Page-Anwendung

### `/server`
Server-seitiger Code (aktuell noch in `server.js`, zukünftig modularisiert).

- **`routes/`**: API-Route-Handler (für zukünftige Modularisierung)
- **`database/`**: Datenbank-Initialisierung und -Operationen
- **`utils/`**: Server-seitige Utility-Funktionen

### `/docs`
Projekt-Dokumentation und Entwickler-Handbücher.

## 🔄 Migration-Plan

1. ✅ Ordnerstruktur erstellen
2. ⏳ Dateien in neue Struktur verschieben
3. ⏳ Pfade in `server.js` aktualisieren
4. ⏳ Pfade in HTML-Dateien aktualisieren
5. ⏳ Tests durchführen

## 📌 Naming Conventions

- **Dateien**: camelCase für JavaScript, kebab-case für HTML/CSS
- **Ordner**: lowercase, Plural für Collections (z.B. `features/`, `routes/`)
- **JavaScript-Module**: ESM-ready, klare Exporte

## 🚀 Erweiterungen

Für neue Features:
1. Feature-Modul in `public/js/features/` erstellen
2. HTML-Seite in `public/pages/` erstellen
3. API-Route in `server/routes/` erstellen (wenn nötig)
4. Dokumentation in `docs/` aktualisieren





