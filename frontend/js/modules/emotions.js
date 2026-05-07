import { setLastEmotion } from "./config.js";

const EMOTIONS = [
  { label: "Neutral", trend: "Steady" },
  { label: "Calm", trend: "Softening" },
  { label: "Focused", trend: "Rising" },
  { label: "Tired", trend: "Easing" },
  { label: "Stressed", trend: "Cooling" }
];

const emotionHistory = [];
const currentEmotion = {
  label: "neutral",
  confidence: null,
  source: "simulated"
};

let emotionIndex = 0;
let emotionTimer = null;
let elements = null;

function formatTimeStamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function pushEmotion(label) {
  if (!label) {
    return;
  }
  emotionHistory.push(label);
  if (emotionHistory.length > 20) {
    emotionHistory.shift();
  }
  setLastEmotion(label);
}

function updateEmotionUi({ label, confidence, trend, source }) {
  if (!elements) {
    return;
  }

  const { labelEl, confidenceEl, trendEl, updatedEl } = elements;

  if (labelEl) {
    labelEl.textContent = label;
  }
  if (confidenceEl) {
    confidenceEl.textContent =
      typeof confidence === "number"
        ? `Confidence ${Math.round(confidence * 100)}%`
        : "Confidence --";
  }
  if (trendEl) {
    trendEl.textContent = trend || "Steady";
  }
  if (updatedEl) {
    updatedEl.textContent = `Updated at ${formatTimeStamp(new Date())}`;
  }

  currentEmotion.label = label.toLowerCase();
  currentEmotion.confidence =
    typeof confidence === "number" ? confidence : currentEmotion.confidence;
  currentEmotion.source = source || currentEmotion.source;

  window.maitriEmotionState = { ...currentEmotion };

  pushEmotion(currentEmotion.label);
}

function cycleEmotion() {
  emotionIndex = (emotionIndex + 1) % EMOTIONS.length;
  const current = EMOTIONS[emotionIndex];
  const confidence = 0.68 + Math.random() * 0.18;

  updateEmotionUi({
    label: current.label,
    confidence,
    trend: current.trend,
    source: "simulated"
  });
}

export function initEmotionPanel({ labelEl, confidenceEl, trendEl, updatedEl }) {
  elements = { labelEl, confidenceEl, trendEl, updatedEl };
  cycleEmotion();
  startEmotionCycle();
}

export function startEmotionCycle() {
  if (emotionTimer) {
    return;
  }
  emotionTimer = window.setInterval(cycleEmotion, 6500);
}

export function pauseEmotionCycle() {
  if (!emotionTimer) {
    return;
  }
  window.clearInterval(emotionTimer);
  emotionTimer = null;
}

export function resumeEmotionCycle() {
  if (!emotionTimer) {
    startEmotionCycle();
  }
}

export function setLiveEmotion({ label, confidence }) {
  updateEmotionUi({
    label: label || "Unknown",
    confidence,
    trend: "Live",
    source: "live"
  });
}

export function getCurrentEmotion() {
  return { ...currentEmotion };
}

export function getEmotionHistory() {
  return [...emotionHistory];
}
