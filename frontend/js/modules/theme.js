const THEME_KEY = "maitriTheme";

function updateNeuralBackground() {
  if (window.updateNeuralBackground) {
    window.updateNeuralBackground();
  }
}

export function applyTheme(theme, toggleButton) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  window.localStorage.setItem(THEME_KEY, nextTheme);

  if (toggleButton) {
    toggleButton.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
    toggleButton.classList.toggle("is-active", nextTheme === "dark");
  }

  updateNeuralBackground();
  return nextTheme;
}

export function initTheme(toggleButton) {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored) {
    return applyTheme(stored, toggleButton);
  }

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return applyTheme(prefersDark ? "dark" : "light", toggleButton);
}

export function bindThemeToggle(toggleButton) {
  if (!toggleButton) {
    return;
  }

  toggleButton.addEventListener("click", () => {
    const current = document.body.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark", toggleButton);
  });
}
