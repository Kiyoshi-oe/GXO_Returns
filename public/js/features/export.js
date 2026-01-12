// LVS Returns - Export-Funktionalität

let exportColumns = [];
let exportData = [];
let selectedColumns = new Set();

// Verfügbare Spalten je nach Export-Typ
const columnDefinitions = {
  all: [
    { key: 'id', label: 'ID', default: true },
    { key: 'location_code', label: 'Stellplatz', default: true },
    { key: 'location_description', label: 'Stellplatz Beschreibung', default: false },
    { key: 'area', label: 'Bereich', default: true },
    { key: 'cw', label: 'CW', default: true },
    { key: 'aufgenommen_am', label: 'Aufgenommen am', default: true },
    { key: 'carrier_name', label: 'Carrier', default: true },
    { key: 'land', label: 'Land', default: true },
    { key: 'ship_status', label: 'Ship Status', default: false },
    { key: 'planned_carton', label: 'Geplante Kartons', default: true },
    { key: 'actual_carton', label: 'Tatsächliche Kartons', default: true },
    { key: 'olpn', label: 'OLPN', default: true },
    { key: 'carrier_tracking_nr', label: 'Tracking-Nr.', default: true },
    { key: 'customer_id', label: 'Kunden-ID', default: false },
    { key: 'customer_name', label: 'Kundenname', default: false },
    { key: 'asn_ra_no', label: 'ASN/RA-Nr.', default: true },
    { key: 'mh_status', label: 'MH Status', default: true },
    { key: 'kommentar', label: 'Kommentar', default: false },
    { key: 'created_at', label: 'Erstellt am', default: false },
    { key: 'added_by', label: 'Erstellt von', default: false }
  ],
  locations: [
    { key: 'id', label: 'ID', default: true },
    { key: 'code', label: 'Stellplatz-Code', default: true },
    { key: 'description', label: 'Beschreibung', default: true },
    { key: 'area', label: 'Bereich', default: true },
    { key: 'is_active', label: 'Aktiv', default: true },
    { key: 'carton_count', label: 'Anzahl Kartons', default: true },
    { key: 'total_cartons', label: 'Gesamt Kartons', default: true },
    { key: 'last_booked_at', label: 'Zuletzt gebucht', default: false },
    { key: 'created_at', label: 'Erstellt am', default: false }
  ],
  cartons: [
    { key: 'id', label: 'ID', default: true },
    { key: 'location_code', label: 'Stellplatz', default: true },
    { key: 'cw', label: 'CW', default: true },
    { key: 'aufgenommen_am', label: 'Aufgenommen am', default: true },
    { key: 'carrier_name', label: 'Carrier', default: true },
    { key: 'land', label: 'Land', default: true },
    { key: 'planned_carton', label: 'Geplante Kartons', default: true },
    { key: 'actual_carton', label: 'Tatsächliche Kartons', default: true },
    { key: 'olpn', label: 'OLPN', default: true },
    { key: 'carrier_tracking_nr', label: 'Tracking-Nr.', default: true },
    { key: 'customer_name', label: 'Kundenname', default: false },
    { key: 'asn_ra_no', label: 'ASN/RA-Nr.', default: true },
    { key: 'mh_status', label: 'MH Status', default: true },
    { key: 'kommentar', label: 'Kommentar', default: false }
  ],
  inbounds: [
    { key: 'id', label: 'ID', default: true },
    { key: 'timestamp', label: 'Datum/Zeit', default: true },
    { key: 'user', label: 'Erstellt von', default: true },
    { key: 'cw', label: 'CW', default: true },
    { key: 'olpn', label: 'OLPN', default: true },
    { key: 'carrier_tracking_nr', label: 'Tracking-Nr.', default: true },
    { key: 'carrier_name', label: 'Carrier', default: true },
    { key: 'land', label: 'Land', default: true },
    { key: 'actual_carton', label: 'Anzahl Kartons', default: true },
    { key: 'location_code', label: 'Stellplatz', default: true },
    { key: 'asn_ra_no', label: 'ASN/RA-Nr.', default: true },
    { key: 'customer_name', label: 'Kundenname', default: false },
    { key: 'kommentar', label: 'Kommentar', default: false }
  ],
  movements: [
    { key: 'id', label: 'ID', default: true },
    { key: 'timestamp', label: 'Datum/Zeit', default: true },
    { key: 'user', label: 'Verschoben von', default: true },
    { key: 'inbound_id', label: 'Karton-ID', default: true },
    { key: 'cw', label: 'CW', default: true },
    { key: 'olpn', label: 'OLPN', default: true },
    { key: 'carrier_tracking_nr', label: 'Tracking-Nr.', default: false },
    { key: 'from_location', label: 'Von Stellplatz', default: true },
    { key: 'to_location', label: 'Nach Stellplatz', default: true },
    { key: 'reason', label: 'Grund', default: false },
    { key: 'actual_carton', label: 'Anzahl Kartons', default: false }
  ],
  archives: [
    { key: 'id', label: 'ID', default: true },
    { key: 'timestamp', label: 'Archiviert am', default: true },
    { key: 'user', label: 'Archiviert von', default: true },
    { key: 'inbound_id', label: 'Karton-ID', default: true },
    { key: 'cw', label: 'CW', default: true },
    { key: 'olpn', label: 'OLPN', default: true },
    { key: 'carrier_tracking_nr', label: 'Tracking-Nr.', default: false },
    { key: 'location_code', label: 'Stellplatz (vor Archivierung)', default: true },
    { key: 'reason', label: 'Grund', default: true },
    { key: 'notes', label: 'Notizen', default: false }
  ],
  activities: [
    { key: 'type', label: 'Typ', default: true },
    { key: 'timestamp', label: 'Datum/Zeit', default: true },
    { key: 'user', label: 'Benutzer', default: true },
    { key: 'object', label: 'Objekt', default: true },
    { key: 'from_location', label: 'Von', default: true },
    { key: 'to_location', label: 'Nach', default: true },
    { key: 'inbound_id', label: 'Karton-ID', default: false }
  ]
};

// Initialisierung beim Laden der Export-View
function initExport() {
  console.log("✅ Export-Modul initialisiert");
  updateExportOptions();
  loadExportColumns();
}

// Export-Optionen aktualisieren
function updateExportOptions() {
  const exportType = document.getElementById('exportType')?.value || 'all';
  const locationGroup = document.getElementById('exportLocationGroup');
  const areaGroup = document.getElementById('exportAreaGroup');
  const dateRangeGroup = document.getElementById('exportDateRangeGroup');
  
  // Aktivitäten-Typen: activities, inbounds, movements, archives
  const isActivityType = ['activities', 'inbounds', 'movements', 'archives'].includes(exportType);
  
  if (locationGroup) locationGroup.style.display = exportType === 'locations' ? 'block' : 'none';
  if (areaGroup) areaGroup.style.display = exportType === 'areas' ? 'block' : 'none';
  if (dateRangeGroup) dateRangeGroup.style.display = isActivityType ? 'block' : 'none';
  
  // Spalten neu laden
  loadExportColumns();
  
  // Stellplätze/Areas laden falls nötig
  if (exportType === 'locations') {
    loadLocationsForExport();
  } else if (exportType === 'areas') {
    loadAreasForExport();
  }
  
  // Datumsfilter für Aktivitäten setzen (Standard: letzte 30 Tage)
  if (isActivityType) {
    const dateFrom = document.getElementById('exportDateFrom');
    const dateTo = document.getElementById('exportDateTo');
    if (dateFrom && !dateFrom.value) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
    if (dateTo && !dateTo.value) {
      dateTo.value = new Date().toISOString().split('T')[0];
    }
  }
}

// Spalten-Liste laden
function loadExportColumns() {
  const exportType = document.getElementById('exportType')?.value || 'all';
  const columns = columnDefinitions[exportType] || columnDefinitions.all;
  exportColumns = columns;
  
  const columnsList = document.getElementById('exportColumnsList');
  if (!columnsList) return;
  
  columnsList.innerHTML = '';
  
  // Standard-Auswahl: alle mit default: true
  selectedColumns.clear();
  columns.forEach(col => {
    if (col.default) {
      selectedColumns.add(col.key);
    }
  });
  
  columns.forEach(col => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-soft);';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `col-${col.key}`;
    checkbox.checked = col.default;
    checkbox.onchange = () => {
      if (checkbox.checked) {
        selectedColumns.add(col.key);
      } else {
        selectedColumns.delete(col.key);
      }
      loadExportPreview();
    };
    
    const label = document.createElement('label');
    label.htmlFor = `col-${col.key}`;
    label.textContent = col.label;
    label.style.cssText = 'cursor: pointer; font-size: 12px; flex: 1; margin: 0;';
    
    div.appendChild(checkbox);
    div.appendChild(label);
    columnsList.appendChild(div);
  });
  
  // Vorschau laden
  loadExportPreview();
}

// Alle Spalten auswählen
function selectAllColumns() {
  exportColumns.forEach(col => {
    selectedColumns.add(col.key);
    const checkbox = document.getElementById(`col-${col.key}`);
    if (checkbox) checkbox.checked = true;
  });
  loadExportPreview();
}

// Alle Spalten abwählen
function deselectAllColumns() {
  selectedColumns.clear();
  exportColumns.forEach(col => {
    const checkbox = document.getElementById(`col-${col.key}`);
    if (checkbox) checkbox.checked = false;
  });
  loadExportPreview();
}

// Stellplätze für Export laden
async function loadLocationsForExport() {
  try {
    const response = await fetch('/api/warehouse/locations?active_only=false');
    if (!response.ok) throw new Error('Fehler beim Laden der Stellplätze');
    
    const locations = await response.json();
    const select = document.getElementById('exportLocationSelect');
    if (!select) return;
    
    select.innerHTML = '';
    locations.forEach(loc => {
      const option = document.createElement('option');
      option.value = loc.id;
      option.textContent = `${loc.code} - ${loc.description || ''}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Fehler beim Laden der Stellplätze:', err);
  }
}

// Areas für Export laden
async function loadAreasForExport() {
  try {
    const response = await fetch('/api/warehouse/areas');
    if (!response.ok) throw new Error('Fehler beim Laden der Areas');
    
    const areas = await response.json();
    const select = document.getElementById('exportAreaSelect');
    if (!select) return;
    
    select.innerHTML = '';
    areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Fehler beim Laden der Areas:', err);
  }
}

// Vorschau laden
// Flag um zu verhindern, dass die Funktion mehrfach gleichzeitig ausgeführt wird
let isLoadingPreview = false;

async function loadExportPreview() {
  // Verhindere mehrfache gleichzeitige Ausführung
  if (isLoadingPreview) {
    console.log('Vorschau wird bereits geladen, überspringe...');
    return;
  }
  
  isLoadingPreview = true;
  
  // Zeige Ladeanzeige
  const previewBody = document.getElementById('exportPreviewBody');
  if (previewBody) {
    previewBody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 30px; color: var(--text-muted);">Lade Vorschau...</td></tr>';
  }
  
  try {
    const exportType = document.getElementById('exportType')?.value || 'all';
    const previewHeader = document.getElementById('exportPreviewHeader');
    const previewBody = document.getElementById('exportPreviewBody');
    
    if (!previewHeader || !previewBody) {
      console.error('Preview-Elemente nicht gefunden');
      return;
    }
  
    // Prüfen, ob mindestens eine Spalte ausgewählt ist
    if (selectedColumns.size === 0) {
      previewHeader.innerHTML = '';
      previewBody.innerHTML = '';
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 1;
      td.textContent = 'Bitte wählen Sie mindestens eine Spalte aus.';
      td.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted);';
      tr.appendChild(td);
      previewBody.appendChild(tr);
      return;
    }
    
    // Header und Body komplett leeren
    previewHeader.innerHTML = '';
    previewBody.innerHTML = '';
    
    // Daten laden
    let data = [];
    const params = new URLSearchParams();
    
    if (exportType === 'locations') {
      const locationSelect = document.getElementById('exportLocationSelect');
      const selectedLocations = Array.from(locationSelect?.selectedOptions || []).map(opt => opt.value);
      if (selectedLocations.length > 0) {
        params.append('location_ids', selectedLocations.join(','));
      }
      params.append('type', 'locations');
    } else if (exportType === 'areas') {
      const areaSelect = document.getElementById('exportAreaSelect');
      const selectedAreas = Array.from(areaSelect?.selectedOptions || []).map(opt => opt.value);
      if (selectedAreas.length > 0) {
        params.append('areas', selectedAreas.join(','));
      }
      params.append('type', 'cartons');
    } else if (exportType === 'cartons') {
      params.append('type', 'cartons');
    } else if (exportType === 'activities') {
      params.append('type', 'activities');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else if (exportType === 'inbounds') {
      params.append('type', 'inbounds');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else if (exportType === 'movements') {
      params.append('type', 'movements');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else if (exportType === 'archives') {
      params.append('type', 'archives');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else {
      params.append('type', 'all');
    }
    
    params.append('columns', Array.from(selectedColumns).join(','));
    params.append('preview', 'true');
    params.append('limit', '50');
    
    console.log('📤 Lade Vorschau:', params.toString());
    
    const response = await fetch(`/api/export?${params.toString()}`);
    if (!response.ok) {
      let errorMessage = 'Fehler beim Laden der Vorschau';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    data = await response.json();
    
    // Sicherstellen, dass data ein Array ist
    if (!Array.isArray(data)) {
      console.error('API hat kein Array zurückgegeben:', data);
      if (data.ok === false) {
        throw new Error(data.error || 'Fehler beim Laden der Daten');
      }
      data = [];
    }
    exportData = data;
    
    // Sicherstellen, dass data ein Array ist
    if (!Array.isArray(data)) {
      console.error('API hat kein Array zurückgegeben:', data);
      data = [];
    }
    
    // Debug: Prüfe erste Zeile
    if (data.length > 0) {
      console.log('Erste Datenzeile:', data[0]);
      console.log('Anzahl Zeilen:', data.length);
    }
    
    // Header erstellen basierend auf verfügbaren Spalten in den Daten
    const selectedCols = Array.from(selectedColumns).map(key => {
      const col = exportColumns.find(c => c.key === key);
      return col || { key, label: key };
    }).filter(col => {
      // Nur Spalten anzeigen, die auch in den Daten vorhanden sind
      if (data.length === 0) return true;
      // Prüfe, ob mindestens eine Zeile diese Spalte hat
      return data.some(row => {
        if (!row || typeof row !== 'object') return false;
        return row.hasOwnProperty(col.key);
      });
    });
    
    // Prüfen, ob nach dem Filtern noch Spalten vorhanden sind
    if (selectedCols.length === 0 && data.length > 0) {
      previewHeader.innerHTML = '';
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 1;
      td.textContent = 'Keine der ausgewählten Spalten ist in den Daten vorhanden.';
      td.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted);';
      tr.appendChild(td);
      previewBody.appendChild(tr);
      return;
    }
    
    // Header-Zeile NUR EINMAL erstellen
    // previewHeader ist bereits ein <tr> Element, also direkt th-Elemente hinzufügen
    previewHeader.innerHTML = ''; // Sicherstellen, dass es leer ist
    selectedCols.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      th.style.cssText = 'padding: 10px; text-align: left; border-bottom: 2px solid var(--border-main); font-weight: 600; background: var(--bg-card); white-space: nowrap;';
      previewHeader.appendChild(th);
    });
    
    // Body erstellen - NUR Datenzeilen, KEINE Header
    previewBody.innerHTML = ''; // Sicherstellen, dass es leer ist
    if (data.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = selectedCols.length || 1;
      td.textContent = 'Keine Daten gefunden';
      td.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted);';
      tr.appendChild(td);
      previewBody.appendChild(tr);
    } else {
      data.forEach((row, rowIndex) => {
        // Sicherstellen, dass row ein Objekt ist
        if (!row || typeof row !== 'object') {
          console.warn('Ungültige Zeile gefunden:', row);
          return;
        }
        
        const tr = document.createElement('tr');
        tr.className = 'data-row';
        // NUR td-Elemente erstellen, KEINE th-Elemente
        selectedCols.forEach(col => {
          const td = document.createElement('td');
          const value = row[col.key];
          td.textContent = value !== null && value !== undefined ? String(value) : '';
          td.style.cssText = 'padding: 8px 10px; border-bottom: 1px solid var(--border-soft); font-size: 12px; white-space: nowrap; text-align: left;';
          tr.appendChild(td);
        });
        previewBody.appendChild(tr);
      });
    }
    } catch (err) {
      console.error('Fehler beim Laden der Vorschau:', err);
      const previewHeader = document.getElementById('exportPreviewHeader');
      const previewBody = document.getElementById('exportPreviewBody');
      if (previewHeader) previewHeader.innerHTML = '';
      if (previewBody) {
        previewBody.innerHTML = '';
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 1;
        const errorMessage = err.message || 'Fehler beim Laden der Vorschau. Bitte versuchen Sie es erneut.';
        td.textContent = errorMessage;
        td.style.cssText = 'text-align: center; padding: 30px; color: var(--error);';
        tr.appendChild(td);
        previewBody.appendChild(tr);
      }
    } finally {
      isLoadingPreview = false;
    }
  }
}

// Export ausführen
async function executeExport() {
  const exportType = document.getElementById('exportType')?.value || 'all';
  const btn = document.getElementById('btnExportExcel');
  
  if (selectedColumns.size === 0) {
    alert('Bitte wählen Sie mindestens eine Spalte aus.');
    return;
  }
  
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Exportiere...';
  }
  
  try {
    const params = new URLSearchParams();
    
    if (exportType === 'locations') {
      const locationSelect = document.getElementById('exportLocationSelect');
      const selectedLocations = Array.from(locationSelect?.selectedOptions || []).map(opt => opt.value);
      if (selectedLocations.length === 0) {
        alert('Bitte wählen Sie mindestens einen Stellplatz aus.');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '📥 Excel exportieren';
        }
        return;
      }
      params.append('location_ids', selectedLocations.join(','));
      params.append('type', 'locations');
    } else if (exportType === 'areas') {
      const areaSelect = document.getElementById('exportAreaSelect');
      const selectedAreas = Array.from(areaSelect?.selectedOptions || []).map(opt => opt.value);
      if (selectedAreas.length === 0) {
        alert('Bitte wählen Sie mindestens einen Bereich aus.');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '📥 Excel exportieren';
        }
        return;
      }
      params.append('areas', selectedAreas.join(','));
      params.append('type', 'cartons');
    } else if (exportType === 'cartons') {
      params.append('type', 'cartons');
    } else if (exportType === 'activities') {
      params.append('type', 'activities');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else if (exportType === 'inbounds') {
      params.append('type', 'inbounds');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else if (exportType === 'movements') {
      params.append('type', 'movements');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else if (exportType === 'archives') {
      params.append('type', 'archives');
      const dateFrom = document.getElementById('exportDateFrom')?.value;
      const dateTo = document.getElementById('exportDateTo')?.value;
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
    } else {
      params.append('type', 'all');
    }
    
    params.append('columns', Array.from(selectedColumns).join(','));
    params.append('preview', 'false');
    
    console.log('📤 Starte Export:', params.toString());
    
    // Download starten
    const response = await fetch(`/api/export?${params.toString()}`);
    if (!response.ok) {
      let errorMessage = 'Fehler beim Export';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Prüfe Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('spreadsheet')) {
      // Versuche JSON-Fehler zu lesen
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        throw new Error(error.error || 'Fehler beim Export');
      } catch (e) {
        throw new Error('Fehler beim Export: ' + text);
      }
    }
    
    // Datei herunterladen
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const typeLabels = {
      'all': 'Lagerbestand',
      'locations': 'Stellplaetze',
      'cartons': 'Kartons',
      'areas': 'Bereiche',
      'activities': 'Aktivitaeten',
      'inbounds': 'Wareneingaenge',
      'movements': 'Umlagerungen',
      'archives': 'Archivierungen'
    };
    const typeLabel = typeLabels[exportType] || 'Export';
    const filename = `${typeLabel}_Export_${timestamp}.xlsx`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Export erfolgreich');
  } catch (err) {
    console.error('Fehler beim Export:', err);
    alert('Fehler beim Export: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📥 Excel exportieren';
    }
  }
}

// Export-Formular zurücksetzen
function resetExportForm() {
  document.getElementById('exportType').value = 'all';
  updateExportOptions();
  selectedColumns.clear();
  loadExportColumns();
}

// Globale Funktionen verfügbar machen
window.initExport = initExport;
window.updateExportOptions = updateExportOptions;
window.selectAllColumns = selectAllColumns;
window.deselectAllColumns = deselectAllColumns;
window.loadExportPreview = loadExportPreview;
window.executeExport = executeExport;
window.resetExportForm = resetExportForm;

console.log("✅ export.js geladen");

