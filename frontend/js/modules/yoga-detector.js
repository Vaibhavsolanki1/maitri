/**
 * Yoga Pose Detection Engine
 * Real-time pose detection and matching using MediaPipe
 */

export class YogaPoseDetector {
  constructor() {
    this.pose = null;
    this.camera = null;
    this.isInitialized = false;
    this.landmarks = null;
    this.isDetecting = false;
    
    // Pre-define skeleton connections (MediaPipe 33 landmarks) - avoid recreating each frame
    this.connections = [
      // Face
      [10, 9], [9, 8], [8, 6], [6, 5], [5, 4], [4, 0], [0, 1], [1, 2], [2, 3], [3, 7],
      // Upper body
      [12, 11], [11, 13], [13, 15], [15, 17], [17, 19], [19, 15],
      [12, 14], [14, 16], [16, 18], [18, 20], [20, 16],
      [11, 23], [12, 24],
      // Lower body
      [23, 25], [25, 27], [27, 29], [29, 31],
      [24, 26], [26, 28], [28, 30], [30, 32],
      [23, 24]
    ];
  }

  async initialize() {
    try {
      const Pose = window.Pose;
      
      this.pose = new Pose({
        locateFile: file => `node_modules/@mediapipe/pose/${file}`
      });

      this.pose.onResults(this.onPoseResults.bind(this));
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize MediaPipe:", error);
      return false;
    }
  }

  async startCamera(videoElement) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      videoElement.srcObject = stream;
      return true;
    } catch (error) {
      console.error("Failed to access camera:", error);
      return false;
    }
  }

  onPoseResults(results) {
    if (results && results.poseLandmarks) {
      this.landmarks = results.poseLandmarks;
    }
  }

  async detect(videoElement) {
    if (!this.isInitialized || !this.pose) return null;
    
    this.isDetecting = true;
    try {
      await this.pose.send({ image: videoElement });
      return this.landmarks;
    } catch (error) {
      console.error("Detection error:", error);
      return null;
    } finally {
      this.isDetecting = false;
    }
  }

  drawLandmarks(canvas, landmarks, color = "rgba(228, 127, 99, 0.8)") {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    // Batch draw all connections with single path
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let hasConnections = false;
    for (const [start, end] of this.connections) {
      const startLm = landmarks[start];
      const endLm = landmarks[end];
      
      if (startLm && endLm && startLm.visibility > 0.5 && endLm.visibility > 0.5) {
        if (!hasConnections) {
          ctx.beginPath();
          hasConnections = true;
        }
        ctx.moveTo(startLm.x * width, startLm.y * height);
        ctx.lineTo(endLm.x * width, endLm.y * height);
      }
    }
    if (hasConnections) ctx.stroke();

    // Batch draw all joints
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const landmark of landmarks) {
      if (landmark.visibility > 0.5) {
        ctx.moveTo(landmark.x * width + 5, landmark.y * height);
        ctx.arc(landmark.x * width, landmark.y * height, 5, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  drawGhostPose(canvas, landmarks, ghostLandmarks, color = "rgba(108, 140, 123, 0.4)") {
    const ctx = canvas.getContext("2d");
    
    if (!ghostLandmarks || ghostLandmarks.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    // Batch draw ghost connections (dashed lines)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([5, 5]); // Dashed line pattern

    let hasConnections = false;
    for (const [start, end] of this.connections) {
      const ghostStart = ghostLandmarks[start];
      const ghostEnd = ghostLandmarks[end];
      
      if (ghostStart && ghostEnd) {
        if (!hasConnections) {
          ctx.beginPath();
          hasConnections = true;
        }
        ctx.moveTo(ghostStart.x * width, ghostStart.y * height);
        ctx.lineTo(ghostEnd.x * width, ghostEnd.y * height);
      }
    }
    if (hasConnections) ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Draw ghost joints with color coding based on accuracy
    ctx.beginPath();
    for (let i = 0; i < ghostLandmarks.length; i++) {
      const landmark = ghostLandmarks[i];
      if (landmarks && landmarks[i]) {
        const distance = this.getJointDistance(landmarks[i], landmark);
        
        // Color code: Green (good), Yellow (medium), Red (bad)
        let hue;
        if (distance < 0.15) {
          hue = 120;  // Green
        } else if (distance < 0.3) {
          hue = 45;   // Yellow
        } else {
          hue = 0;    // Red
        }
        
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.6)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = color;
      }

      ctx.moveTo(landmark.x * width + 4, landmark.y * height);
      ctx.arc(landmark.x * width, landmark.y * height, 4, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  getJointDistance(landmark1, landmark2) {
    return Math.sqrt(
      Math.pow(landmark1.x - landmark2.x, 2) +
      Math.pow(landmark1.y - landmark2.y, 2) +
      Math.pow((landmark1.z || 0) - (landmark2.z || 0), 2)
    );
  }

  calculatePoseAccuracy(currentLandmarks, targetLandmarks, criticalJoints = null) {
    if (!currentLandmarks || !targetLandmarks || 
        currentLandmarks.length === 0 || targetLandmarks.length === 0) {
      return 0;
    }

    let totalDistance = 0;
    let jointCount = 0;

    const landmarksToCheck = criticalJoints || Array.from({ length: currentLandmarks.length }, (_, i) => i);

    landmarksToCheck.forEach(index => {
      if (currentLandmarks[index] && targetLandmarks[index]) {
        const distance = this.getJointDistance(currentLandmarks[index], targetLandmarks[index]);
        totalDistance += Math.min(distance, 1); // Cap at 1 for extreme misalignments
        jointCount++;
      }
    });

    const averageDistance = jointCount > 0 ? totalDistance / jointCount : 1;
    const accuracy = Math.max(0, (1 - averageDistance) * 100);
    
    return Math.round(accuracy);
  }

  calculateBodyAngle(landmark1, landmark2, landmark3) {
    const vector1 = {
      x: landmark1.x - landmark2.x,
      y: landmark1.y - landmark2.y
    };
    const vector2 = {
      x: landmark3.x - landmark2.x,
      y: landmark3.y - landmark2.y
    };

    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const det = vector1.x * vector2.y - vector1.y * vector2.x;
    const angle = Math.atan2(det, dot) * (180 / Math.PI);

    return Math.abs(angle);
  }

  getFeedback(currentLandmarks, targetLandmarks) {
    const feedback = [];

    const keyJoints = {
      0: "nose",
      11: "left_shoulder",
      12: "right_shoulder",
      13: "left_elbow",
      14: "right_elbow",
      15: "left_wrist",
      16: "right_wrist",
      23: "left_hip",
      24: "right_hip",
      25: "left_knee",
      26: "right_knee",
      27: "left_ankle",
      28: "right_ankle"
    };

    Object.entries(keyJoints).forEach(([index, name]) => {
      const idx = parseInt(index);
      if (currentLandmarks[idx] && targetLandmarks[idx]) {
        const distance = this.getJointDistance(currentLandmarks[idx], targetLandmarks[idx]);
        
        if (distance > 0.4) {
          feedback.push(`Move ${name} closer to target position`);
        } else if (distance > 0.2) {
          feedback.push(`Fine-tune ${name} alignment`);
        }
      }
    });

    return feedback.length > 0 ? feedback : ["Great alignment! Hold steady."];
  }

  normalizeLandmarks(landmarks) {
    if (!landmarks || landmarks.length === 0) return landmarks;

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    landmarks.forEach(landmark => {
      minX = Math.min(minX, landmark.x);
      maxX = Math.max(maxX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxY = Math.max(maxY, landmark.y);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.max(width, height);

    return landmarks.map(landmark => ({
      x: (landmark.x - minX) / scale,
      y: (landmark.y - minY) / scale,
      z: landmark.z || 0,
      visibility: landmark.visibility || 1
    }));
  }

  interpolateLandmarks(landmarks1, landmarks2, alpha) {
    if (!landmarks1 || !landmarks2) return landmarks1;

    return landmarks1.map((landmark, i) => {
      if (!landmarks2[i]) return landmark;
      
      return {
        x: landmark.x * (1 - alpha) + landmarks2[i].x * alpha,
        y: landmark.y * (1 - alpha) + landmarks2[i].y * alpha,
        z: (landmark.z || 0) * (1 - alpha) + (landmarks2[i].z || 0) * alpha,
        visibility: landmark.visibility || 1
      };
    });
  }

  smoothLandmarks(currentLandmarks, previousLandmarks) {
    return this.interpolateLandmarks(previousLandmarks, currentLandmarks, 0.3);
  }

  stop() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
  }
}

export default YogaPoseDetector;
