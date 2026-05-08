import { getLastEmotion, getUserTier, getTierFeatures } from "./config.js";

const CHECK_IN_INTERVAL_MS = 2 * 60 * 60 * 1000;

function buildMessage(emotion) {
  if (/stressed|angry|frustrated|tired/i.test(emotion)) {
    return "Quick reset? Try a 4-breath cycle with MAITRI.";
  }
  return "Time for a quick MAITRI check-in?";
}

let checkInInterval = null;

export function initNotifications() {
  if (!("Notification" in window)) {
    return;
  }

  const features = getTierFeatures(getUserTier());
  if (!features.notifications) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  if (checkInInterval) {
    window.clearInterval(checkInInterval);
  }

  checkInInterval = window.setInterval(() => {
    const lastEmotion = getLastEmotion();
    const message = buildMessage(lastEmotion);
    new Notification("MAITRI", { body: message });
  }, CHECK_IN_INTERVAL_MS);
}
