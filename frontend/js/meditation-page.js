import { initTheme, bindThemeToggle } from "./modules/theme.js";
import { initMeditation } from "./modules/meditation.js";
import { ENDPOINTS } from "./modules/config.js";

const toggleTheme = document.getElementById("toggle-theme");
initTheme(toggleTheme);
bindThemeToggle(toggleTheme);

initMeditation({
  elements: {
    timerDisplay: document.getElementById("timer-display"),
    startButton: document.getElementById("start-btn"),
    pauseButton: document.getElementById("pause-btn"),
    resetButton: document.getElementById("reset-btn"),
    presetButtons: document.querySelectorAll(".preset-btn"),
    progressCircle: document.getElementById("progress-circle")
  },
  endpoints: ENDPOINTS
});
