# MAITRI v2.1 — Complete Project Documentation

> **M**ental health **A**I **I**nteractive **T**herapeutic **R**eal-time **I**nterface

A full-stack, context-aware AI assistant designed for astronaut psychological support in isolated, high-stress environments. Developed by **Vaibhav** for the **ISRO Space Apps Challenge**.

> [!NOTE]
> This document reflects **v2.1** of the MAITRI system. For a quick-reference guide to every file in the codebase, see [FILE_REFERENCE.md](FILE_REFERENCE.md). For project status, future scope, and pitch material, see [PROJECT_STATUS.md](PROJECT_STATUS.md).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Technology Stack](#3-technology-stack)
4. [Project File Structure](#4-project-file-structure)
5. [Frontend Deep Dive](#5-frontend-deep-dive)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [AI & ML Models](#7-ai--ml-models)
8. [Feature Modules](#8-feature-modules)
9. [API Reference](#9-api-reference)
10. [Database Schema](#10-database-schema)
11. [Environment & Setup](#11-environment--setup)
12. [Design System](#12-design-system)
13. [Security Considerations](#13-security-considerations)
14. [Known Limitations & Future Scope](#14-known-limitations--future-scope)

---

## 1. Project Overview

### What is MAITRI?

MAITRI is an AI-powered companion application that provides **real-time psychological support and monitoring** for individuals in isolated environments — with astronauts as the primary use case. It combines multiple AI modalities:

| Capability | How |
|---|---|
| Real-time emotion detection | `face-api.js` running in-browser on webcam feed |
| Personalized face recognition | Labeled face descriptors from a reference photo |
| Context-aware conversational AI | NVIDIA Nemotron LLM via OpenRouter API |
| Voice activation & TTS | Web Speech API (wake word: "Hey MAITRI") |
| Hand gesture control | MediaPipe Hands for gesture-based navigation |
| Pose detection (Yoga) | TensorFlow.js MoveNet model |
| Emergency alerting | Twilio SMS + voice call to ground control |
| Adaptive learning | Sentiment analysis builds a per-user personality profile |
| Action confirmation | AI suggestions require explicit user consent before execution |
| Multi-profile management | Profile switching, creation, and logout |
| Custom layout editor | Drag-and-drop panel reordering in Settings |
| Meditation timer | Configurable guided meditation sessions |
| Premium UX system | Custom-styled dropdowns, sliders, micro-animations |

### Core Problem Solved

Astronauts on long-duration missions face extreme isolation. MAITRI acts as an always-available, empathetic companion that:
- Detects emotional distress via facial expressions
- Adapts conversation tone based on detected emotion
- Provides guided breathing, relaxation music, and yoga sessions
- Sends emergency alerts with vitals & geolocation to HQ

---

## 2. Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Webcam   │→ │ face-api.js  │→ │ Emotion + │→ │ Chat UI   │ │
│  │ Feed     │  │ (local AI)   │  │ Identity  │  │ + Voice   │ │
│  └──────────┘  └──────────────┘  └─────┬─────┘  └─────┬─────┘ │
│                                        │              │        │
│  ┌──────────────┐  ┌───────────────┐   │              │        │
│  │ TF.js        │  │ Web Speech    │   │              │        │
│  │ MoveNet/Hand │  │ API (STT/TTS) │   │              │        │
│  └──────────────┘  └───────────────┘   │              │        │
└────────────────────────────────────────┼──────────────┼────────┘
                                         │              │
                              JSON: {message, emotion, userName}
                                         │              │
                                         ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NODE.JS SERVER (Express)                       │
│                                                                 │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │ /chat       │→ │ Context Builder │→ │ OpenRouter API Call  │ │
│  │ /report     │  │ (System Prompt) │  │ (NVIDIA Nemotron)   │ │
│  │ /yoga       │  └────────────────┘  └──────────────────────┘ │
│  │ /api/emerg. │                                                │
│  └──────┬──────┘  ┌────────────────┐  ┌──────────────────────┐ │
│         │         │ Sentiment Lib  │  │ Twilio (SMS + Call)  │ │
│         │         │ (Profile Learn)│  └──────────────────────┘ │
│         │         └────────────────┘                            │
│         ▼                                                       │
│  ┌──────────────────────────────────────┐                       │
│  │        MongoDB Atlas                  │                       │
│  │  Collections: conversations,          │                       │
│  │  daily_reports, user_profiles,        │                       │
│  │  yoga_sessions, emergencies           │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Step-by-Step

1. **Input Capture**: Webcam feed + microphone audio captured in browser
2. **Local AI Processing**: `face-api.js` extracts emotion confidence scores and face descriptor (identity). No video leaves the device — **privacy first**.
3. **Speech-to-Text**: Web Speech API converts voice to text. Supports wake word "Hey MAITRI".
4. **Enriched Payload**: Frontend sends `{message, emotion, userName}` to the backend `/chat` endpoint.
5. **Context Building**: Server constructs a system prompt: *"You are MAITRI. User: X. Emotion: Y. Communication style: Z."*
6. **LLM Call**: Enriched prompt + last 10 messages sent to NVIDIA Nemotron via OpenRouter.
7. **Response Delivery**: AI text response returned to browser, displayed in chat, and spoken via TTS.
8. **Adaptive Learning**: After each interaction, the server runs sentiment analysis on all user messages to update the user's personality profile (communication style, humor preference, overall mood).

---

## 3. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | Page structure (3 pages: `index.html`, `details.html`, `yoga.html`) |
| Vanilla JavaScript | All client logic (~820 lines in `script.js`) |
| CSS3 (Custom) | Dark theme design system with CSS custom properties |
| Inline CSS (details page) | Lightweight dashboard styling in `details.html` |
| `face-api.js` v0.22.2 | In-browser face detection, landmark, recognition, expression analysis |
| TensorFlow.js | Backend for MoveNet (pose detection) and HandPose (gesture control) |
| Web Speech API | Speech recognition (STT) and speech synthesis (TTS) |
| Chart.js | Data visualization on the details/report page |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | Runtime | Server environment |
| Express.js | v5.2.1 | HTTP server & routing |
| MongoDB (driver) | v6.21.0 | Database client for MongoDB Atlas |
| Axios | v1.13.2 | HTTP client for OpenRouter API calls |
| Sentiment | v5.0.2 | NLP sentiment analysis for adaptive learning |
| Twilio | v5.10.7 | SMS and voice call for emergency alerts |
| dotenv | v17.2.3 | Environment variable management |
| cors | v2.8.5 | Cross-origin resource sharing |
| nodemon | v3.1.11 | Dev dependency for auto-restart |

### External Services
| Service | Purpose |
|---|---|
| OpenRouter API | Gateway to NVIDIA Nemotron 4 340B instruct (default) |
| MongoDB Atlas | Cloud-hosted NoSQL database |
| Twilio | Programmable SMS + Voice for emergency alerts |

---

## 4. Project File Structure

```
MAITRI/
├── backend/
│   ├── .env                    # API keys & secrets (gitignored)
│   ├── package.json            # Backend dependencies
│   └── server.js               # Express server (API + static frontend)
│
├── frontend/
│   ├── index.html              # Main dashboard
│   ├── details.html            # Project dashboard
│   ├── yoga.html               # Yoga flow
│   ├── manifest.json           # PWA manifest
│   ├── css/
│   │   └── styles.css           # Design system
│   ├── js/
│   │   ├── app.js               # Core frontend logic
│   │   ├── details.js           # Dashboard charts + reports
│   │   ├── flow-field-background.js
│   │   └── yoga.js              # Pose detection flow
│   ├── assets/
│   │   └── ambient.mp3          # Placeholder ambient loop
│   └── models/                 # face-api.js pre-trained model weights
│       ├── tiny_face_detector_model-*
│       ├── face_landmark_68_model-*
│       ├── face_recognition_model-*
│       └── face_expression_model-*
│
├── Docs/
│   ├── architecture.md
│   ├── DEMO_SCRIPT.md
│   ├── MAITRI_Complete_Documentation.md
│   └── prd.md
├── Dockerfile
└── readme.md
```

---

## 5. Frontend Deep Dive

### 5.1 Main Dashboard (`index.html`)

The main page is a two-column companion dashboard:

**Left Column:**
- **Presence panel**: Live camera feed, face enrollment, and status prompts
- **Emotion pulse**: Live or simulated emotion label + confidence + trend
- **Vitals snapshot**: Simulated HR, SpO2, temperature, with a rolling chart

**Right Column:**
- **Companion chat**: Scrollable message thread with speak-back controls
- **Input area**: Text input, mic button, send button, wake word support
- **Quick actions**: Breathing, calming audio, yoga flow, daily report, emergency, vitals (placeholder)

**Overlays:**
- Breathing, calming audio library, daily report, emergency protocol

### 5.2 Core JavaScript Logic (`frontend/js/app.js`)

The script is organized into these major sections:

#### State Variables
```javascript
const currentEmotion = { label: "neutral", confidence: null };
const identityState = { name: "Guest" };
let faceMatcher = null;                  // face-api.js FaceMatcher instance
let micActive = false;                   // Wake word state machine
```

#### Health Vitals Simulation
- Generates randomized but realistic values every ~2.5s
- Heart rate, SpO2, temperature in a constrained range
- Draws a real-time line graph on a `<canvas>` element tracking recent HR history

#### Face API Pipeline
1. **Model Loading**: Loads 4 models from local `/models` directory:
   - `tinyFaceDetector` — lightweight face detection
   - `faceLandmark68Net` — 68-point facial landmark detection
   - `faceRecognitionNet` — 128-dimension face descriptor
   - `faceExpressionNet` — 7-emotion expression classification
2. **Face Matcher Creation**: Uses locally enrolled face descriptors from `localStorage`.
3. **Detection Loop** (runs on a timer while the camera is live):
   - Detects single face with `TinyFaceDetectorOptions` (score threshold 0.3)
   - Extracts expressions → finds highest confidence emotion
   - Updates DOM emotion status display
   - Runs face recognition against matcher → identifies user or defaults to "Guest"

#### Chat System
- On form submit: sends user text to `/chat` with emotion, vitals, and user name
- Displays response as MAITRI message bubble
- Speaks response via TTS with a preferred voice
- Parses optional action tags (`[ACTION:breathing|music|yoga]`) to trigger overlays
- Falls back to keyword matching when no action tag is present

#### Voice System
- **Speech Recognition**: Continuous, with interim results, English-US
- **Wake Word**: "Hey MAITRI" activates the assistant
- **Flow**: Wake word detected → greeting spoken → next final transcript treated as command → sent to `/chat`
- **Mic Button**: Manual activation, bypasses wake word
- **Auto-restart**: Recognition restarts on end (unless network error)
- **TTS**: Uses `SpeechSynthesisUtterance`, prefers female voices

#### Hand Gesture Scroll Control
- Uses TensorFlow.js `MediaPipeHands` (lite model)
- Runs every 100ms on the main camera feed
- **Scroll Up**: Middle finger tip Y < wrist Y - 50px (hand pointing up)
- **Scroll Down**: Middle finger tip Y > wrist Y + 50px (hand pointing down)
- Uses `window.scrollBy()` with smooth behavior

#### Emergency Modal System
- Opens animated modal with siren ring animation
- Builds payload with current vitals from DOM, geolocation (with timeout), username
- Sends POST to `/api/emergency`
- Two-step confirm button prevents accidental triggers
- Siren beep audio via Web Audio API oscillator
- Keyboard accessible (Escape to close)

### 5.3 Yoga Trainer Page (`yoga.html`)

A dedicated page with pose cards and a guided session overlay:

- Select a pose to open a near full-screen camera stage.
- A guidance column walks through short checkpoints and a 10-second final hold.
- The camera feed is mirrored for intuitive alignment.

**Technical Flow:**
1. Page loads → initializes MoveNet SINGLEPOSE_LIGHTNING model
2. On pose card click → opens overlay + starts camera
3. Detection loop: `estimatePoses()` → `evaluatePose()` → checkpoint timer
4. Skeleton drawn as green/red dots based on pose confidence
5. Session logs `pose`, `duration`, and `score` to the backend

### 5.4 Project Details Page (`details.html`)

An interactive dashboard built with custom CSS + Chart.js:

- **Sticky sidebar navigation** for quick section jumps
- **Emotion history chart** sourced from `/history`
- **Recent reports list** sourced from `/reports`
- **Architecture overview** presented as a tech grid

---

## 6. Backend Deep Dive

### 6.1 Server Architecture (`server.js` — 292 lines)

Single-file Express server with:
- CORS origin configurable via `CORS_ORIGIN`
- JSON body parsing
- Rate limiting for chat and emergency routes
- Adaptive learning module
- Emergency alert system (Twilio, optional)

### 6.2 Database Connection

```javascript
const client = new MongoClient(process.env.MONGODB_URI);
// Database: maitri_db
// Collections: conversations, daily_reports, user_profiles, yoga_sessions, emergencies
```

Connects on server start. Exits process on connection failure.

### 6.3 Adaptive Learning Module

The `updateUserProfile()` function runs after each chat interaction:

1. **Trigger**: Called after saving AI response (non-blocking)
2. **Minimum Data**: Requires 10+ user messages to activate
3. **Analysis**:
   - **Communication Style**: Average word count per message → `concise` (< 8 words) or `detailed`
   - **Humor Preference**: Count of messages containing "joke" → `high` (> 1) or `low`
   - **Overall Mood**: Average sentiment score (using `sentiment` npm package) → `positive` (> 0.5) or `neutral`
4. **Storage**: Upserted into `user_profiles` collection keyed by `userName`
5. **Usage**: Profile instructions injected into the LLM system prompt

### 6.4 Chat Endpoint Flow (`POST /chat`)

```
Request Body: { message, emotion, userName, vitals, emotionHistory }
                    │
                    ▼
   1. Check for action tags (`[ACTION:breathing|music|yoga]`) and keyword fallbacks
                    │
                    ▼
    2. Save user message to MongoDB (conversations collection)
                    │
                    ▼
    3. Fetch user profile from user_profiles collection
                    │
                    ▼
    4. Fetch last 10 messages from conversations (for context)
                    │
                    ▼
   5. Build system prompt:
      "You are MAITRI, a warm, supportive AI companion.
      User: {userName}. Emotion: {emotion}.
      Communication style: {profile.communicationStyle}.
      Humor preference: {profile.humorPreference}.
      Keep responses concise."
                    │
                    ▼
    6. POST to OpenRouter API:
       Model: nvidia/nemotron-4-340b-instruct
       Messages: [system prompt, ...last 10 messages]
                    │
                    ▼
    7. Save AI response to MongoDB
                    │
                    ▼
   8. Return: { reply, userName, emotion, emotionConfidence, action }
                    │
                    ▼
    9. Async: updateUserProfile(userName)
```

### 6.5 Emergency System (`POST /api/emergency`)

**Payload:**
```json
{
   "vitals": { "hr": 72, "spo2": 97, "temp": 36.6 },
  "location": "12.3456,78.9123",
  "userName": "Vaibhav",
  "message": "Emergency triggered from MAITRI UI"
}
```

**Actions (all async, fire-and-forget):**
1. Save event to `emergencies` collection
2. Send SMS via Twilio with formatted vitals
3. Initiate voice call via Twilio with TwiML `<Say>` element (Alice voice, en-IN)
4. Return immediate success response to client

**SMS Format:**
```
🚨 MAITRI Emergency Alert 🚨
User: Vaibhav
Time: 2026-05-04T16:47:00.000Z
--- Vitals ---
HR: 72
SpO2: 97
Temp: 36.6
Location: 12.3456,78.9123
Note: Emergency triggered from MAITRI UI
```

---

## 7. AI & ML Models

### 7.1 face-api.js Models (Local, In-Browser)

| Model | File Size | Purpose |
|---|---|---|
| Tiny Face Detector | ~193 KB | Fast face bounding box detection |
| Face Landmark 68 | ~357 KB | 68-point facial landmark positions |
| Face Recognition | ~6.4 MB | 128-dimension face embedding vector |
| Face Expression | ~329 KB | 7-class emotion classification |

**Emotion Classes:** neutral, happy, sad, angry, fearful, disgusted, surprised

All models run on **WebGL backend** via TensorFlow.js. No data leaves the browser.

### 7.2 TensorFlow.js MoveNet (Pose Detection)

- **Model**: MoveNet SINGLEPOSE_LIGHTNING (fastest variant)
- **Runtime**: tfjs (WebGL backend)
- **Output**: 17 keypoints with (x, y, score) per person
- **Used for**: Yoga pose evaluation on `yoga.html`

### 7.3 TensorFlow.js MediaPipe Hands (Gesture Detection)

- **Model**: MediaPipeHands (lite)
- **Runtime**: tfjs
- **Output**: 21 hand keypoints per detected hand
- **Used for**: Scroll control via hand gestures on main page

### 7.4 NVIDIA Nemotron 4 340B Instruct (LLM)

- **Access**: Via OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
- **Model ID**: `nvidia/nemotron-4-340b-instruct`
- **Role**: Generates empathetic, context-aware conversational responses
- **System prompt** includes: user name, detected emotion, learned communication style, humor preference

---

## 8. Feature Modules

### 8.1 Breathing Exercise Module
- Full-screen overlay with animated pacer circle
- 4-phase cycle: Breathe In → Hold → Breathe Out → Hold
- Each phase: 4 seconds
- Pacer scales 1.0x → 1.8x via CSS `transform: scale()` with `transition: 4s ease-in-out`

### 8.2 Calming Audio Library
- Modal overlay with library cards (ASMR, white noise, nature, rain, offshore beach)
- Play/pause + volume control with now-playing status
- Audio cards default to `assets/ambient.mp3` until custom files are added
- Can be triggered by chat (user says "relax" or "music")

### 8.3 Daily Report Submission
- Modal with prompts, quick tags, and a character count
- Saves to `daily_reports` collection with timestamp
- Closes on successful submission

### 8.4 Emergency Alert System
- Animated siren modal (pulse ring animation, shaking icon)
- Web Audio API siren beep (oscillator 520-760 Hz chirp)
- Device vibration on mobile
- Geolocation collection (5s timeout, graceful fallback)
- Two-step confirm button before sending
- Sends SMS + voice call via Twilio

### 8.5 AI Yoga Trainer
- Separate page with pose selection cards
- Near full-screen camera stage with skeleton rendering
- Guidance column with checkpoints (1-2s holds) and a 10s final hold
- Mirrored camera feed for intuitive alignment
- Session data saved to `yoga_sessions` collection

---

## 9. API Reference

| Method | Endpoint | Request Body | Response | Purpose |
|---|---|---|---|---|
| `GET` | `/health` | — | `{ok}` | Health check |
| `GET` | `/history` | — | `{userName, items}` | Fetch chat history |
| `GET` | `/reports` | — | `{userName, items}` | Fetch daily reports |
| `POST` | `/chat` | `{message, emotion, userName, vitals, emotionHistory}` | `{reply, userName, emotion, emotionConfidence, action}` | Send message, get AI response |
| `POST` | `/report` | `{report, userName}` | `{ok, id}` | Submit daily report |
| `POST` | `/yoga` | `{pose, duration, score, userName}` | `{ok, id}` | Save yoga session |
| `POST` | `/api/emergency` | `{vitals, location, userName, message, emotion}` | `{ok, id}` | Trigger emergency SMS + call |

**Base URL:** `http://localhost:3000`

---

## 10. Database Schema

**Database:** `maitri_db` (MongoDB Atlas)

### conversations
```json
{ "role": "user|assistant", "content": "message text", "userName": "Guest", "emotion": "neutral", "emotionConfidence": 0.72, "timestamp": "ISODate" }
```

### daily_reports
```json
{ "report": "free text", "userName": "Guest", "timestamp": "ISODate" }
```

### user_profiles
```json
{
  "userName": "Vaibhav",
  "communicationStyle": "concise|detailed",
  "humorPreference": "high|low",
  "overallMood": "positive|neutral"
}
```

### yoga_sessions
```json
{ "pose": "mountain|tree|warrior2", "duration": 120, "score": 100, "userName": "Guest", "timestamp": "ISODate" }
```

### emergencies
```json
{
  "userName": "Vaibhav",
   "vitals": { "hr": 72, "spo2": 97, "temp": 36.6 },
  "location": "lat,lng",
  "message": "text",
  "timestamp": "ISODate"
}
```

---

## 11. Environment & Setup

### Prerequisites
- Node.js installed
- Google Chrome (for Web Speech API support)
- OpenRouter API key
- MongoDB Atlas cluster
- Twilio account (for emergency feature)

### Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | API key from openrouter.ai |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `OPENROUTER_MODEL` | Optional model override |
| `OPENROUTER_BASE_URL` | Optional OpenRouter base URL |
| `CORS_ORIGIN` | Optional CORS origin override |
| `TWILIO_ENABLED` | Toggle Twilio alerts (true/false) |
| `TWILIO_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM` | Twilio phone number (e.g., +1xxxxxxxxxx) |
| `EMERGENCY_TO` | Emergency contact phone (e.g., +91xxxxxxxxxx) |

### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/Vaibhavsolanki1/maitri.git
cd maitri

# 2. Install backend dependencies
cd backend
npm install

# 3. Create .env file in backend/ with all required variables

# 4. Start the backend server
# npm run dev uses nodemon
npm run dev
# Server runs at http://localhost:3000
```

---

## 12. Design System

### Color Palette (CSS Custom Properties)
```css
--bg: #f6efe8;
--bg-2: #f0e2d5;
--panel: #fff8f2;
--text: #2a1d18;
--accent: #e47f63;
```

### Typography
- Primary font: `Manrope` (sans-serif)
- Accent font: `Fraunces` (serif)

### UI Components
- **Panels**: Soft gradient surfaces with rounded corners + shadow
- **Chat bubbles**: System = muted green, User = warm accent
- **Buttons**: Accent primary + ghost secondary
- **Cards**: Lifted action cards with soft glow and hover lift

### Animations
- **Siren pulse**: `sirenBox` — expanding box-shadow that fades
- **Icon shake**: `shake` — ±6° rotation oscillation
- **Dot bounce**: `dotBounce` — Y-axis bounce with opacity change
- **Pacer breathing**: CSS scale transform 1.0 → 1.8 with 4s ease-in-out
- **Card hover lift**: subtle translateY and shadow increase

### Responsive Design
- Main layout: CSS grid with responsive stack at 1100px
- Yoga layout: camera + guide column; stacks on mobile
- Details page: CSS grid with sticky sidebar

---

## 13. Security Considerations

> [!WARNING]
> The current prototype has several security items to address before production:

| Area | Current State | Recommendation |
|---|---|---|
| Authentication | None — userName is self-reported | Implement JWT auth with login/register |
| Tier system | Client-spoofable via `x-user-tier` header | Move tier lookup to server-side DB |
| API Keys | Stored in `.env`, gitignored | Use a secrets manager in production |
| CORS | Configurable via `CORS_ORIGIN` (defaults to `*`) | Restrict to known frontend origin |
| CSRF | No protection | Add CSRF tokens for state-changing requests |
| MongoDB | Connection string in `.env` | Use IAM-based authentication |
| Twilio credentials | Plain text in `.env` | Rotate regularly, use encrypted storage |
| Input validation | ✅ Zod schemas on all routes | Already implemented |
| Rate limiting | Chat (10/day free) + emergency (3/min) | Add to report and yoga endpoints |
| HTTPS | Not configured | Required for camera/mic in production |

---

## 14. Known Limitations & Future Scope

### Current Limitations
1. **No user authentication**: Profiles are self-reported, no login system
2. **Tier is client-spoofable**: Pro features can be unlocked by modifying the request header
3. **Simulated vitals**: HR, SpO2, temperature are generated values (no hardware yet)
4. **No responsive design**: Two-column grid doesn't adapt to mobile screens
5. **Local face enrollment**: Profiles are stored in browser localStorage, not server-side
6. **Yoga evaluation is heuristic**: Pose checks are simplified joint angle comparisons
7. **Audio library placeholders**: All genre cards map to `assets/ambient.mp3`
8. **No automated tests**: Zero unit, integration, or E2E test coverage
9. **No request logging**: No Morgan/Pino for production observability
10. **Sentiment analysis is naive**: Word-based library fails on sarcasm and non-English

### Future Enhancements
1. **JWT authentication**: Secure login/register with server-side session management
2. **Real biometric integration**: Bluetooth BLE wearable sensors for HR, SpO2, temperature
3. **Responsive design**: Mobile-first CSS breakpoints for phone and tablet
4. **Testing infrastructure**: Jest/Vitest unit tests, Playwright E2E, CI/CD pipeline
5. **Offline LLM**: Local language model via ONNX/llama.cpp for zero-connectivity
6. **Advanced yoga**: Angle-based pose scoring with adaptive difficulty
7. **Multi-language**: Hindi, Spanish, and other language support
8. **Content expansion**: Real audio tracks, progressive meditation programs, journaling
9. **DevOps**: Docker Compose, structured logging, health checks, Kubernetes manifests
10. **Security hardening**: Helmet.js, CSRF tokens, mongo-sanitize, HTTPS enforcement

> For a detailed roadmap with phases and priorities, see [PROJECT_STATUS.md](PROJECT_STATUS.md).

---

*Documentation for MAITRI v2.1. Project by Vaibhav for ISRO Space Apps Challenge.*
