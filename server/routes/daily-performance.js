// LVS Returns - Daily Performance API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/daily-performance - Alle täglichen Performance-Daten abrufen
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { startDate, endDate, limit = 100 } = req.query;
    
    let sql = 'SELECT * FROM daily_performance WHERE 1=1';
    const params = [];
    
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY date DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const data = db.prepare(sql).all(...params);
    
    res.json({
      ok: true,
      data: data,
      count: data.length
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der täglichen Performance-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/daily-performance/:date - Performance-Daten für ein bestimmtes Datum
router.get('/:date', (req, res) => {
  try {
    const db = getDb();
    const { date } = req.params;
    
    const data = db.prepare('SELECT * FROM daily_performance WHERE date = ?').get(date);
    
    if (!data) {
      // Erstelle leeren Eintrag für das Datum
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const dateObj = new Date(date);
      const dayName = dayNames[dateObj.getDay()];
      
      res.json({
        ok: true,
        data: {
          date: date,
          day_name: dayName,
          start_volume: null,
          rest_volume: 0,
          actual_in_vol_cartons: 0,
          planned_fte: 30,
          planned_hours: 225,
          planned_volume: 6300,
          actual_am_hours: 0,
          actual_pm_hours: 0,
          actual_fte: 0,
          actual_volume: 0,
          rate: 0,
          comment: '',
          created_at: null,
          updated_at: null,
          created_by: null
        },
        isNew: true
      });
      return;
    }
    
    res.json({
      ok: true,
      data: data,
      isNew: false
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Performance-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/daily-performance - Neue Performance-Daten erstellen oder aktualisieren
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const {
      date,
      day_name,
      start_volume,
      rest_volume,
      actual_in_vol_cartons,
      planned_fte,
      planned_hours,
      planned_volume,
      actual_am_hours,
      actual_pm_hours,
      actual_fte,
      actual_volume,
      rate,
      comment
    } = req.body;
    
    if (!date) {
      return res.status(400).json({ ok: false, error: 'Datum ist erforderlich' });
    }
    
    const now = new Date().toISOString();
    const username = req.headers['x-username'] || 'system';
    
    // Prüfe ob Eintrag bereits existiert
    const existing = db.prepare('SELECT id FROM daily_performance WHERE date = ?').get(date);
    
    // Berechne Rest Volume automatisch wenn Start Volume gesetzt ist
    let calculatedRestVolume = rest_volume;
    if (start_volume && start_volume > 0) {
      // Summiere alle Actual Volumes von Start bis zu diesem Datum
      const allData = db.prepare(`
        SELECT actual_volume, date 
        FROM daily_performance 
        WHERE date <= ? 
        ORDER BY date ASC
      `).all(date);
      
      const totalActualVolume = allData.reduce((sum, row) => sum + (parseInt(row.actual_volume) || 0), 0);
      // Füge das aktuelle Actual Volume hinzu (falls es sich ändert)
      const currentActualVolume = parseInt(actual_volume) || 0;
      const previousActualVolume = existing ? (db.prepare('SELECT actual_volume FROM daily_performance WHERE date = ?').get(date)?.actual_volume || 0) : 0;
      const adjustedTotal = totalActualVolume - previousActualVolume + currentActualVolume;
      
      calculatedRestVolume = Math.max(0, start_volume - adjustedTotal);
    }
    
    if (existing) {
      // Update - start_volume setzen wenn es im Request vorhanden ist
      const hasStartVolumeInRequest = 'start_volume' in req.body;
      
      let updateStmt;
      let params;
      
      if (hasStartVolumeInRequest) {
        // start_volume wurde explizit übergeben (kann auch null sein)
        updateStmt = db.prepare(`
          UPDATE daily_performance SET
            day_name = ?,
            start_volume = ?,
            rest_volume = ?,
            actual_in_vol_cartons = ?,
            planned_fte = ?,
            planned_hours = ?,
            planned_volume = ?,
            actual_am_hours = ?,
            actual_pm_hours = ?,
            actual_fte = ?,
            actual_volume = ?,
            rate = ?,
            comment = ?,
            updated_at = ?,
            created_by = COALESCE(created_by, ?)
          WHERE date = ?
        `);
        
        params = [
          day_name || null,
          start_volume || null, // Kann null sein, wird explizit gesetzt
          calculatedRestVolume,
          actual_in_vol_cartons || 0,
          planned_fte || 30,
          planned_hours || 225,
          planned_volume || 6300,
          actual_am_hours || 0,
          actual_pm_hours || 0,
          actual_fte || 0,
          actual_volume || 0,
          rate || 0,
          comment || '',
          now,
          username,
          date
        ];
      } else {
        // start_volume nicht im Request, behalte alten Wert
        updateStmt = db.prepare(`
          UPDATE daily_performance SET
            day_name = ?,
            rest_volume = ?,
            actual_in_vol_cartons = ?,
            planned_fte = ?,
            planned_hours = ?,
            planned_volume = ?,
            actual_am_hours = ?,
            actual_pm_hours = ?,
            actual_fte = ?,
            actual_volume = ?,
            rate = ?,
            comment = ?,
            updated_at = ?,
            created_by = COALESCE(created_by, ?)
          WHERE date = ?
        `);
        
        params = [
          day_name || null,
          calculatedRestVolume,
          actual_in_vol_cartons || 0,
          planned_fte || 30,
          planned_hours || 225,
          planned_volume || 6300,
          actual_am_hours || 0,
          actual_pm_hours || 0,
          actual_fte || 0,
          actual_volume || 0,
          rate || 0,
          comment || '',
          now,
          username,
          date
        ];
      }
      
      updateStmt.run(...params);
      
      // Aktualisiere alle nachfolgenden Tage
      updateSubsequentDays(db, date, hasStartVolumeInRequest ? start_volume : undefined);
      
      res.json({
        ok: true,
        message: 'Performance-Daten aktualisiert',
        date: date,
        calculated_rest_volume: calculatedRestVolume
      });
    } else {
      // Insert
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const dateObj = new Date(date);
      const dayName = dayNames[dateObj.getDay()];
      
      db.prepare(`
        INSERT INTO daily_performance (
          date, day_name, start_volume, rest_volume, actual_in_vol_cartons,
          planned_fte, planned_hours, planned_volume,
          actual_am_hours, actual_pm_hours, actual_fte, actual_volume,
          rate, comment, created_at, updated_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        date,
        dayName,
        start_volume || null,
        calculatedRestVolume,
        actual_in_vol_cartons || 0,
        planned_fte || 30,
        planned_hours || 225,
        planned_volume || 6300,
        actual_am_hours || 0,
        actual_pm_hours || 0,
        actual_fte || 0,
        actual_volume || 0,
        rate || 0,
        comment || '',
        now,
        now,
        username
      );
      
      // Aktualisiere alle nachfolgenden Tage
      updateSubsequentDays(db, date, start_volume);
      
      res.json({
        ok: true,
        message: 'Performance-Daten erstellt',
        date: date,
        calculated_rest_volume: calculatedRestVolume
      });
    }
  } catch (err) {
    console.error("Fehler beim Speichern der Performance-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Hilfsfunktion: Aktualisiert Rest Volume für alle nachfolgenden Tage
function updateSubsequentDays(db, currentDate, startVolume) {
  try {
    // Finde das Start Volume (vom aktuellen Tag oder vom ersten Tag mit Start Volume)
    let baseStartVolume = startVolume;
    if (!baseStartVolume) {
      const firstWithStart = db.prepare(`
        SELECT start_volume, date 
        FROM daily_performance 
        WHERE start_volume IS NOT NULL AND start_volume > 0
        ORDER BY date ASC 
        LIMIT 1
      `).get();
      
      if (firstWithStart) {
        baseStartVolume = firstWithStart.start_volume;
      } else {
        return; // Kein Start Volume gefunden, nichts zu aktualisieren
      }
    }
    
    // Hole alle Daten ab dem ersten Tag mit Start Volume
    const firstDate = db.prepare(`
      SELECT date 
      FROM daily_performance 
      WHERE start_volume IS NOT NULL AND start_volume > 0
      ORDER BY date ASC 
      LIMIT 1
    `).get();
    
    if (!firstDate) return;
    
    const allData = db.prepare(`
      SELECT date, actual_volume 
      FROM daily_performance 
      WHERE date >= ?
      ORDER BY date ASC
    `).all(firstDate.date);
    
    // Berechne Rest Volume für jeden Tag
    let cumulativeActual = 0;
    const updateStmt = db.prepare(`
      UPDATE daily_performance 
      SET rest_volume = ? 
      WHERE date = ?
    `);
    
    allData.forEach(row => {
      cumulativeActual += (parseInt(row.actual_volume) || 0);
      const restVolume = Math.max(0, baseStartVolume - cumulativeActual);
      updateStmt.run(restVolume, row.date);
    });
  } catch (err) {
    console.error("Fehler beim Aktualisieren nachfolgender Tage:", err);
  }
}

// PUT /api/daily-performance/:date - Performance-Daten aktualisieren
router.put('/:date', (req, res) => {
  try {
    const db = getDb();
    const { date } = req.params;
    const {
      day_name,
      rest_volume,
      actual_in_vol_cartons,
      planned_fte,
      planned_hours,
      planned_volume,
      actual_am_hours,
      actual_pm_hours,
      actual_fte,
      actual_volume,
      rate,
      comment
    } = req.body;
    
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      UPDATE daily_performance SET
        day_name = ?,
        rest_volume = ?,
        actual_in_vol_cartons = ?,
        planned_fte = ?,
        planned_hours = ?,
        planned_volume = ?,
        actual_am_hours = ?,
        actual_pm_hours = ?,
        actual_fte = ?,
        actual_volume = ?,
        rate = ?,
        comment = ?,
        updated_at = ?
      WHERE date = ?
    `).run(
      day_name || null,
      rest_volume || 0,
      actual_in_vol_cartons || 0,
      planned_fte || 30,
      planned_hours || 225,
      planned_volume || 6300,
      actual_am_hours || 0,
      actual_pm_hours || 0,
      actual_fte || 0,
      actual_volume || 0,
      rate || 0,
      comment || '',
      now,
      date
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: 'Eintrag nicht gefunden' });
    }
    
    res.json({
      ok: true,
      message: 'Performance-Daten aktualisiert',
      date: date
    });
  } catch (err) {
    console.error("Fehler beim Aktualisieren der Performance-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/daily-performance/:date - Performance-Daten löschen
router.delete('/:date', (req, res) => {
  try {
    const db = getDb();
    const { date } = req.params;
    
    const result = db.prepare('DELETE FROM daily_performance WHERE date = ?').run(date);
    
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: 'Eintrag nicht gefunden' });
    }
    
    res.json({
      ok: true,
      message: 'Performance-Daten gelöscht',
      date: date
    });
  } catch (err) {
    console.error("Fehler beim Löschen der Performance-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/daily-performance/stats/summary - Zusammenfassung
router.get('/stats/summary', (req, res) => {
  try {
    const db = getDb();
    const { startDate, endDate } = req.query;
    
    let sql = 'SELECT * FROM daily_performance WHERE 1=1';
    const params = [];
    
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY date DESC';
    
    const data = db.prepare(sql).all(...params);
    
    const totalPlanned = data.reduce((sum, d) => sum + (d.planned_volume || 0), 0);
    const totalActual = data.reduce((sum, d) => sum + (d.actual_volume || 0), 0);
    const totalPlannedHours = data.reduce((sum, d) => sum + (d.planned_hours || 0), 0);
    const totalActualHours = data.reduce((sum, d) => sum + (d.actual_am_hours || 0) + (d.actual_pm_hours || 0), 0);
    
    res.json({
      ok: true,
      summary: {
        totalDays: data.length,
        totalPlannedVolume: totalPlanned,
        totalActualVolume: totalActual,
        totalPlannedHours: totalPlannedHours,
        totalActualHours: totalActualHours,
        averageRate: data.length > 0 
          ? data.reduce((sum, d) => sum + (d.rate || 0), 0) / data.length 
          : 0,
        percentageFromTotal: totalPlanned > 0 
          ? Math.round((totalActual / totalPlanned) * 100) 
          : 0
      },
      data: data
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Zusammenfassung:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/daily-performance/seed - Test-Daten erstellen
router.post('/seed', (req, res) => {
  try {
    const db = getDb();
    const { days = 30 } = req.query;
    const now = new Date().toISOString();
    const username = req.headers['x-username'] || 'system';
    
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    let created = 0;
    let updated = 0;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO daily_performance (
        date, day_name, rest_volume, actual_in_vol_cartons,
        planned_fte, planned_hours, planned_volume,
        actual_am_hours, actual_pm_hours, actual_fte, actual_volume,
        rate, comment, created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Generiere Test-Daten für die letzten X Tage
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const isWeekend = dayName === 'So' || dayName === 'Sa';
      
      // Überspringe Wochenenden oder setze niedrige Werte
      if (isWeekend) {
        const result = stmt.run(
          dateStr, dayName, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', now, now, username
        );
        if (result.changes > 0) created++;
        continue;
      }
      
      // Generiere realistische Test-Daten
      const baseVolume = 280000 + Math.random() * 20000; // 280k-300k
      const restVolume = Math.round(baseVolume);
      
      const actualInVol = Math.round(150 + Math.random() * 500); // 150-650
      
      const plannedFte = 30;
      const plannedHours = 225;
      const plannedVolume = 6300;
      
      // Variiere AM/PM Stunden
      const actualAmHours = Math.round(110 + Math.random() * 20); // 110-130
      const actualPmHours = Math.round(85 + Math.random() * 25); // 85-110
      const actualFte = Math.round(28 + Math.random() * 3); // 28-30
      
      // Actual Volume variiert basierend auf Stunden
      const totalHours = actualAmHours + actualPmHours;
      const avgRate = 15 + Math.random() * 5; // 15-20 Units/Stunde
      const actualVolume = Math.round(totalHours * avgRate);
      
      // Rate berechnen
      const rate = totalHours > 0 ? (actualVolume / totalHours) : 0;
      
      // Kommentare variieren
      const comments = [
        '',
        'Polnish Units inducted',
        '1st Time NOK and Swe. booked different',
        'Spätschicht hat Ware vorbereitet (sortiert und Q vergeben) aber nicht received aufgrund von totes',
        'Nicht genug Ware verfügbar gehabt, zum Nachmittag neue RAs erhalten, Verschiebungen nach VAS',
        'Early: Returns stand ab 7:00 Uhr still, alle MA zu VAS/ ab ca. 10 Uhr wieder 3-4MA am inducten | Late: Das Band stand mehrfach in',
        'Full Day: An der BQS Sort-Wall konnte aus unbekannter Ursache leider nicht gearbeitet werden.',
        'Hohe Auslastung, alle Mitarbeiter im Einsatz',
        'Technische Probleme am Vormittag behoben',
        'Zusätzliche RAs erhalten, Team hat sehr gut gearbeitet'
      ];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      
      const result = stmt.run(
        dateStr,
        dayName,
        restVolume,
        actualInVol,
        plannedFte,
        plannedHours,
        plannedVolume,
        actualAmHours,
        actualPmHours,
        actualFte,
        actualVolume,
        Math.round(rate * 10) / 10,
        comment,
        now,
        now,
        username
      );
      
      if (result.changes > 0) {
        if (result.lastInsertRowid) created++;
        else updated++;
      }
    }
    
    res.json({
      ok: true,
      message: `Test-Daten erstellt: ${created} neue, ${updated} aktualisiert`,
      created,
      updated,
      total: created + updated
    });
  } catch (err) {
    console.error("Fehler beim Erstellen der Test-Daten:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
