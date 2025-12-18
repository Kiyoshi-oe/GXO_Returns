// LVS Returns - Import-Funktionalität

let selectedFile = null;

// Initialisierung
function initImport() {
  console.log("✅ Import-Modul initialisiert");
  resetImportForm();
}

// Template herunterladen
async function downloadImportTemplate() {
  try {
    const response = await fetch('/api/import/template');
    
    // Prüfen ob Response OK ist
    if (!response.ok) {
      let errorMessage = 'Fehler beim Herunterladen des Templates';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Prüfen ob Content-Type korrekt ist
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('spreadsheetml')) {
      // Versuche trotzdem als Blob zu behandeln
      console.warn('Unerwarteter Content-Type:', contentType);
    }
    
    const blob = await response.blob();
    
    // Prüfen ob Blob gültig ist
    if (!blob || blob.size === 0) {
      throw new Error('Die heruntergeladene Datei ist leer');
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Import_Template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showCustomModal("✓ Template erfolgreich heruntergeladen", "success");
  } catch (err) {
    console.error('Fehler beim Herunterladen des Templates:', err);
    const errorMessage = err.message || 'Unbekannter Fehler beim Herunterladen des Templates';
    showCustomModal(`❌ Fehler: ${errorMessage}`, "error");
  }
}

// Datei auswählen
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    selectedFile = null;
    document.getElementById('importFileInfo').style.display = 'none';
    document.getElementById('btnImport').disabled = true;
    return;
  }
  
  // Prüfen ob es eine Excel-Datei ist
  const validExtensions = ['.xlsx', '.xls'];
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    showCustomModal("❌ Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)", "error");
    event.target.value = '';
    selectedFile = null;
    document.getElementById('importFileInfo').style.display = 'none';
    document.getElementById('btnImport').disabled = true;
    return;
  }
  
  selectedFile = file;
  document.getElementById('importFileName').textContent = file.name;
  document.getElementById('importFileInfo').style.display = 'block';
  document.getElementById('btnImport').disabled = false;
}

// Import ausführen
async function executeImport() {
  if (!selectedFile) {
    showCustomModal("❌ Bitte wählen Sie zuerst eine Datei aus", "error");
    return;
  }
  
  // Status anzeigen
  const statusDiv = document.getElementById('importStatus');
  const statusTitle = document.getElementById('importStatusTitle');
  const statusSubtitle = document.getElementById('importStatusSubtitle');
  const statusContent = document.getElementById('importStatusContent');
  const processedSpan = document.getElementById('importProcessed');
  const successSpan = document.getElementById('importSuccess');
  const errorsSpan = document.getElementById('importErrors');
  const errorsList = document.getElementById('importErrorsList');
  const errorsContent = document.getElementById('importErrorsContent');
  
  statusDiv.style.display = 'block';
  statusTitle.textContent = 'Import läuft...';
  statusSubtitle.textContent = 'Bitte warten Sie, während die Daten verarbeitet werden.';
  statusContent.style.display = 'block';
  processedSpan.textContent = '0';
  successSpan.textContent = '0';
  errorsSpan.textContent = '0';
  errorsList.style.display = 'none';
  errorsContent.innerHTML = '';
  
  // Button deaktivieren
  document.getElementById('btnImport').disabled = true;
  
  try {
    // FormData erstellen
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Upload
    const response = await fetch('/api/import/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Import');
    }
    
    const result = await response.json();
    
    // Status aktualisieren
    processedSpan.textContent = result.total || 0;
    successSpan.textContent = result.success || 0;
    errorsSpan.textContent = result.errors || 0;
    
    if (result.errors > 0 && result.errorDetails && result.errorDetails.length > 0) {
      errorsList.style.display = 'block';
      let errorHtml = '<div style="display: flex; flex-direction: column; gap: 4px;">';
      result.errorDetails.forEach((error, index) => {
        errorHtml += `<div style="padding: 6px; background: var(--bg-main); border-radius: 4px; border-left: 3px solid var(--gxo-orange);">`;
        errorHtml += `<strong>Zeile ${error.row || '?'}:</strong> ${error.message || error}`;
        errorHtml += `</div>`;
      });
      errorHtml += '</div>';
      errorsContent.innerHTML = errorHtml;
    }
    
    if (result.success > 0) {
      statusTitle.textContent = '✓ Import erfolgreich';
      statusSubtitle.textContent = `${result.success} Einträge wurden erfolgreich importiert.`;
      
      if (result.errors > 0) {
        statusSubtitle.textContent += ` ${result.errors} Einträge hatten Fehler.`;
      }
      
      // Formular zurücksetzen
      setTimeout(() => {
        resetImportForm();
        // Lagerbestand aktualisieren, wenn wir auf der Lagerbestand-Seite sind
        if (document.getElementById("view-inventory")?.classList.contains('active')) {
          if (typeof loadWarehouse === 'function') {
            loadWarehouse();
          }
        }
      }, 2000);
    } else {
      statusTitle.textContent = '❌ Import fehlgeschlagen';
      statusSubtitle.textContent = 'Keine Einträge konnten importiert werden.';
    }
    
  } catch (err) {
    console.error('Fehler beim Import:', err);
    statusTitle.textContent = '❌ Import fehlgeschlagen';
    statusSubtitle.textContent = err.message || 'Ein Fehler ist aufgetreten.';
    showCustomModal(`❌ Fehler: ${err.message}`, "error");
  } finally {
    document.getElementById('btnImport').disabled = false;
  }
}

// Formular zurücksetzen
function resetImportForm() {
  selectedFile = null;
  document.getElementById('importFileInput').value = '';
  document.getElementById('importFileInfo').style.display = 'none';
  document.getElementById('btnImport').disabled = true;
  document.getElementById('importStatus').style.display = 'none';
}

