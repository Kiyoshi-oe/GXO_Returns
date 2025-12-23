// LVS Returns - Navigation und View-Switching

// Mache Funktion global verfügbar
window.initNavigation = function() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(item => {
<<<<<<< Updated upstream
    // Verhindere Standard-Link-Verhalten
    item.addEventListener("click", (e) => {
      e.preventDefault();
      
      const viewName = item.getAttribute("data-view");
      
      if (!viewName) {
        console.warn('⚠️ Kein data-view Attribut gefunden für:', item);
        // Fallback: Versuche aus href zu extrahieren
        const href = item.getAttribute("href");
        if (href) {
          // Verwende routing.js um View-Name zu finden
          const path = href;
          if (typeof getViewForRoute === 'function') {
            const extractedView = getViewForRoute(path);
            if (extractedView) {
              if (typeof navigateToView === 'function') {
                navigateToView(extractedView);
              }
            }
          }
        }
        return;
      }
      
=======
    item.addEventListener("click", (e) => {
      // Verhindere Standard-Link-Verhalten wenn data-view vorhanden ist
      if (item.hasAttribute("data-view")) {
        e.preventDefault();
      }
      
      const viewName = item.getAttribute("data-view");
      
      // Wenn kein data-view, aber href vorhanden, verwende href
      if (!viewName && item.tagName === 'A' && item.getAttribute("href")) {
        // Standard-Link-Verhalten zulassen
        return;
      }
      
      if (!viewName) {
        return; // Kein data-view, nichts zu tun
      }
      
>>>>>>> Stashed changes
      // Routing-System verwenden statt direkter View-Wechsel
      if (typeof navigateToView === 'function') {
        navigateToView(viewName);
      } else {
        // Fallback falls Routing noch nicht geladen ist
        console.warn('⚠️ Routing-System noch nicht geladen, verwende Fallback');
        handleDirectViewSwitch(viewName);
      }
    });
  });

  // Jump-Buttons (z.B. auf Dashboard)
  document.querySelectorAll("[data-jump]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-jump");
      
      // Routing-System verwenden
      if (typeof navigateToView === 'function') {
        navigateToView(target);
      } else {
        // Fallback
        const navTarget = document.querySelector('.nav-item[data-view="' + target + '"]');
        if (navTarget) {
          navTarget.click();
        }
      }
    });
  });
  
  console.log("✅ Navigation initialisiert");
}

/**
 * Fallback-Funktion für direkten View-Wechsel (wenn Routing nicht verfügbar)
 */
function handleDirectViewSwitch(viewName) {
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view");
  const topbarTitle = document.getElementById("topbarTitle");
  const topbarSubtitle = document.getElementById("topbarSubtitle");

  navItems.forEach(n => n.classList.remove("active"));
  const clickedItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (clickedItem) {
    clickedItem.classList.add("active");
  }

  views.forEach(v => v.classList.remove("active"));
  const viewElement = document.getElementById("view-" + viewName);
  if (viewElement) {
    viewElement.classList.add("active");
  }

  if (viewMeta[viewName]) {
    if (topbarTitle) topbarTitle.textContent = viewMeta[viewName].title;
    if (topbarSubtitle) topbarSubtitle.textContent = viewMeta[viewName].subtitle;
  }
  
  // Nach oben scrollen beim View-Wechsel
  setTimeout(() => {
    const mainContent = document.querySelector(".main");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, 0);

  // Settings Content nur auf der Einstellungen-Seite anzeigen
  const settingsContent = document.getElementById("settingsContent");
  if (viewName !== "settings" && settingsContent) {
    settingsContent.style.display = "none";
  }

  // View-spezifische Logik
  handleViewSwitch(viewName);
}

function handleViewSwitch(viewName) {
  if (viewName === "inventory") {
    loadInventory();
  } else if (viewName === "settings") {
    handleSettingsView();
  } else if (viewName === "inbound") {
    handleInboundView();
  } else if (viewName === "import") {
    if (typeof initImport === 'function') {
      initImport();
    }
  } else if (viewName === "export") {
    if (typeof initExport === 'function') {
      initExport();
    }
  } else if (viewName === "search") {
    if (typeof initGlobalSearch === 'function') {
      initGlobalSearch();
    }
  }
}

function handleSettingsView() {
  const settingsContent = document.getElementById("settingsContent");
  const settingsPinCard = document.getElementById("settingsPinCard");
  
  // Carrier-Auswahl zurücksetzen
  const carrierInput = document.getElementById("settingsCarrierSelect");
  if (carrierInput) {
    carrierInput.value = "";
    carrierInput.removeAttribute('data-value');
  }
  
  // Carrier-Einstellungen-Form verstecken
  const carrierForm = document.getElementById("carrierSettingsForm");
  if (carrierForm) {
    carrierForm.style.display = "none";
  }
  
  // Hinweis wieder anzeigen
  const hint = document.getElementById("carrierSelectionHint");
  if (hint) hint.style.display = "block";
  
  // Wenn Benutzer "paypa" ist, direkt Zugriff gewähren
  if (typeof currentWindowsUser !== 'undefined' && currentWindowsUser && currentWindowsUser.toLowerCase() === "paypa") {
    if (settingsPinCard) settingsPinCard.style.display = "none";
    if (settingsContent) settingsContent.style.display = "block";
    if (typeof loadSettingsData === 'function') loadSettingsData();
    if (typeof loadCarriers === 'function') loadCarriers();
    console.log("✅ Einstellungen für Benutzer 'paypa' geladen");
  } else if (settingsContent && settingsContent.style.display === "none") {
    // Für andere Benutzer: PIN zurücksetzen falls nicht authentifiziert
    if (settingsPinCard) settingsPinCard.style.display = "block";
    if (settingsContent) settingsContent.style.display = "none";
    const pinInput = document.getElementById("settingsPinInput");
    if (pinInput) pinInput.value = "";
  }
}

function handleInboundView() {
  // Carrier-Auswahl beim Wareneingang anzeigen
  const carrierSelectionView = document.getElementById("carrierSelectionView");
  const inboundDetailView = document.getElementById("inboundDetailView");
  const inboundListSection = document.getElementById("inboundListSection");
  
  if (carrierSelectionView) carrierSelectionView.style.display = "block";
  if (inboundDetailView) inboundDetailView.style.display = "none";
  if (inboundListSection) inboundListSection.style.display = "block";
  
  // Carrier-Buttons laden
  if (typeof loadCarriers === 'function') loadCarriers();
}

// Lagerbestand laden
async function loadInventory() {
  const tbody = document.getElementById("inventoryBody");
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" class="muted">Lagerdaten werden geladen</td></tr>';

  try {
    const response = await fetch("/api/inventory");
    if (!response.ok) {
      throw new Error("Antwort Code " + response.status);
    }

    const data = await response.json();
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "Noch keine Stellplätze in der Datenbank vorhanden";
      td.className = "muted";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    data.forEach(loc => {
      let zone = "";
      const parts = (loc.code || "").split(" ");
      if (parts.length >= 2) {
        zone = "Zone " + parts[1];
      }

      const pallets = loc.pallet_count || 0;
      const cartons = loc.carton_count || 0;
      const avg = pallets > 0 ? Math.round((cartons / pallets) * 10) / 10 : 0;

      const tr = document.createElement("tr");
      tr.className = "data-row";
      tr.innerHTML = `
        <td>
          <div class="stack">
            <div class="stack-row">
              <span>${loc.code}</span>
            </div>
            <span class="muted">${loc.description || ""}</span>
          </div>
        </td>
        <td>${zone}</td>
        <td>${pallets}</td>
        <td>${cartons}</td>
        <td>${avg}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm">Details später</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Fehler beim Laden des Lagerbestands", err);
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "Fehler beim Laden der Daten. Browser Konsole prüfen.";
    td.className = "muted";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

console.log("✅ navigation.js geladen");

