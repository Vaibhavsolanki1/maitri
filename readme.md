<p align="center">
  <h1 align="center">🧠 MAITRI v2.0</h1>
  <p align="center"><strong>Multi-modal AI Intelligent Therapeutic Real-time Interface</strong></p>
  <p align="center">AI-Driven Emotion & Health Monitoring Platform for Isolated Environments</p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#verticals">Industry Verticals</a> •
    <a href="#api">API Reference</a> •
    <a href="#roadmap">Roadmap</a>
  </p>
</p>

---

## What is MAITRI?

MAITRI is an **open-source, privacy-first AI platform** that monitors human emotions and health in real-time — designed for environments where people are isolated, stressed, or at risk. It combines **in-browser facial emotion detection**, **adaptive conversational AI**, **voice interaction**, **pose tracking**, and **health vitals monitoring** into a single, deployable system.

Originally built for **astronauts** (ISRO Space Apps Challenge), MAITRI v2.0 is architected to serve **any industry** — healthcare, eldercare, remote workforce, defense, disaster response, and more.

### Core Thesis

> **Edge-first, multi-modal emotional intelligence that learns and adapts per-user — deployed wherever humans are at risk.**

### Why MAITRI?

| Problem | MAITRI's Answer |
|---|---|
| Mental health tools are reactive | MAITRI proactively detects distress via facial expressions |
| Cloud AI raises privacy concerns | All face/emotion processing runs **in-browser** — zero video uploaded |
| One-size-fits-all responses | Adaptive learning builds a personality profile per user |
| No integration with physical health | Vitals monitoring (HR, SpO2, Temp) alongside emotional state |
| Expensive enterprise solutions | Open-source core with affordable SaaS tiers |

---

## Features

### 🎭 Real-Time Emotion Detection
- 7-class facial emotion classification (neutral, happy, sad, angry, fearful, disgusted, surprised)
- Runs entirely **client-side** via face-api.js on WebGL — no video leaves your device
- < 100ms detection latency per cycle
- Confidence percentage display

### 🧑 Face Recognition & Identity
- Personalized experience: recognizes enrolled users by face
- Labeled face descriptors with 0.6 distance threshold
- Automatic identity-aware greetings and context

### 💬 Context-Aware Conversational AI
- LLM-powered chat (NVIDIA Nemotron via OpenRouter)
- System prompt dynamically includes: user name, detected emotion, learned communication style
- Last 10 messages retained for conversational context
- Action triggers: AI can suggest/start music, breathing exercises, alerts

### 🎤 Voice Interface
- **Wake word activation**: "Hey MAITRI" for hands-free operation
- Speech-to-Text (Web Speech API) → process → Text-to-Speech response
- Configurable voice preference (female voice default)
- Manual mic button for instant activation

### 🧘 AI Yoga Trainer
- TensorFlow.js MoveNet for real-time pose detection
- Skeleton overlay on camera feed with keypoint visualization
- Pose evaluation: Mountain, Tree, Warrior II
- Session logging with duration tracking

### 🖐️ Hand Gesture Control
- MediaPipe Hands for gesture recognition
- Scroll up/down via hand pointing direction
- Accessibility-first: no-touch device interaction

### 🫀 Health Vitals Monitoring
- Real-time heart rate, body temperature, AQI display
- Live canvas graph tracking HR history (50-point rolling window)
- Simulated mode for demo; real wearable API integration planned

### 🫁 Guided Breathing Exercise
- 4-phase breathing cycle (Breathe In → Hold → Breathe Out → Hold)
- Animated pacer circle with smooth CSS scaling
- Each phase: 4 seconds

### 🎵 Relaxation Music Player
- Full-screen player with play/pause and volume control
- Can be triggered by AI conversationally ("play some calming music")

### 🚨 Emergency Alert System
- Two-step confirmation to prevent accidental triggers
- Sends SMS + Voice Call via Twilio to configured emergency contact
- Payload includes: vitals snapshot, geolocation, user identity, free-text message
- Siren audio feedback via Web Audio API
- Full audit trail stored in database

### 📊 Interactive Dashboard (Details Page)
- Mission briefing-style project overview
- Clickable architecture flow diagram
- Live emotion simulation chart (auto-updating)
- Latency comparison and market distribution charts
- Full tech stack grid

---

## Architecture

```
  BROWSER (Edge AI)                         SERVER (Node.js)
 ┌────────────────────┐                  ┌─────────────────────┐
 │ Webcam → face-api  │                  │ Express.js API      │
 │   → Emotion + ID   │  JSON payload   │   → Prompt Builder  │
 │ Mic → Web Speech   │ ──────────────► │   → OpenRouter LLM  │
 │ TF.js → Pose/Hand  │                  │   → MongoDB Atlas   │
 │ Vitals → Canvas    │ ◄────────────── │   → Twilio Alerts   │
 │                    │  AI response     │   → Adaptive Learn  │
 └────────────────────┘                  └─────────────────────┘
```

**Key principle:** No video, audio, or facial images ever leave the browser. Only processed labels (emotion name, confidence score, user identity) are transmitted.

> 📄 See [architecture.md](./architecture.md) for full technical architecture.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 + Vanilla JavaScript | Core application (3 pages) |
| CSS3 (Custom Properties) | Dark theme design system |
| Tailwind CSS (CDN) | Details/report page styling |
| face-api.js v0.22.2 | In-browser face detection + emotion + recognition |
| TensorFlow.js | MoveNet (pose) + MediaPipe Hands (gestures) |
| Web Speech API | Speech recognition + synthesis |
| Chart.js | Data visualization on dashboard |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js v5 | HTTP server and routing |
| MongoDB (native driver) v6 | Database client |
| Axios | HTTP client for LLM API |
| Sentiment v5 | NLP sentiment analysis |
| Twilio v5 | SMS + Voice emergency alerts |
| dotenv | Environment configuration |

### External Services
| Service | Purpose |
|---|---|
| OpenRouter API | Gateway to NVIDIA Nemotron 9B LLM |
| MongoDB Atlas | Cloud NoSQL database |
| Twilio | Programmable SMS + Voice |

---

## Quick Start

### Prerequisites

- **Node.js** v18+ installed
- **Google Chrome** (for Web Speech API)
- **OpenRouter** API key ([get one free](https://openrouter.ai))
- **MongoDB Atlas** cluster ([free tier](https://www.mongodb.com/atlas))
- **Twilio** account (optional, for emergency alerts)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Vaibhavsolanki1/MAITRI.git
cd MAITRI

# 2. Install backend dependencies
cd Backend
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# 4. Start the backend server
node server.js
# ✅ Server runs at http://localhost:3000

# 5. Open frontend (in a new terminal)
# Use VS Code "Live Server" extension on Frontend/index.html
# OR any static file server on the Frontend/ directory
```

### Environment Variables

Create `Backend/.env` with:

```env
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maitri_db

# Optional (for emergency alerts)
TWILIO_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxx
TWILIO_FROM=+1xxxxxxxxxx
EMERGENCY_TO=+91xxxxxxxxxx
```

---

## Project Structure

```
MAITRI/
├── Backend/
│   ├── .env                    # API keys (gitignored)
│   ├── package.json            # Dependencies
│   └── server.js               # Express server (all API logic)
│
├── Frontend/
│   ├── index.html              # Main dashboard
│   ├── script.js               # Core frontend logic (~820 lines)
│   ├── style.css               # Design system (dark theme)
│   ├── details.html            # Interactive project report
│   ├── yoga.html               # Dedicated yoga trainer page
│   ├── models/                 # face-api.js pre-trained weights
│   │   ├── tiny_face_detector_model-*
│   │   ├── face_landmark_68_model-*
│   │   ├── face_recognition_model-*
│   │   └── face_expression_model-*
│   ├── astro1.jpg              # Reference face for recognition
│   ├── astronaut-reply.mp4     # Avatar video during speech
│   └── relaxing-music.mp3      # Ambient audio for relaxation
│
├── prd.md                      # Product Requirements Document
├── architecture.md             # System Architecture
├── summary.md                  # AI Handover Summary
└── readme.md                   # This file
```

---

## API Reference

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| `GET` | `/history` | — | `[{role, content, timestamp}]` |
| `GET` | `/reports` | — | `[{report, timestamp}]` |
| `POST` | `/chat` | `{message, emotion, userName}` | `{reply, action}` |
| `POST` | `/report` | `{report}` | `{message}` |
| `POST` | `/yoga` | `{pose, duration}` | `{message}` |
| `POST` | `/api/emergency` | `{vitals, location, userName, message}` | `{success, message}` |

**Base URL:** `http://localhost:3000`

> 📄 See [architecture.md](./architecture.md) for full API docs including v2 endpoints.

---

## Industry Verticals

MAITRI's modular engine adapts to multiple industries by swapping the AI persona and activating vertical-specific modules:

| Vertical | Use Case | AI Persona |
|---|---|---|
| 🚀 **Aerospace** | Astronaut companion on long-duration missions | Empathetic space psychologist |
| 🏥 **Healthcare** | ICU patient monitoring, telehealth support | Gentle clinical companion |
| 👴 **Eldercare** | Companion for seniors living alone | Warm, patient family-like friend |
| 🏢 **Remote Work** | Employee wellness & burnout prevention | Professional wellness coach |
| 🎓 **Education** | Student distress early warning | Supportive academic mentor |
| 🏭 **Industrial** | Worker fatigue monitoring on oil rigs/mines | Safety-focused supervisor |
| 🌊 **Maritime** | Crew wellbeing on long voyages | Shipboard counselor |
| 🏔️ **Disaster Response** | First responder PTSD prevention | Crisis support specialist |

> 📄 See [prd.md](./prd.md) for detailed market analysis and vertical feature matrix.

---

## Database Schema

**Database:** `maitri_db` (MongoDB Atlas)

| Collection | Key Fields | Purpose |
|---|---|---|
| `conversations` | role, content, timestamp | Chat message history |
| `daily_reports` | report, timestamp | User daily logs |
| `user_profiles` | userName, communicationStyle, humorPreference, overallMood | Learned preferences |
| `yoga_sessions` | pose, duration, timestamp | Yoga session logs |
| `emergencies` | userName, vitals, location, message, timestamp | Emergency audit trail |

---

## Roadmap

| Phase | Timeline | Focus |
|---|---|---|
| ✅ **v1.0** | Completed | Astronaut prototype (ISRO Challenge) |
| 🔄 **v2.0 Phase 1** | Weeks 1-6 | Modular architecture, multi-user, JWT auth, Docker |
| ⏳ **v2.0 Phase 2** | Weeks 7-12 | Admin dashboard, analytics, webhooks, multi-language |
| ⏳ **v2.0 Phase 3** | Weeks 13-18 | Custom ML models, predictive alerts, offline mode |
| ⏳ **v2.0 Phase 4** | Weeks 19-24 | SDK, white-label, HIPAA compliance, mobile apps |

> 📄 See [prd.md](./prd.md) for detailed roadmap with task breakdowns.

---

## Security & Privacy

| Principle | Implementation |
|---|---|
| **Zero Video Upload** | All face/emotion AI runs in-browser via WebGL |
| **Data Minimalism** | Only emotion labels + text transmitted — never raw media |
| **Encryption** | TLS 1.3 in transit; AES-256 at rest (production) |
| **Authentication** | JWT tokens (v2); face-verified 2FA planned |
| **Input Validation** | Zod schema validation on all endpoints (v2) |
| **Rate Limiting** | express-rate-limit on all routes (v2) |

---

## Contributing

MAITRI is open to contributions. To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to your fork (`git push origin feature/your-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and commenting patterns
- All new endpoints must include input validation
- Update documentation for any API changes
- Test with Chrome (primary supported browser)

---

## Known Limitations (v1.0)

1. **Simulated vitals** — HR, temperature, AQI are randomly generated (not from real sensors)
2. **Single-user recognition** — Only one reference face configured
3. **Incomplete yoga evaluation** — Only Mountain Pose has keypoint-based detection
4. **No authentication** — Single-user prototype without login
5. **Chrome-dependent** — Web Speech API requires Chrome
6. **Large media files** — relaxing-music.mp3 (178 MB) in repository

> All of these are addressed in the v2.0 roadmap.

---

## License

This project is open-source. See [LICENSE](./LICENSE) for details.

---

## Author

**Vaibhav** — Full-Stack Developer & AI Engineer

- Originally developed for the **ISRO Space Apps Challenge**
- Evolving into a versatile startup platform for emotion & health AI

---

<p align="center">
  <strong>Built with ❤️ for human wellbeing in every environment.</strong>
</p>
