import { ENDPOINTS, getActiveUser } from "./modules/config.js";

const toggleTheme = document.getElementById("toggle-theme");
const video = document.getElementById("yoga-video");
const canvas = document.getElementById("yoga-canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("yoga-camera-overlay");
const poseName = document.getElementById("current-pose-name");
const guidePoseName = document.getElementById("guide-pose-name");
const poseFeedback = document.getElementById("pose-feedback");
const poseTimer = document.getElementById("pose-timer");
const poseStage = document.getElementById("pose-stage");
const poseSteps = document.getElementById("pose-steps");
const poseProgressLabel = document.getElementById("pose-progress-label");
const poseProgressTime = document.getElementById("pose-progress-time");
const poseProgressFill = document.getElementById("pose-progress-fill");

let detector;
let currentPose = null;
let currentProgram = null;
let isDetecting = false;
let holdRemaining = 0;
let holdInterval = null;
let stepIndex = 0;
let totalHoldSeconds = 0;

const posePrograms = {
  mountain: {
    label: "Mountain Pose",
    checkpoints: [
      { title: "Ground your feet", detail: "Feet hip-width, weight even", hold: 2 },
      { title: "Lengthen spine", detail: "Lift tall, shoulders relax", hold: 2 },
      { title: "Reach upward", detail: "Arms long, palms forward", hold: 2 },
      { title: "Final hold", detail: "Breathe steady and tall", hold: 10 }
    ]
  },
  tree: {
    label: "Tree Pose",
    checkpoints: [
      { title: "Find your base", detail: "Soft knee, steady gaze", hold: 2 },
      { title: "Place your foot", detail: "Foot to calf or inner thigh", hold: 2 },
      { title: "Hands to heart", detail: "Chest open, core engaged", hold: 2 },
      { title: "Final hold", detail: "Arms overhead, breathe", hold: 10 }
    ]
  },
  warrior2: {
    label: "Warrior II",
    checkpoints: [
      { title: "Set your stance", detail: "Feet wide, toes angled out", hold: 2 },
      { title: "Bend front knee", detail: "Knee stacks over ankle", hold: 2 },
      { title: "Extend arms", detail: "Arms parallel, gaze forward", hold: 2 },
      { title: "Final hold", detail: "Strong legs, soft breath", hold: 10 }
    ]
  }
};

async function initMoveNet() {
  document.getElementById("status").textContent = "Loading MoveNet...";
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
  });
  document.getElementById("status").textContent = "Ready. Select a pose.";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  if (toggleTheme) {
    toggleTheme.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
    toggleTheme.classList.toggle("is-active", nextTheme === "dark");
  }
  window.localStorage.setItem("maitriTheme", nextTheme);
  if (window.updateNeuralBackground) {
    window.updateNeuralBackground();
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

function renderSteps(program) {
  if (!poseSteps || !program) {
    return;
  }
  poseSteps.innerHTML = "";
  program.checkpoints.forEach((step) => {
    const item = document.createElement("li");
    item.className = "guide-step";
    item.innerHTML = `<span class="step-title">${step.title}</span><span class="step-detail">${step.detail}</span>`;
    poseSteps.appendChild(item);
  });
}

function updateGuideUi() {
  if (!currentProgram) {
    return;
  }
  const totalSteps = currentProgram.checkpoints.length;
  const step = currentProgram.checkpoints[stepIndex];

  if (poseStage) {
    poseStage.textContent = `Step ${stepIndex + 1} of ${totalSteps}`;
  }
  if (poseProgressLabel) {
    poseProgressLabel.textContent = step.title;
  }
  if (poseFeedback) {
    poseFeedback.textContent = step.detail;
  }

  if (poseSteps) {
    Array.from(poseSteps.children).forEach((item, index) => {
      item.classList.toggle("is-active", index === stepIndex);
      item.classList.toggle("is-complete", index < stepIndex);
    });
  }

  updateTimerUi();
}

function updateTimerUi() {
  if (!currentProgram) {
    return;
  }
  const step = currentProgram.checkpoints[stepIndex];
  const remaining = Math.max(holdRemaining, 0);
  const progress = step.hold ? (step.hold - remaining) / step.hold : 0;

  if (poseTimer) {
    poseTimer.textContent = `${remaining}`;
  }
  if (poseProgressTime) {
    poseProgressTime.textContent = `${remaining}s`;
  }
  if (poseProgressFill) {
    poseProgressFill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  }
}

function stopHoldCountdown(reset = false) {
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
  if (reset && currentProgram) {
    holdRemaining = currentProgram.checkpoints[stepIndex].hold;
  }
  updateTimerUi();
}

function advanceStep() {
  stopHoldCountdown(false);
  stepIndex += 1;
  if (!currentProgram || stepIndex >= currentProgram.checkpoints.length) {
    completeSession();
    return;
  }
  holdRemaining = currentProgram.checkpoints[stepIndex].hold;
  updateGuideUi();
}

function startHoldCountdown() {
  if (holdInterval) {
    return;
  }
  holdInterval = setInterval(() => {
    holdRemaining -= 1;
    if (holdRemaining <= 0) {
      holdRemaining = 0;
      updateTimerUi();
      advanceStep();
      return;
    }
    updateTimerUi();
  }, 1000);
}

document.querySelectorAll(".pose-card").forEach(card => {
  card.addEventListener("click", () => {
    if (!detector) return;
    currentPose = card.getAttribute("data-pose");
    currentProgram = posePrograms[currentPose] || null;
    if (!currentProgram) {
      return;
    }
    const label = currentProgram.label || card.querySelector("h3").textContent;
    if (poseName) poseName.textContent = label;
    if (guidePoseName) guidePoseName.textContent = label;
    renderSteps(currentProgram);
    startYogaSession();
  });
});

document.getElementById("close-yoga").addEventListener("click", endYogaSession);

async function startYogaSession() {
  if (!currentProgram) {
    return;
  }
  overlay.classList.add("is-active");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
  video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  isDetecting = true;
  stepIndex = 0;
  holdRemaining = currentProgram.checkpoints[0].hold;
  totalHoldSeconds = currentProgram.checkpoints.reduce((sum, step) => sum + step.hold, 0);
  updateGuideUi();
  detectPose();
}

async function endYogaSession() {
  isDetecting = false;
  overlay.classList.remove("is-active");
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  stopHoldCountdown(false);
}

async function detectPose() {
  if (!isDetecting || !currentProgram) return;
  const poses = await detector.estimatePoses(video);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let isCorrect = false;

  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;
    isCorrect = evaluatePose(keypoints, currentPose);
    
    // Draw skeleton
    ctx.fillStyle = isCorrect ? "#4CAF50" : "#F44336"; // Green / Red
    keypoints.forEach(kp => {
      if (kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    if (isCorrect) {
      if (poseFeedback) {
        poseFeedback.textContent = currentProgram.checkpoints[stepIndex].detail;
      }
      startHoldCountdown();
    } else {
      if (poseFeedback) {
        poseFeedback.textContent = "Adjust your position";
      }
      stopHoldCountdown(true);
    }
  }
  
  requestAnimationFrame(detectPose);
}

function evaluatePose(keypoints, pose) {
  const getKp = (name) => keypoints.find(k => k.name === name);
  const lw = getKp('left_wrist');
  const rw = getKp('right_wrist');
  const nose = getKp('nose');
  const la = getKp('left_ankle');
  const ra = getKp('right_ankle');
  const lk = getKp('left_knee');
  const rk = getKp('right_knee');
  const ls = getKp('left_shoulder');
  const rs = getKp('right_shoulder');

  const scoreThreshold = 0.3;
  const allPresent = (...kps) => kps.every(k => k && k.score > scoreThreshold);

  if (pose === "mountain") {
    if (allPresent(lw, rw, nose)) {
      return (lw.y < nose.y) && (rw.y < nose.y);
    }
  } else if (pose === "tree") {
    if (allPresent(la, ra, lk, rk, lw, rw, nose)) {
      const armsUp = (lw.y < nose.y) && (rw.y < nose.y);
      const leftAnkleToRightKnee = Math.abs(la.y - rk.y) < 70 && Math.abs(la.x - rk.x) < 70;
      const rightAnkleToLeftKnee = Math.abs(ra.y - lk.y) < 70 && Math.abs(ra.x - lk.x) < 70;
      return armsUp && (leftAnkleToRightKnee || rightAnkleToLeftKnee);
    }
  } else if (pose === "warrior2") {
    if (allPresent(lw, rw, ls, rs)) {
      const leftArmHoriz = Math.abs(lw.y - ls.y) < 80;
      const rightArmHoriz = Math.abs(rw.y - rs.y) < 80;
      return leftArmHoriz && rightArmHoriz;
    }
  }
  return false;
}

async function completeSession() {
  stopHoldCountdown(false);
  if (poseFeedback) {
    poseFeedback.textContent = "Session Complete!";
  }
  if (poseStage) {
    poseStage.textContent = "Complete";
  }
  if (poseProgressFill) {
    poseProgressFill.style.width = "100%";
  }
  isDetecting = false;
  
  try {
    const userName = getActiveUser();
    await fetch(ENDPOINTS.yoga, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, pose: currentPose, duration: totalHoldSeconds, score: 95 })
    });
  } catch(e) {
    console.error(e);
  }

  setTimeout(() => {
    endYogaSession();
  }, 2000);
}

if (toggleTheme) {
  toggleTheme.addEventListener("click", () => {
    const current = document.body.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

initTheme();
initMoveNet();
