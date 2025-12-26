// LVS Returns - Globale Suchfunktion

/**
 * Keyboard-Shortcut für globale Suche
 * Die Suchleiste wird nicht mehr im Header angezeigt, nur der Shortcut bleibt aktiv
 */
function initGlobalSearch() {
  // Keyboard-Shortcut: Strg+K oder Cmd+K für Suche
  // Leitet direkt zur Suchseite weiter
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      // Prüfe ob wir bereits auf der Suchseite sind
      if (window.location.pathname !== '/suche') {
        window.location.href = '/suche';
      } else {
        // Wenn bereits auf Suchseite, fokussiere das Suchfeld
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    }
  });
}

// Auto-Initialisierung wenn DOM geladen ist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalSearch);
} else {
  initGlobalSearch();
}
