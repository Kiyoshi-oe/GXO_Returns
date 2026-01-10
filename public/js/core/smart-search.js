// LVS Returns - Smart Search (Intelligente Volltextsuche)
// ============================================

class SmartSearch {
  constructor() {
    this.searchableFields = [];
    this.fuzzyThreshold = 0.6; // Ähnlichkeitsschwelle für Fuzzy Search
    this.init();
  }

  init() {
    this.enhanceAllInputs();
    console.log('✅ Smart Search initialisiert');
  }

  // Enhance all text inputs with smart search
  enhanceAllInputs() {
    // Finde alle Such-Inputs
    const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"], input[placeholder*="Suche"], input[placeholder*="Search"]');
    
    searchInputs.forEach(input => {
      this.enhanceInput(input);
    });
  }

  // Enhance single input
  enhanceInput(input) {
    // Debounce für bessere Performance
    let debounceTimer;
    
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleSearch(e.target);
      }, 300);
    });

    // Füge Suchvorschläge hinzu
    this.addSearchSuggestions(input);
  }

  // Handle search
  handleSearch(input) {
    const query = input.value.trim();
    
    if (!query) return;

    // Fuzzy Search aktivieren
    const results = this.fuzzySearch(query, this.getSearchableData(input));
    
    // Zeige Ergebnisse
    this.showSearchResults(input, results);
  }

  // Get searchable data based on context
  getSearchableData(input) {
    // Versuche, die Tabelle oder Liste zu finden, die durchsucht werden soll
    const table = input.closest('.card')?.querySelector('table') || 
                  document.querySelector('table.data-table');
    
    if (table) {
      return this.extractTableData(table);
    }

    // Fallback: Alle Textinhalte auf der Seite
    return [];
  }

  // Extract data from table
  extractTableData(table) {
    const data = [];
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData = {
        element: row,
        text: Array.from(cells).map(cell => cell.textContent.trim()).join(' ')
      };
      data.push(rowData);
    });
    
    return data;
  }

  // Fuzzy Search Implementation (Levenshtein Distance)
  fuzzySearch(query, data) {
    const queryLower = query.toLowerCase();
    
    return data.map(item => {
      const textLower = item.text.toLowerCase();
      
      // Exakte Übereinstimmung
      if (textLower.includes(queryLower)) {
        return { ...item, score: 1.0, match: true };
      }
      
      // Fuzzy Match
      const similarity = this.calculateSimilarity(queryLower, textLower);
      return { ...item, score: similarity, match: similarity >= this.fuzzyThreshold };
    })
    .filter(item => item.match)
    .sort((a, b) => b.score - a.score);
  }

  // Calculate similarity between two strings
  calculateSimilarity(str1, str2) {
    // Einfache Implementierung: Prüfe ob Wörter enthalten sind
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matches = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    });
    
    return matches / words1.length;
  }

  // Levenshtein Distance (für präzisere Fuzzy Search)
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

  // Show search results
  showSearchResults(input, results) {
    // Verstecke alle Zeilen
    const table = input.closest('.card')?.querySelector('table') || 
                  document.querySelector('table.data-table');
    
    if (!table) return;

    const allRows = table.querySelectorAll('tbody tr');
    
    if (results.length === 0) {
      // Keine Ergebnisse - zeige alle oder Nachricht
      allRows.forEach(row => row.style.display = '');
      return;
    }

    // Verstecke alle Zeilen
    allRows.forEach(row => row.style.display = 'none');
    
    // Zeige nur gefundene Zeilen
    results.forEach(result => {
      result.element.style.display = '';
      
      // Highlight search terms
      this.highlightSearchTerms(result.element, input.value);
    });
  }

  // Highlight search terms in element
  highlightSearchTerms(element, query) {
    const cells = element.querySelectorAll('td');
    const queryLower = query.toLowerCase();
    
    cells.forEach(cell => {
      const text = cell.textContent;
      const textLower = text.toLowerCase();
      
      if (textLower.includes(queryLower)) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        const highlighted = text.replace(regex, '<mark style="background: var(--gxo-orange); color: white; padding: 2px 4px; border-radius: 2px; font-weight: 600;">$1</mark>');
        cell.innerHTML = highlighted;
      }
    });
  }

  // Escape regex special characters
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Add search suggestions
  addSearchSuggestions(input) {
    // Erstelle Suggestions Container
    const container = document.createElement('div');
    container.className = 'search-suggestions';
    container.style.cssText = `
      position: absolute;
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      min-width: 200px;
    `;

    // Position relativ zum Input
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(container);

    // Zeige Suggestions bei Focus
    input.addEventListener('focus', () => {
      if (input.value.trim()) {
        this.updateSuggestions(input, container);
      }
    });

    // Verstecke bei Blur (mit Verzögerung für Klicks)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        container.style.display = 'none';
      }, 200);
    });
  }

  // Update suggestions
  updateSuggestions(input, container) {
    const query = input.value.trim();
    if (!query) {
      container.style.display = 'none';
      return;
    }

    // Hole Vorschläge basierend auf vorherigen Suchen
    const suggestions = this.getSuggestions(query);
    
    if (suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = suggestions.map(suggestion => `
      <div class="search-suggestion-item" style="padding: 8px 12px; cursor: pointer; transition: background 0.1s; color: var(--text-main);" 
           onmouseover="this.style.background='var(--bg-soft)'" 
           onmouseout="this.style.background='transparent'"
           onclick="document.querySelector('input[value]').value='${suggestion}'; this.parentElement.style.display='none';">
        ${suggestion}
      </div>
    `).join('');

    container.style.display = 'block';
  }

  // Get suggestions
  getSuggestions(query) {
    // Hier könnten wir aus LocalStorage gespeicherte Suchen laden
    // Für jetzt: Leeres Array
    return [];
  }

  // Global search function (kann von überall aufgerufen werden)
  globalSearch(query, options = {}) {
    const {
      fuzzy = true,
      caseSensitive = false,
      threshold = this.fuzzyThreshold
    } = options;

    // Durchsuche alle Tabellen auf der Seite
    const tables = document.querySelectorAll('table.data-table');
    const results = [];

    tables.forEach(table => {
      const data = this.extractTableData(table);
      const tableResults = fuzzy 
        ? this.fuzzySearch(query, data)
        : data.filter(item => {
            const text = caseSensitive ? item.text : item.text.toLowerCase();
            const q = caseSensitive ? query : query.toLowerCase();
            return text.includes(q);
          });
      
      results.push(...tableResults);
    });

    return results;
  }
}

// Initialize Smart Search
const smartSearch = new SmartSearch();

// Export for global access
window.smartSearch = smartSearch;
