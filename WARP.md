# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quickstart: Running the app

This is a static HTML/CSS/JS application. There is **no Node.js toolchain or build step**; everything runs directly in the browser.

From the project root (`newwwww - Copy/`):

- Run with Python (simple HTTP server):
  - `cd path/to/newwwww - Copy`
  - `python -m http.server 8000`
  - Open `http://localhost:8000/index.html` in a browser.
- Run with Node `http-server` (if installed globally):
  - `cd path/to/newwwww - Copy`
  - `http-server -p 8000`
  - Open `http://localhost:8000/index.html`.
- Or use VS Code Live Server on `index.html`.

There are **no configured linting or test commands** in this repo. Any testing is done manually in the browser or via ad-hoc scripts you add yourself.

## Important environment and configuration

- All configuration for AI features lives in `assets/config.js` via a global `CONFIG` object.
  - `CONFIG.GROQ_API_KEY` and `CONFIG.ELEVENLABS_AGENT_ID` are intentionally blank and are loaded from `localStorage` (`groq_api_key`, `elevenlabs_agent_id`) by `CONFIG.init()`. Do not hardcode real keys into the repo when editing this file.
  - AI requests are sent to `CONFIG.GROQ_API_URL` (Groq-compatible OpenAI Chat Completions endpoint) with model `llama-3.3-70b-versatile` and configurable temperature/max tokens.
- The app is PWA-enabled:
  - `manifest.json` defines app metadata/icons (note: currently contains unresolved Git conflict markers that should be resolved before further edits).
  - `sw.js` implements a simple cache-first service worker for HTML, CSS, JS shell files.
- Some core files (e.g. `README.md`, `admin.js`, `patient.js`, `manifest.json`) currently contain duplicated sections separated by Git conflict markers (`<<<<<<< HEAD` / `=======` / `>>>>>>>`). If you are editing these files, clean up the merge conflicts first rather than duplicating content further.

## High-level architecture

### Overall structure

This repo implements **SwasthyaBhandhu**, a multi-role healthcare management MVP with:

- One HTML + CSS + JS triplet per role:
  - `index.html` / `auth.css` / `auth.js` – authentication and registration.
  - `doctor.html` / `doctor.css` / `doctor.js` – doctor dashboard.
  - `patient.html` / `patient.css` / `patient.js` – patient dashboard.
  - `pharmacist.html` / `pharmacist.css` / `pharmacist.js` – pharmacist dashboard.
  - `admin.html` / `admin.css` / `admin.js` – admin dashboard.
- Shared assets in `assets/`:
  - `common.css` – global styling system.
  - `common.js` – data layer, auth utilities, UI helpers.
  - `video-consultation.js` – encapsulated video consultation module.
  - `system-features.js` – cross-cutting system-level features.
  - `config.js` – AI and external service configuration.

Everything runs in the browser; there is no backend. The app simulates a full platform using `localStorage` as the persistence layer.

### Data model and localStorage usage

`assets/common.js` defines the canonical storage schema via `StorageKeys`:

- `swasthya_users` – all user accounts (doctors, patients, pharmacists, admin).
- `swasthya_current_user` – currently logged-in user (password removed).
- `swasthya_appointments` – appointment records.
- `swasthya_messages` – (reserved) messaging data.
- `swasthya_prescriptions` – prescriptions.
- `swasthya_inventory` – pharmacist medicine inventory.
- `swasthya_consultations` – video consultation sessions.

Other features create additional keys directly (e.g. `swasthya_feedbacks`, `swasthya_health_reports`, `swasthya_symptom_checks`, `swasthya_documents`, `swasthya_orders`, `swasthya_sentiment_analyses`, `swasthya_safety_checks`, `swasthya_conversation_notes`). When making changes, **prefer using these existing keys** instead of inventing new ones for the same concepts.

On first load, `initializeDefaultData()` in `assets/common.js` seeds demo users and inventory if `swasthya_users`, `swasthya_appointments`, etc. are missing. Many sections of the app (appointments, prescriptions, orders) assume those defaults exist.

### Shared utilities (`assets/common.js`)

Key responsibilities:

- **Auth and user lifecycle**
  - `login(email, password)` – authenticates against `swasthya_users`, stores a sanitized `swasthya_current_user`.
  - `register(userData)` – adds a new user with role-prefixed ID (Dxxx / Pxxx / PHxxx / Axxx) and `active: true`.
  - `logout()` – clears `swasthya_current_user` and redirects to `index.html`.
  - `getCurrentUser()` and `requireAuth(allowedRoles)` – used by each dashboard to enforce role-based access.
- **UI infrastructure**
  - `initializeTabs(tabsContainerId)` – handles `.tab-header` / `.tab-content` switching for each role dashboard.
  - `openModal(modalId)` / `closeModal(modalId)` – shared modal management (clicking outside closes the modal).
- **Internationalization hook**
  - `initializeGoogleTranslate()` – injects Google Translate script and sets up the inline translation widget targeting `#google_translate_element` with a curated list of Indian languages.
- **Formatting helpers**
  - `formatDate`, `formatTime` (and additional helpers like `formatDateTime` in the role files) – shared date/time formatting.

When adding new role pages or major features, try to reuse these patterns (storage keys, auth, modals, tabs) instead of hand-rolling new ones.

### Role dashboards

All role-specific JS files follow a similar pattern:

1. Declare `currentUser` (and other role-specific globals).
2. On `DOMContentLoaded`, call `requireAuth([...roles])`, inject the user name into the header, initialize the tab system, and then call a set of `load*()` functions to populate each section.
3. Define event handlers (e.g. `saveProfile`, `scheduleAppointment`, `submitFeedback`) that read and write `localStorage` and update the DOM.

#### Doctor (`doctor.js`)

- Manages doctor profile, appointment scheduling/completion, patient list, consultation history, messaging, analytics.
- Integrates tightly with `VideoConsultation` for live/simulated calls:
  - Instantiates `new VideoConsultation({ mode: 'simulation' })`.
  - Uses `startConsultation`, `endConsultation`, `toggleMicrophone`, `toggleCamera`.
  - Reads consultation history via `VideoConsultation.getConsultationHistory(doctorId)`.
- Implements a **voice-to-summary** workflow:
  - Records audio via `MediaRecorder` and `getUserMedia`.
  - Currently simulates speech-to-text via a prompt (`processVoiceToSummary`) and calls Groq with a structured medical-summary prompt.

#### Patient (`patient.js`)

- Handles patient profile, AI features, appointments, prescriptions, documents, messaging, analytics.
- AI-heavy sections:
  - **AI Health Assistant & Report Generation** – calls Groq to produce structured HTML reports and persists them under `swasthya_health_reports`.
  - **AI Symptom Checker** – calls Groq with symptom details; on failure, falls back to rule-based recommendations.
  - **AI Prescription Safety Checker** – uses Groq to analyze drug interactions, allergies, dosage, etc., for a given prescription.
- Also manages:
  - Appointment booking with doctors (`swasthya_appointments`).
  - Feedback creation (`swasthya_feedbacks`).
  - Document upload metadata (`swasthya_documents`).
  - Simple doctor–patient messaging UI (demo only).

#### Pharmacist (`pharmacist.js`)

- Focuses on inventory CRUD, prescriptions, and orders:
  - Inventory: `swasthya_inventory` with stock/price/expiry, low-stock and expiry-status helpers.
  - Prescriptions: read-only view of `swasthya_prescriptions` with a “Fulfill Order” action (currently simulated).
  - Orders: maintains `swasthya_orders`, with demo seeding and helpers for creating and completing orders.
- Includes analytics (inventory/low-stock stats, order counts) and simple search over inventory.

#### Admin (`admin.js`)

- Central administrative operations:
  - User management: lists all users, filters by role/search, edit users, toggle active status (all backed by `swasthya_users`).
  - Activity log: constructs a synthetic “recent activity” feed from users and timestamps.
  - Platform statistics: aggregates counts across users, appointments, consultations.
  - Feedback analytics: computes average rating and distribution, renders bar-chart-style breakdown.
- **AI Sentiment Analysis**:
  - For individual feedback records from `swasthya_feedbacks`, constructs a prompt and calls Groq (`callGroqAPI`) to return a JSON sentiment payload.
  - Stores per-feedback analysis in `swasthya_sentiment_analyses` and surfaces a badge with sentiment/tone/urgency.

### System-level features (`assets/system-features.js`)

This file houses cross-cutting concepts that are used or referenced from multiple dashboards:

- `DigitalHealthID`
  - Generates a QR-encodeable digital health ID per patient with basic info and emergency contact.
  - Persists each health ID under a key `health_id_<userId>` and can render a placeholder QR to a `<canvas>`.
- `PWAManager`
  - Registers the service worker, surfaces an install button (`#pwa-install-btn`) from the `beforeinstallprompt` event, and manages a simple offline cache (`offline_cache` in localStorage).
- `EmergencyMode`
  - Renders a full-screen emergency panel showing critical patient info, a QR canvas, emergency contact numbers, and simulated actions for calling emergency services and sharing geolocation.
- `SecurePrescription`
  - Provides a tamper-resistance abstraction for prescriptions by generating a hash and “digital signature” fields over the prescription payload.

If you extend any of these system-level concerns, prefer adding methods/classes here rather than scattering similar logic into individual role files.

### Video consultation module (`assets/video-consultation.js`)

`VideoConsultation` encapsulates all video-call behavior:

- Supports two modes:
  - `simulation` (default) – uses webcam for local video and plays `assets/sample-consultation.mp4` or a placeholder for the remote participant.
  - `webrtc` – sets up an `RTCPeerConnection` with STUN servers and hooks for ICE candidates and signaling.
- Public API used by dashboards:
  - `initialize(localVideoId, remoteVideoId, statusId)` – binds DOM elements and sets initial status.
  - `startConsultation(consultationData)` / `endConsultation()` – lifecycle entrypoints; persist consultation metadata in `swasthya_consultations`.
  - `toggleMicrophone()` / `toggleCamera()` – control local tracks and return new state.
  - Static helpers like `getConsultationHistory(userId)` and `playRecordedConsultation(videoElementId, consultationId)` (consultation recording is simulated via the sample MP4).

Any future real WebRTC integration (with signaling server) should be wired into this module rather than spread through `doctor.js`/`patient.js`.

### PWA shell (`manifest.json`, `sw.js`)

- `manifest.json` defines name, icons, colors, and start URL. The README documents that it’s part of the PWA support.
- `sw.js` caches all HTML shell pages, common JS/CSS, and role-specific CSS for offline usage using a cache-first strategy with runtime caching/fallback to network and cleanup of old caches on `activate`.

## Important notes from README

The root `README.md` contains detailed product-level documentation. The most relevant points for agents working in this repo are:

- **Roles and demo credentials** (useful for testing flows manually):
  - Doctor: `doctor@test.com` / `doctor123`
  - Patient: `patient@test.com` / `patient123`
  - Pharmacist: `pharmacist@test.com` / `pharma123`
  - Admin: `admin@test.com` / `admin123`
- **Video consultation usage**:
  - Core implementation lives in `assets/video-consultation.js` and is wired from `doctor.js` and `patient.js`.
  - Simulation mode uses webcam + sample video file (`assets/sample-consultation.mp4`), with an optional WebRTC mode requiring an external signaling server.
- **Static MVP constraints**:
  - All persistence is in browser `localStorage`; there is no backend or real authentication.
  - Many code comments explicitly mark sections as “STATIC implementation using localStorage; replace with backend API calls in production.”

When proposing or implementing larger changes (e.g. adding a backend, replacing localStorage, or introducing a JS build system), keep this MVP positioning in mind and avoid breaking the simple static hosting model unless explicitly asked to.
