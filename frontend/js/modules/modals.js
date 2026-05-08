import { buildJsonHeaders, addSessionEntry } from "./config.js";

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export function createModalController({
  elements,
  endpoints,
  getContext,
  onNavigate,
  requireFeature
}) {
  const {
    overlayBreathing,
    overlayMusic,
    modalReport,
    modalEmergency,
    breathingContainer,
    breathingText,
    musicPlayer,
    musicSource,
    musicPlay,
    musicPause,
    musicVolume,
    musicLibrary,
    musicNowTitle,
    musicNotice,
    reportText,
    reportSubmit,
    reportCount,
    reportTags,
    emergencyCancel,
    emergencyConfirm,
    alertHr,
    alertSpo2,
    alertTemp,
    btnBreathing,
    btnAudio,
    btnYoga,
    btnReport,
    btnEmergency,
    btnVitals
  } = elements;

  let breathingInterval = null;
  let sirenOscillator = null;
  let sirenInterval = null;
  let activeMusicCard = null;
  let musicFallbackApplied = false;

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
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    if (emergencyConfirm) {
      emergencyConfirm.disabled = false;
      emergencyConfirm.textContent = "CONFIRM EMERGENCY";
    }
  }

  function startBreathingExercise() {
    if (overlayBreathing) {
      overlayBreathing.classList.add("is-open");
    }
    const phases = [
      { text: "Breathe In", class: "is-breathing-in" },
      { text: "Hold", class: "is-breathing-in" },
      { text: "Breathe Out", class: "is-breathing-out" },
      { text: "Hold", class: "is-breathing-out" }
    ];
    let phaseIndex = 0;
    function applyPhase() {
      const phase = phases[phaseIndex];
      if (breathingText) {
        breathingText.textContent = phase.text;
      }
      if (breathingContainer) {
        breathingContainer.className = `breathing-container ${phase.class}`;
      }
      phaseIndex = (phaseIndex + 1) % phases.length;
    }
    applyPhase();
    breathingInterval = setInterval(applyPhase, 4000);

    addSessionEntry({
      type: "breathing",
      timestamp: new Date().toISOString()
    });
  }

  function startSiren() {
    const context = getAudioContext();
    if (context.state === "suspended") {
      context.resume();
    }

    sirenOscillator = context.createOscillator();
    const gainNode = context.createGain();
    sirenOscillator.type = "square";
    sirenOscillator.connect(gainNode);
    gainNode.connect(context.destination);
    sirenOscillator.start();

    let high = true;
    sirenInterval = setInterval(() => {
      sirenOscillator.frequency.setValueAtTime(
        high ? 800 : 600,
        context.currentTime
      );
      high = !high;
    }, 300);
  }

  function stopSiren() {
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }
    if (sirenOscillator) {
      try {
        sirenOscillator.stop();
        sirenOscillator.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sirenOscillator = null;
    }
  }

  function updateReportCount() {
    if (!reportCount || !reportText) {
      return;
    }
    const length = reportText.value.length;
    reportCount.textContent = `${length} / 600`;
  }

  function appendReportTag(tag) {
    if (!reportText || !tag) {
      return;
    }
    const separator = reportText.value.trim().length ? " " : "";
    reportText.value = `${reportText.value}${separator}${tag}`.trim();
    reportText.focus();
    updateReportCount();
  }

  function setActiveMusicCard(card, options = {}) {
    if (!card || !musicPlayer) {
      return;
    }
    const musicCards = musicLibrary
      ? Array.from(musicLibrary.querySelectorAll(".music-card"))
      : [];
    musicCards.forEach((item) => item.classList.remove("is-active"));
    card.classList.add("is-active");
    activeMusicCard = card;

    const src = card.dataset.src || "assets/ambient.mp3";
    const title =
      card.dataset.title ||
      card.querySelector(".music-card-title")?.textContent ||
      "Calming audio";

    if (musicNowTitle) {
      musicNowTitle.textContent = title;
    }

    if (musicSource) {
      musicSource.src = src;
      musicPlayer.load();
    } else {
      musicPlayer.src = src;
      musicPlayer.load();
    }

    if (options.autoplay) {
      musicPlayer.play();
    }
  }

  function openMusic() {
    if (overlayMusic) {
      overlayMusic.classList.add("is-open");
    }
  }

  function openReport() {
    if (reportText) {
      reportText.value = "";
      updateReportCount();
    }
    if (modalReport) {
      modalReport.classList.add("is-open");
    }
  }

  function openEmergency() {
    const context = getContext();
    if (alertHr) {
      alertHr.textContent = `${Math.round(context.vitals.hr)} bpm`;
    }
    if (alertSpo2) {
      alertSpo2.textContent = `${Math.round(context.vitals.spo2)}%`;
    }
    if (alertTemp) {
      alertTemp.textContent = `${context.vitals.temp.toFixed(1)} C`;
    }
    if (modalEmergency) {
      modalEmergency.classList.add("is-open");
    }
  }

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  if (btnBreathing) {
    btnBreathing.addEventListener("click", () => {
      startBreathingExercise();
    });
  }
  if (btnAudio) {
    btnAudio.addEventListener("click", openMusic);
  }
  if (btnYoga) {
    btnYoga.addEventListener("click", () => {
      if (typeof onNavigate === "function") {
        onNavigate("yoga");
      }
    });
  }
  if (btnReport) {
    btnReport.addEventListener("click", openReport);
  }
  if (btnEmergency) {
    btnEmergency.addEventListener("click", () => {
      if (typeof requireFeature === "function") {
        requireFeature("emergency", openEmergency);
        return;
      }
      openEmergency();
    });
  }
  if (btnVitals && !btnVitals.disabled) {
    btnVitals.addEventListener("click", () => {
      const vitalsPanel = document.querySelector(".vitals-panel");
      if (vitalsPanel) {
        vitalsPanel.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (musicPlay) musicPlay.addEventListener("click", () => musicPlayer.play());
  if (musicPause) musicPause.addEventListener("click", () => musicPlayer.pause());
  if (musicVolume) {
    musicVolume.addEventListener("input", (event) => {
      musicPlayer.volume = event.target.value;
    });
  }

  if (musicLibrary) {
    const cards = Array.from(musicLibrary.querySelectorAll(".music-card"));
    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (index > 1 && typeof requireFeature === "function") {
          requireFeature("fullAudioLibrary", () =>
            setActiveMusicCard(card, { autoplay: true })
          );
          return;
        }
        setActiveMusicCard(card, { autoplay: true });
      });
    });
    if (cards.length > 0) {
      setActiveMusicCard(cards[0]);
    }
  }

  if (musicPlayer) {
    musicPlayer.addEventListener("error", () => {
      if (musicFallbackApplied) {
        return;
      }
      musicFallbackApplied = true;
      if (musicNotice) {
        musicNotice.textContent =
          "Selected track missing. Using ambient loop instead.";
      }
      if (musicSource) {
        musicSource.src = "assets/ambient.mp3";
        musicPlayer.load();
      }
    });
  }

  if (reportText) {
    reportText.addEventListener("input", updateReportCount);
  }

  if (reportTags && reportTags.length) {
    reportTags.forEach((tagButton) => {
      tagButton.addEventListener("click", () =>
        appendReportTag(tagButton.dataset.tag)
      );
    });
  }

  if (reportSubmit) {
    reportSubmit.addEventListener("click", async () => {
      if (!reportText) {
        return;
      }
      const value = reportText.value.trim();
      if (!value) {
        return;
      }
      reportSubmit.disabled = true;
      reportSubmit.textContent = "Saving...";
      try {
        await fetch(endpoints.report, {
          method: "POST",
          headers: buildJsonHeaders(),
          body: JSON.stringify({
            userName: getContext().userName,
            report: value
          })
        });
        closeAllModals();
      } catch (error) {
        console.error("Report failed", error);
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

      if (navigator.vibrate) {
        navigator.vibrate([500, 250, 500, 250, 500]);
      }

      let location = null;
      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000
            });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (error) {
          console.warn("Geolocation failed", error);
        }
      }

      try {
        const context = getContext();
        await fetch(endpoints.emergency, {
          method: "POST",
          headers: buildJsonHeaders(),
          body: JSON.stringify({
            userName: context.userName,
            message: "USER TRIGGERED EMERGENCY",
            vitals: context.vitals,
            location,
            emotion: context.emotion
          })
        });
      } catch (error) {
        console.error("Emergency alert failed", error);
      } finally {
        emergencyConfirm.disabled = false;
        emergencyConfirm.textContent = "CONFIRM EMERGENCY";
      }
    });
  }

  return {
    closeAllModals,
    startBreathingExercise,
    openMusic,
    openReport,
    openEmergency
  };
}
