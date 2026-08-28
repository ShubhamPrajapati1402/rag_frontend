# Noesis RAG — Frontend (React + TypeScript + Vite)

An enterprise-grade, high-performance RAG (Retrieval-Augmented Generation) frontend interface engineered with **React 19**, **TypeScript**, and **Vite**.

---

## 🚀 Key Features

### 🌌 1. 3D Gyroscopic Solar Core
- **4-Plane Symmetrical Gyroscopic Architecture**: 0° Equatorial, +45° Right-Tilted, -45° Left-Tilted, and 90° Polar Vertical orbits.
- **3D Planetary Physics & Revolving Sub-Moons**: Independent orbital speeds with planetary nodes carrying their own revolving mini-moon satellites.
- **Full 360° Mouse & Touch Gesture Controls**: Free 3D pitch and yaw rotation using mouse drag or touchscreen gestures with true 3D Z-depth sorting (passing in front and behind the central core).
- **Static Centroid Core**: Polished metallic titanium / obsidian sphere anchored at the center with a crisp, luminous pure white Brain glyph.

### 💬 2. ChatGPT-Style Conversational Studio
- **Real-Time Token Streaming**: Simulated neural retrieval and smooth word streaming.
- **Dynamic Context Starters**: Suggestion prompts dynamically generated based on currently indexed files (`PDF`, `Excel`, `Markdown`).
- **Interactive Source Citations**: Clickable source chips with modal drawers displaying extracted passages and match similarity scores.
- **Prompt History Navigation**: <kbd>↑</kbd> and <kbd>↓</kbd> arrow key prompt recall.

### 📂 3. Document Library & Ingestion Hub
- **Multi-Format Ingestion**: Supports `PDF`, `DOCX`, `XLSX`, `CSV`, `Markdown`, and `TXT`.
- **Drag-and-Drop Staging**: Live upload simulation with percentage progress tracking.
- **Metadata Inspection**: Summary previews, token sizes, format badges, and live file counters.

### 🔐 4. Authentication Lifecycle
- **Sign In & Sign Up Modes**: Clean modal with email/password validation.
- **Sign in with Google**: One-click Google OAuth simulation with brand icon.
- **Quick Demo Access**: Instant one-click login as `Shubham Prajapati (Pro Workspace)`.
- **Interactive Logout Flow**: Profile dropdown → Logout modal confirmation → Session termination and redirect.

### 🌗 5. Precision Dual-Theme Engine
- **Dark Theme**: Sleek obsidian canvas (`#0d0d0d`) with neon-glowing dotted orbits and ambient floor shadows.
- **Light Theme**: High-contrast white canvas (`#ffffff` / `#f9f9fb`) with crisp `rgba(0, 0, 0, 0.75)` dotted rings and clean metallic titanium core.
- **Theme Persistence**: Synced with `localStorage` and system `prefers-color-scheme`.

### ⚡ 6. Spotlight Command Palette
- Triggered globally with <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>⌘</kbd> + <kbd>K</kbd>) to instantly search chats, jump to files, or start new conversations.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Parser**: [React Markdown](https://github.com/remarkjs/react-markdown)
- **Styling**: Vanilla CSS (CSS Variables, 3D Transforms, Glassmorphism, Micro-Animations)

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
The application will launch at **`http://localhost:1001`** (or configured Vite port).

### 3. Production Build
```bash
npm run build
```
Type-checks and compiles production assets to the `dist/` directory.

---

## 📂 Project Structure

```
rag_frontend/
├── src/
│   ├── components/
│   │   ├── Auth/             # Sign-In, Sign-Up & Google OAuth Modal
│   │   ├── Chat/             # ChatStudio & 3D Gyroscopic Solar Core
│   │   ├── CommandPalette/   # Global Spotlight Search (Ctrl+K)
│   │   ├── Header/           # Top Navbar & Model Selector
│   │   ├── Ingestion/        # Document Ingestion Hub & File Tables
│   │   └── Navigation/       # Sidebar, History, & User Profile
│   ├── services/
│   │   └── authApi.ts        # Noesis Backend Auth API Client (JWT & HttpOnly Cookies)
│   ├── types/
│   │   └── index.ts          # Shared TypeScript Interfaces & Types
│   ├── vite-env.d.ts         # Vite Environment Type Declarations
│   ├── App.tsx               # Root App State & Route Controller
│   ├── main.tsx              # Application Entry Point
│   └── index.css             # Global Theme Tokens & Typography
├── tsconfig.json             # TypeScript Compiler Configuration
├── vite.config.js            # Vite Bundler Settings (Port 1001)
└── package.json              # Dependencies & Scripts
```
