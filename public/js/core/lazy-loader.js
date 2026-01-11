// LVS Returns - Lazy Loading Manager
// ============================================

class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Lädt ein Modul dynamisch (nur einmal)
   * @param {string} moduleName - Name des Moduls
   * @param {string} modulePath - Pfad zum Modul
   * @param {string} initFunction - Name der Init-Funktion (optional)
   * @returns {Promise<any>} Das geladene Modul
   */
  async loadModule(moduleName, modulePath, initFunction = null) {
    // Bereits geladen?
    if (this.loadedModules.has(moduleName)) {
      console.log(`✅ Modul '${moduleName}' bereits geladen`);
      return this.loadedModules.get(moduleName);
    }

    // Lädt bereits?
    if (this.loadingPromises.has(moduleName)) {
      console.log(`⏳ Warte auf Laden von '${moduleName}'...`);
      return this.loadingPromises.get(moduleName);
    }

    // Neues Modul laden
    console.log(`📦 Lade Modul '${moduleName}' von ${modulePath}...`);
    
    const loadPromise = this._loadScript(modulePath)
      .then(() => {
        console.log(`✅ Modul '${moduleName}' geladen`);
        
        // Init-Funktion aufrufen wenn vorhanden
        if (initFunction && typeof window[initFunction] === 'function') {
          console.log(`🚀 Initialisiere ${initFunction}()...`);
          window[initFunction]();
        }
        
        const module = { loaded: true, path: modulePath };
        this.loadedModules.set(moduleName, module);
        this.loadingPromises.delete(moduleName);
        
        return module;
      })
      .catch(err => {
        console.error(`❌ Fehler beim Laden von '${moduleName}':`, err);
        this.loadingPromises.delete(moduleName);
        throw err;
      });

    this.loadingPromises.set(moduleName, loadPromise);
    return loadPromise;
  }

  /**
   * Lädt ein Script dynamisch
   * @param {string} src - Script-Pfad
   * @returns {Promise<void>}
   */
  _loadScript(src) {
    return new Promise((resolve, reject) => {
      // Prüfe ob Script bereits im DOM ist
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Lädt mehrere Module parallel
   * @param {Array<{name: string, path: string, init?: string}>} modules
   * @returns {Promise<void>}
   */
  async loadMultiple(modules) {
    const promises = modules.map(({ name, path, init }) => 
      this.loadModule(name, path, init)
    );
    
    return Promise.all(promises);
  }

  /**
   * Prüft ob ein Modul geladen ist
   * @param {string} moduleName
   * @returns {boolean}
   */
  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Gibt alle geladenen Module zurück
   * @returns {Array<string>}
   */
  getLoadedModules() {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Entfernt ein Modul aus dem Cache (für Entwicklung)
   * @param {string} moduleName
   */
  unload(moduleName) {
    this.loadedModules.delete(moduleName);
    console.log(`🗑️ Modul '${moduleName}' aus Cache entfernt`);
  }
}

// Globale Instanz
window.lazyLoader = window.lazyLoader || new LazyLoader();

// Convenience Functions
window.loadModule = (name, path, init) => window.lazyLoader.loadModule(name, path, init);
window.loadModules = (modules) => window.lazyLoader.loadMultiple(modules);

// Vordefinierte Module für einfachen Zugriff
window.LazyModules = {
  WAREHOUSE_MAP: { name: 'warehouse-map', path: '/js/features/warehouse-map.js', init: 'initWarehouseMap' },
  BARCODE: { name: 'barcode', path: '/js/features/barcode.js' },
  CHARTS: { name: 'charts', path: '/js/features/charts.js', init: 'initCharts' },
  USER_MANAGEMENT: { name: 'user-management', path: '/js/features/user-management.js', init: 'initUserManagement' },
  WARENEINGANG: { name: 'wareneingang', path: '/js/features/wareneingang.js' }
};

console.log('✅ Lazy Loader initialisiert');
