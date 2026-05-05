# MAITRI v2.0 — Product Requirements Document

> **M**ulti-modal **A**I **I**ntelligent **T**herapeutic **R**eal-time **I**nterface
>
> *From astronaut companion to universal emotion & health intelligence platform.*

---

## 1. Executive Summary

MAITRI began as a context-aware AI assistant for astronauts in isolated, high-stress environments, built for the ISRO Space Apps Challenge. The v1.0 prototype demonstrated a powerful core thesis: **real-time, privacy-first emotion detection combined with adaptive conversational AI creates measurably better mental health outcomes in isolated environments.**

**MAITRI v2.0** evolves this thesis into a **versatile, industry-agnostic SaaS platform** — an AI-driven emotion and health monitoring system that adapts to any environment where humans operate under stress, isolation, or elevated risk. The core engine remains the same; the deployment surface expands to serve healthcare, eldercare, remote workforce management, defense, disaster response, education, and beyond.

### Vision Statement

> *"Make emotional intelligence infrastructure as universal as internet connectivity — available to every human in every environment, starting with those who need it most."*

### One-Liner

**MAITRI is an AI platform that watches, listens, understands, and responds to human emotional and physical states in real-time — privately, adaptively, and across any industry.**

---

## 2. Problem Statement

### The Universal Problem

Mental health deterioration in isolated, high-stress, or resource-constrained environments is a **$300B+ global crisis** that cuts across industries:

| Environment | Scale of Problem |
|---|---|
| Space Missions | 100% of long-duration astronauts report psychological distress |
| Elderly Living Alone | 43% of seniors experience chronic loneliness (AARP, 2024) |
| Remote Workers | 67% report burnout; 52% feel isolated (Gallup, 2025) |
| Submarine / Naval Crews | 6-month deployments with zero natural light, extreme confinement |
| Disaster Relief Workers | PTSD rates of 15-30% among first responders |
| ICU / Isolated Patients | 80% of ICU patients experience delirium linked to isolation |
| Offshore Oil Rig Workers | 28-day rotations, 2x higher depression rates than onshore |
| Antarctic Research Stations | Winter-over syndrome affects 60%+ of personnel |
| Prison / Solitary Confinement | Documented psychological damage from prolonged isolation |
| Special Education | Students with autism/anxiety need continuous emotional monitoring |

### Why Existing Solutions Fail

1. **Reactive, not proactive** — Current tools (therapy apps, hotlines) wait for humans to ask for help
2. **No real-time awareness** — No system watches facial microexpressions, voice tone, and biometrics simultaneously
3. **Privacy-invasive** — Cloud-based emotion analysis sends intimate data to third-party servers
4. **One-size-fits-all** — No adaptation to individual communication style, humor, or mood patterns
5. **Siloed** — Mental health tools don't integrate with physical health monitoring
6. **Expensive** — Per-seat licensing of $200+/month makes it inaccessible to most organizations

### MAITRI's Thesis

> **Edge-first, multi-modal emotional intelligence that learns and adapts per-user — deployed wherever humans are at risk — changes outcomes.**

---

## 3. Target Market & Industry Verticals

### Primary Verticals (Year 1)

| Vertical | Target Customer | Deployment Model | Revenue Model |
|---|---|---|---|
| **🏥 Healthcare & Telehealth** | Hospitals, telehealth platforms, ICUs | Embedded SDK / White-label | Per-patient/month |
| **👴 Eldercare** | Assisted living facilities, home care agencies | Standalone tablet app | Per-resident/month |
| **🏢 Remote Workforce** | HR departments, remote-first companies | Browser extension + dashboard | Per-employee/month |
| **🚀 Aerospace & Defense** | Space agencies, military, submarines | On-premise / air-gapped | Enterprise license |

### Secondary Verticals (Year 2-3)

| Vertical | Target Customer | Unique Value |
|---|---|---|
| **🎓 Education** | Schools, universities, special education | Student distress early warning |
| **🏭 Industrial & Offshore** | Oil rigs, mining, manufacturing | Worker fatigue & safety monitoring |
| **🌊 Maritime** | Shipping companies, naval forces | Crew wellbeing on long voyages |
| **🏔️ Disaster Response** | FEMA, Red Cross, NGOs | First responder PTSD prevention |
| **🏠 Consumer / D2C** | Individuals, families | Personal mental wellness companion |

### Total Addressable Market (TAM)

| Segment | Market Size (2026 est.) |
|---|---|
| Digital Mental Health | $17.5B |
| Remote Patient Monitoring | $71.8B |
| Workplace Wellness | $66B |
| Eldercare Technology | $30B |
| **Combined TAM** | **$185B+** |

---

## 4. Product Architecture — Core Platform

### 4.1 The MAITRI Engine (Core — Shared Across All Verticals)

The platform is built on a **modular engine architecture** where the core AI capabilities are shared, and vertical-specific modules plug in.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MAITRI CORE ENGINE                             │
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  EMOTION ENGINE  │  │  IDENTITY ENGINE  │  │  ADAPTIVE LEARNING    │  │
│  │  ─────────────── │  │  ──────────────── │  │  ─────────────────── │  │
│  │  • Face Detection│  │  • Face Recogn.  │  │  • Sentiment History  │  │
│  │  • 7-Emotion     │  │  • Multi-User    │  │  • Comm. Style Learn  │  │
│  │  • Micro-express.│  │  • Role Mapping  │  │  • Mood Trending      │  │
│  │  • Voice Tone    │  │  • Auth Layer    │  │  • Personality Profile │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬────────────┘  │
│           │                    │                        │                │
│  ┌────────┴────────────────────┴────────────────────────┴────────────┐  │
│  │                    CONTEXT FUSION LAYER                            │  │
│  │  Combines emotion + identity + history + vitals into unified       │  │
│  │  context vector for every AI interaction                           │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              │                                          │
│  ┌───────────────────────────┴───────────────────────────────────────┐  │
│  │                    CONVERSATIONAL AI                               │  │
│  │  • LLM Integration (Nemotron / GPT / Llama / Local)               │  │
│  │  • System Prompt Builder (vertical-specific personas)              │  │
│  │  • Voice I/O (STT + TTS + Wake Word)                              │  │
│  │  • Multi-language Support                                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  VITALS ENGINE   │  │  ALERT ENGINE     │  │  ANALYTICS ENGINE    │  │
│  │  ─────────────── │  │  ──────────────── │  │  ─────────────────── │  │
│  │  • Wearable API  │  │  • Threshold Rules│  │  • Mood Heatmaps     │  │
│  │  • Simulated     │  │  • Twilio/Webhook │  │  • Trend Dashboards  │  │
│  │  • SpO2, HR, Temp│  │  • Escalation     │  │  • Export / Reports  │  │
│  │  • ECG Stream    │  │  • Geo-Location   │  │  • Predictive Models │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Vertical Modules (Plug-in Architecture)

Each industry deployment activates specific modules on top of the core engine:

| Module | Healthcare | Eldercare | Remote Work | Aerospace |
|---|---|---|---|---|
| Emotion Detection | ✅ | ✅ | ✅ | ✅ |
| Face Recognition | ✅ | ✅ | ❌ | ✅ |
| Voice Activation | ❌ | ✅ | ❌ | ✅ |
| Vitals Integration | ✅ Real | ✅ Real | ❌ | ✅ Real |
| Emergency Alerts | ✅ | ✅ | ❌ | ✅ |
| Yoga/Wellness | ❌ | ✅ | ✅ | ✅ |
| Breathing Exercises | ✅ | ✅ | ✅ | ✅ |
| Daily Reports | ✅ | ❌ | ✅ | ✅ |
| Hand Gestures | ❌ | ✅ | ❌ | ✅ |
| Supervisor Dashboard | ✅ | ✅ | ✅ | ✅ |
| Offline/Air-gapped Mode | ❌ | ❌ | ❌ | ✅ |

---

## 5. Feature Requirements — Detailed

### 5.1 Core Features (Must-Have — MVP)

#### F1: Real-Time Emotion Detection (Edge-First)

| Aspect | Requirement |
|---|---|
| **Processing** | All face analysis runs client-side (browser/edge device). Zero video sent to servers. |
| **Models** | face-api.js (TinyFaceDetector + Expression + Landmark + Recognition) |
| **Emotions** | 7-class: neutral, happy, sad, angry, fearful, disgusted, surprised |
| **Latency** | < 100ms per detection cycle |
| **Confidence** | Display % confidence for detected emotion |
| **Privacy** | No frames, no video, no facial data leaves the device. Only the emotion label + confidence score transmitted. |
| **Upgrade Path** | Support for custom emotion models (MediaPipe FaceMesh for micro-expressions) |

#### F2: Adaptive Conversational AI

| Aspect | Requirement |
|---|---|
| **LLM Backend** | Pluggable: NVIDIA Nemotron (default), OpenAI GPT, Meta Llama (local), Anthropic Claude |
| **Context Window** | Last 10 messages + emotion + user profile + vertical-specific persona |
| **System Prompt** | Dynamically built per-vertical (astronaut mentor, elderly companion, workplace coach, etc.) |
| **Adaptive Learning** | After 10+ interactions: learns communication style, humor preference, overall mood |
| **Action Triggers** | AI responses can trigger system actions (play music, start breathing, alert supervisor) |
| **Response Time** | < 3 seconds end-to-end (user message → AI response displayed) |

#### F3: Multi-Modal Voice Interface

| Aspect | Requirement |
|---|---|
| **STT** | Web Speech API (Chrome), Whisper API (fallback) |
| **TTS** | Web Speech Synthesis with voice preference selection |
| **Wake Word** | Configurable per deployment ("Hey MAITRI", "Hello Doctor", "Hey Companion") |
| **Hands-Free Mode** | Full conversation loop: wake word → listen → process → speak → wait |
| **Languages** | English (default), Hindi, Spanish, Japanese (Phase 2) |

#### F4: Identity & Multi-User Support

| Aspect | Requirement |
|---|---|
| **Face Enrollment** | Admin uploads reference photos per user; system generates labeled face descriptors |
| **Recognition** | Identify user from webcam in < 500ms with 0.6 distance threshold |
| **Multi-User** | Support 50+ enrolled faces per deployment |
| **Auth Layer** | JWT-based login + face-verified identity for sensitive actions |
| **Privacy** | Face descriptors (128-dim vectors) stored encrypted; raw photos deletable after enrollment |

#### F5: Health Vitals Monitoring

| Aspect | Requirement |
|---|---|
| **Simulated Mode** | Realistic randomized HR, SpO2, Temp, AQI for demo/development |
| **Real Mode** | API integrations: Fitbit, Apple HealthKit, Garmin, custom BLE sensors |
| **Visualization** | Real-time line graph (HR), gauge indicators (Temp, SpO2), trend charts |
| **Thresholds** | Configurable alert thresholds per vital per user |
| **Storage** | Time-series storage with 30-day retention (configurable) |

#### F6: Emergency Alert System

| Aspect | Requirement |
|---|---|
| **Channels** | SMS (Twilio), Voice Call (Twilio), Webhook (custom), Email |
| **Payload** | User ID, vitals snapshot, geolocation, emotion state, free-text message |
| **Confirmation** | Two-step confirm dialog to prevent accidental triggers |
| **Escalation** | Configurable escalation chain (user → supervisor → admin → external) |
| **Audit Log** | All emergency events stored with full payload + timestamps |

### 5.2 Wellness Features

#### F7: Guided Breathing Exercise

- 4-phase cycle: Breathe In (4s) → Hold (4s) → Breathe Out (4s) → Hold (4s)
- Animated pacer circle with smooth CSS scaling
- Configurable durations per phase
- Session tracking (duration, completion rate)

#### F8: Relaxation Music Player

- Curated audio library (ambient, nature sounds, binaural beats)
- Play/pause + volume control
- Can be triggered by AI ("I detect stress — would you like some calming music?")
- Timer-based auto-stop (15min, 30min, 1hr)

#### F9: AI Yoga & Movement Trainer

- TensorFlow.js MoveNet for real-time pose detection
- Skeleton overlay on camera feed
- Pose evaluation with keypoint-angle calculation
- Pose library: Mountain, Tree, Warrior II, Cat-Cow, Child's Pose
- Session logging with duration and pose accuracy scores
- Voice-guided instructions

#### F10: Hand Gesture Control

- MediaPipe Hands for gesture recognition
- Scroll up/down via hand pointing direction
- Pause/play media via open palm / closed fist
- Accessibility-first: enables device control without touch

### 5.3 Platform Features (Post-MVP)

#### F11: Supervisor / Admin Dashboard

| Feature | Description |
|---|---|
| **Team Overview** | Grid of all monitored users with real-time emotion indicators |
| **Mood Heatmap** | Calendar heatmap showing emotional trends per user |
| **Alert Feed** | Real-time feed of all triggered alerts and escalations |
| **Report Generator** | Weekly/monthly PDF reports per user or team |
| **Threshold Config** | Set custom alert thresholds per user |
| **Role-Based Access** | Admin, Supervisor, User roles with granular permissions |

#### F12: Offline / Air-Gapped Mode

| Feature | Description |
|---|---|
| **Local LLM** | Run Llama 3.1 8B or Phi-3 locally via Ollama |
| **Edge Storage** | SQLite/IndexedDB for local data persistence |
| **Sync** | Queue-based sync when connectivity restores |
| **Critical for** | Space missions, submarines, disaster zones |

#### F13: Analytics & Predictive Engine

| Feature | Description |
|---|---|
| **Mood Trends** | 7-day, 30-day, 90-day mood trend analysis |
| **Predictive Alerts** | ML model predicts emotional downturn 24-48hrs ahead |
| **Correlation** | Cross-reference mood with vitals, sleep, activity |
| **Exportable** | CSV, JSON, PDF export for clinical/research use |

#### F14: SDK & API for Third-Party Integration

| Feature | Description |
|---|---|
| **JavaScript SDK** | Embeddable emotion detection widget |
| **REST API** | Full API for chat, emotion, vitals, alerts |
| **Webhook Events** | Real-time event streaming (emotion change, alert trigger) |
| **White-Label** | Custom branding, persona, color scheme |

---

## 6. User Personas & Stories

### Persona 1: Astronaut (Original)

> **Name:** Commander Ananya  
> **Context:** 8-month mission aboard ISS  
> **Pain:** Complete isolation from family, sleep disruption, micromanagement stress  

**User Stories:**
- *"As an astronaut, I want MAITRI to detect when I'm stressed before I realize it, so I can take a break before it escalates."*
- *"As an astronaut, I want to have a hands-free conversation using voice, because I'm often working with my hands."*
- *"As an astronaut, I want an emergency button that instantly contacts ground control with my vitals."*

### Persona 2: Elderly Person Living Alone

> **Name:** Ramesh, 72  
> **Context:** Lives alone, children in different city, mild cognitive decline  
> **Pain:** Loneliness, forgetting medication, no one to talk to daily  

**User Stories:**
- *"As an elderly person, I want a friendly AI companion that greets me by name and asks how I'm feeling."*
- *"As an elderly person, I want the system to alert my children if I seem distressed for multiple days."*
- *"As an elderly person, I want guided yoga poses with real-time feedback so I can exercise safely."*

### Persona 3: Remote Worker

> **Name:** Priya, 28, Software Engineer  
> **Context:** Works from home, 10-hour days, no in-person team interaction  
> **Pain:** Burnout, isolation, difficulty separating work from life  

**User Stories:**
- *"As a remote worker, I want MAITRI to notice if I've been stressed for 3+ hours and suggest a break."*
- *"As a remote worker, I want a quick breathing exercise I can do between meetings."*
- *"As my HR manager, I want anonymized team wellness reports to identify burnout trends."*

### Persona 4: ICU Patient

> **Name:** Arjun, 45, post-surgery  
> **Context:** Isolated ICU room, no visitors allowed, connected to monitors  
> **Pain:** Anxiety, delirium risk, inability to communicate freely  

**User Stories:**
- *"As an ICU patient, I want to talk to an AI that understands I'm scared and speaks gently."*
- *"As a nurse, I want alerts if a patient's emotional state suddenly shifts to fearful or angry."*
- *"As a doctor, I want a dashboard showing emotional trends alongside vital signs."*

---

## 7. Technical Requirements

### 7.1 Performance

| Metric | Target |
|---|---|
| Emotion detection latency | < 100ms (client-side) |
| Chat response time (E2E) | < 3 seconds |
| Face recognition match time | < 500ms |
| Concurrent users per instance | 100+ |
| Uptime SLA | 99.9% (cloud), N/A (offline) |
| Frontend bundle size | < 5MB (excluding ML models) |
| ML model load time | < 4 seconds (first load, cached after) |

### 7.2 Security & Privacy

| Requirement | Implementation |
|---|---|
| Zero video upload | All face processing runs client-side on WebGL |
| Data encryption | AES-256 at rest, TLS 1.3 in transit |
| Auth | JWT + optional face-verified 2FA |
| CORS | Restricted to known frontend origins |
| API protection | Rate limiting (100 req/min), API key headers |
| Input validation | Zod/Joi schema validation on all endpoints |
| Secrets management | HashiCorp Vault / AWS Secrets Manager (production) |
| HIPAA compliance | Required for healthcare vertical (Phase 2) |
| GDPR compliance | Data deletion, consent management, audit trail |

### 7.3 Infrastructure

| Component | Development | Production |
|---|---|---|
| Frontend | VS Code Live Server | Vercel / Cloudflare Pages |
| Backend | Node.js local (port 3000) | Dockerized on AWS ECS / Railway |
| Database | MongoDB Atlas (free tier) | MongoDB Atlas (M10+) with backups |
| LLM | OpenRouter (free tier) | Self-hosted Ollama OR OpenRouter Pro |
| Alerts | Twilio (trial) | Twilio Production + Webhook fallback |
| Monitoring | Console logs | Datadog / Grafana + Sentry |
| CI/CD | Manual | GitHub Actions → Docker → ECS |

### 7.4 Browser & Device Support

| Platform | Support Level |
|---|---|
| Chrome 90+ | Full (primary) |
| Edge 90+ | Full |
| Firefox 90+ | Partial (no Web Speech STT) |
| Safari 15+ | Partial (limited TTS voices) |
| Mobile Chrome | Full (camera + mic) |
| Tablets | Full (touch + camera) |
| Kiosk / Embedded | Full (Electron wrapper) |

---

## 8. Monetization & Business Model

### Pricing Strategy

| Tier | Price | Features |
|---|---|---|
| **Community** | Free | 1 user, emotion detection, basic chat, no dashboard |
| **Professional** | $29/user/month | Multi-user, full wellness suite, daily reports, email alerts |
| **Enterprise** | $99/user/month | Admin dashboard, analytics, API access, Twilio alerts, custom persona |
| **Air-Gapped** | Custom | On-premise deployment, local LLM, dedicated support |

### Revenue Projections (Conservative)

| Year | Users | MRR | ARR |
|---|---|---|---|
| Year 1 | 500 | $15K | $180K |
| Year 2 | 5,000 | $150K | $1.8M |
| Year 3 | 25,000 | $750K | $9M |

---

## 9. Success Metrics & KPIs

### Product Metrics

| Metric | Target (6 months) |
|---|---|
| Daily Active Users (DAU) | 500+ |
| Avg. session duration | 8+ minutes |
| Emotion detection accuracy | > 85% |
| Chat engagement rate | > 70% of sessions include chat |
| Wellness module usage | > 40% of users use breathing/yoga weekly |
| Emergency alert response time | < 30 seconds (alert → notification delivered) |

### Business Metrics

| Metric | Target (Year 1) |
|---|---|
| Paying customers | 50+ organizations |
| Net Revenue Retention | > 110% |
| Customer Acquisition Cost | < $500 |
| Churn rate | < 5% monthly |
| NPS Score | > 50 |

### Technical Metrics

| Metric | Target |
|---|---|
| API uptime | 99.9% |
| P95 response latency | < 2 seconds |
| Error rate | < 0.5% |
| Security incidents | 0 |

---

## 10. Roadmap

### Phase 1: Foundation (Weeks 1-6) — MVP

- [ ] Refactor v1.0 codebase into modular architecture
- [ ] Implement multi-user face enrollment system
- [ ] Add JWT authentication layer
- [ ] Build configurable system prompt builder (vertical personas)
- [ ] Implement real wearable API integration (Fitbit SDK)
- [ ] Add input validation (Zod) on all endpoints
- [ ] Set up Docker containerization
- [ ] Deploy to cloud (Railway / AWS)

### Phase 2: Platform (Weeks 7-12)

- [ ] Build supervisor/admin dashboard (React or Next.js)
- [ ] Implement mood trend analytics with Chart.js / D3
- [ ] Add configurable alert thresholds and escalation chains
- [ ] Build webhook system for third-party integrations
- [ ] Expand yoga trainer to 10+ poses with angle-based evaluation
- [ ] Add multi-language support (Hindi, Spanish)
- [ ] Implement rate limiting and API key management

### Phase 3: Intelligence (Weeks 13-18)

- [ ] Train custom micro-expression detection model
- [ ] Build predictive mood deterioration model (time-series ML)
- [ ] Implement correlation engine (mood × vitals × activity)
- [ ] Add voice tone analysis (pitch, speed, volume as emotion signals)
- [ ] Build offline mode with local LLM (Ollama + Llama 3.1)
- [ ] Implement data export (CSV, PDF reports)

### Phase 4: Scale (Weeks 19-24)

- [ ] Launch JavaScript SDK for embedded deployments
- [ ] Build white-label configuration system
- [ ] Implement HIPAA compliance layer
- [ ] Add real-time WebSocket event streaming
- [ ] Build mobile-native wrappers (React Native / Capacitor)
- [ ] Launch public API with developer documentation
- [ ] Begin onboarding pilot customers in healthcare & eldercare

---

## 11. Competitive Landscape

| Competitor | Emotion Detection | Adaptive AI | Vitals Integration | Privacy-First | Price |
|---|---|---|---|---|---|
| **Woebot** | ❌ Text-only | ✅ CBT-based | ❌ | ✅ | $$$$ |
| **Wysa** | ❌ Text-only | ✅ | ❌ | ✅ | $$$ |
| **Affectiva / Smart Eye** | ✅ Cloud-based | ❌ | ❌ | ❌ Cloud | $$$$$ |
| **Companion MX** | ❌ Voice-only | ✅ | ❌ | ✅ | $$$ |
| **MAITRI v2.0** | ✅ **Edge-first** | ✅ **Per-user learning** | ✅ **Real + simulated** | ✅ **Zero video upload** | $-$$ |

### MAITRI's Unfair Advantages

1. **Edge-first emotion AI** — No other platform processes face + emotion + identity entirely in-browser
2. **Multi-modal fusion** — Face + voice + vitals + chat context in a single pipeline
3. **Adaptive personality** — The AI genuinely learns each user's communication style
4. **Vertical flexibility** — Same engine, different persona = different industry
5. **Cost structure** — Edge processing means minimal server costs for emotion AI

---

## 12. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Face-api.js accuracy insufficient for production | High | Medium | Migrate to MediaPipe FaceMesh; A/B test accuracy |
| Web Speech API browser lock-in (Chrome-only) | Medium | High | Whisper API fallback; build native wrappers |
| HIPAA/GDPR compliance complexity | High | High | Hire compliance consultant; use compliant infrastructure |
| LLM hallucination in sensitive contexts | Critical | Medium | Guardrail prompts; content filtering; human-in-loop for medical |
| User trust — "AI watching me" perception | High | High | Transparent privacy dashboard; client-side processing proof |
| Wearable API fragmentation | Medium | High | Abstract via HealthKit/Google Fit aggregation layer |

---

## 13. Team & Roles Required

| Role | Responsibility | Phase |
|---|---|---|
| **Founder / Product Lead** (Vaibhav) | Vision, architecture, core development | All |
| **Full-Stack Engineer** | Backend APIs, dashboard, database | Phase 1 |
| **ML Engineer** | Custom emotion models, predictive analytics | Phase 2-3 |
| **Frontend Engineer** | React dashboard, SDK, mobile wrappers | Phase 2 |
| **DevOps Engineer** | Docker, CI/CD, monitoring, compliance infra | Phase 2 |
| **Designer** | UI/UX for dashboard, branding, white-label system | Phase 2 |
| **Compliance Advisor** | HIPAA, GDPR, data privacy policies | Phase 3 |
| **Sales / BD** | Pilot customer acquisition, partnerships | Phase 3-4 |

---

## 14. Appendices

### A. Glossary

| Term | Definition |
|---|---|
| **Edge-first** | AI processing happens on the user's device, not in the cloud |
| **Context fusion** | Combining multiple data signals (emotion, identity, vitals, history) into one context |
| **Adaptive learning** | System learns individual user preferences over time from interaction patterns |
| **Vertical** | An industry-specific deployment configuration of the platform |
| **Air-gapped** | Network-isolated deployment (no internet connectivity) |

### B. References

- MAITRI v1.0 Complete Documentation (ISRO Space Apps Challenge)
- Affective Computing research (MIT Media Lab)
- face-api.js documentation (justadudewhohacks/face-api.js)
- TensorFlow.js MoveNet documentation
- OpenRouter API documentation
- Twilio Programmable Voice/SMS documentation

---

*Document Version: 2.0.0 | Author: Vaibhav | Last Updated: May 2026*
