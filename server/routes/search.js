// LVS Returns - Global Search API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/search/global - Globale Suche über alle Tabellen
router.get('/global', (req, res) => {
  try {
    const db = getDb();
    const { q, limit = 50 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ 
        ok: true, 
        results: {
          inbound: [],
          locations: [],
          movements: [],
          archives: [],
          audit: [],
          carriers: []
        },
        total: 0
      });
    }
    
    // Mehrfachsuche: Unterstützt Komma oder Semikolon als Trennzeichen
    const searchTerms = q.trim()
      .split(/[,;]/)
      .map(term => term.trim())
      .filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      return res.json({ 
        ok: true, 
        results: { inbound: [], locations: [], movements: [], archives: [], audit: [], carriers: [] },
        total: 0
      });
    }
    
    const searchLimit = Math.min(parseInt(limit) || 50, 100);
    
    // Hilfsfunktion: WHERE-Bedingung für mehrere Suchbegriffe (AND)
    const buildWhereClause = (fields) => {
      const conditions = searchTerms.map(() => {
        const fieldConditions = fields.map(f => `${f} LIKE ?`).join(' OR ');
        return `(${fieldConditions})`;
      });
      return conditions.join(' AND ');
    };
    
    // Parameter-Array erstellen
    const buildParams = (fields) => {
      const params = [];
      for (const term of searchTerms) {
        const searchTerm = `%${term}%`;
        for (const field of fields) {
          params.push(searchTerm);
        }
      }
      return params;
    };
    
    const results = {
      inbound: [],
      locations: [],
      movements: [],
      archives: [],
      audit: [],
      carriers: []
    };
    
    // 1. Wareneingänge durchsuchen
    try {
      const inboundFields = [
        'i.cw', 'i.olpn', 'i.carrier_tracking_nr', 'i.carrier_name',
        'i.customer_name', 'i.asn_ra_no', 'i.customer_id', 'i.land',
        'i.area', 'i.kommentar', 'l.code', 'l.description'
      ];
      const inboundWhere = buildWhereClause(inboundFields);
      const inboundParams = [...buildParams(inboundFields), searchLimit];
      
      const inboundResults = db.prepare(`
        SELECT 
          i.id, i.cw, i.olpn, i.carrier_tracking_nr, i.carrier_name,
          i.customer_name, i.asn_ra_no, i.customer_id, i.land, i.area,
          i.actual_carton, i.created_at,
          l.code as location_code, l.description as location_description
        FROM inbound_simple i
        LEFT JOIN location l ON i.location_id = l.id
        WHERE i.ignore_flag = 0 AND (${inboundWhere})
        ORDER BY i.created_at DESC
        LIMIT ?
      `).all(...inboundParams);
      
      results.inbound = inboundResults.map(row => ({
        type: 'wareneingang',
        id: row.id,
        title: row.cw || row.olpn || row.carrier_tracking_nr || `#${row.id}`,
        subtitle: `${row.carrier_name || ''} ${row.customer_name || ''}`.trim() || 'Keine Details',
        details: {
          cw: row.cw, olpn: row.olpn, tracking: row.carrier_tracking_nr,
          carrier: row.carrier_name, customer: row.customer_name,
          asn_ra: row.asn_ra_no, location: row.location_code,
          cartons: row.actual_carton, created: row.created_at
        },
        link: `/lagerbestand?highlight=${row.id}`
      }));
    } catch (err) {
      console.error('Fehler bei Wareneingang-Suche:', err);
    }
    
    // 2. Stellplätze durchsuchen
    try {
      const locationFields = ['l.code', 'l.description', 'l.area'];
      const locationWhere = buildWhereClause(locationFields);
      const locationParams = [...buildParams(locationFields), searchLimit];
      
      const locationResults = db.prepare(`
        SELECT 
          l.id, l.code, l.description, l.area, l.is_active,
          COUNT(DISTINCT i.id) as carton_count,
          SUM(i.actual_carton) as total_cartons
        FROM location l
        LEFT JOIN inbound_simple i ON l.id = i.location_id AND i.ignore_flag = 0
        WHERE (${locationWhere})
        GROUP BY l.id, l.code, l.description, l.area, l.is_active
        ORDER BY l.code
        LIMIT ?
      `).all(...locationParams);
      
      results.locations = locationResults.map(row => ({
        type: 'stellplatz',
        id: row.id,
        title: row.code,
        subtitle: row.description || row.area || 'Keine Beschreibung',
        details: {
          code: row.code, description: row.description, area: row.area,
          is_active: row.is_active, carton_count: row.carton_count,
          total_cartons: row.total_cartons || 0
        },
        link: `/lagerbestand?location=${row.id}`
      }));
    } catch (err) {
      console.error('Fehler bei Stellplatz-Suche:', err);
    }
    
    // 3. Umlagerungen durchsuchen
    try {
      const movementFields = [
        'l_from.code', 'l_to.code', 'i.olpn', 'i.carrier_tracking_nr',
        'i.cw', 'm.moved_by', 'm.reason'
      ];
      const movementWhere = buildWhereClause(movementFields);
      const movementParams = [...buildParams(movementFields), searchLimit];
      
      const movementResults = db.prepare(`
        SELECT 
          m.id, m.inbound_id, m.moved_at, m.moved_by, m.reason,
          l_from.code as from_location, l_to.code as to_location,
          i.olpn, i.carrier_tracking_nr, i.cw
        FROM movement m
        LEFT JOIN location l_from ON m.from_location_id = l_from.id
        LEFT JOIN location l_to ON m.to_location_id = l_to.id
        LEFT JOIN inbound_simple i ON m.inbound_id = i.id
        WHERE (${movementWhere})
        ORDER BY m.moved_at DESC
        LIMIT ?
      `).all(...movementParams);
      
      results.movements = movementResults.map(row => ({
        type: 'umlagerung',
        id: row.id,
        title: `${row.from_location || '?'} → ${row.to_location || '?'}`,
        subtitle: row.cw || row.olpn || `#${row.inbound_id}`,
        details: {
          inbound_id: row.inbound_id, from_location: row.from_location,
          to_location: row.to_location, moved_by: row.moved_by,
          moved_at: row.moved_at, reason: row.reason
        },
        link: `/umlagerung?highlight=${row.id}`
      }));
    } catch (err) {
      console.error('Fehler bei Umlagerungs-Suche:', err);
    }
    
    // 4. Archive durchsuchen
    try {
      const archiveFields = ['i.cw', 'i.olpn', 'i.carrier_tracking_nr', 'a.reason', 'a.notes'];
      const archiveWhere = buildWhereClause(archiveFields);
      const archiveParams = [...buildParams(archiveFields), searchLimit];
      
      const archiveResults = db.prepare(`
        SELECT 
          a.id, a.inbound_id, a.archived_at, a.archived_by, a.reason, a.notes,
          i.cw, i.olpn, i.carrier_tracking_nr
        FROM archive a
        LEFT JOIN inbound_simple i ON a.inbound_id = i.id
        WHERE (${archiveWhere})
        ORDER BY a.archived_at DESC
        LIMIT ?
      `).all(...archiveParams);
      
      results.archives = archiveResults.map(row => ({
        type: 'archiv',
        id: row.id,
        title: row.cw || row.olpn || `#${row.inbound_id}`,
        subtitle: row.reason || 'Archiviert',
        details: {
          inbound_id: row.inbound_id, archived_by: row.archived_by,
          archived_at: row.archived_at, reason: row.reason, notes: row.notes
        },
        link: `/archive?highlight=${row.id}`
      }));
    } catch (err) {
      console.error('Fehler bei Archiv-Suche:', err);
    }
    
    // 5. Carrier durchsuchen
    try {
      const carrierFields = ['name', 'display_name', 'country'];
      const carrierWhere = buildWhereClause(carrierFields);
      const carrierParams = [...buildParams(carrierFields), searchLimit];
      
      const carrierResults = db.prepare(`
        SELECT id, name, display_name, country, is_active
        FROM carrier
        WHERE (${carrierWhere})
        ORDER BY display_name
        LIMIT ?
      `).all(...carrierParams);
      
      results.carriers = carrierResults.map(row => ({
        type: 'carrier',
        id: row.id,
        title: row.display_name,
        subtitle: `${row.name} - ${row.country || 'Kein Land'}`,
        details: {
          name: row.name, display_name: row.display_name,
          country: row.country, is_active: row.is_active
        },
        link: `/einstellungen?tab=carrier&carrier=${row.id}`
      }));
    } catch (err) {
      console.error('Fehler bei Carrier-Suche:', err);
    }
    
    const total = 
      results.inbound.length + results.locations.length + results.movements.length +
      results.archives.length + results.audit.length + results.carriers.length;
    
    res.json({
      ok: true,
      query: q.trim(),
      searchTerms,
      results,
      total,
      counts: {
        inbound: results.inbound.length,
        locations: results.locations.length,
        movements: results.movements.length,
        archives: results.archives.length,
        audit: results.audit.length,
        carriers: results.carriers.length
      }
    });
  } catch (err) {
    console.error("Fehler bei globaler Suche:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
