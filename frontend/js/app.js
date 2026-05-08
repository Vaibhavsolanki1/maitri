import {
  ENDPOINTS,
  getActiveUser,
  setActiveUser,
  getProfiles,
  addProfile,
  getUserTier,
  getTierFeatures
} from "./modules/config.js";
import { initTheme, bindThemeToggle } from "./modules/theme.js";
import {
  initEmotionPanel,
  pauseEmotionCycle,
  resumeEmotionCycle,
  setLiveEmotion,
  getCurrentEmotion,
  getEmotionHistory
} from "./modules/emotions.js";
import { initVitals, getVitalsSnapshot } from "./modules/vitals.js";
import { initSpeech, speakText } from "./modules/speech.js";
import { createChatController } from "./modules/chat.js";
import { createCameraController } from "./modules/camera.js";
import { startGestureDetection, stopGestureDetection } from "./modules/gestures.js";
import { createModalController } from "./modules/modals.js";
import { initTierGate } from "./modules/tier.js";
import { initOnboarding } from "./modules/onboarding.js";
import { initNotifications } from "./modules/notifications.js";

const elements = {
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  chatMessages: document.getElementById("chat-messages"),
  systemStatus: document.getElementById("system-status"),
  toggleTheme: document.getElementById("toggle-theme"),
  enableCamera: document.getElementById("enable-camera"),
  chatMicButton: document.getElementById("chat-mic"),
  cameraPlaceholder: document.getElementById("camera-placeholder"),
  cameraFeed: document.getElementById("camera-feed"),
  cameraStatus: document.getElementById("camera-status"),
  emotionMode: document.getElementById("emotion-mode"),
  activeUserLabel: document.getElementById("active-user"),
  identityNameInput: document.getElementById("identity-name"),
  enrollFaceButton: document.getElementById("enroll-face"),
  addProfileToggle: document.getElementById("add-profile-toggle"),
  addProfilePanel: document.getElementById("add-profile-panel"),
  userSwitcher: document.getElementById("user-switcher"),
  tierBadge: document.getElementById("tier-badge"),
  overlayBreathing: document.getElementById("overlay-breathing"),
  overlayMusic: document.getElementById("overlay-music"),
  modalReport: document.getElementById("modal-report"),
  modalEmergency: document.getElementById("modal-emergency"),
  breathingContainer: document.getElementById("breathing-container"),
  breathingText: document.getElementById("breathing-text"),
  musicPlayer: document.getElementById("music-player"),
  musicSource: document.getElementById("music-source"),
  musicPlay: document.getElementById("music-play"),
  musicPause: document.getElementById("music-pause"),
  musicVolume: document.getElementById("music-volume"),
  musicLibrary: document.getElementById("music-library"),
  musicNowTitle: document.getElementById("music-now-title"),
  musicNotice: document.getElementById("music-notice"),
  reportText: document.getElementById("report-text"),
  reportSubmit: document.getElementById("report-submit"),
  reportCount: document.getElementById("report-count"),
  reportTags: document.querySelectorAll(".report-tag"),
  emergencyCancel: document.getElementById("emergency-cancel"),
  emergencyConfirm: document.getElementById("emergency-confirm"),
  alertHr: document.getElementById("alert-hr"),
  alertSpo2: document.getElementById("alert-spo2"),
  alertTemp: document.getElementById("alert-temp"),
  emotionLabel: document.getElementById("emotion-label"),
  emotionConfidence: document.getElementById("emotion-confidence"),
  emotionTrend: document.getElementById("emotion-trend"),
  emotionUpdated: document.getElementById("emotion-updated"),
  vitalHr: document.getElementById("vital-hr"),
  vitalSpo2: document.getElementById("vital-spo2"),
  vitalTemp: document.getElementById("vital-temp"),
  vitalsUpdated: document.getElementById("vitals-updated"),
  vitalsChart: document.getElementById("vitals-chart"),
  btnBreathing: document.getElementById("btn-breathing"),
  btnAudio: document.getElementById("btn-audio"),
  btnYoga: document.getElementById("btn-yoga"),
  btnReport: document.getElementById("btn-report"),
  btnEmergency: document.getElementById("btn-emergency"),
  btnVitals: document.getElementById("btn-vitals"),
  btnMeditation: document.getElementById("btn-meditation"),
  cameraProgress: document.getElementById("camera-progress"),
  cameraStep: document.getElementById("camera-step"),
  cameraProgressFill: document.getElementById("camera-progress-fill"),
  cancelCamera: document.getElementById("cancel-camera"),
  upgradeModal: document.getElementById("upgrade-modal"),
  upgradeTitle: document.getElementById("upgrade-title"),
  upgradeDescription: document.getElementById("upgrade-description"),
  upgradeConfirm: document.getElementById("upgrade-confirm"),
  upgradeCancel: document.getElementById("upgrade-cancel"),
  onboardingOverlay: document.getElementById("onboarding"),
  onboardingSteps: Array.from(document.querySelectorAll(".onboarding-step")),
  onboardingBack: document.getElementById("onboarding-back"),
  onboardingNext: document.getElementById("onboarding-next"),
  onboardingName: document.getElementById("onboarding-name"),
  onboardingTierButtons: Array.from(document.querySelectorAll(".onboarding-tier")),
  onboardingCamera: document.getElementById("onboarding-camera"),
  onboardingNotifications: document.getElementById("onboarding-notifications")
};

let activeUser = getActiveUser();

function updateActiveUserUi(name) {
  if (elements.activeUserLabel) {
    elements.activeUserLabel.textContent = name;
  }
  if (elements.userSwitcher) {
    elements.userSwitcher.value = name;
  }
}

function refreshProfileOptions(selected) {
  if (!elements.userSwitcher) {
    return;
  }

  const profiles = getProfiles();
  elements.userSwitcher.innerHTML = "";
  profiles.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.userSwitcher.appendChild(option);
  });
  elements.userSwitcher.value = selected;
}

function setActiveUserName(name, options = {}) {
  const next = setActiveUser(name);
  activeUser = next;
  updateActiveUserUi(next);
  refreshProfileOptions(next);
  if (options.loadHistory && chatController) {
    chatController.loadChatHistory(next);
  }
}

function toggleAddProfilePanel() {
  if (!elements.addProfilePanel) {
    return;
  }

  const isOpen = elements.addProfilePanel.classList.toggle("is-open");
  elements.addProfilePanel.setAttribute("aria-hidden", String(!isOpen));
  if (elements.addProfileToggle) {
    elements.addProfileToggle.textContent = isOpen ? "-" : "+";
    elements.addProfileToggle.classList.toggle("is-active", isOpen);
  }
  if (isOpen && elements.identityNameInput) {
    elements.identityNameInput.focus();
  }
}

initTheme(elements.toggleTheme);
bindThemeToggle(elements.toggleTheme);

const tierGate = initTierGate({
  elements: {
    upgradeModal: elements.upgradeModal,
    upgradeTitle: elements.upgradeTitle,
    upgradeDescription: elements.upgradeDescription,
    upgradeConfirm: elements.upgradeConfirm,
    upgradeCancel: elements.upgradeCancel,
    tierBadge: elements.tierBadge
  },
  onTierChange: () => {
    applyTierUi();
    initNotifications();
  }
});

function applyTierUi() {
  const tier = getUserTier();
  const features = getTierFeatures(tier);
  document.body.dataset.tier = tier;

  const lockMap = [
    { el: elements.enableCamera, feature: "camera" },
    { el: elements.chatMicButton, feature: "voice" },
    { el: elements.btnEmergency, feature: "emergency" },
    { el: elements.btnMeditation, feature: "meditation" }
  ];

  lockMap.forEach(({ el, feature }) => {
    if (!el) {
      return;
    }
    el.classList.toggle("is-locked", !features[feature]);
  });
}

applyTierUi();

initEmotionPanel({
  labelEl: elements.emotionLabel,
  confidenceEl: elements.emotionConfidence,
  trendEl: elements.emotionTrend,
  updatedEl: elements.emotionUpdated
});

initVitals({
  hrEl: elements.vitalHr,
  spo2El: elements.vitalSpo2,
  tempEl: elements.vitalTemp,
  updatedEl: elements.vitalsUpdated,
  chartEl: elements.vitalsChart
});

const chatController = createChatController({
  elements: {
    chatForm: elements.chatForm,
    chatInput: elements.chatInput,
    chatMessages: elements.chatMessages,
    chatSubmit: elements.chatForm
      ? elements.chatForm.querySelector("button[type=\"submit\"]")
      : null,
    systemStatus: elements.systemStatus
  },
  endpoints: ENDPOINTS,
  speakText,
  onAction: (action) => {
    if (action === "breathing") {
      modalController.startBreathingExercise();
    } else if (action === "music") {
      modalController.openMusic();
    } else if (action === "yoga") {
      window.location.href = "yoga.html";
    } else if (action === "emergency") {
      // Auto-trigger emergency response
      modalController.showEmergency();
    }
  },
  onCrisis: (crisisData) => {
    // Called when a crisis response is detected
    console.warn("🚨 CRISIS DETECTED:", crisisData.severity);
    modalController.showEmergency();
  },
  onRequireUpgrade: (feature) => tierGate.showUpgrade(feature),
  getContext: () => {
    const emotion = getCurrentEmotion();
    return {
      userName: activeUser,
      emotion: emotion.label || "neutral",
      emotionConfidence:
        typeof emotion.confidence === "number" ? emotion.confidence : null,
      vitals: getVitalsSnapshot(),
      emotionHistory: getEmotionHistory()
    };
  }
});

const speechController = initSpeech({
  micButton: elements.chatMicButton,
  systemStatus: elements.systemStatus,
  inputEl: elements.chatInput,
  onSendMessage: (text) => {
    if (elements.chatInput) {
      elements.chatInput.value = text;
    }
    chatController.sendMessage(text);
  },
  requireFeature: (feature, onAllowed) => tierGate.requireFeature(feature, onAllowed)
});

const cameraController = createCameraController({
  elements: {
    cameraPlaceholder: elements.cameraPlaceholder,
    cameraFeed: elements.cameraFeed,
    cameraStatus: elements.cameraStatus,
    emotionMode: elements.emotionMode,
    enableCamera: elements.enableCamera,
    systemStatus: elements.systemStatus,
    cameraProgress: elements.cameraProgress,
    cameraStep: elements.cameraStep,
    cameraProgressFill: elements.cameraProgressFill,
    cancelCamera: elements.cancelCamera,
    identityNameInput: elements.identityNameInput,
    enrollFaceButton: elements.enrollFaceButton
  },
  onStatus: (text) => {
    if (elements.systemStatus) {
      elements.systemStatus.textContent = text;
    }
  },
  onEmotion: ({ label, confidence }) => {
    pauseEmotionCycle();
    setLiveEmotion({ label, confidence });
  },
  onFaceMatch: (name) => {
    if (name) {
      setActiveUserName(name, { loadHistory: true });
    }
  },
  onCameraState: ({ active, stream }) => {
    const features = getTierFeatures(getUserTier());
    if (active && features.handGesture) {
      startGestureDetection(elements.cameraFeed, stream);
    } else {
      stopGestureDetection();
    }
    if (!active) {
      resumeEmotionCycle();
    }
  },
  requireFeature: (feature, onAllowed) => tierGate.requireFeature(feature, onAllowed),
  canUseFaceRecognition: () =>
    getTierFeatures(getUserTier()).faceRecognition
});

const modalController = createModalController({
  elements,
  endpoints: ENDPOINTS,
  getContext: () => {
    const emotion = getCurrentEmotion();
    return {
      userName: activeUser,
      emotion: emotion.label || "neutral",
      vitals: getVitalsSnapshot()
    };
  },
  onNavigate: (target) => {
    if (target === "yoga") {
      window.location.href = "yoga.html";
    }
  },
  requireFeature: (feature, onAllowed) => tierGate.requireFeature(feature, onAllowed)
});

if (elements.addProfileToggle) {
  elements.addProfileToggle.addEventListener("click", toggleAddProfilePanel);
}

if (elements.userSwitcher) {
  elements.userSwitcher.addEventListener("change", (event) => {
    const value = event.target.value;
    if (value) {
      setActiveUserName(value, { loadHistory: true });
    }
  });
}

if (elements.identityNameInput) {
  elements.identityNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const name = elements.identityNameInput.value.trim();
      if (name) {
        addProfile(name);
        setActiveUserName(name, { loadHistory: true });
        elements.identityNameInput.value = "";
      }
    }
  });
}

if (elements.btnMeditation) {
  elements.btnMeditation.addEventListener("click", () => {
    tierGate.requireFeature("meditation", () => {
      window.location.href = "meditation.html";
    });
  });
}

refreshProfileOptions(activeUser);
updateActiveUserUi(activeUser);
chatController.loadChatHistory(activeUser);

initOnboarding({
  elements: {
    overlay: elements.onboardingOverlay,
    steps: elements.onboardingSteps,
    backButton: elements.onboardingBack,
    nextButton: elements.onboardingNext,
    nameInput: elements.onboardingName,
    tierButtons: elements.onboardingTierButtons,
    cameraButton: elements.onboardingCamera,
    notificationsButton: elements.onboardingNotifications
  },
  onFinish: () => {
    setActiveUserName(getActiveUser(), { loadHistory: true });
    tierGate.updateTierBadge();
    applyTierUi();
    initNotifications();
  },
  requestCameraAccess: () => cameraController.requestPermission()
});

initNotifications();

window.setInterval(async () => {
  try {
    const res = await fetch(ENDPOINTS.health);
    if (res.ok && elements.systemStatus) {
      if (elements.systemStatus.textContent === "Offline") {
        elements.systemStatus.textContent = "System ready";
      }
    }
  } catch (error) {
    if (elements.systemStatus) {
      elements.systemStatus.textContent = "Offline";
    }
  }
}, 30000);

window.addEventListener("load", () => {
  const splash = document.getElementById("startup-splash");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 500);
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
