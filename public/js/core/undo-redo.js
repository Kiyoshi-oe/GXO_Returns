// LVS Returns - Undo/Redo System
// ============================================

class UndoRedoManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = 50;
    this.init();
  }

  init() {
    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          this.undo();
        } else if ((e.key === 'z' && e.shiftKey) || (e.key === 'y')) {
          e.preventDefault();
          this.redo();
        }
      }
    });
  }

  /**
   * Fügt eine Aktion zur Historie hinzu
   * @param {object} action - Action-Objekt { type, data, undo, redo }
   */
  push(action) {
    // Entferne alle Aktionen nach currentIndex
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Füge neue Aktion hinzu
    this.history.push(action);
    this.currentIndex++;
    
    // Begrenze Historie
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
    
    // Update UI
    this.updateUI();
  }

  /**
   * Macht die letzte Aktion rückgängig
   */
  undo() {
    if (this.currentIndex < 0) {
      this.showNotification('Nichts zum Rückgängig machen', 'info');
      return;
    }

    const action = this.history[this.currentIndex];
    
    try {
      if (action.undo) {
        action.undo();
      }
      
      this.currentIndex--;
      this.updateUI();
      this.showNotification(`Rückgängig: ${action.type}`, 'success');
    } catch (err) {
      console.error('❌ Undo Fehler:', err);
      this.showNotification('Fehler beim Rückgängig machen', 'error');
    }
  }

  /**
   * Wiederholt die letzte rückgängig gemachte Aktion
   */
  redo() {
    if (this.currentIndex >= this.history.length - 1) {
      this.showNotification('Nichts zum Wiederholen', 'info');
      return;
    }

    this.currentIndex++;
    const action = this.history[this.currentIndex];
    
    try {
      if (action.redo) {
        action.redo();
      }
      
      this.updateUI();
      this.showNotification(`Wiederholt: ${action.type}`, 'success');
    } catch (err) {
      console.error('❌ Redo Fehler:', err);
      this.showNotification('Fehler beim Wiederholen', 'error');
    }
  }

  /**
   * Erstellt eine Action für DOM-Änderungen
   */
  createDOMAction(type, element, oldValue, newValue) {
    return {
      type,
      data: { element, oldValue, newValue },
      undo: () => {
        if (element) {
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = oldValue;
          } else {
            element.textContent = oldValue;
          }
        }
      },
      redo: () => {
        if (element) {
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = newValue;
          } else {
            element.textContent = newValue;
          }
        }
      }
    };
  }

  /**
   * Erstellt eine Action für API-Calls
   */
  createAPIAction(type, apiCall, undoCall) {
    return {
      type,
      data: { apiCall, undoCall },
      undo: async () => {
        if (undoCall) {
          await undoCall();
        }
      },
      redo: async () => {
        if (apiCall) {
          await apiCall();
        }
      }
    };
  }

  /**
   * Erstellt eine Action für Element-Entfernung
   */
  createDeleteAction(type, element, parent) {
    const nextSibling = element.nextSibling;
    const clone = element.cloneNode(true);
    
    return {
      type: `Delete ${type}`,
      data: { element, parent, nextSibling, clone },
      undo: () => {
        if (parent && clone) {
          if (nextSibling) {
            parent.insertBefore(clone, nextSibling);
          } else {
            parent.appendChild(clone);
          }
        }
      },
      redo: () => {
        if (element && element.parentNode) {
          element.remove();
        }
      }
    };
  }

  /**
   * Update UI (z.B. Buttons aktivieren/deaktivieren)
   */
  updateUI() {
    // Custom Event für UI-Updates
    document.dispatchEvent(new CustomEvent('undoredo-update', {
      detail: {
        canUndo: this.currentIndex >= 0,
        canRedo: this.currentIndex < this.history.length - 1,
        historyLength: this.history.length,
        currentIndex: this.currentIndex
      }
    }));
  }

  showNotification(message, type = 'info') {
    if (window.optimisticUI && window.optimisticUI.showSuccessToast) {
      if (type === 'success') {
        window.optimisticUI.showSuccessToast(message);
      } else if (type === 'error') {
        window.optimisticUI.showErrorToast(message);
      }
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Historie löschen
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.updateUI();
  }

  /**
   * Gibt Historie-Info zurück
   */
  getInfo() {
    return {
      canUndo: this.currentIndex >= 0,
      canRedo: this.currentIndex < this.history.length - 1,
      historyLength: this.history.length,
      currentIndex: this.currentIndex
    };
  }
}

// Globale Instanz
window.undoRedo = window.undoRedo || new UndoRedoManager();

// Convenience Functions
window.pushAction = (action) => {
  window.undoRedo.push(action);
};

window.undo = () => {
  window.undoRedo.undo();
};

window.redo = () => {
  window.undoRedo.redo();
};

console.log('✅ Undo/Redo initialisiert (Strg+Z / Strg+Shift+Z)');
