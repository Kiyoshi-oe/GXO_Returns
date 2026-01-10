// LVS Returns - Initialize All Features
// Lädt alle neuen Features automatisch
// ============================================

(function() {
  const features = [
    '/js/core/current-user.js',
    '/js/core/keyboard-shortcuts.js',
    '/js/core/smart-search.js',
    '/js/core/i18n.js',
    '/js/core/favorites.js',
    '/js/core/admin-view-switcher.js'
  ];

  features.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });

  console.log('✅ Alle Features werden geladen...');
})();
