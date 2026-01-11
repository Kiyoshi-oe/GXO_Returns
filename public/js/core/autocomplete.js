// LVS Returns - Auto-Complete & Suggestions
// ============================================

class Autocomplete {
  constructor() {
    this.suggestions = new Map();
    this.activeDropdowns = new Map();
    this.init();
  }

  init() {
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('autocomplete-styles')) return;

    const style = document.createElement('style');
    style.id = 'autocomplete-styles';
    style.textContent = `
      .autocomplete-wrapper {
        position: relative;
      }
      
      .autocomplete-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: var(--bg-card);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        animation: slideDown 0.2s ease;
      }
      
      .autocomplete-item {
        padding: 10px 14px;
        cursor: pointer;
        transition: background 0.15s;
        border-bottom: 1px solid var(--border-soft);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .autocomplete-item:last-child {
        border-bottom: none;
      }
      
      .autocomplete-item:hover,
      .autocomplete-item.selected {
        background: var(--bg-soft);
      }
      
      .autocomplete-item-icon {
        font-size: 18px;
        flex-shrink: 0;
      }
      
      .autocomplete-item-content {
        flex: 1;
        min-width: 0;
      }
      
      .autocomplete-item-label {
        font-weight: 600;
        color: var(--text-main);
        font-size: 14px;
        margin-bottom: 2px;
      }
      
      .autocomplete-item-description {
        font-size: 12px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .autocomplete-item-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .autocomplete-item-badge.available {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }
      
      .autocomplete-item-badge.full {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
      
      .autocomplete-item-badge.warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      .autocomplete-highlight {
        background: var(--gxo-orange);
        color: white;
        padding: 0 2px;
        border-radius: 2px;
        font-weight: 600;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Registriert ein Input-Feld für Auto-Vervollständigung
   * @param {string} fieldId - ID des Input-Felds
   * @param {Function} fetchFn - Funktion die Vorschläge holt (query) => Promise<Array>
   * @param {Function} renderFn - Funktion die Items rendert (item) => HTML
   * @param {object} options - Optionen
   */
  register(fieldId, fetchFn, renderFn = null, options = {}) {
    const field = document.getElementById(fieldId);
    if (!field) {
      console.warn(`⚠️ Feld '${fieldId}' nicht gefunden`);
      return;
    }

    // Wrapper erstellen
    if (!field.parentElement.classList.contains('autocomplete-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'autocomplete-wrapper';
      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);
    }

    let selectedIndex = -1;
    let currentSuggestions = [];
    let dropdown = null;

    const showSuggestions = async (query) => {
      if (!query || query.length < (options.minLength || 2)) {
        hideSuggestions();
        return;
      }

      try {
        const suggestions = await fetchFn(query);
        currentSuggestions = suggestions;

        if (suggestions.length === 0) {
          hideSuggestions();
          return;
        }

        // Dropdown erstellen/aktualisieren
        if (!dropdown) {
          dropdown = document.createElement('div');
          dropdown.className = 'autocomplete-dropdown';
          dropdown.id = `${fieldId}-dropdown`;
          field.parentElement.appendChild(dropdown);
        }

        // Items rendern
        dropdown.innerHTML = suggestions.map((item, index) => {
          const html = renderFn ? renderFn(item, query) : this.defaultRender(item, query);
          return `<div class="autocomplete-item" data-index="${index}" data-value="${this.getValue(item)}">${html}</div>`;
        }).join('');

        // Event-Listener für Items
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            selectSuggestion(suggestions[index]);
          });
        });

        selectedIndex = -1;
        this.activeDropdowns.set(fieldId, dropdown);
      } catch (err) {
        console.error('❌ Autocomplete Fehler:', err);
        hideSuggestions();
      }
    };

    const hideSuggestions = () => {
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      }
      this.activeDropdowns.delete(fieldId);
      selectedIndex = -1;
    };

    const selectSuggestion = (item) => {
      const value = this.getValue(item);
      const display = this.getDisplay(item);
      
      field.value = display;
      field.dataset.selectedValue = value;
      
      // Custom Event
      field.dispatchEvent(new CustomEvent('autocomplete-select', {
        detail: { item, value, display }
      }));
      
      hideSuggestions();
      
      if (options.onSelect) {
        options.onSelect(item, value, display);
      }
    };

    // Keyboard Navigation
    const handleKeyDown = (e) => {
      if (!dropdown || currentSuggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection();
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(currentSuggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        hideSuggestions();
      }
    };

    const updateSelection = () => {
      dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
        if (index === selectedIndex) {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    };

    // Debounced Input
    let debounceTimeout;
    field.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        showSuggestions(e.target.value);
      }, options.debounce || 300);
    });

    field.addEventListener('keydown', handleKeyDown);
    field.addEventListener('blur', () => {
      // Delay um Click-Events zu erlauben
      setTimeout(() => hideSuggestions(), 200);
    });

    field.addEventListener('focus', () => {
      if (field.value && field.value.length >= (options.minLength || 2)) {
        showSuggestions(field.value);
      }
    });
  }

  defaultRender(item, query) {
    const label = this.getDisplay(item);
    const description = item.description || '';
    const highlighted = this.highlight(label, query);
    
    return `
      <div class="autocomplete-item-content">
        <div class="autocomplete-item-label">${highlighted}</div>
        ${description ? `<div class="autocomplete-item-description">${description}</div>` : ''}
      </div>
    `;
  }

  highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="autocomplete-highlight">$1</span>');
  }

  getValue(item) {
    return item.value || item.id || item.code || item;
  }

  getDisplay(item) {
    return item.label || item.display || item.name || item.code || item;
  }
}

// Globale Instanz
window.autocomplete = window.autocomplete || new Autocomplete();

// Convenience Functions
window.registerAutocomplete = (fieldId, fetchFn, renderFn, options) => {
  window.autocomplete.register(fieldId, fetchFn, renderFn, options);
};

console.log('✅ Autocomplete initialisiert');
