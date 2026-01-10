// LVS Returns - Favorites & Quick Actions
// ============================================

class FavoritesManager {
  constructor() {
    this.favorites = [];
    this.quickActions = [];
    this.init();
  }

  async init() {
    // Lade gespeicherte Favoriten
    this.loadFavorites();
    
    // Registriere Standard Quick Actions
    this.registerDefaultQuickActions();
    
    // Füge Quick Actions Bar hinzu
    this.addQuickActionsBar();
    
    console.log('✅ Favorites Manager initialisiert');
  }

  // Load favorites from localStorage
  loadFavorites() {
    const saved = localStorage.getItem('wms_favorites');
    if (saved) {
      try {
        this.favorites = JSON.parse(saved);
      } catch (e) {
        console.error('Fehler beim Laden der Favoriten:', e);
        this.favorites = [];
      }
    }
  }

  // Save favorites to localStorage
  saveFavorites() {
    localStorage.setItem('wms_favorites', JSON.stringify(this.favorites));
  }

  // Add favorite
  addFavorite(item) {
    // Prüfe ob bereits vorhanden
    if (this.favorites.some(f => f.id === item.id)) {
      return false;
    }
    
    this.favorites.push({
      id: item.id,
      label: item.label,
      icon: item.icon,
      url: item.url,
      action: item.action,
      addedAt: new Date().toISOString()
    });
    
    this.saveFavorites();
    this.updateQuickActionsBar();
    return true;
  }

  // Remove favorite
  removeFavorite(id) {
    this.favorites = this.favorites.filter(f => f.id !== id);
    this.saveFavorites();
    this.updateQuickActionsBar();
  }

  // Register default quick actions
  registerDefaultQuickActions() {
    this.quickActions = [
      {
        id: 'new-inbound',
        labelKey: 'favorites.new-inbound',
        icon: '📥',
        action: () => window.location.href = '/wareneingang',
        category: 'primary'
      },
      {
        id: 'search',
        labelKey: 'favorites.search',
        icon: '🔍',
        action: () => window.location.href = '/suche',
        category: 'primary'
      },
      {
        id: 'warehouse-map',
        labelKey: 'favorites.warehouse-map',
        icon: '🗺️',
        action: () => window.location.href = '/warehouse-map',
        category: 'tools'
      },
      {
        id: 'refresh',
        labelKey: 'favorites.refresh',
        icon: '🔄',
        action: () => window.location.reload(),
        category: 'utility'
      },
      {
        id: 'export',
        labelKey: 'favorites.export',
        icon: '📤',
        action: () => window.location.href = '/import?tab=export',
        category: 'utility'
      }
    ];
  }
  
  // Get translated label
  getLabel(action) {
    if (action.labelKey && window.t) {
      return window.t(action.labelKey);
    }
    return action.label || action.labelKey;
  }

  // Add Quick Actions Bar
  addQuickActionsBar() {
    // Prüfe ob bereits vorhanden
    if (document.getElementById('quickActionsBar')) return;
    
    const bar = document.createElement('div');
    bar.id = 'quickActionsBar';
    bar.className = 'quick-actions-bar';
    bar.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
    `;
    
    // Main FAB Button
    const fab = document.createElement('button');
    fab.className = 'quick-actions-fab';
    fab.innerHTML = '⚡';
    fab.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    fab.addEventListener('mouseover', () => {
      fab.style.transform = 'scale(1.1)';
      fab.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    
    fab.addEventListener('mouseout', () => {
      fab.style.transform = 'scale(1)';
      fab.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    fab.addEventListener('click', () => this.toggleQuickActions());
    
    // Actions Container
    const actionsContainer = document.createElement('div');
    actionsContainer.id = 'quickActionsContainer';
    actionsContainer.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 8px;
    `;
    
    bar.appendChild(actionsContainer);
    bar.appendChild(fab);
    document.body.appendChild(bar);
    
    // Add styles
    this.addQuickActionsStyles();
  }

  // Toggle Quick Actions
  toggleQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    const fab = document.querySelector('.quick-actions-fab');
    
    if (container.style.display === 'none') {
      this.showQuickActions();
      fab.innerHTML = '✕';
      fab.style.transform = 'rotate(90deg)';
    } else {
      this.hideQuickActions();
      fab.innerHTML = '⚡';
      fab.style.transform = 'rotate(0deg)';
    }
  }

  // Show Quick Actions
  showQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    container.style.display = 'flex';
    
    // Render actions
    this.renderQuickActions();
    
    // Animate in
    const actions = container.querySelectorAll('.quick-action-btn');
    actions.forEach((action, index) => {
      setTimeout(() => {
        action.style.opacity = '1';
        action.style.transform = 'translateX(0)';
      }, index * 50);
    });
  }

  // Hide Quick Actions
  hideQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    container.style.display = 'none';
  }

  // Render Quick Actions
  renderQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    container.innerHTML = '';
    
    // Kombiniere Favoriten und Quick Actions
    const allActions = [
      ...this.favorites.map(f => ({
        ...f,
        isFavorite: true
      })),
      ...this.quickActions.filter(qa => qa.category === 'primary')
    ];
    
    allActions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'quick-action-btn';
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-soft);
        border-radius: 28px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.2s;
        opacity: 0;
        transform: translateX(20px);
        min-width: 180px;
        color: var(--text-main);
      `;
      
      btn.innerHTML = `
        <span style="font-size: 20px;">${action.icon}</span>
        <span style="font-weight: 500; font-size: 14px;">${this.getLabel(action)}</span>
        ${action.isFavorite ? '<span style="margin-left: auto; color: #fbbf24;">★</span>' : ''}
      `;
      
      btn.addEventListener('mouseover', () => {
        btn.style.transform = 'translateX(0) scale(1.05)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      });
      
      btn.addEventListener('mouseout', () => {
        btn.style.transform = 'translateX(0) scale(1)';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      });
      
      btn.addEventListener('click', () => {
        if (action.action) {
          action.action();
        } else if (action.url) {
          window.location.href = action.url;
        }
        this.hideQuickActions();
      });
      
      container.appendChild(btn);
    });
    
    // Add "Manage Favorites" button
    const manageBtn = document.createElement('button');
    manageBtn.className = 'quick-action-btn';
    manageBtn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-soft);
      border: 1px solid var(--border-soft);
      border-radius: 28px;
      cursor: pointer;
      transition: all 0.2s;
      opacity: 0;
      transform: translateX(20px);
      min-width: 180px;
      margin-top: 8px;
      color: var(--text-main);
    `;
    
    manageBtn.innerHTML = `
      <span style="font-size: 20px;">⭐</span>
      <span style="font-weight: 500; font-size: 14px;">${window.t ? window.t('favorites.manage') : 'Favoriten verwalten'}</span>
    `;
    
    manageBtn.addEventListener('click', () => {
      this.showFavoritesManager();
      this.hideQuickActions();
    });
    
    container.appendChild(manageBtn);
  }

  // Update Quick Actions Bar
  updateQuickActionsBar() {
    if (document.getElementById('quickActionsContainer').style.display !== 'none') {
      this.renderQuickActions();
    }
  }

  // Show Favorites Manager
  showFavoritesManager() {
    const modal = document.createElement('div');
    modal.className = 'favorites-modal';
    modal.innerHTML = `
      <div class="favorites-modal-backdrop"></div>
      <div class="favorites-modal-content">
        <div class="favorites-modal-header">
          <h2 style="margin: 0; font-size: 20px; color: var(--text-main);">⭐ ${window.t ? window.t('favorites.title') : 'Favoriten verwalten'}</h2>
          <button class="favorites-modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">&times;</button>
        </div>
        <div class="favorites-modal-body">
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--text-main);">${window.t ? window.t('favorites.my-favorites') : 'Meine Favoriten'}</h3>
            <div id="favoritesListContainer">
              ${this.favorites.length === 0 
                ? `<div style="text-align: center; padding: 40px; color: var(--text-muted);">${window.t ? window.t('favorites.no-favorites') : 'Noch keine Favoriten hinzugefügt'}</div>`
                : this.favorites.map(fav => `
                  <div class="favorite-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-soft); border: 1px solid var(--border-soft); border-radius: 8px; margin-bottom: 8px; color: var(--text-main);">
                    <span style="font-size: 20px;">${fav.icon}</span>
                    <span style="flex: 1;">${fav.label}</span>
                    <button class="btn btn-sm btn-ghost" onclick="favoritesManager.removeFavorite('${fav.id}'); this.closest('.favorite-item').remove();">${window.t ? window.t('favorites.remove') : 'Entfernen'}</button>
                  </div>
                `).join('')
              }
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--text-main);">${window.t ? window.t('favorites.available-actions') : 'Verfügbare Aktionen'}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
              ${this.quickActions.map(action => `
                <button class="btn btn-secondary" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; background: var(--bg-soft); border: 1px solid var(--border-soft); color: var(--text-main);" 
                        onclick="favoritesManager.addFavorite({id: '${action.id}', label: '${this.getLabel(action)}', icon: '${action.icon}', action: ${action.action.toString()}}); this.disabled=true; this.textContent='${window.t ? window.t('favorites.added') : 'Hinzugefügt'}';">
                  <span style="font-size: 24px;">${action.icon}</span>
                  <span style="font-size: 13px;">${this.getLabel(action)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const close = () => modal.remove();
    const closeBtn = modal.querySelector('.favorites-modal-close');
    closeBtn.addEventListener('click', close);
    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.color = 'var(--gxo-orange)';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.color = 'var(--text-muted)';
    });
    modal.querySelector('.favorites-modal-backdrop').addEventListener('click', close);
    
    // Add styles
    this.addFavoritesModalStyles(modal);
  }

  // Add Quick Actions Styles
  addQuickActionsStyles() {
    if (document.getElementById('quickActionsStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'quickActionsStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Add Favorites Modal Styles
  addFavoritesModalStyles(modal) {
    modal.querySelector('.favorites-modal-backdrop').style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
    `;
    
    modal.querySelector('.favorites-modal-content').style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      z-index: 10000;
    `;
    
    modal.querySelector('.favorites-modal-header').style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-soft);
      background: var(--bg-soft);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    modal.querySelector('.favorites-modal-body').style.cssText = `
      padding: 24px;
      max-height: calc(80vh - 80px);
      overflow-y: auto;
      background: var(--bg-card);
    `;
  }
}

// Initialize Favorites Manager
const favoritesManager = new FavoritesManager();

// Export for global access
window.favoritesManager = favoritesManager;
