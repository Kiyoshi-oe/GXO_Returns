// LVS Returns - Navigation Initialisierung für separate Seiten

/**
 * Setzt die aktive Navigation basierend auf der aktuellen URL
 */
function initPageNavigation() {
  const currentPath = window.location.pathname;
  
  // Route-Mapping
  const routeToPage = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/lagerbestand': 'inventory',
    '/wareneingang': 'inbound',
    '/umlagerung': 'move',
    '/archive': 'archive',
    '/ra-import': 'ra',
    '/einstellungen': 'settings',
    '/import': 'import',
    '/export': 'export'
  };
  
  const currentPage = routeToPage[currentPath] || 'dashboard';
  
  // Alle Navigation-Items durchgehen
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href) {
      const itemPage = routeToPage[href] || null;
      if (itemPage === currentPage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
  });
  
  console.log(`✅ Navigation initialisiert - Aktive Seite: ${currentPage}`);
}

// Beim Laden der Seite ausführen
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPageNavigation);
} else {
  initPageNavigation();
}


