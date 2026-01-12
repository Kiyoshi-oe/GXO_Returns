// LVS Returns - Warehouse Map Visualization
// ============================================

let warehouseData = [];
let filteredData = [];
let currentArea = 'all';
let currentViewMode = 'heatmap';
let showEmpty = true;

// 3D View variables
let scene, camera, renderer, controls;
let warehouse3DObjects = [];

// Check if we're on the warehouse-map page
const isWarehouseMapPage = window.location.pathname === '/warehouse-map';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (isWarehouseMapPage) {
    initWarehouseMap();
  } else {
    // On all other pages, show FAB
    initWarehouseMapFAB();
  }
});

// Initialize Warehouse Map FAB for all pages
function initWarehouseMapFAB() {
  // Create FAB button
  const fab = document.createElement('button');
  fab.id = 'warehouseMapFAB';
  fab.className = 'warehouse-map-fab';
  fab.innerHTML = '🗺️';
  fab.title = 'Lager-Visualisierung';
  fab.onclick = openWarehouseMapModal;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .warehouse-map-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--gxo-orange) 0%, #f97316 100%);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(255, 111, 15, 0.4);
      transition: all 0.3s ease;
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .warehouse-map-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(255, 111, 15, 0.6);
    }
    
    .warehouse-map-fab:active {
      transform: scale(0.95);
    }
    
    .warehouse-map-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    
    .warehouse-map-modal.active {
      display: flex;
    }
    
    .warehouse-map-modal-content {
      width: 95%;
      height: 90%;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 24px;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
    }
    
    .warehouse-map-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--border-soft);
    }
    
    .warehouse-map-modal-header h2 {
      margin: 0;
      color: var(--text-main);
      font-size: 24px;
    }
    
    .warehouse-map-modal-close {
      background: var(--bg-soft);
      border: 2px solid var(--border-soft);
      color: var(--text-main);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .warehouse-map-modal-close:hover {
      background: var(--gxo-orange);
      color: white;
      transform: rotate(90deg);
    }
    
    .warehouse-map-modal-body {
      flex: 1;
      overflow: hidden;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(fab);
}

// Open warehouse map in modal
function openWarehouseMapModal() {
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'warehouseMapModal';
  modal.className = 'warehouse-map-modal';
  
  modal.innerHTML = `
    <div class="warehouse-map-modal-content">
      <div class="warehouse-map-modal-header">
        <h2>🗺️ Lager-Visualisierung</h2>
        <button class="warehouse-map-modal-close" onclick="closeWarehouseMapModal()">×</button>
      </div>
      <div class="warehouse-map-modal-body">
        <iframe src="/warehouse-map" style="width: 100%; height: 100%; border: none; border-radius: 8px;"></iframe>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeWarehouseMapModal();
    }
  });
}

// Close warehouse map modal
function closeWarehouseMapModal() {
  const modal = document.getElementById('warehouseMapModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Make close function global
window.closeWarehouseMapModal = closeWarehouseMapModal;

async function initWarehouseMap() {
  // Load areas for filter
  await loadAreas();
  
  // Load warehouse data
  await loadWarehouseData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initial render
  renderWarehouse();
}

// Load areas
async function loadAreas() {
  try {
    const response = await fetch('/api/warehouse/areas');
    const areas = await response.json();
    
    const areaFilter = document.getElementById('areaFilter');
    areas.forEach(area => {
      if (area) {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaFilter.appendChild(option);
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Bereiche:', error);
  }
}

// Load warehouse data
async function loadWarehouseData() {
  try {
    const response = await fetch('/api/warehouse/locations');
    warehouseData = await response.json();
    
    // Calculate utilization for each location
    warehouseData.forEach(location => {
      // Annahme: Max 100 Kartons pro Stellplatz (kann angepasst werden)
      const maxCapacity = 100;
      location.utilization = location.total_cartons > 0 
        ? Math.min(100, Math.round((location.total_cartons / maxCapacity) * 100))
        : 0;
      
      // Determine color category
      if (!location.is_active) {
        location.category = 'inactive';
      } else if (location.total_cartons === 0) {
        location.category = 'empty';
      } else if (location.utilization <= 50) {
        location.category = 'low';
      } else if (location.utilization <= 80) {
        location.category = 'medium';
      } else {
        location.category = 'high';
      }
    });
    
    filterData();
    updateStats();
  } catch (error) {
    console.error('Fehler beim Laden der Lagerdaten:', error);
    showNotification('Fehler beim Laden der Daten', 'error');
  }
}

// Filter data based on current filters
function filterData() {
  filteredData = warehouseData.filter(location => {
    // Area filter
    if (currentArea !== 'all' && location.area !== currentArea) {
      return false;
    }
    
    // Show empty filter
    if (!showEmpty && location.total_cartons === 0) {
      return false;
    }
    
    return true;
  });
}

// Update statistics
function updateStats() {
  const totalLocations = filteredData.length;
  const occupied = filteredData.filter(l => l.total_cartons > 0).length;
  const free = totalLocations - occupied;
  const utilization = totalLocations > 0 
    ? Math.round((occupied / totalLocations) * 100) 
    : 0;
  
  document.getElementById('statTotalLocations').textContent = totalLocations;
  document.getElementById('statOccupied').textContent = occupied;
  document.getElementById('statFree').textContent = free;
  document.getElementById('statUtilization').textContent = utilization + '%';
}

// Render warehouse based on view mode
function renderWarehouse() {
  switch (currentViewMode) {
    case 'heatmap':
      renderHeatmap();
      break;
    case '3d':
      render3DView();
      break;
    case 'grid':
      renderGrid();
      break;
    case 'list':
      renderList();
      break;
  }
}

// Render heatmap view
function renderHeatmap() {
  const container = document.getElementById('warehouseGrid');
  container.innerHTML = '';
  
  if (filteredData.length === 0) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-soft);">Keine Stellplätze gefunden</div>';
    return;
  }
  
  filteredData.forEach(location => {
    const locationEl = document.createElement('div');
    locationEl.className = `warehouse-location ${location.category}`;
    locationEl.innerHTML = `
      <div>
        <div class="location-code">${location.code}</div>
        <div class="location-area">${location.area || 'Kein Bereich'}</div>
      </div>
      <div class="location-stats">
        <div>📦 ${location.carton_count} Kartons</div>
        <div>📊 ${location.total_cartons} Stück</div>
        <div class="location-utilization">${location.utilization}%</div>
      </div>
    `;
    
    locationEl.addEventListener('click', () => showLocationDetails(location));
    container.appendChild(locationEl);
  });
}

// Render compact grid view
function renderGrid() {
  const container = document.getElementById('warehouseGridCompact');
  container.innerHTML = '';
  
  if (filteredData.length === 0) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-soft);">Keine Stellplätze gefunden</div>';
    return;
  }
  
  filteredData.forEach(location => {
    const locationEl = document.createElement('div');
    locationEl.className = `warehouse-location warehouse-location-compact ${location.category}`;
    locationEl.innerHTML = `
      <div style="font-weight: 600;">${location.code}</div>
      <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">${location.utilization}%</div>
      <div style="font-size: 10px; opacity: 0.8;">${location.carton_count} 📦</div>
    `;
    
    locationEl.addEventListener('click', () => showLocationDetails(location));
    container.appendChild(locationEl);
  });
}

// Render list view
function renderList() {
  const tbody = document.getElementById('warehouseList');
  tbody.innerHTML = '';
  
  if (filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-soft); padding: 40px;">Keine Stellplätze gefunden</td></tr>';
    return;
  }
  
  filteredData.forEach(location => {
    const tr = document.createElement('tr');
    tr.className = 'data-row';
    
    const statusBadge = location.is_active 
      ? '<span style="color: #10b981;">● Aktiv</span>' 
      : '<span style="color: #6b7280;">● Inaktiv</span>';
    
    const utilizationColor = location.utilization > 80 ? '#ef4444' : 
                            location.utilization > 50 ? '#f97316' : 
                            location.utilization > 0 ? '#fbbf24' : '#10b981';
    
    tr.innerHTML = `
      <td><strong>${location.code}</strong></td>
      <td>${location.area || '-'}</td>
      <td>${location.carton_count} (${location.total_cartons} Stück)</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="width: ${location.utilization}%; height: 100%; background: ${utilizationColor};"></div>
          </div>
          <span style="font-weight: 600; min-width: 40px;">${location.utilization}%</span>
        </div>
      </td>
      <td>${statusBadge}</td>
      <td>${location.last_booked_at ? formatDate(location.last_booked_at) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="showLocationDetails(${JSON.stringify(location).replace(/"/g, '&quot;')})">
          Details
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// Show location details in modal
async function showLocationDetails(location) {
  const modal = document.getElementById('locationModal');
  const title = document.getElementById('modalLocationTitle');
  const body = document.getElementById('modalLocationBody');
  
  title.textContent = `Stellplatz ${location.code}`;
  body.innerHTML = '<div style="text-align: center; padding: 40px;">Lade Details...</div>';
  
  modal.classList.add('active');
  
  try {
    const response = await fetch(`/api/warehouse/locations/${location.id}/details`);
    const data = await response.json();
    
    const utilizationColor = location.utilization > 80 ? '#ef4444' : 
                            location.utilization > 50 ? '#f97316' : 
                            location.utilization > 0 ? '#fbbf24' : '#10b981';
    
    let html = `
      <div style="display: grid; gap: 16px;">
        <!-- Basis-Info -->
        <div style="background: var(--bg-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--border-soft);">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--text-main);">Basis-Informationen</h3>
          <div style="display: grid; gap: 8px;">
            <div><strong>Code:</strong> ${location.code}</div>
            <div><strong>Bereich:</strong> ${location.area || '-'}</div>
            <div><strong>Beschreibung:</strong> ${location.description || '-'}</div>
            <div><strong>Status:</strong> ${location.is_active ? '✅ Aktiv' : '❌ Inaktiv'}</div>
          </div>
        </div>

        <!-- Auslastung -->
        <div style="background: var(--bg-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--border-soft);">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--text-main);">Auslastung</h3>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="flex: 1; height: 24px; background: #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="width: ${location.utilization}%; height: 100%; background: ${utilizationColor}; transition: width 0.3s;"></div>
            </div>
            <span style="font-weight: 700; font-size: 20px; min-width: 60px;">${location.utilization}%</span>
          </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: var(--gxo-orange);">${data.carton_count}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Kartons</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: var(--gxo-orange);">${data.total_cartons}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Stück</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: var(--gxo-orange);">${data.stats.carrierBreakdown.length}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Carrier</div>
            </div>
          </div>
        </div>

        <!-- Carrier Breakdown -->
        ${data.stats.carrierBreakdown.length > 0 ? `
          <div style="background: var(--bg-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--text-main);">Carrier-Verteilung</h3>
            <div style="display: grid; gap: 8px;">
              ${data.stats.carrierBreakdown.map(c => `
                <div style="display: flex; justify-content: space-between; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 4px; color: var(--text-main);">
                  <span>${c.carrier_name}</span>
                  <strong style="color: var(--gxo-orange);">${c.count} Kartons</strong>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Letzte Kartons -->
        ${data.cartons.length > 0 ? `
          <div style="background: var(--bg-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--text-main);">Letzte Kartons (max. 5)</h3>
            <div style="display: grid; gap: 8px;">
              ${data.cartons.slice(0, 5).map(c => `
                <div style="padding: 12px; background: var(--bg-card); border-radius: 4px; border-left: 3px solid var(--gxo-orange); border: 1px solid var(--border-soft);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <strong style="color: var(--text-main);">${c.olpn || 'N/A'}</strong>
                    <span style="color: var(--text-muted); font-size: 12px;">${formatDate(c.created_at)}</span>
                  </div>
                  <div style="font-size: 13px; color: var(--text-muted);">
                    ${c.carrier_name || 'Kein Carrier'} • ${c.actual_carton || 0} Stück
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Keine Kartons auf diesem Stellplatz</div>'}

        <!-- Letzte Bewegungen -->
        ${data.movements.length > 0 ? `
          <div style="background: var(--bg-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--text-main);">Letzte Bewegungen</h3>
            <div style="display: grid; gap: 8px;">
              ${data.movements.slice(0, 5).map(m => `
                <div style="padding: 12px; background: var(--bg-card); border-radius: 4px; border: 1px solid var(--border-soft);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: var(--text-main);">${m.from_location} → ${m.to_location}</span>
                    <span style="color: var(--text-muted); font-size: 12px;">${formatDate(m.moved_at)}</span>
                  </div>
                  <div style="font-size: 13px; color: var(--text-muted);">
                    ${m.olpn || 'N/A'} • ${m.moved_by || 'System'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    body.innerHTML = html;
  } catch (error) {
    console.error('Fehler beim Laden der Details:', error);
    body.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">Fehler beim Laden der Details</div>';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Area filter
  document.getElementById('areaFilter').addEventListener('change', (e) => {
    currentArea = e.target.value;
    filterData();
    updateStats();
    renderWarehouse();
  });
  
  // View mode
  document.getElementById('viewMode').addEventListener('change', (e) => {
    currentViewMode = e.target.value;
    
    // Hide all views
    document.getElementById('heatmapView').style.display = 'none';
    document.getElementById('view3d').style.display = 'none';
    document.getElementById('gridView').style.display = 'none';
    document.getElementById('listView').style.display = 'none';
    
    // Show selected view
    switch (currentViewMode) {
      case 'heatmap':
        document.getElementById('heatmapView').style.display = 'block';
        break;
      case '3d':
        document.getElementById('view3d').style.display = 'block';
        break;
      case 'grid':
        document.getElementById('gridView').style.display = 'block';
        break;
      case 'list':
        document.getElementById('listView').style.display = 'block';
        break;
    }
    
    renderWarehouse();
  });
  
  // Show empty checkbox
  document.getElementById('showEmpty').addEventListener('change', (e) => {
    showEmpty = e.target.checked;
    filterData();
    updateStats();
    renderWarehouse();
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Lädt...';
    
    await loadWarehouseData();
    renderWarehouse();
    
    btn.disabled = false;
    btn.innerHTML = '<span>🔄</span> Aktualisieren';
    showNotification('Daten aktualisiert', 'success');
  });
  
  // Modal close
  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('locationModal').classList.remove('active');
  });
  
  // Close modal on background click
  document.getElementById('locationModal').addEventListener('click', (e) => {
    if (e.target.id === 'locationModal') {
      document.getElementById('locationModal').classList.remove('active');
    }
  });
}

// Helper: Format date
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

// Helper: Show notification
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
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Render 3D View
function render3DView() {
  const container = document.getElementById('warehouse3DContainer');
  
  if (!container) return;
  
  // Clear previous scene
  if (renderer) {
    renderer.dispose();
    container.innerHTML = '';
  }
  
  // Setup scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Setup camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);
  
  // Setup renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Setup controls
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  }
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  
  // Add grid
  const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
  scene.add(gridHelper);
  
  // Clear previous objects
  warehouse3DObjects = [];
  
  // Create 3D boxes for each location
  filteredData.forEach((location, index) => {
    // Calculate position in grid
    const gridSize = Math.ceil(Math.sqrt(filteredData.length));
    const x = (index % gridSize) * 2 - gridSize;
    const z = Math.floor(index / gridSize) * 2 - gridSize;
    
    // Height based on utilization
    const height = Math.max(0.5, (location.utilization / 100) * 5);
    
    // Color based on utilization
    let color;
    if (!location.is_active) {
      color = 0x6b7280;
    } else if (location.utilization === 0) {
      color = 0x10b981;
    } else if (location.utilization <= 50) {
      color = 0xfbbf24;
    } else if (location.utilization <= 80) {
      color = 0xf97316;
    } else {
      color = 0xef4444;
    }
    
    // Create box
    const geometry = new THREE.BoxGeometry(1.5, height, 1.5);
    const material = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, height / 2, z);
    cube.userData = location;
    
    scene.add(cube);
    warehouse3DObjects.push(cube);
    
    // Add label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = 'white';
    context.font = 'Bold 40px Arial';
    context.textAlign = 'center';
    context.fillText(location.code, 128, 64);
    context.font = '30px Arial';
    context.fillText(location.utilization + '%', 128, 100);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, height + 1, z);
    sprite.scale.set(2, 1, 1);
    
    scene.add(sprite);
  });
  
  // Raycaster for click detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(warehouse3DObjects);
    
    if (intersects.length > 0) {
      const location = intersects[0].object.userData;
      showLocationDetails(location);
    }
  }
  
  renderer.domElement.addEventListener('click', onMouseClick);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();
  
  // Handle window resize
  function onWindowResize() {
    if (!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onWindowResize);
}

// Make functions globally available
window.showLocationDetails = showLocationDetails;
window.openWarehouseMapModal = openWarehouseMapModal;
window.closeWarehouseMapModal = closeWarehouseMapModal;

console.log('✅ Warehouse Map initialisiert');
