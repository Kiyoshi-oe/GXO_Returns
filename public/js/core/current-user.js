// LVS Returns - Current User Management
// ============================================

class CurrentUserManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Spezielle Seiten die ohne Login erreichbar sind
    const publicPages = ['/access-request', '/login'];
    const currentPath = window.location.pathname;
    
    if (publicPages.includes(currentPath)) {
      console.log('✅ Öffentliche Seite - kein Login erforderlich');
      return;
    }
    
    // Lade aktuellen Benutzer automatisch
    await this.loadCurrentUser();
    
    // Update UI
    this.updateUserDisplay();
    
    console.log('✅ Current User Manager initialisiert');
  }

  // Load current user
  async loadCurrentUser() {
    // Versuche Windows-Benutzernamen zu bekommen
    let username = await this.getWindowsUsername();
    
    if (!username) {
      // Fallback: Prüfe LocalStorage
      username = localStorage.getItem('wms_current_user');
    }
    
    if (username) {
      // Lade Benutzerdaten vom Server
      try {
        const response = await fetch(`/api/users/by-username/${encodeURIComponent(username)}`);
        if (response.ok) {
          this.currentUser = await response.json();
          
          // Prüfe ob Benutzer aktiv ist
          if (!this.currentUser.is_active) {
            alert('Your account is deactivated. Please contact an administrator.');
            window.location.href = '/access-request';
            return;
          }
          
          // Speichere in LocalStorage für Fallback
          localStorage.setItem('wms_current_user', username);
          
          // WICHTIG: Prüfe ob eine simulierte Rolle aktiv ist und wende sie an
          const savedSimulatedRole = localStorage.getItem('wms_simulated_role');
          if (savedSimulatedRole && savedSimulatedRole !== 'admin') {
            const savedPermissions = localStorage.getItem('wms_simulated_role_permissions');
            const savedDisplay = localStorage.getItem('wms_simulated_role_display');
            
            if (savedPermissions && savedDisplay) {
              // Überschreibe mit simulierter Rolle
              this.currentUser.role = savedSimulatedRole;
              this.currentUser.role_display_name = savedDisplay;
              this.currentUser.permissions = JSON.parse(savedPermissions);
              console.log('🎭 Applying simulated role:', savedSimulatedRole);
            }
          }
          
          // Update last_login
          fetch(`/api/users/${this.currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              last_login: new Date().toISOString()
            })
          });
          
          return;
        } else {
          // Benutzer existiert nicht - zeige Info und redirect zu Access Request
          alert(`User "${username}" not found in system.\n\nYou will be redirected to request access.`);
          localStorage.removeItem('wms_current_user');
          window.location.href = '/access-request';
          return;
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    
    // Wenn kein Benutzer gefunden, redirect zu Access Request
    alert('Could not detect Windows username.\n\nPlease request access manually.');
    window.location.href = '/access-request';
  }

  // Get Windows username
  async getWindowsUsername() {
    try {
      // Versuche vom Server zu bekommen (Backend kann Windows Username auslesen)
      const response = await fetch('/api/current-user/windows-username');
      if (response.ok) {
        const data = await response.json();
        return data.username;
      }
    } catch (error) {
      console.log('Could not get Windows username from server');
    }
    
    // Alternative: Aus verschiedenen Browser-Quellen versuchen
    // Diese funktionieren nur in bestimmten Umgebungen
    
    // Versuche aus environment variable (wenn verfügbar)
    if (typeof process !== 'undefined' && process.env && process.env.USERNAME) {
      return process.env.USERNAME.toLowerCase();
    }
    
    // Versuche aus verschiedenen Browser-APIs
    if (navigator.userAgentData) {
      // Moderne Browser API (falls verfügbar)
      try {
        const data = await navigator.userAgentData.getHighEntropyValues(['username']);
        if (data.username) return data.username.toLowerCase();
      } catch (e) {}
    }
    
    return null;
  }

  // Update user display in UI
  updateUserDisplay() {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
      userNameElement.textContent = this.currentUser.full_name || this.currentUser.username;
    }
    
    if (userAvatarElement) {
      // Zeige ersten Buchstaben des Namens
      const initial = (this.currentUser.full_name || this.currentUser.username).charAt(0).toUpperCase();
      userAvatarElement.textContent = initial;
    }
    
    // Update role badge if exists
    const roleBadge = document.getElementById('userRole');
    if (roleBadge && this.currentUser.role_display_name) {
      roleBadge.textContent = this.currentUser.role_display_name;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check permission
  hasPermission(module, action) {
    if (!this.currentUser || !this.currentUser.permissions) {
      return false;
    }
    
    try {
      const permissions = typeof this.currentUser.permissions === 'string' 
        ? JSON.parse(this.currentUser.permissions) 
        : this.currentUser.permissions;
      
      return permissions[module]?.[action] === true;
    } catch (error) {
      console.error('Fehler beim Prüfen der Berechtigung:', error);
      return false;
    }
  }

  // Is admin
  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  // Is manager
  isManager() {
    return this.currentUser?.role === 'manager' || this.isAdmin();
  }

  // Switch user
  async switchUser() {
    localStorage.removeItem('wms_current_user');
    await this.promptForUsername();
    this.updateUserDisplay();
    
    // Reload page to apply new permissions
    window.location.reload();
  }

  // Logout
  logout() {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      localStorage.removeItem('wms_current_user');
      window.location.reload();
    }
  }
}

// Initialize Current User Manager
const currentUserManager = new CurrentUserManager();

// Export for global access
window.currentUserManager = currentUserManager;
window.getCurrentUser = () => currentUserManager.getCurrentUser();
window.hasPermission = (module, action) => currentUserManager.hasPermission(module, action);
window.isAdmin = () => currentUserManager.isAdmin();
window.isManager = () => currentUserManager.isManager();
