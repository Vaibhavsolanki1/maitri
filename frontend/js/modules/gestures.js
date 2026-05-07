let handsInstance = null;
let gestureInterval = null;
let handsScriptPromise = null;

function loadHandsScript() {
  if (handsScriptPromise) {
    return handsScriptPromise;
  }

  handsScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load MediaPipe Hands"));
    document.head.appendChild(script);
  });

  return handsScriptPromise;
}

async function loadHandsInstance() {
  await loadHandsScript();

  if (!window.Hands) {
    throw new Error("Hands library unavailable");
  }

  if (!handsInstance) {
    handsInstance = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    handsInstance.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    handsInstance.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        if (indexTip.y < wrist.y - 0.2) {
          window.scrollBy({ top: -30, behavior: "auto" });
        } else if (indexTip.y > wrist.y + 0.1) {
          window.scrollBy({ top: 30, behavior: "auto" });
        }
      }
    });
  }

  return handsInstance;
}

export async function startGestureDetection(cameraFeed, cameraStream) {
  if (gestureInterval) {
    return;
  }

  try {
    const hands = await loadHandsInstance();
    gestureInterval = window.setInterval(async () => {
      if (cameraStream && cameraFeed && cameraFeed.readyState >= 2) {
        await hands.send({ image: cameraFeed });
      }
    }, 150);
  } catch (error) {
    console.warn("Gesture detection unavailable:", error.message);
  }
}

export function stopGestureDetection() {
  if (gestureInterval) {
    window.clearInterval(gestureInterval);
    gestureInterval = null;
  }
}
