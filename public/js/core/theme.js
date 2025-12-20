// LVS Returns - Theme Management
// Verwaltet Dark/Light Mode

function applyTheme(theme) {
  const t = theme === "light" ? "light" : "dark";
  document.body.setAttribute("data-theme", t);
  localStorage.setItem("lvsTheme", t);
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.textContent = t === "light" ? "☀" : "☾";
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("lvsTheme") || "dark";
  applyTheme(savedTheme);
  
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }
  
  console.log("✅ Theme initialisiert:", savedTheme);
}

console.log("✅ theme.js geladen");





