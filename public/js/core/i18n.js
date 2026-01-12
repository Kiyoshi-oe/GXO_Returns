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
    
    // Language Switcher wird am Ende der Datei hinzugefügt (nicht hier, um Doppelung zu vermeiden)
    
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
        'dashboard.subtitle': 'Überblick über Lager und Retouren',
        'dashboard.total-locations': 'Gesamt Stellplätze',
        'dashboard.occupied': 'Belegt',
        'dashboard.free': 'Frei',
        'dashboard.utilization': 'Auslastung',
        'dashboard.stats-today': 'Kennzahlen Lager heute',
        'dashboard.movement-journal': 'Bewegungsjournal',
        
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
        'inbound.subtitle': 'Einfache Erfassung neuer Kartons',
        'inbound.carrier': 'Carrier',
        'inbound.tracking': 'Tracking-Nr.',
        'inbound.cartons': 'Kartons',
        'inbound.location': 'Stellplatz',
        'inbound.operator': 'Operator',
        'inbound.advanced': 'Advanced',
        'inbound.single': 'Einzel',
        'inbound.bulk': 'Bulk',
        'inbound.back': 'Zurück',
        'inbound.next': 'Weiter',
        'inbound.save': 'Speichern',
        'inbound.clear': 'Leer',
        'inbound.clear-fields': 'Felder leeren',
        'inbound.save-continue': 'Speichern & Weiter',
        
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
        
        // Additional common texts
        'common.step': 'Schritt',
        'common.of': 'von',
        'common.select': 'Auswählen',
        'common.change': 'Ändern',
        'common.selected': 'Ausgewählt',
        'common.all': 'Alle',
        'common.none': 'Keine',
        'common.total': 'Gesamt',
        'common.from': 'von',
        'common.to': 'bis',
        'common.date': 'Datum',
        'common.time': 'Uhrzeit',
        'common.type': 'Art',
        'common.object': 'Objekt',
        'common.details': 'Details',
        'common.show': 'Anzeigen',
        'common.hide': 'Ausblenden',
        'common.more': 'Mehr',
        'common.less': 'Weniger',
        
        // Inbound specific
        'inbound.step1': 'Schritt 1: Carrier und Modus auswählen',
        'inbound.step1-subtitle': 'Wählen Sie den Versanddienstleister und den Erfassungsmodus',
        'inbound.step2': 'Schritt 2: Basis-Informationen',
        'inbound.step2-subtitle': 'Erfassen Sie die grundlegenden Daten',
        'inbound.step3': 'Schritt 3: Tracking-Nummern',
        'inbound.step3-subtitle': 'Scannen Sie die Nummern vom Label',
        'inbound.step4': 'Schritt 4: Bestätigung',
        'inbound.step4-subtitle': 'Bitte überprüfen Sie die Daten',
        'inbound.select-carrier': 'Carrier auswählen',
        'inbound.selected-carrier': 'Ausgewählter Carrier:',
        'inbound.bulk-title': '⚡ Bulk-Erfassung',
        'inbound.bulk-subtitle': 'Schnelle Erfassung mehrerer Einträge',
        'inbound.fixed-fields': 'Feste Felder (für alle Einträge gleich)',
        'inbound.variable-fields': 'Variable Felder (pro Eintrag unterschiedlich)',
        'inbound.saved-count': 'Gespeicherte Einträge in dieser Session:',
        'inbound.ra-number': 'RA-Nummer',
        'inbound.dn': 'DN (Delivery Note)',
        'inbound.olpn': 'OLPN (Barcode scannen)',
        'inbound.tracking-number': 'Carrier Tracking Number',
        'inbound.cartons': 'Anzahl Kartons',
        'inbound.location': 'Stellplatz',
        'inbound.cw': 'CW (Kalenderwoche)',
        'inbound.date': 'Datum',
        'inbound.back-to-carrier': 'Zurück zur Carrier-Auswahl',
        'inbound.single-mode': 'Einzeln',
        'inbound.bulk-mode': 'Massen',
        'inbound.mask-clear': 'Maske leeren',
        'inbound.save-entry': 'Wareneingang speichern',
        'inbound.bulk-define': 'Massenerfassung - Feste Felder definieren',
        'inbound.bulk-define-subtitle': 'Legen Sie die Felder fest, die für alle Einträge gleich bleiben',
        'inbound.label-examples': 'Label-Beispiel anzeigen',
        'inbound.help': 'Hilfe für Mitarbeiter',
        
        // Dashboard specific
        'dashboard.stats-today-subtitle': 'Aktuelle Werte basierend auf den erfassten Daten',
        'dashboard.occupied-locations': 'belegte Stellplätze',
        'dashboard.of-total': 'von - Stellplätzen gesamt',
        'dashboard.entries': 'Einträge im Lager',
        'dashboard.total-cartons': 'Kartons gesamt',
        'dashboard.open-ras': 'Anzahl offene RA Positionen',
        'dashboard.unclear-ras': 'davon - mit unklarer RA Nummer',
        'dashboard.movement-journal-subtitle': 'Alle Buchungen: Wareneingang, Umlagerung und Archivierung',
        'dashboard.time': 'Uhrzeit',
        'dashboard.type': 'Art',
        'dashboard.object': 'Objekt',
        'dashboard.user': 'Benutzer',
        'dashboard.location': 'Stellplatz',
        'dashboard.actions': 'Aktionen',
        
        // Common phrases
        'common.please-select': 'Bitte wählen',
        'common.please-enter': 'Bitte eingeben',
        'common.required': 'Pflichtfeld',
        'common.optional': 'Optional',
        'common.example': 'z.B.',
        'common.tip': 'Tipp',
        'common.scan': 'Scannen',
        'common.enter': 'Eingeben',
        'common.continue': 'Fortsetzen',
        'common.finish': 'Abschließen',
        'common.confirm': 'Bestätigen',
        'common.cancel': 'Abbrechen',
        'common.yes': 'Ja',
        'common.no': 'Nein',
        'common.ok': 'OK',
        'common.apply': 'Anwenden',
        'common.reset': 'Zurücksetzen',
        'common.clear': 'Leeren',
        'common.filter': 'Filtern',
        'common.sort': 'Sortieren',
        'common.ascending': 'Aufsteigend',
        'common.descending': 'Absteigend',
        'common.search': 'Suchen',
        'common.results': 'Ergebnisse',
        'common.no-results': 'Keine Ergebnisse gefunden',
        'common.loading': 'Lädt...',
        'common.error': 'Fehler',
        'common.success': 'Erfolg',
        'common.warning': 'Warnung',
        'common.info': 'Information',
        'common.question': 'Frage',
        'common.delete-confirm': 'Wirklich löschen?',
        'common.save-success': 'Erfolgreich gespeichert',
        'common.save-error': 'Fehler beim Speichern',
        'common.load-error': 'Fehler beim Laden',
        'common.operation-success': 'Operation erfolgreich',
        'common.operation-failed': 'Operation fehlgeschlagen',
        
        // Navigation sections
        'nav.views': 'Ansichten',
        'nav.administration': 'Administration',
        'nav.tools': 'Tools',
        
        // Status and states
        'status.active': 'Aktiv',
        'status.inactive': 'Inaktiv',
        'status.pending': 'Ausstehend',
        'status.completed': 'Abgeschlossen',
        'status.cancelled': 'Abgebrochen',
        'status.archived': 'Archiviert',
        
        // Form labels
        'form.carrier': 'Carrier',
        'form.tracking': 'Tracking-Nummer',
        'form.olpn': 'OLPN',
        'form.dn': 'DN',
        'form.ra': 'RA-Nummer',
        'form.cartons': 'Kartons',
        'form.location': 'Stellplatz',
        'form.area': 'Bereich',
        'form.country': 'Land',
        'form.date': 'Datum',
        'form.cw': 'CW',
        'form.comment': 'Kommentar',
        'form.customer-id': 'Customer ID',
        'form.customer-name': 'Customer Name',
        'form.asn-ra': 'ASN/RA Nummer',
        
        // Messages
        'msg.duplicate-found': 'Duplikat gefunden',
        'msg.duplicate-warning': 'Ein Eintrag mit ähnlichen Daten existiert bereits',
        'msg.save-anyway': 'Möchten Sie den Eintrag trotzdem speichern?',
        'msg.field-required': 'Dieses Feld ist ein Pflichtfeld',
        'msg.invalid-format': 'Ungültiges Format',
        'msg.invalid-length': 'Ungültige Länge',
        'msg.must-start-with': 'Muss beginnen mit',
        'msg.must-be-digits': 'Muss Zahlen sein',
        'msg.max-value': 'Maximaler Wert',
        'msg.min-value': 'Minimaler Wert',
        
        // Settings specific
        'settings.admin-access': 'Admin-Zugang',
        'settings.admin-pin': 'Bitte geben Sie die Admin-PIN ein',
        'settings.pin': 'PIN',
        'settings.unlock-access': 'Zugang freischalten',
        'settings.carrier-config': 'Carrier Konfiguration',
        'settings.dropdown-options': 'Dropdown Optionen',
        'settings.locations': 'Stellplätze',
        'settings.audit-logs': 'Audit-Logs',
        'settings.backup': 'Backup',
        'settings.user-management': 'Benutzerverwaltung',
        'settings.system-info': 'System Info',
        'settings.windows-user': 'Windows-Benutzer',
        'settings.change-view': 'Ansicht wechseln',
        
        // Inventory specific
        'inventory.locations': 'Stellplätze',
        'inventory.overview': 'Gesamtübersicht',
        'inventory.detailed-overview': 'Detaillierte Übersicht aller Stellplätze und gebuchten Kartons',
        'inventory.clear-all-filters': 'Alle Filter löschen',
        'inventory.refresh': 'Aktualisieren',
        'inventory.area': 'Bereich',
        'inventory.display': 'Anzeige',
        'inventory.search': 'Suche',
        'inventory.entire-warehouse': 'Gesamtes Lager',
        'inventory.only-active': 'Nur aktive Stellplätze',
        'inventory.all-locations': 'Alle Stellplätze',
        'inventory.location-details': 'Stellplatz-Details',
        'inventory.cartons-at-location': 'Kartons auf diesem Stellplatz',
        'inventory.no-cartons': 'Keine Kartons auf diesem Stellplatz',
        'inventory.edit': 'Bearbeiten',
        'inventory.view-details': 'Details anzeigen',
        
        // Modal and common UI
        'modal.information': 'Information',
        'modal.message-here': 'Nachricht hier',
        'modal.ok': 'OK',
        'modal.cancel': 'Abbrechen',
        'modal.close': 'Schließen',
        'modal.label-view': 'Label Vollansicht',
        
        // Filter and search
        'filter.apply': 'Übernehmen',
        'filter.cancel': 'Abbrechen',
        'filter.enter-number': 'Zahl eingeben...',
        'filter.enter-value': 'Wert eingeben...',
        'filter.remove-from': 'Filter aus',
        'filter.remove': 'entfernen',
        
        // Excel filter
        'excel.filter': 'Filter',
        'excel.column': 'Spalte',
        'excel.operator': 'Operator',
        'excel.value': 'Wert',
        'excel.apply': 'Übernehmen',
        'excel.cancel': 'Abbrechen',
        
        // General
        'general.loading': 'Lädt...',
        'general.version': 'Version',
        'general.system': 'System',
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
        'dashboard.subtitle': 'Overview of warehouse and returns',
        'dashboard.total-locations': 'Total Locations',
        'dashboard.occupied': 'Occupied',
        'dashboard.free': 'Free',
        'dashboard.utilization': 'Utilization',
        'dashboard.stats-today': 'Warehouse metrics today',
        'dashboard.movement-journal': 'Movement Journal',
        'dashboard.system-name': 'LVS Returns System',
        'dashboard.not-logged-in': 'Not logged in',
        'dashboard.loading-movements': 'Loading movements...',
        'dashboard.ra-status-overview': 'RA Status Overview',
        'dashboard.quick-access': 'Quick Access',
        'dashboard.quick-access-subtitle': 'The most important areas with one click',
        'dashboard.show-inventory': 'Show Inventory',
        'dashboard.new-pallet': 'Record New Pallet',
        'dashboard.move-pallet': 'Move Pallet',
        'dashboard.check-ra-report': 'Check RA Report',
        'dashboard.returns-by-carrier': 'Returns by Carrier',
        'dashboard.returns-by-carrier-subtitle': 'Distribution as example, data are placeholders',
        'dashboard.last-entries': 'Last Inbound Entries',
        'dashboard.last-entries-subtitle': 'Overview of the most recently recorded goods receipts (Click to Show/Hide)',
        'dashboard.no-entries-loaded': 'No entries loaded yet',
        'dashboard.no-entries-available': 'No entries available yet',
        'dashboard.von': 'From',
        'dashboard.nach': 'To',
        
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
        'inbound.subtitle': 'Simple entry of new cartons',
        'inbound.carrier': 'Carrier',
        'inbound.tracking': 'Tracking No.',
        'inbound.cartons': 'Cartons',
        'inbound.location': 'Location',
        'inbound.operator': 'Operator',
        'inbound.advanced': 'Advanced',
        'inbound.single': 'Single',
        'inbound.bulk': 'Bulk',
        'inbound.back': 'Back',
        'inbound.next': 'Next',
        'inbound.save': 'Save',
        'inbound.clear': 'Clear',
        'inbound.clear-fields': 'Clear Fields',
        'inbound.save-continue': 'Save & Continue',
        
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
        
        // Additional common texts
        'common.step': 'Step',
        'common.of': 'of',
        'common.select': 'Select',
        'common.change': 'Change',
        'common.selected': 'Selected',
        'common.all': 'All',
        'common.none': 'None',
        'common.total': 'Total',
        'common.from': 'from',
        'common.to': 'to',
        'common.date': 'Date',
        'common.time': 'Time',
        'common.type': 'Type',
        'common.object': 'Object',
        'common.details': 'Details',
        'common.show': 'Show',
        'common.hide': 'Hide',
        'common.more': 'More',
        'common.less': 'Less',
        
        // Inbound specific
        'inbound.step1': 'Step 1: Select Carrier and Mode',
        'inbound.step1-subtitle': 'Select the shipping provider and entry mode',
        'inbound.step2': 'Step 2: Basic Information',
        'inbound.step2-subtitle': 'Enter the basic data',
        'inbound.step3': 'Step 3: Tracking Numbers',
        'inbound.step3-subtitle': 'Scan the numbers from the label',
        'inbound.step4': 'Step 4: Confirmation',
        'inbound.step4-subtitle': 'Please review the data',
        'inbound.select-carrier': 'Select Carrier',
        'inbound.selected-carrier': 'Selected Carrier:',
        'inbound.bulk-title': '⚡ Bulk Entry',
        'inbound.bulk-subtitle': 'Quick entry of multiple items',
        'inbound.fixed-fields': 'Fixed Fields (same for all entries)',
        'inbound.variable-fields': 'Variable Fields (different per entry)',
        'inbound.saved-count': 'Saved entries in this session:',
        'inbound.ra-number': 'RA Number',
        'inbound.dn': 'DN (Delivery Note)',
        'inbound.olpn': 'OLPN (Scan barcode)',
        'inbound.tracking-number': 'Carrier Tracking Number',
        'inbound.cartons': 'Number of Cartons',
        'inbound.location': 'Location',
        'inbound.cw': 'CW (Calendar Week)',
        'inbound.date': 'Date',
        'inbound.back-to-carrier': 'Back to Carrier Selection',
        'inbound.single-mode': 'Single',
        'inbound.bulk-mode': 'Bulk',
        'inbound.mask-clear': 'Clear Form',
        'inbound.save-entry': 'Save Inbound',
        'inbound.bulk-define': 'Bulk Entry - Define Fixed Fields',
        'inbound.bulk-define-subtitle': 'Set the fields that remain the same for all entries',
        'inbound.label-examples': 'Show Label Examples',
        'inbound.help': 'Help for Employees',
        
        // Dashboard specific
        'dashboard.stats-today-subtitle': 'Current values based on recorded data',
        'dashboard.occupied-locations': 'occupied locations',
        'dashboard.of-total': 'of - total locations',
        'dashboard.entries': 'entries in warehouse',
        'dashboard.total-cartons': 'total cartons',
        'dashboard.open-ras': 'number of open RA positions',
        'dashboard.unclear-ras': 'of which - with unclear RA number',
        'dashboard.movement-journal-subtitle': 'All bookings: Inbound, Movement and Archiving',
        'dashboard.time': 'Time',
        'dashboard.type': 'Type',
        'dashboard.object': 'Object',
        'dashboard.user': 'User',
        'dashboard.location': 'Location',
        'dashboard.actions': 'Actions',
        
        // Common phrases
        'common.please-select': 'Please select',
        'common.please-enter': 'Please enter',
        'common.required': 'Required',
        'common.optional': 'Optional',
        'common.example': 'e.g.',
        'common.tip': 'Tip',
        'common.scan': 'Scan',
        'common.enter': 'Enter',
        'common.continue': 'Continue',
        'common.finish': 'Finish',
        'common.confirm': 'Confirm',
        'common.cancel': 'Cancel',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.ok': 'OK',
        'common.apply': 'Apply',
        'common.reset': 'Reset',
        'common.clear': 'Clear',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.ascending': 'Ascending',
        'common.descending': 'Descending',
        'common.search': 'Search',
        'common.results': 'Results',
        'common.no-results': 'No results found',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.warning': 'Warning',
        'common.info': 'Information',
        'common.question': 'Question',
        'common.delete-confirm': 'Really delete?',
        'common.save-success': 'Successfully saved',
        'common.save-error': 'Error saving',
        'common.load-error': 'Error loading',
        'common.operation-success': 'Operation successful',
        'common.operation-failed': 'Operation failed',
        
        // Navigation sections
        'nav.views': 'Views',
        'nav.administration': 'Administration',
        'nav.tools': 'Tools',
        
        // Status and states
        'status.active': 'Active',
        'status.inactive': 'Inactive',
        'status.pending': 'Pending',
        'status.completed': 'Completed',
        'status.cancelled': 'Cancelled',
        'status.archived': 'Archived',
        
        // Form labels
        'form.carrier': 'Carrier',
        'form.tracking': 'Tracking Number',
        'form.olpn': 'OLPN',
        'form.dn': 'DN',
        'form.ra': 'RA Number',
        'form.cartons': 'Cartons',
        'form.location': 'Location',
        'form.area': 'Area',
        'form.country': 'Country',
        'form.date': 'Date',
        'form.cw': 'CW',
        'form.comment': 'Comment',
        'form.customer-id': 'Customer ID',
        'form.customer-name': 'Customer Name',
        'form.asn-ra': 'ASN/RA Number',
        
        // Messages
        'msg.duplicate-found': 'Duplicate found',
        'msg.duplicate-warning': 'An entry with similar data already exists',
        'msg.save-anyway': 'Do you want to save the entry anyway?',
        'msg.field-required': 'This field is required',
        'msg.invalid-format': 'Invalid format',
        'msg.invalid-length': 'Invalid length',
        'msg.must-start-with': 'Must start with',
        'msg.must-be-digits': 'Must be digits',
        'msg.max-value': 'Maximum value',
        'msg.min-value': 'Minimum value',
        
        // Settings specific
        'settings.admin-access': 'Admin Access',
        'settings.admin-pin': 'Please enter the admin PIN',
        'settings.pin': 'PIN',
        'settings.unlock-access': 'Unlock Access',
        'settings.carrier-config': 'Carrier Configuration',
        'settings.dropdown-options': 'Dropdown Options',
        'settings.locations': 'Locations',
        'settings.audit-logs': 'Audit Logs',
        'settings.backup': 'Backup',
        'settings.user-management': 'User Management',
        'settings.system-info': 'System Info',
        'settings.windows-user': 'Windows User',
        'settings.change-view': 'Change View',
        
        // Inventory specific
        'inventory.locations': 'Locations',
        'inventory.overview': 'Overview',
        'inventory.detailed-overview': 'Detailed overview of all locations and booked cartons',
        'inventory.clear-all-filters': 'Clear All Filters',
        'inventory.refresh': 'Refresh',
        'inventory.area': 'Area',
        'inventory.display': 'Display',
        'inventory.search': 'Search',
        'inventory.entire-warehouse': 'Entire Warehouse',
        'inventory.only-active': 'Only active locations',
        'inventory.all-locations': 'All locations',
        'inventory.location-details': 'Location Details',
        'inventory.cartons-at-location': 'Cartons at this location',
        'inventory.no-cartons': 'No cartons at this location',
        'inventory.edit': 'Edit',
        'inventory.view-details': 'View Details',
        
        // Modal and common UI
        'modal.information': 'Information',
        'modal.message-here': 'Message here',
        'modal.ok': 'OK',
        'modal.cancel': 'Cancel',
        'modal.close': 'Close',
        'modal.label-view': 'Label Full View',
        
        // Filter and search
        'filter.apply': 'Apply',
        'filter.cancel': 'Cancel',
        'filter.enter-number': 'Enter number...',
        'filter.enter-value': 'Enter value...',
        'filter.remove-from': 'Remove filter from',
        'filter.remove': 'remove',
        
        // Excel filter
        'excel.filter': 'Filter',
        'excel.column': 'Column',
        'excel.operator': 'Operator',
        'excel.value': 'Value',
        'excel.apply': 'Apply',
        'excel.cancel': 'Cancel',
        
        // General
        'general.loading': 'Loading...',
        'general.version': 'Version',
        'general.system': 'System',
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
    
    // Translate page SOFORT (kein Warten, kein setTimeout)
    this.translatePage();
    
    // Update language switcher
    this.updateLanguageSwitcher();
    
    // Update dynamic components
    this.updateDynamicComponents();
    
    console.log(`✅ Sprache auf ${lang.toUpperCase()} geändert - Übersetzung sofort angewendet`);
  }
  
  // Setze alle Texte zurück auf Deutsch
  resetToGerman() {
    console.log('🔄 Setze alle Texte zurück auf Deutsch...');
    
    // 1. Übersetze alle Elemente mit data-i18n zurück auf Deutsch
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const germanText = this.translations.de[key] || key;
      
      if (germanText && germanText !== key) {
        if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
          element.placeholder = germanText;
        } else {
          element.textContent = germanText;
        }
      }
    });
    
    // 2. Erstelle Reverse-Map: Englisch -> Deutsch
    const reverseMap = {};
    
    // Durchlaufe alle deutschen Übersetzungen und erstelle Reverse-Map
    Object.keys(this.translations.de).forEach(key => {
      const germanText = this.translations.de[key];
      const englishText = this.translations.en[key];
      
      if (germanText && englishText && germanText !== englishText) {
        reverseMap[englishText] = germanText;
      }
    });
    
    // 3. Übersetze alle Texte zurück (auch ohne data-i18n)
    const allTextElements = 'span:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), div:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), button:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), a:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), label:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), h1:not([data-dynamic]):not([id*="dynamic"]), h2:not([data-dynamic]):not([id*="dynamic"]), h3:not([data-dynamic]):not([id*="dynamic"]), h4:not([data-dynamic]):not([id*="dynamic"]), h5:not([data-dynamic]):not([id*="dynamic"]), h6:not([data-dynamic]):not([id*="dynamic"]), p:not([data-dynamic]):not([id*="dynamic"]), .card-title:not([data-dynamic]):not([id*="dynamic"]), .card-subtitle:not([data-dynamic]):not([id*="dynamic"]), .kpi-label:not([data-dynamic]):not([id*="dynamic"])';
    
    document.querySelectorAll(allTextElements).forEach(el => {
      // Überspringe bereits übersetzte Elemente mit data-i18n
      if (el.hasAttribute('data-i18n')) return;
      
      // Überspringe Code/Technische Inhalte
      if (el.classList.contains('code') || el.tagName === 'CODE' || el.tagName === 'PRE') return;
      
      // Überspringe Input-Felder
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      
      // Überspringe Tabellen-Inhalte (nur Header übersetzen)
      if (el.closest('tbody')) return;
      
      const currentText = el.textContent.trim();
      
      // Prüfe ob der Text eine englische Übersetzung ist
      if (reverseMap[currentText]) {
        el.textContent = reverseMap[currentText];
      }
    });
    
    // 4. Übersetze Navigation zurück
    document.querySelectorAll('.nav-item:not([data-dynamic])').forEach(navItem => {
      const text = navItem.textContent.trim();
      if (reverseMap[text]) {
        if (navItem.childNodes.length === 1 && navItem.childNodes[0].nodeType === 3) {
          navItem.textContent = reverseMap[text];
        } else {
          Array.from(navItem.childNodes).forEach(node => {
            if (node.nodeType === 3 && node.textContent.trim() === text) {
              node.textContent = reverseMap[text];
            }
          });
        }
      }
    });
    
    // 5. Übersetze Topbar zurück
    const topbarTitle = document.getElementById('topbarTitle');
    const topbarSubtitle = document.getElementById('topbarSubtitle');
    
    if (topbarTitle) {
      const titleText = topbarTitle.textContent.trim();
      if (reverseMap[titleText]) {
        topbarTitle.textContent = reverseMap[titleText];
      }
    }
    
    if (topbarSubtitle) {
      const subtitleText = topbarSubtitle.textContent.trim();
      if (reverseMap[subtitleText]) {
        topbarSubtitle.textContent = reverseMap[subtitleText];
      }
    }
    
    // 6. Übersetze Platzhalter zurück
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && reverseMap[placeholder]) {
        input.setAttribute('placeholder', reverseMap[placeholder]);
      }
    });
    
    console.log('✅ Alle Texte auf Deutsch zurückgesetzt');
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
    console.log(`🔄 Übersetze Seite (Sprache: ${this.currentLang})...`);
    
    // Wenn DE, setze alle Texte zurück auf Deutsch
    if (this.currentLang === 'de') {
      this.resetToGerman();
      return;
    }
    
    // 1. Finde alle Elemente mit data-i18n Attribut
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`📋 Gefunden: ${elements.length} Elemente mit data-i18n`);
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (translation && translation !== key) {
        // Prüfe ob es ein Input-Placeholder ist
        if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
    
    // 2. Übersetze häufig verwendete Texte automatisch (auch ohne data-i18n)
    this.translateCommonTexts();
    
    // 3. Übersetze Navigation
    this.translateNavigation();
    
    // 4. Übersetze Buttons und Labels
    this.translateButtonsAndLabels();
    
    // 5. Übersetze Topbar
    this.translateTopbar();
    
    // 6. Übersetze Tabellen-Header
    this.translateTableHeaders();
    
    // 7. Übersetze Platzhalter
    this.translatePlaceholders();
    
    console.log('✅ Übersetzung abgeschlossen');
  }
  
  // Übersetze Tabellen-Header
  translateTableHeaders() {
    // Übersetze nur wenn Sprache nicht DE ist
    if (this.currentLang === 'de') {
      return;
    }
    
    const headerTranslations = {
      'Uhrzeit': this.t('dashboard.time'),
      'Art': this.t('dashboard.type'),
      'Objekt': this.t('dashboard.object'),
      'Benutzer': this.t('dashboard.user'),
      'Stellplatz': this.t('dashboard.location'),
      'Aktionen': this.t('dashboard.actions'),
      'ID': 'ID',
      'CW': this.t('form.cw'),
      'Datum': this.t('form.date'),
      'Carrier': this.t('inbound.carrier'),
      'Area': this.t('inventory.area'),
      'Stage': 'Stage',
      'Planned': 'Planned',
      'Actual': 'Actual',
      'OLPN': this.t('form.olpn'),
      'CTN': 'CTN',
      'MH Status': 'MH Status',
    };
    
    // Nur statische Header in thead übersetzen, nicht dynamisch generierte
    document.querySelectorAll('thead th[data-i18n], thead td[data-i18n]').forEach(header => {
      const key = header.getAttribute('data-i18n');
      if (key) {
        const translation = this.t(key);
        if (translation && translation !== key) {
          header.textContent = translation;
        }
      }
    });
    
    // Zusätzlich: Übersetze statische Header ohne data-i18n (nur in thead, nicht in tbody)
    document.querySelectorAll('thead th:not([data-dynamic]):not([id*="dynamic"]), thead td:not([data-dynamic]):not([id*="dynamic"])').forEach(header => {
      if (header.hasAttribute('data-i18n')) return;
      
      const text = header.textContent.trim();
      if (headerTranslations[text] && headerTranslations[text] !== text) {
        // Nur wenn es ein einfacher Text-Node ist
        if (header.childNodes.length === 1 && header.childNodes[0].nodeType === 3) {
          header.textContent = headerTranslations[text];
        }
      }
    });
  }
  
  // Übersetze Platzhalter
  translatePlaceholders() {
    // Übersetze nur wenn Sprache nicht DE ist
    if (this.currentLang === 'de') {
      return;
    }
    
    const placeholderTranslations = {
      'Stellplatz suchen...': this.currentLang === 'en' ? 'Search location...' : 'Stellplatz suchen...',
      'z.B. CW 47': this.currentLang === 'en' ? 'e.g. CW 47' : 'z.B. CW 47',
      'OLPN scannen...': this.currentLang === 'en' ? 'Scan OLPN...' : 'OLPN scannen...',
      'Tracking-Nummer eingeben...': this.currentLang === 'en' ? 'Enter tracking number...' : 'Tracking-Nummer eingeben...',
      'DN eingeben...': this.currentLang === 'en' ? 'Enter DN...' : 'DN eingeben...',
      'RA-Nummer eingeben (optional)': this.currentLang === 'en' ? 'Enter RA number (optional)' : 'RA-Nummer eingeben (optional)',
      'Bitte Carrier auswählen': this.currentLang === 'en' ? 'Please select carrier' : 'Bitte Carrier auswählen',
      'Suchen...': this.t('search.placeholder'),
      'Bitte wählen': this.t('common.please-select'),
      'Bitte eingeben': this.t('common.please-enter'),
    };
    
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
      if (input.hasAttribute('data-i18n')) return;
      
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && placeholderTranslations[placeholder] && placeholderTranslations[placeholder] !== placeholder) {
        input.setAttribute('placeholder', placeholderTranslations[placeholder]);
      }
    });
  }
  
  // Übersetze häufig verwendete Texte
  translateCommonTexts() {
    // Übersetze nur wenn Sprache nicht DE ist
    if (this.currentLang === 'de') {
      return;
    }
    
    // Umfassende Übersetzungsmap für alle deutschen Texte
    const textMap = {
      // Navigation
      'Dashboard': this.t('dashboard.title'),
      'Wareneingang': this.t('inbound.title'),
      'Lagerbestand': this.t('inventory.title'),
      'Umlagerung': this.t('movement.title'),
      'Archiv': this.t('archive.title'),
      'Globale Suche': this.t('nav.search'),
      'Lager-Visualisierung': this.t('nav.warehouse-map'),
      'Barcode Generator': this.t('nav.barcode'),
      'RA Import': this.t('nav.ra-import'),
      'Performance': this.t('performance.title'),
      'Einstellungen': this.t('settings.title'),
      'Datenverwaltung': this.t('nav.data-management'),
      'Ansichten': this.t('nav.views'),
      'Administration': this.t('nav.administration'),
      'Tools': this.t('nav.tools'),
      
      // Common buttons and actions
      'Speichern': this.t('common.save'),
      'Abbrechen': this.t('common.cancel'),
      'Löschen': this.t('common.delete'),
      'Bearbeiten': this.t('common.edit'),
      'Hinzufügen': this.t('common.add'),
      'Suchen': this.t('common.search'),
      'Aktualisieren': this.t('common.refresh'),
      'Schließen': this.t('common.close'),
      'Exportieren': this.t('common.export'),
      'Importieren': this.t('common.import'),
      'Weiter': this.t('inbound.next'),
      'Zurück': this.t('inbound.back'),
      'Leer': this.t('inbound.clear'),
      'Felder leeren': this.t('inbound.clear-fields'),
      'Speichern & Weiter': this.t('inbound.save-continue'),
      'Maske leeren': this.currentLang === 'en' ? 'Clear Form' : 'Maske leeren',
      'Wareneingang speichern': this.currentLang === 'en' ? 'Save Inbound' : 'Wareneingang speichern',
      
      // Dashboard
      'LVS Returns System': this.t('dashboard.system-name'),
      'Nicht angemeldet': this.t('dashboard.not-logged-in'),
      'Kennzahlen Lager heute': this.t('dashboard.stats-today'),
      'Aktuelle Werte basierend auf den erfassten Daten': this.t('dashboard.stats-today-subtitle'),
      'belegte Stellplätze': this.t('dashboard.occupied-locations'),
      'von - Stellplätzen gesamt': this.t('dashboard.of-total'),
      'Einträge im Lager': this.t('dashboard.entries'),
      'Kartons gesamt': this.t('dashboard.total-cartons'),
      'Anzahl offene RA Positionen': this.t('dashboard.open-ras'),
      'davon - mit unklarer RA Nummer': this.t('dashboard.unclear-ras'),
      'Bewegungsjournal': this.t('dashboard.movement-journal'),
      'Alle Buchungen: Wareneingang, Umlagerung und Archivierung': this.t('dashboard.movement-journal-subtitle'),
      '🔄 Lade Bewegungen...': this.t('dashboard.loading-movements'),
      'Lade Bewegungen...': this.t('dashboard.loading-movements'),
      'RA Status Übersicht': this.t('dashboard.ra-status-overview'),
      'Schnell Einstieg': this.t('dashboard.quick-access'),
      'Die wichtigsten Bereiche mit einem Klick': this.t('dashboard.quick-access-subtitle'),
      'Lagerbestand anzeigen': this.t('dashboard.show-inventory'),
      'Neue Palette erfassen': this.t('dashboard.new-pallet'),
      'Palette umsetzen': this.t('dashboard.move-pallet'),
      'RA Report prüfen': this.t('dashboard.check-ra-report'),
      'Retouren nach Frachtführer': this.t('dashboard.returns-by-carrier'),
      'Verteilung als Beispiel, Daten sind Platzhalter': this.t('dashboard.returns-by-carrier-subtitle'),
      'Lager Kennzahlen': this.currentLang === 'en' ? 'Warehouse Key Figures' : 'Lager Kennzahlen',
      '📋 Letzte Einträge Wareneingang': this.t('dashboard.last-entries'),
      'Letzte Einträge Wareneingang': this.t('dashboard.last-entries'),
      'Übersicht der zuletzt erfassten Wareneingänge (Klicken zum Ein-/Ausblenden)': this.t('dashboard.last-entries-subtitle'),
      'Noch keine Einträge geladen': this.t('dashboard.no-entries-loaded'),
      'Noch keine Einträge vorhanden': this.t('dashboard.no-entries-available'),
      'Uhrzeit': this.t('dashboard.time'),
      'Art': this.t('dashboard.type'),
      'Objekt': this.t('dashboard.object'),
      'Benutzer': this.t('dashboard.user'),
      'Stellplatz': this.t('dashboard.location'),
      'Aktionen': this.t('dashboard.actions'),
      'Von': this.t('dashboard.von'),
      'Nach': this.t('dashboard.nach'),
      
      // Inbound
      'Schritt 1: Carrier und Modus auswählen': this.t('inbound.step1'),
      'Wählen Sie den Versanddienstleister und den Erfassungsmodus': this.t('inbound.step1-subtitle'),
      'Schritt 2: Basis-Informationen': this.t('inbound.step2'),
      'Erfassen Sie die grundlegenden Daten': this.t('inbound.step2-subtitle'),
      'Schritt 3: Tracking-Nummern': this.t('inbound.step3'),
      'Scannen Sie die Nummern vom Label': this.t('inbound.step3-subtitle'),
      'Schritt 4: Bestätigung': this.t('inbound.step4'),
      'Bitte überprüfen Sie die Daten': this.t('inbound.step4-subtitle'),
      'Carrier auswählen': this.t('inbound.select-carrier'),
      'Ausgewählter Carrier:': this.t('inbound.selected-carrier'),
      '⚡ Bulk-Erfassung': this.t('inbound.bulk-title'),
      'Schnelle Erfassung mehrerer Einträge': this.t('inbound.bulk-subtitle'),
      'Feste Felder (für alle Einträge gleich)': this.t('inbound.fixed-fields'),
      'Variable Felder (pro Eintrag unterschiedlich)': this.t('inbound.variable-fields'),
      'Gespeicherte Einträge in dieser Session:': this.t('inbound.saved-count'),
      'RA-Nummer': this.t('inbound.ra-number'),
      'DN (Delivery Note)': this.t('inbound.dn'),
      'OLPN (Barcode scannen)': this.t('inbound.olpn'),
      'Carrier Tracking Number': this.t('inbound.tracking-number'),
      'Anzahl Kartons': this.t('inbound.cartons'),
      'CW (Kalenderwoche)': this.t('inbound.cw'),
      'Datum': this.t('inbound.date'),
      'Zurück zur Carrier-Auswahl': this.t('inbound.back-to-carrier'),
      'Einzeln': this.t('inbound.single-mode'),
      'Massen': this.t('inbound.bulk-mode'),
      'Massenerfassung - Feste Felder definieren': this.t('inbound.bulk-define'),
      'Legen Sie die Felder fest, die für alle Einträge gleich bleiben': this.t('inbound.bulk-define-subtitle'),
      'Label-Beispiel anzeigen': this.t('inbound.label-examples'),
      'Hilfe für Mitarbeiter': this.t('inbound.help'),
      'Erfassen Sie alle relevanten Daten für die Sendung': this.currentLang === 'en' ? 'Enter all relevant data for the shipment' : 'Erfassen Sie alle relevanten Daten für die Sendung',
      
      // Common phrases
      'Schritt': this.t('common.step'),
      'von': this.t('common.of'),
      'Auswählen': this.t('common.select'),
      'Ändern': this.t('common.change'),
      'Ausgewählt': this.t('common.selected'),
      'Alle': this.t('common.all'),
      'Keine': this.t('common.none'),
      'Gesamt': this.t('common.total'),
      'bis': this.t('common.to'),
      'Details': this.t('common.details'),
      'Anzeigen': this.t('common.show'),
      'Ausblenden': this.t('common.hide'),
      'Mehr': this.t('common.more'),
      'Weniger': this.t('common.less'),
      'Pflichtfeld': this.t('common.required'),
      'Optional': this.t('common.optional'),
      'z.B.': this.t('common.example'),
      'Tipp': this.t('common.tip'),
      'Scannen': this.t('common.scan'),
      'Eingeben': this.t('common.enter'),
      'Fortsetzen': this.t('common.continue'),
      'Abschließen': this.t('common.finish'),
      'Bestätigen': this.t('common.confirm'),
      'Ja': this.t('common.yes'),
      'Nein': this.t('common.no'),
      'OK': this.t('common.ok'),
      'Anwenden': this.t('common.apply'),
      'Zurücksetzen': this.t('common.reset'),
      'Leeren': this.t('common.clear'),
      'Filtern': this.t('common.filter'),
      'Sortieren': this.t('common.sort'),
      'Aufsteigend': this.t('common.ascending'),
      'Absteigend': this.t('common.descending'),
      'Ergebnisse': this.t('common.results'),
      'Keine Ergebnisse gefunden': this.t('common.no-results'),
      'Lädt...': this.t('common.loading'),
      'Fehler': this.t('common.error'),
      'Erfolg': this.t('common.success'),
      'Warnung': this.t('common.warning'),
      'Information': this.t('common.info'),
      'Frage': this.t('common.question'),
      'Wirklich löschen?': this.t('common.delete-confirm'),
      'Erfolgreich gespeichert': this.t('common.save-success'),
      'Fehler beim Speichern': this.t('common.save-error'),
      'Fehler beim Laden': this.t('common.load-error'),
      'Operation erfolgreich': this.t('common.operation-success'),
      'Operation fehlgeschlagen': this.t('common.operation-failed'),
      
      // Settings
      '🔒 Admin-Zugang': this.t('settings.admin-access'),
      'Admin-Zugang': this.t('settings.admin-access'),
      'Bitte geben Sie die Admin-PIN ein': this.t('settings.admin-pin'),
      'PIN': this.t('settings.pin'),
      'Zugang freischalten': this.t('settings.unlock-access'),
      '🚚 Carrier Konfiguration': this.t('settings.carrier-config'),
      'Carrier Konfiguration': this.t('settings.carrier-config'),
      '📋 Dropdown Optionen': this.t('settings.dropdown-options'),
      'Dropdown Optionen': this.t('settings.dropdown-options'),
      '📍 Stellplätze': this.t('settings.locations'),
      'Stellplätze': this.t('settings.locations'),
      '📋 Audit-Logs': this.t('settings.audit-logs'),
      'Audit-Logs': this.t('settings.audit-logs'),
      '💾 Backup': this.t('settings.backup'),
      'Backup': this.t('settings.backup'),
      '👥 Benutzerverwaltung': this.t('settings.user-management'),
      'Benutzerverwaltung': this.t('settings.user-management'),
      '⚙️ System Info': this.t('settings.system-info'),
      'System Info': this.t('settings.system-info'),
      'Windows-Benutzer': this.t('settings.windows-user'),
      'Ansicht wechseln': this.t('settings.change-view'),
      
      // Inventory
      '📦 Stellplätze': this.t('inventory.locations'),
      'Stellplätze': this.t('inventory.locations'),
      '📋 Gesamtübersicht': this.t('inventory.overview'),
      'Gesamtübersicht': this.t('inventory.overview'),
      '🏭 Lagerbestand': this.t('inventory.title'),
      'Detaillierte Übersicht aller Stellplätze und gebuchten Kartons': this.t('inventory.detailed-overview'),
      '🗑️ Alle Filter löschen': this.t('inventory.clear-all-filters'),
      'Alle Filter löschen': this.t('inventory.clear-all-filters'),
      '🔄 Aktualisieren': this.t('inventory.refresh'),
      'Aktualisieren': this.t('inventory.refresh'),
      'Bereich': this.t('inventory.area'),
      'Anzeige': this.t('inventory.display'),
      'Suche': this.t('inventory.search'),
      'Gesamtes Lager': this.t('inventory.entire-warehouse'),
      'Nur aktive Stellplätze': this.t('inventory.only-active'),
      'Alle Stellplätze': this.t('inventory.all-locations'),
      'Details anzeigen': this.t('inventory.view-details'),
      
      // Modal
      'Information': this.t('modal.information'),
      'Nachricht hier': this.t('modal.message-here'),
      'Label Vollansicht': this.t('modal.label-view'),
      
      // Filter
      'Übernehmen': this.t('filter.apply'),
      'Zahl eingeben...': this.t('filter.enter-number'),
      'Wert eingeben...': this.t('filter.enter-value'),
      'Filter aus': this.t('filter.remove-from'),
      'entfernen': this.t('filter.remove'),
    };
    
    // Übersetze Text-Inhalte - ALLE statischen Texte (auch ohne data-i18n)
    // 1. Zuerst Elemente mit data-i18n
    const selectors = 'span[data-i18n], div[data-i18n], button[data-i18n], a[data-i18n], label[data-i18n], h1[data-i18n], h2[data-i18n], h3[data-i18n], h4[data-i18n], h5[data-i18n], h6[data-i18n], p[data-i18n], .card-title[data-i18n], .card-subtitle[data-i18n]';
    
    document.querySelectorAll(selectors).forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (translation && translation !== key) {
        el.textContent = translation;
      }
    });
    
    // 2. Übersetze alle statischen Texte (auch ohne data-i18n) - aber vorsichtig
    const allTextElements = 'span:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), div:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), button:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), a:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), label:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), h1:not([data-dynamic]):not([id*="dynamic"]), h2:not([data-dynamic]):not([id*="dynamic"]), h3:not([data-dynamic]):not([id*="dynamic"]), h4:not([data-dynamic]):not([id*="dynamic"]), h5:not([data-dynamic]):not([id*="dynamic"]), h6:not([data-dynamic]):not([id*="dynamic"]), p:not([data-dynamic]):not([id*="dynamic"]), .card-title:not([data-dynamic]):not([id*="dynamic"]), .card-subtitle:not([data-dynamic]):not([id*="dynamic"]), .kpi-label:not([data-dynamic]):not([id*="dynamic"])';
    
    document.querySelectorAll(allTextElements).forEach(el => {
      // Überspringe bereits übersetzte Elemente
      if (el.hasAttribute('data-i18n')) return;
      
      // Überspringe Code/Technische Inhalte
      if (el.classList.contains('code') || el.tagName === 'CODE' || el.tagName === 'PRE') return;
      
      // Überspringe Input-Felder
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      
      // Überspringe Tabellen-Inhalte (nur Header übersetzen)
      if (el.closest('tbody')) return;
      
      const originalText = el.textContent.trim();
      
      // Exakte Übereinstimmung
      if (textMap[originalText] && textMap[originalText] !== originalText) {
        // Nur wenn es ein einfacher Text-Node ist
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
          el.textContent = textMap[originalText];
        } else {
          // Versuche Text-Node zu finden und zu ersetzen
          Array.from(el.childNodes).forEach(node => {
            if (node.nodeType === 3) {
              const nodeText = node.textContent.trim();
              if (nodeText === originalText || textMap[nodeText]) {
                node.textContent = textMap[nodeText] || textMap[originalText];
              }
            }
          });
        }
      }
    });
    
    // 3. Übersetze Navigation-Items
    document.querySelectorAll('.nav-item:not([data-dynamic])').forEach(navItem => {
      const text = navItem.textContent.trim();
      if (textMap[text] && textMap[text] !== text) {
        // Nur wenn es ein einfacher Text-Node ist
        if (navItem.childNodes.length === 1 && navItem.childNodes[0].nodeType === 3) {
          navItem.textContent = textMap[text];
        } else {
          // Versuche nur den Text-Node zu ersetzen, nicht Icons/HTML
          Array.from(navItem.childNodes).forEach(node => {
            if (node.nodeType === 3 && node.textContent.trim() === text) {
              node.textContent = textMap[text];
            }
          });
        }
      }
    });
    
    // 4. Übersetze auch Platzhalter in Input-Feldern
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && textMap[placeholder] && textMap[placeholder] !== placeholder) {
        input.setAttribute('placeholder', textMap[placeholder]);
      }
    });
  }
  
  // Übersetze Navigation
  translateNavigation() {
    // Übersetze nur wenn Sprache nicht DE ist
    if (this.currentLang === 'de') {
      return;
    }
    
    const navItems = document.querySelectorAll('.nav-item span, .nav-item');
    navItems.forEach(item => {
      const text = item.textContent.trim();
      const translations = {
        'Dashboard': this.t('nav.dashboard'),
        'Wareneingang': this.t('nav.inbound'),
        'Lagerbestand': this.t('nav.inventory'),
        'Umlagerung': this.t('nav.movement'),
        'Archiv': this.t('nav.archive'),
        'Globale Suche': this.t('nav.search'),
        'Lager-Visualisierung': this.t('nav.warehouse-map'),
        'Barcode Generator': this.t('nav.barcode'),
        'RA Import': this.t('nav.ra-import'),
        'Performance': this.t('nav.performance'),
        'Einstellungen': this.t('nav.settings'),
        'Datenverwaltung': this.t('nav.data-management'),
      };
      
      if (translations[text] && translations[text] !== text) {
        // Finde den Text-Node und ersetze ihn
        Array.from(item.childNodes).forEach(node => {
          if (node.nodeType === 3 && node.textContent.trim() === text) {
            node.textContent = translations[text];
          }
        });
      }
    });
  }
  
  // Übersetze Buttons und Labels
  translateButtonsAndLabels() {
    // Übersetze nur wenn Sprache nicht DE ist
    if (this.currentLang === 'de') {
      return;
    }
    
    // Nur Buttons mit data-i18n oder spezifischen Klassen übersetzen
    const buttonSelectors = 'button[data-i18n], .btn[data-i18n], [role="button"][data-i18n]';
    document.querySelectorAll(buttonSelectors).forEach(btn => {
      const key = btn.getAttribute('data-i18n');
      if (key) {
        const translation = this.t(key);
        if (translation && translation !== key) {
          // Nur Text-Content ersetzen, nicht Icons
          const textNodes = Array.from(btn.childNodes).filter(n => n.nodeType === 3);
          textNodes.forEach(node => {
            const trimmed = node.textContent.trim();
            if (trimmed) {
              node.textContent = translation;
            }
          });
        }
      }
    });
    
    // Umfassende Button-Übersetzungen (nur für statische Buttons ohne data-i18n)
    const buttonTranslations = {
      'Speichern': this.t('common.save'),
      'Abbrechen': this.t('common.cancel'),
      'Löschen': this.t('common.delete'),
      'Bearbeiten': this.t('common.edit'),
      'Hinzufügen': this.t('common.add'),
      'Suchen': this.t('common.search'),
      'Aktualisieren': this.t('common.refresh'),
      'Schließen': this.t('common.close'),
      'Exportieren': this.t('common.export'),
      'Importieren': this.t('common.import'),
      'Weiter': this.t('inbound.next'),
      'Zurück': this.t('inbound.back'),
      'Zurück zur Carrier-Auswahl': this.t('inbound.back-to-carrier'),
      'Leer': this.t('inbound.clear'),
      'Felder leeren': this.t('inbound.clear-fields'),
      'Speichern & Weiter': this.t('inbound.save-continue'),
      '✓ Speichern': this.currentLang === 'en' ? '✓ Save' : '✓ Speichern',
      '← Zurück': this.currentLang === 'en' ? '← Back' : '← Zurück',
      'Weiter →': this.currentLang === 'en' ? 'Next →' : 'Weiter →',
      'Maske leeren': this.currentLang === 'en' ? 'Clear Form' : 'Maske leeren',
      'Wareneingang speichern': this.currentLang === 'en' ? 'Save Inbound' : 'Wareneingang speichern',
      'Ändern': this.t('common.change'),
      'Bestätigen': this.t('common.confirm'),
      'Anwenden': this.t('common.apply'),
      'Zurücksetzen': this.t('common.reset'),
      'OK': this.t('common.ok'),
      'Ja': this.t('common.yes'),
      'Nein': this.t('common.no'),
    };
    
    // Buttons ohne data-i18n (nur statische Buttons, keine dynamisch generierten)
    document.querySelectorAll('button:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"]), .btn:not([data-dynamic]):not([id*="dynamic"]):not([id*="generated"])').forEach(btn => {
      if (btn.hasAttribute('data-i18n')) return;
      
      // Überspringe dynamisch generierte Buttons
      if (btn.id && (btn.id.includes('dynamic') || btn.id.includes('generated') || btn.id.includes('entry-'))) return;
      
      const text = btn.textContent.trim();
      
      // Nur exakte Übereinstimmungen übersetzen
      if (buttonTranslations[text] && buttonTranslations[text] !== text) {
        // Nur wenn es ein einfacher Text-Node ist (keine Icons/HTML)
        const textNodes = Array.from(btn.childNodes).filter(n => n.nodeType === 3);
        if (textNodes.length === 1 && btn.childNodes.length === 1) {
          btn.textContent = buttonTranslations[text];
        } else if (textNodes.length > 0) {
          // Nur den ersten Text-Node ersetzen
          textNodes[0].textContent = buttonTranslations[text];
        }
      }
    });
    
    // Labels und Form-Labels
    const labelTranslations = {
      'Stellplatz': this.t('inventory.location-code'),
      'Carrier': this.t('inbound.carrier'),
      'Tracking': this.t('inbound.tracking'),
      'Tracking-Nummer': this.t('form.tracking'),
      'Kartons': this.t('inbound.cartons'),
      'Datum': this.t('form.date'),
      'CW': this.t('form.cw'),
      'Area': this.t('inventory.area'),
      'Status': this.t('inventory.status'),
      'RA-Nummer': this.t('inbound.ra-number'),
      'DN': this.t('form.dn'),
      'OLPN': this.t('form.olpn'),
      'Customer ID': this.t('form.customer-id'),
      'Customer Name': this.t('form.customer-name'),
      'ASN/RA Nummer': this.t('form.asn-ra'),
      'Kommentar': this.t('form.comment'),
      'Land': this.t('form.country'),
      'Bereich': this.t('inventory.area'),
      'Pflichtfeld': this.t('common.required'),
      'Optional': this.t('common.optional'),
    };
    
    document.querySelectorAll('label, .form-label, .label').forEach(label => {
      if (label.hasAttribute('data-i18n')) return;
      
      const text = label.textContent.trim();
      
      // Exakte Übereinstimmung
      if (labelTranslations[text] && labelTranslations[text] !== text) {
        label.textContent = label.textContent.replace(text, labelTranslations[text]);
      }
      
      // Teilstring-Ersetzung
      Object.keys(labelTranslations).forEach(original => {
        if (text.includes(original) && labelTranslations[original] !== original) {
          const newText = label.textContent.replace(original, labelTranslations[original]);
          if (newText !== label.textContent) {
            label.textContent = newText;
          }
        }
      });
    });
    
    // Card Titles und Subtitles
    document.querySelectorAll('.card-title, .card-subtitle, .kpi-label').forEach(el => {
      if (el.hasAttribute('data-i18n')) return;
      
      const text = el.textContent.trim();
      const cardTranslations = {
        'Kennzahlen Lager heute': this.t('dashboard.stats-today'),
        'Aktuelle Werte basierend auf den erfassten Daten': this.t('dashboard.stats-today-subtitle'),
        'Bewegungsjournal': this.t('dashboard.movement-journal'),
        'Alle Buchungen: Wareneingang, Umlagerung und Archivierung': this.t('dashboard.movement-journal-subtitle'),
        'belegte Stellplätze': this.t('dashboard.occupied-locations'),
        'Einträge im Lager': this.t('dashboard.entries'),
        'Kartons gesamt': this.t('dashboard.total-cartons'),
        'Anzahl offene RA Positionen': this.t('dashboard.open-ras'),
        'Retouren nach Frachtführer': this.t('dashboard.returns-by-carrier'),
        'Verteilung als Beispiel, Daten sind Platzhalter': this.t('dashboard.returns-by-carrier-subtitle'),
        'Lager Kennzahlen': this.currentLang === 'en' ? 'Warehouse Key Figures' : 'Lager Kennzahlen',
      };
      
      if (cardTranslations[text] && cardTranslations[text] !== text) {
        el.textContent = cardTranslations[text];
      }
    });
  }
  
  // Übersetze Topbar
  translateTopbar() {
    // Übersetze nur wenn Sprache nicht DE ist
    if (this.currentLang === 'de') {
      return;
    }
    
    const topbarTitle = document.getElementById('topbarTitle');
    const topbarSubtitle = document.getElementById('topbarSubtitle');
    
    if (topbarTitle) {
      const titleText = topbarTitle.textContent.trim();
      const titleTranslations = {
        'Dashboard': this.t('dashboard.title'),
        'Wareneingang': this.t('inbound.title'),
        'Lagerbestand': this.t('inventory.title'),
        'Umlagerung': this.t('movement.title'),
        'Archiv': this.t('archive.title'),
        'Globale Suche': this.t('search.title'),
        'Lager-Visualisierung': this.t('warehouse-map.title'),
        'Einstellungen': this.t('settings.title'),
      };
      
      if (titleTranslations[titleText] && titleTranslations[titleText] !== titleText) {
        topbarTitle.textContent = titleTranslations[titleText];
      }
    }
    
    if (topbarSubtitle) {
      const subtitleText = topbarSubtitle.textContent.trim();
      const subtitleTranslations = {
        'Überblick über Lager und Retouren': this.t('dashboard.subtitle'),
        'Einfache Erfassung neuer Kartons': this.t('inbound.subtitle'),
        'Stellplätze mit Anzahl der Paletten und Kartons aus der Datenbank': this.t('inventory.subtitle'),
        'Stellplatz Wechsel von Palette oder Karton': this.t('movement.subtitle'),
        'Übersicht archivierter Bestände': this.t('archive.subtitle'),
        'Durchsuchen Sie alle Daten': this.t('search.subtitle'),
        'Interaktive Heatmap mit Echtzeit-Auslastung': this.t('warehouse-map.subtitle'),
        'Carrier-Konfiguration und Dropdown-Optionen verwalten': this.t('settings.subtitle'),
      };
      
      if (subtitleTranslations[subtitleText] && subtitleTranslations[subtitleText] !== subtitleText) {
        topbarSubtitle.textContent = subtitleTranslations[subtitleText];
      }
    }
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
  addLanguageSwitcher(maxRetries = 10) {
    // Prüfe ob bereits ein Switcher existiert
    const existingSwitcher = document.querySelector('.language-switcher');
    if (existingSwitcher) {
      console.log('✅ Language Switcher existiert bereits');
      return;
    }
    
    // Prüfe Maximalversuche
    if (maxRetries <= 0) {
      console.warn('⚠️ Topbar-right konnte nach mehreren Versuchen nicht gefunden werden. Überspringe Language Switcher.');
      return;
    }
    
    // Finde die Topbar
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) {
      // Nur bei ersten Versuchen warnen, nicht bei jedem
      if (maxRetries >= 8) {
        console.log('⏳ Topbar-right noch nicht verfügbar, versuche erneut...');
      }
      setTimeout(() => this.addLanguageSwitcher(maxRetries - 1), 500);
      return;
    }

    // Erstelle kombinierter Button (Language + Quick Actions)
    const switcher = document.createElement('button');
    switcher.className = 'language-switcher quick-actions-btn';
    switcher.setAttribute('aria-label', 'Sprache wechseln / Quick Actions');
    switcher.type = 'button';
    switcher.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 30px;
      min-width: 60px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid var(--border-soft);
      background: var(--bg-soft);
      color: var(--text-main);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.16s ease, border-color 0.16s ease, transform 0.1s ease, box-shadow 0.16s ease, color 0.16s ease;
      position: relative;
    `;
    
    switcher.innerHTML = `
      <span style="font-size: 14px;">🌐</span>
      <span id="currentLangLabel" style="font-size: 12px; font-weight: 600; color: var(--text-main);">${this.currentLang.toUpperCase()}</span>
      <span style="font-size: 12px; margin-left: 2px;">⚡</span>
    `;
    
    // Hover-Effekt wie btn-icon
    switcher.addEventListener('mouseenter', () => {
      switcher.style.background = 'var(--bg-card)';
      switcher.style.boxShadow = '0 3px 8px rgba(0,0,0,0.35)';
      switcher.style.transform = 'translateY(-1px)';
    });
    
    switcher.addEventListener('mouseleave', () => {
      switcher.style.background = 'var(--bg-soft)';
      switcher.style.boxShadow = '';
      switcher.style.transform = '';
    });
    
    // Click-Handler: Linksklick = Language, Rechtsklick = Quick Actions
    switcher.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Prüfe ob auf Quick-Actions-Icon geklickt wurde
      const clickTarget = e.target;
      const quickIcon = switcher.querySelector('span:last-child');
      
      if (clickTarget === quickIcon || clickTarget.textContent === '⚡') {
        // Quick Actions öffnen
        if (window.favoritesManager && typeof window.favoritesManager.toggleQuickActions === 'function') {
          window.favoritesManager.toggleQuickActions();
        } else if (typeof window.toggleQuickActions === 'function') {
          window.toggleQuickActions();
        }
      } else {
        // Language-Menü öffnen
        this.showLanguageMenu();
      }
    });
    
    // Rechtsklick öffnet Quick Actions
    switcher.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.favoritesManager && typeof window.favoritesManager.toggleQuickActions === 'function') {
        window.favoritesManager.toggleQuickActions();
      } else if (typeof window.toggleQuickActions === 'function') {
        window.toggleQuickActions();
      }
    });
    
    // Füge vor user-info oder currentUserDisplay ein
    const userInfo = topbarRight.querySelector('.user-info, #currentUserDisplay');
    if (userInfo) {
      topbarRight.insertBefore(switcher, userInfo);
    } else {
      topbarRight.appendChild(switcher);
    }
    
    // Verstecke separaten Quick Actions FAB Button, da er jetzt im kombinierten Button ist
    setTimeout(() => {
      const quickActionsBar = document.getElementById('quickActionsBar');
      const quickActionsFAB = document.querySelector('.quick-actions-fab');
      if (quickActionsBar && quickActionsFAB) {
        quickActionsBar.style.display = 'none';
      }
    }, 500);
    
    console.log('✅ Kombinierter Language + Quick Actions Button hinzugefügt');
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
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        i18n.setLanguage(lang);
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

// Initialize language switcher when DOM is ready (nur einmal)
(function initLanguageSwitcher() {
  let initialized = false;
  
  function doInit() {
    if (initialized) return;
    initialized = true;
    
    // Warte kurz, damit die Topbar geladen ist
    setTimeout(() => {
      i18n.addLanguageSwitcher();
      // Übersetze sofort wenn Sprache nicht DE ist
      if (i18n.currentLang !== 'de') {
        i18n.translatePage();
      }
    }, 300);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      doInit();
    });
  } else {
    // DOM already loaded
    doInit();
  }
  
  // Auch nach window.load nochmal versuchen (falls Elemente später geladen werden)
  window.addEventListener('load', () => {
    if (!initialized) {
      doInit();
    }
  });
})();
