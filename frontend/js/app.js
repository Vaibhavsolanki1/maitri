const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const systemStatus = document.getElementById("system-status");
const toggleMic = document.getElementById("toggle-mic");
const enableCamera = document.getElementById("enable-camera");
const chatSubmit = chatForm.querySelector("button[type=\"submit\"]");

const CHAT_ENDPOINT = "http://localhost:3000/chat";

const cameraPlaceholder = document.getElementById("camera-placeholder");
const cameraFeed = document.getElementById("camera-feed");
const cameraStatus = document.getElementById("camera-status");
const emotionMode = document.getElementById("emotion-mode");

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

function formatTimeStamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function setLoadingState(isLoading) {
  if (chatSubmit) {
    chatSubmit.disabled = isLoading;
  }
  chatInput.disabled = isLoading;
  systemStatus.textContent = isLoading ? "Thinking" : "System ready";
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
  modelsReady = true;
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
      const detection = await faceapi
        .detectSingleFace(cameraFeed, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        }))
        .withFaceExpressions();

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
        emotion: "neutral",
        userName: "Aksh"
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
  } catch (error) {
    loadingMessage.remove();
    addMessage("Unable to reach MAITRI right now. Please try again.", "error");
    console.error(error);
  } finally {
    setLoadingState(false);
    chatInput.focus();
  }
});

toggleMic.addEventListener("click", () => {
  micActive = !micActive;
  toggleMic.textContent = micActive ? "Listening" : "Mic idle";
  systemStatus.textContent = micActive ? "Listening" : "System ready";
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
