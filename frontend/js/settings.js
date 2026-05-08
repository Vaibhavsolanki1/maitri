import { initTheme, bindThemeToggle } from "./modules/theme.js";
import { 
  getActiveUser,
  setActiveUser,
  getProfiles,
  addProfile,
  logoutUser,
  getUserTier, 
  setUserTier, 
  isTtsEnabled, 
  setTtsEnabled, 
  getStoredVoice, 
  setStoredVoice,
  getLayoutOrder,
  setLayoutOrder
} from "./modules/config.js";

const toggleTheme = document.getElementById("toggle-theme");
initTheme(toggleTheme);
bindThemeToggle(toggleTheme);

const userSwitchSelect = document.getElementById("setting-user-switch");
const newProfileInput = document.getElementById("setting-new-profile");
const addProfileBtn = document.getElementById("setting-add-profile");
const logoutBtn = document.getElementById("setting-logout");

function populateProfiles() {
  const profiles = getProfiles();
  userSwitchSelect.innerHTML = "";
  profiles.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    userSwitchSelect.appendChild(option);
  });
  userSwitchSelect.value = getActiveUser();
}

populateProfiles();

userSwitchSelect.addEventListener("change", (e) => {
  setActiveUser(e.target.value);
  window.location.reload();
});

addProfileBtn.addEventListener("click", () => {
  const name = newProfileInput.value.trim();
  if (name) {
    addProfile(name);
    setActiveUser(name);
    window.location.reload();
  }
});

logoutBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    logoutUser();
    window.location.href = "index.html";
  }
});

const ttsSelect = document.getElementById("setting-tts");
ttsSelect.value = isTtsEnabled() ? "true" : "false";
ttsSelect.addEventListener("change", (e) => {
  setTtsEnabled(e.target.value === "true");
});

const tierSelect = document.getElementById("setting-tier");
tierSelect.value = getUserTier();
tierSelect.addEventListener("change", (e) => {
  setUserTier(e.target.value);
});

const voiceSelect = document.getElementById("setting-voice");
function populateVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (voices.length === 0) return;
  
  voiceSelect.innerHTML = "";
  const storedVoice = getStoredVoice();
  
  voices.forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (voice.name === storedVoice) {
      option.selected = true;
    }
    voiceSelect.appendChild(option);
  });
  
  if (!storedVoice && voices.length > 0) {
    voiceSelect.value = voices[0].name;
  }
}

if (window.speechSynthesis) {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

voiceSelect.addEventListener("change", (e) => {
  setStoredVoice(e.target.value);
});

document.getElementById("clear-face-data").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear your local face recognition data?")) {
    window.localStorage.removeItem("maitriFaces");
    alert("Face data cleared.");
  }
});

document.getElementById("clear-all-data").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear ALL local settings, profiles, and data?")) {
    window.localStorage.clear();
    alert("All data cleared. Refreshing app...");
    window.location.href = "index.html";
  }
});

// Layout Editor
const layoutEditor = document.getElementById("layout-editor");
const btnSaveLayout = document.getElementById("setting-save-layout");
const btnResetLayout = document.getElementById("setting-reset-layout");

const PANEL_LABELS = {
  camera: "Presence (Camera)",
  emotion: "Emotion State",
  vitals: "Vitals",
  chat: "Assistant Chat",
  actions: "Quick Actions"
};

function initLayoutEditor() {
  if (!layoutEditor) return;
  const currentOrder = getLayoutOrder();
  layoutEditor.innerHTML = "";

  currentOrder.forEach((panelId) => {
    if (!PANEL_LABELS[panelId]) return;
    const card = document.createElement("div");
    card.className = "layout-card";
    card.draggable = true;
    card.dataset.panelId = panelId;

    const grip = document.createElement("div");
    grip.className = "layout-grip";
    grip.innerHTML = "⠿";
    
    const label = document.createElement("span");
    label.textContent = PANEL_LABELS[panelId];

    card.appendChild(grip);
    card.appendChild(label);
    layoutEditor.appendChild(card);

    card.addEventListener("dragstart", (e) => {
      card.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", panelId);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      Array.from(layoutEditor.children).forEach(c => c.classList.remove("drag-over"));
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      
      const draggingCard = layoutEditor.querySelector(".is-dragging");
      if (draggingCard && draggingCard !== card) {
        card.classList.add("drag-over");
      }
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const draggingCard = layoutEditor.querySelector(".is-dragging");
      if (draggingCard && draggingCard !== card) {
        // Insert before or after based on mouse position relative to center
        const rect = card.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y < rect.height / 2) {
          layoutEditor.insertBefore(draggingCard, card);
        } else {
          layoutEditor.insertBefore(draggingCard, card.nextSibling);
        }
      }
    });
  });
}

if (layoutEditor) {
  initLayoutEditor();

  btnSaveLayout.addEventListener("click", () => {
    const newOrder = Array.from(layoutEditor.children).map(c => c.dataset.panelId);
    setLayoutOrder(newOrder);
    btnSaveLayout.textContent = "Saved!";
    btnSaveLayout.style.background = "var(--accent-2)";
    setTimeout(() => {
      btnSaveLayout.textContent = "Save Layout";
      btnSaveLayout.style.background = "";
    }, 2000);
  });

  btnResetLayout.addEventListener("click", () => {
    window.localStorage.removeItem("maitriLayout");
    initLayoutEditor();
  });
}
