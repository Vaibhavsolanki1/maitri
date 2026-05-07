import { buildJsonHeaders, addSessionEntry } from "./config.js";

let timerId = null;
let bellTimerId = null;
let remainingSeconds = 0;
let totalSeconds = 0;
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playBell() {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(528, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.2);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 1.3);
}

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function initMeditation({ elements, endpoints }) {
  const {
    timerDisplay,
    startButton,
    pauseButton,
    resetButton,
    presetButtons,
    progressCircle,
    progressLabel
  } = elements;

  function updateUi() {
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(remainingSeconds);
    }
    if (progressLabel) {
      progressLabel.textContent = `${Math.round(
        (1 - remainingSeconds / Math.max(1, totalSeconds)) * 100
      )}%`;
    }
    if (progressCircle) {
      const circumference = parseFloat(progressCircle.dataset.circumference || "0");
      const progress = 1 - remainingSeconds / Math.max(1, totalSeconds);
      progressCircle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
    }
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (bellTimerId) {
      clearInterval(bellTimerId);
      bellTimerId = null;
    }
  }

  function startTimer() {
    if (timerId || remainingSeconds <= 0) {
      return;
    }

    timerId = setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      updateUi();
      if (remainingSeconds === 0) {
        stopTimer();
        playBell();
        addSessionEntry({
          type: "meditation",
          duration: totalSeconds,
          timestamp: new Date().toISOString()
        });
        fetch(endpoints.meditation, {
          method: "POST",
          headers: buildJsonHeaders(),
          body: JSON.stringify({ duration: totalSeconds })
        }).catch(() => {});
      }
    }, 1000);

    bellTimerId = setInterval(playBell, 5 * 60 * 1000);
  }

  function resetTimer() {
    stopTimer();
    remainingSeconds = totalSeconds;
    updateUi();
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      startTimer();
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      stopTimer();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetTimer);
  }

  if (presetButtons && presetButtons.length) {
    presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const minutes = parseInt(button.dataset.minutes || "0", 10);
        totalSeconds = minutes * 60;
        remainingSeconds = totalSeconds;
        updateUi();
      });
    });
  }

  totalSeconds = 5 * 60;
  remainingSeconds = totalSeconds;
  updateUi();
}
