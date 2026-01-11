// LVS Returns - Enhanced Search with Debouncing & Highlighting
// ============================================

class EnhancedSearch {
  constructor() {
    this.searchCache = new Map();
    this.init();
  }

  init() {
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('enhanced-search-styles')) return;

    const style = document.createElement('style');
    style.id = 'enhanced-search-styles';
    style.textContent = `
      .search-highlight {
        background: var(--gxo-orange);
        color: white;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 600;
      }
      
      .search-result-item {
        transition: background 0.2s;
      }
      
      .search-result-item:hover {
        background: var(--bg-soft);
      }
      
      .search-no-results {
        padding: 40px;
        text-align: center;
        color: var(--text-muted);
      }
      
      .search-loading {
        padding: 20px;
        text-align: center;
        color: var(--text-muted);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Debounced Search mit Highlighting
   * @param {string} query - Suchbegriff
   * @param {Array} items - Zu durchsuchende Items
   * @param {Function} searchFn - Such-Funktion (item, query) => boolean
   * @param {Function} renderFn - Render-Funktion (item, query) => HTML
   * @param {object} options - Optionen
   */
  search(query, items, searchFn, renderFn = null, options = {}) {
    const {
      debounce = 300,
      minLength = 1,
      fuzzy = true,
      highlight = true,
      cache = true
    } = options;

    return new Promise((resolve) => {
      // Cache prüfen
      if (cache && this.searchCache.has(query)) {
        resolve(this.searchCache.get(query));
        return;
      }

      // Debounce
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        let results = [];

        if (!query || query.length < minLength) {
          resolve([]);
          return;
        }

        // Suche durchführen
        if (fuzzy) {
          results = this.fuzzySearch(query, items, searchFn);
        } else {
          results = items.filter(item => searchFn(item, query));
        }

        // Highlighting
        if (highlight && renderFn) {
          results = results.map(item => ({
            ...item,
            highlighted: renderFn(item, query)
          }));
        }

        // Cache speichern
        if (cache) {
          this.searchCache.set(query, results);
        }

        resolve(results);
      }, debounce);
    });
  }

  /**
   * Fuzzy Search mit Levenshtein-Distanz
   */
  fuzzySearch(query, items, searchFn) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (const item of items) {
      const searchableText = this.getSearchableText(item, searchFn);
      const score = this.calculateFuzzyScore(queryLower, searchableText.toLowerCase());
      
      if (score > 0.3) { // Threshold
        results.push({
          ...item,
          _searchScore: score
        });
      }
    }

    // Nach Score sortieren
    results.sort((a, b) => b._searchScore - a._searchScore);
    
    return results;
  }

  calculateFuzzyScore(query, text) {
    // Exact Match
    if (text.includes(query)) {
      return 1.0;
    }

    // Starts With
    if (text.startsWith(query)) {
      return 0.9;
    }

    // Levenshtein-Distanz
    const distance = this.levenshteinDistance(query, text);
    const maxLength = Math.max(query.length, text.length);
    return 1 - (distance / maxLength);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  getSearchableText(item, searchFn) {
    if (typeof searchFn === 'function') {
      // Wenn searchFn eine Funktion ist, verwende sie
      const result = searchFn(item, '');
      return typeof result === 'string' ? result : JSON.stringify(item);
    }
    
    // Fallback: Alle String-Properties
    return Object.values(item)
      .filter(v => typeof v === 'string')
      .join(' ');
  }

  /**
   * Highlightet Text mit Suchbegriff
   */
  highlight(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Registriert ein Search-Input
   */
  register(inputId, items, searchFn, renderFn, options = {}) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Input '${inputId}' nicht gefunden`);
      return;
    }

    const resultsContainer = options.resultsContainer || document.getElementById(`${inputId}-results`);
    if (!resultsContainer) {
      console.warn(`⚠️ Results Container nicht gefunden`);
      return;
    }

    let currentResults = [];

    input.addEventListener('input', async (e) => {
      const query = e.target.value;
      
      if (!query || query.length < (options.minLength || 1)) {
        resultsContainer.innerHTML = '';
        return;
      }

      // Loading State
      if (options.showLoading !== false) {
        resultsContainer.innerHTML = '<div class="search-loading">🔍 Suche...</div>';
      }

      // Suche durchführen
      const results = await this.search(query, items, searchFn, renderFn, options);
      currentResults = results;

      // Ergebnisse rendern
      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-no-results">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <div>Keine Ergebnisse gefunden</div>
          </div>
        `;
      } else {
        resultsContainer.innerHTML = results.map((item, index) => {
          const html = item.highlighted || (renderFn ? renderFn(item, query) : JSON.stringify(item));
          return `<div class="search-result-item" data-index="${index}">${html}</div>`;
        }).join('');

        // Click-Handler
        resultsContainer.querySelectorAll('.search-result-item').forEach((item, index) => {
          item.addEventListener('click', () => {
            if (options.onSelect) {
              options.onSelect(results[index], index);
            }
          });
        });
      }
    });
  }

  clearCache() {
    this.searchCache.clear();
  }
}

// Globale Instanz
window.enhancedSearch = window.enhancedSearch || new EnhancedSearch();

// Convenience Functions
window.searchWithHighlight = (query, items, searchFn, renderFn, options) => {
  return window.enhancedSearch.search(query, items, searchFn, renderFn, options);
};

window.registerSearch = (inputId, items, searchFn, renderFn, options) => {
  window.enhancedSearch.register(inputId, items, searchFn, renderFn, options);
};

console.log('✅ Enhanced Search initialisiert');
