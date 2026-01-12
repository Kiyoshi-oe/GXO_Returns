// LVS Returns - Performance API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Server-Start-Zeit für Uptime-Berechnung
const serverStartTime = Date.now();

// GET /api/performance/health - Systemgesundheit
router.get('/health', (req, res) => {
  try {
    const db = getDb();
    
    // Datenbank-Test
    let dbStatus = 'healthy';
    let dbError = null;
    try {
      db.prepare('SELECT 1').get();
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }
    
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    const memUsage = process.memoryUsage();
    
    res.json({
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      uptime: uptime,
      uptimeFormatted: formatUptime(uptime),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        error: dbError
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        hostname: os.hostname()
      }
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Systemgesundheit:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/metrics - Performance-Metriken
router.get('/metrics', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();
    
    res.json({
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      },
      system: {
        loadAverage: loadAvg,
        freeMemory: Math.round(os.freemem() / 1024 / 1024),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
        uptime: os.uptime(),
        cpus: os.cpus().length
      },
      process: {
        pid: process.pid,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        nodeVersion: process.version
      }
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Performance-Metriken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/database/stats - Datenbank-Statistiken
router.get('/database/stats', (req, res) => {
  try {
    const db = getDb();
    
    // Tabellen-Statistiken
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const tableStats = [];
    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        tableStats.push({
          name: table.name,
          rowCount: count.count
        });
      } catch (err) {
        tableStats.push({
          name: table.name,
          rowCount: 0,
          error: err.message
        });
      }
    }
    
    // Datenbank-Größe (falls möglich)
    let dbSize = 0;
    try {
      const config = require('../config');
      const stats = fs.statSync(config.dbPath);
      dbSize = Math.round(stats.size / 1024);
    } catch (err) {
      // Ignore
    }
    
    res.json({
      tables: tableStats,
      totalTables: tables.length,
      databaseSizeKB: dbSize,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Datenbank-Statistiken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/response-times - Response-Zeit-Statistiken (Platzhalter)
router.get('/response-times', (req, res) => {
  try {
    // Platzhalter - könnte mit einem Middleware erweitert werden
    res.json({
      average: 45,
      min: 12,
      max: 250,
      p95: 120,
      p99: 200,
      requests: {
        total: 0,
        successful: 0,
        failed: 0
      },
      note: "Response-Zeit-Tracking ist noch nicht implementiert"
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Response-Zeiten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/error-logs - Fehler-Logs (Platzhalter)
router.get('/error-logs', (req, res) => {
  try {
    // Platzhalter - könnte mit einem Logging-System erweitert werden
    res.json({
      errors: [],
      totalErrors: 0,
      lastError: null,
      note: "Error-Logging ist noch nicht implementiert"
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Error-Logs:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/user-activities - Benutzer-Aktivitäten
router.get('/user-activities', (req, res) => {
  try {
    const db = getDb();
    const { limit = 50 } = req.query;
    
    // Letzte Aktivitäten aus verschiedenen Tabellen sammeln
    const activities = [];
    
    // Letzte Wareneingänge
    try {
      const inbounds = db.prepare(`
        SELECT id, cw, olpn, carrier_name, created_at, 'Wareneingang' as action_type
        FROM inbound_simple
        WHERE ignore_flag = 0
        ORDER BY created_at DESC
        LIMIT ?
      `).all(Math.ceil(parseInt(limit) / 3));
      
      activities.push(...inbounds.map(i => ({
        type: 'inbound',
        action: 'Wareneingang erstellt',
        description: i.cw || i.olpn || `#${i.id}`,
        details: i.carrier_name,
        timestamp: i.created_at
      })));
    } catch (err) {
      // Ignore
    }
    
    // Letzte Umlagerungen
    try {
      const movements = db.prepare(`
        SELECT m.id, m.moved_at, m.moved_by, m.reason,
               l_from.code as from_loc, l_to.code as to_loc
        FROM movement m
        LEFT JOIN location l_from ON m.from_location_id = l_from.id
        LEFT JOIN location l_to ON m.to_location_id = l_to.id
        ORDER BY m.moved_at DESC
        LIMIT ?
      `).all(Math.ceil(parseInt(limit) / 3));
      
      activities.push(...movements.map(m => ({
        type: 'movement',
        action: 'Umlagerung',
        description: `${m.from_loc || '?'} → ${m.to_loc || '?'}`,
        details: m.reason || m.moved_by,
        timestamp: m.moved_at
      })));
    } catch (err) {
      // Ignore
    }
    
    // Letzte Archivierungen
    try {
      const archives = db.prepare(`
        SELECT a.id, a.archived_at, a.reason, a.archived_by,
               i.cw, i.olpn
        FROM archive a
        LEFT JOIN inbound_simple i ON a.inbound_id = i.id
        ORDER BY a.archived_at DESC
        LIMIT ?
      `).all(Math.ceil(parseInt(limit) / 3));
      
      activities.push(...archives.map(a => ({
        type: 'archive',
        action: 'Archiviert',
        description: a.cw || a.olpn || `#${a.id}`,
        details: a.reason || a.archived_by,
        timestamp: a.archived_at
      })));
    } catch (err) {
      // Ignore
    }
    
    // Nach Timestamp sortieren
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      activities: activities.slice(0, parseInt(limit)),
      total: activities.length
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Benutzer-Aktivitäten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// WAREHOUSE PERFORMANCE ENDPOINTS
// ============================================

// GET /api/performance/warehouse/overview - Lager-Übersicht
router.get('/warehouse/overview', (req, res) => {
  try {
    const db = getDb();
    
    // Gesamtstatistiken
    const totalInbound = db.prepare('SELECT COUNT(*) as count FROM inbound_simple WHERE ignore_flag = 0').get().count;
    const totalLocations = db.prepare('SELECT COUNT(*) as count FROM location').get().count;
    const occupiedLocations = db.prepare(`
      SELECT COUNT(DISTINCT location_id) as count 
      FROM inbound_simple 
      WHERE ignore_flag = 0 AND location_id IS NOT NULL
    `).get().count;
    const totalMovements = db.prepare('SELECT COUNT(*) as count FROM movement').get().count;
    const totalArchived = db.prepare('SELECT COUNT(*) as count FROM archive').get().count;
    
    // Heute
    const today = new Date().toISOString().split('T')[0];
    const todayInbound = db.prepare(`
      SELECT COUNT(*) as count FROM inbound_simple 
      WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
    `).get(today).count;
    const todayMovements = db.prepare(`
      SELECT COUNT(*) as count FROM movement WHERE DATE(moved_at) = ?
    `).get(today).count;
    
    // Zusätzliche Statistiken
    const totalCartons = db.prepare(`
      SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple WHERE ignore_flag = 0
    `).get().total;
    
    const inactiveLocations = db.prepare(`
      SELECT COUNT(*) as count FROM location WHERE is_active = 0
    `).get().count;
    
    const openRAs = db.prepare(`
      SELECT COUNT(DISTINCT asn_ra_no) as count FROM inbound_simple 
      WHERE ignore_flag = 0 AND asn_ra_no IS NOT NULL AND asn_ra_no != ''
    `).get().count;
    
    const activeCarriers = db.prepare(`
      SELECT COUNT(DISTINCT carrier_name) as count FROM inbound_simple 
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL AND carrier_name != ''
    `).get().count;
    
    const utilizationPercent = totalLocations > 0 ? Math.round((occupiedLocations / totalLocations) * 100) : 0;
    
    res.json({
      ok: true,
      totalInbound,
      totalLocations,
      inactiveLocations,
      occupiedLocations,
      availableLocations: totalLocations - occupiedLocations,
      occupancyRate: utilizationPercent,
      utilizationPercent,
      totalMovements,
      totalArchived,
      totalCartons,
      openRAs,
      activeCarriers,
      today: {
        inbound: todayInbound,
        movements: todayMovements
      }
    });
  } catch (err) {
    console.error("Fehler bei warehouse/overview:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/activities - Aktivitäts-Metriken
router.get('/warehouse/activities', (req, res) => {
  try {
    const db = getDb();
    
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Wareneingang-Statistiken
    const inboundToday = db.prepare(`
      SELECT COUNT(*) as count FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
    `).get(today).count;
    const inboundWeek = db.prepare(`
      SELECT COUNT(*) as count FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) >= ?
    `).get(weekAgo).count;
    const inboundMonth = db.prepare(`
      SELECT COUNT(*) as count FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) >= ?
    `).get(monthAgo).count;
    
    // Umlagerungs-Statistiken
    const movementsToday = db.prepare(`
      SELECT COUNT(*) as count FROM movement WHERE DATE(moved_at) = ?
    `).get(today).count;
    const movementsWeek = db.prepare(`
      SELECT COUNT(*) as count FROM movement WHERE DATE(moved_at) >= ?
    `).get(weekAgo).count;
    const movementsMonth = db.prepare(`
      SELECT COUNT(*) as count FROM movement WHERE DATE(moved_at) >= ?
    `).get(monthAgo).count;
    
    // Archivierungs-Statistiken
    const archivedToday = db.prepare(`
      SELECT COUNT(*) as count FROM archive WHERE DATE(archived_at) = ?
    `).get(today).count;
    const archivedWeek = db.prepare(`
      SELECT COUNT(*) as count FROM archive WHERE DATE(archived_at) >= ?
    `).get(weekAgo).count;
    const archivedMonth = db.prepare(`
      SELECT COUNT(*) as count FROM archive WHERE DATE(archived_at) >= ?
    `).get(monthAgo).count;
    
    // Durchschnittliche Verweildauer (in Tagen)
    const avgDwellTime = db.prepare(`
      SELECT AVG(julianday('now') - julianday(aufgenommen_am)) as avg_days
      FROM inbound_simple WHERE ignore_flag = 0 AND aufgenommen_am IS NOT NULL
    `).get().avg_days || 0;
    
    // Durchschnittliche Kartons pro Wareneingang
    const avgCartons = db.prepare(`
      SELECT AVG(actual_carton) as avg FROM inbound_simple WHERE ignore_flag = 0 AND actual_carton IS NOT NULL
    `).get().avg || 0;
    
    res.json({
      ok: true,
      inbound: {
        today: inboundToday,
        week: inboundWeek,
        month: inboundMonth
      },
      movements: {
        today: movementsToday,
        week: movementsWeek,
        month: movementsMonth
      },
      archived: {
        today: archivedToday,
        week: archivedWeek,
        month: archivedMonth
      },
      avgDwellTimeDays: Math.round(avgDwellTime * 10) / 10,
      avgCartonsPerInbound: Math.round(avgCartons * 10) / 10,
      comparison: null // Vergleichsdaten können später hinzugefügt werden
    });
  } catch (err) {
    console.error("Fehler bei warehouse/activities:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/detailed - Detaillierte Lager-Statistiken
router.get('/warehouse/detailed', (req, res) => {
  try {
    const db = getDb();
    
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Stellplatz-Statistiken
    const totalLocations = db.prepare('SELECT COUNT(*) as count FROM location').get().count;
    const occupiedLocations = db.prepare(`
      SELECT COUNT(DISTINCT location_id) as count FROM inbound_simple WHERE ignore_flag = 0 AND location_id IS NOT NULL
    `).get().count;
    
    // Karton-Statistiken
    const totalCartons = db.prepare(`
      SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple WHERE ignore_flag = 0
    `).get().total;
    const todayCartons = db.prepare(`
      SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
    `).get(today).total;
    const weekCartons = db.prepare(`
      SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) >= ?
    `).get(weekAgo).total;
    
    // RA-Statistiken
    const openRAs = db.prepare(`
      SELECT COUNT(DISTINCT asn_ra_no) as count FROM inbound_simple 
      WHERE ignore_flag = 0 AND asn_ra_no IS NOT NULL AND asn_ra_no != ''
    `).get().count;
    const closedRAs = db.prepare(`
      SELECT COUNT(DISTINCT asn_ra_no) as count FROM inbound_simple 
      WHERE ignore_flag = 1 AND asn_ra_no IS NOT NULL AND asn_ra_no != ''
    `).get().count;
    
    // Carrier-Statistiken
    const activeCarriers = db.prepare(`
      SELECT COUNT(DISTINCT carrier_name) as count FROM inbound_simple 
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL AND carrier_name != ''
    `).get().count;
    
    // Statistiken nach Carrier
    const byCarrier = db.prepare(`
      SELECT carrier_name, COUNT(*) as count
      FROM inbound_simple
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL
      GROUP BY carrier_name
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    // Statistiken nach Status (verwende ship_status statt status)
    const byStatus = db.prepare(`
      SELECT COALESCE(ship_status, 'Unbekannt') as status, COUNT(*) as count
      FROM inbound_simple
      WHERE ignore_flag = 0
      GROUP BY ship_status
    `).all();
    
    // Statistiken nach Bereich
    const byArea = db.prepare(`
      SELECT l.area, COUNT(*) as count
      FROM inbound_simple i
      JOIN location l ON i.location_id = l.id
      WHERE i.ignore_flag = 0
      GROUP BY l.area
      ORDER BY count DESC
    `).all();
    
    res.json({
      ok: true,
      locations: {
        total: totalLocations,
        occupied: occupiedLocations,
        empty: totalLocations - occupiedLocations
      },
      cartons: {
        total: totalCartons,
        today: todayCartons,
        week: weekCartons
      },
      ras: {
        open: openRAs,
        closed: closedRAs
      },
      // Für Frontend-Kompatibilität als Array mit length
      carriers: byCarrier,
      areas: byArea,
      byCarrier,
      byStatus,
      byArea
    });
  } catch (err) {
    console.error("Fehler bei warehouse/detailed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/trends - Lager-Trends (letzte 7 Tage)
router.get('/warehouse/trends', (req, res) => {
  try {
    const db = getDb();
    const days = 7;
    
    const inboundTrends = [];
    const movementTrends = [];
    const archiveTrends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const inboundCount = db.prepare(`
        SELECT COUNT(*) as count FROM inbound_simple 
        WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
      `).get(dateStr).count;
      
      const movementCount = db.prepare(`
        SELECT COUNT(*) as count FROM movement WHERE DATE(moved_at) = ?
      `).get(dateStr).count;
      
      const archiveCount = db.prepare(`
        SELECT COUNT(*) as count FROM archive WHERE DATE(archived_at) = ?
      `).get(dateStr).count;
      
      inboundTrends.push({ date: dateStr, count: inboundCount });
      movementTrends.push({ date: dateStr, count: movementCount });
      archiveTrends.push({ date: dateStr, count: archiveCount });
    }
    
    // Top Carrier
    const topCarriers = db.prepare(`
      SELECT carrier_name, COUNT(*) as count
      FROM inbound_simple
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL AND carrier_name != ''
      GROUP BY carrier_name
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    res.json({
      ok: true,
      inboundTrends,
      movementTrends,
      archiveTrends,
      topCarriers
    });
  } catch (err) {
    console.error("Fehler bei warehouse/trends:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/timeline - Aktivitäts-Timeline (täglich + wöchentlich)
router.get('/warehouse/timeline', (req, res) => {
  try {
    const db = getDb();
    const { days = 90 } = req.query;
    
    const daily = [];
    
    // Tägliche Aktivitäten für die letzten X Tage
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const inboundCount = db.prepare(`
        SELECT COUNT(*) as count FROM inbound_simple 
        WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
      `).get(dateStr).count;
      
      const cartonsCount = db.prepare(`
        SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple 
        WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
      `).get(dateStr).total;
      
      daily.push({
        date: dateStr,
        inbound_count: inboundCount,
        cartons: cartonsCount
      });
    }
    
    // Wöchentliche Daten (letzte 12 Wochen)
    const weekly = [];
    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const weekNum = Math.ceil((weekEnd.getDate() + new Date(weekEnd.getFullYear(), weekEnd.getMonth(), 1).getDay()) / 7);
      const weekLabel = `KW${weekNum}`;
      
      const weekData = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(actual_carton), 0) as cartons
        FROM inbound_simple 
        WHERE ignore_flag = 0 AND DATE(aufgenommen_am) BETWEEN ? AND ?
      `).get(weekStartStr, weekEndStr);
      
      weekly.push({
        week: weekLabel,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        inbound_count: weekData.count,
        cartons: weekData.cartons
      });
    }
    
    res.json({
      ok: true,
      daily,
      weekly
    });
  } catch (err) {
    console.error("Fehler bei warehouse/timeline:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/carrier-analysis - Carrier-Analyse
router.get('/warehouse/carrier-analysis', (req, res) => {
  try {
    const db = getDb();
    
    const carriers = db.prepare(`
      SELECT 
        carrier_name,
        COUNT(*) as total_entries,
        COALESCE(SUM(actual_carton), 0) as total_cartons,
        COALESCE(AVG(actual_carton), 0) as avg_cartons,
        AVG(julianday('now') - julianday(aufgenommen_am)) as avgDwellTimeDays,
        MIN(aufgenommen_am) as first_entry,
        MAX(aufgenommen_am) as last_entry
      FROM inbound_simple
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL AND carrier_name != ''
      GROUP BY carrier_name
      ORDER BY total_entries DESC
      LIMIT 15
    `).all();
    
    // Formatiere die Daten
    const formattedCarriers = carriers.map(c => ({
      carrier_name: c.carrier_name,
      total_entries: c.total_entries,
      total_cartons: c.total_cartons,
      avg_cartons: c.avg_cartons,
      avgDwellTimeDays: c.avgDwellTimeDays || 0,
      first_entry: c.first_entry,
      last_entry: c.last_entry
    }));
    
    res.json(formattedCarriers);
  } catch (err) {
    console.error("Fehler bei warehouse/carrier-analysis:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/throughput - Durchsatz-Statistiken
router.get('/warehouse/throughput', (req, res) => {
  try {
    const db = getDb();
    const { days = 30 } = req.query;
    
    // Durchschnittliche Verarbeitungszeit (Eingang bis Archivierung)
    const avgProcessingTime = db.prepare(`
      SELECT AVG(julianday(a.archived_at) - julianday(i.aufgenommen_am)) as avg_days
      FROM archive a
      JOIN inbound_simple i ON a.inbound_id = i.id
      WHERE a.archived_at IS NOT NULL AND i.aufgenommen_am IS NOT NULL
    `).get();
    
    // Durchschnittliche Verweildauer am Stellplatz
    const avgLocationDwellTime = db.prepare(`
      SELECT AVG(julianday('now') - julianday(aufgenommen_am)) as avg_days
      FROM inbound_simple
      WHERE ignore_flag = 0 AND aufgenommen_am IS NOT NULL
    `).get();
    
    // Peak-Tage (Top 10 Tage mit meisten Wareneingängen)
    const peakDays = db.prepare(`
      SELECT DATE(aufgenommen_am) as date, COUNT(*) as count, COALESCE(SUM(actual_carton), 0) as cartons
      FROM inbound_simple
      WHERE ignore_flag = 0 AND aufgenommen_am IS NOT NULL
      GROUP BY DATE(aufgenommen_am)
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    res.json({
      ok: true,
      avgProcessingTime: avgProcessingTime || { avg_days: 0 },
      avgLocationDwellTime: avgLocationDwellTime || { avg_days: 0 },
      peakDays
    });
  } catch (err) {
    console.error("Fehler bei warehouse/throughput:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/areas - Bereichs-Statistiken
router.get('/warehouse/areas', (req, res) => {
  try {
    const db = getDb();
    
    // Hole Areas sowohl aus location als auch aus inbound_simple (falls area direkt dort gespeichert ist)
    const areasFromLocations = db.prepare(`
      SELECT DISTINCT l.area
      FROM location l
      WHERE l.area IS NOT NULL AND l.area != ''
    `).all();
    
    const areasFromInbound = db.prepare(`
      SELECT DISTINCT i.area
      FROM inbound_simple i
      WHERE i.area IS NOT NULL AND i.area != '' AND i.ignore_flag = 0
    `).all();
    
    // Kombiniere beide Quellen und entferne Duplikate
    const allAreas = new Set();
    areasFromLocations.forEach(a => {
      if (a.area && a.area.trim() !== '') {
        allAreas.add(a.area.trim());
      }
    });
    areasFromInbound.forEach(a => {
      if (a.area && a.area.trim() !== '') {
        allAreas.add(a.area.trim());
      }
    });
    
    // Konvertiere Set zu Array und sortiere
    const uniqueAreas = Array.from(allAreas).sort();
    
    // Erstelle detaillierte Statistiken für jede Area
    const areas = uniqueAreas.map(areaName => {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT l.id) as totalLocations,
          COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN l.id END) as occupiedLocations,
          COUNT(i.id) as totalEntries,
          COALESCE(SUM(i.actual_carton), 0) as totalCartons
        FROM location l
        LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
        WHERE l.area = ? OR (i.area = ? AND i.ignore_flag = 0)
      `).get(areaName, areaName);
      
      return {
        area: areaName,
        name: areaName, // Für Kompatibilität
        totalLocations: stats.totalLocations || 0,
        occupiedLocations: stats.occupiedLocations || 0,
        utilizationPercent: stats.totalLocations > 0 ? Math.round((stats.occupiedLocations / stats.totalLocations) * 100) : 0,
        totalCartons: stats.totalCartons || 0,
        avgCartonsPerLocation: stats.occupiedLocations > 0 ? (stats.totalCartons / stats.occupiedLocations) : 0,
        totalEntries: stats.totalEntries || 0
      };
    });
    
    res.json(areas);
  } catch (err) {
    console.error("Fehler bei warehouse/areas:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/performance/warehouse/top-locations - Top Stellplätze
router.get('/warehouse/top-locations', (req, res) => {
  try {
    const db = getDb();
    const { limit = 10 } = req.query;
    
    const locationsRaw = db.prepare(`
      SELECT 
        l.id,
        l.code as locationCode,
        l.description,
        l.area,
        COUNT(i.id) as totalEntries,
        COALESCE(SUM(i.actual_carton), 0) as totalCartons,
        MAX(i.aufgenommen_am) as lastBooking
      FROM location l
      LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
      GROUP BY l.id
      HAVING totalEntries > 0
      ORDER BY totalCartons DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    // Füge Rang hinzu
    const locations = locationsRaw.map((loc, index) => ({
      rank: index + 1,
      locationCode: loc.locationCode,
      area: loc.area,
      totalCartons: loc.totalCartons,
      totalEntries: loc.totalEntries,
      lastBooking: loc.lastBooking
    }));
    
    res.json(locations);
  } catch (err) {
    console.error("Fehler bei warehouse/top-locations:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/performance/export - Performance-Daten exportieren (mit Charts)
router.post('/export', async (req, res) => {
  try {
    const { type = 'software', period = 'current', compare = 'none', charts = {} } = req.body;
    const ExcelJS = require('exceljs');
    const db = getDb();
    
    console.log(`📊 Starte Export: ${type}, Charts: ${Object.keys(charts).length}`);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LVS Returns';
    workbook.created = new Date();
    
    if (type === 'software') {
      // Software-Performance Export
      const sheet = workbook.addWorksheet('Software Performance');
      
      // Header-Stil
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF3A00' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      
      // Titel-Bereich
      sheet.mergeCells('A1:C1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = '💻 SOFTWARE PERFORMANCE REPORT';
      titleCell.style = {
        font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF3A00' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      sheet.getRow(1).height = 30;
      
      // Datum
      sheet.mergeCells('A2:C2');
      const dateCell = sheet.getCell('A2');
      dateCell.value = `Erstellt am: ${new Date().toLocaleString('de-DE')}`;
      dateCell.style = {
        font: { italic: true, size: 11 },
        alignment: { horizontal: 'center' }
      };
      
      // Leerzeile
      sheet.addRow([]);
      
      // System-Informationen Header
      const row4 = sheet.addRow(['Metrik', 'Wert', 'Einheit']);
      row4.eachCell((cell) => {
        cell.style = headerStyle;
      });
      
      // Spaltenbreiten
      sheet.columns = [
        { key: 'metric', width: 35 },
        { key: 'value', width: 40 },
        { key: 'unit', width: 15 }
      ];
      
      // Systemgesundheit
      const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
      const memUsage = process.memoryUsage();
      
      const addDataRow = (metric, value, unit = '') => {
        const row = sheet.addRow([metric, value, unit]);
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          if (colNumber === 1) {
            cell.font = { bold: true };
          }
        });
      };
      
      addDataRow('🟢 Server Uptime', formatUptime(uptime));
      addDataRow('💾 Heap Used', Math.round(memUsage.heapUsed / 1024 / 1024), 'MB');
      addDataRow('💾 Heap Total', Math.round(memUsage.heapTotal / 1024 / 1024), 'MB');
      addDataRow('💾 RSS Memory', Math.round(memUsage.rss / 1024 / 1024), 'MB');
      addDataRow('🖥️ Platform', os.platform());
      addDataRow('⚙️ Node Version', process.version);
      addDataRow('🔢 CPU Cores', os.cpus().length);
      addDataRow('💻 Total Memory', Math.round(os.totalmem() / 1024 / 1024), 'MB');
      addDataRow('💻 Free Memory', Math.round(os.freemem() / 1024 / 1024), 'MB');
      
      // Datenbank-Statistiken
      sheet.addRow([]); // Leerzeile
      const dbHeaderRow = sheet.addRow(['📊 DATENBANK-STATISTIKEN', '', '']);
      dbHeaderRow.eachCell((cell) => {
        cell.style = {
          font: { bold: true, size: 12, color: { argb: 'FFFF3A00' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
        };
      });
      
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      
      for (const table of tables) {
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
          addDataRow(`📋 ${table.name}`, count.count.toLocaleString('de-DE'), 'Einträge');
        } catch (err) {
          // Ignore
        }
      }
      
      // Datenbank-Größe
      try {
        const config = require('../config');
        const stats = fs.statSync(config.dbPath);
        const dbSizeKB = Math.round(stats.size / 1024);
        const dbSizeMB = (dbSizeKB / 1024).toFixed(2);
        addDataRow('💿 Datenbank-Größe', `${dbSizeKB.toLocaleString('de-DE')} KB (${dbSizeMB} MB)`);
      } catch (err) {
        // Ignore
      }
      
      // Chart einfügen (wenn vorhanden)
      if (charts.responseTimeChart) {
        sheet.addRow([]); // Leerzeile
        const chartRow = sheet.addRow(['⏱️ RESPONSE-ZEITEN CHART', '', '']);
        chartRow.eachCell((cell) => {
          cell.style = {
            font: { bold: true, size: 12, color: { argb: 'FFFF3A00' } }
          };
        });
        
        try {
          // Base64-String in Buffer konvertieren
          const base64Data = charts.responseTimeChart.replace(/^data:image\/png;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // Bild zum Workbook hinzufügen
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png'
          });
          
          // Bild in Sheet einfügen (ab nächster Zeile)
          const currentRow = sheet.rowCount + 1;
          sheet.addImage(imageId, {
            tl: { col: 0, row: currentRow },
            ext: { width: 800, height: 300 }
          });
          
          // Platz für das Bild reservieren (ca. 20 Zeilen)
          for (let i = 0; i < 20; i++) {
            sheet.addRow([]);
          }
        } catch (err) {
          console.error('Fehler beim Einfügen des Charts:', err);
          sheet.addRow(['Fehler beim Laden des Charts']);
        }
      }
      
    } else if (type === 'warehouse') {
      // Lager-Performance Export
      const sheet = workbook.addWorksheet('Lager Übersicht');
      
      // Header-Stil
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF3A00' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      
      // Titel-Bereich
      sheet.mergeCells('A1:C1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = '📦 LAGER PERFORMANCE REPORT';
      titleCell.style = {
        font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF3A00' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      sheet.getRow(1).height = 30;
      
      // Datum
      sheet.mergeCells('A2:C2');
      const dateCell = sheet.getCell('A2');
      dateCell.value = `Erstellt am: ${new Date().toLocaleString('de-DE')}`;
      dateCell.style = {
        font: { italic: true, size: 11 },
        alignment: { horizontal: 'center' }
      };
      
      // Leerzeile
      sheet.addRow([]);
      
      // Header
      const row4 = sheet.addRow(['Metrik', 'Wert', 'Details']);
      row4.eachCell((cell) => {
        cell.style = headerStyle;
      });
      
      // Spaltenbreiten
      sheet.columns = [
        { key: 'metric', width: 40 },
        { key: 'value', width: 25 },
        { key: 'details', width: 45 }
      ];
      
      // Hilfsfunktion für formatierte Zeilen
      const addDataRow = (metric, value, details = '', isHeader = false) => {
        const row = sheet.addRow([metric, value, details]);
        row.eachCell((cell, colNumber) => {
          if (isHeader) {
            cell.style = {
              font: { bold: true, size: 12, color: { argb: 'FFFF3A00' } },
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } },
              alignment: { horizontal: 'left', vertical: 'middle' }
            };
          } else {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
            };
            if (colNumber === 1) {
              cell.font = { bold: true };
            }
            if (colNumber === 2 && typeof value === 'number') {
              cell.numFmt = '#,##0';
            }
          }
        });
      };
      
      // Übersichts-Daten
      const totalInbound = db.prepare('SELECT COUNT(*) as count FROM inbound_simple WHERE ignore_flag = 0').get().count;
      const totalLocations = db.prepare('SELECT COUNT(*) as count FROM location').get().count;
      const occupiedLocations = db.prepare(`
        SELECT COUNT(DISTINCT location_id) as count FROM inbound_simple WHERE ignore_flag = 0 AND location_id IS NOT NULL
      `).get().count;
      const totalCartons = db.prepare(`
        SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple WHERE ignore_flag = 0
      `).get().total;
      const totalMovements = db.prepare('SELECT COUNT(*) as count FROM movement').get().count;
      const totalArchived = db.prepare('SELECT COUNT(*) as count FROM archive').get().count;
      
      const utilizationPercent = Math.round((occupiedLocations / totalLocations) * 100);
      
      addDataRow('📥 Gesamt Wareneingänge', totalInbound, 'Aktive Einträge im System');
      addDataRow('📍 Gesamt Stellplätze', totalLocations, `${occupiedLocations} belegt, ${totalLocations - occupiedLocations} frei`);
      addDataRow('📊 Auslastung', `${utilizationPercent}%`, `${occupiedLocations} von ${totalLocations} Stellplätzen belegt`);
      addDataRow('📦 Gesamt Kartons', totalCartons, 'Summe aller Kartons im Lager');
      addDataRow('↔️ Gesamt Umlagerungen', totalMovements, 'Alle Umlagerungen');
      addDataRow('🗂️ Gesamt Archivierungen', totalArchived, 'Archivierte Einträge');
      
      // Carrier-Analyse
      sheet.addRow([]); // Leerzeile
      addDataRow('🚚 CARRIER-ANALYSE', '', '', true);
      
      const carriers = db.prepare(`
        SELECT carrier_name, COUNT(*) as count, COALESCE(SUM(actual_carton), 0) as cartons
        FROM inbound_simple
        WHERE ignore_flag = 0 AND carrier_name IS NOT NULL
        GROUP BY carrier_name
        ORDER BY count DESC
        LIMIT 15
      `).all();
      
      carriers.forEach(c => {
        addDataRow(`📮 ${c.carrier_name}`, c.count, `${c.cartons.toLocaleString('de-DE')} Kartons`);
      });
      
      // Bereichs-Statistiken
      sheet.addRow([]); // Leerzeile
      addDataRow('📊 BEREICHS-STATISTIKEN', '', '', true);
      
      const areas = db.prepare(`
        SELECT l.area, COUNT(i.id) as count, COALESCE(SUM(i.actual_carton), 0) as cartons
        FROM location l
        LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
        WHERE l.area IS NOT NULL AND l.area != ''
        GROUP BY l.area
        ORDER BY count DESC
      `).all();
      
      areas.forEach(a => {
        addDataRow(`📍 ${a.area}`, a.count, `${a.cartons.toLocaleString('de-DE')} Kartons`);
      });
      
      // Charts einfügen
      const chartConfigs = [
        { key: 'inboundChart', title: '📥 WARENEINGANG TREND', row: null },
        { key: 'movementChart', title: '↔️ UMLAGERUNGEN TREND', row: null },
        { key: 'archiveChart', title: '🗂️ ARCHIVIERUNGEN TREND', row: null },
        { key: 'carrierChart', title: '🚚 CARRIER VERTEILUNG', row: null },
        { key: 'timelineChart', title: '📈 TIMELINE (TÄGLICH)', row: null },
        { key: 'weeklyChart', title: '📊 WÖCHENTLICHE ÜBERSICHT', row: null }
      ];
      
      for (const config of chartConfigs) {
        if (charts[config.key]) {
          sheet.addRow([]); // Leerzeile
          const chartTitleRow = sheet.addRow([config.title, '', '']);
          chartTitleRow.eachCell((cell) => {
            cell.style = {
              font: { bold: true, size: 12, color: { argb: 'FFFF3A00' } }
            };
          });
          
          try {
            // Base64-String in Buffer konvertieren
            const base64Data = charts[config.key].replace(/^data:image\/png;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            // Bild zum Workbook hinzufügen
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'png'
            });
            
            // Bild in Sheet einfügen (ab nächster Zeile)
            const currentRow = sheet.rowCount + 1;
            sheet.addImage(imageId, {
              tl: { col: 0, row: currentRow },
              ext: { width: 700, height: 250 }
            });
            
            // Platz für das Bild reservieren (ca. 17 Zeilen)
            for (let i = 0; i < 17; i++) {
              sheet.addRow([]);
            }
          } catch (err) {
            console.error(`Fehler beim Einfügen des Charts ${config.key}:`, err);
            sheet.addRow(['Fehler beim Laden des Charts']);
          }
        }
      }
      
      // Zusätzliches Daten-Sheet mit Timeline (letzte 30 Tage)
      const timelineSheet = workbook.addWorksheet('📈 Rohdaten Timeline');
      
      // Titel
      timelineSheet.mergeCells('A1:E1');
      const timelineTitleCell = timelineSheet.getCell('A1');
      timelineTitleCell.value = 'Aktivitäts-Timeline (Letzte 30 Tage)';
      timelineTitleCell.style = {
        font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF3A00' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      timelineSheet.getRow(1).height = 25;
      
      timelineSheet.addRow([]);
      
      // Header
      const timelineHeaderRow = timelineSheet.addRow(['Datum', 'Wareneingänge', 'Kartons', 'Umlagerungen', 'Archivierungen']);
      timelineHeaderRow.eachCell((cell) => {
        cell.style = headerStyle;
      });
      
      timelineSheet.columns = [
        { key: 'date', width: 15 },
        { key: 'inbound', width: 18 },
        { key: 'cartons', width: 15 },
        { key: 'movements', width: 18 },
        { key: 'archived', width: 18 }
      ];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const inboundCount = db.prepare(`
          SELECT COUNT(*) as count FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
        `).get(dateStr).count;
        
        const cartonsCount = db.prepare(`
          SELECT COALESCE(SUM(actual_carton), 0) as total FROM inbound_simple WHERE ignore_flag = 0 AND DATE(aufgenommen_am) = ?
        `).get(dateStr).total;
        
        const movementsCount = db.prepare(`
          SELECT COUNT(*) as count FROM movement WHERE DATE(moved_at) = ?
        `).get(dateStr).count;
        
        const archivedCount = db.prepare(`
          SELECT COUNT(*) as count FROM archive WHERE DATE(archived_at) = ?
        `).get(dateStr).count;
        
        const dataRow = timelineSheet.addRow([dateStr, inboundCount, cartonsCount, movementsCount, archivedCount]);
        dataRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          if (colNumber > 1) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          }
        });
      }
    }
    
    // Excel-Datei senden
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Performance_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('Fehler beim Performance-Export:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// HILFSFUNKTIONEN
// ============================================

// Hilfsfunktion: Uptime formatieren
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// GET /api/performance/warehouse/ra-status - RA-Status-Übersicht
router.get('/warehouse/ra-status', (req, res) => {
  try {
    const db = getDb();
    const { area } = req.query;
    
    // Status-Mapping basierend auf ship_status und mh_status
    let sql = `
      SELECT 
        CASE 
          WHEN ship_status = 'In Transit' THEN 'inTransit'
          WHEN ship_status = 'In Receiving' THEN 'inReceiving'
          WHEN ship_status = 'Cancelled' THEN 'cancelled'
          WHEN asn_ra_no IS NULL OR asn_ra_no = '' THEN 'notFound'
          WHEN mh_status = 'Verifiziert' OR ship_status = 'Verifiziert' THEN 'verified'
          ELSE 'other'
        END as status,
        COUNT(*) as count
      FROM inbound_simple
      WHERE ignore_flag = 0
    `;
    
    const params = [];
    if (area && area.trim() !== '') {
      // Prüfe ob area direkt in inbound_simple oder über location verfügbar ist
      sql += ` AND (area = ? OR EXISTS (SELECT 1 FROM location l WHERE l.id = inbound_simple.location_id AND l.area = ?))`;
      params.push(area.trim(), area.trim());
    }
    
    sql += ` GROUP BY status`;
    
    const results = db.prepare(sql).all(...params);
    
    // Gesamtanzahl für Prozentberechnung
    let totalSql = `SELECT COUNT(*) as total FROM inbound_simple WHERE ignore_flag = 0`;
    const totalParams = [];
    if (area && area.trim() !== '') {
      totalSql += ` AND (area = ? OR EXISTS (SELECT 1 FROM location l WHERE l.id = inbound_simple.location_id AND l.area = ?))`;
      totalParams.push(area.trim(), area.trim());
    }
    const totalResult = db.prepare(totalSql).get(...totalParams);
    const total = totalResult?.total || 0;
    
    // Initialisiere Zähler
    const stats = {
      total: total,
      inTransit: 0,
      inReceiving: 0,
      cancelled: 0,
      notFound: 0,
      verified: 0,
      other: 0
    };
    
    // Zähle Ergebnisse
    results.forEach(row => {
      const count = row.count || 0;
      
      switch (row.status) {
        case 'inTransit':
          stats.inTransit = count;
          break;
        case 'inReceiving':
          stats.inReceiving = count;
          break;
        case 'cancelled':
          stats.cancelled = count;
          break;
        case 'notFound':
          stats.notFound = count;
          break;
        case 'verified':
          stats.verified = count;
          break;
        default:
          stats.other += count;
      }
    });
    
    res.json({
      ok: true,
      stats,
      area: area || null
    });
  } catch (err) {
    console.error("Fehler bei warehouse/ra-status:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
