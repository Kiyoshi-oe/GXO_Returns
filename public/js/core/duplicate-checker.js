// LVS Returns - Real-Time Duplicate Checker
// ============================================

class DuplicateChecker {
  constructor() {
    this.cache = new Map();
    this.pendingChecks = new Map();
    this.init();
  }

  init() {
    // CSS für Duplikat-Warnungen
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('duplicate-checker-styles')) return;

    const style = document.createElement('style');
    style.id = 'duplicate-checker-styles';
    style.textContent = `
      .duplicate-warning {
        margin-top: 8px;
        padding: 12px;
        background: rgba(245, 158, 11, 0.1);
        border: 2px solid #f59e0b;
        border-radius: 8px;
        animation: slideDown 0.3s ease;
      }
      
      .duplicate-warning-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #f59e0b;
        margin-bottom: 8px;
      }
      
      .duplicate-warning-details {
        font-size: 13px;
        color: var(--text-main);
        line-height: 1.6;
      }
      
      .duplicate-warning-details strong {
        color: var(--text-main);
      }
      
      .duplicate-warning-actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
      }
      
      .duplicate-warning-actions button {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .duplicate-warning-actions .btn-ignore {
        background: var(--bg-soft);
        border: 1px solid var(--border-soft);
        color: var(--text-main);
      }
      
      .duplicate-warning-actions .btn-ignore:hover {
        background: var(--bg-card);
      }
      
      .duplicate-warning-actions .btn-view {
        background: var(--gxo-orange);
        border: 1px solid var(--gxo-orange);
        color: white;
      }
      
      .duplicate-warning-actions .btn-view:hover {
        background: #f97316;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Prüft ob ein Wert bereits existiert
   * @param {string} fieldId - ID des Input-Felds
   * @param {string} value - Zu prüfender Wert
   * @param {string} type - Typ der Prüfung ('olpn', 'tracking', 'location', etc.)
   * @param {object} options - Optionen
   * @returns {Promise<{exists: boolean, details: object|null}>}
   */
  async check(fieldId, value, type = 'olpn', options = {}) {
    if (!value || value.trim() === '') {
      this.hideWarning(fieldId);
      return { exists: false, details: null };
    }

    // Cache prüfen
    const cacheKey = `${type}:${value.trim()}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      this.showWarning(fieldId, cached);
      return cached;
    }

    // Prüfe ob bereits eine Prüfung läuft
    if (this.pendingChecks.has(cacheKey)) {
      return this.pendingChecks.get(cacheKey);
    }

    // API-Call
    const checkPromise = this.performCheck(value, type, options)
      .then(result => {
        // Cache speichern
        this.cache.set(cacheKey, result);
        
        // Warning anzeigen wenn Duplikat
        if (result.exists) {
          this.showWarning(fieldId, result);
        } else {
          this.hideWarning(fieldId);
        }
        
        this.pendingChecks.delete(cacheKey);
        return result;
      })
      .catch(err => {
        console.error('❌ Duplikat-Check Fehler:', err);
        this.pendingChecks.delete(cacheKey);
        return { exists: false, details: null };
      });

    this.pendingChecks.set(cacheKey, checkPromise);
    return checkPromise;
  }

  async performCheck(value, type, options) {
    try {
      let endpoint = '/api/inbound/check-duplicate';
      const params = new URLSearchParams();
      
      if (type === 'olpn') {
        params.append('olpn', value.trim());
        if (options.carrierId) params.append('carrier', options.carrierId);
        if (options.carrierName) params.append('carrier_name', options.carrierName);
      } else if (type === 'tracking') {
        params.append('tracking', value.trim());
        if (options.carrierId) params.append('carrier', options.carrierId);
      } else if (type === 'location') {
        endpoint = '/api/warehouse/locations/check';
        params.append('code', value.trim());
      }
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();
      
      return {
        exists: data.exists || false,
        details: data.details || null
      };
    } catch (err) {
      console.error('❌ Duplikat-Check API Fehler:', err);
      return { exists: false, details: null };
    }
  }

  showWarning(fieldId, result) {
    if (!result.exists || !result.details) {
      this.hideWarning(fieldId);
      return;
    }

    const field = document.getElementById(fieldId);
    if (!field) return;

    // Prüfe ob Warning bereits existiert
    let warningEl = document.getElementById(`${fieldId}-duplicate-warning`);
    if (!warningEl) {
      warningEl = document.createElement('div');
      warningEl.id = `${fieldId}-duplicate-warning`;
      warningEl.className = 'duplicate-warning';
      
      // Nach dem Input-Feld einfügen
      field.parentElement.appendChild(warningEl);
    }

    const { details } = result;
    const date = details.created_at ? new Date(details.created_at).toLocaleString('de-DE') : 'Unbekannt';
    const location = details.location_code || details.location || 'Kein Stellplatz';
    const user = details.added_by || details.user || 'Unbekannt';
    const carrier = details.carrier_name || details.carrier || '';

    warningEl.innerHTML = `
      <div class="duplicate-warning-header">
        <span>⚠️</span>
        <span>${type === 'olpn' ? 'OLPN' : type === 'tracking' ? 'Tracking-Nummer' : 'Wert'} bereits vorhanden!</span>
      </div>
      <div class="duplicate-warning-details">
        <strong>Erfasst am:</strong> ${date}<br>
        <strong>Von:</strong> ${user}<br>
        ${location !== 'Kein Stellplatz' ? `<strong>Stellplatz:</strong> ${location}<br>` : ''}
        ${carrier ? `<strong>Carrier:</strong> ${carrier}<br>` : ''}
        ${details.actual_carton ? `<strong>Kartons:</strong> ${details.actual_carton}<br>` : ''}
      </div>
      <div class="duplicate-warning-actions">
        <button class="btn-view" onclick="window.duplicateChecker.viewDuplicate('${details.id || ''}')">
          📋 Details anzeigen
        </button>
        <button class="btn-ignore" onclick="window.duplicateChecker.ignoreWarning('${fieldId}')">
          Ignorieren
        </button>
      </div>
    `;

    warningEl.style.display = 'block';
  }

  hideWarning(fieldId) {
    const warningEl = document.getElementById(`${fieldId}-duplicate-warning`);
    if (warningEl) {
      warningEl.style.display = 'none';
    }
  }

  viewDuplicate(id) {
    if (!id) return;
    
    // Öffne Details-Modal oder navigiere
    if (typeof window.showInboundDetails === 'function') {
      window.showInboundDetails(id);
    } else {
      // Fallback: In neuem Tab öffnen
      window.open(`/api/inbound-simple/${id}`, '_blank');
    }
  }

  ignoreWarning(fieldId) {
    this.hideWarning(fieldId);
    
    // Markiere als ignoriert für diese Session
    const field = document.getElementById(fieldId);
    if (field) {
      field.dataset.duplicateIgnored = 'true';
    }
  }

  /**
   * Registriert ein Feld für automatische Duplikat-Prüfung
   */
  register(fieldId, type = 'olpn', options = {}) {
    const field = document.getElementById(fieldId);
    if (!field) {
      console.warn(`⚠️ Feld '${fieldId}' nicht gefunden`);
      return;
    }

    let debounceTimeout;
    const check = async (e) => {
      const value = field.value;
      
      // Ignoriert?
      if (field.dataset.duplicateIgnored === 'true') {
        return;
      }

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        await this.check(fieldId, value, type, options);
      }, 500); // 500ms Debounce
    };

    field.addEventListener('input', check);
    field.addEventListener('blur', () => {
      clearTimeout(debounceTimeout);
      check();
    });
  }

  /**
   * Cache leeren
   */
  clearCache() {
    this.cache.clear();
  }
}

// Globale Instanz
window.duplicateChecker = window.duplicateChecker || new DuplicateChecker();

// Convenience Functions
window.checkDuplicate = (fieldId, value, type, options) => {
  return window.duplicateChecker.check(fieldId, value, type, options);
};

window.registerDuplicateCheck = (fieldId, type, options) => {
  window.duplicateChecker.register(fieldId, type, options);
};

console.log('✅ Duplicate Checker initialisiert');
