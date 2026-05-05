# MAITRI — Complete Project Documentation

> **M**ental health **A**I **I**nteractive **T**herapeutic **R**eal-time **I**nterface

A full-stack, context-aware AI assistant designed for astronaut psychological support in isolated, high-stress environments. Developed by **Vaibhav** for the **ISRO Space Apps Challenge**.

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
| Hand gesture control | TensorFlow.js HandPose model |
| Pose detection (Yoga) | TensorFlow.js MoveNet model |
| Emergency alerting | Twilio SMS + voice call to ground control |
| Adaptive learning | Sentiment analysis builds a per-user personality profile |

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
| Tailwind CSS (CDN) | Used only on `details.html` for the project report page |
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
| OpenRouter API | Gateway to NVIDIA Nemotron Nano 9B v2 (free tier) |
| MongoDB Atlas | Cloud-hosted NoSQL database |
| Twilio | Programmable SMS + Voice for emergency alerts |

---

## 4. Project File Structure

```
Project Isro/
├── Backend/
│   ├── .env                    # API keys & secrets (gitignored)
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Express server (292 lines, all backend logic)
│   └── node_modules/
│
├── Frontend/
│   ├── index.html              # Main dashboard (192 lines)
│   ├── script.js               # Core frontend logic (820 lines)
│   ├── style.css               # Design system & all styles (520 lines)
│   ├── details.html            # Interactive project report page (579 lines)
│   ├── yoga.html               # Dedicated AI yoga trainer page (415 lines)
│   ├── models/                 # face-api.js pre-trained model weights
│   │   ├── tiny_face_detector_model-*
│   │   ├── face_landmark_68_model-*
│   │   ├── face_recognition_model-*
│   │   └── face_expression_model-*
│   ├── astro1.jpg              # Reference face for recognition (labeled "Vaibhav")
│   ├── astro2-6.*              # Crew member avatar images
│   ├── astronaut.png           # UI asset
│   ├── astronaut-reply.mp4     # Video played during MAITRI speech
│   ├── isro.png                # ISRO logo
│   ├── maitri-logo.png         # MAITRI logo
│   ├── relaxing-music.mp3      # Audio for relaxation module (~178 MB)
│   ├── b.mp4, v.mp4            # Background/demo videos
│   └── WhatsApp Image *.jpeg   # Additional reference images
│
├── .gitignore
├── package.json                # Root-level deps (cors, express, twilio)
└── readme.md                   # Original project README
```

---

## 5. Frontend Deep Dive

### 5.1 Main Dashboard (`index.html`)

The main page is a **two-panel mission control dashboard**:

**Left Panel:**
- **Video Box**: Side-by-side webcam feed + astronaut reply video
- **Emotion Status Box**: Live display of detected emotion, confidence %, physical state
- **Vitals & Environment Box**: Simulated HR, body temp, AQI with a real-time canvas graph

**Right Panel:**
- **Chat Box**: Scrollable message thread (MAITRI vs astronaut bubbles)
- **Input Area**: Text input + mic button + send button
- **Quick Actions Bar**: Breathing, Relax, Sleep, Report, Yoga, Emergency, Project Details, Yoga Trainer

**Footer:**
- Crew member avatar bar (circular images with green accent border)

### 5.2 Core JavaScript Logic (`script.js`)

The script is organized into these major sections:

#### State Variables
```javascript
let currentDetectedEmotion = 'neutral';  // Updated every 500ms by face-api
let identifiedUserName = 'Crew Member';  // Updated by face recognition
let faceMatcher = null;                  // face-api.js FaceMatcher instance
let isMaitriActive = false;              // Wake word state machine
```

#### Health Vitals Simulation
- Generates randomized but realistic values every 500ms
- Heart rate: 68-78 BPM range
- Body temperature: 36.4-36.8°C range
- AQI: 42-48 (Good) range
- Draws a real-time line graph on a `<canvas>` element tracking heart rate history (last 50 data points)

#### Face API Pipeline
1. **Model Loading**: Loads 4 models from local `/models` directory:
   - `tinyFaceDetector` — lightweight face detection
   - `faceLandmark68Net` — 68-point facial landmark detection
   - `faceRecognitionNet` — 128-dimension face descriptor
   - `faceExpressionNet` — 7-emotion expression classification
2. **Face Matcher Creation**: Loads `astro1.jpg` as reference, creates a `LabeledFaceDescriptors` with label "Vaibhav", builds a `FaceMatcher` with 0.6 distance threshold.
3. **Detection Loop** (runs every 500ms on video play):
   - Detects single face with `TinyFaceDetectorOptions` (score threshold 0.3)
   - Extracts expressions → finds highest confidence emotion
   - Updates DOM emotion status display
   - Runs face recognition against matcher → identifies user or defaults to "Crew Member"

#### Chat System
- On form submit: sends user text to `/chat` endpoint with emotion + userName
- Displays response as MAITRI message bubble
- Speaks response via TTS with female voice preference (Zira/Samantha)
- During speech: plays `astronaut-reply.mp4` video overlay
- Detects action triggers in response (e.g., `start_relax_music`)

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
- Confirmation dialog prevents accidental triggers
- Siren beep audio using Web Audio API oscillator (620Hz, chirp pattern at 350ms interval)
- Keyboard accessible (Escape to close)

### 5.3 Yoga Trainer Page (`yoga.html`)

A dedicated page with three pose cards:

| Pose | Detection Logic |
|---|---|
| Mountain Pose (Tadasana) | Both wrists above nose → "Excellent! Hold the pose" |
| Tree Pose (Vrksasana) | Generic "Balance on one leg" instruction |
| Warrior II (Virabhadrasana II) | Generic "Pose detection active" |

**Technical Flow:**
1. Page loads → immediately initializes MoveNet SINGLEPOSE_LIGHTNING model
2. Buttons disabled until model loaded (with status indicator)
3. On pose card click → opens full-screen overlay with camera feed on canvas
4. Detection loop: `estimatePoses()` → `drawSkeleton()` → `evaluatePose()`
5. Skeleton drawn as green (#4af8a1) dots at each keypoint (score > 0.3)
6. Pose evaluation checks keypoint positions against rules

### 5.4 Project Details Page (`details.html`)

An interactive "Mission Briefing" dashboard built with Tailwind CSS + Chart.js:

- **Sidebar Navigation**: Scroll-spy highlights current section
- **Interactive Architecture Diagram**: Clickable flow nodes that reveal detailed descriptions
- **Live Emotion Simulation Chart**: Bar chart auto-updating every 2.5s with random dominant emotion
- **Latency Comparison Chart**: Horizontal bar showing MAITRI local (80ms) vs Cloud API (650ms)
- **Market Distribution Chart**: Doughnut chart (Aerospace 10%, Elderly Care 40%, Telehealth 30%, Remote Work 20%)
- **Tech Stack Grid**: 8 cards covering all technologies

---

## 6. Backend Deep Dive

### 6.1 Server Architecture (`server.js` — 292 lines)

Single-file Express server with:
- CORS enabled for all origins
- JSON body parsing
- 5 MongoDB collections
- 5 API endpoints
- Adaptive learning module
- Emergency alert system (Twilio)

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
Request Body: { message, emotion, userName }
                    │
                    ▼
    1. Check for action keywords (relax/music → start_relax_music)
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
       "You are MAITRI, a helpful AI assistant for astronauts.
        User: {userName}. Emotion: {emotion}.
        Communication style: {profile.communicationStyle}.
        Humor preference: {profile.humorPreference}.
        Keep responses concise."
                    │
                    ▼
    6. POST to OpenRouter API:
       Model: nvidia/nemotron-nano-9b-v2:free
       Messages: [system prompt, ...last 10 messages]
                    │
                    ▼
    7. Save AI response to MongoDB
                    │
                    ▼
    8. Return: { reply: "...", action: "start_relax_music" | null }
                    │
                    ▼
    9. Async: updateUserProfile(userName)
```

### 6.5 Emergency System (`POST /api/emergency`)

**Payload:**
```json
{
  "vitals": { "hr": "72 BPM", "temp": "36.6 °C", "aqi": "45 (Good)" },
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
HR: 72 BPM
Temp: 36.6 °C
AQI: 45 (Good)
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

### 7.4 NVIDIA Nemotron Nano 9B v2 (LLM)

- **Access**: Via OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
- **Model ID**: `nvidia/nemotron-nano-9b-v2:free`
- **Tier**: Free
- **Role**: Generates empathetic, context-aware conversational responses
- **System prompt** includes: user name, detected emotion, learned communication style, humor preference

---

## 8. Feature Modules

### 8.1 Breathing Exercise Module
- Full-screen overlay with animated pacer circle
- 4-phase cycle: Breathe In → Hold → Breathe Out → Hold
- Each phase: 4 seconds
- Pacer scales 1.0x → 1.8x via CSS `transform: scale()` with `transition: 4s ease-in-out`

### 8.2 Relaxation Music Player
- Full-screen overlay with play/pause + volume slider
- Audio source: `relaxing-music.mp3` (~178 MB, looped)
- Can be triggered by chat (user says "relax" or "music")

### 8.3 Daily Report Submission
- Modal with textarea for astronaut to log daily observations
- Saves to `daily_reports` collection with timestamp
- Auto-closes 2 seconds after successful submission

### 8.4 Emergency Alert System
- Animated siren modal (pulse ring animation, shaking icon)
- Web Audio API siren beep (oscillator 520-760 Hz chirp)
- Device vibration on mobile
- Geolocation collection (5s timeout, graceful fallback)
- `confirm()` dialog before sending
- Sends SMS + voice call via Twilio

### 8.5 AI Yoga Trainer
- Separate page with pose selection cards
- Full-screen camera overlay with skeleton rendering
- Real-time pose evaluation with color-coded feedback
- Session data saved to `yoga_sessions` collection

---

## 9. API Reference

| Method | Endpoint | Request Body | Response | Purpose |
|---|---|---|---|---|
| `GET` | `/history` | — | `[{role, content, timestamp}]` | Fetch all chat history |
| `GET` | `/reports` | — | `[{report, timestamp}]` | Fetch all daily reports (newest first) |
| `POST` | `/chat` | `{message, emotion, userName}` | `{reply, action}` | Send message, get AI response |
| `POST` | `/report` | `{report}` | `{message}` | Submit daily report |
| `POST` | `/yoga` | `{pose, duration}` | `{message}` | Save yoga session |
| `POST` | `/api/emergency` | `{vitals, location, userName, message}` | `{success, message}` | Trigger emergency SMS + call |

**Base URL:** `http://localhost:3000`

---

## 10. Database Schema

**Database:** `maitri_db` (MongoDB Atlas)

### conversations
```json
{ "role": "user|assistant", "content": "message text", "timestamp": "ISODate" }
```

### daily_reports
```json
{ "report": "free text", "timestamp": "ISODate" }
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
{ "pose": "mountain|tree|warrior", "duration": 120, "timestamp": "ISODate" }
```

### emergencies
```json
{
  "userName": "Vaibhav",
  "vitals": { "hr": "72 BPM", "temp": "36.6 °C", "aqi": "45 (Good)" },
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

### Environment Variables (`Backend/.env`)

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | API key from openrouter.ai |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `TWILIO_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM` | Twilio phone number (e.g., +1xxxxxxxxxx) |
| `EMERGENCY_TO` | Emergency contact phone (e.g., +91xxxxxxxxxx) |

### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/Vaibhavsolanki1/Isro-Bot.git
cd Isro-Bot

# 2. Install backend dependencies
cd Backend
npm install

# 3. Create .env file in Backend/ with all required variables

# 4. Start the backend server
node server.js
# Server runs at http://localhost:3000

# 5. Open Frontend/index.html with VS Code Live Server extension
# (Required for camera/mic permissions over localhost)
```

---

## 12. Design System

### Color Palette (CSS Custom Properties)
```css
--bg-dark-deep:  #0a0f1c   /* Deepest background */
--bg-dark-med:   #11182a   /* Card backgrounds */
--bg-dark-light: #1f2b45   /* Borders, secondary surfaces */
--accent-green:  #4af8a1   /* Primary accent, highlights, success */
--text-light:    #fff      /* Primary text */
--text-dark:     #000      /* Text on accent backgrounds */
```

### Typography
- Primary font: `Inter` (sans-serif)
- Details page: `Space Grotesk`

### UI Components
- **Glass panels**: `rgba(30,41,59,0.7)` + `backdrop-filter: blur(10px)` + subtle white border
- **Chat bubbles**: MAITRI = dark background (left-aligned), User = green accent (right-aligned)
- **Buttons**: Green accent background, dark text, bold, 8px border-radius
- **Mic button**: Red (#ff4757) when listening
- **Cards**: Dark medium background, dark-light borders, hover lift effect

### Animations
- **Siren pulse ring**: `pulseRing` — expanding box-shadow that fades
- **Icon shake**: `shake` — ±6° rotation oscillation
- **Dot bounce**: `dotBounce` — Y-axis bounce with opacity change
- **Pacer breathing**: CSS scale transform 1.0 → 1.8 with 4s ease-in-out
- **Flow node hover**: translateY(-5px) + blue box-shadow

### Responsive Design
- Main layout: flexbox two-column (left/right panels)
- Emergency modal: stacks vertically below 720px
- Details page: full responsive via Tailwind utilities

---

## 13. Security Considerations

> [!WARNING]
> The current prototype has several security items to address before production:

| Area | Current State | Recommendation |
|---|---|---|
| API Keys | Stored in `.env`, gitignored | Use a secrets manager in production |
| CORS | Open to all origins (`app.use(cors())`) | Restrict to specific frontend origin |
| Emergency endpoint | No authentication | Add API key header or JWT auth |
| MongoDB | Connection string in `.env` | Use IAM-based authentication |
| Twilio credentials | Plain text in `.env` | Rotate regularly, use encrypted storage |
| Input validation | Minimal | Add request body validation (Joi/Zod) |
| Rate limiting | None | Add express-rate-limit |
| HTTPS | Not configured | Required for camera/mic in production |

---

## 14. Known Limitations & Future Scope

### Current Limitations
1. **Simulated vitals**: Heart rate, temperature, and AQI are randomly generated (not from real sensors)
2. **Single-user face recognition**: Only one reference face ("Vaibhav") is configured
3. **Yoga pose evaluation**: Only Mountain Pose has real keypoint-based detection logic; Tree and Warrior are placeholder
4. **No user authentication**: No login system; single-user prototype
5. **Local-only frontend**: Must be served via Live Server (no production build/deployment)
6. **Large media files**: `relaxing-music.mp3` (178 MB) and videos in repo

### Future Enhancements
1. **Real biometric integration**: Connect to wearable sensors (heart rate monitors, SpO2)
2. **Multi-user support**: Registration, login, per-user face enrollment
3. **Advanced yoga poses**: Full pose matching with angle calculation for all poses
4. **Offline LLM**: Run a local language model for zero-connectivity environments (space)
5. **Dashboard analytics**: Historical charts of mood trends, conversation summaries
6. **WebRTC video calls**: Direct video communication with ground control
7. **PWA support**: Service worker for offline-capable features
8. **Deployment**: Docker containerization, HTTPS, proper CI/CD pipeline

---

*Documentation generated from full codebase analysis. Project by Vaibhav for ISRO Space Apps Challenge.*
