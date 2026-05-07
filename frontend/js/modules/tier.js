import { getUserTier, setUserTier, getTierFeatures } from "./config.js";

const FEATURE_LABELS = {
  camera: "Live camera presence",
  voice: "Voice interface",
  handGesture: "Hand gesture control",
  faceRecognition: "Face recognition",
  emergency: "Emergency protocol",
  fullAudioLibrary: "Full audio library",
  weeklyReport: "Weekly AI report",
  moodTimeline: "Mood timeline",
  meditation: "Meditation timer",
  unlimitedChat: "Unlimited chat",
  notifications: "Check-in notifications"
};

export function initTierGate({ elements, onTierChange }) {
  const {
    upgradeModal,
    upgradeTitle,
    upgradeDescription,
    upgradeConfirm,
    upgradeCancel,
    tierBadge
  } = elements;

  function updateTierBadge() {
    if (!tierBadge) {
      return;
    }
    const tier = getUserTier();
    tierBadge.textContent = tier === "pro" ? "MAITRI Pro" : "MAITRI Free";
    tierBadge.dataset.tier = tier;
  }

  function showUpgrade(featureKey) {
    if (!upgradeModal) {
      return;
    }
    const label = FEATURE_LABELS[featureKey] || "This feature";
    if (upgradeTitle) {
      upgradeTitle.textContent = `${label} is Pro-only`;
    }
    if (upgradeDescription) {
      upgradeDescription.textContent =
        "Upgrade to MAITRI Pro to unlock this experience instantly.";
    }
    upgradeModal.classList.add("is-open");
  }

  function closeUpgrade() {
    if (upgradeModal) {
      upgradeModal.classList.remove("is-open");
    }
  }

  function requireFeature(featureKey, onAllowed) {
    const features = getTierFeatures(getUserTier());
    if (features[featureKey]) {
      if (typeof onAllowed === "function") {
        onAllowed();
      }
      return true;
    }

    showUpgrade(featureKey);
    return false;
  }

  if (upgradeConfirm) {
    upgradeConfirm.addEventListener("click", () => {
      setUserTier("pro");
      updateTierBadge();
      closeUpgrade();
      if (typeof onTierChange === "function") {
        onTierChange("pro");
      }
    });
  }

  if (upgradeCancel) {
    upgradeCancel.addEventListener("click", closeUpgrade);
  }

  if (upgradeModal) {
    upgradeModal.addEventListener("click", (event) => {
      if (event.target === upgradeModal) {
        closeUpgrade();
      }
    });
  }

  updateTierBadge();

  return {
    requireFeature,
    showUpgrade,
    updateTierBadge
  };
}
