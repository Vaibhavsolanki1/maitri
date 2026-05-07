import {
  isOnboardingComplete,
  setOnboardingComplete,
  setActiveUser,
  setUserTier
} from "./config.js";

export function initOnboarding({ elements, onFinish, requestCameraAccess }) {
  const {
    overlay,
    steps,
    backButton,
    nextButton,
    nameInput,
    tierButtons,
    cameraButton,
    notificationsButton
  } = elements;

  if (!overlay || !steps || steps.length === 0) {
    return;
  }

  if (isOnboardingComplete()) {
    return;
  }

  let stepIndex = 0;

  function showStep(index) {
    steps.forEach((step, idx) => {
      step.hidden = idx !== index;
    });
    if (backButton) {
      backButton.disabled = index === 0;
    }
    if (nextButton) {
      nextButton.textContent = index === steps.length - 1 ? "Finish" : "Next";
    }
  }

  function complete() {
    setOnboardingComplete();
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (typeof onFinish === "function") {
      onFinish();
    }
  }

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  showStep(stepIndex);

  if (backButton) {
    backButton.addEventListener("click", () => {
      stepIndex = Math.max(0, stepIndex - 1);
      showStep(stepIndex);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (stepIndex === 1 && nameInput && nameInput.value.trim()) {
        setActiveUser(nameInput.value.trim());
      }

      if (stepIndex >= steps.length - 1) {
        complete();
        return;
      }

      stepIndex += 1;
      showStep(stepIndex);
    });
  }

  if (tierButtons && tierButtons.length) {
    tierButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tier = button.dataset.tier || "free";
        setUserTier(tier);
        tierButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
      });
    });
  }

  if (cameraButton) {
    cameraButton.addEventListener("click", async () => {
      if (typeof requestCameraAccess === "function") {
        const ok = await requestCameraAccess();
        cameraButton.textContent = ok ? "Camera enabled" : "Camera denied";
      }
    });
  }

  if (notificationsButton) {
    notificationsButton.addEventListener("click", async () => {
      if (!("Notification" in window)) {
        notificationsButton.textContent = "Notifications unavailable";
        return;
      }
      const result = await Notification.requestPermission();
      notificationsButton.textContent =
        result === "granted" ? "Notifications enabled" : "Notifications denied";
    });
  }
}
