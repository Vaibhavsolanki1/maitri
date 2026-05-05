# MAITRI v2.0 — System Architecture

> Technical architecture for the AI-driven emotion & health monitoring platform.

---

## 1. Architecture Overview

MAITRI v2.0 uses a **modular, edge-hybrid architecture** — heavy AI runs client-side for privacy, while orchestration, storage, and analytics run server-side.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Edge/Browser)                      │
│                                                                      │
│  ┌────────────┐ ┌──────────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Webcam     │ │ face-api.js  │ │ TF.js     │ │ Web Speech API │  │
│  │ + Mic      │ │ Emotion +    │ │ MoveNet + │ │ STT + TTS      │  │
│  │            │ │ Recognition  │ │ HandPose  │ │ + Wake Word    │  │
│  └─────┬──────┘ └──────┬───────┘ └─────┬─────┘ └───────┬────────┘  │
│        └───────────────┬┴──────────────┬┘               │           │
│                  ┌─────┴───────────────┴─────────────────┴─────┐    │
│                  │         CONTEXT FUSION MODULE                │    │
│                  │  Merges: emotion + identity + vitals + text  │    │
│                  └─────────────────────┬───────────────────────┘    │
│                                       │ JSON payload               │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │ HTTPS / WSS
┌───────────────────────────────────────┼─────────────────────────────┐
│                     SERVER LAYER (Node.js / Express)                 │
│                                       │                              │
│  ┌────────────┐  ┌───────────────┐  ┌─┴──────────┐  ┌───────────┐ │
│  │ Auth       │  │ Prompt        │  │ API Router  │  │ Alert     │ │
│  │ Middleware │  │ Builder       │  │ /chat       │  │ Engine    │ │
│  │ (JWT)      │  │ (Per-vertical)│  │ /report     │  │ (Twilio)  │ │
│  └────────────┘  └───────┬───────┘  │ /yoga       │  └───────────┘ │
│                          │          │ /emergency  │                  │
│                          │          │ /vitals     │                  │
│                          │          └──────┬──────┘                  │
│                  ┌───────┴─────────────────┴──────────┐             │
│                  │        ADAPTIVE LEARNING            │             │
│                  │  Sentiment analysis → user profile  │             │
│                  └─────────────────┬───────────────────┘             │
│                                   │                                  │
│          ┌────────────────────────┼────────────────────┐            │
│          │                        │                     │            │
│     ┌────┴────┐            ┌──────┴──────┐       ┌─────┴─────┐     │
│     │ MongoDB │            │ OpenRouter  │       │ Twilio    │     │
│     │ Atlas   │            │ / Ollama    │       │ SMS+Voice │     │
│     └─────────┘            └─────────────┘       └───────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

Current MVP endpoints: `/chat`, `/history`, `/reports`, `/report`, `/yoga`, `/api/emergency`, `/health`.
Auth, vitals ingestion, and analytics endpoints are planned for the roadmap.

---

## 2. Layer Breakdown

### 2.1 Client Layer (Edge AI)

All privacy-sensitive processing happens here. **No video or audio data ever leaves the device.**

| Component | Technology | Purpose |
|---|---|---|
| Face Detection | face-api.js (TinyFaceDetector) | Detect face bounding box at ~193KB model |
| Emotion Classification | face-api.js (FaceExpression) | 7-class emotion from facial expressions |
| Face Recognition | face-api.js (FaceRecognition) | 128-dim descriptor matching for identity |
| Pose Detection | TF.js MoveNet SINGLEPOSE_LIGHTNING | 17 keypoints for yoga pose evaluation |
| Hand Gestures | TF.js MediaPipe Hands (lite) | 21 keypoints for gesture-based scroll control |
| Speech-to-Text | Web Speech API | Voice input, wake word detection |
| Text-to-Speech | SpeechSynthesis API | Voice output with configurable voice |
| Vitals Display | Canvas API + DOM | Real-time graphs and gauge rendering |

**Data flow principle:** Only processed labels leave the client:
```
Client sends:  { emotion: "sad", confidence: 0.87, userName: "Ananya", message: "I feel alone" }
Client NEVER sends: video frames, audio buffers, face images
```

### 2.2 Context Fusion Module

The bridge between raw sensor data and meaningful AI context. Runs client-side.

```javascript
// Conceptual fusion output
{
  "message": "I can't sleep again",
  "emotion": "sad",
  "emotionConfidence": 0.87,
  "userName": "Ananya",
  "vitals": { "hr": 88, "temp": 37.1, "spo2": 96 },
  "sessionDuration": 1200,     // seconds since session start
  "recentEmotionTrend": ["neutral","neutral","sad","sad","sad"],
  "gestureState": "idle"
}
```

### 2.3 Server Layer (Node.js + Express)

Single Express server (upgradeable to microservices) handling:

| Service | Endpoint | Function |
|---|---|---|
| Chat | `POST /chat` | Enriched prompt → LLM → response + action triggers |
| History | `GET /history` | Paginated conversation history |
| Reports | `GET /reports`, `POST /report` | Daily report CRUD |
| Yoga | `POST /yoga` | Session logging |
| Emergency | `POST /api/emergency` | Twilio SMS + Voice + DB log |
| Health | `GET /health` | Health check for uptime monitoring |
| Profiles | — | Stored in `user_profiles` collection (no public endpoint yet) |

### 2.4 Prompt Builder System

Vertical-specific persona injection:

```javascript
// Aerospace persona
"You are MAITRI, a caring AI companion for astronauts on long-duration missions.
 You understand isolation, microgravity effects, and circadian disruption.
 User: ${userName}. Emotion: ${emotion}. Style: ${communicationStyle}."

// Eldercare persona
"You are MAITRI, a warm and patient companion for elderly individuals.
 Speak simply and kindly. Check on medication, meals, and sleep.
 User: ${userName}. Emotion: ${emotion}. Style: ${communicationStyle}."

// Workplace persona
"You are MAITRI, a supportive workplace wellness coach.
 Help with stress management, work-life balance, and productivity.
 User: ${userName}. Emotion: ${emotion}. Style: ${communicationStyle}."
```

### 2.5 Adaptive Learning Pipeline

```
User Message → Sentiment Analysis (npm:sentiment)
                    ↓
              Accumulate 10+ messages
                    ↓
        ┌───────────┼───────────────┐
        ↓           ↓               ↓
  Avg word count  Joke requests   Avg sentiment
   < 8 → concise  > 1 → high     > 0.5 → positive
   ≥ 8 → detailed ≤ 1 → low      ≤ 0.5 → neutral
        ↓           ↓               ↓
        └───────────┼───────────────┘
                    ↓
          Upsert user_profiles collection
                    ↓
          Inject into next system prompt
```

---

## 3. Database Architecture

### MongoDB Atlas — Collections

```
maitri_db/
├── conversations        # Chat history
│   { role, content, userName, emotion, timestamp }
│
├── daily_reports        # User-submitted daily logs
│   { report, userName, timestamp }
│
├── user_profiles        # Learned personality profiles
│   { userName, communicationStyle, humorPreference, overallMood, updatedAt }
│
├── yoga_sessions        # Yoga session logs
│   { userName, pose, duration, accuracy, timestamp }
│
├── emergencies          # Emergency event audit trail
│   { userName, vitals, location, message, channels, timestamp }
│
├── vitals_timeseries    # [v2] Time-series health data
│   { userName, hr, spo2, temp, source, timestamp }
│
├── face_enrollments     # [v2] Face descriptor storage
│   { userName, descriptors: [Float32Array], enrolledAt }
│
└── organizations        # [v2] Multi-tenant org config
    { orgId, name, vertical, config, createdAt }
```

### Indexing Strategy

```javascript
// Performance-critical indexes
conversations:    { timestamp: -1 }, { userName: 1, timestamp: -1 }
user_profiles:    { userName: 1 } (unique)
vitals_timeseries: { userName: 1, timestamp: -1 } (compound)
emergencies:      { timestamp: -1 }, { userName: 1 }
```

---

## 4. AI / ML Model Architecture

### 4.1 In-Browser Models (Edge)

| Model | Framework | Size | Latency | Purpose |
|---|---|---|---|---|
| TinyFaceDetector | face-api.js | 193 KB | ~15ms | Face bounding box |
| FaceLandmark68 | face-api.js | 357 KB | ~10ms | 68 facial landmarks |
| FaceRecognition | face-api.js | 6.4 MB | ~30ms | 128-dim face embedding |
| FaceExpression | face-api.js | 329 KB | ~8ms | 7-class emotion |
| MoveNet Lightning | TF.js | ~3 MB | ~20ms | 17 body keypoints |
| MediaPipe Hands | TF.js | ~2 MB | ~15ms | 21 hand keypoints |
| **Total edge payload** | | **~12 MB** | **~100ms** | |

### 4.2 Server-Side Models

| Model | Access | Purpose |
|---|---|---|
| NVIDIA Nemotron 9B | OpenRouter API (free) | Primary conversational AI |
| GPT-4o-mini | OpenRouter API (paid) | Fallback / premium tier |
| Llama 3.1 8B | Local via Ollama | Offline / air-gapped mode |
| Sentiment (npm) | Local library | User message sentiment scoring |

### 4.3 Future ML Pipeline (Phase 3)

```
                 Emotion History
                 Vitals History
                 Chat Sentiment    →  Feature Engineering  →  Time-Series Model
                 Session Duration                              (LSTM / Prophet)
                 Time of Day                                        ↓
                                                            Predictive Alert:
                                                          "Mood decline likely
                                                           in next 24-48 hrs"
```

---

## 5. Security Architecture

```
┌─────────────────────────────────────────────────┐
│                  CLIENT                          │
│  • All AI processing local (WebGL)               │
│  • No video/audio transmitted                    │
│  • JWT stored in httpOnly cookie                 │
│  • Face descriptors encrypted at rest            │
└───────────────────┬─────────────────────────────┘
                    │ TLS 1.3
┌───────────────────┴─────────────────────────────┐
│                  SERVER                          │
│  • JWT verification middleware                   │
│  • Zod input validation on all endpoints         │
│  • express-rate-limit (100 req/min/IP)           │
│  • CORS restricted to known origins              │
│  • Helmet.js security headers                    │
│  • API key for emergency endpoint                │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────┐
│              EXTERNAL SERVICES                   │
│  • MongoDB Atlas: IP whitelist + IAM auth        │
│  • OpenRouter: API key rotation schedule         │
│  • Twilio: Encrypted credentials, audit logging  │
└─────────────────────────────────────────────────┘
```

---

## 6. Deployment Architecture

### Development

```bash
# Frontend: VS Code Live Server on port 5500
# Backend: nodemon on port 3000
# DB: MongoDB Atlas free tier
# LLM: OpenRouter free tier
```

### Production (Target)

```
                    ┌──────────────────┐
                    │  Cloudflare CDN  │
                    │  (Static Assets) │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │  Load Balancer   │
                    │  (ALB / Nginx)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
        │ API Pod 1 │ │ API Pod 2 │ │ API Pod 3 │
        │ (Docker)  │ │ (Docker)  │ │ (Docker)  │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
        │ MongoDB   │ │ Redis     │ │ Ollama    │
        │ Atlas M10 │ │ (Sessions)│ │ (Local LLM│
        └───────────┘ └───────────┘ │  optional)│
                                     └───────────┘
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend/ ./backend/
COPY frontend/ ./frontend/
WORKDIR /usr/src/app/backend
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 7. Roadmap: API Architecture (v2 Expanded)

The endpoints below are planned for v2 and are not implemented in the current MVP.

### Authentication Flow

```
POST /auth/register  →  { email, password, orgId }  →  201 + JWT
POST /auth/login     →  { email, password }          →  200 + JWT
All other routes     →  Authorization: Bearer <JWT>
```

### Endpoint Summary

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | /auth/register | ❌ | email, password | JWT token |
| POST | /auth/login | ❌ | email, password | JWT token |
| POST | /chat | ✅ | message, emotion, userName | reply, action |
| GET | /history | ✅ | query: limit, offset | messages[] |
| POST | /report | ✅ | report | confirmation |
| GET | /reports | ✅ | — | reports[] |
| POST | /yoga | ✅ | pose, duration, accuracy | confirmation |
| POST | /api/emergency | ✅+API key | vitals, location, userName | success |
| POST | /vitals | ✅ | hr, spo2, temp, source | confirmation |
| GET | /vitals/:userId | ✅ | query: range | timeseries[] |
| GET | /profiles/:userId | ✅ | — | user profile |
| GET | /analytics/mood | ✅ Admin | query: userId, range | mood trends |

---

## 8. Offline / Air-Gapped Architecture

For environments without internet (space, submarines, disaster zones):

```
┌──────────────────────────────────────────────┐
│           SELF-CONTAINED UNIT                 │
│                                               │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Frontend  │  │ Express   │  │ Ollama    │ │
│  │ (Electron │  │ Server    │  │ Llama 3.1 │ │
│  │  wrapper) │  │           │  │ 8B local  │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│        └──────────────┬┴──────────────┘       │
│                 ┌─────┴──────┐                │
│                 │  SQLite /  │                │
│                 │ IndexedDB  │                │
│                 └────────────┘                │
│                                               │
│  When connectivity restored:                  │
│  Queue-based sync → MongoDB Atlas             │
└──────────────────────────────────────────────┘
```

---

## 9. Technology Stack Summary

| Layer | Current (v1) | Target (v2) |
|---|---|---|
| Frontend Framework | Vanilla JS + HTML | Vanilla JS → React (dashboard only) |
| Styling | Custom CSS + inline styles | Design system tokens + CSS modules |
| Backend | Express.js (single file) | Express.js (modular routes) |
| Database | MongoDB Atlas (5 collections) | MongoDB Atlas (8+ collections) + Redis |
| LLM | OpenRouter (Nemotron free) | OpenRouter + Ollama (offline) |
| Auth | None | JWT + face-verified 2FA |
| Alerts | Twilio (SMS + Voice) | Twilio + Webhooks + Email |
| Monitoring | console.log | Sentry + Datadog/Grafana |
| Deployment | Local only | Docker → AWS ECS / Railway |
| CI/CD | None | GitHub Actions |

---

## 10. Migration Path from v1 to v2

### Step 1: Modularize Backend
```
server.js (292 lines, monolith)
    ↓ Refactor into:
├── src/
│   ├── routes/chat.js
│   ├── routes/reports.js
│   ├── routes/yoga.js
│   ├── routes/emergency.js
│   ├── routes/auth.js        [NEW]
│   ├── routes/vitals.js      [NEW]
│   ├── middleware/auth.js     [NEW]
│   ├── middleware/validate.js [NEW]
│   ├── services/llm.js
│   ├── services/adaptive.js
│   ├── services/alerts.js
│   ├── services/prompts.js   [NEW]
│   ├── config/db.js
│   └── config/env.js
├── server.js (entry point only)
```

### Step 2: Modularize Frontend
```
js/app.js (monolith)
    ↓ Refactor into:
├── js/
│   ├── core/emotion-engine.js
│   ├── core/identity-engine.js
│   ├── core/voice-engine.js
│   ├── core/context-fusion.js
│   ├── modules/chat.js
│   ├── modules/breathing.js
│   ├── modules/relax.js
│   ├── modules/yoga.js
│   ├── modules/emergency.js
│   ├── modules/hand-gestures.js
│   ├── modules/vitals-display.js
│   └── app.js (orchestrator)
```

### Step 3: Add Missing Infrastructure
- JWT auth system
- Input validation (Zod schemas)
- Rate limiting
- CORS restrictions
- Docker containerization
- Health check endpoint
- Environment-based configuration

---

*Architecture Document v2.0 | Author: Vaibhav | Last Updated: May 2026*
