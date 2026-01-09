// LVS Returns - Error Handler Middleware
// ============================================

/**
 * 404 Handler für API-Routes
 */
function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    console.error(`❌ API-Endpunkt nicht gefunden: ${req.method} ${req.path}`);
    return res.status(404).json({ 
      ok: false, 
      error: `API-Endpunkt nicht gefunden: ${req.method} ${req.path}` 
    });
  }
  next();
}

/**
 * Globaler Error-Handler
 */
function errorHandler(err, req, res, next) {
  console.error("❌ Unerwarteter Fehler:", err);
  
  // Statuscode bestimmen
  const statusCode = err.status || err.statusCode || 500;
  
  // Fehlermeldung
  const message = err.message || "Interner Serverfehler";
  
  // In Entwicklung: Stack-Trace hinzufügen
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(statusCode).json({ 
    ok: false, 
    error: message,
    ...(isDev && { stack: err.stack })
  });
}

/**
 * Async-Handler-Wrapper (für async/await in Express)
 * @param {Function} fn - Async-Funktion
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};
