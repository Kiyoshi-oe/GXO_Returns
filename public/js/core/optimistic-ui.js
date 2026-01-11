// LVS Returns - Optimistic UI Updates Utility
// ============================================

class OptimisticUI {
  constructor() {
    this.pendingOperations = new Map();
    this.rollbackHandlers = new Map();
  }

  /**
   * Führt eine optimistische UI-Update durch
   * @param {string} operationId - Eindeutige ID für die Operation
   * @param {Function} optimisticUpdate - Funktion die UI sofort aktualisiert
   * @param {Function} apiCall - Async Funktion für den API-Call
   * @param {Function} onSuccess - Callback bei Erfolg (optional)
   * @param {Function} onError - Callback bei Fehler (optional)
   * @param {Function} rollback - Funktion um UI zurückzusetzen
   * @returns {Promise<any>}
   */
  async execute(operationId, optimisticUpdate, apiCall, onSuccess = null, onError = null, rollback = null) {
    // Prüfe ob Operation bereits läuft
    if (this.pendingOperations.has(operationId)) {
      console.warn(`⚠️ Operation '${operationId}' läuft bereits`);
      return this.pendingOperations.get(operationId);
    }

    // 1. Optimistische UI-Update sofort ausführen
    console.log(`⚡ Optimistic Update: ${operationId}`);
    try {
      optimisticUpdate();
    } catch (err) {
      console.error('❌ Fehler bei optimistischem Update:', err);
    }

    // Rollback-Handler speichern
    if (rollback) {
      this.rollbackHandlers.set(operationId, rollback);
    }

    // 2. API-Call im Hintergrund
    const promise = apiCall()
      .then(result => {
        console.log(`✅ API-Call erfolgreich: ${operationId}`);
        
        // Success-Callback
        if (onSuccess) {
          try {
            onSuccess(result);
          } catch (err) {
            console.error('❌ Fehler in onSuccess:', err);
          }
        }

        // Cleanup
        this.pendingOperations.delete(operationId);
        this.rollbackHandlers.delete(operationId);
        
        return result;
      })
      .catch(error => {
        console.error(`❌ API-Call fehlgeschlagen: ${operationId}`, error);
        
        // 3. Bei Fehler: Rollback der UI-Änderungen
        const rollbackFn = this.rollbackHandlers.get(operationId);
        if (rollbackFn) {
          console.log(`🔄 Rollback: ${operationId}`);
          try {
            rollbackFn();
          } catch (err) {
            console.error('❌ Fehler bei Rollback:', err);
          }
        }

        // Error-Callback
        if (onError) {
          try {
            onError(error);
          } catch (err) {
            console.error('❌ Fehler in onError:', err);
          }
        } else {
          // Standard-Fehlerbehandlung
          this.showErrorToast(`Fehler: ${error.message || 'Unbekannter Fehler'}`);
        }

        // Cleanup
        this.pendingOperations.delete(operationId);
        this.rollbackHandlers.delete(operationId);
        
        throw error;
      });

    this.pendingOperations.set(operationId, promise);
    return promise;
  }

  /**
   * Optimistic Delete - Element aus Liste entfernen
   * @param {string} operationId
   * @param {string} elementId - ID des DOM-Elements
   * @param {Function} apiCall - API-Call zum Löschen
   * @param {Function} onSuccess
   * @param {Function} onError
   * @returns {Promise<any>}
   */
  async delete(operationId, elementId, apiCall, onSuccess = null, onError = null) {
    const element = document.getElementById(elementId);
    
    if (!element) {
      console.error(`❌ Element '${elementId}' nicht gefunden`);
      return Promise.reject(new Error('Element not found'));
    }

    // Kopie für Rollback
    const parent = element.parentNode;
    const nextSibling = element.nextSibling;
    const elementCopy = element.cloneNode(true);

    return this.execute(
      operationId,
      // Optimistic: Element sofort ausblenden
      () => {
        element.style.opacity = '0.5';
        element.style.pointerEvents = 'none';
        element.classList.add('deleting');
      },
      // API-Call
      apiCall,
      // Success: Element endgültig entfernen
      (result) => {
        element.remove();
        if (onSuccess) onSuccess(result);
      },
      // Error: Element wiederherstellen
      (error) => {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        element.classList.remove('deleting');
        if (onError) onError(error);
      },
      // Rollback
      () => {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        element.classList.remove('deleting');
      }
    );
  }

  /**
   * Optimistic Update - Element aktualisieren
   * @param {string} operationId
   * @param {object} updates - Objekt mit den Änderungen {elementId: newValue}
   * @param {Function} apiCall - API-Call
   * @param {Function} onSuccess
   * @param {Function} onError
   * @returns {Promise<any>}
   */
  async update(operationId, updates, apiCall, onSuccess = null, onError = null) {
    const oldValues = {};
    
    // Alte Werte speichern
    Object.keys(updates).forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        oldValues[elementId] = element.textContent || element.value;
      }
    });

    return this.execute(
      operationId,
      // Optimistic: Werte sofort ändern
      () => {
        Object.keys(updates).forEach(elementId => {
          const element = document.getElementById(elementId);
          if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              element.value = updates[elementId];
            } else {
              element.textContent = updates[elementId];
            }
            element.classList.add('updating');
          }
        });
      },
      // API-Call
      apiCall,
      // Success: Klasse entfernen
      (result) => {
        Object.keys(updates).forEach(elementId => {
          const element = document.getElementById(elementId);
          if (element) element.classList.remove('updating');
        });
        if (onSuccess) onSuccess(result);
      },
      // Error: Alte Werte wiederherstellen
      (error) => {
        if (onError) onError(error);
      },
      // Rollback
      () => {
        Object.keys(oldValues).forEach(elementId => {
          const element = document.getElementById(elementId);
          if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              element.value = oldValues[elementId];
            } else {
              element.textContent = oldValues[elementId];
            }
            element.classList.remove('updating');
          }
        });
      }
    );
  }

  /**
   * Zeigt eine Fehler-Toast-Nachricht
   * @param {string} message
   */
  showErrorToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 100000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = `❌ ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Zeigt eine Erfolgs-Toast-Nachricht
   * @param {string} message
   */
  showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--gxo-green);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 100000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = `✓ ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Prüft ob eine Operation läuft
   * @param {string} operationId
   * @returns {boolean}
   */
  isPending(operationId) {
    return this.pendingOperations.has(operationId);
  }

  /**
   * Gibt alle laufenden Operationen zurück
   * @returns {Array<string>}
   */
  getPendingOperations() {
    return Array.from(this.pendingOperations.keys());
  }
}

// Globale Instanz
window.optimisticUI = window.optimisticUI || new OptimisticUI();

// CSS für Animationen hinzufügen
if (!document.getElementById('optimistic-ui-styles')) {
  const style = document.createElement('style');
  style.id = 'optimistic-ui-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    .updating {
      position: relative;
      opacity: 0.7;
    }
    
    .updating::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,111,15,0.2), transparent);
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .deleting {
      transition: all 0.3s ease;
      opacity: 0.5 !important;
    }
  `;
  document.head.appendChild(style);
}

console.log('✅ Optimistic UI initialisiert');
