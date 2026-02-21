# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**Claude AI (Anthropic):**
- Service: Task evaluation and verification request generation
  - SDK: @anthropic-ai/sdk 0.72.1
  - Auth: `ANTHROPIC_API_KEY` environment variable (required)
  - Endpoints:
    - `/api/evaluate-task` - Evaluates task completion with optional image proof
    - `/api/generate-verification` - Generates random verification requests for tasks

**Model Used:**
- claude-3-haiku-20240307 - Lightweight model for fast, cost-effective evaluations

## Data Storage

**Databases:**
- None detected - Game is stateless backend

**Local Storage (Browser):**
- localStorage keys: `saveSlot1`, `saveSlot2`, `saveSlot3`
- Purpose: Player character saves (stats, progression, equipment, abilities)
- Format: JSON serialized player state
- Capacity: ~5-10MB per browser

**File Storage:**
- Local filesystem only
- Uploads directory: `uploads/` (temporary, for processing image submissions)
- Cleanup: Images deleted after API evaluation completes (`fs.unlinkSync`)
- Asset directory: `public/assets/sprites/manaseed/` (sprite sheets)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- None - No user authentication system
- API Key Authentication: Server uses `ANTHROPIC_API_KEY` for Anthropic API
- No session management or user accounts

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging only (`console.error` for debugging)
- Health endpoint: `GET /api/health` - Returns JSON status
- Server startup logs: Port confirmation on startup

## CI/CD & Deployment

**Hosting:**
- No specific platform detected (can run anywhere Node.js is available)
- Suggested: Any Node.js hosting (Vercel, Heroku, AWS, Digital Ocean, etc.)

**CI Pipeline:**
- None detected

**Build Process:**
- Frontend: Vite build (`npm run build` → `dist/`)
- Backend: No build step (uses Node.js directly)
- Deployment requires:
  - Built frontend files in `dist/`
  - `server.js` running on Node.js
  - Vite dev server (frontend development only) OR static hosting

## Environment Configuration

**Required environment variables:**
- `ANTHROPIC_API_KEY` - Claude API key (get from https://console.anthropic.com/settings/keys)

**Optional environment variables:**
- `PORT` - Express server port (defaults to 3001)

**Secrets location:**
- `.env` file (gitignored, not committed)
- Template: `.env.example`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Image Handling

**Submission Flow:**
1. Client uploads image via `TaskSubmissionModal` (multipart/form-data)
2. Express receives at `/api/evaluate-task` endpoint
3. Multer stores temporarily in `uploads/` directory
4. Claude API receives base64-encoded image with task description
5. Image deleted after evaluation (no permanent storage)

**Supported Formats:**
- JPEG, PNG, GIF, WebP (determined by MIME type in upload)
- Max size: Depends on multer config (default ~50MB)

## Task Evaluation System

**Request Flow:**
1. User submits task description
2. Frontend calls `/api/generate-verification` → Claude generates verification request
3. Frontend captures image or user submits without image
4. Frontend POSTs to `/api/evaluate-task` with description, optional image, verification request
5. Backend sends to Claude with vision prompt
6. Claude evaluates task completion + verification match
7. Server returns XP tier and explanation

**Response Format:**
```json
{
  "tier": "Common|Strong Work|Busting Chops|Legendary",
  "xp": 10|25|50|150,
  "color": "#hexcolor",
  "explanation": "string",
  "description": "string"
}
```

**Demo Mode:**
- Flag: `DEMO_MODE = false` in `server.js`
- When true: Uses mock keyword-based evaluation instead of Claude API
- Useful for testing without API calls

## Cross-Origin Requests

**CORS Configuration:**
- Enabled globally: `app.use(cors())` in `server.js`
- Allows requests from any origin
- Required for frontend to call `/api/` endpoints from different ports during development

## Static Asset Hosting

**Assets served from:**
- `public/` directory (Vite serves as static files)
- Includes sprite sheets: `public/assets/sprites/manaseed/`
- Icons, images, and other game assets

---

*Integration audit: 2026-02-21*
