// LVS Returns - Wareneingang Logik
// Dieses Modul wird in mehreren Teilen erstellt

// Carrier Icons Mapping
const carrierIcons = {
  "DPD": "📦",
  "Geodis": "🚚",
  "DHL": "📮",
  "BRT": "🚛",
  "FedEx": "✈️",
  "Zalando Ware": "🛍️",
  "Postnord": "📬",
  "Lost and Found": "🔍",
  "Lost & Found": "🔍",
  "Dachser": "🏭",
  "DACHSER": "🏭",
  "Duwensee": "🚢"
};

// Carrier laden und anzeigen
async function loadCarriers() {
  const container = document.getElementById("carrierButtonsGrid");
  if (!container) return;

  container.innerHTML = '<span class="muted">Carrier werden geladen...</span>';

  try {
    const response = await fetch("/api/carriers");
    if (!response.ok) {
      throw new Error("Code " + response.status);
    }
    const data = await response.json();
    carriersData = data;
    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = '<span class="muted">Noch keine Carrier Stammdaten vorhanden</span>';
      return;
    }

    data.forEach(car => {
      const card = document.createElement("div");
      card.className = "carrier-card";
      card.setAttribute("data-carrier-id", car.id);
      
      // Markiere aktiven Carrier
      if (currentCarrier && currentCarrier.id === car.id) {
        card.classList.add("active");
      }
      
      const icon = carrierIcons[car.name] || "📋";
      const countryText = car.country ? `(${car.country})` : "";
      
      card.innerHTML = `
        <div class="carrier-card-icon">${icon}</div>
        <div class="carrier-card-name">${car.display_name}</div>
        ${countryText ? `<div class="carrier-card-country">${countryText}</div>` : ''}
      `;
      
      card.addEventListener("click", () => {
        // Entferne active von allen Karten
        document.querySelectorAll('.carrier-card').forEach(c => c.classList.remove('active'));
        // Markiere diese Karte
        card.classList.add('active');
        selectCarrier(car);
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Fehler beim Laden der Carrier", err);
    container.innerHTML = '<span class="muted">Fehler beim Laden der Carrier Stammdaten</span>';
  }
}

// Carrier auswählen
async function selectCarrier(carrier) {
  currentCarrier = carrier;
  
  // Prüfen ob wir auf der Einstellungsseite sind
  const isSettingsPage = document.getElementById("settingsContent") && 
                        document.getElementById("settingsContent").style.display !== "none";
  
  if (!isSettingsPage) {
    // Nur auf der Wareneingang-Seite: Ansicht wechseln
    const carrierSelectionView = document.getElementById("carrierSelectionView");
    const inboundDetailView = document.getElementById("inboundDetailView");
    if (carrierSelectionView) carrierSelectionView.style.display = "none";
    if (inboundDetailView) inboundDetailView.style.display = "block";
    
    // Letzte Einträge Tabelle ausblenden
    const inboundListSection = document.getElementById("inboundListSection");
    if (inboundListSection) {
      inboundListSection.style.display = "none";
    }
  }
  
  // Carrier Name anzeigen
  const selectedCarrierName = document.getElementById("selectedCarrierName");
  if (selectedCarrierName) {
    selectedCarrierName.textContent = carrier.display_name;
  }
  
  // ERST alle Felder anzeigen (Reset)
  resetAllFieldsVisibility();
  
  // Dropdowns laden
  await loadDropdownOptions();
  
  // Felder vorausfüllen
  prefillCarrierDefaults(carrier);
  
  console.log("✅ Carrier ausgewählt:", carrier.display_name);
}

// Zurück zur Carrier-Auswahl
function backToCarrierSelection() {
  const carrierSelectionView = document.getElementById("carrierSelectionView");
  const inboundDetailView = document.getElementById("inboundDetailView");
  const inboundListSection = document.getElementById("inboundListSection");
  
  if (carrierSelectionView) carrierSelectionView.style.display = "block";
  if (inboundDetailView) inboundDetailView.style.display = "none";
  if (inboundListSection) inboundListSection.style.display = "block";
  
  // Formular zurücksetzen
  clearInboundForm();
  
  // Entferne active Markierung von allen Carrier-Karten
  document.querySelectorAll('.carrier-card').forEach(c => c.classList.remove('active'));
  
  // Bulk-Modus zurücksetzen
  if (isBulkMode) {
    switchToSingleMode();
    bulkDefaults = {};
    bulkSavedCount = 0;
  }
  
  currentCarrier = null;
  clearInboundForm();
}

// Formular zurücksetzen
function clearInboundForm() {
  // Implementierung folgt - zu lang für diese Datei
  console.log("Formular zurückgesetzt");
}

// Felder vorausfüllen
function prefillCarrierDefaults(carrier) {
  // Implementierung folgt - zu lang für diese Datei
  console.log("Felder vorausgefüllt für:", carrier.display_name);
}

// Alle Felder sichtbar machen
function resetAllFieldsVisibility() {
  // Implementierung folgt
  console.log("Felder-Sichtbarkeit zurückgesetzt");
}

console.log("✅ wareneingang.js geladen");





