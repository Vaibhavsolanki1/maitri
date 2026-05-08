/**
 * MAITRI AI Yoga Trainer
 * Main controller for the yoga session
 * Built with vanilla JS and MediaPipe Pose Detection
 */

import poseLibrary from "./modules/yoga-poses.js";
import YogaPoseDetector from "./modules/yoga-detector.js";
import { initTheme, bindThemeToggle } from "./modules/theme.js";

// Global session state
const yogaSession = {
  currentPose: null,
  currentStep: 0,
  sessionId: null,
  startTime: null,
  stepStartTime: null,
  detector: null,
  isSessionActive: false,
  accuracy: 0,
  holdDuration: 0,
  lastLandmarks: null,
  targetLandmarks: null,
  sessionData: [],
  userName: "Guest",

  async initialize() {
    const statusText = document.getElementById("status-text");
    const themeToggle = document.getElementById("toggle-theme");
    
    try {
      statusText.textContent = "Initializing pose detector...";
      this.detector = new YogaPoseDetector();
      await this.detector.initialize();
      statusText.textContent = "✓ Ready to train";
      
      // Initialize theme
      initTheme(themeToggle);
      bindThemeToggle(themeToggle);
      
      this.setupEventListeners();
      this.loadPoseCategories();
    } catch (error) {
      console.error("Initialization failed:", error);
      statusText.textContent = "⚠ Failed to initialize";
    }
  },

  setupEventListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("pose-button")) {
        const poseId = e.target.dataset.poseId;
        this.startSession(poseId);
      }
    });
  },

  loadPoseCategories() {
    const grid = document.getElementById("pose-grid");
    grid.innerHTML = "";

    const categorized = poseLibrary.getCategorized();

    Object.entries(categorized).forEach(([difficulty, poses]) => {
      const section = document.createElement("div");
      section.className = "category-section";

      const title = document.createElement("h2");
      title.className = "category-title";
      title.style.fontFamily = "'Fraunces', serif";
      title.innerHTML = `${this.getDifficultyEmoji(difficulty)} ${this.formatDifficulty(difficulty)} Level`;

      const list = document.createElement("ul");
      list.className = "pose-list";

      poses.forEach(pose => {
        const item = document.createElement("li");
        item.className = "pose-item";

        const button = document.createElement("button");
        button.className = "pose-button";
        button.style.fontFamily = "'Manrope', sans-serif";
        button.dataset.poseId = pose.id;
        button.textContent = `${pose.emoji} ${pose.name}`;

        item.appendChild(button);
        list.appendChild(item);
      });

      section.appendChild(title);
      section.appendChild(list);
      grid.appendChild(section);
    });
  },

  formatDifficulty(diff) {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  },

  getDifficultyEmoji(difficulty) {
    const emojis = { beginner: "🌱", intermediate: "🔥", advanced: "⭐" };
    return emojis[difficulty] || "🧘";
  },

  async startSession(poseId) {
    const pose = poseLibrary.getPoseById(poseId);
    if (!pose) return;

    this.currentPose = pose;
    this.currentStep = 0;
    this.startTime = Date.now();
    this.sessionData = [];
    this.isSessionActive = true;

    // Show session overlay immediately
    document.getElementById("session-overlay").classList.add("active");
    document.getElementById("main-content").style.display = "none";
    
    // Show loading state
    const statusText = document.getElementById("status-text");
    statusText.textContent = "📹 Accessing camera...";

    // Request camera access
    const video = document.getElementById("yoga-video");
    const ok = await this.detector.startCamera(video);
    if (!ok) {
      alert("Camera access denied");
      this.closeSession();
      return;
    }

    statusText.textContent = "⏳ Initializing pose detection...";

    // Wait for video to load
    await new Promise(resolve => {
      video.onloadedmetadata = () => resolve();
    });

    statusText.textContent = "✓ Ready to train";

    // Start detection loop
    this.startDetectionLoop();

    // Render UI
    this.renderStep();
  },

  renderStep() {
    if (!this.currentPose || this.currentStep >= this.currentPose.steps.length) {
      this.completeSession();
      return;
    }

    const step = this.currentPose.steps[this.currentStep];
    
    const hudPoseName = document.getElementById("hud-pose-name");
    hudPoseName.textContent = this.currentPose.name;
    hudPoseName.style.fontFamily = "'Fraunces', serif";
    
    const stepTitle = document.getElementById("step-title");
    stepTitle.textContent = `Step ${this.currentStep + 1} of ${this.currentPose.steps.length}`;
    stepTitle.style.fontFamily = "'Fraunces', serif";
    
    const stepDescription = document.getElementById("step-description");
    stepDescription.textContent = step.detail;
    stepDescription.style.fontFamily = "'Manrope', sans-serif";

    // Render instructions
    const instructionList = document.getElementById("instruction-list");
    instructionList.innerHTML = "";

    this.currentPose.steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = `instruction-item ${i === this.currentStep ? "active" : ""}`;
      li.style.fontFamily = "'Manrope', sans-serif";
      li.textContent = s.title;
      instructionList.appendChild(li);
    });

    this.stepStartTime = Date.now();
    this.holdDuration = 0;
  },

  startDetectionLoop() {
    const video = document.getElementById("yoga-video");
    const canvas = document.getElementById("yoga-canvas");
    const ghostCanvas = document.getElementById("ghost-canvas");
    const accuracyCircle = document.getElementById("accuracy-circle");
    const accuracyPercent = document.getElementById("accuracy-percent");
    const feedback = document.getElementById("hud-feedback");
    const timerDisplay = document.getElementById("timer-display");
    timerDisplay.style.fontFamily = "'Fraunces', serif";

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ghostCanvas.width = canvas.width;
    ghostCanvas.height = canvas.height;

    // Set fonts for accuracy display
    if (accuracyPercent) {
      accuracyPercent.style.fontFamily = "'Fraunces', serif";
    }
    if (feedback) {
      feedback.style.fontFamily = "'Manrope', sans-serif";
    }

    const detectionLoop = async () => {
      if (!this.isSessionActive) return;

      const landmarks = await this.detector.detect(video);
      
      if (landmarks && landmarks.length > 0) {
        // Smooth landmarks
        if (this.lastLandmarks) {
          this.lastLandmarks = this.detector.smoothLandmarks(landmarks, this.lastLandmarks);
        } else {
          this.lastLandmarks = landmarks;
        }

        // Draw current skeleton (clears its own canvas)
        this.detector.drawLandmarks(canvas, this.lastLandmarks);

        // Generate target landmarks (idealized pose)
        if (!this.targetLandmarks) {
          this.targetLandmarks = this.generateTargetLandmarks(this.currentPose);
        }

        // Clear ghost canvas and draw ghost pose on separate canvas
        const ghostCtx = ghostCanvas.getContext("2d");
        ghostCtx.clearRect(0, 0, ghostCanvas.width, ghostCanvas.height);
        this.detector.drawGhostPose(ghostCanvas, this.lastLandmarks, this.targetLandmarks);

        // Calculate accuracy
        this.accuracy = this.detector.calculatePoseAccuracy(
          this.lastLandmarks,
          this.targetLandmarks,
          this.getJointIndices(this.currentPose.criticalJoints)
        );

        // Update accuracy display
        accuracyPercent.textContent = `${this.accuracy}%`;
        accuracyCircle.classList.toggle("high", this.accuracy >= 80);

        // Show feedback
        if (this.accuracy >= 80) {
          this.holdDuration = Math.round((Date.now() - this.stepStartTime) / 1000);
          timerDisplay.textContent = `${this.holdDuration}s`;

          feedback.style.display = "block";
          feedback.textContent = "✓ Great alignment! Hold steady...";
          feedback.className = "hud-feedback success";

          const step = this.currentPose.steps[this.currentStep];
          if (this.holdDuration >= step.hold) {
            this.playSuccessAnimation();
            this.nextStep();
          }
        } else {
          feedback.style.display = "block";
          const suggestions = this.detector.getFeedback(this.lastLandmarks, this.targetLandmarks);
          feedback.textContent = suggestions[0] || "Adjust your position";
          feedback.className = "hud-feedback warning";
        }
      }

      requestAnimationFrame(detectionLoop);
    };

    detectionLoop();
  },

  generateTargetLandmarks(pose) {
    // Generate idealized pose landmarks based on pose type
    const baseLandmarks = Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }));

    // Customize based on pose ID
    const configurations = {
      mountain: {
        11: { x: 0.4, y: 0.2, z: 0 }, // left shoulder
        12: { x: 0.6, y: 0.2, z: 0 }, // right shoulder
        23: { x: 0.4, y: 0.6, z: 0 }, // left hip
        24: { x: 0.6, y: 0.6, z: 0 }, // right hip
        27: { x: 0.4, y: 1.0, z: 0 }, // left ankle
        28: { x: 0.6, y: 1.0, z: 0 }  // right ankle
      },
      tree: {
        11: { x: 0.4, y: 0.2, z: 0 },
        12: { x: 0.6, y: 0.2, z: 0 },
        23: { x: 0.5, y: 0.6, z: 0 },
        24: { x: 0.5, y: 0.8, z: 0 },
        25: { x: 0.5, y: 0.8, z: 0 },
        26: { x: 0.5, y: 0.95, z: 0 }
      },
      warrior2: {
        11: { x: 0.3, y: 0.25, z: 0 },
        12: { x: 0.7, y: 0.25, z: 0 },
        23: { x: 0.3, y: 0.65, z: 0 },
        24: { x: 0.7, y: 0.65, z: 0 },
        25: { x: 0.3, y: 0.9, z: 0 },
        26: { x: 0.7, y: 0.9, z: 0 }
      }
    };

    const config = configurations[pose.id];
    if (config) {
      Object.assign(baseLandmarks, config);
    }

    return baseLandmarks;
  },

  getJointIndices(criticalJoints) {
    const jointMap = {
      nose: 0, neck: 1, shoulders: [11, 12], elbows: [13, 14],
      wrists: [15, 16], hips: [23, 24], knees: [25, 26],
      ankles: [27, 28], core: [11, 12, 23, 24]
    };

    let indices = [];
    if (criticalJoints) {
      criticalJoints.forEach(joint => {
        if (jointMap[joint]) {
          if (Array.isArray(jointMap[joint])) {
            indices = indices.concat(jointMap[joint]);
          } else {
            indices.push(jointMap[joint]);
          }
        }
      });
    }

    return indices.length > 0 ? indices : Array.from({ length: 33 }, (_, i) => i);
  },

  playSuccessAnimation() {
    const circle = document.getElementById("accuracy-circle");
    circle.style.animation = "none";
    setTimeout(() => {
      circle.style.animation = "pulse 0.6s ease-out";
    }, 10);
  },

  nextStep() {
    this.currentStep++;
    
    if (this.currentStep >= this.currentPose.steps.length) {
      this.completeSession();
    } else {
      this.targetLandmarks = null;
      this.renderStep();
    }
  },

  endSession() {
    if (confirm("Are you sure you want to end the session?")) {
      this.closeSession();
    }
  },

  async completeSession() {
    this.isSessionActive = false;

    const totalDuration = Math.round((Date.now() - this.startTime) / 1000);
    const avgAccuracy = this.sessionData.length > 0
      ? Math.round(this.sessionData.reduce((a, b) => a + b.accuracy, 0) / this.sessionData.length)
      : this.accuracy;

    alert(`🎉 Session Complete!\n\nPose: ${this.currentPose.name}\nDuration: ${totalDuration}s\nAverage Accuracy: ${avgAccuracy}%`);

    this.closeSession();
  },

  closeSession() {
    this.isSessionActive = false;
    if (this.detector) {
      this.detector.stop();
    }
    document.getElementById("session-overlay").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
    this.loadPoseCategories();
  }
};

<<<<<<< HEAD
// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  yogaSession.initialize();
=======
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
    
    const titleSpan = document.createElement("span");
    titleSpan.className = "step-title";
    titleSpan.textContent = step.title;
    
    const detailSpan = document.createElement("span");
    detailSpan.className = "step-detail";
    detailSpan.textContent = step.detail;
    
    item.appendChild(titleSpan);
    item.appendChild(detailSpan);
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
>>>>>>> 320140a65c7d178e6d7fa48316ef84f4145de262
});

// Export for global access
window.yogaSession = yogaSession;
