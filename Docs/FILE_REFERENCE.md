# MAITRI — File Reference Guide

> Every file in the codebase explained: what it does, how it works, and what it connects to.

---

## Root Directory

### `readme.md`
The project's main README. Contains feature overview, tech stack, quick-start guide, environment variable reference, project structure, and API table.

### `Dockerfile`
Container definition for deploying MAITRI. Copies the backend, installs dependencies, and starts the Express server which also serves the frontend as static files.

### `test_verification.js`
A manual verification script that checks key endpoints (health, chat, history) and validates the backend is responding correctly. Not an automated test suite — it's a one-time sanity check.

### `.gitignore`
Excludes `node_modules`, `.env`, and other non-tracked files from Git.

---

## `backend/`

### `server.js`
**The application entry point.** Bootstraps Express, connects to MongoDB, registers all route modules, sets up the global error handler, and starts listening on the configured port. Also serves the entire `frontend/` directory as static files, so a single `npm run dev` command runs everything.

- Connects to MongoDB with the native driver
- Calls `createIndexes(db)` to ensure optimal query performance
- Registers route factories in order: health → chat → report → emergency → yoga → wellness
- Adds a catch-all `*all` route for SPA-style client-side routing
- Handles graceful shutdown on SIGINT/SIGTERM

### `config/index.js`
**Environment configuration module.** Loads `.env` via dotenv, parses and validates all config values.

- `parseBoolean()` — converts string "true"/"false" to boolean
- `parsePort()` — safely parses port number with fallback
- `parseCorsOrigin()` — supports wildcard, single origin, or comma-separated list
- `validateConfig()` — throws on missing required vars (MONGODB_URI, OPENROUTER_API_KEY), warns on missing Twilio vars when Twilio is enabled

### `db/indexes.js`
**MongoDB index setup.** Creates compound indexes on `{userName, timestamp}` for conversations, reports, emergencies, and yoga sessions. Creates a unique index on `{userName}` for user profiles. Called once on server startup.

### `middleware/asyncHandler.js`
**Async error wrapper.** Wraps Express route handlers so that any rejected promise is automatically forwarded to `next(err)` instead of crashing the process. Every route uses this.

### `middleware/errorHandler.js`
**Global error handler.** Catches any unhandled error, logs it, and returns a clean `500 Internal server error` JSON response. Prevents stack traces from leaking to the client.

### `middleware/rateLimiter.js`
**Rate limiting.** Exports two limiters:
- `chatRateLimit` — 10 messages per day for free users (Pro users are skipped)
- `emergencyRateLimit` — max 3 emergency requests per minute for all users

Uses `express-rate-limit` with standard headers.

### `middleware/tierGuard.js`
**Tier authorization.** Reads the `x-user-tier` header from the request, normalizes it, and attaches `req.tier` for downstream use.
- `attachTier(req, res, next)` — sets `req.tier` on every request
- `requireTier(...tiers)` — returns middleware that blocks requests from non-allowed tiers with a 403

### `models/validators.js`
**Input validation schemas (Zod).** Defines strict schemas for every API endpoint:
- `chatSchema` — message (1-2000 chars), userName, emotion, emotionConfidence (0-1), vitals ({hr, spo2, temp}), emotionHistory (array of strings)
- `reportSchema` — report text (1-600 chars), userName, tags
- `yogaSchema` — userName, pose, duration, score
- `emergencySchema` — userName, message, vitals (passthrough), location ({lat, lng}), emotion

All schemas use `safeParse()` — invalid input returns 400 with structured error details instead of crashing.

### `routes/chat.js`
**The core chat route.** Three endpoints:

1. **`POST /chat`** — synchronous chat. Fetches user profile + last 10 messages from DB, constructs a system prompt with emotion/vitals context, calls OpenRouter LLM, extracts any `[ACTION:...]` tag from the reply, saves both user and assistant messages to MongoDB, updates the user's sentiment profile asynchronously.

2. **`POST /chat/stream`** — streaming chat. Same logic as `/chat` but uses Server-Sent Events (SSE). Tokens are sent as `data: {"token": "..."}` events. When complete, sends `data: {"done": true, "action": "...", "fallback": false}`. Handles client disconnect gracefully.

3. **`GET /history`** — chat history. Returns past conversation messages for a user. Free users see only the last 3 days (max 100 messages). Pro users see all history (max 200 messages). Results are sorted chronologically.

`extractAction()` — parses the LLM reply for `[ACTION:breathing|music|yoga]` tags. If no explicit tag, it heuristically checks the user's message for keywords like "relax", "breathe", "yoga".

### `routes/emergency.js`
**Emergency alert endpoint.** `POST /api/emergency` — validates input, checks for a 60-second cooldown since the last emergency from the same user, logs the emergency to MongoDB, and fires off a Twilio SMS + voice call asynchronously (non-blocking — the response returns immediately).

### `routes/health.js`
**Health check.** `GET /health` — returns `{ ok: true }`. Used by the frontend's 30-second health poller to detect if the server is offline.

### `routes/report.js`
**Daily reports.** Two endpoints:
- `POST /report` — saves a daily wellness reflection with tags (e.g., "Grateful", "Stressed") to MongoDB
- `GET /reports` — retrieves past reports for a user

### `routes/wellness.js`
**Weekly wellness report.** `GET /api/weekly-report` — aggregates a user's recent conversations, reports, and yoga sessions, then calls the LLM to generate a structured wellness summary with highlights, concerns, and suggestions. Pro-only feature.

### `routes/yoga.js`
**Yoga session logging.** `POST /yoga` — logs a completed yoga pose session with pose name, duration, and alignment score.

### `services/llm.js`
**LLM client.** Two functions:

- `callOpenRouter({messages, config})` — synchronous call to OpenRouter's `/chat/completions` endpoint. Returns `{text, fallback}`. On failure, returns the fallback reply: *"I'm here with you. Can you tell me more about what's going on?"*

- `callOpenRouterStream({messages, config, onToken})` — streaming call. Parses SSE chunks, calls `onToken(delta)` for each token. Handles `[DONE]` terminator.

- `buildSystemPrompt()` — constructs the system prompt injecting user name, detected emotion, confidence, vitals, communication style, humor preference, overall mood, and emotion history. Uses `getToneGuidance()` to adjust tone based on emotion (calm for sad, grounding for angry, energetic for happy).

### `services/sentiment.js`
**User profiling via sentiment analysis.** After each chat message, analyzes the user's text using the `sentiment` npm package. Tracks running averages for message count, sentiment score, word count, and joke requests. Derives:
- `communicationStyle` — "concise" (avg < 8 words) or "detailed"
- `humorPreference` — "high" if 20%+ of messages request humor
- `overallMood` — "positive", "negative", or "neutral" based on average sentiment

These are injected into the LLM system prompt to personalize responses.

### `services/twilio.js`
**Emergency alerting.** Sends an SMS summary and a voice call via Twilio when an emergency is triggered. Uses `sanitizeVoiceText()` to strip special characters from TwiML content. Gracefully handles disabled/misconfigured Twilio.

### `services/weeklyReport.js`
**AI wellness report generator.** Collects conversation history, reports, and yoga sessions from the past 7 days, constructs a summarization prompt, and calls the LLM to produce a structured JSON report with mood trends, highlights, concerns, and actionable suggestions.

---

## `frontend/`

### `index.html`
**The main companion interface.** A two-column layout containing:
- **Left column:** Camera/Presence panel, Emotion State panel, Vitals panel
- **Right column:** Chat panel, Quick Actions panel

Also contains modal overlays for: breathing exercise, music player, daily report, emergency confirmation, upgrade prompt, and first-run onboarding. Each major section has a `data-panel="..."` attribute enabling the layout editor to reorder them.

### `settings.html`
**Settings page.** Contains cards for:
- **Profile** — switch user, add new profile, log out
- **Voice & Speech** — TTS enable/disable, voice selection
- **Tier Management** — switch between Free/Pro
- **Layout Editor** — drag-and-drop panel reordering for the main page
- **Privacy & Data** — clear face data, clear all local data

### `details.html`
**Dashboard / analytics page.** Displays wellness data visualizations:
- Emotion trend chart (Chart.js)
- Chat history list
- Daily report journal
- Yoga session log
- Weekly AI wellness report (Pro feature)

### `yoga.html`
**Yoga session page.** Split layout with a mirrored camera feed (for pose alignment) on the left and a step-by-step guide panel on the right. Uses TensorFlow.js MoveNet for real-time pose detection and joint angle scoring.

### `meditation.html`
**Meditation timer page.** Simple timer with preset durations (5, 10, 15, 20 minutes) and ambient background. Logs completed sessions to the backend.

### `manifest.json`
**PWA manifest.** Defines the app name, icons, theme color, and display mode for "Add to Home Screen" installation.

### `sw.js`
**Service worker.** Caches static assets on install, serves from cache on fetch (network-first with cache fallback), and cleans up old caches on activate. Excludes API endpoints from caching.

---

## `frontend/css/`

### `styles.css`
**The complete design system (~1950 lines).** Defines:
- **Theme variables** — light and dark mode via `body[data-theme="dark"]` selector with CSS custom properties for all colors, shadows, borders, and backgrounds
- **Typography** — Fraunces (serif headings) + Manrope (sans-serif body) from Google Fonts
- **Layout** — two-column CSS grid for the main page, flex columns for panels
- **Components** — panels, cards, buttons (primary/ghost), inputs, selects (custom SVG arrow), range sliders, chips, tags, badges, modals, breathing animation, music player, yoga session, typing indicator, onboarding, dashboard, settings cards, layout editor
- **Animations** — `fadeUp`, `floaty`, `pulse`, `sirenBox`, `shake`, `dotBounce`, `micPulse`, `blink`
- **Premium touches** — glassmorphism panels, accent glow on focus, micro-lift on hover, scale-down on `:active`, custom dropdown chevrons with dark mode inversion, styled range slider thumbs

---

## `frontend/js/`

### `app.js`
**Main application controller (~450 lines).** The orchestrator for the entire companion interface. On load:
1. Imports and initializes all modules (theme, tier, emotions, vitals, chat, camera, gestures, modals, speech, onboarding, notifications)
2. Wires up element references for 60+ DOM elements
3. Sets up `setPendingAction()` / `dismissPendingAction()` for voice action confirmation
4. Initializes profile management (switching, adding, logout)
5. Creates the chat controller with action handlers (breathing → modal, music → modal, yoga → navigation)
6. Creates the camera controller with emotion/face detection callbacks
7. Applies the custom layout order by moving panels between columns
8. Starts a 30-second health check poller
9. Registers the service worker

### `settings.js`
**Settings page controller.** Initializes theme, populates profile switcher from stored profiles, wires add/switch/logout actions, configures TTS and voice selection, manages tier switching, handles face/data clearing, and implements the layout editor with HTML5 drag-and-drop API.

### `details.js`
**Dashboard page controller.** Fetches chat history, reports, yoga sessions, and weekly reports from the API. Renders Chart.js emotion trend graphs, journal entries, session cards, and AI-generated weekly summaries. Theme-aware chart styling.

### `yoga.js`
**Yoga session controller.** Loads TensorFlow.js MoveNet model, manages webcam feed with mirrored canvas overlay, runs real-time pose detection, evaluates body joint angles against target poses, provides text/audio feedback, manages the session timer and guide steps, submits completed sessions to the backend.

### `meditation-page.js`
**Meditation page controller.** Simple timer with theme initialization. Links to the meditation module for session management.

### `flow-field-background.js`
**Animated neural background.** A canvas-based particle system that creates the flowing neural network effect visible behind all pages. Configurable particle count, speed, color, and trail opacity. Responds to theme changes via `setPalette()`.

---

## `frontend/js/modules/`

### `config.js`
**Central configuration module (~210 lines).** The single source of truth for all localStorage keys, API endpoints, user profiles, and settings.

Key exports:
- `ENDPOINTS` — all API URLs (chat, stream, history, report, emergency, health, yoga, wellness, weekly report)
- `getActiveUser()` / `setActiveUser()` — current user name
- `getProfiles()` / `addProfile()` — multi-profile management
- `logoutUser()` — clears active session and resets onboarding
- `getUserTier()` / `setUserTier()` / `getTierFeatures()` — tier management with feature flags (camera, voice, meditation, hand gesture, face recognition, notifications, weekly report)
- `getLayoutOrder()` / `setLayoutOrder()` — custom panel layout persistence
- `isTtsEnabled()` / `setTtsEnabled()` — TTS preference
- `getStoredVoice()` / `setStoredVoice()` — voice selection
- `buildJsonHeaders()` — constructs headers with `x-user-tier` for API requests
- `addSessionEntry()` — logs wellness sessions to localStorage

### `chat.js`
**Chat UI controller (~330 lines).** Manages the chat interface:
- `createMessageElement()` — builds message DOM elements (safe: uses `textContent`, not `innerHTML`)
- `createActionConfirmElement()` — renders the "MAITRI suggests: X" confirmation chip with Start/Dismiss buttons
- `sendMessage()` — sends a message to the streaming endpoint, renders tokens in real-time, detects actions, shows confirmation UI instead of executing immediately
- `loadChatHistory()` — fetches and renders past messages from the server

### `chatStream.js`
**SSE streaming client.** `streamChat()` — connects to the `/chat/stream` endpoint, parses `data:` events, calls `onToken()` for each received token, and calls `onDone()` when the `{done: true}` event arrives. Includes an error boundary for malformed chunks.

### `camera.js`
**Camera and face detection module (~430 lines).** The most complex frontend module:
- Loads face-api.js models (tiny face detector, landmarks, recognition, expressions)
- Manages camera permission and video stream
- Runs periodic face detection (every 500ms) to extract emotion labels and confidence
- Supports face enrollment — captures face descriptors and stores them in localStorage
- Implements face matching — compares detected faces against enrolled profiles using Euclidean distance
- Shows progress bar during model loading
- Handles camera errors, permission denials, and model loading failures

### `emotions.js`
**Emotion state management.** Manages the emotion display panel:
- Cycles through simulated emotions when no camera is active
- Accepts live emotion data from camera detection
- Tracks emotion history (last 10 emotions)
- Updates UI: label, confidence percentage, trend (improving/declining/steady), last-updated timestamp

### `gestures.js`
**Hand gesture detection.** Loads MediaPipe Hands on demand, processes video frames at 150ms intervals, detects hand landmarks, and maps index finger position relative to wrist to scroll up/down.

### `modals.js`
**Modal controller (~420 lines).** Manages all overlay experiences:
- **Breathing exercise** — 4-phase cycle (breathe in → hold → breathe out → hold) with CSS scale animation
- **Music player** — audio library with play/pause/volume, track selection, now-playing display
- **Daily report** — textarea with quick-tag buttons, character count, submission
- **Emergency** — vitals display, confirm/cancel, siren oscillator (Web Audio API square wave), vibration API
- `closeAllModals()` — master cleanup: stops breathing intervals, pauses audio, stops siren, cancels vibration, resets emergency button state
- `stopSiren()` — safely disconnects the Web Audio oscillator with try/catch

### `speech.js`
**Speech recognition and synthesis (~270 lines).**
- Initializes Web Speech API `SpeechRecognition` with continuous mode and interim results
- Detects wake word "Hey MAITRI" in transcripts
- Implements 1.5-second silence debounce for auto-submit
- **Voice action confirmation** — checks for pending actions and recognizes confirmation words (yes, sure, okay, go ahead, haan, chalo) and rejection words (no, cancel, skip, nevermind)
- Auto-restarts recognition on end (handles Chrome's 5-second silence timeout)
- Manages mic button active state with pulse animation
- `speakText()` — TTS with configurable voice selection

### `theme.js`
**Dark/light mode toggle.** Reads preference from localStorage, applies `data-theme="dark"` to body, toggles button text, and calls `updateNeuralBackground()` to adjust the particle colors.

### `tier.js`
**Client-side tier gating.** Manages the upgrade modal, tier badge display, and feature access control.
- `requireFeature(feature, onAllowed)` — checks if the current tier has access to a feature; if not, shows the upgrade modal
- `showUpgrade(feature)` — opens the upgrade modal with feature-specific messaging
- `updateTierBadge()` — updates the header badge text and styling

### `vitals.js`
**Simulated vitals module.** Generates realistic-looking vitals data (HR: 60-100, SpO2: 95-100, Temp: 36.1-37.2) with smooth variance. Updates UI labels and drives a Chart.js line chart with a rolling 60-second window. Returns current snapshot via `getVitalsSnapshot()`.

### `onboarding.js`
**First-run experience.** Multi-step onboarding flow:
1. Welcome screen
2. Name input
3. Tier selection (Free/Pro)
4. Camera permission request
5. Notifications permission request

Saves user name, tier, and onboarding completion flag to localStorage. Only shows once (checks `maitriOnboarded`). Logging out resets this flag.

### `meditation.js`
**Meditation timer module.** Configurable session durations, start/pause/reset controls, visual countdown, completion logging. Integrates with the backend to save meditation sessions.

### `notifications.js`
**Browser notifications.** Sends periodic check-in notifications (every 2 hours) when the user has granted permission and is on the Pro tier. Message adapts to the last detected emotion — suggests a breathing exercise if the user seems stressed.

---

*Reference generated from MAITRI v2.1 codebase. Project by Vaibhav for ISRO Space Apps Challenge.*
