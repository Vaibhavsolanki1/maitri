const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const systemStatus = document.getElementById("system-status");
const toggleTheme = document.getElementById("toggle-theme");
const enableCamera = document.getElementById("enable-camera");
const chatSubmit = chatForm ? chatForm.querySelector("button[type=\"submit\"]") : null;
const chatMicButton = document.getElementById("chat-mic");

const CHAT_ENDPOINT = "http://localhost:3000/chat";
const HISTORY_ENDPOINT = "http://localhost:3000/history";
const DEFAULT_USER_NAME = "Aksh";

const cameraPlaceholder = document.getElementById("camera-placeholder");
const cameraFeed = document.getElementById("camera-feed");
const cameraStatus = document.getElementById("camera-status");
const emotionMode = document.getElementById("emotion-mode");
const activeUserLabel = document.getElementById("active-user");
const identityNameInput = document.getElementById("identity-name");
const enrollFaceButton = document.getElementById("enroll-face");
const addProfileToggle = document.getElementById("add-profile-toggle");
const addProfilePanel = document.getElementById("add-profile-panel");

const emotionLabel = document.getElementById("emotion-label");
const emotionConfidence = document.getElementById("emotion-confidence");
const emotionTrend = document.getElementById("emotion-trend");
const emotionUpdated = document.getElementById("emotion-updated");

const vitalHr = document.getElementById("vital-hr");
const vitalSpo2 = document.getElementById("vital-spo2");
const vitalTemp = document.getElementById("vital-temp");
const vitalsUpdated = document.getElementById("vitals-updated");

const vitalsChart = document.getElementById("vitals-chart");
const chartContext = vitalsChart.getContext("2d");

const emotions = [
  { label: "Neutral", trend: "Steady" },
  { label: "Calm", trend: "Softening" },
  { label: "Focused", trend: "Rising" },
  { label: "Tired", trend: "Easing" },
  { label: "Stressed", trend: "Cooling" }
];

const vitalsState = {
  hr: 78,
  spo2: 97,
  temp: 36.9,
  history: []
};

let micActive = false;
let emotionIndex = 0;
let cameraStream = null;
let detectionTimer = null;
let emotionTimer = null;
let modelsReady = false;
let recognitionReady = false;
const currentEmotion = {
  label: "neutral",
  confidence: null,
  source: "simulated"
};
const identityState = {
  name: DEFAULT_USER_NAME,
  source: "manual"
};

const defaultGreeting = "Welcome back. I am here with you. How are you feeling?";

let ttsEnabled = true;
let speechRecognition = null;
let recognizedTranscript = "";
let faceMatcher = null;
let knownFaces = [];

function formatTimeStamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function renderGreeting() {
  chatMessages.innerHTML = "";
  addMessage(defaultGreeting, "system");
}

function setActiveUser(name, source, options = {}) {
  if (!isNonEmptyString(name)) {
    return;
  }

  const trimmed = name.trim();
  const changed = trimmed !== identityState.name;

  identityState.name = trimmed;
  identityState.source = source || "manual";

  if (activeUserLabel) {
    activeUserLabel.textContent = trimmed;
  }

  if (options.loadHistory || changed) {
    loadChatHistory(trimmed);
  }
}

function addMessage(text, role, options = {}) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  if (options.loading) {
    message.classList.add("loading");
  }

  const content = document.createElement("p");
  content.textContent = text;
  message.appendChild(content);

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent =
    options.meta || (role === "user" ? "You" : role === "error" ? "System" : "MAITRI");
  message.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "message-actions";
  const speakButton = document.createElement("button");
  speakButton.type = "button";
  speakButton.className = "speaker-button";
  speakButton.textContent = "Speak";
  speakButton.addEventListener("click", () => {
    speakText(text);
  });
  actions.appendChild(speakButton);
  message.appendChild(actions);

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function setLoadingState(isLoading) {
  if (chatSubmit) {
    chatSubmit.disabled = isLoading;
  }
  chatInput.disabled = isLoading;
  if (isLoading) {
    systemStatus.textContent = "Thinking";
  } else {
    systemStatus.textContent = micActive ? "Listening" : "System ready";
  }
}

function updateVitals() {
  const hrDelta = Math.random() * 4 - 2;
  const spo2Delta = Math.random() * 0.4 - 0.2;
  const tempDelta = Math.random() * 0.2 - 0.1;

  vitalsState.hr = Math.max(62, Math.min(102, vitalsState.hr + hrDelta));
  vitalsState.spo2 = Math.max(94, Math.min(100, vitalsState.spo2 + spo2Delta));
  vitalsState.temp = Math.max(36.3, Math.min(37.6, vitalsState.temp + tempDelta));

  vitalHr.textContent = `${Math.round(vitalsState.hr)} bpm`;
  vitalSpo2.textContent = `${Math.round(vitalsState.spo2)}%`;
  vitalTemp.textContent = `${vitalsState.temp.toFixed(1)} C`;
  vitalsUpdated.textContent = `Updated at ${formatTimeStamp(new Date())}`;

  vitalsState.history.push(vitalsState.hr);
  if (vitalsState.history.length > 30) {
    vitalsState.history.shift();
  }

  drawVitalsChart();
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  vitalsChart.width = vitalsChart.clientWidth * ratio;
  vitalsChart.height = vitalsChart.clientHeight * ratio;
  chartContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawVitalsChart() {
  const width = vitalsChart.clientWidth;
  const height = vitalsChart.clientHeight;
  const points = vitalsState.history;

  chartContext.clearRect(0, 0, width, height);
  chartContext.strokeStyle = "rgba(228, 127, 99, 0.8)";
  chartContext.lineWidth = 2;

  if (points.length < 2) {
    return;
  }

  const min = Math.min(...points) - 5;
  const max = Math.max(...points) + 5;
  const range = max - min || 1;

  chartContext.beginPath();
  points.forEach((value, index) => {
    const x = (index / (points.length - 1)) * (width - 20) + 10;
    const y = height - ((value - min) / range) * (height - 20) - 10;
    if (index === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  });
  chartContext.stroke();
}

function cycleEmotion() {
  emotionIndex = (emotionIndex + 1) % emotions.length;
  const current = emotions[emotionIndex];
  const confidence = 68 + Math.floor(Math.random() * 18);

  emotionLabel.textContent = current.label;
  emotionTrend.textContent = current.trend;
  emotionConfidence.textContent = `Confidence ${confidence}%`;
  emotionUpdated.textContent = `Updated at ${formatTimeStamp(new Date())}`;

  currentEmotion.label = current.label.toLowerCase();
  currentEmotion.confidence = confidence / 100;
  currentEmotion.source = "simulated";
}

async function loadModels() {
  if (modelsReady) {
    return;
  }

  if (!window.faceapi) {
    throw new Error("face-api.js failed to load");
  }

  const modelPath = "./models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
    faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
  ]);

  try {
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
    recognitionReady = true;
  } catch (error) {
    console.warn("Face recognition model missing:", error);
    recognitionReady = false;
  }

  modelsReady = true;
  loadStoredFaces();
}

function serializeDescriptors(descriptors) {
  return descriptors.map((descriptor) => Array.from(descriptor));
}

function hydrateDescriptors(entries) {
  return entries.map((entry) =>
    new faceapi.LabeledFaceDescriptors(
      entry.label,
      entry.descriptors.map((descriptor) => new Float32Array(descriptor))
    )
  );
}

function updateFaceMatcher() {
  if (knownFaces.length === 0) {
    faceMatcher = null;
    return;
  }
  faceMatcher = new faceapi.FaceMatcher(knownFaces, 0.6);
}

function loadStoredFaces() {
  try {
    const raw = window.localStorage.getItem("maitriFaces");
    if (!raw) {
      knownFaces = [];
      updateFaceMatcher();
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      knownFaces = [];
      updateFaceMatcher();
      return;
    }

    knownFaces = hydrateDescriptors(parsed);
    updateFaceMatcher();
  } catch (error) {
    console.warn("Failed to load stored faces:", error);
    knownFaces = [];
    updateFaceMatcher();
  }
}

function saveStoredFaces() {
  const payload = knownFaces.map((item) => ({
    label: item.label,
    descriptors: serializeDescriptors(item.descriptors)
  }));
  window.localStorage.setItem("maitriFaces", JSON.stringify(payload));
}

function formatEmotionLabel(label) {
  if (!label) {
    return "Unknown";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function startEmotionDetection() {
  if (!cameraFeed) {
    return;
  }

  if (detectionTimer) {
    window.clearInterval(detectionTimer);
  }

  detectionTimer = window.setInterval(async () => {
    if (!cameraStream || cameraFeed.readyState < 2) {
      return;
    }

    try {
      const detectionTask = faceapi
        .detectSingleFace(cameraFeed, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceExpressions();

      const detection = recognitionReady
        ? await detectionTask.withFaceDescriptor()
        : await detectionTask;

      if (!detection || !detection.expressions) {
        emotionLabel.textContent = "No face";
        emotionConfidence.textContent = "Confidence --";
        emotionTrend.textContent = "Waiting";
        emotionUpdated.textContent = `Updated at ${formatTimeStamp(new Date())}`;
        return;
      }

      const entries = Object.entries(detection.expressions);
      entries.sort((a, b) => b[1] - a[1]);
      const [topLabel, topScore] = entries[0];

      emotionLabel.textContent = formatEmotionLabel(topLabel);
      emotionConfidence.textContent = `Confidence ${Math.round(topScore * 100)}%`;
      emotionTrend.textContent = "Live";
      emotionUpdated.textContent = `Updated at ${formatTimeStamp(new Date())}`;

      currentEmotion.label = topLabel;
      currentEmotion.confidence = topScore;
      currentEmotion.source = "live";

      if (recognitionReady && faceMatcher && detection.descriptor) {
        const match = faceMatcher.findBestMatch(detection.descriptor);
        if (match.label !== "unknown") {
          setActiveUser(match.label, "face");
        }
      }
    } catch (error) {
      console.warn("Emotion detection error:", error);
    }
  }, 900);
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API not supported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 360 }
    },
    audio: false
  });

  cameraFeed.srcObject = stream;
  cameraStream = stream;
  await cameraFeed.play();
}

function updateMicUi(isActive) {
  micActive = isActive;
  if (chatMicButton) {
    chatMicButton.classList.toggle("is-active", isActive);
  }
  if (!isActive && systemStatus.textContent === "Listening") {
    systemStatus.textContent = "System ready";
  }
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = "en-US";
  speechRecognition.interimResults = true;
  speechRecognition.continuous = false;

  speechRecognition.onstart = () => {
    recognizedTranscript = "";
    updateMicUi(true);
    systemStatus.textContent = "Listening";
  };

  speechRecognition.onend = () => {
    updateMicUi(false);
  };

  speechRecognition.onerror = (event) => {
    updateMicUi(false);
    const reason = event && event.error ? event.error : "unknown";
    systemStatus.textContent = `Mic error: ${reason}`;
  };

  speechRecognition.onresult = (event) => {
    let interim = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interim += transcript;
      }
    }

    recognizedTranscript = (finalTranscript || interim).trim();
    if (recognizedTranscript) {
      chatInput.value = recognizedTranscript;
    }

    if (finalTranscript) {
      chatInput.focus();
    }
  };
}

function speakText(text) {
  if (!window.speechSynthesis || !isNonEmptyString(text)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  toggleTheme.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
  toggleTheme.classList.toggle("is-active", nextTheme === "dark");
  window.localStorage.setItem("maitriTheme", nextTheme);
}

function toggleAddProfilePanel() {
  if (!addProfilePanel) {
    return;
  }

  const isOpen = addProfilePanel.classList.toggle("is-open");
  addProfilePanel.setAttribute("aria-hidden", String(!isOpen));
  addProfileToggle.textContent = isOpen ? "-" : "+";
  addProfileToggle.classList.toggle("is-active", isOpen);
  if (isOpen && identityNameInput) {
    identityNameInput.focus();
  }
}

function initTheme() {
  const stored = window.localStorage.getItem("maitriTheme");
  if (stored) {
    applyTheme(stored);
    return;
  }

  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

async function enrollCurrentFace() {
  const name = identityNameInput.value.trim();
  if (!name) {
    systemStatus.textContent = "Enter a name to enroll";
    return;
  }

  if (!cameraStream) {
    systemStatus.textContent = "Enable camera first";
    return;
  }

  try {
    await loadModels();
    if (!recognitionReady) {
      systemStatus.textContent = "Recognition model missing";
      return;
    }
    const detection = await faceapi
      .detectSingleFace(cameraFeed, new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection || !detection.descriptor) {
      systemStatus.textContent = "No face detected";
      return;
    }

    const existing = knownFaces.find((item) => item.label === name);
    if (existing) {
      existing.descriptors.push(detection.descriptor);
    } else {
      knownFaces.push(new faceapi.LabeledFaceDescriptors(name, [detection.descriptor]));
    }

    updateFaceMatcher();
    saveStoredFaces();
    setActiveUser(name, "manual", { loadHistory: true });
    if (recognitionStatus) {
      recognitionStatus.textContent = `Enrolled ${name}`;
    }
    identityNameInput.value = "";
    systemStatus.textContent = "Face enrolled";
  } catch (error) {
    console.error(error);
    systemStatus.textContent = "Enrollment failed";
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) {
    return;
  }

  addMessage(value, "user");
  chatInput.value = "";
  setLoadingState(true);

  const loadingMessage = addMessage("MAITRI is thinking...", "system", {
    loading: true
  });

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: value,
        emotion: currentEmotion.label || "neutral",
        emotionConfidence:
          typeof currentEmotion.confidence === "number" ? currentEmotion.confidence : null,
        userName: identityState.name
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data = await response.json();
    const reply = data && typeof data.reply === "string" ? data.reply.trim() : "";

    if (!reply) {
      throw new Error("Empty reply from server");
    }

    loadingMessage.remove();
    addMessage(reply, "system");
    speakText(reply);
  } catch (error) {
    loadingMessage.remove();
    addMessage("Unable to reach MAITRI right now. Please try again.", "error");
    console.error(error);
  } finally {
    setLoadingState(false);
    chatInput.focus();
  }
});

async function loadChatHistory(userName) {
  try {
    const resolvedName = isNonEmptyString(userName) ? userName.trim() : DEFAULT_USER_NAME;
    const url = `${HISTORY_ENDPOINT}?userName=${encodeURIComponent(resolvedName)}&limit=15`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`History request failed (${response.status})`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    chatMessages.innerHTML = "";

    if (items.length === 0) {
      renderGreeting();
      return;
    }

    items.forEach((item) => {
      const role = item.role === "assistant" ? "system" : item.role || "system";
      addMessage(item.content || "", role);
    });
  } catch (error) {
    console.warn("History load failed:", error);
  }
}

chatMicButton.addEventListener("click", () => {
  if (!speechRecognition) {
    systemStatus.textContent = "Speech not supported (try Chrome)";
    return;
  }

  if (!window.isSecureContext) {
    systemStatus.textContent = "Mic requires secure context (use localhost)";
    return;
  }

  if (micActive) {
    speechRecognition.stop();
    return;
  }

  try {
    speechRecognition.start();
  } catch (error) {
    console.error(error);
    systemStatus.textContent = "Mic error";
  }
});

toggleTheme.addEventListener("click", () => {
  const currentTheme = document.body.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

addProfileToggle.addEventListener("click", () => {
  toggleAddProfilePanel();
});

enrollFaceButton.addEventListener("click", () => {
  enrollCurrentFace();
});

enableCamera.addEventListener("click", () => {
  if (cameraStream) {
    return;
  }

  enableCamera.disabled = true;
  enableCamera.textContent = "Starting...";
  cameraStatus.textContent = "Requesting camera access";
  systemStatus.textContent = "Camera setup pending";

  Promise.resolve()
    .then(loadModels)
    .then(startCamera)
    .then(() => {
      cameraPlaceholder.classList.add("camera-live");
      cameraStatus.textContent = "Camera live";
      systemStatus.textContent = "Camera ready";
      enableCamera.textContent = "Camera enabled";
      emotionMode.textContent = "Live";
      if (emotionTimer) {
        window.clearInterval(emotionTimer);
        emotionTimer = null;
      }
      startEmotionDetection();
    })
    .catch((error) => {
      console.error(error);
      cameraStatus.textContent = "Camera unavailable";
      systemStatus.textContent = "Camera error";
      enableCamera.disabled = false;
      enableCamera.textContent = "Enable camera";
      emotionMode.textContent = "Simulated";
    });
});

window.addEventListener("resize", () => {
  resizeCanvas();
  drawVitalsChart();
});

resizeCanvas();
updateVitals();
window.setInterval(updateVitals, 2500);
emotionTimer = window.setInterval(cycleEmotion, 6500);
initSpeechRecognition();
initTheme();
setActiveUser(DEFAULT_USER_NAME, "manual", { loadHistory: true });
