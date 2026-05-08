# MAITRI v2.1

> **M**ental health **A**I **I**nteractive **T**herapeutic **R**eal-time **I**nterface

MAITRI is a privacy-first, edge AI companion that monitors emotion and basic vitals signals, then delivers supportive, actionable guidance for people in isolated or high-stress environments. Designed for astronaut psychological support during long-duration space missions.

Developed by **Vaibhav** for the **ISRO Space Apps Challenge**.

---

## Highlights

- **Real-time emotion detection** — face-api.js runs entirely in-browser, no video ever leaves the device
- **Conversational AI** — context-aware LLM (NVIDIA Nemotron via OpenRouter) adapts tone to your detected emotion
- **Voice interface** — wake word "Hey MAITRI" + speech-to-text + text-to-speech
- **Action confirmation UX** — AI-suggested actions (breathing, music, yoga) require explicit consent before execution
- **Guided wellness modules** — 4-phase breathing exercise, calming audio library, yoga flow with MoveNet pose tracking, meditation timer
- **Emergency protocol** — one-tap SOS with Twilio SMS/voice call, geolocation, and vitals snapshot
- **Adaptive personality** — sentiment analysis builds a per-user communication profile over time
- **Hand gesture control** — MediaPipe Hands for gesture-based scroll navigation
- **Face recognition** — on-device face enrollment for multi-profile support
- **Custom layout editor** — drag-and-drop panel reordering from Settings
- **Profile management** — multi-user switching, profile creation, and logout
- **Premium design system** — dark/light mode, animated neural background, glassmorphism, custom-styled dropdowns and sliders
- **PWA-ready** — manifest, service worker, offline caching
- **Tiered feature gating** — Free/Pro tier system with upgrade prompts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                         │
│                                                              │
│  Webcam → face-api.js → Emotion + Identity → Chat UI + TTS  │
│  MoveNet (yoga) · MediaPipe Hands (gestures) · Web Speech    │
│                                                              │
│  All AI processing runs locally. No images leave the device. │
└──────────────────────────┬───────────────────────────────────┘
                           │ JSON: {message, emotion, vitals}
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  NODE.JS + EXPRESS SERVER                     │
│                                                              │
│  Routes: /chat  /chat/stream  /history  /report  /yoga       │
│          /api/emergency  /api/weekly-report  /health          │
│                                                              │
│  Services: LLM (OpenRouter) · Sentiment · Twilio             │
│  Middleware: Zod validation · Rate limiter · Tier guard       │
│  Storage: MongoDB (conversations, profiles, reports, etc.)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, Vanilla JS (ES Modules), CSS3 (custom properties, animations) |
| **AI/ML (client)** | face-api.js, TensorFlow.js MoveNet, MediaPipe Hands |
| **Voice** | Web Speech API (STT + TTS) |
| **Charts** | Chart.js |
| **Backend** | Node.js, Express |
| **Database** | MongoDB (native driver) |
| **LLM** | OpenRouter API (NVIDIA Nemotron) |
| **Alerts** | Twilio (SMS + Voice) |
| **Validation** | Zod |
| **Security** | express-rate-limit, Helmet (recommended) |

---

## Quick Start

**Prerequisites:** Node.js v18+, Google Chrome, MongoDB Atlas cluster, OpenRouter API key

```bash
# 1. Clone
git clone https://github.com/Vaibhavsolanki1/maitri.git
cd maitri

# 2. Install
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# 4. Start
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Create `backend/.env`:

```env
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maitri_db

# Optional — LLM
OPENROUTER_MODEL=nvidia/nemotron-nano-9b-v2:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional — CORS
CORS_ORIGIN=http://localhost:3000

# Optional — Twilio emergency alerts
TWILIO_ENABLED=false
TWILIO_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxx
TWILIO_FROM=+1xxxxxxxxxx
EMERGENCY_TO=+91xxxxxxxxxx

# Optional — Server
PORT=3000
```

---

## Project Structure

```
MAITRI/
├── backend/
│   ├── config/
│   │   └── index.js              # Environment config + validation
│   ├── db/
│   │   └── indexes.js            # MongoDB index creation
│   ├── middleware/
│   │   ├── asyncHandler.js       # Express async error wrapper
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── rateLimiter.js        # Chat + emergency rate limits
│   │   └── tierGuard.js          # Free/Pro tier middleware
│   ├── models/
│   │   └── validators.js         # Zod schemas for all routes
│   ├── routes/
│   │   ├── chat.js               # /chat, /chat/stream, /history
│   │   ├── emergency.js          # /api/emergency
│   │   ├── health.js             # /health
│   │   ├── report.js             # /report, /reports
│   │   ├── wellness.js           # /api/weekly-report
│   │   └── yoga.js               # /yoga
│   ├── services/
│   │   ├── llm.js                # OpenRouter LLM client (sync + streaming)
│   │   ├── sentiment.js          # User profile sentiment analysis
│   │   ├── twilio.js             # Emergency SMS + voice call
│   │   └── weeklyReport.js       # AI-generated weekly wellness summary
│   ├── .env / .env.example
│   ├── package.json
│   └── server.js                 # Express app bootstrap
├── frontend/
│   ├── css/
│   │   └── styles.css            # Full design system (1900+ lines)
│   ├── js/
│   │   ├── app.js                # Main application controller
│   │   ├── settings.js           # Settings page logic
│   │   ├── details.js            # Dashboard page logic
│   │   ├── yoga.js               # Yoga session page logic
│   │   ├── meditation-page.js    # Meditation timer page logic
│   │   ├── flow-field-background.js  # Neural particle animation
│   │   └── modules/
│   │       ├── camera.js         # Camera, face detection, recognition
│   │       ├── chat.js           # Chat UI, message rendering, action confirmation
│   │       ├── chatStream.js     # SSE streaming client
│   │       ├── config.js         # LocalStorage config, profiles, layout, endpoints
│   │       ├── emotions.js       # Emotion panel state management
│   │       ├── gestures.js       # MediaPipe Hands gesture detection
│   │       ├── meditation.js     # Meditation timer module
│   │       ├── modals.js         # Breathing, music, report, emergency modals
│   │       ├── notifications.js  # Browser notification check-ins
│   │       ├── onboarding.js     # First-run onboarding flow
│   │       ├── speech.js         # STT/TTS + voice action confirmation
│   │       ├── theme.js          # Dark/light mode toggle
│   │       ├── tier.js           # Client-side tier gating + upgrade modal
│   │       └── vitals.js         # Simulated vitals + Chart.js graph
│   ├── assets/
│   │   └── ambient.mp3           # Audio library source
│   ├── models/                   # face-api.js model weights
│   ├── index.html                # Main companion interface
│   ├── details.html              # Dashboard / analytics
│   ├── settings.html             # Settings + layout editor
│   ├── yoga.html                 # Yoga session page
│   ├── meditation.html           # Meditation timer page
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
├── Docs/
│   ├── MAITRI_Complete_Documentation.md
│   ├── architecture.md
│   ├── prd.md
│   ├── DEMO_SCRIPT.md
│   ├── FILE_REFERENCE.md         # Every file explained
│   └── PROJECT_STATUS.md         # Status, future scope, pitch
├── Dockerfile
├── test_verification.js
└── readme.md
```

---

## API Reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Server health check |
| `POST` | `/chat` | Send message, get AI reply (JSON) |
| `POST` | `/chat/stream` | Send message, get AI reply (SSE token stream) |
| `GET` | `/history?userName=X&limit=N` | Fetch chat history |
| `POST` | `/report` | Submit daily wellness report |
| `GET` | `/reports?userName=X` | Fetch past reports |
| `POST` | `/yoga` | Log a yoga session |
| `POST` | `/api/emergency` | Trigger emergency protocol |
| `GET` | `/api/weekly-report?userName=X` | AI-generated weekly wellness summary |

---

## Key Features (v2.1)

### Action Confirmation UX
When MAITRI's AI suggests a wellness action (breathing, music, yoga), it no longer triggers automatically. A confirmation chip appears in the chat — the user must click "Start" or say "yes/sure/haan/chalo" via voice to proceed. Say "no/skip/cancel" to dismiss.

### Custom Layout Editor
In Settings, drag-and-drop the order of dashboard panels (Camera, Emotion, Vitals, Chat, Quick Actions). Layouts persist across sessions via localStorage.

### Profile Management
Switch between profiles, add new profiles, and log out — from both the main header and the Settings page. Logging out clears the active session and re-triggers onboarding.

### Emergency Siren Cancel
Clicking "Cancel" during an active emergency now immediately stops the siren audio oscillator, cancels vibration, and resets the UI state.

---

## Notes & Limitations

- Vitals are simulated (real biometric hardware integration pending)
- Yoga pose evaluation is heuristic-based (simplified angle checks)
- No user authentication yet (profiles are local, tier is client-side)
- Web Speech STT requires Chrome (Firefox/Safari have limited support)
- Audio library cards currently share a single audio file
- Face recognition profiles are stored in browser localStorage

---

## Documentation

| Document | Description |
|---|---|
| [Docs/MAITRI_Complete_Documentation.md](Docs/MAITRI_Complete_Documentation.md) | Full technical deep-dive |
| [Docs/architecture.md](Docs/architecture.md) | System architecture & data flow |
| [Docs/prd.md](Docs/prd.md) | Product requirements document |
| [Docs/DEMO_SCRIPT.md](Docs/DEMO_SCRIPT.md) | Demo walkthrough script |
| [Docs/FILE_REFERENCE.md](Docs/FILE_REFERENCE.md) | Every file explained |
| [Docs/PROJECT_STATUS.md](Docs/PROJECT_STATUS.md) | Status, future scope & pitch |
| [Docs/SCALING_AND_VISION.md](Docs/SCALING_AND_VISION.md) | Scaling strategy & vision ideas |

---

## License

Developed by Vaibhav for the ISRO Space Apps Challenge.
