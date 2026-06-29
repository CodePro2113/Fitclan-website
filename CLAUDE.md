# FitClan Website — Claude Context

## Two Repos, Two Roles

| Repo | Path | Purpose | Deployed |
|------|------|---------|----------|
| `Fitclan-website` | `C:\Users\nishm\OneDrive\Desktop\Fitclan-website` | Static marketing site + auth/dashboard pages | fitclan.ca (Netlify) |
| `family-fitness-fun` | `C:\Users\nishm\OneDrive\Desktop\family-fitness-fun` | Android app (React/Vite/Capacitor) | Not deployed to web yet |

**Important:** Always work in `Fitclan-website` for website changes. Do NOT treat them as the same project.

---

## ⚙️ MANDATORY: Always use the agency subagents

Whenever you implement a new feature, make a non-trivial change, or whenever the user asks for review/audit, you MUST use the specialized agency subagents — do not just do it inline. This is a hard rule the user has explicitly required.

- **Before a feature is "done":** spawn **Code Reviewer** (correctness/quality) and **Security Engineer** (RLS, SECURITY DEFINER RPCs, XSS, auth, exposed keys). For any database/schema/RPC change, also spawn **Database Optimizer**.
- **During implementation:** use the matching specialist — **Frontend Developer**, **Backend Architect**, **Accessibility Auditor**, **Evidence Collector / Test Results Analyzer** (QA), etc.
- Spawn them with clear scope + exact file paths. Treat findings as a checklist: fix or explicitly justify each before declaring work complete.
- Applies to this repo AND `family-fitness-fun`.

---

## dashboard.html — authenticated web app (mirrors the Android app)

`dashboard.html` is a single self-contained vanilla-JS SPA on the Supabase JS CDN. It mirrors the app EXCEPT activity logging (logging is phone-only; the **Log** tab shows a "sync via phone / Health Connect" notice instead).

- **Tabs** (sidebar + a horizontally-scrollable "spinning" bottom nav): Home, Leaderboard, Conquest, Missions, League, Achievements, Log, Profile. Each `data-tab="x"` button has a `#tab-x` container; `switchTab()` toggles, lazy-loads Conquest map + League standings.
- **Home cards:** Today's Vibe (mood/step-goal — uses `set_today_mood` + `credit_mood_goal`, counts steps **since pick** via `start_steps` delta), Weekly Clan Goal (7-day clan steps vs `families.weekly_step_goal`), Beat Your Past Self (`refresh_personal_baseline`), Rescue Missions (clan members <1000 steps today; one-tap `rescue_completions` insert, no points).
- **Data layer:** one IIFE; state `session/profile/family/clanMembers/clanActivities/allMyActs/missions/todaysMood/rescuedToday`. Helpers `escHtml` (use for ALL user strings → XSS), `calcPts`, `computeStreak`, `switchTab`, `showToast`. `MOODS`/`MOOD_ICONS` consts must be declared BEFORE `renderUI()` runs (TDZ — they live near the top, not in the later render block).
- **Conquest on web is cosmetic** (`territory_control` table, client upsert) — awards NO points. Real scoring is the app's server-validated `attack_territory` RPC.
- Pages: `index.html` (marketing), `login/signup/forgot-password.html`, `dashboard.html`, `delete-account.html`, `about/privacy/terms.html`. Marketing pages use a topographic-contour background (`body::before`, see Background Design System below).

## Session status / pending (shared with family-fitness-fun)
- Run the 4 migrations + redeploy `delete-account` (see `family-fitness-fun/CLAUDE.md` → PENDING USER ACTIONS), then push BOTH repos via GitHub Desktop.
- Security remediation applied this session (family-join lockdown, WITH CHECK policies, indexes, CORS); deferred items (JWT rotation, league RPC throttle) listed in the app CLAUDE.md.

The GitHub repo for the website is: https://github.com/CodePro2113/Fitclan-website  
User pushes via **GitHub Desktop** (cannot push directly to main from CLI).

---

## Supabase Credentials (safe client-side anon key)

```
SUPABASE_URL:  https://cujbjttoofjytezdwkyr.supabase.co
SUPABASE_KEY:  sb_publishable_QFvM6cyt5vxcleN7M9_oAw_VVaz0bta
PROJECT_ID:    cujbjttoofjytezdwkyr
```

Supabase JS CDN (UMD pattern):
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script>
  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
</script>
```

---

## Tech Stack — Fitclan-website

- **HTML/CSS/JS** — pure static, no build step
- **GSAP 3.12.5** — scroll animations on marketing pages
- **Lenis 1.1.14** — smooth scroll
- **Lucide Icons CDN** — nav icons
- **Space Grotesk** + **Inter** — fonts
- **Leaflet 1.9.4** — conquest map on index.html
- **Supabase JS CDN** — auth + data on login/signup/dashboard

---

## Tech Stack — family-fitness-fun

- **React 18 + TypeScript + Vite**
- **Capacitor 8** (Android wrapper)
- **Supabase** (same project)
- **Health Connect / Google Fit / Samsung Health** integration
- **React Router** for navigation

---

## Files in Fitclan-website

### Marketing pages
- `index.html` — main marketing page with Leaflet conquest map
- `about.html` — about page
- `delete-account.html` — Google Play required deletion page

### Auth + Dashboard (built as static pages)
- `login.html` — Supabase signInWithPassword → redirect to dashboard.html
- `signup.html` — name, email, password, fitness source pills → shows "check email" state
- `dashboard.html` — full app dashboard (home/leaderboard/log/profile tabs)

### Assets
- `css/styles.css` — all marketing site styles
- `js/main.js` — GSAP + Lenis animations for marketing pages

---

## Background Design System (marketing pages)

### Topographic contour layer (replaced the old ambient orbs)
The "ambient orbs" were removed (user: "they look vibecoded"). The site-wide
marketing background is now a **topographic contour layer** rendered on
`body::before` in `css/styles.css` — so every page that links `styles.css`
(index, about, privacy, terms) gets it automatically, no per-page DOM.
```css
.topo-bg, body::before {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  /* layer 1: tiling teal SVG contour pattern (600px tile, stroke #00e896)
     layer 2: radial vignette fading contours into charcoal at edges */
  opacity: 0.065;                /* ~6% — whispers, never shouts */
  animation: topoDrift 56s linear infinite;  /* drifts one tile, seamless */
}
```
- **z-index: -1** keeps it behind ALL content on every page (a negative-z
  `::before` still paints above body's own background). Do NOT reintroduce orbs.
- `dashboard.html` has its own copy of this layer on a `.orb-bg` div (legacy
  class name, but it's the same topo layer) — keep them in sync.
- `topoDrift` is frozen under `@media (prefers-reduced-motion)`.
- Body base: `hsl(228, 12%, 6%)` with radial gradient corners (still present, under the topo layer).
- Auth pages (`login`/`signup`/`forgot-password`) use a SEPARATE local `.orb`
  gradient-blob system in their own `<style>` — unrelated, intentionally left alone.

---

## Dashboard Architecture

### Auth flow
1. User signs up at `signup.html` → Supabase sends verification email
2. Email link redirects to `https://fitclan.ca/dashboard.html` (must be in Supabase Redirect URLs)
3. `dashboard.html` auth guard: `sb.auth.getSession()` → redirect to login.html if no session

### Pending profile pattern
On signup, store in localStorage:
```js
localStorage.setItem('fitclan_pending_profile', JSON.stringify({ fitness_source, user_id }));
```
On dashboard load, apply it to the `profiles` table then clear it.

### Points calculation
| Activity | Rate |
|----------|------|
| Steps | 1000 steps = 10 pts |
| Workout | 10 min = 10 pts |
| Calories | 500 cal = 20 pts |
| Water | 8 glasses = 10 pts |

### Dashboard tabs
- **Home** — points hero (today pts + streak), 4 stat cards, leaderboard preview, daily missions, activity feed
- **Leaderboard** — full clan rankings, sort by All Time / This Week / Today
- **Log Activity** — manual form for all 4 activity types, live pts preview
- **Profile** — user info, sign out, delete account (invokes `delete-account` Supabase Edge Function)

---

## Supabase Tables Used

| Table | Used for |
|-------|---------|
| `profiles` | display_name, fitness_source, avatar_emoji |
| `activities` | user activities (type, value, points, created_at) |
| `daily_missions` | missions for today (title, description, points_reward, completed) |
| `family_members` | clan membership (user_id → family_id) |
| `families` | clan info (id, name) |

Edge function: `delete-account` — deletes user's data + auth record

---

## Conquest Map (index.html)

Uses **vanilla Leaflet 1.9.4** (NOT react-leaflet).

```html
<!-- In <head> -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<!-- At bottom of body -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

- Tile layer: CARTO dark (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`)
  - **Note:** No `{r}` placeholder — that's react-leaflet specific
- Map settings: center `[20, 0]`, zoom 2, minZoom 2, maxZoom 5, worldCopyJump true, scrollWheelZoom false
- Territory data: ~50 territories + 6 water zones inlined from `conquestTerritories.ts`
- Demo ownership: teal clan (USA/CAN/GBR/FRA/AUS), blue clan (RUS/CHN/JPN), orange clan (BRA/ARG/ZAF)

---

## UI Rules

- **NO EMOJIS EVER** — not in HTML, JS, CSS, or any file. Use SVG icons only.
- Dashboard design: Option A (Strava/Whoop energy) + Option C elements (XP bar, quest-log missions, rank badge, glow effects)

---

## Key Decisions Made

1. **No second Netlify site** — auth/dashboard built as static HTML in Fitclan-website, NOT in a separate React deployment
2. **No aurora glow, no ambient orbs** — both removed (user: orbs "look vibecoded"). Background is the topographic contour layer (see Background Design System). Do NOT reintroduce orbs.
4. **Footer logo glitch removed** — was scrambling "FitClan" to random chars on hover; removed from `main.js`
5. **Conquest map** — real Leaflet map, not placeholder hex tiles
6. **Signup fields** — name, email, password, fitness source ONLY (no DOB/gender)

---

## Pending Manual Steps (User must do)

1. **Push to GitHub** via GitHub Desktop (cannot push from CLI)
2. **Supabase Redirect URLs** — Add these in Authentication → URL Configuration → Redirect URLs:
   - `https://fitclan.ca/dashboard.html`
   - `https://fitclan.ca/reset-password.html`
3. **Netlify** will auto-deploy once pushed

---

## CRITICAL: Email Setup (Supabase)

The Supabase **free email service is rate-limited to 3 emails/hour**. If signups fail with "Error sending confirmation email":

### Option 1 (Production-ready): Configure custom SMTP
- Supabase Dashboard → **Authentication → Emails → SMTP Settings**
- Plug in: **Resend** (free 3,000/mo, easiest) or **SendGrid** (free 100/day)
- For Resend: get an API key at resend.com, then in Supabase set:
  - Host: `smtp.resend.com`
  - Port: `465`
  - User: `resend`
  - Pass: `<your_resend_api_key>`
  - Sender email: `noreply@fitclan.ca` (must verify the domain on Resend)

### Option 2 (Testing): Disable email confirmation
- Supabase Dashboard → **Authentication → Sign In / Providers → Email**
- Toggle off "Confirm email"
- Users sign in immediately without verification (only for testing)

### Option 3: Wait 1 hour for rate limit to reset

---

## Dashboard Color Variables

```css
--teal:   hsl(159, 93%, 50%)   /* primary accent */
--blue:   hsl(217, 91%, 60%)   /* secondary */
--coral:  hsl(0, 100%, 71%)    /* error/delete */
--bg:     hsl(240, 3%, 7%)     /* darkest background */
--bg2:    hsl(240, 3%, 9%)     /* cards */
--bg3:    hsl(240, 3%, 12%)    /* hover states */
--bg4:    hsl(240, 3%, 16%)    /* progress bars */
--text:   hsl(0, 0%, 96%)      /* primary text */
--muted:  hsl(0, 0%, 55%)      /* secondary text */
--border: hsl(240, 3%, 18%)    /* borders */
--sidebar: 240px               /* sidebar width */
```

---

## Common Mistakes to Avoid

- Never use bare `supabase` CLI — always `npx supabase`
- Never use `{r}` in Leaflet tile URLs (react-leaflet only)
- Never use `import` statements in dashboard/login/signup HTML — they use CDN scripts
- The `supabase` global from CDN exposes `{ createClient }` on `window.supabase`
- dashboard.html, login.html, signup.html are all in the ROOT of Fitclan-website (not a subdirectory)
