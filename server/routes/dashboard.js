// LVS Returns - Dashboard API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { getStatements } = require('../database/statements');
const { getCached } = require('../utils/cache');

// GET /api/dashboard/stats - Dashboard Statistiken
router.get('/stats', (req, res) => {
  try {
    const stmts = getStatements();
    
    const stats = getCached('dashboard-stats', () => ({
      totalLocations: stmts.dashboardStats.totalLocations.get().c,
      occupiedLocations: stmts.dashboardStats.occupiedLocations.get().c,
      totalCartons: stmts.dashboardStats.totalCartons.get().total || 0,
      totalEntries: stmts.dashboardStats.totalEntries.get().c,
      openRAs: stmts.dashboardStats.openRAs.get().c,
      unclearRAs: stmts.dashboardStats.unclearRAs.get().c
    }), 30000); // 30 Sekunden Cache
    
    stats.utilizationPercent = stats.totalLocations > 0 
      ? Math.round((stats.occupiedLocations / stats.totalLocations) * 100) 
      : 0;
    
    res.json(stats);
  } catch (err) {
    console.error("Fehler beim Abrufen der Dashboard-Statistiken:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/recent-activity - Letzte Aktivitäten
router.get('/recent-activity', (req, res) => {
  try {
    const db = getDb();
    const { limit = 20 } = req.query;
    
    const activities = [];
    
    // Letzte Wareneingänge
    const inbounds = db.prepare(`
      SELECT id, cw, olpn, carrier_name, created_at, 'inbound' as type
      FROM inbound_simple
      WHERE ignore_flag = 0
      ORDER BY created_at DESC
      LIMIT ?
    `).all(Math.ceil(parseInt(limit) / 3));
    
    activities.push(...inbounds.map(i => ({
      type: 'inbound',
      id: i.id,
      title: i.cw || i.olpn || `#${i.id}`,
      subtitle: i.carrier_name || 'Wareneingang',
      timestamp: i.created_at
    })));
    
    // Letzte Umlagerungen
    const movements = db.prepare(`
      SELECT m.id, m.moved_at, l_from.code as from_loc, l_to.code as to_loc, 'movement' as type
      FROM movement m
      LEFT JOIN location l_from ON m.from_location_id = l_from.id
      LEFT JOIN location l_to ON m.to_location_id = l_to.id
      ORDER BY m.moved_at DESC
      LIMIT ?
    `).all(Math.ceil(parseInt(limit) / 3));
    
    activities.push(...movements.map(m => ({
      type: 'movement',
      id: m.id,
      title: `${m.from_loc || '?'} → ${m.to_loc || '?'}`,
      subtitle: 'Umlagerung',
      timestamp: m.moved_at
    })));
    
    // Letzte Archivierungen
    const archives = db.prepare(`
      SELECT a.id, a.archived_at, a.reason, i.cw, i.olpn, 'archive' as type
      FROM archive a
      LEFT JOIN inbound_simple i ON a.inbound_id = i.id
      ORDER BY a.archived_at DESC
      LIMIT ?
    `).all(Math.ceil(parseInt(limit) / 3));
    
    activities.push(...archives.map(a => ({
      type: 'archive',
      id: a.id,
      title: a.cw || a.olpn || `#${a.id}`,
      subtitle: a.reason || 'Archiviert',
      timestamp: a.archived_at
    })));
    
    // Nach Timestamp sortieren
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(activities.slice(0, parseInt(limit)));
  } catch (err) {
    console.error("Fehler beim Abrufen der letzten Aktivitäten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/carrier-distribution - Carrier-Verteilung
router.get('/carrier-distribution', (req, res) => {
  try {
    const db = getDb();
    
    const distribution = db.prepare(`
      SELECT 
        carrier_name,
        COUNT(*) as count,
        SUM(actual_carton) as total_cartons
      FROM inbound_simple
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL AND carrier_name != ''
      GROUP BY carrier_name
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    res.json(distribution);
  } catch (err) {
    console.error("Fehler beim Abrufen der Carrier-Verteilung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/area-distribution - Area-Verteilung
router.get('/area-distribution', (req, res) => {
  try {
    const db = getDb();
    
    const distribution = db.prepare(`
      SELECT 
        l.area,
        COUNT(DISTINCT l.id) as location_count,
        COUNT(DISTINCT i.id) as entry_count,
        SUM(i.actual_carton) as total_cartons
      FROM location l
      LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
      WHERE l.is_active = 1 AND l.area IS NOT NULL AND l.area != ''
      GROUP BY l.area
      ORDER BY entry_count DESC
    `).all();
    
    res.json(distribution);
  } catch (err) {
    console.error("Fehler beim Abrufen der Area-Verteilung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/trends - Trend-Daten für Charts
router.get('/trends', (req, res) => {
  try {
    const db = getDb();
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Wareneingänge pro Tag
    const inboundTrends = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM inbound_simple
      WHERE created_at >= ? AND ignore_flag = 0
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(startDateStr);
    
    // Umlagerungen pro Tag
    const movementTrends = db.prepare(`
      SELECT 
        DATE(moved_at) as date,
        COUNT(*) as count
      FROM movement
      WHERE moved_at >= ?
      GROUP BY DATE(moved_at)
      ORDER BY date
    `).all(startDateStr);
    
    res.json({
      inbound: inboundTrends,
      movements: movementTrends
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Trends:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/charts/week - Wochendaten für Chart
router.get('/charts/week', (req, res) => {
  try {
    const db = getDb();
    // Letzte 8 Wochen anzeigen
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 56); // 8 Wochen = 56 Tage
    const weekStartStr = weekStart.toISOString();
    
    // Versuche zuerst das cw-Feld zu verwenden, sonst berechne aus Datum
    const data = db.prepare(`
      SELECT 
        cw,
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(actual_carton) as cartons
      FROM inbound_simple
      WHERE created_at >= ? AND ignore_flag = 0
      GROUP BY cw, DATE(created_at)
      ORDER BY date
    `).all(weekStartStr);
    
    // Format für Chart.js: Kalenderwochen gruppieren
    const weekData = {};
    data.forEach(row => {
      let weekLabel;
      
      // Verwende cw-Feld falls vorhanden, sonst berechne aus Datum
      if (row.cw && row.cw.trim() !== '') {
        // cw kann "CW 45" oder "45" sein
        const cwMatch = row.cw.match(/(\d+)/);
        if (cwMatch) {
          weekLabel = `CW ${cwMatch[1]}`;
        } else {
          weekLabel = row.cw;
        }
      } else {
        // Berechne Kalenderwoche aus Datum
        const date = new Date(row.date);
        const week = getWeekNumber(date);
        weekLabel = `CW ${week}`;
      }
      
      if (!weekData[weekLabel]) {
        weekData[weekLabel] = 0;
      }
      weekData[weekLabel] += row.count;
    });
    
    // Sortiere nach Kalenderwoche (numerisch)
    const sortedWeeks = Object.keys(weekData).sort((a, b) => {
      const weekA = parseInt(a.replace(/[^\d]/g, '')) || 0;
      const weekB = parseInt(b.replace(/[^\d]/g, '')) || 0;
      return weekA - weekB;
    });
    
    // Nur die letzten 8 Wochen anzeigen
    const recentWeeks = sortedWeeks.slice(-8);
    
    res.json({
      labels: recentWeeks,
      data: recentWeeks.map(week => weekData[week])
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Wochendaten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Hilfsfunktion: Kalenderwoche berechnen (ISO 8601)
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// GET /api/dashboard/charts/carrier - Carrier-Verteilung für Chart
router.get('/charts/carrier', (req, res) => {
  try {
    const db = getDb();
    
    const data = db.prepare(`
      SELECT 
        carrier_name as label,
        COUNT(*) as value,
        SUM(actual_carton) as cartons
      FROM inbound_simple
      WHERE ignore_flag = 0 AND carrier_name IS NOT NULL AND carrier_name != ''
      GROUP BY carrier_name
      ORDER BY value DESC
      LIMIT 10
    `).all();
    
    // Format für Chart.js
    res.json({
      labels: data.map(d => d.label || 'Unbekannt'),
      data: data.map(d => d.value)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Carrier-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/charts/status - Status-Verteilung für Chart
router.get('/charts/status', (req, res) => {
  try {
    const db = getDb();
    
    const data = db.prepare(`
      SELECT 
        COALESCE(mh_status, 'Unbekannt') as label,
        COUNT(*) as value
      FROM inbound_simple
      WHERE ignore_flag = 0
      GROUP BY mh_status
      ORDER BY value DESC
    `).all();
    
    // Format für Chart.js
    res.json({
      labels: data.map(d => d.label),
      data: data.map(d => d.value)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Status-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/charts/area - Retouren nach Area für Chart
router.get('/charts/area', (req, res) => {
  try {
    const db = getDb();
    
    const data = db.prepare(`
      SELECT 
        COALESCE(l.area, 'Ohne Area') as label,
        COUNT(i.id) as value,
        SUM(i.actual_carton) as cartons
      FROM inbound_simple i
      LEFT JOIN location l ON i.location_id = l.id
      WHERE i.ignore_flag = 0
      GROUP BY l.area
      ORDER BY value DESC
      LIMIT 10
    `).all();
    
    res.json({
      labels: data.map(d => d.label),
      data: data.map(d => d.value)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Area-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/charts/locations - Top Stellplätze für Chart
router.get('/charts/locations', (req, res) => {
  try {
    const db = getDb();
    
    const data = db.prepare(`
      SELECT 
        COALESCE(l.code, 'Unbekannt') as label,
        COUNT(i.id) as entries,
        SUM(COALESCE(i.actual_carton, 0)) as value
      FROM inbound_simple i
      LEFT JOIN location l ON i.location_id = l.id
      WHERE i.ignore_flag = 0 AND l.code IS NOT NULL
      GROUP BY l.id
      ORDER BY value DESC
      LIMIT 8
    `).all();
    
    res.json({
      labels: data.map(d => d.label),
      data: data.map(d => d.value)
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Location-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
