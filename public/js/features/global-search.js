// LVS Returns - Globale Suche

let searchResults = {};
let currentSearchParams = {};

/**
 * Initialisiert die Globale Suche
 */
function initGlobalSearch() {
  console.log('🔍 Initialisiere Globale Suche...');
  
  // Filter-Optionen laden
  loadSearchFilters();
  
  // Event-Listener für Enter-Taste
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performGlobalSearch();
      }
    });
  }
  
  console.log('✅ Globale Suche initialisiert');
}

/**
 * Lädt Filter-Optionen (Areas, Carrier, Länder)
 */
async function loadSearchFilters() {
  try {
    // Areas laden
    const areasResponse = await fetch('/api/warehouse/areas');
    if (areasResponse.ok) {
      const areas = await areasResponse.json();
      const areaSelect = document.getElementById('searchAreaFilter');
      if (areaSelect) {
        // Speichere die erste Option (Standard-Option)
        const firstOptionText = areaSelect.querySelector('option[value=""]')?.textContent || 'Alle Bereiche';
        // Entferne alle Optionen
        areaSelect.innerHTML = '';
        // Füge die Standard-Option wieder hinzu
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = firstOptionText;
        areaSelect.appendChild(defaultOption);
        // Füge neue Optionen hinzu (nur wenn sie noch nicht existieren)
        const existingValues = new Set(['']);
        areas.forEach(area => {
          if (!existingValues.has(area)) {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
            existingValues.add(area);
          }
        });
      }
    }
    
    // Carrier laden
    const carriersResponse = await fetch('/api/carriers');
    if (carriersResponse.ok) {
      const carriers = await carriersResponse.json();
      const carrierSelect = document.getElementById('searchCarrierFilter');
      if (carrierSelect) {
        // Speichere die erste Option (Standard-Option)
        const firstOptionText = carrierSelect.querySelector('option[value=""]')?.textContent || 'Alle Carrier';
        // Entferne alle Optionen
        carrierSelect.innerHTML = '';
        // Füge die Standard-Option wieder hinzu
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = firstOptionText;
        carrierSelect.appendChild(defaultOption);
        // Füge neue Optionen hinzu (nur wenn sie noch nicht existieren)
        const existingValues = new Set(['']);
        carriers.forEach(carrier => {
          const carrierValue = carrier.name;
          if (!existingValues.has(carrierValue)) {
            const option = document.createElement('option');
            option.value = carrierValue;
            option.textContent = carrier.display_name || carrier.name;
            carrierSelect.appendChild(option);
            existingValues.add(carrierValue);
          }
        });
      }
    }
    
    // Länder laden
    const landResponse = await fetch('/api/dropdown-options/land');
    if (landResponse.ok) {
      const lands = await landResponse.json();
      const landSelect = document.getElementById('searchLandFilter');
      if (landSelect) {
        // Speichere die erste Option (Standard-Option)
        const firstOptionText = landSelect.querySelector('option[value=""]')?.textContent || 'Alle Länder';
        // Entferne alle Optionen
        landSelect.innerHTML = '';
        // Füge die Standard-Option wieder hinzu
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = firstOptionText;
        landSelect.appendChild(defaultOption);
        // Füge neue Optionen hinzu (nur wenn sie noch nicht existieren)
        const existingValues = new Set(['']);
        lands.forEach(land => {
          const landValue = land.option_value;
          if (!existingValues.has(landValue)) {
            const option = document.createElement('option');
            option.value = landValue;
            option.textContent = land.option_label;
            landSelect.appendChild(option);
            existingValues.add(landValue);
          }
        });
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden der Filter-Optionen:', error);
  }
}

/**
 * Führt die globale Suche durch
 */
async function performGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const searchTerm = searchInput ? searchInput.value.trim() : '';
  
  // Filter sammeln
  const dataSources = Array.from(document.getElementById('searchDataSource').selectedOptions)
    .map(opt => opt.value);
  const area = document.getElementById('searchAreaFilter').value;
  const carrier = document.getElementById('searchCarrierFilter').value;
  const status = document.getElementById('searchStatusFilter').value;
  const land = document.getElementById('searchLandFilter').value;
  const dateFrom = document.getElementById('searchDateFrom').value;
  const dateTo = document.getElementById('searchDateTo').value;
  
  // Suchparameter zusammenstellen
  const searchParams = {
    query: searchTerm,
    dataSources: dataSources.length > 0 ? dataSources : ['inbound', 'location', 'warehouse_stock', 'movement', 'archive'],
    filters: {
      area: area || null,
      carrier: carrier || null,
      status: status || null,
      land: land || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null
    }
  };
  
  currentSearchParams = searchParams;
  
  // Loading anzeigen
  const resultsContent = document.getElementById('searchResultsContent');
  if (resultsContent) {
    resultsContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-soft);">
        <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Suche wird durchgeführt...</div>
        <div style="font-size: 12px;">Bitte warten Sie einen Moment</div>
      </div>
    `;
  }
  
  try {
    const response = await fetch('/api/search/global', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });
    
    if (!response.ok) {
      throw new Error(`Fehler: ${response.status}`);
    }
    
    const results = await response.json();
    searchResults = results;
    
    // Ergebnisse anzeigen
    displaySearchResults(results);
    
  } catch (error) {
    console.error('Fehler bei der Suche:', error);
    if (resultsContent) {
      resultsContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-error);">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Fehler bei der Suche</div>
          <div style="font-size: 12px;">${error.message}</div>
        </div>
      `;
    }
  }
}

/**
 * Zeigt die Suchergebnisse an
 */
function displaySearchResults(results) {
  const resultsContent = document.getElementById('searchResultsContent');
  const resultsCount = document.getElementById('searchResultsCount');
  const resultTabs = document.getElementById('searchResultTabs');
  const exportBtn = document.getElementById('exportSearchBtn');
  
  if (!resultsContent) return;
  
  // Gesamtanzahl berechnen
  let totalCount = 0;
  const resultTypes = [];
  
  if (results.inbound && results.inbound.length > 0) {
    totalCount += results.inbound.length;
    resultTypes.push({ type: 'inbound', label: 'Wareneingang', count: results.inbound.length });
  }
  if (results.locations && results.locations.length > 0) {
    totalCount += results.locations.length;
    resultTypes.push({ type: 'locations', label: 'Stellplätze', count: results.locations.length });
  }
  if (results.warehouse_stock && results.warehouse_stock.length > 0) {
    totalCount += results.warehouse_stock.length;
    resultTypes.push({ type: 'warehouse_stock', label: 'Lagerbestand', count: results.warehouse_stock.length });
  }
  if (results.movements && results.movements.length > 0) {
    totalCount += results.movements.length;
    resultTypes.push({ type: 'movements', label: 'Umlagerungen', count: results.movements.length });
  }
  if (results.archive && results.archive.length > 0) {
    totalCount += results.archive.length;
    resultTypes.push({ type: 'archive', label: 'Archiv', count: results.archive.length });
  }
  
  // Ergebnisanzahl anzeigen
  if (resultsCount) {
    resultsCount.textContent = totalCount > 0 
      ? `${totalCount} Ergebnis${totalCount !== 1 ? 'se' : ''} gefunden`
      : 'Keine Ergebnisse gefunden';
  }
  
  // Export-Button anzeigen/verstecken
  if (exportBtn) {
    exportBtn.style.display = totalCount > 0 ? 'block' : 'none';
  }
  
  if (totalCount === 0) {
    resultsContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-soft);">
        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Keine Ergebnisse gefunden</div>
        <div style="font-size: 12px;">Versuchen Sie es mit anderen Suchbegriffen oder Filtern</div>
      </div>
    `;
    if (resultTabs) resultTabs.style.display = 'none';
    return;
  }
  
  // Tabs generieren
  if (resultTabs && resultTypes.length > 0) {
    resultTabs.innerHTML = '';
    resultTabs.style.display = 'flex';
    resultTypes.forEach((rt, index) => {
      const tab = document.createElement('button');
      tab.className = 'inventory-tab-btn' + (index === 0 ? ' active' : '');
      tab.id = `search-tab-${rt.type}`;
      tab.onclick = () => switchSearchTab(rt.type);
      tab.innerHTML = `<span>${rt.label}</span> <span style="margin-left: 8px; opacity: 0.7;">(${rt.count})</span>`;
      resultTabs.appendChild(tab);
    });
  }
  
  // Ergebnisse nach Typ anzeigen
  let html = '';
  
  // Wareneingang
  if (results.inbound && results.inbound.length > 0) {
    html += `<div id="search-results-inbound" class="search-results-section" ${resultTypes[0]?.type === 'inbound' ? '' : 'style="display: none;"'}>`;
    html += '<table style="width: 100%; margin-top: 16px;"><thead><tr>';
    html += '<th>CW</th><th>OLPN</th><th>Tracking</th><th>RA-Nummer</th><th>Carrier</th><th>Stellplatz</th><th>Status</th><th>Datum</th>';
    html += '</tr></thead><tbody>';
    results.inbound.forEach(item => {
      html += '<tr class="data-row">';
      html += `<td>${escapeHtml(item.cw || '')}</td>`;
      html += `<td>${escapeHtml(item.olpn || '')}</td>`;
      html += `<td>${escapeHtml(item.carrier_tracking_nr || '')}</td>`;
      html += `<td>${escapeHtml(item.asn_ra_no || item.neue_ra || '')}</td>`;
      html += `<td>${escapeHtml(item.carrier_name || '')}</td>`;
      html += `<td>${escapeHtml(item.location_code || '')}</td>`;
      html += `<td><span class="badge badge-${item.mh_status === 'aktiv' ? 'ok' : 'soft'}">${escapeHtml(item.mh_status || '')}</span></td>`;
      html += `<td>${escapeHtml(formatDate(item.created_at))}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  
  // Stellplätze
  if (results.locations && results.locations.length > 0) {
    html += `<div id="search-results-locations" class="search-results-section" ${resultTypes.find(rt => rt.type === 'locations') ? (resultTypes[0]?.type === 'locations' ? '' : 'style="display: none;"') : 'style="display: none;"'}>`;
    html += '<table style="width: 100%; margin-top: 16px;"><thead><tr>';
    html += '<th>Stellplatz</th><th>Beschreibung</th><th>Bereich</th><th>Status</th><th>Paletten</th><th>Kartons</th>';
    html += '</tr></thead><tbody>';
    results.locations.forEach(item => {
      html += '<tr class="data-row">';
      html += `<td>${escapeHtml(item.code || '')}</td>`;
      html += `<td>${escapeHtml(item.description || '')}</td>`;
      html += `<td>${escapeHtml(item.area || '')}</td>`;
      html += `<td><span class="badge badge-${item.is_active ? 'ok' : 'soft'}">${item.is_active ? 'Aktiv' : 'Inaktiv'}</span></td>`;
      html += `<td>${item.pallet_count || 0}</td>`;
      html += `<td>${item.carton_count || 0}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  
  // Lagerbestand
  if (results.warehouse_stock && results.warehouse_stock.length > 0) {
    html += `<div id="search-results-warehouse_stock" class="search-results-section" ${resultTypes.find(rt => rt.type === 'warehouse_stock') ? (resultTypes[0]?.type === 'warehouse_stock' ? '' : 'style="display: none;"') : 'style="display: none;"'}>`;
    html += '<table style="width: 100%; margin-top: 16px;"><thead><tr>';
    html += '<th>Stellplatz</th><th>Kartons</th><th>Status</th><th>Gebucht am</th><th>Gebucht von</th>';
    html += '</tr></thead><tbody>';
    results.warehouse_stock.forEach(item => {
      html += '<tr class="data-row">';
      html += `<td>${escapeHtml(item.location_code || '')}</td>`;
      html += `<td>${item.carton_count || 0}</td>`;
      html += `<td><span class="badge badge-${item.status === 'active' ? 'ok' : 'soft'}">${escapeHtml(item.status || '')}</span></td>`;
      html += `<td>${escapeHtml(formatDate(item.booked_at))}</td>`;
      html += `<td>${escapeHtml(item.booked_by || '')}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  
  // Umlagerungen
  if (results.movements && results.movements.length > 0) {
    html += `<div id="search-results-movements" class="search-results-section" ${resultTypes.find(rt => rt.type === 'movements') ? (resultTypes[0]?.type === 'movements' ? '' : 'style="display: none;"') : 'style="display: none;"'}>`;
    html += '<table style="width: 100%; margin-top: 16px;"><thead><tr>';
    html += '<th>Von</th><th>Nach</th><th>Typ</th><th>Datum</th><th>Von</th><th>Grund</th>';
    html += '</tr></thead><tbody>';
    results.movements.forEach(item => {
      html += '<tr class="data-row">';
      html += `<td>${escapeHtml(item.from_location || '')}</td>`;
      html += `<td>${escapeHtml(item.to_location || '')}</td>`;
      html += `<td>${escapeHtml(item.movement_type || '')}</td>`;
      html += `<td>${escapeHtml(formatDate(item.moved_at))}</td>`;
      html += `<td>${escapeHtml(item.moved_by || '')}</td>`;
      html += `<td>${escapeHtml(item.reason || '')}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  
  // Archiv
  if (results.archive && results.archive.length > 0) {
    html += `<div id="search-results-archive" class="search-results-section" ${resultTypes.find(rt => rt.type === 'archive') ? (resultTypes[0]?.type === 'archive' ? '' : 'style="display: none;"') : 'style="display: none;"'}>`;
    html += '<table style="width: 100%; margin-top: 16px;"><thead><tr>';
    html += '<th>OLPN</th><th>Tracking</th><th>Stellplatz</th><th>Kartons</th><th>Archiviert am</th><th>Archiviert von</th><th>Grund</th>';
    html += '</tr></thead><tbody>';
    results.archive.forEach(item => {
      html += '<tr class="data-row">';
      html += `<td>${escapeHtml(item.olpn || '')}</td>`;
      html += `<td>${escapeHtml(item.carrier_tracking_nr || '')}</td>`;
      html += `<td>${escapeHtml(item.location_code || '')}</td>`;
      html += `<td>${item.carton_count || 0}</td>`;
      html += `<td>${escapeHtml(formatDate(item.archived_at))}</td>`;
      html += `<td>${escapeHtml(item.archived_by || '')}</td>`;
      html += `<td>${escapeHtml(item.reason || '')}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  
  resultsContent.innerHTML = html;
}

/**
 * Wechselt zwischen Ergebnis-Tabs
 */
function switchSearchTab(type) {
  // Tabs aktualisieren
  document.querySelectorAll('#searchResultTabs .inventory-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTab = document.getElementById(`search-tab-${type}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  // Ergebnisse anzeigen/verstecken
  document.querySelectorAll('.search-results-section').forEach(section => {
    section.style.display = 'none';
  });
  const activeSection = document.getElementById(`search-results-${type}`);
  if (activeSection) {
    activeSection.style.display = 'block';
  }
}

/**
 * Setzt alle Filter zurück
 */
function clearGlobalSearch() {
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('searchDataSource').selectedIndex = -1;
  document.getElementById('searchAreaFilter').value = '';
  document.getElementById('searchCarrierFilter').value = '';
  document.getElementById('searchStatusFilter').value = '';
  document.getElementById('searchLandFilter').value = '';
  document.getElementById('searchDateFrom').value = '';
  document.getElementById('searchDateTo').value = '';
  
  // Ergebnisse zurücksetzen
  searchResults = {};
  const resultsContent = document.getElementById('searchResultsContent');
  if (resultsContent) {
    resultsContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-soft);">
        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Keine Suche durchgeführt</div>
        <div style="font-size: 12px;">Geben Sie einen Suchbegriff ein und klicken Sie auf "Suchen"</div>
      </div>
    `;
  }
  const resultsCount = document.getElementById('searchResultsCount');
  if (resultsCount) {
    resultsCount.textContent = 'Keine Suche durchgeführt';
  }
  const resultTabs = document.getElementById('searchResultTabs');
  if (resultTabs) {
    resultTabs.style.display = 'none';
  }
  const exportBtn = document.getElementById('exportSearchBtn');
  if (exportBtn) {
    exportBtn.style.display = 'none';
  }
}

/**
 * Exportiert die Suchergebnisse
 */
async function exportSearchResults() {
  try {
    // Zeige Loading-Indikator
    const exportBtn = document.getElementById('exportSearchBtn');
    const originalText = exportBtn ? exportBtn.textContent : '';
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ Exportiere...';
    }
    
    const response = await fetch('/api/search/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        results: searchResults,
        params: currentSearchParams
      })
    });
    
    if (!response.ok) {
      throw new Error('Export fehlgeschlagen');
    }
    
    if (!response.ok) {
      throw new Error('Export fehlgeschlagen');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GXO_Globale_Suche_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Button zurücksetzen
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = originalText;
    }
    
  } catch (error) {
    console.error('Fehler beim Export:', error);
    alert('Fehler beim Exportieren der Suchergebnisse: ' + error.message);
    
    // Button zurücksetzen
    const exportBtn = document.getElementById('exportSearchBtn');
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = '📤 Exportieren';
    }
  }
}

/**
 * Hilfsfunktion: HTML-Escape
 */
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Hilfsfunktion: Datum formatieren
 */
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

console.log('✅ global-search.js geladen');

