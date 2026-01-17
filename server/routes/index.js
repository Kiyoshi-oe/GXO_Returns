// LVS Returns - Route Index
// ============================================

const warehouseRoutes = require('./warehouse');
const carrierRoutes = require('./carriers');
const inboundRoutes = require('./inbound');
const movementRoutes = require('./movements');
const dashboardRoutes = require('./dashboard');
const searchRoutes = require('./search');
const backupRoutes = require('./backup');
const dropdownRoutes = require('./dropdowns');
const systemRoutes = require('./system');
const performanceRoutes = require('./performance');
const archiveRoutes = require('./archive');
const exportRoutes = require('./export');
const usersRoutes = require('./users');
const accessRequestsRoutes = require('./access-requests');
const dailyPerformanceRoutes = require('./daily-performance');

/**
 * Registriert alle API-Routes
 * @param {Express} app - Express-App
 */
function registerRoutes(app) {
  // Warehouse API
  app.use('/api/warehouse', warehouseRoutes);
  
  // Carrier API
  app.use('/api/carriers', carrierRoutes);
  
  // Inbound API
  app.use('/api/inbound-simple', inboundRoutes);
  
  // Movement API
  app.use('/api/movements', movementRoutes);
  app.use('/api/movement', movementRoutes); // Alias ohne 's'
  
  // Dashboard API
  app.use('/api/dashboard', dashboardRoutes);
  
  // Search API
  app.use('/api/search', searchRoutes);
  
  // Backup API
  app.use('/api/backup', backupRoutes);
  
  // Dropdown Options API
  app.use('/api/dropdown-options', dropdownRoutes);
  
  // Performance API
  app.use('/api/performance', performanceRoutes);
  
  // Archive API
  app.use('/api/archive', archiveRoutes);
  
  // Export API
  app.use('/api/export', exportRoutes);
  
  // Users API
  app.use('/api/users', usersRoutes);
  
  // Access Requests API
  app.use('/api/access-requests', accessRequestsRoutes);
  
  // Daily Performance API
  app.use('/api/daily-performance', dailyPerformanceRoutes);
  
  // System API (current-user, init, etc.)
  app.use('/api', systemRoutes);
  
  console.log('✅ Alle API-Routes registriert');
}

module.exports = {
  registerRoutes,
  warehouseRoutes,
  carrierRoutes,
  inboundRoutes,
  movementRoutes,
  dashboardRoutes,
  searchRoutes,
  backupRoutes,
  dropdownRoutes,
  systemRoutes,
  performanceRoutes,
  archiveRoutes,
  exportRoutes,
  usersRoutes
};
