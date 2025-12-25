// LVS Returns - Client-Side Routing System

// Route-Mapping: URL-Pfad -> View-Name
const routeMap = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/lagerbestand': 'inventory',
  '/wareneingang': 'inbound',
  '/umlagerung': 'move',
  '/archive': 'archive',
  '/ra-import': 'ra',
  '/performance': 'performance',
  '/einstellungen': 'settings',
  '/import': 'import',
  '/export': 'export'
};

// View-Name -> URL-Pfad Mapping (für Navigation)
const viewToRoute = {
  'dashboard': '/dashboard',
  'inventory': '/lagerbestand',
  'inbound': '/wareneingang',
  'move': '/umlagerung',
  'archive': '/archive',
  'ra': '/ra-import',
  'performance': '/performance',
  'settings': '/einstellungen',
  'import': '/import',
  'export': '/export'
};

// Aktuelle Route
let currentRoute = '/';

/**
 * Initialisiert das Routing-System
 */
function initRouting() {
  // Beim Laden der Seite: Route aus URL lesen
  handleRouteChange();
  
  // Browser-History Events abonnieren (für Back/Forward-Buttons)
  window.addEventListener('popstate', handleRouteChange);
  
  console.log('✅ Routing initialisiert');
}

/**
 * Behandelt Route-Änderungen (beim Laden oder Browser-Navigation)
 */
function handleRouteChange() {
  const path = window.location.pathname;
  
  // Root-Route "/" auf "/dashboard" umleiten
  if (path === '/') {
    window.history.replaceState({ view: 'dashboard' }, '', '/dashboard');
    currentRoute = '/dashboard';
    activateView('dashboard');
    return;
  }
  
  const viewName = routeMap[path] || 'dashboard'; // Fallback auf Dashboard
  
  // View aktivieren
  activateView(viewName);
  
  // Aktuelle Route speichern
  currentRoute = path;
}

/**
 * Navigiert zu einer neuen Route
 * @param {string} viewName - Name der View (z.B. 'dashboard', 'inventory')
 * @param {boolean} replaceState - Ob Browser-History ersetzt werden soll (default: false)
 */
function navigateToView(viewName, replaceState = false) {
  const route = viewToRoute[viewName] || '/dashboard';
  
  if (route === currentRoute) {
    return; // Bereits auf dieser Route
  }
  
  // Browser-History aktualisieren
  if (replaceState) {
    window.history.replaceState({ view: viewName }, '', route);
  } else {
    window.history.pushState({ view: viewName }, '', route);
  }
  
  // View aktivieren
  activateView(viewName);
  
  // Aktuelle Route speichern
  currentRoute = route;
}

/**
 * Aktiviert eine View (zeigt sie an und aktualisiert Navigation)
 * @param {string} viewName - Name der View
 */
function activateView(viewName) {
  // Navigation aktualisieren
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const itemView = item.getAttribute('data-view');
    if (itemView === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Views ein/ausblenden
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    const viewId = view.id.replace('view-', '');
    if (viewId === viewName) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });
  
  // Topbar-Titel aktualisieren
  const topbarTitle = document.getElementById('topbarTitle');
  const topbarSubtitle = document.getElementById('topbarSubtitle');
  
  if (viewMeta[viewName]) {
    if (topbarTitle) topbarTitle.textContent = viewMeta[viewName].title;
    if (topbarSubtitle) topbarSubtitle.textContent = viewMeta[viewName].subtitle;
  }
  
  // Nach oben scrollen
  setTimeout(() => {
    const mainContent = document.querySelector('.main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, 0);
  
  // Settings Content nur auf der Einstellungen-Seite anzeigen
  const settingsContent = document.getElementById('settingsContent');
  if (viewName !== 'settings' && settingsContent) {
    settingsContent.style.display = 'none';
  }
  
  // View-spezifische Logik ausführen
  handleViewSwitch(viewName);
}

/**
 * Gibt die aktuelle Route zurück
 * @returns {string} Aktuelle Route
 */
function getCurrentRoute() {
  return currentRoute;
}

/**
 * Gibt den View-Namen für eine Route zurück
 * @param {string} route - Route (z.B. '/dashboard')
 * @returns {string} View-Name (z.B. 'dashboard')
 */
function getViewForRoute(route) {
  return routeMap[route] || 'dashboard';
}

console.log('✅ routing.js geladen');

