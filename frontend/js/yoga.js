let detector;
let video = document.getElementById("yoga-video");
let canvas = document.getElementById("yoga-canvas");
let ctx = canvas.getContext("2d");
let overlay = document.getElementById("yoga-camera-overlay");
let currentPose = null;
let isDetecting = false;
let holdTimer = 10;
let timerInterval = null;
let sessionActive = false;

async function initMoveNet() {
  document.getElementById("status").textContent = "Loading MoveNet...";
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
  });
  document.getElementById("status").textContent = "Ready. Select a pose.";
}

document.querySelectorAll(".pose-card").forEach(card => {
  card.addEventListener("click", () => {
    if (!detector) return;
    currentPose = card.getAttribute("data-pose");
    document.getElementById("current-pose-name").textContent = card.querySelector("h3").textContent;
    startYogaSession();
  });
});

document.getElementById("close-yoga").addEventListener("click", endYogaSession);

async function startYogaSession() {
  overlay.classList.add("is-active");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
  video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  isDetecting = true;
  sessionActive = true;
  holdTimer = 10;
  document.getElementById("pose-timer").textContent = holdTimer;
  detectPose();
}

async function endYogaSession() {
  isDetecting = false;
  sessionActive = false;
  overlay.classList.remove("is-active");
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  if (timerInterval) clearInterval(timerInterval);
}

async function detectPose() {
  if (!isDetecting) return;
  const poses = await detector.estimatePoses(video);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let isCorrect = false;

  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;
    isCorrect = evaluatePose(keypoints, currentPose);
    
    // Draw skeleton
    ctx.fillStyle = isCorrect ? "#4CAF50" : "#F44336"; // Green / Red
    keypoints.forEach(kp => {
      if (kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    if (isCorrect) {
      document.getElementById("pose-feedback").textContent = "Excellent!";
      if (!timerInterval) {
        timerInterval = setInterval(() => {
          holdTimer--;
          document.getElementById("pose-timer").textContent = holdTimer;
          if (holdTimer <= 0) {
            completeSession();
          }
        }, 1000);
      }
    } else {
      document.getElementById("pose-feedback").textContent = "Adjust your position";
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  }
  
  requestAnimationFrame(detectPose);
}

function evaluatePose(keypoints, pose) {
  const getKp = (name) => keypoints.find(k => k.name === name);
  const lw = getKp('left_wrist');
  const rw = getKp('right_wrist');
  const nose = getKp('nose');
  const la = getKp('left_ankle');
  const ra = getKp('right_ankle');
  const lk = getKp('left_knee');
  const rk = getKp('right_knee');
  const ls = getKp('left_shoulder');
  const rs = getKp('right_shoulder');

  const scoreThreshold = 0.3;
  const allPresent = (...kps) => kps.every(k => k && k.score > scoreThreshold);

  if (pose === "mountain") {
    if (allPresent(lw, rw, nose)) {
      return (lw.y < nose.y) && (rw.y < nose.y);
    }
  } else if (pose === "tree") {
    if (allPresent(la, ra, lk, rk, lw, rw, nose)) {
      const armsUp = (lw.y < nose.y) && (rw.y < nose.y);
      const leftAnkleToRightKnee = Math.abs(la.y - rk.y) < 70 && Math.abs(la.x - rk.x) < 70;
      const rightAnkleToLeftKnee = Math.abs(ra.y - lk.y) < 70 && Math.abs(ra.x - lk.x) < 70;
      return armsUp && (leftAnkleToRightKnee || rightAnkleToLeftKnee);
    }
  } else if (pose === "warrior2") {
    if (allPresent(lw, rw, ls, rs)) {
      const leftArmHoriz = Math.abs(lw.y - ls.y) < 80;
      const rightArmHoriz = Math.abs(rw.y - rs.y) < 80;
      return leftArmHoriz && rightArmHoriz;
    }
  }
  return false;
}

async function completeSession() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById("pose-feedback").textContent = "Session Complete!";
  isDetecting = false;
  
  try {
    const userName = localStorage.getItem("maitriActiveUser") || "Guest";
    await fetch("http://localhost:3000/yoga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, pose: currentPose, duration: 10, score: 100 })
    });
  } catch(e) {
    console.error(e);
  }

  setTimeout(() => {
    endYogaSession();
  }, 2000);
}

initMoveNet();
