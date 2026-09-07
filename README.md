# Noesis RAG Frontend — Intelligent Multi-Agent Knowledge Platform

An enterprise-grade, real-time Agentic RAG Web Application built with **React 19**, **TypeScript**, and **Vite**, featuring a **ChatGPT-style single-line prompt bar with inline @mention document tagging**, an **ultra-low latency (<15ms) voice studio (STT & TTS)**, live LangGraph multi-agent reasoning visualization, interactive RAG triad benchmarking, and 3D gyroscopic physics.

---

## Key Architecture & Features

### 1. Ultra-Low Latency (<15ms) Multimodal Voice Studio
- **Instant Client-Side Neural TTS (<15ms Time-to-First-Audio)**:
  - Leverages modern Web Speech synthesis with intelligent voice mapping to Microsoft neural voices (Christopher, Jenny, Prabhat, Neerja, Ryan, Sonia).
  - Initiates speech within **5–15 milliseconds** with zero network round-trip lag.
  - Sentence-level chunk streaming ensures natural pacing, pause/resume stability, and word boundary alignment.
  - Seamless fallback to backend **Microsoft Edge-TTS** audio streaming.
- **Dynamic Playback Speed Pill**:
  - Cycle speeds in real time: `0.8x`, `1.0x`, `1.25x`, `1.5x`, and `2.0x`.
  - Persists user speed preferences across sessions.
- **Voice Typing with Groq Whisper Large v3 Turbo**:
  - One-click microphone recording (`MediaRecorder` webm audio stream).
  - High-precision speech-to-text transcription via `POST /api/v1/voice/stt`.
  - Built-in silence hallucination filter.

---

### 2. ChatGPT-Style Single-Line Prompt Bar with Inline @Mention Document Tagging
- **Unified Pill-Shaped Layout**:
  - Sleek, single horizontal line input bar: `[+] [Document Chip X] [Ask a question...] [Mic] [Send]`.
  - Left-aligned document tag chips with subtle glassmorphic badges.
  - Automatic removal/clearing of tagged document chips upon message submission.
- **Interactive @ Mention Selector**:
  - Type `@` to open the fuzzy document dropdown menu.
  - Displays document format icons (`PDF`, `DOCX`, `CSV`, `XLSX`, `TXT`) and file titles.
  - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) and mouse selection.
- **Attached Document Badges on Messages**:
  - User message bubbles prominently render the attached document pill (`Document Name`).

---

### 3. Streamlined Model & API Key Selector (Inbuilt vs Custom BYOK)
- **Zero-Friction Switching**: Click the model pill in the navigation bar to switch between:
  - **Inbuilt Model (Default)**: Free platform-managed model (`gemini-flash-latest` + Groq fallback chain) with no API key required.
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
| **Voice Engine** | Web Speech API (<15ms Instant Speech) + Microsoft Edge-TTS Streaming + Groq Whisper STT |
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
Create a `.env` file (or `.env.local`):
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
