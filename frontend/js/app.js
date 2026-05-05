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

// Modals & Overlays
const btnBreathing = document.getElementById("btn-breathing");
const btnAudio = document.getElementById("btn-audio");
const btnYoga = document.getElementById("btn-yoga");
const btnReport = document.getElementById("btn-report");
const btnEmergency = document.getElementById("btn-emergency");
const btnVitals = document.getElementById("btn-vitals");

const overlayBreathing = document.getElementById("overlay-breathing");
const overlayMusic = document.getElementById("overlay-music");
const modalReport = document.getElementById("modal-report");
const modalEmergency = document.getElementById("modal-emergency");

const breathingContainer = document.getElementById("breathing-container");
const breathingText = document.getElementById("breathing-text");

const musicPlayer = document.getElementById("music-player");
const musicPlay = document.getElementById("music-play");
const musicPause = document.getElementById("music-pause");
const musicVolume = document.getElementById("music-volume");

const reportText = document.getElementById("report-text");
const reportSubmit = document.getElementById("report-submit");

const emergencyCancel = document.getElementById("emergency-cancel");
const emergencyConfirm = document.getElementById("emergency-confirm");
const alertHr = document.getElementById("alert-hr");
const alertSpo2 = document.getElementById("alert-spo2");
const alertTemp = document.getElementById("alert-temp");

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

const emotionHistory = [];

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

let breathingInterval = null;
let sirenOscillator = null;
let sirenInterval = null;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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
  window.localStorage.setItem("maitriActiveUser", trimmed);

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
  let hrTarget = 78;
  let tempTarget = 36.9;
  
  if (currentEmotion.label.match(/angry|stressed|fear/i)) {
    hrTarget = 95;
    tempTarget = 37.3;
  } else if (currentEmotion.label.match(/calm|relaxed/i)) {
    hrTarget = 65;
    tempTarget = 36.5;
  } else if (currentEmotion.label.match(/happy|excited/i)) {
    hrTarget = 85;
    tempTarget = 37.0;
  }

  const hrDelta = (hrTarget - vitalsState.hr) * 0.1 + (Math.random() * 4 - 2);
  const spo2Delta = Math.random() * 0.4 - 0.2;
  const tempDelta = (tempTarget - vitalsState.temp) * 0.05 + (Math.random() * 0.1 - 0.05);

  vitalsState.hr = Math.max(62, Math.min(120, vitalsState.hr + hrDelta));
  vitalsState.spo2 = Math.max(94, Math.min(100, vitalsState.spo2 + spo2Delta));
  vitalsState.temp = Math.max(36.0, Math.min(38.0, vitalsState.temp + tempDelta));

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

  emotionHistory.push(currentEmotion.label);
  if (emotionHistory.length > 5) emotionHistory.shift();
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

      emotionHistory.push(topLabel);
      if (emotionHistory.length > 5) emotionHistory.shift();

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
  speechRecognition.continuous = true;

  speechRecognition.onstart = () => {
    recognizedTranscript = "";
    updateMicUi(true);
    if (systemStatus.textContent !== "Offline") systemStatus.textContent = "Listening";
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
    
    const lowerTranscript = recognizedTranscript.toLowerCase();
    const wakeWordIdx = lowerTranscript.lastIndexOf("hey maitri");
    if (wakeWordIdx !== -1 && finalTranscript) {
      const textAfter = recognizedTranscript.substring(wakeWordIdx + 10).trim();
      if (textAfter) {
        chatInput.value = textAfter;
        chatSubmit.click();
      } else {
        speakText("I am listening");
      }
      return;
    }

    if (recognizedTranscript) {
      chatInput.value = recognizedTranscript;
    }

    if (finalTranscript) {
      chatInput.focus();
    }
  };
}

let selectedVoice = null;
window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices();
  selectedVoice = voices.find(v => v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Female") || v.name.includes("Google UK English Female")) || voices[0];
};

function speakText(text) {
  if (!window.speechSynthesis || !isNonEmptyString(text)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  if (selectedVoice) utterance.voice = selectedVoice;

  const wasMicActive = micActive;
  utterance.onstart = () => {
    if (wasMicActive && speechRecognition) {
      speechRecognition.stop();
      updateMicUi(false);
    }
  };
  utterance.onend = () => {
    if (wasMicActive && speechRecognition) {
      try { speechRecognition.start(); } catch(e){}
    }
  };

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

  const loadingMessage = document.createElement("div");
  loadingMessage.className = "message system loading";
  loadingMessage.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div><span class="message-meta">MAITRI</span>`;
  chatMessages.appendChild(loadingMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: value,
        emotion: currentEmotion.label || "neutral",
        emotionConfidence:
          typeof currentEmotion.confidence === "number" ? currentEmotion.confidence : null,
        userName: identityState.name,
        vitals: {
          hr: Math.round(vitalsState.hr),
          spo2: Math.round(vitalsState.spo2),
          temp: parseFloat(vitalsState.temp.toFixed(1))
        },
        emotionHistory
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

    if (data.action) {
      if (data.action === "breathing") startBreathingExercise();
      else if (data.action === "music") overlayMusic.classList.add("is-open");
      else if (data.action === "yoga") window.location.href = "yoga.html";
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

async function initHandGesture() {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
  document.head.appendChild(script);

  script.onload = async () => {
    const hands = new window.Hands({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];
        
        if (indexTip.y < wrist.y - 0.2) {
          window.scrollBy({ top: -30, behavior: 'auto' });
        } else if (indexTip.y > wrist.y + 0.1) {
          window.scrollBy({ top: 30, behavior: 'auto' });
        }
      }
    });

    setInterval(async () => {
      if (cameraStream && cameraFeed.readyState >= 2) {
        await hands.send({image: cameraFeed});
      }
    }, 150);
  };
}

initHandGesture();

window.setInterval(async () => {
  try {
    const res = await fetch("http://localhost:3000/health");
    if (res.ok) {
      if (systemStatus.textContent === "Offline") systemStatus.textContent = "System ready";
    }
  } catch {
    systemStatus.textContent = "Offline";
  }
}, 30000);

// Modals logic
function closeAllModals() {
  if (overlayBreathing) overlayBreathing.classList.remove("is-open");
  if (overlayMusic) overlayMusic.classList.remove("is-open");
  if (modalReport) modalReport.classList.remove("is-open");
  if (modalEmergency) modalEmergency.classList.remove("is-open");

  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
  }
  if (breathingContainer) breathingContainer.className = "breathing-container";
  if (breathingText) breathingText.textContent = "Ready";

  if (musicPlayer) musicPlayer.pause();
  stopSiren();
}

document.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", closeAllModals);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllModals();
});

function startBreathingExercise() {
  overlayBreathing.classList.add("is-open");
  const phases = [
    { text: "Breathe In", class: "is-breathing-in" },
    { text: "Hold", class: "is-breathing-in" },
    { text: "Breathe Out", class: "is-breathing-out" },
    { text: "Hold", class: "is-breathing-out" }
  ];
  let phaseIndex = 0;
  function applyPhase() {
    const phase = phases[phaseIndex];
    breathingText.textContent = phase.text;
    breathingContainer.className = `breathing-container ${phase.class}`;
    phaseIndex = (phaseIndex + 1) % phases.length;
  }
  applyPhase();
  breathingInterval = setInterval(applyPhase, 4000);
}

function startSiren() {
  if (!audioContext) return;
  if (audioContext.state === "suspended") audioContext.resume();
  sirenOscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  sirenOscillator.type = "square";
  sirenOscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  sirenOscillator.start();
  let high = true;
  sirenInterval = setInterval(() => {
    sirenOscillator.frequency.setValueAtTime(high ? 800 : 600, audioContext.currentTime);
    high = !high;
  }, 300);
}

function stopSiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (sirenOscillator) {
    sirenOscillator.stop();
    sirenOscillator.disconnect();
    sirenOscillator = null;
  }
}

if (btnBreathing) btnBreathing.addEventListener("click", startBreathingExercise);
if (btnAudio) btnAudio.addEventListener("click", () => overlayMusic.classList.add("is-open"));
if (btnYoga) btnYoga.addEventListener("click", () => window.location.href = "yoga.html");
if (btnReport) {
  btnReport.addEventListener("click", () => {
    reportText.value = "";
    modalReport.classList.add("is-open");
  });
}
if (btnEmergency) {
  btnEmergency.addEventListener("click", () => {
    alertHr.textContent = `${Math.round(vitalsState.hr)} bpm`;
    alertSpo2.textContent = `${Math.round(vitalsState.spo2)}%`;
    alertTemp.textContent = `${vitalsState.temp.toFixed(1)} C`;
    modalEmergency.classList.add("is-open");
  });
}
if (btnVitals) {
  btnVitals.addEventListener("click", () => {
    const vitalsPanel = document.querySelector(".vitals-panel");
    if (vitalsPanel) vitalsPanel.scrollIntoView({ behavior: "smooth" });
  });
}

if (musicPlay) musicPlay.addEventListener("click", () => musicPlayer.play());
if (musicPause) musicPause.addEventListener("click", () => musicPlayer.pause());
if (musicVolume) musicVolume.addEventListener("input", (e) => musicPlayer.volume = e.target.value);

if (reportSubmit) {
  reportSubmit.addEventListener("click", async () => {
    const value = reportText.value.trim();
    if (!value) return;
    reportSubmit.disabled = true;
    reportSubmit.textContent = "Saving...";
    try {
      const res = await fetch("http://localhost:3000/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: identityState.name, report: value })
      });
      if (res.ok) closeAllModals();
    } catch (err) {
      console.error("Report failed", err);
    } finally {
      reportSubmit.disabled = false;
      reportSubmit.textContent = "Submit";
    }
  });
}

if (emergencyCancel) emergencyCancel.addEventListener("click", closeAllModals);

if (emergencyConfirm) {
  emergencyConfirm.addEventListener("click", async () => {
    emergencyConfirm.disabled = true;
    emergencyConfirm.textContent = "ALERTING...";
    startSiren();
    if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 500]);
    let location = null;
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) {
        console.warn("Geolocation failed", err);
      }
    }
    try {
      await fetch("http://localhost:3000/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: identityState.name,
          message: "USER TRIGGERED EMERGENCY",
          vitals: vitalsState,
          location,
          emotion: currentEmotion.label
        })
      });
    } catch (err) {
      console.error("Emergency alert failed", err);
    } finally {
      emergencyConfirm.disabled = false;
      emergencyConfirm.textContent = "CONFIRM EMERGENCY";
    }
  });
}

window.addEventListener("load", () => {
  const splash = document.getElementById("startup-splash");
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 500);
  }
  loadModels().catch(e => console.warn("Models load error on startup", e));
});