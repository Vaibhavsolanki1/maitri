# MAITRI v2.0

Multi-modal AI Intelligent Therapeutic Real-time Interface

MAITRI is a privacy-first, edge AI companion that monitors emotion and basic vitals signals, then delivers supportive, actionable guidance for people in isolated or high-stress environments. All face/emotion processing runs locally in the browser.

## Features

- Real-time emotion detection with face-api.js (client-side only)
- Face recognition for personalized context
- Conversational AI with action triggers (breathing, music, yoga)
- Voice interface with wake word "Hey MAITRI" and TTS responses
- Hand gesture scroll control (MediaPipe Hands)
- Vitals simulation (HR, SpO2, temperature) with live chart
- Guided breathing exercise (4-phase cycle)
- Calming audio library (ASMR, white noise, nature, rain, offshore beach)
- Yoga flow with guided checkpoints and a 10s final hold
- Mirrored camera feed for intuitive pose alignment
- Daily report modal and project dashboard (Chart.js)
- Emergency protocol with Twilio SMS/voice (optional)
- PWA manifest for app-style install

## Architecture

Browser-side AI handles perception and feedback, while the Node.js backend orchestrates prompts, persistence, and alerts. No video, audio, or facial images leave the device.

See [Docs/architecture.md](Docs/architecture.md) for full technical architecture.

## Tech Stack

Frontend:
- HTML5 + Vanilla JavaScript
- CSS custom properties (theme system)
- face-api.js, TensorFlow.js MoveNet, MediaPipe Hands
- Web Speech API (STT/TTS)
- Chart.js

Backend:
- Node.js + Express
- MongoDB (native driver)
- OpenRouter (LLM gateway)
- Sentiment analysis
- Twilio (optional)
- express-rate-limit

## Quick Start

Prerequisites:
- Node.js v18+
- Google Chrome (for Web Speech STT)
- OpenRouter API key
- MongoDB Atlas cluster
- Twilio account (optional)

Installation:
```bash
# 1. Clone the repository
git clone https://github.com/Vaibhavsolanki1/maitri.git
cd maitri

# 2. Install backend dependencies
cd backend
npm install

# 3. Create environment file
# Create backend/.env with your API keys (see below)

# 4. Start the backend server
npm run dev
# Server runs at http://localhost:3000 (serves the frontend)
```

Open the app at http://localhost:3000 in Chrome for full voice support.

## Environment Variables

Create backend/.env:
```env
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maitri_db

# Optional (LLM config)
OPENROUTER_MODEL=nvidia/nemotron-4-340b-instruct
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional (CORS)
CORS_ORIGIN=http://localhost:3000

# Optional (Twilio emergency alerts)
TWILIO_ENABLED=false
TWILIO_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxx
TWILIO_FROM=+1xxxxxxxxxx
EMERGENCY_TO=+91xxxxxxxxxx

# Optional (server)
PORT=3000
```

## Project Structure

```
MAITRI/
├── backend/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── details.html
│   ├── yoga.html
│   ├── manifest.json
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── details.js
│   │   ├── flow-field-background.js
│   │   └── yoga.js
│   ├── assets/
│   │   └── ambient.mp3
│   └── models/
│       ├── tiny_face_detector_model-*
│       ├── face_landmark_68_model-*
│       ├── face_recognition_model-*
│       └── face_expression_model-*
├── Docs/
│   ├── architecture.md
│   ├── DEMO_SCRIPT.md
│   ├── MAITRI_Complete_Documentation.md
│   └── prd.md
├── Dockerfile
└── readme.md
```

## API Reference

Base URL: http://localhost:3000

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | /health | — | { ok } |
| GET | /history | — | { userName, items } |
| GET | /reports | — | { userName, items } |
| POST | /chat | { message, emotion, userName, vitals, emotionHistory } | { reply, userName, emotion, emotionConfidence, action } |
| POST | /report | { report, userName } | { ok, id } |
| POST | /yoga | { pose, duration, score, userName } | { ok, id } |
| POST | /api/emergency | { vitals, location, userName, message, emotion } | { ok, id } |

See [Docs/architecture.md](Docs/architecture.md) for roadmap endpoints.

## Notes and Limitations

- Vitals are simulated (hardware integration pending).
- Yoga evaluation is heuristic and should be expanded.
- No authentication yet (single-user prototype).
- Web Speech STT requires Chrome.
- Audio library cards are placeholders until you add separate audio files.

## Documentation

- [Docs/architecture.md](Docs/architecture.md)
- [Docs/MAITRI_Complete_Documentation.md](Docs/MAITRI_Complete_Documentation.md)
- [Docs/prd.md](Docs/prd.md)
- [Docs/DEMO_SCRIPT.md](Docs/DEMO_SCRIPT.md)
