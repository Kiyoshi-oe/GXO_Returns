// LVS Returns - Global Initialization
// Dieses Script wird auf allen Seiten geladen
// ============================================

// Keyboard Shortcuts laden
(function() {
  const script = document.createElement('script');
  script.src = '/js/core/keyboard-shortcuts.js';
  script.async = false;
  document.head.appendChild(script);
})();

console.log('✅ Global Init geladen');
