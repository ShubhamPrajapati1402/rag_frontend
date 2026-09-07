# Noesis RAG Frontend — Intelligent Multi-Agent Knowledge Platform

An enterprise-grade, real-time Agentic RAG Web Application built with **React 19**, **TypeScript**, and **Vite**, featuring live LangGraph multi-agent reasoning visualization, SSE token streaming, streamlined Model & API Key selector, interactive RAG triad benchmarking, and 3D gyroscopic physics.

---

## 🌟 Key Architecture & Features

### 🤖 1. Streamlined Model & API Key Selector (Inbuilt vs Custom BYOK)
- **Zero-Friction Switching**: Click the model pill in the navigation bar to switch between:
  - **Inbuilt Model (Default)**: Free platform-managed model (Gemini 2.5 Flash + Groq fallback chain) with no API key needed.
  - **Custom Model (BYOK)**: Simply type your desired **Model Name** (e.g., `gpt-4o`, `claude-3-5-sonnet`, `gemini-2.5-pro`, `llama-3.3-70b-versatile`, `deepseek-chat`) and paste your **API Key**.
- **Clickable Quick Presets**: One-click model suggestions for popular models.
- **Optional Custom Endpoint**: Optional Base URL field for local Ollama (`http://localhost:11434/v1`), vLLM, or LM Studio instances.
- **Persistent Storage**: Model preferences and keys persist locally in browser storage and are seamlessly propagated through LangGraph pipeline invocations.

### ⚡ 2. Stateful LangGraph Multi-Agent RAG & SSE Streaming
- **Server-Sent Events (SSE) Streaming**: Connects directly to `POST /api/v1/chat/stream` for real-time word token generation.
- **Dynamic LangGraph Node Status**: Real-time pulsing status indicators reflecting multi-agent graph pipeline execution:
  - `summarizer`: Conversation context compression.
  - `router`: Semantic query intent routing.
  - `retriever`: Vector & hybrid keyword chunk retrieval.
  - `grader`: Self-corrective document relevance validation.
  - `generator`: Stateful LLM response synthesis.
- **Structured Source Citations**: Real-time citation chips with document format indicators, PDF page numbers, Excel/CSV sheet names, similarity match scores, and interactive modal dialogs for full passage inspection.
- **Model Attribution**: Assistant message bubbles display subtle badge tags reflecting the model that synthesized the response.

### 📊 3. Developer Evaluation & RAG Triad Benchmarking Suite
- **Comprehensive Quality Metrics**: Deep-dive RAG triad evaluations covering:
  - **Overall RAG Score**: Composite weighted quality index.
  - **Faithfulness**: Hallucination detection verifying if all answer claims are entailed by retrieved context.
  - **Context Precision**: Signal-to-noise ratio of retrieved knowledge chunks.
  - **Answer Relevance**: Semantic alignment between user query and generated response.
  - **Context Recall**: Retrieval coverage against ground-truth information.
  - **Semantic Similarity & Latency Tracking**: Benchmark execution time and embedding cosine distance.
- **Granular Test Case Inspection**: Claim-by-claim context entailment audits with interactive search and per-document filtering.
- **Real-Time Developer Team & Permissions**: Invite teammates with `Member` or `Admin` privileges, featuring live WebSocket sync (`useDeveloperTeamSocket`), presence indicators, and smart helper tooltips that automatically dismiss once typing begins.
- **Historical Benchmark Runs**: Persistent run comparison with one-click deletion and inline tooltip actions.

### 💬 4. Persistent Session Management
- **Full History Hydration**: `GET /api/v1/chat/sessions` loads previous conversations with message counts and timestamps.
- **Session Switching**: Click any historical session in the sidebar or spotlight command palette to load past messages and citations via `GET /api/v1/chat/sessions/{session_id}`.
- **Session Deletion**: Remove conversation records with `DELETE /api/v1/chat/sessions/{session_id}`.
- **New Conversation Auto-Naming**: Starting a "New Chat" resets the session ID so backend auto-generates titles and initializes fresh graph states.

### 🪐 5. 3D Gyroscopic Solar Core & Mini Brand Emblem
- **4-Plane Symmetrical Gyroscopic Architecture**: 0° Equatorial, +45° Right-Tilted, -45° Left-Tilted, and 90° Polar Vertical orbits.
- **3D Planetary Physics & Revolving Sub-Moons**: Independent orbital speeds with planetary nodes carrying their own revolving mini-moon satellites.
- **Full 360° Mouse & Touch Gesture Controls**: Free 3D pitch and yaw rotation using mouse drag or touchscreen gestures with true 3D Z-depth sorting.
- **Sidebar Mini 3D Neural Emblem**: Animated miniature gyroscopic core embedded beside the `Noesis` title in the sidebar.

### 📁 6. Document Library & Ingestion Hub
- **Multi-Format Ingestion**: Supports `PDF`, `DOCX`, `XLSX`, `CSV`, `Markdown`, and `TXT`.
- **Drag-and-Drop Staging**: Live upload simulation with percentage progress tracking.
- **Metadata Inspection**: Summary previews, token sizes, clean-text format badges, and live file counters.

### 🔐 7. HttpOnly Cookie Authentication
- **Secure Session Management**: All requests automatically send HttpOnly session cookies via `credentials: "include"`.
- **Email + OTP Verification**: 6-digit email OTP verification flows.
- **Sign in with Google**: One-tap Google Identity OAuth.
- **Zero LocalStorage Auth Vulnerability**: Eliminates token leakage by relying on server-side HttpOnly cookie sessions.

### 🌓 8. Instant Zero-Delay Dual-Theme Engine
- **Dark Theme**: Sleek obsidian canvas (`#212121` / `#171717`) with ambient neon accents.
- **Light Theme**: High-contrast crisp canvas (`#ffffff` / `#f9f9f9`) with clean metallic titanium glyphs.
- **Zero Render Lag**: Synchronous DOM updates for instantaneous light/dark toggling without virtual DOM render delays.

### 🔍 9. Spotlight Command Palette
- Triggered globally with <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>⌘</kbd> + <kbd>K</kbd>) to search conversations, jump to document management, or initiate new analyses.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Parser**: [React Markdown](https://github.com/remarkjs/react-markdown) + [Remark GFM](https://github.com/remarkjs/remark-gfm)
- **Styling**: Vanilla CSS (Design Tokens, Glassmorphism, Responsive Grid, Micro-Animations)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend API Base URL
VITE_BACKEND_URL=http://localhost:2001

# Google OAuth Client ID (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
# or
npm start
```
The application will launch at **`http://localhost:1001`** (configured in `vite.config.js`).

### 3. Production Build
```bash
npm run build
```
Type-checks with `tsc` and compiles production-ready assets to the `dist/` directory.

---

## 📂 Project Structure

```
rag_frontend/
├── src/
│   ├── assets/               # Static assets & illustrations
│   ├── components/
│   │   ├── Auth/             # Sign-In, Sign-Up & Google OAuth Modal
│   │   ├── Chat/             # ChatStudio, 3D Gyroscopic Solar Core & Live Node Indicators
│   │   ├── CommandPalette/   # Global Spotlight Search (Ctrl+K)
│   │   ├── Evaluation/       # Developer Evaluation & RAG Triad Benchmarking Dashboard
│   │   ├── Header/           # Top Navbar, Tab Navigation & Theme Toggle
│   │   ├── Ingestion/        # Document Ingestion Hub & File Tables
│   │   ├── Models/           # SimpleModelModal (Model Name & API Key Selector)
│   │   └── Navigation/       # Sidebar, 3D Brand Emblem, Chat History & User Profile
│   ├── hooks/
│   │   └── useDeveloperTeamSocket.ts  # Real-time WebSocket hook for developer team presence & sync
│   ├── services/
│   │   ├── authApi.ts        # Backend Auth API Client (HttpOnly Cookies & JWT)
│   │   ├── chatApi.ts        # LangGraph SSE Streaming & Persistent Sessions API Client
│   │   ├── evaluationService.ts # RAG Benchmark Runs & Team Access API Client
│   │   └── modelsApi.ts      # Models Catalog Discovery & BYOK Key Vault API Client
│   ├── types/
│   │   └── index.ts          # Shared TypeScript Interfaces & Types
│   ├── App.tsx               # Root App State, Session Hydration & Theme Controller
│   ├── App.css               # Top-level workspace layout styles
│   ├── main.tsx              # Application Entry Point
│   └── index.css             # Global Theme Tokens, Animations & Typography
├── tsconfig.json             # TypeScript Compiler Configuration
├── vite.config.js            # Vite Bundler Settings (Port 1001)
├── .env.example              # Environment Configuration Template
└── package.json              # Dependencies & Scripts
```
