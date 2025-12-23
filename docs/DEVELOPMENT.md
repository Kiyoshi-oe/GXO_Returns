# Entwickler-Handbuch

## 🏗️ Projektstruktur

Das Projekt folgt einer klaren, modularen Struktur für einfache Wartbarkeit und Erweiterbarkeit.

### Client-seitige Struktur (`public/`)

#### JavaScript-Module (`public/js/`)

Die JavaScript-Dateien sind in logische Module unterteilt:

**`core/`** - Kern-Funktionalität
- `app.js` - Haupt-App-Logik und Initialisierung
- `utils.js` - Utility-Funktionen (Formatierung, Validierung, etc.)
- `theme.js` - Theme-Management (Dark/Light Mode)

**`features/`** - Feature-spezifische Module
- `wareneingang.js` - Wareneingang-Logik
- `import.js` - Excel-Import-Funktionalität
- `export.js` - Excel-Export-Funktionalität
- `charts.js` - Chart.js Initialisierung und Konfiguration

**`navigation/`** - Navigation & Routing
- `routing.js` - Client-seitiges Routing (für SPA-Funktionalität)
- `navigation.js` - Navigation-Event-Handler
- `nav-init.js` - Navigation-Initialisierung für Multi-Page-App

**`layout/`** - Layout-Komponenten
- `layout.js` - HTML-Layout-Generierung (Sidebar, Topbar, etc.)

#### HTML-Seiten (`public/pages/`)

Jede Seite ist eine eigenständige HTML-Datei:
- `dashboard.html` - Dashboard
- `lagerbestand.html` - Lagerbestand
- `wareneingang.html` - Wareneingang
- `umlagerung.html` - Umlagerung
- `archive.html` - Archiv
- `ra-import.html` - RA Import
- `einstellungen.html` - Einstellungen
- `import.html` - Import
- `export.html` - Export

### Server-seitige Struktur

Aktuell ist der Server-Code in `server.js` monolithisch. Für zukünftige Erweiterungen ist eine Modularisierung in `server/` geplant:

- `server/routes/` - API-Route-Handler
- `server/database/` - Datenbank-Initialisierung und -Operationen
- `server/utils/` - Server-seitige Utility-Funktionen

## 🔧 Neue Features hinzufügen

### 1. Neues Feature-Modul erstellen

```javascript
// public/js/features/mein-neues-feature.js

/**
 * Initialisiert das neue Feature
 */
export function initMeinNeuesFeature() {
  // Feature-Logik hier
  console.log('Mein neues Feature initialisiert');
}

// Event-Listener, etc.
document.addEventListener('DOMContentLoaded', () => {
  initMeinNeuesFeature();
});
```

### 2. HTML-Seite erstellen

```html
<!-- public/pages/mein-neues-feature.html -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>LVS Returns - Mein Neues Feature</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <!-- Inhalt -->
  <script src="/js/features/mein-neues-feature.js"></script>
</body>
</html>
```

### 3. Route in server.js hinzufügen

```javascript
// In server.js, im pageRoutes-Objekt:
const pageRoutes = {
  // ... bestehende Routes
  '/mein-neues-feature': 'mein-neues-feature.html'
};

// In der app.get()-Route:
app.get(['/', '/dashboard', /* ... */, '/mein-neues-feature'], (req, res) => {
  // ...
});
```

### 4. Navigation aktualisieren

In `public/js/layout/layout.js` die Navigation erweitern:

```javascript
const navItems = [
  // ... bestehende Items
  { view: "mein-neues-feature", icon: "🆕", text: "Mein Feature", section: "Ansichten" }
];
```

## 📝 Code-Standards

### JavaScript

- **ES6+ Syntax** verwenden
- **Klare Funktionsnamen** (camelCase)
- **JSDoc-Kommentare** für öffentliche Funktionen
- **Modulare Struktur** - jede Datei hat eine klare Verantwortlichkeit

### HTML

- **Semantisches HTML5**
- **Accessibility** beachten (ARIA-Labels, etc.)
- **Konsistente Einrückung** (2 Leerzeichen)

### CSS

- **CSS-Variablen** für Theme-Farben verwenden
- **BEM-ähnliche Namenskonvention** für Klassen
- **Mobile-First** Ansatz

## 🧪 Testing

Aktuell keine automatisierten Tests. Für zukünftige Entwicklung:

- Unit-Tests für Utility-Funktionen
- Integration-Tests für API-Endpunkte
- E2E-Tests für kritische User-Flows

## 🐛 Debugging

### Client-seitig

- Browser DevTools verwenden
- `console.log()` für Debugging (in Produktion entfernen)
- Network-Tab für API-Requests prüfen

### Server-seitig

- Server-Logs in der Konsole
- `server_error.txt` für Fehler-Logs
- SQLite-Datenbank direkt prüfen (z.B. mit DB Browser)

## 📚 Wichtige Dateien

- `server.js` - Haupt-Server-Datei, alle API-Routen
- `public/js/core/app.js` - Client-seitige App-Initialisierung
- `public/js/core/utils.js` - Gemeinsame Utility-Funktionen
- `PROJECT_STRUCTURE.md` - Detaillierte Projektstruktur
- `README.md` - Projekt-Übersicht

## 🔄 Migration von altem Code

Wenn Code aus der monolithischen Struktur migriert wird:

1. **Funktionalität identifizieren** (Core, Feature, Navigation, Layout)
2. **In entsprechenden Ordner verschieben**
3. **Pfade in HTML-Dateien aktualisieren**
4. **Imports/Exports anpassen** (falls ESM verwendet wird)
5. **Testen!**

## 💡 Best Practices

1. **DRY (Don't Repeat Yourself)** - Gemeinsame Logik in `utils.js`
2. **Separation of Concerns** - Klare Trennung von Logik, Präsentation, Daten
3. **Konsistente Namensgebung** - Siehe Naming Conventions
4. **Dokumentation** - Code kommentieren, besonders komplexe Logik
5. **Version Control** - Sinnvolle Commit-Messages


<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
