// LVS Returns - User Management (für Einstellungen)
// ============================================

async function initUserManagement() {
  // Prüfe ob wir auf der Einstellungen-Seite sind
  if (!document.getElementById('usersTableContainer')) {
    return;
  }
  
  // Lade Zugriffs-Anfragen
  await loadAccessRequests();
  
  // Lade Benutzer
  await loadUsers();
  
  // Lade Rollen
  await loadRoles();
  
  // Setup Event Listeners
  setupUserManagementEvents();
  
  console.log('✅ User Management initialisiert');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUserManagement);
} else {
  initUserManagement();
}

let allUsers = [];
let allRoles = [];
let allAccessRequests = [];

// Load users
async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Benutzer');
    }
    allUsers = await response.json();
    // Filtere nur aktive Benutzer NICHT - zeige alle registrierten Benutzer
    renderUsersTable();
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error);
    const container = document.getElementById('usersTableContainer');
    if (container) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--error);">❌ Fehler beim Laden der Benutzer: ' + error.message + '</div>';
    }
  }
}

// Load roles
async function loadRoles() {
  try {
    const response = await fetch('/api/users/roles/list');
    allRoles = await response.json();
  } catch (error) {
    console.error('Fehler beim Laden der Rollen:', error);
  }
}

// Render users table
function renderUsersTable() {
  const container = document.getElementById('usersTableContainer');
  if (!container) return;
  
  if (allUsers.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-soft);">Keine Benutzer gefunden</div>';
    return;
  }
  
  // Grid-Layout mit Cards statt Tabelle
  const grid = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
      ${allUsers.map(user => `
        <div class="card" style="background: var(--bg-soft); border: 2px solid var(--border-soft); transition: all 0.2s ease; cursor: pointer;" 
             onmouseover="this.style.borderColor='var(--gxo-orange)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
             onmouseout="this.style.borderColor='var(--border-soft)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="padding: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--gxo-orange) 0%, #FF6B3D 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                  ${(user.full_name || user.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 16px; color: var(--text-main); margin-bottom: 4px;">${user.username}</div>
                  <div style="font-size: 13px; color: var(--text-muted);">${user.full_name || '-'}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                ${user.is_active 
                  ? '<span style="width: 10px; height: 10px; border-radius: 50%; background: var(--gxo-green);"></span>' 
                  : '<span style="width: 10px; height: 10px; border-radius: 50%; background: var(--text-muted);"></span>'}
              </div>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 16px; font-size: 13px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--text-muted);">📧</span>
                <span style="color: var(--text-main);">${user.email || 'Keine E-Mail'}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--text-muted);">👤</span>
                <span class="badge ${getRoleBadgeClass(user.role)}" style="font-size: 12px; padding: 4px 10px;">${user.role_display_name || user.role}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--text-muted);">🕐</span>
                <span style="color: var(--text-main);">${user.last_login ? formatDate(user.last_login) : 'Nie eingeloggt'}</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-soft); padding-top: 16px;">
              <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})" style="flex: 1;">
                <span>✏️</span> Bearbeiten
              </button>
              <button class="btn btn-sm btn-ghost" onclick="deleteUser(${user.id})" ${user.role === 'admin' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="flex: 1;">
                <span>🗑️</span> Löschen
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.innerHTML = grid;
}

// Get role badge class
function getRoleBadgeClass(role) {
  switch (role) {
    case 'admin': return 'badge-danger';
    case 'manager': return 'badge-warning';
    case 'operator': return 'badge-info';
    default: return 'badge-secondary';
  }
}

// Edit user
async function editUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  // Hole vollständige Benutzerdaten mit Permissions
  const response = await fetch(`/api/users/${userId}`);
  const fullUser = await response.json();
  
  showUserEditModal(fullUser);
}

// Show user edit modal
function showUserEditModal(user) {
  const modal = document.createElement('div');
  modal.className = 'custom-modal active';
  modal.innerHTML = `
    <div class="custom-modal-content" style="max-width: 700px;">
      <div class="custom-modal-header">
        <span class="custom-modal-icon">👤</span>
        <span class="custom-modal-title">Benutzer bearbeiten: ${user.username}</span>
        <span class="custom-modal-close" onclick="this.closest('.custom-modal').remove()">&times;</span>
      </div>
      <div class="custom-modal-body">
        <form id="editUserForm">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Benutzername</label>
              <input type="text" class="form-input" value="${user.username}" readonly>
            </div>
            
            <div class="form-group">
              <label class="form-label">Vollständiger Name</label>
              <input type="text" id="editFullName" class="form-input" value="${user.full_name || ''}">
            </div>
            
            <div class="form-group">
              <label class="form-label">E-Mail</label>
              <input type="email" id="editEmail" class="form-input" value="${user.email || ''}">
            </div>
            
            <div class="form-group">
              <label class="form-label">Rolle</label>
              <select id="editRole" class="form-select">
                ${allRoles.map(role => `
                  <option value="${role.name}" ${user.role === role.name ? 'selected' : ''}>
                    ${role.display_name}
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="editIsActive" ${user.is_active ? 'checked' : ''}>
                Aktiv
              </label>
            </div>
          </div>
          
          <div style="margin-top: 24px;">
            <h3 style="font-size: 16px; margin-bottom: 12px;">Berechtigungen (basierend auf Rolle)</h3>
            <div id="permissionsDisplay" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
              <!-- Permissions werden hier angezeigt -->
            </div>
          </div>
          
          <div class="card-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">Speichern</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.custom-modal').remove()">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Show permissions for selected role
  function updatePermissionsDisplay() {
    const selectedRole = document.getElementById('editRole').value;
    const role = allRoles.find(r => r.name === selectedRole);
    
    if (role && role.permissions) {
      const permissionsHtml = Object.entries(role.permissions).map(([module, perms]) => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
          <strong>${module}</strong>
          <div style="display: flex; gap: 12px;">
            <span>${perms.read ? '✅ Lesen' : '❌ Lesen'}</span>
            <span>${perms.write ? '✅ Schreiben' : '❌ Schreiben'}</span>
            <span>${perms.delete ? '✅ Löschen' : '❌ Löschen'}</span>
          </div>
        </div>
      `).join('');
      
      document.getElementById('permissionsDisplay').innerHTML = permissionsHtml;
    }
  }
  
  document.getElementById('editRole').addEventListener('change', updatePermissionsDisplay);
  updatePermissionsDisplay();
  
  // Form submit
  document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      full_name: document.getElementById('editFullName').value,
      email: document.getElementById('editEmail').value,
      role: document.getElementById('editRole').value,
      is_active: document.getElementById('editIsActive').checked
    };
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        showNotification('Benutzer erfolgreich aktualisiert', 'success');
        modal.remove();
        loadUsers();
      } else {
        const error = await response.json();
        showNotification('Fehler: ' + error.error, 'error');
      }
    } catch (error) {
      showNotification('Fehler beim Speichern', 'error');
    }
  });
}

// Delete user
async function deleteUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) {
    alert('Benutzer nicht gefunden');
    return;
  }
  
  if (user.role === 'admin') {
    if (!confirm(`⚠️ Warnung: Sie möchten einen Administrator löschen.\n\nMöchten Sie den Benutzer "${user.username}" wirklich löschen?`)) {
      return;
    }
  } else {
    if (!confirm(`Möchten Sie den Benutzer "${user.username}" wirklich löschen?`)) {
      return;
    }
  }
  
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.ok) {
        showNotification('Benutzer erfolgreich gelöscht', 'success');
        loadUsers();
      } else {
        showNotification('Fehler: ' + (result.error || 'Unbekannter Fehler'), 'error');
      }
    } else {
      const error = await response.json();
      showNotification('Fehler: ' + (error.error || 'Fehler beim Löschen'), 'error');
    }
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    showNotification('Fehler beim Löschen: ' + error.message, 'error');
  }
}

// Add new user (global function)
function openAddUserModal() {
  showAddUserModal();
}

function showAddUserModal() {
  const modal = document.createElement('div');
  modal.className = 'custom-modal active';
  modal.innerHTML = `
    <div class="custom-modal-content" style="max-width: 600px;">
      <div class="custom-modal-header">
        <span class="custom-modal-icon">➕</span>
        <span class="custom-modal-title">Neuen Benutzer hinzufügen</span>
        <span class="custom-modal-close" onclick="this.closest('.custom-modal').remove()">&times;</span>
      </div>
      <div class="custom-modal-body">
        <form id="addUserForm">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Benutzername *</label>
              <input type="text" id="addUsername" class="form-input" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Vollständiger Name</label>
              <input type="text" id="addFullName" class="form-input">
            </div>
            
            <div class="form-group">
              <label class="form-label">E-Mail</label>
              <input type="email" id="addEmail" class="form-input">
            </div>
            
            <div class="form-group">
              <label class="form-label">Rolle</label>
              <select id="addRole" class="form-select">
                ${allRoles.map(role => `
                  <option value="${role.name}" ${role.name === 'operator' ? 'selected' : ''}>
                    ${role.display_name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div class="card-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">Hinzufügen</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.custom-modal').remove()">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      username: document.getElementById('addUsername').value,
      full_name: document.getElementById('addFullName').value,
      email: document.getElementById('addEmail').value,
      role: document.getElementById('addRole').value
    };
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        showNotification('Benutzer erfolgreich hinzugefügt', 'success');
        modal.remove();
        loadUsers();
      } else {
        const error = await response.json();
        showNotification('Fehler: ' + error.error, 'error');
      }
    } catch (error) {
      showNotification('Fehler beim Hinzufügen', 'error');
    }
  });
}

// Setup events
function setupUserManagementEvents() {
  const addButton = document.getElementById('addUserBtn');
  if (addButton) {
    addButton.addEventListener('click', showAddUserModal);
  }
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// Access Requests Management
// ============================================

// Load access requests
async function loadAccessRequests() {
  try {
    const response = await fetch('/api/access-requests');
    allAccessRequests = await response.json();
    renderAccessRequests();
  } catch (error) {
    console.error('Fehler beim Laden der Zugriffs-Anfragen:', error);
  }
}

// Render access requests
function renderAccessRequests() {
  const container = document.getElementById('accessRequestsContainer');
  if (!container) return;
  
  const pending = allAccessRequests.filter(r => r.status === 'pending');
  const processed = allAccessRequests.filter(r => r.status !== 'pending');
  
  if (allAccessRequests.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-soft);">Keine Zugriffs-Anfragen vorhanden</div>';
    return;
  }
  
  let html = '';
  
  // Pending requests
  if (pending.length > 0) {
    html += '<h3 style="margin-bottom: 16px; color: var(--text-main);">⏳ Ausstehende Anfragen (' + pending.length + ')</h3>';
    html += '<div style="display: grid; gap: 16px; margin-bottom: 32px;">';
    
    pending.forEach(request => {
      html += `
        <div style="padding: 20px; background: var(--bg-soft); border: 2px solid var(--gxo-orange); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
            <div>
              <h4 style="margin: 0 0 4px 0; font-size: 16px; color: var(--text-main);">
                ${request.full_name || request.username}
              </h4>
              <p style="margin: 0; font-size: 13px; color: var(--text-muted);">
                @${request.username} ${request.email ? '• ' + request.email : ''}
              </p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
              <span class="badge" style="background: var(--gxo-orange); color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px;">
                ${getRoleDisplayName(request.requested_role)}
              </span>
              <button class="btn btn-sm btn-ghost" onclick="changeRequestedRole(${request.id}, '${request.requested_role}')" style="font-size: 11px; padding: 4px 8px;">
                ✏️ Rolle ändern
              </button>
            </div>
          </div>
          
          ${request.reason ? `
            <div style="padding: 12px; background: var(--bg-card); border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 13px; color: var(--text-main);">
                <strong>Begründung:</strong><br>
                ${request.reason}
              </p>
            </div>
          ` : ''}
          
          <div style="display: flex; gap: 8px; font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
            <span>📅 ${formatDate(request.created_at)}</span>
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="approveAccessRequest(${request.id}, '${request.requested_role}')" style="flex: 1;">
              ✓ Genehmigen
            </button>
            <button class="btn btn-danger" onclick="rejectAccessRequest(${request.id})" style="flex: 1;">
              ✗ Ablehnen
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  // Processed requests (collapsed)
  if (processed.length > 0) {
    html += `
      <details style="margin-top: 24px;">
        <summary style="cursor: pointer; padding: 12px; background: var(--bg-soft); border-radius: 8px; font-weight: 600;">
          📋 Bearbeitete Anfragen (${processed.length})
        </summary>
        <div style="display: grid; gap: 12px; margin-top: 16px;">
    `;
    
    processed.forEach(request => {
      const isApproved = request.status === 'approved';
      html += `
        <div style="padding: 16px; background: var(--bg-soft); border-left: 4px solid ${isApproved ? 'var(--gxo-green)' : '#ef4444'}; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--text-main);">${request.full_name || request.username}</strong>
              <span style="margin: 0 8px; color: var(--text-muted);">•</span>
              <span style="color: ${isApproved ? 'var(--gxo-green)' : '#ef4444'}; font-weight: 600;">
                ${isApproved ? '✓ Genehmigt' : '✗ Abgelehnt'}
              </span>
              <span style="margin: 0 8px; color: var(--text-muted);">•</span>
              <span style="font-size: 12px; color: var(--text-muted);">
                ${formatDate(request.reviewed_at)} von ${request.reviewed_by_name || 'System'}
              </span>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="deleteAccessRequest(${request.id})">Löschen</button>
          </div>
          ${request.review_notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: var(--text-muted);">Notiz: ${request.review_notes}</p>` : ''}
        </div>
      `;
    });
    
    html += '</div></details>';
  }
  
  container.innerHTML = html;
}

// Change requested role for access request
async function changeRequestedRole(requestId, currentRole) {
  const request = allAccessRequests.find(r => r.id === requestId);
  if (!request) return;
  
  // Zeige Dropdown zur Rollenauswahl
  const roleOptions = allRoles.map(r => 
    `<option value="${r.name}" ${r.name === currentRole ? 'selected' : ''}>${r.display_name}</option>`
  ).join('');
  
  const modal = document.createElement('div');
  modal.className = 'custom-modal active';
  modal.innerHTML = `
    <div class="custom-modal-content" style="max-width: 400px;">
      <div class="custom-modal-header">
        <span class="custom-modal-icon">🎯</span>
        <span class="custom-modal-title">Rolle ändern</span>
        <span class="custom-modal-close" onclick="this.closest('.custom-modal').remove()">&times;</span>
      </div>
      <div class="custom-modal-body">
        <p style="margin-bottom: 16px; color: var(--text-main);">
          Wählen Sie die neue Rolle für <strong>${request.full_name || request.username}</strong>:
        </p>
        <form id="changeRoleForm">
          <div class="form-group">
            <label class="form-label">Neue Rolle</label>
            <select id="newRole" class="form-select" required>
              ${roleOptions}
            </select>
          </div>
          <div class="card-actions" style="margin-top: 20px;">
            <button type="submit" class="btn btn-primary">Speichern</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.custom-modal').remove()">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle form submission
  document.getElementById('changeRoleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newRole = document.getElementById('newRole').value;
    
    try {
      // Update die Anfrage in der Datenbank
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_role: newRole
        })
      });
      
      if (response.ok) {
        showNotification('Rolle erfolgreich geändert', 'success');
        modal.remove();
        await loadAccessRequests();
      } else {
        const error = await response.json();
        showNotification('Fehler: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('Error changing role:', error);
      showNotification('Fehler beim Ändern der Rolle', 'error');
    }
  });
}

// Approve access request
async function approveAccessRequest(requestId, defaultRole) {
  const request = allAccessRequests.find(r => r.id === requestId);
  if (!request) return;
  
  // Optional: Ask for role confirmation
  const selectedRole = prompt(
    `Approve user: ${request.full_name || request.username}\n\nAssign role:`,
    defaultRole
  );
  
  if (!selectedRole) return;
  
  const notes = prompt('Optional note for approval:') || '';
  
  try {
    // Get current user (with fallback)
    let currentUserId = 1; // Default to admin
    if (window.currentUserManager && typeof window.getCurrentUser === 'function') {
      const currentUser = window.getCurrentUser();
      if (currentUser && currentUser.id) {
        currentUserId = currentUser.id;
      }
    }
    
    const response = await fetch(`/api/access-requests/${requestId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewed_by: currentUserId,
        review_notes: notes,
        assigned_role: selectedRole
      })
    });
    
    if (response.ok) {
      showNotification('Request approved - User created', 'success');
      await loadAccessRequests();
      await loadUsers();
    } else {
      const error = await response.json();
      showNotification('Error: ' + error.error, 'error');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    showNotification('Error approving request', 'error');
  }
}

// Reject access request
async function rejectAccessRequest(requestId) {
  const notes = prompt('Reason for rejection (optional):') || '';
  
  if (!confirm('Do you really want to reject this request?')) return;
  
  try {
    // Get current user (with fallback)
    let currentUserId = 1; // Default to admin
    if (window.currentUserManager && typeof window.getCurrentUser === 'function') {
      const currentUser = window.getCurrentUser();
      if (currentUser && currentUser.id) {
        currentUserId = currentUser.id;
      }
    }
    
    const response = await fetch(`/api/access-requests/${requestId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewed_by: currentUserId,
        review_notes: notes
      })
    });
    
    if (response.ok) {
      showNotification('Request rejected', 'success');
      await loadAccessRequests();
    } else {
      const error = await response.json();
      showNotification('Error: ' + error.error, 'error');
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
    showNotification('Error rejecting request', 'error');
  }
}

// Delete access request
async function deleteAccessRequest(requestId) {
  if (!confirm('Möchten Sie diese Anfrage wirklich löschen?')) return;
  
  try {
    const response = await fetch(`/api/access-requests/${requestId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('Anfrage gelöscht', 'success');
      await loadAccessRequests();
    } else {
      const error = await response.json();
      showNotification('Fehler: ' + error.error, 'error');
    }
  } catch (error) {
    showNotification('Fehler beim Löschen', 'error');
  }
}

// Helper: Get role display name
function getRoleDisplayName(roleName) {
  const role = allRoles.find(r => r.name === roleName);
  return role ? role.display_name : roleName;
}

// Load and render role permissions
async function loadRolePermissions() {
  try {
    const response = await fetch('/api/users/roles/list');
    const roles = await response.json();
    
    const container = document.getElementById('rolesPermissionsContainer');
    if (!container) return;
    
    const roleIcons = {
      admin: { icon: '👑', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
      manager: { icon: '📊', gradient: 'linear-gradient(135deg, var(--gxo-orange) 0%, #f97316 100%)' },
      teamlead: { icon: '👔', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
      process_assistant: { icon: '🛠️', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
      trainer: { icon: '🎓', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
      operator: { icon: '👤', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }
    };
    
    container.innerHTML = `
      <div class="roles-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
        ${roles.map(role => {
          const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
          const iconData = roleIcons[role.name] || { icon: '🔐', gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' };
          
          // Zähle die Berechtigungen
          const permissionCount = Object.keys(permissions).filter(key => 
            permissions[key] && typeof permissions[key] === 'object' && 
            (permissions[key].read || permissions[key].write || permissions[key].delete || permissions[key].export)
          ).length;
          
          return `
            <div class="role-card" style="padding: 16px; background: var(--bg-soft); border: 2px solid var(--border-soft); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;" onclick="openRolePermissionsModal('${role.name}', '${role.display_name}', ${role.id})">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 42px; height: 42px; border-radius: 10px; background: ${iconData.gradient}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                    ${iconData.icon}
                  </div>
                  <div>
                    <h3 style="margin: 0; font-size: 15px; color: var(--text-main); font-weight: 600;">${role.display_name}</h3>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: var(--text-muted);">${role.description || 'Keine Beschreibung'}</p>
                  </div>
                </div>
                <button class="btn btn-ghost" style="padding: 6px 10px; font-size: 12px;" onclick="event.stopPropagation(); openRolePermissionsModal('${role.name}', '${role.display_name}', ${role.id})">
                  <span>✏️</span>
                </button>
              </div>
              
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-soft);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">BERECHTIGUNGEN</span>
                  <span style="font-size: 11px; color: var(--gxo-orange); font-weight: 600;">${permissionCount} Module</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${Object.keys(permissions).slice(0, 6).map(key => `
                    <span style="font-size: 10px; padding: 3px 8px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 4px; color: var(--text-main);">
                      ${key}
                    </span>
                  `).join('')}
                  ${Object.keys(permissions).length > 6 ? `
                    <span style="font-size: 10px; padding: 3px 8px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 4px; color: var(--text-muted);">
                      +${Object.keys(permissions).length - 6}
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Fehler beim Laden der Rollen:', error);
  }
}

// Open role permissions modal
async function openRolePermissionsModal(roleName, displayName, roleId) {
  try {
    const response = await fetch(`/api/users/roles/${roleId}`);
    const role = await response.json();
    const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    
    const modules = [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'inbound', label: 'Wareneingang', icon: '📥' },
      { key: 'inventory', label: 'Lagerbestand', icon: '📦' },
      { key: 'movement', label: 'Umlagerung', icon: '↔️' },
      { key: 'archive', label: 'Archiv', icon: '🗂️' },
      { key: 'search', label: 'Globale Suche', icon: '🔍' },
      { key: 'warehouse_map', label: 'Lager-Visualisierung', icon: '🗺️' },
      { key: 'barcode', label: 'Barcode Generator', icon: '📊' },
      { key: 'ra_import', label: 'RA Import', icon: '📑' },
      { key: 'performance', label: 'Performance', icon: '⚡' },
      { key: 'settings', label: 'Einstellungen', icon: '⚙️' },
      { key: 'import', label: 'Daten Import', icon: '📥' },
      { key: 'export', label: 'Daten Export', icon: '📤' },
      { key: 'users', label: 'Benutzerverwaltung', icon: '👥' },
    ];
    
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="custom-modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="custom-modal-header">
          <span class="custom-modal-icon">🔐</span>
          <span class="custom-modal-title">Berechtigungen bearbeiten: ${displayName}</span>
          <span class="custom-modal-close" onclick="this.closest('.custom-modal').remove()">&times;</span>
        </div>
        <div class="custom-modal-body">
          <p style="margin-bottom: 20px; color: var(--text-muted); font-size: 13px;">
            Konfigurieren Sie detailliert, welche Bereiche und Aktionen diese Rolle ausführen darf.
          </p>
          
          <div style="display: grid; gap: 12px;">
            ${modules.map(module => {
              const perm = permissions[module.key] || {};
              return `
                <div style="padding: 14px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                    <span style="font-size: 20px;">${module.icon}</span>
                    <span style="font-weight: 600; color: var(--text-main);">${module.label}</span>
                  </div>
                  <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-left: 32px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                      <input type="checkbox" ${perm.read ? 'checked' : ''} data-module="${module.key}" data-action="read" onchange="updateRolePermission(this, ${roleId})" style="cursor: pointer;">
                      <span style="font-size: 12px; color: var(--text-main);">📖 Lesen</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                      <input type="checkbox" ${perm.write ? 'checked' : ''} data-module="${module.key}" data-action="write" onchange="updateRolePermission(this, ${roleId})" style="cursor: pointer;">
                      <span style="font-size: 12px; color: var(--text-main);">✏️ Schreiben</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                      <input type="checkbox" ${perm.delete ? 'checked' : ''} data-module="${module.key}" data-action="delete" onchange="updateRolePermission(this, ${roleId})" style="cursor: pointer;">
                      <span style="font-size: 12px; color: var(--text-main);">🗑️ Löschen</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                      <input type="checkbox" ${perm.export ? 'checked' : ''} data-module="${module.key}" data-action="export" onchange="updateRolePermission(this, ${roleId})" style="cursor: pointer;">
                      <span style="font-size: 12px; color: var(--text-main);">📤 Exportieren</span>
                    </label>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.custom-modal').remove()">Schließen</button>
          <button class="btn btn-primary" onclick="this.closest('.custom-modal').remove(); loadRolePermissions();">
            <span>✓</span> Fertig
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Rollen-Details:', error);
    alert('Fehler beim Laden der Rollen-Details');
  }
}

// Update role permission
async function updateRolePermission(checkbox, roleId) {
  const module = checkbox.dataset.module;
  const action = checkbox.dataset.action;
  const value = checkbox.checked;
  
  try {
    const response = await fetch(`/api/users/roles/${roleId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module,
        action,
        value
      })
    });
    
    if (!response.ok) throw new Error('Fehler beim Aktualisieren');
    
    // Success feedback
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--gxo-green);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 100000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = `✓ Berechtigung aktualisiert`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Berechtigung:', error);
    checkbox.checked = !value; // Revert
    alert('Fehler beim Aktualisieren der Berechtigung');
  }
}

// Export functions
window.initUserManagement = initUserManagement;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showAddUserModal = showAddUserModal;
window.openAddUserModal = openAddUserModal;
window.loadAccessRequests = loadAccessRequests;
window.approveAccessRequest = approveAccessRequest;
window.rejectAccessRequest = rejectAccessRequest;
window.deleteAccessRequest = deleteAccessRequest;
window.changeRequestedRole = changeRequestedRole;
window.loadRolePermissions = loadRolePermissions;
window.openRolePermissionsModal = openRolePermissionsModal;
window.updateRolePermission = updateRolePermission;
