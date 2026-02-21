# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- JavaScript (ES2020+) - Frontend and backend code
- JSX - React component markup in `src/components/` and `src/scenes/`

**Secondary:**
- Python - Utility scripts for image conversion (`convert_transparency.py`, `extract_class_huds.py`, `extract_scrolls_title.py`)

## Runtime

**Environment:**
- Node.js (no specific version pinned in package.json)

**Package Manager:**
- npm
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- React 19.2.0 - UI components and state management
- Phaser 3.90.0 - Game engine for canvas rendering and game logic

**Build & Development:**
- Vite 7.2.4 - Build tool and development server
- @vitejs/plugin-react 5.1.1 - React plugin for Vite

**Linting:**
- ESLint 9.39.1 - Code quality
- @eslint/js 9.39.1 - ESLint core rules
- eslint-plugin-react-hooks 7.0.1 - React hooks linting
- eslint-plugin-react-refresh 0.4.24 - Fast refresh support

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk 0.72.1 - Claude API integration for task evaluation and verification generation
- express 5.2.1 - Backend server for API endpoints
- cors 2.8.6 - Cross-origin request handling for API
- multer 2.0.2 - File upload handling for task verification images
- dotenv 17.2.3 - Environment variable management
- phaser 3.90.0 - Game engine (arcade physics, sprite management, animations)

**Type Definitions:**
- @types/react 19.2.5 - React TypeScript definitions
- @types/react-dom 19.2.3 - React DOM TypeScript definitions
- globals 16.5.0 - Global type definitions

## Configuration

**Environment:**
- Configuration file: `.env`
- Example file: `.env.example`
- Critical environment variable: `ANTHROPIC_API_KEY` (required for Claude API calls)
- Optional: `PORT` (defaults to 3001 if not set)

**Build:**
- Vite config: `vite.config.js`
- ESLint config: `eslint.config.js`
- Entry HTML: `index.html`

**Runtime Targets:**
- Browser (React + Phaser frontend)
- Node.js (Express API server)

## Platform Requirements

**Development:**
- Node.js with npm
- Browser with HTML5 Canvas support
- Python (for utility scripts only, not required for game)

**Production:**
- Node.js server for API endpoints
- Static file hosting for Vite build output (`dist/`)
- Ability to handle multipart form data (image uploads)
- Network access to Anthropic API (Claude endpoint)

## Build Output

**Frontend:**
- Built by: Vite
- Output directory: `dist/`
- Entry point: `src/main.jsx`
- Target: ES2020 JavaScript

**Backend:**
- Runtime: Node.js
- Entry point: `server.js`
- No build step (uses ES modules directly)

## Scripts

```bash
npm run dev              # Start Vite dev server (frontend only)
npm run dev:mobile      # Vite dev with --host flag (mobile testing)
npm run server          # Start Express API server on port 3001
npm run build           # Build frontend with Vite (outputs to dist/)
npm run lint            # Run ESLint on codebase
npm run preview         # Preview production build locally
```

## Architecture Notes

- **Dual-process model**: Vite dev server (frontend) + Express server (API) run separately
- **Frontend**: React app at root (`src/App.jsx`), Phaser scene at `src/scenes/MainScene.js`
- **Backend**: Express API at `server.js` (separate from Vite build)
- **State Bridge**: React ↔ Phaser communication via `game.events.emit/on`
- **Persistence**: localStorage for game saves (3 save slots: `saveSlot1`-`saveSlot3`)

---

*Stack analysis: 2026-02-21*
