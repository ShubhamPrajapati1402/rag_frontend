# Noesis RAG — Frontend (React 19 + TypeScript + Vite)

An enterprise-grade, high-performance RAG (Retrieval-Augmented Generation) frontend interface engineered with **React 19**, **TypeScript**, and **Vite**, integrated with a **Stateful LangGraph Multi-Agent RAG Backend**.

---

## 🚀 Key Features

### 🧠 1. Stateful LangGraph RAG & SSE Streaming
- **Server-Sent Events (SSE) Streaming**: Connects directly to `POST /api/v1/chat/stream` for real-time word token generation.
- **Dynamic LangGraph Node Status**: Real-time pulsing indicators reflecting multi-agent graph pipeline execution:
  - `summarizer`: Conversation context compression.
  - `router`: Semantic query intent routing.
  - `retriever`: Vector & hybrid keyword chunk retrieval.
  - `grader`: Self-corrective document relevance validation.
  - `generator`: Stateful LLM response synthesis.
- **Structured Source Citations**: Real-time citation chips with document format indicators, PDF page numbers, Excel/CSV sheet names, similarity match scores, and interactive modal dialogs for full passage inspection.

### 💬 2. Persistent Session Management
- **Full History Hydration**: `GET /api/v1/chat/sessions` loads previous conversations with message counts and timestamps.
- **Session Switching**: Click any historical session in the sidebar or spotlight command palette to load past messages and citations via `GET /api/v1/chat/sessions/{session_id}`.
- **Session Deletion**: Remove conversation records with `DELETE /api/v1/chat/sessions/{session_id}`.
- **New Conversation Auto-Naming**: Starting a "New Chat" resets the session ID so backend auto-generates titles and initializes fresh graph states.

### 🌌 3. 3D Gyroscopic Solar Core
- **4-Plane Symmetrical Gyroscopic Architecture**: 0° Equatorial, +45° Right-Tilted, -45° Left-Tilted, and 90° Polar Vertical orbits.
- **3D Planetary Physics & Revolving Sub-Moons**: Independent orbital speeds with planetary nodes carrying their own revolving mini-moon satellites.
- **Full 360° Mouse & Touch Gesture Controls**: Free 3D pitch and yaw rotation using mouse drag or touchscreen gestures with true 3D Z-depth sorting.
- **Static Centroid Core**: Polished obsidian/titanium sphere anchored at the center with a luminous Brain glyph.

### 📂 4. Document Library & Ingestion Hub
- **Multi-Format Ingestion**: Supports `PDF`, `DOCX`, `XLSX`, `CSV`, `Markdown`, and `TXT`.
- **Drag-and-Drop Staging**: Live upload simulation with percentage progress tracking.
- **Metadata Inspection**: Summary previews, token sizes, format badges, and live file counters.

### 🔐 5. HttpOnly Cookie Authentication
- **Secure Session Management**: All requests automatically send HttpOnly session cookies via `credentials: "include"`.
- **Email + OTP Verification**: 6-digit email OTP verification flows.
- **Sign in with Google**: One-tap Google Identity OAuth.
- **Zero LocalStorage Auth Vulnerability**: Eliminates token leakage by relying on server-side HttpOnly cookie sessions.

### 🌗 6. Precision Dual-Theme Engine
- **Dark Theme**: Sleek obsidian canvas (`#0d0d0d`) with ambient neon accents.
- **Light Theme**: High-contrast crisp canvas (`#ffffff` / `#f9f9fb`) with clean metallic titanium glyphs.
- **Theme Sync**: Seamlessly syncs with user preferences and system `prefers-color-scheme`.

### ⚡ 7. Spotlight Command Palette
- Triggered globally with <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>⌘</kbd> + <kbd>K</kbd>) to search conversations, jump to document management, or initiate new analyses.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Parser**: [React Markdown](https://github.com/remarkjs/react-markdown)
- **Styling**: Vanilla CSS (CSS Variables, 3D Transforms, Glassmorphism, Micro-Animations)

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

## 📦 Getting Started

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
The application will launch at **`http://localhost:1001`** (or your configured Vite port).

### 3. Production Build
```bash
npm run build
```
Type-checks and compiles production-ready assets to the `dist/` directory.

---

## 📂 Project Structure

```
rag_frontend/
├── src/
│   ├── components/
│   │   ├── Auth/             # Sign-In, Sign-Up & Google OAuth Modal
│   │   ├── Chat/             # ChatStudio, 3D Gyroscopic Solar Core & Live Node Indicators
│   │   ├── CommandPalette/   # Global Spotlight Search (Ctrl+K)
│   │   ├── Header/           # Top Navbar & Model Selector
│   │   ├── Ingestion/        # Document Ingestion Hub & File Tables
│   │   └── Navigation/       # Sidebar, Chat History & User Profile
│   ├── services/
│   │   ├── authApi.ts        # Backend Auth API Client (HttpOnly Cookies & JWT)
│   │   └── chatApi.ts        # LangGraph SSE Streaming & Persistent Sessions API Client
│   ├── types/
│   │   └── index.ts          # Shared TypeScript Interfaces & Types
│   ├── vite-env.d.ts         # Vite Environment Type Declarations
│   ├── App.tsx               # Root App State, Session Hydration & Theme Controller
│   ├── main.tsx              # Application Entry Point
│   └── index.css             # Global Theme Tokens & Typography
├── tsconfig.json             # TypeScript Compiler Configuration
├── vite.config.js            # Vite Bundler Settings (Port 1001)
├── .env.example              # Environment Configuration Template
└── package.json              # Dependencies & Scripts
```
