const vitalsState = {
  hr: 78,
  spo2: 97,
  temp: 36.9,
  history: []
};

let elements = null;
let chartContext = null;
let vitalsTimer = null;

function formatTimeStamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function resizeCanvas() {
  if (!elements || !elements.chartEl) {
    return;
  }
  const ratio = window.devicePixelRatio || 1;
  const chartEl = elements.chartEl;
  chartEl.width = chartEl.clientWidth * ratio;
  chartEl.height = chartEl.clientHeight * ratio;
  chartContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawVitalsChart() {
  if (!elements || !elements.chartEl) {
    return;
  }

  const width = elements.chartEl.clientWidth;
  const height = elements.chartEl.clientHeight;
  const points = vitalsState.history;

  chartContext.clearRect(0, 0, width, height);
  chartContext.strokeStyle = "rgba(228, 127, 99, 0.8)";
  chartContext.lineWidth = 2;

  if (points.length < 2) {
    return;
  }

  const min = Math.min(...points) - 5;
  const max = Math.max(...points) + 5;
  const range = max - min || 1;

  chartContext.beginPath();
  points.forEach((value, index) => {
    const x = (index / (points.length - 1)) * (width - 20) + 10;
    const y = height - ((value - min) / range) * (height - 20) - 10;
    if (index === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  });
  chartContext.stroke();
}

function updateVitals() {
  let hrTarget = 78;
  let tempTarget = 36.9;

  if (window.maitriEmotionState?.label?.match(/angry|stressed|fear/i)) {
    hrTarget = 95;
    tempTarget = 37.3;
  } else if (window.maitriEmotionState?.label?.match(/calm|relaxed/i)) {
    hrTarget = 65;
    tempTarget = 36.5;
  } else if (window.maitriEmotionState?.label?.match(/happy|excited/i)) {
    hrTarget = 85;
    tempTarget = 37.0;
  }

  const hrDelta = (hrTarget - vitalsState.hr) * 0.1 + (Math.random() * 4 - 2);
  const spo2Delta = Math.random() * 0.4 - 0.2;
  const tempDelta =
    (tempTarget - vitalsState.temp) * 0.05 + (Math.random() * 0.1 - 0.05);

  vitalsState.hr = Math.max(62, Math.min(120, vitalsState.hr + hrDelta));
  vitalsState.spo2 = Math.max(94, Math.min(100, vitalsState.spo2 + spo2Delta));
  vitalsState.temp = Math.max(36.0, Math.min(38.0, vitalsState.temp + tempDelta));

  if (elements) {
    if (elements.hrEl) {
      elements.hrEl.textContent = `${Math.round(vitalsState.hr)} bpm`;
    }
    if (elements.spo2El) {
      elements.spo2El.textContent = `${Math.round(vitalsState.spo2)}%`;
    }
    if (elements.tempEl) {
      elements.tempEl.textContent = `${vitalsState.temp.toFixed(1)} C`;
    }
    if (elements.updatedEl) {
      elements.updatedEl.textContent = `Updated at ${formatTimeStamp(new Date())}`;
    }
  }

  vitalsState.history.push(vitalsState.hr);
  if (vitalsState.history.length > 30) {
    vitalsState.history.shift();
  }

  drawVitalsChart();
}

export function initVitals({ hrEl, spo2El, tempEl, updatedEl, chartEl }) {
  elements = { hrEl, spo2El, tempEl, updatedEl, chartEl };

  if (chartEl) {
    chartContext = chartEl.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", () => {
      resizeCanvas();
      drawVitalsChart();
    });
  }

  updateVitals();
  vitalsTimer = window.setInterval(updateVitals, 2500);
}

export function getVitalsSnapshot() {
  return {
    hr: Math.round(vitalsState.hr),
    spo2: Math.round(vitalsState.spo2),
    temp: parseFloat(vitalsState.temp.toFixed(1))
  };
}

export function stopVitals() {
  if (vitalsTimer) {
    window.clearInterval(vitalsTimer);
    vitalsTimer = null;
  }
}
