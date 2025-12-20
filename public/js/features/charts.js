// LVS Returns - Chart Initialisierung
// Chart.js Diagramme für Dashboard

function initCharts() {
  const ctxWeek = document.getElementById("chartByWeek");
  const ctxCarrier = document.getElementById("chartByCarrier");
  const ctxRaStatus = document.getElementById("chartRaStatus");
  
  if (!window.Chart) {
    console.warn("⚠️ Chart.js nicht geladen");
    return;
  }

  // Wöchentliche Retouren
  if (ctxWeek) {
    new Chart(ctxWeek, {
      type: "line",
      data: {
        labels: ["CW 45", "CW 46", "CW 47", "CW 48", "CW 49", "CW 50"],
        datasets: [{
          label: "Retouren gesamt",
          data: [180, 210, 260, 230, 280, 300],
          borderColor: "#F53B01",
          backgroundColor: "rgba(245,59,1,0.18)",
          tension: 0.25,
          pointRadius: 3
        }]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.08)" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Retouren nach Carrier
  if (ctxCarrier) {
    new Chart(ctxCarrier, {
      type: "bar",
      data: {
        labels: ["DPD", "Geodis", "DHL", "BRT", "FedEx", "Andere"],
        datasets: [{
          label: "Anzahl Sendungen",
          data: [85, 62, 48, 35, 28, 42],
          backgroundColor: [
            "rgba(245,59,1,0.7)",
            "rgba(245,59,1,0.6)",
            "rgba(245,59,1,0.5)",
            "rgba(245,59,1,0.4)",
            "rgba(245,59,1,0.3)",
            "rgba(245,59,1,0.2)"
          ],
          borderColor: "#F53B01",
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.08)" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // RA Status
  if (ctxRaStatus) {
    new Chart(ctxRaStatus, {
      type: "doughnut",
      data: {
        labels: ["Gültig", "Offen", "Konflikt"],
        datasets: [{
          data: [58, 32, 10],
          backgroundColor: [
            "rgba(16,185,129,0.7)",
            "rgba(245,158,11,0.7)",
            "rgba(239,68,68,0.7)"
          ],
          borderColor: ["#10B981", "#F59E0B", "#EF4444"],
          borderWidth: 2
        }]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 12, font: { size: 11 } }
          }
        }
      }
    });
  }
  
  console.log("✅ Charts initialisiert");
}

console.log("✅ charts.js geladen");





