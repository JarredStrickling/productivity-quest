# Phase 2: Firestore Cloud Saves - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Character save slots move from localStorage to Firestore. A logged-in user's characters are accessible from any device. Existing localStorage data is abandoned (no migration). Session locking prevents multi-device conflicts. The game currently supports 2 save slots.

</domain>

<decisions>
## Implementation Decisions

### Save Timing & Feedback
- Save to Firestore on every significant event: XP gain, task submission, quest completion, battle won/lost, level-up, character creation, slot delete
- No visual save indicator — saves happen silently in the background
- On save failure: silent retry (a few attempts). If retries keep failing, show a non-blocking warning like "Cloud save unavailable"
- No periodic/interval-based saving — event-driven only

### Migration (None)
- No localStorage-to-Firestore migration. Existing localStorage characters are abandoned
- Cloud starts fresh with empty save slots for all users
- localStorage save data should be cleaned up (Claude's discretion on timing/approach)
- Post-deploy, Firestore is the sole storage layer. localStorage caching is Claude's discretion

### Multi-Device Conflicts
- Only one active session per account at a time
- Implemented via session lock (e.g., Firestore document with device/session ID)
- Logging out clears the session lock immediately, unblocking other devices
- If a user closes the tab without logging out, the lock auto-expires after a timeout (Claude decides timeout duration)
- Blocked device sees a simple, straightforward message: "You're playing on another device. Log out there first."
- No "force takeover" button — must wait for timeout or explicit logout

### Offline / Connectivity
- If Firestore is unreachable on initial load: Claude's discretion (block or cached fallback)
- If connection drops mid-session: full-screen pause overlay — "Connection lost. Reconnecting..." — gameplay is completely frozen (no movement, no interactions)
- When connection is restored: auto-resume — overlay disappears, gameplay continues instantly without user tap
- No offline play mode — cloud connection is required for active gameplay

### Claude's Discretion
- Whether to use localStorage as a read cache for faster initial loads
- When/how to clear old localStorage save data
- Session lock timeout duration (for closed-tab-without-logout scenario)
- Behavior when Firestore unreachable on cold start
- Firestore data structure and security rule specifics

</decisions>

<specifics>
## Specific Ideas

- Game currently uses 2 save slots (reduced from 3 during Phase 1 UI work)
- Existing save slot UI (SaveSlotSelection.jsx, MainMenu.jsx) reads from localStorage — needs to be rewired to Firestore
- Existing code writes saves via `localStorage.setItem(`saveSlot${id}`, JSON.stringify(data))` pattern — all call sites need to be updated
- Security rules must prevent devtools manipulation of XP/level values (roadmap success criterion #5)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-firestore-cloud-saves*
*Context gathered: 2026-02-22*
