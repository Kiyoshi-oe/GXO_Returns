// LVS Returns - Confirmation Dialogs for Critical Actions
// ============================================

class ConfirmationDialog {
  constructor() {
    this.init();
  }

  init() {
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('confirmation-dialog-styles')) return;

    const style = document.createElement('style');
    style.id = 'confirmation-dialog-styles';
    style.textContent = `
      .confirmation-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      }
      
      .confirmation-dialog {
        background: var(--bg-card);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
      }
      
      .confirmation-dialog-header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid var(--border-soft);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .confirmation-dialog-icon {
        font-size: 32px;
        flex-shrink: 0;
      }
      
      .confirmation-dialog-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-main);
        flex: 1;
      }
      
      .confirmation-dialog-body {
        padding: 20px 24px;
        color: var(--text-main);
        line-height: 1.6;
      }
      
      .confirmation-dialog-message {
        font-size: 15px;
        margin-bottom: 16px;
      }
      
      .confirmation-dialog-details {
        background: var(--bg-soft);
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        font-size: 13px;
      }
      
      .confirmation-dialog-details-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid var(--border-soft);
      }
      
      .confirmation-dialog-details-row:last-child {
        border-bottom: none;
      }
      
      .confirmation-dialog-details-label {
        font-weight: 600;
        color: var(--text-muted);
      }
      
      .confirmation-dialog-details-value {
        color: var(--text-main);
        text-align: right;
        max-width: 60%;
        word-break: break-word;
      }
      
      .confirmation-dialog-warning {
        background: rgba(245, 158, 11, 0.1);
        border-left: 4px solid #f59e0b;
        padding: 12px 16px;
        border-radius: 6px;
        margin: 16px 0;
        font-size: 13px;
        color: var(--text-main);
      }
      
      .confirmation-dialog-footer {
        padding: 16px 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        border-top: 1px solid var(--border-soft);
      }
      
      .confirmation-dialog-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }
      
      .confirmation-dialog-btn-cancel {
        background: var(--bg-soft);
        color: var(--text-main);
        border-color: var(--border-soft);
      }
      
      .confirmation-dialog-btn-cancel:hover {
        background: var(--bg-card);
      }
      
      .confirmation-dialog-btn-confirm {
        background: var(--gxo-orange);
        color: white;
        border-color: var(--gxo-orange);
      }
      
      .confirmation-dialog-btn-confirm:hover {
        background: #f97316;
      }
      
      .confirmation-dialog-btn-danger {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
      }
      
      .confirmation-dialog-btn-danger:hover {
        background: #dc2626;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Zeigt einen Bestätigungs-Dialog
   * @param {object} options - Dialog-Optionen
   * @returns {Promise<boolean>} - true wenn bestätigt, false wenn abgebrochen
   */
  show(options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Bestätigung erforderlich',
        message = 'Sind Sie sicher?',
        details = null,
        type = 'warning', // 'warning', 'danger', 'info', 'success'
        confirmText = 'Bestätigen',
        cancelText = 'Abbrechen',
        icon = null,
        warning = null,
        onConfirm = null,
        onCancel = null
      } = options;

      // Icon basierend auf Type
      let dialogIcon = icon;
      if (!dialogIcon) {
        switch (type) {
          case 'danger':
            dialogIcon = '⚠️';
            break;
          case 'warning':
            dialogIcon = '⚠️';
            break;
          case 'info':
            dialogIcon = 'ℹ️';
            break;
          case 'success':
            dialogIcon = '✓';
            break;
          default:
            dialogIcon = '❓';
        }
      }

      // Overlay erstellen
      const overlay = document.createElement('div');
      overlay.className = 'confirmation-dialog-overlay';
      overlay.id = 'confirmation-dialog-overlay';

      // Dialog erstellen
      const dialog = document.createElement('div');
      dialog.className = 'confirmation-dialog';

      // Details rendern
      let detailsHTML = '';
      if (details && typeof details === 'object') {
        detailsHTML = `
          <div class="confirmation-dialog-details">
            ${Object.entries(details).map(([key, value]) => `
              <div class="confirmation-dialog-details-row">
                <span class="confirmation-dialog-details-label">${key}:</span>
                <span class="confirmation-dialog-details-value">${this.formatValue(value)}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      dialog.innerHTML = `
        <div class="confirmation-dialog-header">
          <span class="confirmation-dialog-icon">${dialogIcon}</span>
          <div class="confirmation-dialog-title">${title}</div>
        </div>
        <div class="confirmation-dialog-body">
          <div class="confirmation-dialog-message">${message}</div>
          ${detailsHTML}
          ${warning ? `<div class="confirmation-dialog-warning">⚠️ ${warning}</div>` : ''}
        </div>
        <div class="confirmation-dialog-footer">
          <button class="confirmation-dialog-btn confirmation-dialog-btn-cancel" data-action="cancel">
            ${cancelText}
          </button>
          <button class="confirmation-dialog-btn confirmation-dialog-btn-${type === 'danger' ? 'danger' : 'confirm'}" data-action="confirm">
            ${confirmText}
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Event-Listener
      const handleAction = (action) => {
        overlay.remove();
        
        if (action === 'confirm') {
          if (onConfirm) onConfirm();
          resolve(true);
        } else {
          if (onCancel) onCancel();
          resolve(false);
        }
      };

      dialog.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          handleAction(btn.dataset.action);
        });
      });

      // ESC zum Schließen
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleAction('cancel');
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Click außerhalb schließt nicht (sicherer)
    });
  }

  formatValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
    return String(value);
  }

  /**
   * Convenience: Delete-Bestätigung
   */
  confirmDelete(item, options = {}) {
    return this.show({
      title: '⚠️ Wirklich löschen?',
      message: `Möchten Sie diesen Eintrag wirklich löschen?`,
      type: 'danger',
      confirmText: 'Ja, endgültig löschen',
      cancelText: 'Abbrechen',
      warning: 'Diese Aktion kann nicht rückgängig gemacht werden!',
      details: {
        'Typ': item.type || 'Eintrag',
        'ID': item.id || item.identifier || '-',
        'Erstellt am': item.created_at ? new Date(item.created_at).toLocaleString('de-DE') : '-',
        'Von': item.added_by || item.user || '-'
      },
      ...options
    });
  }

  /**
   * Convenience: Archive-Bestätigung
   */
  confirmArchive(item, options = {}) {
    return this.show({
      title: '📦 Archivieren?',
      message: `Möchten Sie diesen Eintrag archivieren?`,
      type: 'warning',
      confirmText: 'Ja, archivieren',
      cancelText: 'Abbrechen',
      details: {
        'Typ': item.type || 'Eintrag',
        'ID': item.id || item.identifier || '-',
        'Erstellt am': item.created_at ? new Date(item.created_at).toLocaleString('de-DE') : '-'
      },
      ...options
    });
  }
}

// Globale Instanz
window.confirmationDialog = window.confirmationDialog || new ConfirmationDialog();

// Convenience Functions
window.showConfirmation = (options) => {
  return window.confirmationDialog.show(options);
};

window.confirmDelete = (item, options) => {
  return window.confirmationDialog.confirmDelete(item, options);
};

window.confirmArchive = (item, options) => {
  return window.confirmationDialog.confirmArchive(item, options);
};

console.log('✅ Confirmation Dialog initialisiert');
