// LVS Returns - Status Indicators & Loading States
// ============================================

class StatusIndicators {
  constructor() {
    this.init();
  }

  init() {
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('status-indicators-styles')) return;

    const style = document.createElement('style');
    style.id = 'status-indicators-styles';
    style.textContent = `
      /* Status Badges */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }
      
      .status-badge-success {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      
      .status-badge-warning {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
      
      .status-badge-error {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      
      .status-badge-info {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
      
      .status-badge-neutral {
        background: var(--bg-soft);
        color: var(--text-muted);
        border: 1px solid var(--border-soft);
      }
      
      /* Loading Skeletons */
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--bg-soft) 0%,
          var(--bg-card) 50%,
          var(--bg-soft) 100%
        );
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
      }
      
      .skeleton-line {
        height: 16px;
        margin-bottom: 8px;
      }
      
      .skeleton-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
      
      .skeleton-rect {
        height: 100px;
      }
      
      .skeleton-item {
        padding: 16px;
        border-bottom: 1px solid var(--border-soft);
      }
      
      @keyframes skeleton-loading {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      
      /* Loading Spinner */
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid var(--border-soft);
        border-top-color: var(--gxo-orange);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Loading Overlay */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: inherit;
      }
      
      .loading-overlay-content {
        background: var(--bg-card);
        padding: 24px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Erstellt einen Status-Badge
   */
  createBadge(text, type = 'neutral', icon = null) {
    const badge = document.createElement('span');
    badge.className = `status-badge status-badge-${type}`;
    
    if (icon) {
      badge.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    } else {
      badge.textContent = text;
    }
    
    return badge;
  }

  /**
   * Erstellt Skeleton-Loader
   */
  createSkeleton(type = 'line', count = 1, options = {}) {
    const skeletons = [];
    
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      
      if (type === 'line') {
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '16px';
      } else if (type === 'circle') {
        skeleton.style.width = options.size || '40px';
        skeleton.style.height = options.size || '40px';
        skeleton.style.borderRadius = '50%';
      } else if (type === 'rect') {
        skeleton.style.width = options.width || '100%';
        skeleton.style.height = options.height || '100px';
      }
      
      if (options.marginBottom) {
        skeleton.style.marginBottom = options.marginBottom;
      }
      
      skeletons.push(skeleton);
    }
    
    return count === 1 ? skeletons[0] : skeletons;
  }

  /**
   * Erstellt Skeleton-Liste
   */
  createSkeletonList(count = 5) {
    const container = document.createElement('div');
    
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'skeleton-item';
      item.innerHTML = `
        <div class="skeleton skeleton-line" style="width: 60%; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-line" style="width: 40%;"></div>
      `;
      container.appendChild(item);
    }
    
    return container;
  }

  /**
   * Zeigt Loading-Overlay
   */
  showLoadingOverlay(container, message = 'Lädt...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    
    overlay.innerHTML = `
      <div class="loading-overlay-content">
        <div class="loading-spinner"></div>
        <div style="color: var(--text-main); font-size: 14px;">${message}</div>
      </div>
    `;
    
    if (container) {
      container.style.position = 'relative';
      container.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }
    
    return overlay;
  }

  /**
   * Entfernt Loading-Overlay
   */
  hideLoadingOverlay(container = null) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Erstellt Loading-Spinner
   */
  createSpinner(size = 20) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.width = `${size}px`;
    spinner.style.height = `${size}px`;
    return spinner;
  }

  /**
   * Status-Badge für verschiedene Zustände
   */
  getStatusBadge(status, customLabels = {}) {
    const labels = {
      active: { text: 'Aktiv', type: 'success', icon: '✓' },
      inactive: { text: 'Inaktiv', type: 'neutral', icon: '○' },
      pending: { text: 'Ausstehend', type: 'warning', icon: '⏳' },
      approved: { text: 'Genehmigt', type: 'success', icon: '✓' },
      rejected: { text: 'Abgelehnt', type: 'error', icon: '✗' },
      completed: { text: 'Abgeschlossen', type: 'success', icon: '✓' },
      error: { text: 'Fehler', type: 'error', icon: '❌' },
      ...customLabels
    };
    
    const config = labels[status] || { text: status, type: 'neutral' };
    return this.createBadge(config.text, config.type, config.icon);
  }
}

// Globale Instanz
window.statusIndicators = window.statusIndicators || new StatusIndicators();

// Convenience Functions
window.createStatusBadge = (text, type, icon) => {
  return window.statusIndicators.createBadge(text, type, icon);
};

window.createSkeleton = (type, count, options) => {
  return window.statusIndicators.createSkeleton(type, count, options);
};

window.showLoading = (container, message) => {
  return window.statusIndicators.showLoadingOverlay(container, message);
};

window.hideLoading = (container) => {
  return window.statusIndicators.hideLoadingOverlay(container);
};

console.log('✅ Status Indicators & Loading States initialisiert');
