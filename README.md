# Noesis RAG Frontend — Intelligent Multi-Agent Knowledge Platform

An enterprise-grade, real-time Agentic RAG Web Application built with **React 19**, **TypeScript**, and **Vite**, featuring a **ChatGPT-style single-line prompt bar with inline @mention document tagging**, **server-side high-fidelity Microsoft Edge-TTS neural audio streaming**, **Groq Whisper Large v3 Turbo voice typing**, live LangGraph multi-agent reasoning visualization, interactive RAG triad benchmarking, and 3D gyroscopic physics.

---

## Key Architecture & Features

### 1. Server-Side Microsoft Edge-TTS Neural Audio Streaming & Voice Studio
- **High-Fidelity Neural Audio Streaming**:
  - Direct MP3 audio streaming from the FastAPI backend (`GET /api/v1/voice/tts` and `POST /api/v1/voice/tts`) powered by **Microsoft Edge-TTS** 24kHz neural voices.
  - Curated neural voices with regional accents and genders:
    - `en-US-ChristopherNeural` (US English Male, Professional)
    - `en-US-JennyNeural` (US English Female, Natural)
    - `en-IN-PrabhatNeural` (Indian English Male, Clear)
    - `en-IN-NeerjaNeural` (Indian English Female, Warm)
    - `en-GB-RyanNeural` (British English Male, Refined)
    - `en-GB-SoniaNeural` (British English Female, Expressive)
- **Sub-Millisecond In-Memory LRU Audio Caching (<1ms Replay)**:
  - Backend caches synthesized audio bytes in RAM with `ETag` and `Cache-Control` headers for instantaneous zero-latency replay.
- **Visual Buffer & Playback State Indicators**:
  - Immediate spinner feedback (`Loader2`) on the speaker icon while audio stream buffers, seamlessly transitioning to `Pause` on playback.
- **Dynamic Playback Speed Controller**:
  - Cycle speeds in real time: `0.8x`, `1.0x`, `1.25x`, `1.5x`, and `2.0x`.
  - Persists speed preferences in local storage.
- **High-Accuracy Voice Typing (Groq Whisper Large v3 Turbo)**:
  - Micro-recording via HTML5 `MediaRecorder` webm audio stream.
  - Sub-second speech-to-text transcription via `POST /api/v1/voice/stt`.
  - Automated silence hallucination suppression.

---

### 2. ChatGPT-Style Single-Line Prompt Bar with Inline @Mention Document Tagging
- **Unified Pill-Shaped Input Bar**:
  - Single horizontal line layout: `[+] [Document Chip X] [Ask a question...] [Mic] [Send]`.
  - Left-aligned document tag chips with subtle glassmorphic styling.
  - Automatic clearance and reset of tagged document chips upon message submission.
- **Interactive @ Mention Selector**:
  - Type `@` to open the fuzzy document search dropdown.
  - Displays file format icons (`PDF`, `DOCX`, `CSV`, `XLSX`, `TXT`) and file titles.
  - Full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) and click-to-attach.
- **Attached Document Badges on Messages**:
  - User message bubbles render an attached document badge (`Document Name`).

---

### 3. Streamlined Model & API Key Selector (Inbuilt vs Custom BYOK)
- **Zero-Friction Switching**: Click the model pill in the navigation bar to switch between:
  - **Inbuilt Model (Default)**: Free platform-managed model (`gemini-flash-latest` with Groq fallback chain) with no API key required.
  - **Custom Model (BYOK)**: Enter any model name (`gpt-4o`, `claude-3-5-sonnet`, `deepseek-chat`, `llama-3.3-70b-versatile`) and personal API Key.
- **Clickable Quick Presets**: One-click configuration for popular frontier models.
- **Local Endpoint Support**: Custom Base URL field for local Ollama (`http://localhost:11434/v1`), vLLM, or LM Studio instances.
- **Encrypted Local Storage**: Model selections and credentials persist securely in the browser.

---

### 4. Stateful LangGraph Multi-Agent RAG & SSE Streaming
- **Server-Sent Events (SSE) Streaming**: Connects directly to `POST /api/v1/chat/stream` for real-time word token generation.
- **Dynamic LangGraph Node Status**: Real-time pulsing status indicators reflecting multi-agent graph pipeline execution:
  - `summarizer`: Conversation context compression.
  - `router`: Semantic query intent routing.
  - `rewriter`: Dual-mode contextual query rewriting (0ms fast pass for tagged docs).
  - `retriever`: Vector & hybrid keyword chunk retrieval.
  - `reranker`: Stage 2 cross-encoder reranker.
  - `grader`: Self-corrective document relevance validation.
  - `generator`: Stateful LLM response synthesis.
- **Structured Source Citations**: Real-time citation chips with document format indicators, PDF page numbers, Excel/CSV sheet names, similarity match scores, and interactive modal dialogs for full passage inspection.

---

### 5. Developer Evaluation & RAG Triad Benchmarking Suite
- **Comprehensive Quality Metrics**: Deep-dive RAG triad evaluations covering:
  - **Overall RAG Score**: Composite weighted quality index.
  - **Faithfulness**: Hallucination detection verifying if all answer claims are entailed by retrieved context.
  - **Context Precision**: Signal-to-noise ratio of retrieved knowledge chunks.
  - **Answer Relevance**: Semantic alignment between user query and generated response.
  - **Context Recall**: Retrieval coverage against ground-truth information.
  - **Latency Tracking**: Benchmark execution time and embedding cosine distance.
- **Granular Test Case Inspection**: Claim-by-claim context entailment audits with interactive search and per-document filtering.
- **Real-Time Developer Team & Permissions**: Invite teammates with `Member` or `Admin` privileges, featuring live WebSocket sync (`useDeveloperTeamSocket`), presence indicators, and tokenized invitations.

---

### 6. 3D Gyroscopic Solar Core & Mini Brand Emblem
- **4-Plane Symmetrical Gyroscopic Architecture**: 0 deg Equatorial, +45 deg Right-Tilted, -45 deg Left-Tilted, and 90 deg Polar Vertical orbits.
- **3D Planetary Physics & Revolving Sub-Moons**: Independent orbital speeds with planetary nodes carrying their own revolving mini-moon satellites.
- **Full 360 deg Mouse & Touch Gesture Controls**: Free 3D pitch and yaw rotation using mouse drag or touchscreen gestures with true 3D Z-depth sorting.
- **Sidebar Mini 3D Neural Emblem**: Animated miniature gyroscopic core embedded beside the `Noesis` title in the sidebar.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19, TypeScript, Vite |
| **Styling** | Vanilla CSS, Glassmorphism, Theme-Adaptive Design (Dark & Light) |
| **Icons** | Lucide React |
| **Voice Engine** | Server-Side Microsoft Edge-TTS Streaming + Groq Whisper STT |
| **Communication** | Fetch API, Server-Sent Events (SSE), WebSockets |
| **Math / Rendering** | Katex, React Markdown, PrismJS Syntax Highlighting |

---

## Getting Started

### 1. Prerequisites
- **Node.js 18+** (or Node 20+)
- **npm** or **pnpm** / **yarn**
- Running **Noesis Backend** (`http://localhost:2001`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/ShubhamPrajapati1402/rag_frontend.git
cd rag_frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file:
```env
VITE_BACKEND_URL=http://localhost:2001
VITE_WS_URL=ws://localhost:2001
```

### 4. Development Server
```bash
npm start
# Or
npm run dev
```
The application will launch at `http://localhost:1001`.

### 5. Production Build
```bash
npm run build
npm run preview
```
