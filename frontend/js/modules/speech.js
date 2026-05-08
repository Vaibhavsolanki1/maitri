import { getStoredVoice, isTtsEnabled } from "./config.js";

let speechRecognition = null;
let micActive = false;
let selectedVoice = null;
let voiceReady = false;

function updateMicUi(isActive, micButton, systemStatus) {
  micActive = isActive;
  if (micButton) {
    micButton.classList.toggle("is-active", isActive);
  }
  if (!isActive && systemStatus && systemStatus.textContent === "Listening") {
    systemStatus.textContent = "System ready";
  }
}

function pickVoice(voices) {
  const stored = getStoredVoice();
  if (stored) {
    const match = voices.find((voice) => voice.name === stored);
    if (match) {
      return match;
    }
  }

  return (
    voices.find((voice) =>
      ["Zira", "Samantha", "Female", "Google UK English Female"].some((name) =>
        voice.name.includes(name)
      )
    ) || voices[0]
  );
}

function loadVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (voices.length > 0) {
    selectedVoice = pickVoice(voices);
    voiceReady = true;
  }
}

export function speakText(text) {
  if (!window.speechSynthesis || !text || !isTtsEnabled()) {
    return;
  }

  if (!voiceReady) {
    loadVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  const wasMicActive = micActive;
  utterance.onstart = () => {
    if (wasMicActive && speechRecognition) {
      speechRecognition.stop();
    }
  };
  utterance.onend = () => {
    if (wasMicActive && speechRecognition) {
      try {
        speechRecognition.start();
      } catch (error) {
        // no-op
      }
    }
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function initSpeech({
  micButton,
  systemStatus,
  inputEl,
  onSendMessage,
  requireFeature
}) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { supported: false };
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = "en-US";
  speechRecognition.interimResults = true;
  speechRecognition.continuous = true;

  const speechStatusEl = document.getElementById("speech-status");

  speechRecognition.onstart = () => {
    updateMicUi(true, micButton, systemStatus);
    if (systemStatus && systemStatus.textContent !== "Offline") {
      systemStatus.textContent = "Listening";
    }
    if (speechStatusEl) speechStatusEl.textContent = "Listening...";
  };

  speechRecognition.onend = () => {
    if (speechStatusEl) speechStatusEl.textContent = "";
    
    // If not hidden, restart it automatically to fix Chrome's silence timeout
    if (!document.hidden && micActive) {
      setTimeout(() => {
        try { speechRecognition.start(); } catch(e) {}
      }, 1000);
    } else {
      updateMicUi(false, micButton, systemStatus);
    }
  };

  speechRecognition.onerror = (event) => {
    updateMicUi(false, micButton, systemStatus);
    const reason = event && event.error ? event.error : "unknown";
    if (systemStatus) {
      systemStatus.textContent = `Mic error: ${reason}`;
    }
  };

  let speechDebounceTimer = null;
  let accumulatedFinalText = "";

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

    if (inputEl) {
      if (interim) {
        inputEl.placeholder = interim;
        inputEl.value = accumulatedFinalText;
      } else {
        inputEl.placeholder = "Type your message...";
      }
    }

    if (finalTranscript) {
      const lowerTranscript = finalTranscript.toLowerCase();
      const wakeWordIndex = lowerTranscript.lastIndexOf("hey maitri");

      if (wakeWordIndex !== -1) {
        const textAfter = finalTranscript.substring(wakeWordIndex + 10).trim();
        if (textAfter && typeof onSendMessage === "function") {
          onSendMessage(textAfter);
          accumulatedFinalText = "";
          if (inputEl) inputEl.value = "";
          return;
        } else {
          speakText("I am listening");
          accumulatedFinalText = "";
          if (inputEl) inputEl.value = "";
          return;
        }
      }

      if (window._pendingActionCallback) {
        const confirmWords = ["yes", "sure", "okay", "ok", "go ahead", "start", "do it", "yeah", "haan", "chalo"];
        const rejectWords = ["no", "cancel", "nevermind", "skip"];
        
        if (confirmWords.some(w => lowerTranscript.includes(w))) {
          window._pendingActionCallback();
          window.dismissPendingAction();
          accumulatedFinalText = "";
          if (inputEl) inputEl.value = "";
          return;
        } else if (rejectWords.some(w => lowerTranscript.includes(w))) {
          window.dismissPendingAction();
          accumulatedFinalText = "";
          if (inputEl) inputEl.value = "";
          return;
        }
      }

      accumulatedFinalText += (accumulatedFinalText ? " " : "") + finalTranscript.trim();
      
      if (inputEl) {
        inputEl.value = accumulatedFinalText;
      }

      if (speechDebounceTimer) {
        clearTimeout(speechDebounceTimer);
      }

      speechDebounceTimer = setTimeout(() => {
        if (accumulatedFinalText && typeof onSendMessage === "function") {
          onSendMessage(accumulatedFinalText);
          accumulatedFinalText = "";
          if (inputEl) inputEl.value = "";
        }
      }, 1500);
    }
  };

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && speechRecognition && micActive) {
      speechRecognition.stop();
      if (speechStatusEl) speechStatusEl.textContent = "";
    } else if (!document.hidden && speechRecognition && micActive) {
      try { 
        speechRecognition.start(); 
        if (speechStatusEl) speechStatusEl.textContent = "Listening...";
      } catch(e) {}
    }
  });


  if (micButton) {
    micButton.addEventListener("click", () => {
      const startOrStop = () => {
        if (!window.isSecureContext) {
          if (systemStatus) {
            systemStatus.textContent = "Mic requires secure context (use localhost)";
          }
          return;
        }

        if (micActive) {
          speechRecognition.stop();
          return;
        }

        try {
          speechRecognition.start();
        } catch (error) {
          if (systemStatus) {
            systemStatus.textContent = "Mic error";
          }
        }
      };

      if (typeof requireFeature === "function") {
        requireFeature("voice", startOrStop);
        return;
      }

      startOrStop();
    });
  }

  return {
    supported: true,
    stop: () => speechRecognition && speechRecognition.stop(),
    start: () => speechRecognition && speechRecognition.start(),
    isActive: () => micActive
  };
}
