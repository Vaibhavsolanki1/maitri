import { addProfile } from "./config.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatEmotionLabel(label) {
  if (!label) {
    return "Unknown";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function createCameraController({
  elements,
  onStatus,
  onEmotion,
  onFaceMatch,
  onCameraState,
  requireFeature,
  canUseFaceRecognition
}) {
  const {
    cameraPlaceholder,
    cameraFeed,
    cameraStatus,
    emotionMode,
    enableCamera,
    systemStatus,
    cameraProgress,
    cameraStep,
    cameraProgressFill,
    cancelCamera,
    identityNameInput,
    enrollFaceButton
  } = elements;

  let cameraStream = null;
  let detectionTimer = null;
  let modelsReady = false;
  let recognitionReady = false;
  let faceMatcher = null;
  let knownFaces = [];
  let cancelRequested = false;

  function setStatus(text) {
    if (cameraStatus) {
      cameraStatus.textContent = text;
    }
    if (systemStatus) {
      systemStatus.textContent = text;
    }
    if (typeof onStatus === "function") {
      onStatus(text);
    }
  }

  function setProgress(stepText, percent) {
    if (!cameraProgress || !cameraStep || !cameraProgressFill) {
      return;
    }
    cameraProgress.hidden = false;
    cameraStep.textContent = stepText;
    cameraProgressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  function hideProgress() {
    if (cameraProgress) {
      cameraProgress.hidden = true;
    }
  }

  function updateMode(text) {
    if (emotionMode) {
      emotionMode.textContent = text;
    }
  }

  function serializeDescriptors(descriptors) {
    return descriptors.map((descriptor) => Array.from(descriptor));
  }

  function hydrateDescriptors(entries) {
    return entries.map(
      (entry) =>
        new faceapi.LabeledFaceDescriptors(
          entry.label,
          entry.descriptors.map((descriptor) => new Float32Array(descriptor))
        )
    );
  }

  function updateFaceMatcher() {
    if (knownFaces.length === 0) {
      faceMatcher = null;
      return;
    }
    faceMatcher = new faceapi.FaceMatcher(knownFaces, 0.6);
  }

  function loadStoredFaces() {
    try {
      const raw = window.localStorage.getItem("maitriFaces");
      if (!raw) {
        knownFaces = [];
        updateFaceMatcher();
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        knownFaces = [];
        updateFaceMatcher();
        return;
      }

      knownFaces = hydrateDescriptors(parsed);
      updateFaceMatcher();
    } catch (error) {
      console.warn("Failed to load stored faces:", error);
      knownFaces = [];
      updateFaceMatcher();
    }
  }

  function saveStoredFaces() {
    const payload = knownFaces.map((item) => ({
      label: item.label,
      descriptors: serializeDescriptors(item.descriptors)
    }));
    window.localStorage.setItem("maitriFaces", JSON.stringify(payload));
  }

  async function loadModels() {
    if (modelsReady) {
      return true;
    }

    if (!window.faceapi) {
      setStatus("Face detection unavailable (library failed to load)");
      updateMode("Simulated");
      return false;
    }

    const modelPath = "./models";
    setProgress("Loading face models...", 20);

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
    ]);

    if (canUseFaceRecognition()) {
      try {
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
        recognitionReady = true;
      } catch (error) {
        console.warn("Face recognition model missing:", error);
        recognitionReady = false;
      }
    }

    modelsReady = true;
    loadStoredFaces();
    return true;
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported");
    }

    setProgress("Requesting camera access...", 45);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 360 }
      },
      audio: false
    });

    if (cancelRequested) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("Camera start canceled");
    }

    cameraFeed.srcObject = stream;
    cameraStream = stream;
    await cameraFeed.play();
    return stream;
  }

  function stopDetection() {
    if (detectionTimer) {
      window.clearInterval(detectionTimer);
      detectionTimer = null;
    }
  }

  function stopCamera() {
    stopDetection();
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    if (cameraPlaceholder) {
      cameraPlaceholder.classList.remove("camera-live");
    }
    updateMode("Simulated");
    setStatus("Camera stopped");
    hideProgress();
    if (typeof onCameraState === "function") {
      onCameraState({ active: false, stream: null });
    }
  }

  function startEmotionDetection() {
    if (!cameraFeed) {
      return;
    }

    stopDetection();

    detectionTimer = window.setInterval(async () => {
      if (!cameraStream || cameraFeed.readyState < 2) {
        return;
      }

      try {
        const detectionTask = faceapi
          .detectSingleFace(
            cameraFeed,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.5
            })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const detection = recognitionReady
          ? await detectionTask.withFaceDescriptor()
          : await detectionTask;

        if (!detection || !detection.expressions) {
          if (onEmotion) {
            onEmotion({ label: "No face", confidence: null });
          }
          return;
        }

        const entries = Object.entries(detection.expressions);
        entries.sort((a, b) => b[1] - a[1]);
        const [topLabel, topScore] = entries[0];

        if (onEmotion) {
          onEmotion({ label: formatEmotionLabel(topLabel), confidence: topScore });
        }

        if (
          recognitionReady &&
          faceMatcher &&
          detection.descriptor &&
          canUseFaceRecognition()
        ) {
          const match = faceMatcher.findBestMatch(detection.descriptor);
          if (match.label !== "unknown") {
            onFaceMatch(match.label);
          }
        }
      } catch (error) {
        console.warn("Emotion detection error:", error);
      }
    }, 900);
  }

  async function handleEnableCamera() {
    if (cameraStream) {
      return;
    }

    cancelRequested = false;
    if (enableCamera) {
      enableCamera.disabled = true;
      enableCamera.textContent = "Starting...";
    }

    setStatus("Camera setup pending");
    setProgress("Initializing camera...", 10);

    try {
      const modelsLoaded = await loadModels();
      if (!modelsLoaded) {
        throw new Error("Face models unavailable");
      }
      setProgress("Starting live feed...", 70);
      await startCamera();

      if (cameraPlaceholder) {
        cameraPlaceholder.classList.add("camera-live");
      }
      setStatus("Camera ready");
      updateMode("Live");
      if (enableCamera) {
        enableCamera.textContent = "Camera enabled";
      }
      startEmotionDetection();
      hideProgress();
      if (typeof onCameraState === "function") {
        onCameraState({ active: true, stream: cameraStream });
      }
    } catch (error) {
      console.error(error);
      setStatus("Camera unavailable");
      updateMode("Simulated");
      hideProgress();
      if (enableCamera) {
        enableCamera.disabled = false;
        enableCamera.textContent = "Enable camera";
      }
    }
  }

  async function enrollCurrentFace() {
    if (!canUseFaceRecognition()) {
      if (typeof requireFeature === "function") {
        requireFeature("faceRecognition");
      }
      return;
    }

    if (!identityNameInput || !cameraStream) {
      setStatus("Enable camera first");
      return;
    }

    const name = identityNameInput.value.trim();
    if (!name) {
      setStatus("Enter a name to enroll");
      return;
    }

    try {
      await loadModels();
      if (!recognitionReady) {
        setStatus("Recognition model missing");
        return;
      }
      const detection = await faceapi
        .detectSingleFace(
          cameraFeed,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection || !detection.descriptor) {
        setStatus("No face detected");
        return;
      }

      const existing = knownFaces.find((item) => item.label === name);
      if (existing) {
        existing.descriptors.push(detection.descriptor);
      } else {
        knownFaces.push(new faceapi.LabeledFaceDescriptors(name, [detection.descriptor]));
      }

      updateFaceMatcher();
      saveStoredFaces();
      addProfile(name);
      if (onFaceMatch) {
        onFaceMatch(name, { enrolled: true });
      }
      identityNameInput.value = "";
      setStatus("Face enrolled");
    } catch (error) {
      console.error(error);
      setStatus("Enrollment failed");
    }
  }

  if (enableCamera) {
    enableCamera.addEventListener("click", () => {
      if (typeof requireFeature === "function") {
        requireFeature("camera", handleEnableCamera);
        return;
      }
      handleEnableCamera();
    });
  }

  if (cancelCamera) {
    cancelCamera.addEventListener("click", () => {
      cancelRequested = true;
      stopCamera();
      if (enableCamera) {
        enableCamera.disabled = false;
        enableCamera.textContent = "Enable camera";
      }
    });
  }

  if (enrollFaceButton) {
    enrollFaceButton.addEventListener("click", enrollCurrentFace);
  }

  return {
    stopCamera,
    requestPermission: async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (error) {
        return false;
      }
    },
    getStream: () => cameraStream
  };
}
