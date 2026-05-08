/**
 * MAITRI — Yoga Flow controller
 * Powered by MoveNet Thunder · Premium redesign
 */

import poseLibrary from "./modules/yoga-poses.js";
import YogaPoseDetector from "./modules/yoga-detector.js";
import { initTheme, bindThemeToggle } from "./modules/theme.js";

// ── Inline SVG icon set (no emojis) ────────────────────────────────────────
const ICONS = {
  // Standing / balance
  mountain: `<svg viewBox="0 0 24 24"><polyline points="2 20 8 6 14 14 18 8 22 20"/></svg>`,
  tree:     `<svg viewBox="0 0 24 24"><line x1="12" y1="22" x2="12" y2="12"/><path d="M5 12l7-10 7 10"/><path d="M3 17l9-5 9 5"/></svg>`,
  child:    `<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4"/><path d="M7 22V12l-2-4h14l-2 4v10"/></svg>`,
  cobra:    `<svg viewBox="0 0 24 24"><path d="M3 18c0-4 3-7 9-7s9 3 9 7"/><path d="M15 11c0-2-1.5-4-3-4s-3 2-3 4"/></svg>`,
  catcow:   `<svg viewBox="0 0 24 24"><path d="M4 12c0-4 3-6 8-6s8 2 8 6"/><path d="M4 12c0 4 3 6 8 6s8-2 8-6"/></svg>`,
  warrior1: `<svg viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="8"/><path d="M6 22l6-14 6 14"/><line x1="4" y1="8" x2="20" y2="8"/></svg>`,
  warrior2: `<svg viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12"/><path d="M9 5l-4 7 4 7"/><path d="M15 5l4 7-4 7"/></svg>`,
  triangle: `<svg viewBox="0 0 24 24"><polygon points="12 2 22 20 2 20"/></svg>`,
  bridge:   `<svg viewBox="0 0 24 24"><path d="M3 17c3-8 15-8 18 0"/><line x1="3" y1="17" x2="21" y2="17"/></svg>`,
  boat:     `<svg viewBox="0 0 24 24"><path d="M2 20h20"/><path d="M5 20L3 10l9 4 9-4-2 10"/></svg>`,
  crow:     `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M6 12l6-5 6 5"/><path d="M8 20l4-8 4 8"/></svg>`,
  headstand:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="6" y1="14" x2="18" y2="14"/><line x1="6" y1="14" x2="6" y2="22"/><line x1="18" y1="14" x2="18" y2="22"/></svg>`,
  wheel:    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  sideplank:`<svg viewBox="0 0 24 24"><line x1="2" y1="18" x2="22" y2="6"/><line x1="12" y1="3" x2="12" y2="12"/></svg>`,
  kingpigeon:`<svg viewBox="0 0 24 24"><path d="M4 20c2-8 14-12 16-4"/><path d="M12 4c0 4-4 8-4 12"/><circle cx="16" cy="6" r="2"/></svg>`,
  default:  `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 7v8"/><path d="M9 10l3 2 3-2"/><line x1="9" y1="22" x2="12" y2="15"/><line x1="15" y1="22" x2="12" y2="15"/></svg>`
};

function getPoseIcon(id) {
  return ICONS[id] || ICONS.default;
}

// ── Difficulty metadata ─────────────────────────────────────────────────────
const DIFF_META = {
  beginner:     { label: "Beginner",     tag: "Foundation" },
  intermediate: { label: "Intermediate", tag: "Strength" },
  advanced:     { label: "Advanced",     tag: "Mastery" }
};

// ── Session state ───────────────────────────────────────────────────────────
const yogaSession = {
  currentPose: null,
  currentStep: 0,
  startTime: null,
  stepStartTime: null,
  detector: null,
  isSessionActive: false,
  accuracy: 0,
  holdDuration: 0,
  lastLandmarks: null,
  targetLandmarks: null,

  async initialize() {
    const statusEl = document.getElementById("status-text");
    const themeToggle = document.getElementById("toggle-theme");

    try {
      statusEl.textContent = "Loading MoveNet Thunder…";
      this.detector = new YogaPoseDetector();
      await this.detector.initialize();
      statusEl.textContent = "✓ Ready to train";

      initTheme(themeToggle);
      bindThemeToggle(themeToggle);

      this.setupEventListeners();
      this.renderPoseGrid();
    } catch (err) {
      console.error("Init failed:", err);
      statusEl.textContent = "⚠ Failed to initialise";
    }
  },

  setupEventListeners() {
    document.addEventListener("click", e => {
      const row = e.target.closest(".pose-row");
      if (row) this.startSession(row.dataset.poseId);
    });
  },

  renderPoseGrid() {
    const grid = document.getElementById("pose-grid");
    grid.innerHTML = "";

    const categorised = poseLibrary.getCategorized();
    let delay = 0;

    Object.entries(categorised).forEach(([diff, poses]) => {
      const meta = DIFF_META[diff] || { label: diff, tag: "" };

      const panel = document.createElement("div");
      panel.className = "pose-panel";
      panel.style.animationDelay = `${delay}s`;
      delay += 0.1;

      // Panel header
      const header = document.createElement("div");
      header.className = "pose-panel-header";
      header.innerHTML = `
        <h2>${meta.label}</h2>
        <span class="panel-tag">${meta.tag}</span>
      `;
      panel.appendChild(header);

      // Pose list
      const list = document.createElement("ul");
      list.className = "pose-list";

      poses.forEach(pose => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "pose-row";
        btn.dataset.poseId = pose.id;
        btn.innerHTML = `
          <span class="pose-icon">${getPoseIcon(pose.id)}</span>
          <span class="pose-info">
            <span class="pose-name">${pose.name}</span>
            <span class="pose-sanskrit">${pose.sanskrit}</span>
          </span>
          <span class="pose-arrow">
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        `;
        li.appendChild(btn);
        list.appendChild(li);
      });

      panel.appendChild(list);
      grid.appendChild(panel);
    });
  },

  // ── Session start ───────────────────────────────────────────────────
  async startSession(poseId) {
    const pose = poseLibrary.getPoseById(poseId);
    if (!pose) return;

    this.currentPose = pose;
    this.currentStep = 0;
    this.startTime = Date.now();
    this.isSessionActive = true;

    document.getElementById("session-overlay").classList.add("active");

    const video = document.getElementById("yoga-video");
    const ok = await this.detector.startCamera(video);
    if (!ok) {
      alert("Camera access denied — please allow camera access and try again.");
      this.closeSession();
      return;
    }

    // Wait for video metadata
    await new Promise(resolve => {
      if (video.readyState >= 1) { resolve(); return; }
      video.onloadedmetadata = () => resolve();
    });

    document.getElementById("session-status-text").textContent = `${pose.name} · Active`;
    this.renderStep();
    this.startDetectionLoop();
  },

  // ── Render current step ─────────────────────────────────────────────
  renderStep() {
    if (!this.currentPose || this.currentStep >= this.currentPose.steps.length) {
      this.completeSession();
      return;
    }

    const step = this.currentPose.steps[this.currentStep];

    document.getElementById("hud-pose-name").textContent = this.currentPose.name;
    document.getElementById("step-title").textContent = `Step ${this.currentStep + 1} of ${this.currentPose.steps.length} — ${step.title}`;
    document.getElementById("step-description").textContent = step.detail;

    // Instruction list
    const list = document.getElementById("instruction-list");
    list.innerHTML = "";
    this.currentPose.steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "step-item" +
        (i === this.currentStep ? " active" : "") +
        (i < this.currentStep ? " done" : "");
      li.textContent = s.title;
      list.appendChild(li);
    });

    // Reset hold display
    document.getElementById("timer-display").textContent = `${step.hold}s`;
    document.getElementById("hold-bar-fill").style.width = "0%";

    this.stepStartTime = null;
    this.holdDuration = 0;
    this.targetLandmarks = null;
  },

  // ── Detection loop ──────────────────────────────────────────────────
  startDetectionLoop() {
    const video = document.getElementById("yoga-video");
    const canvas = document.getElementById("yoga-canvas");
    const ghost  = document.getElementById("ghost-canvas");
    const circleEl  = document.getElementById("accuracy-circle");
    const percentEl = document.getElementById("accuracy-percent");
    const feedbackEl= document.getElementById("hud-feedback");
    const timerEl   = document.getElementById("timer-display");
    const barEl     = document.getElementById("hold-bar-fill");

    canvas.width = ghost.width = video.videoWidth  || 1280;
    canvas.height= ghost.height= video.videoHeight || 720;

    const loop = async () => {
      if (!this.isSessionActive) return;

      const raw = await this.detector.detect(video);

      if (raw) {
        this.lastLandmarks = this.lastLandmarks
          ? this.detector.smoothLandmarks(raw, this.lastLandmarks)
          : raw;

        if (!this.targetLandmarks)
          this.targetLandmarks = this.generateTargetLandmarks(this.currentPose);

        // Draw
        this.detector.drawLandmarks(canvas, this.lastLandmarks);
        const gCtx = ghost.getContext("2d");
        gCtx.clearRect(0, 0, ghost.width, ghost.height);
        this.detector.drawGhostPose(ghost, this.lastLandmarks, this.targetLandmarks);

        // Accuracy
        this.accuracy = this.detector.calculatePoseAccuracy(
          this.lastLandmarks,
          this.targetLandmarks,
          this.getJointIndices(this.currentPose.criticalJoints)
        );
        percentEl.textContent = `${this.accuracy}%`;
        circleEl.classList.toggle("high", this.accuracy >= 80);

        const step = this.currentPose.steps[this.currentStep];

        if (this.accuracy >= 80) {
          if (!this.stepStartTime) this.stepStartTime = Date.now();
          this.holdDuration = Math.round((Date.now() - this.stepStartTime) / 1000);
          const remaining = Math.max(0, step.hold - this.holdDuration);
          const progress  = Math.min(100, (this.holdDuration / step.hold) * 100);

          timerEl.textContent = `${remaining}s`;
          barEl.style.width   = `${progress}%`;

          feedbackEl.style.display = "block";
          feedbackEl.textContent   = "✓ Hold steady — great alignment!";
          feedbackEl.className     = "hud-feedback-bar success";

          if (this.holdDuration >= step.hold) {
            this.playSuccessAnimation();
            this.nextStep();
          }
        } else {
          this.stepStartTime = null;
          this.holdDuration  = 0;
          timerEl.textContent = `${step.hold}s`;
          barEl.style.width   = "0%";

          feedbackEl.style.display = "block";
          const hints = this.detector.getFeedback(this.lastLandmarks, this.targetLandmarks);
          feedbackEl.textContent = hints[0] || "Align with the ghost outline";
          feedbackEl.className   = "hud-feedback-bar warning";
        }
      }

      requestAnimationFrame(loop);
    };

    loop();
  },

  // ── Target landmark configs (MoveNet 17-pt) ─────────────────────────
  generateTargetLandmarks(pose) {
    // Neutral standing base
    const b = {};
    b[0]  = { x:0.50, y:0.10, score:1 }; // nose
    b[5]  = { x:0.40, y:0.25, score:1 }; // L shoulder
    b[6]  = { x:0.60, y:0.25, score:1 }; // R shoulder
    b[7]  = { x:0.35, y:0.40, score:1 }; // L elbow
    b[8]  = { x:0.65, y:0.40, score:1 }; // R elbow
    b[9]  = { x:0.32, y:0.55, score:1 }; // L wrist
    b[10] = { x:0.68, y:0.55, score:1 }; // R wrist
    b[11] = { x:0.44, y:0.60, score:1 }; // L hip
    b[12] = { x:0.56, y:0.60, score:1 }; // R hip
    b[13] = { x:0.44, y:0.78, score:1 }; // L knee
    b[14] = { x:0.56, y:0.78, score:1 }; // R knee
    b[15] = { x:0.44, y:0.95, score:1 }; // L ankle
    b[16] = { x:0.56, y:0.95, score:1 }; // R ankle

    const configs = {
      mountain: { 7:{x:0.40,y:0.15,score:1}, 8:{x:0.60,y:0.15,score:1}, 9:{x:0.40,y:0.05,score:1}, 10:{x:0.60,y:0.05,score:1} },
      tree:     { 7:{x:0.43,y:0.35,score:1}, 8:{x:0.57,y:0.35,score:1}, 9:{x:0.48,y:0.05,score:1}, 10:{x:0.52,y:0.05,score:1}, 13:{x:0.38,y:0.72,score:1}, 15:{x:0.50,y:0.80,score:1} },
      warrior1: { 5:{x:0.42,y:0.28,score:1}, 6:{x:0.58,y:0.28,score:1}, 7:{x:0.40,y:0.12,score:1}, 8:{x:0.60,y:0.12,score:1}, 9:{x:0.40,y:0.04,score:1}, 10:{x:0.60,y:0.04,score:1}, 11:{x:0.38,y:0.60,score:1}, 12:{x:0.62,y:0.60,score:1}, 13:{x:0.25,y:0.80,score:1}, 15:{x:0.22,y:0.96,score:1}, 14:{x:0.65,y:0.76,score:1}, 16:{x:0.78,y:0.96,score:1} },
      warrior2: { 7:{x:0.20,y:0.30,score:1}, 8:{x:0.80,y:0.30,score:1}, 9:{x:0.08,y:0.30,score:1}, 10:{x:0.92,y:0.30,score:1}, 13:{x:0.22,y:0.80,score:1}, 15:{x:0.20,y:0.96,score:1}, 14:{x:0.68,y:0.74,score:1}, 16:{x:0.82,y:0.96,score:1} },
      triangle: { 7:{x:0.28,y:0.40,score:1}, 8:{x:0.72,y:0.20,score:1}, 9:{x:0.14,y:0.52,score:1}, 10:{x:0.86,y:0.08,score:1}, 11:{x:0.38,y:0.62,score:1}, 12:{x:0.62,y:0.62,score:1}, 13:{x:0.30,y:0.80,score:1}, 15:{x:0.22,y:0.96,score:1} },
      bridge:   { 9:{x:0.36,y:0.72,score:1}, 10:{x:0.64,y:0.72,score:1}, 11:{x:0.42,y:0.48,score:1}, 12:{x:0.58,y:0.48,score:1}, 13:{x:0.42,y:0.70,score:1}, 14:{x:0.58,y:0.70,score:1}, 15:{x:0.42,y:0.88,score:1}, 16:{x:0.58,y:0.88,score:1} },
      boat:     { 5:{x:0.40,y:0.32,score:1}, 6:{x:0.60,y:0.32,score:1}, 7:{x:0.28,y:0.44,score:1}, 8:{x:0.72,y:0.44,score:1}, 9:{x:0.18,y:0.54,score:1}, 10:{x:0.82,y:0.54,score:1}, 11:{x:0.44,y:0.56,score:1}, 12:{x:0.56,y:0.56,score:1}, 13:{x:0.36,y:0.40,score:1}, 14:{x:0.64,y:0.40,score:1}, 15:{x:0.28,y:0.28,score:1}, 16:{x:0.72,y:0.28,score:1} }
    };

    const cfg = configs[pose.id];
    return cfg ? Object.assign(b, cfg) : b;
  },

  getJointIndices(criticalJoints) {
    const map = {
      nose:[0], shoulders:[5,6], elbows:[7,8], wrists:[9,10],
      hips:[11,12], knees:[13,14], ankles:[15,16],
      core:[5,6,11,12], spine:[0,5,6,11,12],
      left_shoulder:[5], right_shoulder:[6],
      left_knee:[13], right_knee:[14],
      left_hip:[11], right_hip:[12],
      left_ankle:[15], right_ankle:[16]
    };
    let out = [];
    if (criticalJoints) {
      criticalJoints.forEach(j => {
        const v = map[j];
        if (v) out = out.concat(v);
      });
    }
    return out.length ? out : Array.from({length:17},(_,i)=>i);
  },

  playSuccessAnimation() {
    const c = document.getElementById("accuracy-circle");
    c.style.animation = "none";
    requestAnimationFrame(() => { c.style.animation = "pulse 0.6s ease-out"; });
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
    if (confirm("End this yoga session?")) this.closeSession();
  },

  async completeSession() {
    this.isSessionActive = false;
    const total = Math.round((Date.now() - this.startTime) / 1000);
    alert(`🎉 Session Complete!\n\nPose: ${this.currentPose.name}\nTotal time: ${total}s\nFinal accuracy: ${this.accuracy}%`);
    this.closeSession();
  },

  closeSession() {
    this.isSessionActive = false;
    if (this.detector) this.detector.stop();
    document.getElementById("session-overlay").classList.remove("active");
    document.getElementById("hud-feedback").style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => yogaSession.initialize());
window.yogaSession = yogaSession;
