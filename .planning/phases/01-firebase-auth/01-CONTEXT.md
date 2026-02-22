# Phase 1: Firebase Auth - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts with username/email/password and log in, with sessions persisting across browser restarts. Includes logout from any screen, password reset via email, and human-readable error messages. The Phaser game instance only initializes after auth state resolves. Cloud saves and friend features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Auth Screen Design
- Modal overlay (not full page) — full-screen on mobile (game is mobile-first, eventual app conversion planned)
- Combined register/login form with a toggle to switch between views
- RPG-themed visual style — parchment textures, fantasy fonts, pixel-art accents matching the classic RPG pixel game aesthetic
- "Scrolls of Doom" logo/title art displayed prominently above the form
- Blurred game world renders behind the modal as the background
- Smooth fade-in animation for the modal
- Straightforward button labels: "Log In", "Sign Up" (not RPG-flavored)
- Registration fields: username, email, password, confirm password
- Password field has a show/hide toggle (eye icon)
- No format hints on username field — only show errors on invalid input
- Claude has discretion on exact color palette, fonts, and spacing — aim for nostalgic classic RPG pixel game feel

### Player Identity
- Username is the login credential, used for friend requests (future feature) — NOT the in-game display name
- Characters have their own names (shown on health bars, player hub, main map)
- Username visible in settings menu only for Phase 1
- Usernames are case-insensitive — "Hero" and "hero" are the same
- Relaxed format: 3-20 characters, letters, numbers, underscores
- Username is permanent once set — no name changes
- Username availability checked on submit (not real-time)
- Password rules: Firebase defaults (6-char minimum)
- Fresh start for new accounts — no localStorage migration (old characters ignored)

### Loading & Transition
- All loading screens: Scrolls of Doom logo on black background (logo asset already exists)
- Subtle glow animation on the logo (eventual animated flames deferred — needs more assets)
- No loading indicator (spinner/bar) on splash — logo + glow implies loading
- Fixed minimum splash duration (1-2 seconds) even if auth resolves instantly
- Brief transition animation from auth screen into the game after successful login
- Returning users who are auto-logged-in still see the brief splash screen
- After logout: splash screen first, then auth modal appears
- Auth failure on auto-login: stay on splash with retry button and error message

### Error & Validation UX
- Straightforward tone — "Username already taken", not RPG-flavored
- Inline errors below the specific field that has the problem
- Errors persist until the field is corrected (no auto-dismiss)
- Error text uses the game's existing warning/danger color from the theme palette
- Submit buttons disable with spinner while request is in flight
- Brief "Account created!" confirmation after successful registration before transitioning to game
- Confirm dialog before logout: "Are you sure you want to log out?"
- Specific offline message when network is down: "No internet connection — check your connection and try again"
- "Forgot password?" link below the submit button on login form
- Password reset flow: simple email input -> Firebase sends reset link -> "Check your email" confirmation

### Claude's Discretion
- Local data caching strategy on logout (cache vs clear)
- Exact splash screen glow animation implementation
- Typography and spacing details within the RPG theme
- Exact transition animation style between auth and game

</decisions>

<specifics>
## Specific Ideas

- Game is entirely designed for mobile — eventual plan to convert to a native app once polished
- Classic RPG pixel game aesthetic is the target — aim for nostalgia
- Splash screen should have a subtle glow on the logo (animated flames are a future enhancement needing additional assets)
- Auth modal should feel like part of the game world, not a generic web form

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-firebase-auth*
*Context gathered: 2026-02-22*
