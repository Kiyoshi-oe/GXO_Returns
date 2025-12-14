// LVS Returns - Utility Functions
// Modal, Lightbox, und andere Hilfsfunktionen

// Custom Modal
function showModal(title, message, icon = "ℹ️", showCancel = false) {
  return new Promise((resolve) => {
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    const modalIcon = document.getElementById("modalIcon");
    const modalOkBtn = document.getElementById("modalOkBtn");
    const modalCancelBtn = document.getElementById("modalCancelBtn");
    const modalClose = document.getElementById("modalClose");
    
    if (!modal) return resolve(false);
    
    modalTitle.textContent = title;
    modalBody.innerHTML = message;
    modalIcon.textContent = icon;
    modalCancelBtn.style.display = showCancel ? "inline-flex" : "none";
    
    modal.classList.add("active");
    
    const closeModal = (result) => {
      modal.classList.remove("active");
      resolve(result);
    };
    
    modalOkBtn.onclick = () => closeModal(true);
    modalCancelBtn.onclick = () => closeModal(false);
    modalClose.onclick = () => closeModal(false);
    
    // ESC-Taste
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Klick außerhalb schließt Modal
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal(false);
      }
    };
  });
}

// Image Lightbox
function initLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeBtn = document.querySelector(".lightbox-close");
  
  if (!lightbox || !lightboxImage) return;
  
  // Event Delegation für dynamisch erstellte Bilder
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("label-image-thumbnail")) {
      if (e.target.src && e.target.src !== "") {
        lightboxImage.src = e.target.src;
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    }
  });
  
  const closeLightbox = () => {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => {
      lightboxImage.src = "";
    }, 300);
  };
  
  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }
  
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Schließe Lightbox mit ESC-Taste
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
  
  console.log("✅ Lightbox initialisiert");
}

// Loading Screen
function hideLoadingScreen() {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
      setTimeout(() => {
        loadingScreen.remove();
      }, 600);
    }
  }, 800);
}

// Windows Benutzer laden
async function loadCurrentWindowsUser() {
  try {
    const response = await fetch("/api/current-user");
    if (response.ok) {
      const data = await response.json();
      currentWindowsUser = data.username || "Unbekannt";
      
      const userDisplay = document.getElementById("currentUserDisplay");
      if (userDisplay) {
        userDisplay.textContent = `👤 ${currentWindowsUser}`;
      }
      
      console.log("✅ Windows-Benutzer geladen:", currentWindowsUser);
      return currentWindowsUser;
    }
  } catch (err) {
    console.error("Fehler beim Laden des Benutzers:", err);
  }
  return "Unbekannt";
}

console.log("✅ utils.js geladen");





