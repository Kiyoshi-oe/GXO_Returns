// LVS Returns - Internationalization (i18n)
// Multi-Language Support: DE/EN
// ============================================

class I18n {
  constructor() {
    this.currentLang = 'de'; // Default: Deutsch
    this.translations = {};
    this.init();
  }

  async init() {
    // Lade gespeicherte Sprache
    const savedLang = localStorage.getItem('wms_language') || 'de';
    
    // Lade Übersetzungen
    await this.loadTranslations();
    
    // Setze Sprache
    await this.setLanguage(savedLang);
    
    // Füge Language Switcher hinzu
    this.addLanguageSwitcher();
    
    console.log('✅ i18n initialisiert (Sprache: ' + this.currentLang + ')');
  }

  // Load translations
  async loadTranslations() {
    this.translations = {
      de: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.inbound': 'Wareneingang',
        'nav.inventory': 'Lagerbestand',
        'nav.movement': 'Umlagerung',
        'nav.archive': 'Archiv',
        'nav.search': 'Globale Suche',
        'nav.warehouse-map': 'Lager-Visualisierung',
        'nav.barcode': 'Barcode Generator',
        'nav.ra-import': 'RA Import',
        'nav.performance': 'Performance',
        'nav.settings': 'Einstellungen',
        'nav.data-management': 'Datenverwaltung',
        
        // Common
        'common.save': 'Speichern',
        'common.cancel': 'Abbrechen',
        'common.delete': 'Löschen',
        'common.edit': 'Bearbeiten',
        'common.add': 'Hinzufügen',
        'common.search': 'Suchen',
        'common.filter': 'Filtern',
        'common.export': 'Exportieren',
        'common.import': 'Importieren',
        'common.refresh': 'Aktualisieren',
        'common.close': 'Schließen',
        'common.yes': 'Ja',
        'common.no': 'Nein',
        'common.loading': 'Lädt...',
        'common.error': 'Fehler',
        'common.success': 'Erfolg',
        'common.warning': 'Warnung',
        'common.info': 'Information',
        
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'Übersicht über Ihr Lager',
        'dashboard.total-locations': 'Gesamt Stellplätze',
        'dashboard.occupied': 'Belegt',
        'dashboard.free': 'Frei',
        'dashboard.utilization': 'Auslastung',
        
        // Warehouse Map
        'warehouse-map.title': 'Lagerplatz-Visualisierung',
        'warehouse-map.subtitle': 'Interaktive Heatmap mit Echtzeit-Auslastung',
        'warehouse-map.area': 'Bereich',
        'warehouse-map.all-areas': 'Alle Bereiche',
        'warehouse-map.view-mode': 'Ansicht',
        'warehouse-map.heatmap': 'Heatmap (Auslastung)',
        'warehouse-map.grid': 'Grid (Übersicht)',
        'warehouse-map.list': 'Liste',
        'warehouse-map.show-empty': 'Leere Plätze anzeigen',
        'warehouse-map.refresh': 'Aktualisieren',
        
        // Inbound
        'inbound.title': 'Wareneingang',
        'inbound.subtitle': 'Erfassen Sie neue Wareneingänge',
        'inbound.carrier': 'Carrier',
        'inbound.tracking': 'Tracking-Nr.',
        'inbound.cartons': 'Kartons',
        'inbound.location': 'Stellplatz',
        
        // Inventory
        'inventory.title': 'Lagerbestand',
        'inventory.subtitle': 'Übersicht über Ihren Lagerbestand',
        'inventory.location-code': 'Stellplatz',
        'inventory.area': 'Bereich',
        'inventory.cartons': 'Kartons',
        'inventory.utilization': 'Auslastung',
        'inventory.status': 'Status',
        
        // Settings
        'settings.title': 'Einstellungen',
        'settings.subtitle': 'System-Konfiguration',
        'settings.language': 'Sprache',
        'settings.theme': 'Theme',
        'settings.notifications': 'Benachrichtigungen',
        
        // Messages
        'msg.save-success': 'Erfolgreich gespeichert',
        'msg.save-error': 'Fehler beim Speichern',
        'msg.delete-confirm': 'Möchten Sie diesen Eintrag wirklich löschen?',
        'msg.no-data': 'Keine Daten verfügbar',
        'msg.loading-data': 'Daten werden geladen...',
        
        // Keyboard Shortcuts
        'shortcuts.title': 'Tastenkürzel',
        'shortcuts.global-search': 'Globale Suche öffnen',
        'shortcuts.command-palette': 'Befehlspalette öffnen',
        'shortcuts.show-shortcuts': 'Tastenkürzel anzeigen',
        'shortcuts.quick-inbound': 'Schnell-Wareneingang',
        'shortcuts.quick-search': 'Zur Suche springen',
        'shortcuts.warehouse-map': 'Lager-Visualisierung',
        'shortcuts.refresh': 'Seite aktualisieren',
        'shortcuts.export': 'Exportieren',
        
        // Command Palette
        'cmd.search-placeholder': 'Befehl suchen... (Strg+P)',
        'cmd.close-hint': 'ESC zum Schließen',
        'cmd.no-results': 'Keine Befehle gefunden',
        'cmd.dashboard': 'Dashboard öffnen',
        'cmd.inbound': 'Wareneingang öffnen',
        'cmd.inventory': 'Lagerbestand öffnen',
        'cmd.search': 'Suche öffnen',
        'cmd.warehouse-map': 'Lager-Visualisierung öffnen',
        'cmd.barcode': 'Barcode Generator öffnen',
        'cmd.settings': 'Einstellungen öffnen',
        'cmd.export': 'Export öffnen',
        'cmd.import': 'Import öffnen',
        'cmd.refresh': 'Seite aktualisieren',
        'cmd.theme-toggle': 'Theme wechseln',
        
        // Quick Actions / Favorites
        'favorites.title': 'Favoriten verwalten',
        'favorites.my-favorites': 'Meine Favoriten',
        'favorites.available-actions': 'Verfügbare Aktionen',
        'favorites.no-favorites': 'Noch keine Favoriten hinzugefügt',
        'favorites.remove': 'Entfernen',
        'favorites.added': 'Hinzugefügt',
        'favorites.manage': 'Favoriten verwalten',
        'favorites.new-inbound': 'Neuer Wareneingang',
        'favorites.search': 'Suche',
        'favorites.warehouse-map': 'Lager-Karte',
        'favorites.refresh': 'Aktualisieren',
        'favorites.export': 'Exportieren',
        
        // Warehouse Map Details
        'wmap.location-details': 'Stellplatz-Details',
        'wmap.location': 'Stellplatz',
        'wmap.area': 'Bereich',
        'wmap.capacity': 'Kapazität',
        'wmap.occupied': 'Belegt',
        'wmap.free': 'Frei',
        'wmap.utilization': 'Auslastung',
        'wmap.cartons': 'Kartons auf diesem Platz',
        'wmap.no-cartons': 'Keine Kartons auf diesem Stellplatz',
        'wmap.recent-movements': 'Letzte Bewegungen',
        'wmap.statistics': 'Statistik',
        'wmap.total-locations': 'Gesamt Stellplätze',
        'wmap.occupied-locations': 'Belegte Plätze',
        'wmap.free-locations': 'Freie Plätze',
        'wmap.total-cartons': 'Gesamt Kartons',
        'wmap.view-2d': '2D Ansicht',
        'wmap.view-3d': '3D Ansicht',
        'wmap.legend': 'Legende',
        'wmap.legend-empty': 'Leer',
        'wmap.legend-low': 'Niedrig',
        'wmap.legend-medium': 'Mittel',
        'wmap.legend-high': 'Hoch',
        'wmap.legend-full': 'Voll',
        
        // Barcode Generator
        'barcode.title': 'Barcode Generator',
        'barcode.subtitle': 'Erstellen Sie verschiedene Barcode-Typen',
        'barcode.type': 'Barcode-Typ',
        'barcode.content': 'Inhalt',
        'barcode.width': 'Breite',
        'barcode.height': 'Höhe',
        'barcode.display-value': 'Wert anzeigen',
        'barcode.font-size': 'Schriftgröße',
        'barcode.generate': 'Barcode generieren',
        'barcode.download-png': 'Als PNG herunterladen',
        'barcode.download-svg': 'Als SVG herunterladen',
        'barcode.batch-title': 'Batch-Generierung',
        'barcode.batch-subtitle': 'Mehrere Barcodes auf einmal erstellen',
        'barcode.batch-input': 'Ein Wert pro Zeile',
        'barcode.batch-generate': 'Batch generieren',
        'barcode.batch-download': 'Alle herunterladen',
        
        // User Management
        'users.title': 'Benutzerverwaltung',
        'users.username': 'Benutzername',
        'users.name': 'Name',
        'users.email': 'E-Mail',
        'users.role': 'Rolle',
        'users.status': 'Status',
        'users.last-login': 'Letzter Login',
        'users.actions': 'Aktionen',
        'users.active': 'Aktiv',
        'users.inactive': 'Inaktiv',
        'users.never': 'Nie',
        'users.edit': 'Bearbeiten',
        'users.delete': 'Löschen',
        'users.add-user': 'Benutzer hinzufügen',
        'users.no-users': 'Keine Benutzer gefunden',
        'users.role-admin': 'Administrator',
        'users.role-manager': 'Manager',
        'users.role-operator': 'Operator',
        
        // Search
        'search.title': 'Globale Suche',
        'search.subtitle': 'Durchsuchen Sie alle Daten',
        'search.placeholder': 'Suchen...',
        'search.no-results': 'Keine Ergebnisse gefunden',
        'search.results': 'Ergebnisse',
        'search.filter-by': 'Filtern nach',
        
        // Export/Import
        'export.title': 'Daten exportieren',
        'export.subtitle': 'Exportieren Sie Ihre Daten',
        'export.format': 'Format',
        'export.date-range': 'Zeitraum',
        'export.columns': 'Spalten',
        'export.start': 'Export starten',
        'import.title': 'Daten importieren',
        'import.subtitle': 'Importieren Sie Daten',
        'import.select-file': 'Datei auswählen',
        'import.upload': 'Hochladen',
        'import.mapping': 'Feld-Zuordnung',
        
        // Archive
        'archive.title': 'Archiv',
        'archive.subtitle': 'Archivierte Einträge',
        'archive.date': 'Datum',
        'archive.type': 'Typ',
        'archive.restore': 'Wiederherstellen',
        
        // Performance
        'performance.title': 'Performance',
        'performance.subtitle': 'Leistungsübersicht',
        'performance.today': 'Heute',
        'performance.week': 'Diese Woche',
        'performance.month': 'Dieser Monat',
        'performance.year': 'Dieses Jahr',
        
        // Movement
        'movement.title': 'Umlagerung',
        'movement.subtitle': 'Kartons zwischen Stellplätzen bewegen',
        'movement.from': 'Von',
        'movement.to': 'Nach',
        'movement.olpn': 'OLPN',
        'movement.move': 'Umlagern',
        'movement.history': 'Verlauf',
      },
      en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.inbound': 'Inbound',
        'nav.inventory': 'Inventory',
        'nav.movement': 'Movement',
        'nav.archive': 'Archive',
        'nav.search': 'Global Search',
        'nav.warehouse-map': 'Warehouse Visualization',
        'nav.barcode': 'Barcode Generator',
        'nav.ra-import': 'RA Import',
        'nav.performance': 'Performance',
        'nav.settings': 'Settings',
        'nav.data-management': 'Data Management',
        
        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.add': 'Add',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.export': 'Export',
        'common.import': 'Import',
        'common.refresh': 'Refresh',
        'common.close': 'Close',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.warning': 'Warning',
        'common.info': 'Information',
        
        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'Overview of your warehouse',
        'dashboard.total-locations': 'Total Locations',
        'dashboard.occupied': 'Occupied',
        'dashboard.free': 'Free',
        'dashboard.utilization': 'Utilization',
        
        // Warehouse Map
        'warehouse-map.title': 'Warehouse Visualization',
        'warehouse-map.subtitle': 'Interactive heatmap with real-time utilization',
        'warehouse-map.area': 'Area',
        'warehouse-map.all-areas': 'All Areas',
        'warehouse-map.view-mode': 'View Mode',
        'warehouse-map.heatmap': 'Heatmap (Utilization)',
        'warehouse-map.grid': 'Grid (Overview)',
        'warehouse-map.list': 'List',
        'warehouse-map.show-empty': 'Show empty locations',
        'warehouse-map.refresh': 'Refresh',
        
        // Inbound
        'inbound.title': 'Inbound',
        'inbound.subtitle': 'Record new inbound shipments',
        'inbound.carrier': 'Carrier',
        'inbound.tracking': 'Tracking No.',
        'inbound.cartons': 'Cartons',
        'inbound.location': 'Location',
        
        // Inventory
        'inventory.title': 'Inventory',
        'inventory.subtitle': 'Overview of your inventory',
        'inventory.location-code': 'Location',
        'inventory.area': 'Area',
        'inventory.cartons': 'Cartons',
        'inventory.utilization': 'Utilization',
        'inventory.status': 'Status',
        
        // Settings
        'settings.title': 'Settings',
        'settings.subtitle': 'System Configuration',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        'settings.notifications': 'Notifications',
        
        // Messages
        'msg.save-success': 'Successfully saved',
        'msg.save-error': 'Error saving',
        'msg.delete-confirm': 'Do you really want to delete this entry?',
        'msg.no-data': 'No data available',
        'msg.loading-data': 'Loading data...',
        
        // Keyboard Shortcuts
        'shortcuts.title': 'Keyboard Shortcuts',
        'shortcuts.global-search': 'Open Global Search',
        'shortcuts.command-palette': 'Open Command Palette',
        'shortcuts.show-shortcuts': 'Show Shortcuts',
        'shortcuts.quick-inbound': 'Quick Inbound',
        'shortcuts.quick-search': 'Jump to Search',
        'shortcuts.warehouse-map': 'Warehouse Visualization',
        'shortcuts.refresh': 'Refresh Page',
        'shortcuts.export': 'Export',
        
        // Command Palette
        'cmd.search-placeholder': 'Search command... (Ctrl+P)',
        'cmd.close-hint': 'ESC to close',
        'cmd.no-results': 'No commands found',
        'cmd.dashboard': 'Open Dashboard',
        'cmd.inbound': 'Open Inbound',
        'cmd.inventory': 'Open Inventory',
        'cmd.search': 'Open Search',
        'cmd.warehouse-map': 'Open Warehouse Visualization',
        'cmd.barcode': 'Open Barcode Generator',
        'cmd.settings': 'Open Settings',
        'cmd.export': 'Open Export',
        'cmd.import': 'Open Import',
        'cmd.refresh': 'Refresh Page',
        'cmd.theme-toggle': 'Toggle Theme',
        
        // Quick Actions / Favorites
        'favorites.title': 'Manage Favorites',
        'favorites.my-favorites': 'My Favorites',
        'favorites.available-actions': 'Available Actions',
        'favorites.no-favorites': 'No favorites added yet',
        'favorites.remove': 'Remove',
        'favorites.added': 'Added',
        'favorites.manage': 'Manage Favorites',
        'favorites.new-inbound': 'New Inbound',
        'favorites.search': 'Search',
        'favorites.warehouse-map': 'Warehouse Map',
        'favorites.refresh': 'Refresh',
        'favorites.export': 'Export',
        
        // Warehouse Map Details
        'wmap.location-details': 'Location Details',
        'wmap.location': 'Location',
        'wmap.area': 'Area',
        'wmap.capacity': 'Capacity',
        'wmap.occupied': 'Occupied',
        'wmap.free': 'Free',
        'wmap.utilization': 'Utilization',
        'wmap.cartons': 'Cartons at this location',
        'wmap.no-cartons': 'No cartons at this location',
        'wmap.recent-movements': 'Recent Movements',
        'wmap.statistics': 'Statistics',
        'wmap.total-locations': 'Total Locations',
        'wmap.occupied-locations': 'Occupied Locations',
        'wmap.free-locations': 'Free Locations',
        'wmap.total-cartons': 'Total Cartons',
        'wmap.view-2d': '2D View',
        'wmap.view-3d': '3D View',
        'wmap.legend': 'Legend',
        'wmap.legend-empty': 'Empty',
        'wmap.legend-low': 'Low',
        'wmap.legend-medium': 'Medium',
        'wmap.legend-high': 'High',
        'wmap.legend-full': 'Full',
        
        // Barcode Generator
        'barcode.title': 'Barcode Generator',
        'barcode.subtitle': 'Create different barcode types',
        'barcode.type': 'Barcode Type',
        'barcode.content': 'Content',
        'barcode.width': 'Width',
        'barcode.height': 'Height',
        'barcode.display-value': 'Display Value',
        'barcode.font-size': 'Font Size',
        'barcode.generate': 'Generate Barcode',
        'barcode.download-png': 'Download as PNG',
        'barcode.download-svg': 'Download as SVG',
        'barcode.batch-title': 'Batch Generation',
        'barcode.batch-subtitle': 'Create multiple barcodes at once',
        'barcode.batch-input': 'One value per line',
        'barcode.batch-generate': 'Generate Batch',
        'barcode.batch-download': 'Download All',
        
        // User Management
        'users.title': 'User Management',
        'users.username': 'Username',
        'users.name': 'Name',
        'users.email': 'Email',
        'users.role': 'Role',
        'users.status': 'Status',
        'users.last-login': 'Last Login',
        'users.actions': 'Actions',
        'users.active': 'Active',
        'users.inactive': 'Inactive',
        'users.never': 'Never',
        'users.edit': 'Edit',
        'users.delete': 'Delete',
        'users.add-user': 'Add User',
        'users.no-users': 'No users found',
        'users.role-admin': 'Administrator',
        'users.role-manager': 'Manager',
        'users.role-operator': 'Operator',
        
        // Search
        'search.title': 'Global Search',
        'search.subtitle': 'Search all data',
        'search.placeholder': 'Search...',
        'search.no-results': 'No results found',
        'search.results': 'Results',
        'search.filter-by': 'Filter by',
        
        // Export/Import
        'export.title': 'Export Data',
        'export.subtitle': 'Export your data',
        'export.format': 'Format',
        'export.date-range': 'Date Range',
        'export.columns': 'Columns',
        'export.start': 'Start Export',
        'import.title': 'Import Data',
        'import.subtitle': 'Import data',
        'import.select-file': 'Select File',
        'import.upload': 'Upload',
        'import.mapping': 'Field Mapping',
        
        // Archive
        'archive.title': 'Archive',
        'archive.subtitle': 'Archived entries',
        'archive.date': 'Date',
        'archive.type': 'Type',
        'archive.restore': 'Restore',
        
        // Performance
        'performance.title': 'Performance',
        'performance.subtitle': 'Performance Overview',
        'performance.today': 'Today',
        'performance.week': 'This Week',
        'performance.month': 'This Month',
        'performance.year': 'This Year',
        
        // Movement
        'movement.title': 'Movement',
        'movement.subtitle': 'Move cartons between locations',
        'movement.from': 'From',
        'movement.to': 'To',
        'movement.olpn': 'OLPN',
        'movement.move': 'Move',
        'movement.history': 'History',
      }
    };
  }

  // Set language
  async setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language ${lang} not available, falling back to German`);
      lang = 'de';
    }
    
    this.currentLang = lang;
    localStorage.setItem('wms_language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Translate page
    this.translatePage();
    
    // Update language switcher
    this.updateLanguageSwitcher();
    
    // Update dynamic components
    this.updateDynamicComponents();
  }
  
  // Update dynamic components (keyboard shortcuts, favorites, etc.)
  updateDynamicComponents() {
    // Update keyboard shortcuts if available
    if (window.keyboardShortcuts) {
      window.keyboardShortcuts.updateCommands();
    }
    
    // Trigger custom event for components to update
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: this.currentLang } 
    }));
  }

  // Translate page
  translatePage() {
    // Finde alle Elemente mit data-i18n Attribut
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (translation) {
        // Prüfe ob es ein Input-Placeholder ist
        if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }

  // Get translation
  t(key, params = {}) {
    const translation = this.translations[this.currentLang]?.[key] || key;
    
    // Replace parameters
    let result = translation;
    Object.keys(params).forEach(param => {
      result = result.replace(`{${param}}`, params[param]);
    });
    
    return result;
  }

  // Add language switcher to UI
  addLanguageSwitcher() {
    // Finde die Topbar
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;

    // Erstelle Language Switcher
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    switcher.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 16px;
      padding: 6px 12px;
      background: var(--bg-secondary);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    switcher.innerHTML = `
      <span style="font-size: 16px;">🌐</span>
      <span id="currentLangLabel" style="font-size: 13px; font-weight: 500;">${this.currentLang.toUpperCase()}</span>
    `;
    
    switcher.addEventListener('click', () => this.showLanguageMenu());
    
    // Füge vor user-info ein
    const userInfo = topbarRight.querySelector('.user-info');
    if (userInfo) {
      topbarRight.insertBefore(switcher, userInfo);
    } else {
      topbarRight.appendChild(switcher);
    }
  }

  // Update language switcher
  updateLanguageSwitcher() {
    const label = document.getElementById('currentLangLabel');
    if (label) {
      label.textContent = this.currentLang.toUpperCase();
    }
  }

  // Show language menu
  showLanguageMenu() {
    // Erstelle Dropdown-Menü
    const menu = document.createElement('div');
    menu.className = 'language-menu';
    menu.style.cssText = `
      position: fixed;
      top: 70px;
      right: 200px;
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      overflow: hidden;
      animation: fadeIn 0.2s;
    `;
    
    const languages = [
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'en', name: 'English', flag: '🇬🇧' }
    ];
    
    menu.innerHTML = languages.map(lang => `
      <div class="language-option" data-lang="${lang.code}" style="
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.1s;
        color: var(--text-main);
        ${this.currentLang === lang.code ? 'background: var(--gxo-orange); color: white;' : ''}
      ">
        <span style="font-size: 20px;">${lang.flag}</span>
        <span style="font-weight: 500;">${lang.name}</span>
        ${this.currentLang === lang.code ? '<span style="margin-left: auto;">✓</span>' : ''}
      </div>
    `).join('');
    
    document.body.appendChild(menu);
    
    // Event listeners
    menu.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('mouseover', function() {
        if (!this.style.background.includes('var(--gxo-orange)')) {
          this.style.background = 'var(--bg-soft)';
        }
      });
      option.addEventListener('mouseout', function() {
        if (!this.style.background.includes('var(--gxo-orange)')) {
          this.style.background = '';
        }
      });
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        this.setLanguage(lang);
        menu.remove();
      });
    });
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !e.target.closest('.language-switcher')) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }
}

// Initialize i18n
const i18n = new I18n();

// Export for global access
window.i18n = i18n;
window.t = (key, params) => i18n.t(key, params);
