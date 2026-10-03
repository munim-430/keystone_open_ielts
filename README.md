# Keystone Open IELTS - Computer-Delivered Mock Test Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![AI Providers](https://img.shields.io/badge/AI-DeepSeek%20%7C%20Groq%20%7C%20OpenRouter%20%7C%20Offline-purple.svg)](https://deepseek.com)

A complete, production-ready, open-source Computer-Delivered (CD) IELTS Mock Test platform engineered specifically for computer labs and classroom environments. Tested and optimized to support **22 low-spec Windows Core i3 client PCs** connected over a Local Area Network (LAN) to a central Host/Admin PC with **zero audio lag**, **automated AI evaluation**, and **single-click batch printing**.

---

## 🌟 Key Features

### 1. Zero/Minimal Cost & Open Source Architecture
- **Pure Node.js Fullstack**: Zero heavy database setup required. Runs smoothly on any standard Windows PC.
- **Ultra-Lightweight Client Footprint**: Static caching and vanilla reactive frontend consumes **<35 MB RAM** per client tab on low-spec Core i3 terminals.
- **Multi-Provider AI Diagnostic Engine**:
  - **DeepSeek Official API**: Powers high-precision DeepSeek-V3 / DeepSeek-R1 evaluation for Writing essays and Speaking analysis.
  - **Groq API**: Optional ultra-high-speed inference with Llama 3.3 70B and Whisper Large v3 speech transcription.
  - **OpenRouter API**: Support for free-tier open models.
  - **Offline Local Heuristic Engine**: 100% offline rule-based Cambridge rubric analyzer that runs locally on LAN without an internet connection or API credits.

### 2. Candidate Login & Regex Session Management
- Clean candidate login interface:
  - Candidate Full Name
  - Passport / National ID (NID) Number
  - Target Band Score selection (5.0 to 9.0)
  - Exam Type (Academic vs. General Training)
  - Auto-detected Terminal ID (e.g. `PC-01` to `PC-22`)
- **Automated Directory Management**: Every candidate login instantly provisions a unique filesystem session directory on the host matching the required regex:
  ```text
  sessions/YYYYMMDD_HHMM_[PASSPORT]_[SANITIZED_NAME]/
  ├── session.json                (Candidate profile, status, timestamps)
  ├── listening_answers.json      (Auto-scored listening responses)
  ├── reading_answers.json        (Auto-scored reading responses)
  ├── writing_answers.json        (Task 1 & Task 2 submissions, word counts)
  ├── speaking_audio/             (Raw WebM/WAV microphone recordings)
  │   ├── p1_q1_1727960000.webm
  │   ├── p2_cuecard_1727960100.webm
  │   └── p3_q1_1727960200.webm
  └── diagnostic_report.json      (Full AI diagnostic marks, CEFR, 14-day study plan)
  ```

### 3. Authentic 4-Module Computer-Delivered Interface
- **Official British Council / IDP Design**:
  - Charcoal header bar with official IELTS red accent branding.
  - Live countdown timer with auditory and visual flashing alerts at the 5-minute threshold.
  - Standard, Large, and Extra-Large font size toggles.
  - 4 Accessibility Contrast Modes (Standard, Black-on-White, White-on-Black, Yellow-on-Black).
  - Bottom navigation bar with 40 question badges, answered status indicators, Review checkboxes, and Back/Next controls.
- **Listening Module**:
  - Continuous audio playback progress bar, volume control, section jumps.
  - Note completions, form fills, multiple choice, and map labeling.
- **Reading Module**:
  - Authentic **resizable split-screen** layout (Passage on left, questions on right).
  - Draggable gutter divider.
  - **Text Highlighter Tool**: Select any text to apply Yellow, Green, or Pink highlights.
  - **Candidate Notes Popover**: Attach notes directly to passage segments.
  - True / False / Not Given and Yes / No / Not Given custom pill selectors.
  - Matching Headings Roman numerals dropdowns.
- **Writing Module**:
  - Split-pane layout with Task prompt and rendered vector chart data on the left.
  - Real-time word counter with color-coded target badges (150 words for Task 1; 250 words for Task 2).
  - Auto-save engine saving responses to disk every 5 seconds.
  - Cut, Copy, and Paste toolbar shortcuts.
- **100% AI Automated Speaking Test**:
  - Part 1: Interactive introductory questions spoken by the AI Examiner using speech synthesis.
  - Part 2: Cue card with bullet points, **1-minute preparation countdown with audio chime**, plus an interactive **Candidate Scratchpad** for jotting notes, followed by a **2-minute response timer**.
  - Part 3: Abstract thematic discussion questions.
  - Live HTML5 Canvas **waveform visualizer** and microphone level VU meter.
  - Automated chunked audio streaming directly to the candidate's session folder on the host PC.

### 4. Comprehensive AI Diagnostic Engine
- **Granular Skill Breakdown**:
  - Listening & Reading: 0-40 raw scores mapped to official Cambridge 9.0 band scale with specific question-type analytics (e.g. Form completion vs. Heading matching accuracy).
  - **True/False/Not Given Confusion Detector**: Specifically flags when a candidate mistakes "False" (direct contradiction) for "Not Given" (absence of information).
  - Writing: Granular marks for Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.
  - Speaking: Fluency, Lexical Resource, Grammar, and Pronunciation analytics.
  - Suggested Vocabulary Upgrades: Replaces weak colloquial words with academic C1/C2 alternatives.
  - **Personalized 14-Day Study Plan**: Actionable daily curriculum tailored to the candidate's target band score gap.

### 5. Invigilator Hub & Print-Ready Batch Reports
- **Real-Time 22-Terminal Grid**:
  - Live candidate cards showing Terminal ID, IP, Name, Passport, Module in progress, Time remaining, and connection health pulse (Online, Idle, Disconnected, Completed).
  - Remote control actions: "Start All", "Pause All", "Add 5 Min to All", "Force Submit".
  - Individual terminal extensions and status overrides.
- **Single-Click "Batch Print All"**:
  - Consolidated A4 printable document (`@page { size: A4 portrait; }`) with automatic page breaks (`page-break-after: always;`) formatting each candidate report to an exact A4 sheet.
  - Spools directly to the classroom local printer via the browser print dialog.
- **CSV Data Export**: One-click download of all candidate scores and sub-scores for administrative grading records.

---

## 🚀 Windows Classroom Quickstart Guide

### 1. Setup on the Host / Admin PC
1. Install [Node.js (v18 or higher)](https://nodejs.org/).
2. Extract or clone this repository into a folder on the Host PC (e.g. `C:\IELTS_PLATFORM\`).
3. Double-click `WINDOWS_SETUP.bat` to install packages and initialize your `.env` configuration file.
4. Add your DeepSeek or Groq API key in `.env` (optional, offline fallback works out of the box).
5. Double-click `START_HOST_SERVER.bat`.
   - The launcher will detect your Host PC's local LAN IP (e.g. `192.168.1.100`).
   - The Invigilator Console will automatically launch in your browser at `http://localhost:3000/admin`.

> **Note on Windows Firewall**: If client PCs cannot reach port 3000, run this command once in Administrator Command Prompt:
> ```cmd
> netsh advfirewall firewall add rule name="Keystone IELTS 3000" dir=in action=allow protocol=TCP localport=3000
> ```

---

### 2. Setup on the 22 Client PCs (Windows Core i3)
1. Ensure the client PCs are connected to the same classroom Wi-Fi or Ethernet switch.
2. Copy `CLIENT_KIOSK_LAUNCHER.bat` onto the Desktop of each client machine.
3. Double-click `CLIENT_KIOSK_LAUNCHER.bat`.
   - On first launch, enter the Host PC IP address (e.g., `192.168.1.100`). The launcher remembers this in `host_ip.txt`.
   - Chrome or Edge will launch in **full-screen kiosk mode** with microphone auto-granted permissions:
   ```cmd
   chrome.exe --kiosk --app=http://192.168.1.100:3000?pc=%COMPUTERNAME% --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream
   ```
4. The student logs in and proceeds through Sound Check to start the exam.

---

## 🖨 Batch Printing Reports

1. From the Host PC Invigilator Dashboard (`http://localhost:3000/admin`), click **"🖨 Batch Print All Reports (A4)"** or double-click `BATCH_PRINT_HELPER.bat`.
2. A print-optimized window opens containing all completed student scorecards.
3. Click **"Print Now (A4 Spooler)"** or press `Ctrl + P`.
4. Select your classroom printer, set Paper Size to **A4**, and print. Each student's report prints on a dedicated A4 sheet.

---

## ⚙ Configuration (`.env`)

```env
# Server Port & Binding
PORT=3000
HOST=0.0.0.0
INVIGILATOR_PASSCODE=ielts2026

# AI Diagnostic Provider ('deepseek' | 'groq' | 'openrouter' | 'heuristic')
AI_PROVIDER=deepseek

# DeepSeek Official API
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Groq API (Optional)
GROQ_API_KEY=your_groq_api_key_here
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3

# OpenRouter API (Optional)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=deepseek/deepseek-r1:free
```

---

## 🧪 Automated Test Suite

Run the full end-to-end test suite using Node's native test runner:

```bash
npm test
```

### Test Coverage Summary:
- **`tests/sessionManager.test.js`**: Regex validation for `YYYYMMDD_HHMM_[PASSPORT]_[NAME]` directory format, filesystem isolation, answer persistence, and audio storage.
- **`tests/scoringEngine.test.js`**: Official Cambridge IELTS Listening and Reading band conversion tables, fuzzy string matching, and official `.25 / .75` overall band rounding logic.
- **`tests/aiDiagnosticEngine.test.js`**: Cambridge Writing Task 1 & Task 2 rubrics, CEFR mapping, TFNG confusion diagnostics, and 14-day study plan synthesis.
- **`tests/api.test.js`**: Full candidate lifecycle (Login -> Exam fetch -> Heartbeat -> Answer autosave -> Audio upload -> Submission -> Invigilator monitoring -> CSV export).

---

## 📄 License

MIT License. Designed and maintained for educational institutions and IELTS preparation centers.
