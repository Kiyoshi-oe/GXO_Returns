# Multi-Language Support (DE/EN)

## Übersicht / Overview

Das LVS Returns WMS System unterstützt vollständige Mehrsprachigkeit in Deutsch und Englisch.

The LVS Returns WMS System supports full multi-language functionality in German and English.

---

## Features

### ✅ Unterstützte Sprachen / Supported Languages
- 🇩🇪 **Deutsch (DE)** - Standard / Default
- 🇬🇧 **English (EN)**

### ✅ Übersetzte Komponenten / Translated Components

1. **Navigation**
   - Alle Menüpunkte / All menu items
   - Seitentitel / Page titles
   - Breadcrumbs

2. **UI Komponenten / UI Components**
   - Buttons (Speichern, Abbrechen, etc.)
   - Labels und Platzhalter / Labels and placeholders
   - Fehlermeldungen / Error messages
   - Erfolgsmeldungen / Success messages

3. **Features**
   - ⌨️ **Keyboard Shortcuts** - Alle Beschreibungen / All descriptions
   - 🎯 **Command Palette** - Befehle und Platzhalter / Commands and placeholders
   - ⭐ **Favorites & Quick Actions** - Aktionen und Labels / Actions and labels
   - 🗺️ **Warehouse Map** - Details und Statistiken / Details and statistics
   - 📊 **Barcode Generator** - Alle Felder / All fields
   - 👥 **User Management** - Tabellen und Formulare / Tables and forms
   - 🔍 **Search** - Suchfelder und Ergebnisse / Search fields and results
   - 📤 **Export/Import** - Optionen und Meldungen / Options and messages

---

## Verwendung / Usage

### Sprache wechseln / Change Language

1. **UI Method:**
   - Klicken Sie auf das 🌐 Symbol in der Topbar
   - Click the 🌐 icon in the topbar
   - Wählen Sie Ihre Sprache / Select your language

2. **Programmatisch / Programmatically:**
   ```javascript
   // Sprache auf Englisch setzen / Set language to English
   i18n.setLanguage('en');
   
   // Sprache auf Deutsch setzen / Set language to German
   i18n.setLanguage('de');
   ```

### Übersetzungen verwenden / Using Translations

#### In JavaScript:
```javascript
// Einfache Übersetzung / Simple translation
const text = window.t('common.save'); // "Speichern" oder "Save"

// Mit Parametern / With parameters
const text = window.t('msg.welcome', { name: 'Max' }); // "Willkommen, Max!"
```

#### In HTML:
```html
<!-- Automatische Übersetzung / Automatic translation -->
<button data-i18n="common.save">Speichern</button>
<input data-i18n="common.search" placeholder="Suchen">

<!-- Die Texte werden automatisch übersetzt / Texts are automatically translated -->
```

---

## Übersetzungsschlüssel / Translation Keys

### Common / Allgemein
```javascript
'common.save'        // Speichern / Save
'common.cancel'      // Abbrechen / Cancel
'common.delete'      // Löschen / Delete
'common.edit'        // Bearbeiten / Edit
'common.add'         // Hinzufügen / Add
'common.search'      // Suchen / Search
'common.filter'      // Filtern / Filter
'common.export'      // Exportieren / Export
'common.import'      // Importieren / Import
'common.refresh'     // Aktualisieren / Refresh
'common.close'       // Schließen / Close
```

### Navigation
```javascript
'nav.dashboard'      // Dashboard
'nav.inbound'        // Wareneingang / Inbound
'nav.inventory'      // Lagerbestand / Inventory
'nav.movement'       // Umlagerung / Movement
'nav.archive'        // Archiv / Archive
'nav.search'         // Globale Suche / Global Search
'nav.warehouse-map'  // Lager-Visualisierung / Warehouse Visualization
'nav.barcode'        // Barcode Generator
'nav.settings'       // Einstellungen / Settings
```

### Keyboard Shortcuts
```javascript
'shortcuts.title'            // Tastenkürzel / Keyboard Shortcuts
'shortcuts.global-search'    // Globale Suche öffnen / Open Global Search
'shortcuts.command-palette'  // Befehlspalette öffnen / Open Command Palette
'shortcuts.show-shortcuts'   // Tastenkürzel anzeigen / Show Shortcuts
```

### Warehouse Map
```javascript
'wmap.location-details'   // Stellplatz-Details / Location Details
'wmap.location'           // Stellplatz / Location
'wmap.area'               // Bereich / Area
'wmap.capacity'           // Kapazität / Capacity
'wmap.utilization'        // Auslastung / Utilization
'wmap.cartons'            // Kartons auf diesem Platz / Cartons at this location
'wmap.recent-movements'   // Letzte Bewegungen / Recent Movements
'wmap.statistics'         // Statistik / Statistics
'wmap.view-2d'            // 2D Ansicht / 2D View
'wmap.view-3d'            // 3D Ansicht / 3D View
```

### User Management
```javascript
'users.title'       // Benutzerverwaltung / User Management
'users.username'    // Benutzername / Username
'users.email'       // E-Mail / Email
'users.role'        // Rolle / Role
'users.status'      // Status
'users.active'      // Aktiv / Active
'users.inactive'    // Inaktiv / Inactive
```

---

## Neue Übersetzungen hinzufügen / Adding New Translations

### 1. Übersetzungen zur i18n.js hinzufügen / Add translations to i18n.js

```javascript
// In public/js/core/i18n.js
this.translations = {
  de: {
    'my.new.key': 'Mein neuer Text',
    // ...
  },
  en: {
    'my.new.key': 'My new text',
    // ...
  }
};
```

### 2. In HTML verwenden / Use in HTML

```html
<button data-i18n="my.new.key">Fallback Text</button>
```

### 3. In JavaScript verwenden / Use in JavaScript

```javascript
const text = window.t('my.new.key');
```

---

## Persistenz / Persistence

Die gewählte Sprache wird automatisch im LocalStorage gespeichert und beim nächsten Besuch wiederhergestellt.

The selected language is automatically saved in LocalStorage and restored on the next visit.

```javascript
// Gespeichert als / Saved as:
localStorage.getItem('wms_language'); // 'de' oder 'en'
```

---

## Events

### Language Changed Event

Komponenten können auf Sprachwechsel reagieren:

Components can react to language changes:

```javascript
window.addEventListener('languageChanged', (event) => {
  const newLanguage = event.detail.language;
  console.log('Language changed to:', newLanguage);
  
  // Update your component
  updateMyComponent();
});
```

---

## Best Practices

### ✅ DO / Empfohlen:
- Verwenden Sie immer Übersetzungsschlüssel / Always use translation keys
- Gruppieren Sie verwandte Übersetzungen / Group related translations
- Verwenden Sie aussagekräftige Schlüssel / Use descriptive keys
- Testen Sie beide Sprachen / Test both languages

### ❌ DON'T / Nicht empfohlen:
- Hardcodierte Texte in UI / Hardcoded texts in UI
- Lange Übersetzungsschlüssel / Long translation keys
- Duplikate / Duplicates
- Fehlende Übersetzungen / Missing translations

---

## Vollständige Übersetzungsliste / Complete Translation List

Siehe `public/js/core/i18n.js` für die vollständige Liste aller verfügbaren Übersetzungsschlüssel.

See `public/js/core/i18n.js` for the complete list of all available translation keys.

---

## Support

Bei Fragen oder Problemen mit der Mehrsprachigkeit:

For questions or issues with multi-language support:

1. Prüfen Sie die Konsole auf Fehler / Check console for errors
2. Stellen Sie sicher, dass `i18n.js` geladen ist / Ensure `i18n.js` is loaded
3. Überprüfen Sie die Übersetzungsschlüssel / Verify translation keys
4. Testen Sie in beiden Sprachen / Test in both languages

---

**Version:** 1.0  
**Letzte Aktualisierung / Last Update:** Januar 2026  
**Unterstützte Sprachen / Supported Languages:** DE, EN
