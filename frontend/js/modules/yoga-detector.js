/**
 * Yoga Pose Detection Engine
 * Real-time pose detection and matching using MoveNet Thunder
 */

export default class YogaPoseDetector {
  constructor() {
    this.detector = null;
    this.cameraStream = null;
    this.isInitialized = false;
    this.isDetecting = false;
    
    // MoveNet 17 keypoints connections
    this.connections = [
      ['nose', 'left_eye'], ['left_eye', 'left_ear'], ['nose', 'right_eye'], ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
    ];
    
    this.keyJoints = {
      0: "nose",
      5: "left_shoulder",
      6: "right_shoulder",
      7: "left_elbow",
      8: "right_elbow",
      9: "left_wrist",
      10: "right_wrist",
      11: "left_hip",
      12: "right_hip",
      13: "left_knee",
      14: "right_knee",
      15: "left_ankle",
      16: "right_ankle"
    };
  }

  async initialize() {
    try {
      if (!window.poseDetection || !window.poseDetection.SupportedModels.MoveNet) {
        throw new Error("TensorFlow.js or MoveNet models not loaded");
      }
      const detectorConfig = { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
      this.detector = await window.poseDetection.createDetector(window.poseDetection.SupportedModels.MoveNet, detectorConfig);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize MoveNet:", error);
      throw error;
    }
  }

  async startCamera(videoElement) {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false
      });
      videoElement.srcObject = this.cameraStream;
      videoElement.play();
      return true;
    } catch (error) {
      console.error("Camera access error:", error);
      return false;
    }
  }

  stop() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
    }
    this.isDetecting = false;
  }

  async detect(videoElement) {
    if (!this.isInitialized || !this.detector) return null;
    
    try {
      const poses = await this.detector.estimatePoses(videoElement);
      if (poses.length > 0) {
        // Normalize coordinates to 0-1 range for consistency across different resolutions
        return poses[0].keypoints.map(kp => ({
          x: kp.x / videoElement.videoWidth,
          y: kp.y / videoElement.videoHeight,
          score: kp.score,
          name: kp.name
        }));
      }
      return null;
    } catch (error) {
      console.error("Detection error:", error);
      return null;
    }
  }

  smoothLandmarks(current, previous, smoothingFactor = 0.5) {
    if (!previous) return current;
    
    return current.map((kp, i) => {
      const prev = previous[i];
      if (!prev || kp.score < 0.3) return kp;
      
      return {
        ...kp,
        x: prev.x * smoothingFactor + kp.x * (1 - smoothingFactor),
        y: prev.y * smoothingFactor + kp.y * (1 - smoothingFactor)
      };
    });
  }

  drawLandmarks(canvas, landmarks) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 255, 100, 0.8)";
    ctx.fillStyle = "#ffffff";

    // Draw connections
    this.connections.forEach(([partA, partB]) => {
      const kpA = landmarks.find(kp => kp.name === partA);
      const kpB = landmarks.find(kp => kp.name === partB);

      if (kpA && kpB && kpA.score > 0.3 && kpB.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kpA.x * canvas.width, kpA.y * canvas.height);
        ctx.lineTo(kpB.x * canvas.width, kpB.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw keypoints
    landmarks.forEach(kp => {
      if (kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x * canvas.width, kp.y * canvas.height, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  drawGhostPose(canvas, currentLandmarks, targetLandmarks) {
    if (!targetLandmarks || !currentLandmarks) return;
    
    const ctx = canvas.getContext("2d");
    
    // Setup for ghost drawing
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 15]);
    
    // Draw target connections
    this.connections.forEach(([partA, partB]) => {
      const idxA = Object.values(this.keyJoints).indexOf(partA);
      const idxB = Object.values(this.keyJoints).indexOf(partB);
      
      const targetA = idxA !== -1 ? targetLandmarks[Object.keys(this.keyJoints)[idxA]] : null;
      const targetB = idxB !== -1 ? targetLandmarks[Object.keys(this.keyJoints)[idxB]] : null;

      if (targetA && targetB) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.moveTo(targetA.x * canvas.width, targetA.y * canvas.height);
        ctx.lineTo(targetB.x * canvas.width, targetB.y * canvas.height);
        ctx.stroke();
      }
    });

    // Reset line dash for points
    ctx.setLineDash([]);
    
    // Draw target points with color coding based on distance
    Object.entries(this.keyJoints).forEach(([index, name]) => {
      const idx = parseInt(index);
      const targetKp = targetLandmarks[idx];
      const currentKp = currentLandmarks[idx];

      if (targetKp) {
        let color = "rgba(255, 255, 255, 0.4)"; // default neutral
        
        if (currentKp && currentKp.score > 0.3) {
          const distance = this.getJointDistance(currentKp, targetKp);
          if (distance < 0.1) color = "rgba(0, 255, 0, 0.8)"; // Green (Good)
          else if (distance < 0.2) color = "rgba(255, 255, 0, 0.8)"; // Yellow (Close)
          else color = "rgba(255, 0, 0, 0.8)"; // Red (Far)
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(targetKp.x * canvas.width, targetKp.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }

  calculatePoseAccuracy(currentLandmarks, targetLandmarks, criticalIndices) {
    if (!currentLandmarks || !targetLandmarks) return 0;

    let totalScore = 0;
    let validJoints = 0;

    criticalIndices.forEach(idx => {
      const current = currentLandmarks[idx];
      const target = targetLandmarks[idx];

      if (current && target && current.score > 0.3) {
        const distance = this.getJointDistance(current, target);
        
        // Convert distance to score (0-100)
        // distance of 0 = 100%, distance > 0.4 = 0%
        let jointScore = Math.max(0, 100 - (distance * 250));
        
        totalScore += jointScore;
        validJoints++;
      }
    });

    return validJoints > 0 ? Math.round(totalScore / validJoints) : 0;
  }

  getJointDistance(p1, p2) {
    if (!p1 || !p2) return Infinity;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getFeedback(currentLandmarks, targetLandmarks) {
    const feedback = [];
    if (!currentLandmarks || !targetLandmarks) return ["Please stand in view of the camera"];

    Object.entries(this.keyJoints).forEach(([index, name]) => {
      const idx = parseInt(index);
      const current = currentLandmarks[idx];
      const target = targetLandmarks[idx];

      if (current && target && current.score > 0.3) {
        const distance = this.getJointDistance(current, target);
        
        if (distance > 0.3) {
          feedback.push(`Move ${name.replace('_', ' ')} closer to target position`);
        } else if (distance > 0.15) {
          feedback.push(`Fine-tune ${name.replace('_', ' ')} alignment`);
        }
      }
    });

    return feedback.length > 0 ? feedback : ["Great alignment! Hold steady."];
  }
}
