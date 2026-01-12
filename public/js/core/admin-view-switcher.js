// LVS Returns - Admin View Switcher
// Ermöglicht Admins, die Ansicht anderer Rollen zu simulieren
// ============================================

class AdminViewSwitcher {
  constructor() {
    this.originalUser = null;
    this.simulatedRole = null;
    this.init();
  }

  async init() {
    // Warte bis Current User Manager geladen ist
    await this.waitForCurrentUser();
    
    // Prüfe ob der echte Benutzer (nicht simuliert) Admin ist
    const realUsername = localStorage.getItem('wms_current_user');
    
    let isRealAdmin = false;
    try {
      const response = await fetch(`/api/users/by-username/${encodeURIComponent(realUsername)}`);
      if (response.ok) {
        const user = await response.json();
        isRealAdmin = user.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking real admin status:', error);
    }
    
    if (!isRealAdmin) {
      console.log('⏭️ Admin View Switcher: Nicht Admin, überspringe');
      return;
    }

    // Stelle simulierte Rolle wieder her (nach Reload)
    const savedSimulatedRole = localStorage.getItem('wms_simulated_role');
    if (savedSimulatedRole) {
      this.simulatedRole = savedSimulatedRole;
      const savedDisplay = localStorage.getItem('wms_simulated_role_display');
      
      if (savedSimulatedRole !== 'admin' && savedDisplay) {
        this.showSimulatedBadge(savedDisplay);
      }
    }

    // Erstelle View Switcher UI nicht mehr (ist jetzt in Einstellungen)
    // this.createSwitcherUI();
    
    // Entferne FAB Button falls er noch existiert (von vorheriger Version)
    const existingSwitcher = document.getElementById('adminViewSwitcher');
    if (existingSwitcher) {
      existingSwitcher.remove();
    }
    
    // Update Role Display nach dem Reload (wenn simulierte Rolle aktiv ist)
    if (savedSimulatedRole) {
      const savedDisplay = localStorage.getItem('wms_simulated_role_display');
      if (savedDisplay) {
        // Warte kurz, damit UI erstellt ist
        setTimeout(() => {
          this.updateRoleDisplay(savedSimulatedRole, savedDisplay);
        }, 100);
      }
    }
    
    // Passe UI basierend auf Berechtigungen an
    this.applyRoleBasedUI();
    
    console.log('✅ Admin View Switcher initialisiert');
  }

  // Warte bis Current User geladen ist
  async waitForCurrentUser() {
    let attempts = 0;
    while (attempts < 50) { // Max 5 Sekunden
      if (window.currentUserManager && 
          window.currentUserManager.currentUser && 
          typeof window.getCurrentUser === 'function') {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    console.warn('⚠️ Admin View Switcher: Current User nicht geladen');
    return false;
  }

  isUserAdmin() {
    try {
      if (window.currentUserManager && 
          window.currentUserManager.currentUser) {
        const user = window.currentUserManager.currentUser;
        console.log('🔍 Checking admin status:', user.username, 'Role:', user.role);
        return user && user.role === 'admin';
      }
      
      if (typeof window.getCurrentUser === 'function') {
        const user = window.getCurrentUser();
        console.log('🔍 Checking admin status (via function):', user?.username, 'Role:', user?.role);
        return user && user.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    
    return false;
  }

  createSwitcherUI() {
    // FAB Button wurde entfernt - Admin View Switcher ist jetzt in Einstellungen verfügbar
    // Diese Funktion wird nicht mehr aufgerufen, aber für Kompatibilität behalten
    return;
    
    // Prüfe ob UI bereits existiert
    if (document.getElementById('adminViewSwitcher')) {
      return;
    }

    const switcher = document.createElement('div');
    switcher.id = 'adminViewSwitcher';
    switcher.innerHTML = `
      <style>
        #adminViewSwitcher {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
        }
        
        .view-switcher-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s ease;
        }
        
        .view-switcher-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(239, 68, 68, 0.5);
        }
        
        .view-switcher-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          background: var(--bg-card);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          padding: 20px;
          min-width: 320px;
          display: none;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .view-switcher-panel.active {
          display: block;
        }
        
        .view-switcher-header {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--border-soft);
        }
        
        .view-switcher-current {
          padding: 12px;
          background: var(--bg-soft);
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-main);
        }
        
        .view-switcher-current strong {
          color: var(--gxo-orange);
        }
        
        .role-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .role-option {
          padding: 12px 16px;
          background: var(--bg-soft);
          border: 2px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }
        
        .role-option:hover {
          border-color: var(--gxo-orange);
          background: var(--bg-card);
          transform: translateX(4px);
        }
        
        .role-option.active {
          border-color: var(--gxo-green);
          background: rgba(16, 185, 129, 0.1);
        }
        
        .role-option-icon {
          font-size: 20px;
        }
        
        .role-option-text {
          flex: 1;
        }
        
        .role-option-name {
          font-weight: 600;
          color: var(--text-main);
          display: block;
        }
        
        .role-option-desc {
          font-size: 12px;
          color: var(--text-muted);
          display: block;
        }
        
        .view-switcher-reset {
          margin-top: 12px;
          width: 100%;
          padding: 10px;
          background: var(--bg-soft);
          border: 2px solid var(--border-soft);
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          transition: all 0.2s ease;
        }
        
        .view-switcher-reset:hover {
          background: var(--gxo-green);
          border-color: var(--gxo-green);
          color: white;
        }
        
        .simulated-badge {
          position: fixed;
          top: 80px;
          right: 24px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          z-index: 9998;
          animation: pulse 2s ease infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
      
      <button class="view-switcher-btn" onclick="adminViewSwitcher.togglePanel()">
        👁️
      </button>
      
      <div class="view-switcher-panel" id="viewSwitcherPanel">
        <div class="view-switcher-header">
          👑 Admin View Switcher
        </div>
        
        <div class="view-switcher-current">
          <strong>Current View:</strong> <span id="currentViewRole">Administrator</span>
        </div>
        
        <div class="role-options">
          <div class="role-option active" onclick="adminViewSwitcher.switchToRole('admin')">
            <span class="role-option-icon">👑</span>
            <div class="role-option-text">
              <span class="role-option-name">Administrator</span>
              <span class="role-option-desc">Full access (Your role)</span>
            </div>
          </div>
          
          <div class="role-option" onclick="adminViewSwitcher.switchToRole('manager')">
            <span class="role-option-icon">📊</span>
            <div class="role-option-text">
              <span class="role-option-name">Manager</span>
              <span class="role-option-desc">Extended rights + approvals</span>
            </div>
          </div>
          
          <div class="role-option" onclick="adminViewSwitcher.switchToRole('teamlead')">
            <span class="role-option-icon">👔</span>
            <div class="role-option-text">
              <span class="role-option-name">Team Lead</span>
              <span class="role-option-desc">Team management</span>
            </div>
          </div>
          
          <div class="role-option" onclick="adminViewSwitcher.switchToRole('process_assistant')">
            <span class="role-option-icon">🛠️</span>
            <div class="role-option-text">
              <span class="role-option-name">Process Assistant</span>
              <span class="role-option-desc">Process support</span>
            </div>
          </div>
          
          <div class="role-option" onclick="adminViewSwitcher.switchToRole('trainer')">
            <span class="role-option-icon">🎓</span>
            <div class="role-option-text">
              <span class="role-option-name">Trainer</span>
              <span class="role-option-desc">Training & read access</span>
            </div>
          </div>
          
          <div class="role-option" onclick="adminViewSwitcher.switchToRole('operator')">
            <span class="role-option-icon">👤</span>
            <div class="role-option-text">
              <span class="role-option-name">Operator</span>
              <span class="role-option-desc">Basic operations</span>
            </div>
          </div>
        </div>
        
        <button class="view-switcher-reset" onclick="adminViewSwitcher.resetView()">
          🔄 Reset to Admin View
        </button>
      </div>
    `;
    
    document.body.appendChild(switcher);
  }

  togglePanel() {
    const panel = document.getElementById('viewSwitcherPanel');
    if (panel) {
      panel.classList.toggle('active');
    }
  }

  async switchToRole(roleName) {
    if (!this.originalUser && window.getCurrentUser) {
      this.originalUser = window.getCurrentUser();
    }

    // Lade Berechtigungen für die Rolle
    try {
      const response = await fetch('/api/users/roles/list');
      const roles = await response.json();
      const targetRole = roles.find(r => r.name === roleName);

      if (!targetRole) {
        console.error('Role not found:', roleName);
        return;
      }

      // Simuliere die Rolle
      this.simulatedRole = roleName;
      
      // Speichere simulierte Rolle in LocalStorage
      localStorage.setItem('wms_simulated_role', roleName);
      localStorage.setItem('wms_simulated_role_permissions', JSON.stringify(targetRole.permissions));
      localStorage.setItem('wms_simulated_role_display', targetRole.display_name);
      
      // Update current user mit simulierten Berechtigungen
      if (window.currentUserManager && window.currentUserManager.currentUser) {
        window.currentUserManager.currentUser.role = roleName;
        window.currentUserManager.currentUser.role_display_name = targetRole.display_name;
        window.currentUserManager.currentUser.permissions = targetRole.permissions;
      }

      // Update UI
      this.updateRoleDisplay(roleName, targetRole.display_name);
      
      // Zeige Badge
      this.showSimulatedBadge(targetRole.display_name);
      
      // Schließe Panel
      this.togglePanel();
      
      // Passe UI sofort an (vor Reload)
      this.applyRoleBasedUI();
      
      // Reload page um UI zu aktualisieren
      window.location.reload();
      
    } catch (error) {
      console.error('Error switching role:', error);
    }
  }

  updateRoleDisplay(roleName, displayName) {
    const currentViewRole = document.getElementById('currentViewRole');
    if (currentViewRole) {
      currentViewRole.textContent = displayName;
    }

    // Update active state
    document.querySelectorAll('.role-option').forEach(option => {
      option.classList.remove('active');
    });

    const activeOption = document.querySelector(`.role-option[onclick*="${roleName}"]`);
    if (activeOption) {
      activeOption.classList.add('active');
    }
  }

  // Passe UI basierend auf Berechtigungen der simulierten Rolle an
  applyRoleBasedUI() {
    if (!this.simulatedRole || this.simulatedRole === 'admin') {
      return; // Keine Anpassung für Admin oder wenn keine Simulation aktiv ist
    }

    const user = window.getCurrentUser();
    if (!user || !user.permissions) {
      return;
    }

    try {
      const permissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions;

      // Navigation basierend auf Berechtigungen anpassen
      this.applyNavigationPermissions(permissions);
      
      // Buttons und Aktionen basierend auf Berechtigungen anpassen
      this.applyActionPermissions(permissions);
      
      console.log('🎭 UI angepasst für simulierte Rolle:', this.simulatedRole);
    } catch (error) {
      console.error('Fehler beim Anpassen der UI:', error);
    }
  }

  // Passe Navigation basierend auf Berechtigungen an
  applyNavigationPermissions(permissions) {
    // Mapping: data-view/href -> Modul-Name
    const viewToModule = {
      'dashboard': 'dashboard',
      'inbound': 'inbound',
      'inventory': 'inventory',
      'move': 'movement',
      'archive': 'archive',
      'suche': 'search',
      'warehouse-map': 'warehouse_map',
      'barcode': 'barcode',
      'ra': 'ra_import',
      'ra-import': 'ra_import',
      'performance': 'performance',
      'settings': 'settings',
      'einstellungen': 'settings',
      'import': 'import',
      'export': 'export'
    };

    // Alle Navigation-Items durchgehen
    document.querySelectorAll('.nav-item').forEach(navItem => {
      let module = null;
      
      // Prüfe data-view Attribut
      const dataView = navItem.getAttribute('data-view');
      if (dataView && viewToModule[dataView]) {
        module = viewToModule[dataView];
      }
      
      // Prüfe href Attribut
      if (!module) {
        const href = navItem.getAttribute('href');
        if (href) {
          const route = href.replace('/', '').replace('#', '');
          if (viewToModule[route]) {
            module = viewToModule[route];
          }
        }
      }
      
      // Prüfe data-module Attribut
      if (!module) {
        const dataModule = navItem.getAttribute('data-module');
        if (dataModule) {
          module = dataModule;
        }
      }
      
      // Wenn Modul gefunden, prüfe Berechtigung
      if (module) {
        const hasRead = permissions[module]?.read === true;
        if (!hasRead) {
          navItem.style.display = 'none';
          navItem.style.visibility = 'hidden';
        } else {
          navItem.style.display = '';
          navItem.style.visibility = '';
        }
      }
    });
  }

  // Passe Buttons und Aktionen basierend auf Berechtigungen an
  applyActionPermissions(permissions) {
    // Buttons mit data-permission Attribut
    document.querySelectorAll('[data-permission]').forEach(button => {
      const permissionAttr = button.getAttribute('data-permission');
      const [module, action] = permissionAttr.split('.');
      
      const hasPermission = permissions[module]?.[action] === true;
      if (!hasPermission) {
        button.style.display = 'none';
      } else {
        button.style.display = '';
      }
    });

    // Speichern-Buttons basierend auf write-Berechtigung
    document.querySelectorAll('[data-module]').forEach(element => {
      const module = element.getAttribute('data-module');
      const action = element.getAttribute('data-action') || 'write';
      
      const hasPermission = permissions[module]?.[action] === true;
      if (!hasPermission && action === 'write') {
        element.style.display = 'none';
      } else if (hasPermission) {
        element.style.display = '';
      }
    });
  }

  showSimulatedBadge(roleName) {
    // Entferne altes Badge
    const oldBadge = document.getElementById('simulatedRoleBadge');
    if (oldBadge) {
      oldBadge.remove();
    }

    // Erstelle neues Badge (außer für Admin)
    if (this.simulatedRole && this.simulatedRole !== 'admin') {
      const badge = document.createElement('div');
      badge.id = 'simulatedRoleBadge';
      badge.className = 'simulated-badge';
      badge.innerHTML = `⚠️ Simulating: ${roleName}`;
      document.body.appendChild(badge);
    }
  }

  resetView() {
    this.simulatedRole = null;
    
    // Entferne gespeicherte Simulation aus LocalStorage
    localStorage.removeItem('wms_simulated_role');
    localStorage.removeItem('wms_simulated_role_permissions');
    localStorage.removeItem('wms_simulated_role_display');
    
    // Restore original user
    if (this.originalUser && window.currentUserManager) {
      window.currentUserManager.currentUser = this.originalUser;
    }

    // Remove badge
    const badge = document.getElementById('simulatedRoleBadge');
    if (badge) {
      badge.remove();
    }

    // Reload page
    window.location.reload();
  }
}

// Initialize Admin View Switcher
let adminViewSwitcher;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    adminViewSwitcher = new AdminViewSwitcher();
  });
} else {
  adminViewSwitcher = new AdminViewSwitcher();
}

// Export for global access
window.adminViewSwitcher = adminViewSwitcher;
