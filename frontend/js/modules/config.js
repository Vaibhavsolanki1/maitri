const STORAGE_KEYS = {
  tier: "maitriTier",
  theme: "maitriTheme",
  activeUser: "maitriActiveUser",
  profiles: "maitriProfiles",
  onboarded: "maitriOnboarded",
  voice: "maitriVoice",
  ttsEnabled: "maitriTtsEnabled",
  lastEmotion: "maitriLastEmotion",
  sessions: "maitriSessions"
};

export const API_BASE = window.location.origin;

export const ENDPOINTS = {
  chat: `${API_BASE}/chat`,
  chatStream: `${API_BASE}/chat/stream`,
  history: `${API_BASE}/history`,
  report: `${API_BASE}/report`,
  reports: `${API_BASE}/reports`,
  emergency: `${API_BASE}/api/emergency`,
  yoga: `${API_BASE}/yoga`,
  health: `${API_BASE}/health`,
  weeklyReport: `${API_BASE}/api/weekly-report`,
  meditation: `${API_BASE}/meditation`
};

export const DEFAULT_USER_NAME = "Guest";

function normalizeTier(value) {
  return value === "pro" ? "pro" : "free";
}

export function getUserTier() {
  return normalizeTier(window.localStorage.getItem(STORAGE_KEYS.tier));
}

export function setUserTier(value) {
  const nextTier = normalizeTier(value);
  window.localStorage.setItem(STORAGE_KEYS.tier, nextTier);
  return nextTier;
}

export function getTierFeatures(tier) {
  const features = {
    camera: false,
    voice: false,
    handGesture: false,
    faceRecognition: false,
    emergency: false,
    fullAudioLibrary: false,
    weeklyReport: false,
    moodTimeline: false,
    meditation: false,
    unlimitedChat: false,
    notifications: false
  };

  if (normalizeTier(tier) === "pro") {
    Object.keys(features).forEach((key) => {
      features[key] = true;
    });
  }

  return features;
}

export function buildJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-tier": getUserTier()
  };
}

export function getActiveUser() {
  return window.localStorage.getItem(STORAGE_KEYS.activeUser) || DEFAULT_USER_NAME;
}

function normalizeName(name) {
  return typeof name === "string" ? name.trim() : "";
}

export function getProfiles() {
  const raw = window.localStorage.getItem(STORAGE_KEYS.profiles);
  let profiles = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        profiles = parsed.filter((item) => typeof item === "string");
      }
    } catch (error) {
      profiles = [];
    }
  }

  const active = getActiveUser();
  if (active && !profiles.includes(active)) {
    profiles.unshift(active);
  }

  return profiles;
}

export function setProfiles(list) {
  const cleaned = Array.isArray(list)
    ? Array.from(new Set(list.map((item) => normalizeName(item)).filter(Boolean)))
    : [];
  window.localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(cleaned));
  return cleaned;
}

export function addProfile(name) {
  const trimmed = normalizeName(name);
  if (!trimmed) {
    return getProfiles();
  }
  const profiles = getProfiles();
  if (!profiles.includes(trimmed)) {
    profiles.unshift(trimmed);
  }
  return setProfiles(profiles);
}

export function setActiveUser(name) {
  const trimmed = normalizeName(name) || DEFAULT_USER_NAME;
  window.localStorage.setItem(STORAGE_KEYS.activeUser, trimmed);
  addProfile(trimmed);
  return trimmed;
}

export function getStoredVoice() {
  return window.localStorage.getItem(STORAGE_KEYS.voice) || "";
}

export function setStoredVoice(name) {
  if (name) {
    window.localStorage.setItem(STORAGE_KEYS.voice, name);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.voice);
  }
}

export function isTtsEnabled() {
  const value = window.localStorage.getItem(STORAGE_KEYS.ttsEnabled);
  return value !== "false";
}

export function setTtsEnabled(enabled) {
  window.localStorage.setItem(
    STORAGE_KEYS.ttsEnabled,
    enabled ? "true" : "false"
  );
}

export function setLastEmotion(value) {
  if (value) {
    window.localStorage.setItem(STORAGE_KEYS.lastEmotion, value);
  }
}

export function getLastEmotion() {
  return window.localStorage.getItem(STORAGE_KEYS.lastEmotion) || "";
}

export function getSessionEntries() {
  const raw = window.localStorage.getItem(STORAGE_KEYS.sessions);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function addSessionEntry(entry) {
  const sessions = getSessionEntries();
  sessions.unshift(entry);
  window.localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions.slice(0, 50)));
  return sessions;
}

export function setOnboardingComplete() {
  window.localStorage.setItem(STORAGE_KEYS.onboarded, "true");
}

export function isOnboardingComplete() {
  return window.localStorage.getItem(STORAGE_KEYS.onboarded) === "true";
}
