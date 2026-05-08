# MAITRI — Project Status, Future Scope & Pitch

> Current state of the project, what's working, what's not, where it's going, and how to pitch it.

---

## Current Status (v2.1)

### What's Working ✅

| Feature | Status | Notes |
|---|---|---|
| Real-time emotion detection | ✅ Working | face-api.js runs in-browser, detects 7 emotion categories |
| Face recognition | ✅ Working | On-device enrollment and matching via labeled descriptors |
| Conversational AI | ✅ Working | Streaming + fallback modes, context-aware with emotion/vitals |
| Voice interface (STT/TTS) | ✅ Working | Wake word "Hey MAITRI", auto-submit with silence debounce |
| Action confirmation UX | ✅ Working | AI-suggested actions require explicit consent (click or voice) |
| Guided breathing | ✅ Working | 4-phase visual cycle with animated circle |
| Calming audio library | ✅ Working | 5 genre cards with play/pause/volume |
| Yoga flow | ✅ Working | MoveNet pose detection, guided steps, mirrored camera feed |
| Meditation timer | ✅ Working | Preset durations, visual countdown, session logging |
| Emergency protocol | ✅ Working | Siren, vibration, Twilio SMS + voice call, geolocation, vitals snapshot |
| Emergency cancel | ✅ Working | Cancel stops siren, vibration, resets UI |
| Multi-profile management | ✅ Working | Add, switch, and log out from both header and settings |
| Custom layout editor | ✅ Working | Drag-and-drop panel reordering with localStorage persistence |
| Dashboard / analytics | ✅ Working | Chart.js emotion trends, journal, yoga log, weekly AI report |
| Dark/light theme | ✅ Working | Full CSS variable system with neural background color adaptation |
| PWA support | ✅ Working | Manifest, service worker, offline asset caching |
| Tier gating (Free/Pro) | ✅ Working | Feature flags, upgrade prompts, rate limiting |
| Hand gesture control | ✅ Working | MediaPipe Hands scroll detection (Pro feature) |
| Adaptive personality | ✅ Working | Sentiment-based profile adjusts LLM tone over time |
| Premium UI system | ✅ Working | Custom dropdowns, styled sliders, micro-animations |
| Input validation | ✅ Working | Zod schemas on all backend routes |

### What's Not Working / Incomplete ⚠️

| Issue | Severity | Details |
|---|---|---|
| No user authentication | High | Profiles are self-reported. Anyone can claim any userName. |
| Tier is client-spoofable | High | `x-user-tier` header is set by the client, not verified server-side |
| No responsive design | High | Two-column grid doesn't stack on mobile or tablet |
| Vitals are simulated | Medium | HR, SpO2, temperature are generated values — no real hardware |
| Single audio file | Medium | All 5 music genre cards play the same `ambient.mp3` |
| No automated tests | High | Zero unit, integration, or E2E tests |
| No request logging | Medium | No Morgan/Pino — zero visibility into production traffic |
| Camera progress bar glitch | Low | Uses `hidden` attribute in JS but `display:none` in HTML — conflict |
| No CSRF protection | Medium | CORS defaults to `*` wildcard |
| No accessibility audit | Medium | Missing ARIA labels, focus traps, skip-nav, contrast validation |

---

## Known Problems

### Critical
1. **Security: No authentication** — The `userName` field is trusted from the client. Any user can access any other user's chat history, reports, and profiles by sending a different name.
2. **Security: Tier spoofing** — The `x-user-tier: pro` header bypasses all rate limits and feature gates. Free users can trivially unlock Pro features.
3. **Security: No CSRF** — CORS is set to `*` by default, meaning any website can make API requests to the MAITRI backend.

### High Priority
4. **No mobile layout** — The main grid is `1.05fr 1fr` with no media queries. On screens below ~900px, content overflows or becomes unusable.
5. **No test coverage** — A single bug in chat.js, modals.js, or speech.js can break the entire experience with no safety net.
6. **Duplicate chat route logic** — The `/chat` and `/chat/stream` routes duplicate ~80 lines of identical code (system prompt construction, history fetch, DB writes).

### Medium Priority
7. **Service worker staleness** — `CACHE_NAME` is `"maitri-cache-v1"` and never changes. Users may see stale assets after updates.
8. **No error toasts** — errors use `alert()` and `confirm()` (native browser dialogs) instead of themed modals.
9. **Sentiment analysis is naive** — The `sentiment` npm package fails on sarcasm, non-English text, and contextual language.
10. **Rate limiter is IP-based** — Behind a reverse proxy, all users appear as one IP unless `trust proxy` is configured.

---

## Future Scope

### Phase 1: Security & Auth (Priority: Critical)
- JWT authentication with login/register
- Server-side tier verification (DB lookup, not client header)
- CORS restricted to actual frontend domain
- Helmet.js security headers
- MongoDB input sanitization (`mongo-sanitize`)
- HTTPS enforcement

### Phase 2: Testing Infrastructure
- Jest or Vitest for unit tests (validators, sentiment, LLM service)
- Supertest for API integration tests
- Playwright or Cypress for E2E tests (onboarding, chat, emergency flows)
- GitHub Actions CI pipeline

### Phase 3: Mobile & Responsive Design
- `@media (max-width: 768px)` — single column layout
- `@media (max-width: 480px)` — compact header, full-width panels
- Touch-optimized controls (larger tap targets)
- PWA "Add to Home Screen" prompt

### Phase 4: Real Hardware Integration
- Bluetooth BLE integration for wearable sensors (HR, SpO2)
- Temperature sensor via Web Bluetooth or companion app
- Replace simulated vitals with live sensor data
- Configurable alarm thresholds for abnormal readings

### Phase 5: Advanced AI
- Offline LLM (run a local model via ONNX or llama.cpp for zero-connectivity environments)
- Multi-language support (Hindi, Spanish, etc.)
- More sophisticated sentiment analysis (fine-tuned transformer)
- Emotion prediction (anticipate distress before it peaks)
- Conversation memory summarization (compress long histories)

### Phase 6: Content & Wellness
- Expand audio library with multiple real tracks per genre
- Advanced yoga poses with angle-based evaluation
- Progressive meditation programs (7-day, 21-day challenges)
- Journaling with mood tags and search
- Sleep tracking integration

### Phase 7: DevOps & Scale
- Docker Compose for local dev (app + MongoDB + Redis)
- Redis for rate limiting and session management
- Structured logging (Pino/Winston)
- APM integration (New Relic / Datadog)
- Kubernetes-ready deployment manifests

---

## Pitch Material

### One-Liner
> MAITRI is an AI companion that detects your emotions in real-time and provides personalized psychological support — designed for astronauts on long-duration space missions.

### Elevator Pitch (30 seconds)
Astronauts on long-duration missions face extreme isolation with limited access to ground-based psychologists. MAITRI solves this by running emotion detection AI directly in the browser — no video ever leaves the device. It detects when you're stressed, adapts its conversation tone, and offers guided breathing, calming music, yoga, and meditation. In emergencies, it can alert ground control with SMS, voice call, vitals, and location — all with one tap. It learns your communication style over time and gets better at supporting you.

### Problem Statement
Long-duration space missions (Mars transit: 6-9 months, ISS rotations: 6-12 months) expose astronauts to extreme psychological stress from isolation, confinement, and limited communication. Current ground-based support has 4-24 minute communication delays. There is no real-time, always-available psychological support system.

### Solution
MAITRI provides:
1. **Real-time awareness** — Detects emotional state via facial expression analysis running locally in the browser
2. **Adaptive interaction** — Adjusts AI conversation tone based on detected emotion (calm for distress, grounding for anger, energetic for positivity)
3. **Actionable wellness** — Guided breathing, curated audio, yoga with AI pose coaching, meditation timer
4. **Emergency response** — One-tap SOS with automated SMS/voice to mission control including vitals and GPS
5. **Learning & adaptation** — Builds a personality profile over time, remembering communication preferences and mood patterns

### Key Differentiators

| Feature | MAITRI | Generic Chatbots | Telepsychology |
|---|---|---|---|
| Emotion detection | ✅ Real-time, on-device | ❌ None | ❌ Requires video call |
| Privacy | ✅ No data leaves device | ⚠️ Cloud processing | ⚠️ Video transmitted |
| Availability | ✅ 24/7, zero latency | ✅ 24/7 | ❌ Scheduled sessions |
| Offline capability | ✅ PWA + cached assets | ❌ Requires internet | ❌ Requires internet |
| Wellness tools | ✅ Breathing, music, yoga, meditation | ❌ Text only | ❌ Talk therapy only |
| Emergency protocol | ✅ Automated SMS/call + vitals | ❌ None | ❌ Manual escalation |
| Adaptive personality | ✅ Learns over time | ❌ Stateless | ✅ Human memory |

### Impact Metrics (Projected)
- **Response time:** < 2 seconds for AI reply (vs. 4-24 min ground communication delay)
- **Availability:** 24/7/365 (vs. scheduled 1-hour psych sessions per week)
- **Privacy:** Zero facial data transmitted (100% on-device processing)
- **Modalities:** 5 wellness interventions (breathing, audio, yoga, meditation, chat)
- **Alert speed:** < 5 seconds from trigger to SMS/voice reaching ground control

### Target Users
1. **Primary:** Astronauts on long-duration missions (ISS, Lunar Gateway, Mars transit)
2. **Secondary:** Submarine crews, Antarctic researchers, remote oil rig workers
3. **Tertiary:** Anyone in high-stress isolation — healthcare workers, military, solo travelers

### Demo Flow (5 minutes)
1. Open app → onboarding (name + tier selection) *[30s]*
2. Enable camera → show emotion detection in real-time *[30s]*
3. Chat with MAITRI: "I'm feeling overwhelmed" → show context-aware response *[45s]*
4. AI suggests breathing exercise → show confirmation chip → click Start → 4-phase cycle *[60s]*
5. Show Quick Actions: calming audio, yoga flow preview *[30s]*
6. Trigger emergency → show siren + vitals snapshot → Cancel → siren stops *[30s]*
7. Open dashboard → show emotion trend chart + journal *[30s]*
8. Open settings → show layout editor drag-and-drop *[30s]*
9. Voice demo: "Hey MAITRI, start a breathing exercise" → voice confirmation *[30s]*

### Technical Highlights for Judges
- **14 ES modules** powering a fully modular frontend — zero frameworks, zero build tools
- **Zod validation** on every API endpoint — production-grade input safety
- **SSE token streaming** — real-time AI responses, not batch
- **face-api.js** running 100% client-side — no server or cloud vision API
- **Web Audio API** siren oscillator — dynamically generated emergency audio
- **Adaptive LLM system prompt** — injects emotion, vitals, communication style, and conversation history

---

## Competitive Landscape

| Solution | Category | Key Weakness (vs MAITRI) |
|---|---|---|
| Woebot | CBT Chatbot | No emotion detection, no camera, no emergency protocol |
| Wysa | Mental health chatbot | Cloud-dependent, no real-time physiological awareness |
| Replika | Companion AI | Entertainment-focused, no wellness modules, no offline |
| Teletherapy (BetterHelp, etc.) | Remote therapy | Requires scheduling, requires internet, no real-time monitoring |
| NASA TESS (Toolbox for Emotion Systems in Space) | Research prototype | Not an interactive companion, data collection only |

---

*Document generated for MAITRI v2.1. Project by Vaibhav for ISRO Space Apps Challenge.*
