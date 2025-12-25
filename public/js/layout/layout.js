// LVS Returns - Gemeinsame Layout-Komponente für Navigation

/**
 * Erstellt die gemeinsame Navigation-Sidebar
 * @param {string} activePage - Name der aktiven Seite (z.B. 'dashboard', 'inventory')
 * @returns {string} HTML-String für die Sidebar
 */
function createSidebar(activePage) {
  const pages = {
    dashboard: { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    inventory: { icon: '📦', label: 'Lagerbestand', route: '/lagerbestand' },
    inbound: { icon: '📥', label: 'Wareneingang', route: '/wareneingang' },
    move: { icon: '↔️', label: 'Umlagerung', route: '/umlagerung' },
    archive: { icon: '🗂️', label: 'Archiv', route: '/archive' },
    ra: { icon: '📑', label: 'RA Import', route: '/ra-import' },
    performance: { icon: '⚡', label: 'Performance', route: '/performance' },
    settings: { icon: '⚙️', label: 'Einstellungen', route: '/einstellungen' },
    import: { icon: '📥', label: 'Import', route: '/import' },
    export: { icon: '📤', label: 'Export', route: '/export' }
  };

  const viewPages = ['dashboard', 'inventory', 'inbound', 'move', 'archive', 'ra', 'performance'];
  const adminPages = ['settings', 'import', 'export'];

  let sidebarHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/images/GXO_logo.png" class="sidebar-logo-img" alt="GXO">
          <span class="sidebar-logo-text-main">Returns</span>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-section-title">Ansichten</div>
  `;

  viewPages.forEach(page => {
    const isActive = page === activePage ? 'active' : '';
    sidebarHTML += `
        <a href="${pages[page].route}" class="nav-item ${isActive}" data-page="${page}">
          <span class="nav-icon">${pages[page].icon}</span>
          <span>${pages[page].label}</span>
        </a>
    `;
  });

  sidebarHTML += `
      </nav>

      <div class="nav-section-title">Administration</div>
  `;

  adminPages.forEach(page => {
    const isActive = page === activePage ? 'active' : '';
    sidebarHTML += `
        <a href="${pages[page].route}" class="nav-item ${isActive}" data-page="${page}">
          <span class="nav-icon">${pages[page].icon}</span>
          <span>${pages[page].label}</span>
        </a>
    `;
  });

  sidebarHTML += `
      <div class="sidebar-footer">
        <div style="font-size: 11px; color: var(--text-soft);">
          LVS Returns System<br>
          Version 1.0
        </div>
      </div>
    </aside>
  `;

  return sidebarHTML;
}

/**
 * Erstellt den gemeinsamen Header/Topbar
 * @param {string} title - Titel der Seite
 * @param {string} subtitle - Untertitel der Seite
 * @returns {string} HTML-String für den Topbar
 */
function createTopbar(title, subtitle) {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="topbar-title" id="topbarTitle">${title}</div>
        <div class="topbar-subtitle" id="topbarSubtitle">${subtitle}</div>
      </div>
      <div class="topbar-right" style="display: flex; align-items: center; gap: 12px;">
        <button class="btn-icon" id="themeToggle" aria-label="Ansicht wechseln">☾</button>
        <div id="currentUserDisplay" style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--bg-soft); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onclick="toggleUserMenu()">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--gxo-orange) 0%, #FF6B3D 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;" id="userAvatar">👤</div>
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-main);" id="userName">Nicht angemeldet</span>
            <span style="font-size: 11px; color: var(--text-soft); display: none;" id="userEmail">Windows-Benutzer</span>
          </div>
        </div>
      </div>
    </header>
  `;
}

/**
 * Erstellt das gemeinsame HTML-Grundgerüst
 * @param {string} pageName - Name der Seite
 * @param {string} title - Seitentitel
 * @param {string} subtitle - Seitenuntertitel
 * @param {string} content - Seiteninhalt
 * @returns {string} Vollständiger HTML-String
 */
function createPageLayout(pageName, title, subtitle, content) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title} - LVS Returns</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/GXO_logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/GXO_logo.png">
  
  <!-- Externes CSS -->
  <link rel="stylesheet" href="/style.css">
  
  <!-- Chart.js für Diagramme -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<!-- Loading Screen -->
<div id="loadingScreen">
  <div class="loading-logo-container">
    <div class="loading-ring-2"></div>
    <div class="loading-ring"></div>
    <img src="/images/GXO_logo.png" alt="GXO" class="loading-logo">
  </div>
  <div class="loading-text">
    <span class="gxo-text">GXO</span> <span class="returns-text">Returns</span>
  </div>
  <div class="loading-subtitle">
    <span class="loading-dots"></span>
  </div>
</div>

<!-- Image Lightbox -->
<div id="imageLightbox" class="lightbox">
  <span class="lightbox-close">&times;</span>
  <img id="lightboxImage" class="lightbox-content" src="" alt="Label Vollansicht">
</div>

<!-- Custom Modal -->
<div id="customModal" class="custom-modal">
  <div class="custom-modal-content">
    <div class="custom-modal-header">
      <span class="custom-modal-icon" id="modalIcon">ℹ️</span>
      <span class="custom-modal-title" id="modalTitle">Information</span>
      <span class="custom-modal-close" id="modalClose">&times;</span>
    </div>
    <div class="custom-modal-body" id="modalBody">
      Nachricht hier
    </div>
    <div class="custom-modal-footer">
      <button class="btn btn-primary" id="modalOkBtn">OK</button>
      <button class="btn btn-ghost" id="modalCancelBtn" style="display:none;">Abbrechen</button>
    </div>
  </div>
</div>

<div class="app">
  ${createSidebar(pageName)}
  
  <!-- Content -->
  <div class="content">
    ${createTopbar(title, subtitle)}
    
    <main class="main">
      ${content}
    </main>
  </div>
</div>

<!-- Loading Screen Management -->
<script>
  (function() {
    let loadingScreenHidden = false;
    let dataLoadingComplete = false;
    let minDisplayTimeElapsed = false;
    const minDisplayTime = 2000;
    const startTime = Date.now();
    
    function hideLoadingScreen() {
      if (loadingScreenHidden) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed < minDisplayTime || !dataLoadingComplete) {
        setTimeout(hideLoadingScreen, 100);
        return;
      }
      
      loadingScreenHidden = true;
      
      try {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
          loadingScreen.style.transition = "opacity 0.6s ease, visibility 0.6s ease";
          loadingScreen.style.opacity = "0";
          loadingScreen.style.visibility = "hidden";
          
          setTimeout(() => {
            loadingScreen.style.pointerEvents = "none";
            loadingScreen.style.display = "none";
            loadingScreen.style.zIndex = "-1";
          }, 600);
        }
      } catch (err) {
        console.error("Fehler beim Ausblenden:", err);
      }
    }
    
    setTimeout(() => {
      minDisplayTimeElapsed = true;
      hideLoadingScreen();
    }, minDisplayTime);
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        dataLoadingComplete = true;
        hideLoadingScreen();
      }, 500);
    });
    
    setTimeout(() => {
      dataLoadingComplete = true;
      minDisplayTimeElapsed = true;
      hideLoadingScreen();
    }, 5000);
    
    window.hideLoadingScreen = hideLoadingScreen;
  })();
</script>

<!-- Gemeinsame Scripts -->
<script src="/js/app.js"></script>
<script src="/js/navigation.js"></script>
<script src="/js/theme.js"></script>
<script src="/js/utils.js"></script>
<script src="/js/charts.js"></script>

<!-- Seiten-spezifische Scripts werden hier eingefügt -->

</body>
</html>`;
}

// Export für Node.js (Server-seitig)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createPageLayout, createSidebar, createTopbar };
}


