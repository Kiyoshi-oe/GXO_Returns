// LVS Returns - Keyboard Shortcuts & Command Palette
// ============================================

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.commandPaletteVisible = false;
    this.commands = [];
    this.filteredCommands = [];
    this.selectedIndex = 0;
    
    this.init();
  }

  init() {
    this.registerDefaultShortcuts();
    this.createCommandPalette();
    this.setupEventListeners();
    console.log('✅ Keyboard Shortcuts initialisiert');
  }

  // Register default shortcuts
  registerDefaultShortcuts() {
    // Navigation Shortcuts
    this.register('ctrl+k', () => this.openGlobalSearch(), 'Globale Suche öffnen');
    this.register('ctrl+p', () => this.toggleCommandPalette(), 'Command Palette öffnen');
    this.register('ctrl+h', () => this.navigateTo('/dashboard'), 'Zum Dashboard');
    this.register('ctrl+shift+w', () => this.navigateTo('/wareneingang'), 'Zum Wareneingang');
    this.register('ctrl+shift+l', () => this.navigateTo('/lagerbestand'), 'Zum Lagerbestand');
    this.register('ctrl+shift+s', () => this.navigateTo('/suche'), 'Zur Suche');
    this.register('ctrl+shift+m', () => this.navigateTo('/warehouse-map'), 'Zur Lager-Visualisierung');
    
    // Quick Actions
    this.register('ctrl+n', () => this.quickAction('new-inbound'), 'Neuer Wareneingang');
    this.register('ctrl+shift+r', () => this.refreshPage(), 'Seite aktualisieren');
    this.register('ctrl+/', () => this.showShortcutsHelp(), 'Shortcuts anzeigen');
    
    // Search
    this.register('ctrl+f', (e) => {
      e.preventDefault();
      this.focusSearch();
    }, 'Suche fokussieren');

    // Theme Toggle
    this.register('ctrl+shift+t', () => this.toggleTheme(), 'Theme wechseln');

    // Commands for Command Palette (will be translated dynamically)
    this.commandsConfig = [
      { id: 'dashboard', icon: '📊', labelKey: 'cmd.dashboard', action: () => this.navigateTo('/dashboard'), keywords: ['home', 'start', 'übersicht', 'dashboard'] },
      { id: 'wareneingang', icon: '📥', labelKey: 'cmd.inbound', action: () => this.navigateTo('/wareneingang'), keywords: ['inbound', 'eingang', 'empfang', 'wareneingang'] },
      { id: 'lagerbestand', icon: '📦', labelKey: 'cmd.inventory', action: () => this.navigateTo('/lagerbestand'), keywords: ['inventory', 'bestand', 'lager', 'lagerbestand'] },
      { id: 'umlagerung', icon: '↔️', labelKey: 'movement.title', action: () => this.navigateTo('/umlagerung'), keywords: ['movement', 'transfer', 'verschieben', 'umlagerung'] },
      { id: 'archive', icon: '🗂️', labelKey: 'archive.title', action: () => this.navigateTo('/archive'), keywords: ['archive', 'archiv', 'alt'] },
      { id: 'suche', icon: '🔍', labelKey: 'cmd.search', action: () => this.navigateTo('/suche'), keywords: ['search', 'find', 'finden', 'suche'] },
      { id: 'warehouse-map', icon: '🗺️', labelKey: 'cmd.warehouse-map', action: () => this.navigateTo('/warehouse-map'), keywords: ['map', 'heatmap', 'visualisierung', 'karte', 'warehouse'] },
      { id: 'barcode', icon: '📊', labelKey: 'cmd.barcode', action: () => this.navigateTo('/barcode'), keywords: ['barcode', 'qr', 'code'] },
      { id: 'ra-import', icon: '📑', labelKey: 'nav.ra-import', action: () => this.navigateTo('/ra-import'), keywords: ['ra', 'import'] },
      { id: 'performance', icon: '⚡', labelKey: 'performance.title', action: () => this.navigateTo('/performance'), keywords: ['performance', 'stats', 'statistik'] },
      { id: 'einstellungen', icon: '⚙️', labelKey: 'cmd.settings', action: () => this.navigateTo('/einstellungen'), keywords: ['settings', 'config', 'konfiguration', 'einstellungen'] },
      { id: 'import', icon: '📥', labelKey: 'cmd.import', action: () => this.navigateTo('/import'), keywords: ['import', 'export', 'daten'] },
      { id: 'refresh', icon: '🔄', labelKey: 'cmd.refresh', action: () => this.refreshPage(), keywords: ['refresh', 'reload', 'aktualisieren'] },
      { id: 'theme', icon: '🌓', labelKey: 'cmd.theme-toggle', action: () => this.toggleTheme(), keywords: ['theme', 'dark', 'light', 'dunkel', 'hell'] },
      { id: 'help', icon: '❓', labelKey: 'shortcuts.show-shortcuts', action: () => this.showShortcutsHelp(), keywords: ['help', 'hilfe', 'shortcuts'] },
    ];
    
    // Build commands with current language
    this.updateCommands();
  }

  // Update commands with current language
  updateCommands() {
    this.commands = this.commandsConfig.map(cmd => ({
      ...cmd,
      label: `${cmd.icon} ${window.t ? window.t(cmd.labelKey) : cmd.labelKey}`
    }));
  }

  // Register a keyboard shortcut
  register(key, callback, description = '') {
    this.shortcuts.set(key.toLowerCase(), { callback, description });
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // ESC to close command palette
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.commandPaletteVisible) {
        this.hideCommandPalette();
      }
    });
  }

  // Handle keydown events
  handleKeyDown(e) {
    const key = this.getKeyString(e);
    
    // Command Palette navigation
    if (this.commandPaletteVisible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
        this.updateCommandPaletteSelection();
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateCommandPaletteSelection();
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelectedCommand();
        return;
      }
    }
    
    // Check if shortcut exists
    if (this.shortcuts.has(key)) {
      const shortcut = this.shortcuts.get(key);
      e.preventDefault();
      shortcut.callback(e);
    }
  }

  // Get key string from event
  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta');
    
    const key = e.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key);
    }
    
    return parts.join('+');
  }

  // Create Command Palette UI
  createCommandPalette() {
    const palette = document.createElement('div');
    palette.id = 'commandPalette';
    palette.className = 'command-palette';
    palette.innerHTML = `
      <div class="command-palette-backdrop"></div>
      <div class="command-palette-container">
        <div class="command-palette-search">
          <span class="command-palette-icon">🔍</span>
          <input 
            type="text" 
            id="commandPaletteInput" 
            placeholder="${window.t ? window.t('cmd.search-placeholder') : 'Befehl suchen... (Strg+P)'}"
            autocomplete="off"
          >
          <span class="command-palette-hint">${window.t ? window.t('cmd.close-hint') : 'ESC zum Schließen'}</span>
        </div>
        <div class="command-palette-results" id="commandPaletteResults">
          <!-- Results will be inserted here -->
        </div>
      </div>
    `;
    
    document.body.appendChild(palette);
    
    // Search input event
    const input = document.getElementById('commandPaletteInput');
    input.addEventListener('input', (e) => this.filterCommands(e.target.value));
    
    // Click backdrop to close
    palette.querySelector('.command-palette-backdrop').addEventListener('click', () => {
      this.hideCommandPalette();
    });
    
    // Add styles
    this.addCommandPaletteStyles();
  }

  // Toggle Command Palette
  toggleCommandPalette() {
    if (this.commandPaletteVisible) {
      this.hideCommandPalette();
    } else {
      this.showCommandPalette();
    }
  }

  // Show Command Palette
  showCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandPaletteInput');
    
    palette.classList.add('active');
    this.commandPaletteVisible = true;
    
    // Reset
    input.value = '';
    this.selectedIndex = 0;
    this.filterCommands('');
    
    // Focus input
    setTimeout(() => input.focus(), 100);
  }

  // Hide Command Palette
  hideCommandPalette() {
    const palette = document.getElementById('commandPalette');
    palette.classList.remove('active');
    this.commandPaletteVisible = false;
  }

  // Filter commands based on search
  filterCommands(search) {
    const query = search.toLowerCase().trim();
    
    if (!query) {
      this.filteredCommands = this.commands;
    } else {
      this.filteredCommands = this.commands.filter(cmd => {
        const labelMatch = cmd.label.toLowerCase().includes(query);
        const keywordMatch = cmd.keywords.some(kw => kw.includes(query));
        return labelMatch || keywordMatch;
      });
    }
    
    this.selectedIndex = 0;
    this.renderCommandResults();
  }

  // Render command results
  renderCommandResults() {
    const results = document.getElementById('commandPaletteResults');
    
    if (this.filteredCommands.length === 0) {
      results.innerHTML = `<div class="command-palette-empty">${window.t ? window.t('cmd.no-results') : 'Keine Befehle gefunden'}</div>`;
      return;
    }
    
    results.innerHTML = this.filteredCommands.map((cmd, index) => `
      <div class="command-palette-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
        <span class="command-item-label">${cmd.label}</span>
      </div>
    `).join('');
    
    // Click handler
    results.querySelectorAll('.command-palette-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectedIndex = index;
        this.executeSelectedCommand();
      });
    });
  }

  // Update selection
  updateCommandPaletteSelection() {
    const items = document.querySelectorAll('.command-palette-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  // Execute selected command
  executeSelectedCommand() {
    if (this.filteredCommands[this.selectedIndex]) {
      const cmd = this.filteredCommands[this.selectedIndex];
      this.hideCommandPalette();
      cmd.action();
    }
  }

  // Navigate to page
  navigateTo(path) {
    window.location.href = path;
  }

  // Open Global Search
  openGlobalSearch() {
    // Versuche zur Suche-Seite zu navigieren
    window.location.href = '/suche';
  }

  // Quick action
  quickAction(action) {
    switch (action) {
      case 'new-inbound':
        this.navigateTo('/wareneingang');
        break;
    }
  }

  // Refresh page
  refreshPage() {
    window.location.reload();
  }

  // Focus search
  focusSearch() {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Suche"], input[placeholder*="Search"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Toggle theme
  toggleTheme() {
    if (typeof toggleTheme === 'function') {
      toggleTheme();
    } else {
      // Fallback
      document.body.classList.toggle('dark-mode');
    }
  }

  // Show shortcuts help
  showShortcutsHelp() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .filter(([key, data]) => data.description)
      .map(([key, data]) => `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-soft);">
          <span style="color: var(--text-main);">${data.description}</span>
          <kbd style="background: var(--bg-soft); padding: 6px 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: var(--text-main); border: 1px solid var(--border-soft); font-weight: 600;">${key.toUpperCase()}</kbd>
        </div>
      `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-modal-backdrop"></div>
      <div class="shortcuts-modal-content">
        <div class="shortcuts-modal-header">
          <h2 style="margin: 0; font-size: 20px; color: var(--text-main);">⌨️ ${window.t ? window.t('shortcuts.title') : 'Keyboard Shortcuts'}</h2>
          <button class="shortcuts-modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">&times;</button>
        </div>
        <div class="shortcuts-modal-body">
          ${shortcuts}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const close = () => modal.remove();
    const closeBtn = modal.querySelector('.shortcuts-modal-close');
    closeBtn.addEventListener('click', close);
    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.color = 'var(--gxo-orange)';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.color = 'var(--text-muted)';
    });
    modal.querySelector('.shortcuts-modal-backdrop').addEventListener('click', close);
    
    // Add styles
    modal.querySelector('.shortcuts-modal-backdrop').style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
    `;
    
    modal.querySelector('.shortcuts-modal-content').style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
      border: 1px solid var(--border-soft);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      z-index: 10000;
    `;
    
    modal.querySelector('.shortcuts-modal-header').style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-soft);
      background: var(--bg-soft);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    modal.querySelector('.shortcuts-modal-body').style.cssText = `
      padding: 24px;
      max-height: calc(80vh - 80px);
      overflow-y: auto;
      background: var(--bg-card);
    `;
  }

  // Add Command Palette styles
  addCommandPaletteStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .command-palette {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
      }

      .command-palette.active {
        display: block;
      }

      .command-palette-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        animation: fadeIn 0.2s;
      }

      .command-palette-container {
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 600px;
        background: var(--bg-card);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
        animation: slideDown 0.3s;
        overflow: hidden;
        color: var(--text-main);
      }

      .command-palette-search {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: var(--bg-soft);
        border-bottom: 1px solid var(--border-soft);
      }

      .command-palette-icon {
        font-size: 20px;
      }

      #commandPaletteInput {
        flex: 1;
        border: none;
        outline: none;
        font-size: 16px;
        background: transparent;
        color: var(--text-main);
      }

      #commandPaletteInput::placeholder {
        color: var(--text-muted);
      }

      .command-palette-hint {
        font-size: 12px;
        color: var(--text-muted);
        background: var(--bg-soft);
        border: 1px solid var(--border-soft);
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
      }

      .command-palette-results {
        max-height: 400px;
        overflow-y: auto;
        background: var(--bg-card);
      }

      .command-palette-item {
        padding: 12px 20px;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 1px solid var(--border-soft);
        color: var(--text-main);
      }

      .command-palette-item:hover {
        background: var(--bg-soft);
      }

      .command-palette-item.selected {
        background: var(--gxo-orange);
        color: white;
        border-left: 4px solid var(--gxo-green);
      }

      .command-item-label {
        font-size: 14px;
        font-weight: 500;
      }

      .command-palette-empty {
        padding: 40px 20px;
        text-align: center;
        color: var(--text-muted);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideDown {
        from {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize keyboard shortcuts
const keyboardShortcuts = new KeyboardShortcuts();

// Export for global access
window.keyboardShortcuts = keyboardShortcuts;
