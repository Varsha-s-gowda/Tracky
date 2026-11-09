# Tracky AI

Tracky AI is a full-stack AI productivity coach and habit tracker built across three parts:

- **Part 1 — Foundation:** authentication, tasks, habits, dashboard, calendar, settings, profile, responsive app shell.
- **Part 2 — Momentum:** streaks, productivity scoring, analytics, heatmaps, XP, levels, and achievements.
- **Part 3 — AI coach:** data-grounded insights, AI reports, AI task planning, context-aware chat, notifications, personalization, data export, and account deletion.

All analytics, insights, reports, and coach context are calculated from the signed-in user's real MongoDB records. There is no mock analytics and no fabricated AI output.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, Tailwind CSS, React Router, Axios, Recharts, Lucide |
| Backend | Node.js 18+, Express 4, MongoDB, Mongoose 8, JWT, bcrypt |
| AI | Google Gemini or OpenAI through one server-side provider abstraction |
| Deployment target | Vercel (frontend), Render (API), MongoDB Atlas (database) |

---

## Architecture

```text
React SPA (Vercel)
  │  Axios + Bearer JWT
  ▼
Express API (Render)
  ├── authMiddleware ──► user-scoped controllers
  ├── rate limiting (global / auth / AI)
  ├── deterministic services
  │     ├── productivityService  (scores, analytics, heatmap)
  │     ├── streakService        (habit + overall streaks)
  │     ├── rewardsService       (XP, levels, achievements)
  │     ├── insightService       (strengths, risks, recommendations)
  │     ├── reportService        (daily/weekly reports from real data)
  │     └── notificationService  (reminders, dedupe, report sync)
  └── aiProviderService ──► Gemini / OpenAI (server key only)
  ▼
MongoDB Atlas
  ├── core: User, UserSettings, Task, Habit, HabitLog
  ├── momentum: DailyProductivity, XPTransaction, Achievement, UserAchievement
  └── AI: AIReport, ChatConversation, ChatMessage, Notification
```

Frontend entry points:

- `/dashboard` — live stats, tasks, habits, momentum, AI coach card
- `/tasks`, `/habits`, `/calendar`
- `/streaks`, `/analytics`, `/achievements`
- `/coach` — Overview, Reports, Planner, Chat tabs
- `/notifications` — notification centre
- `/settings`, `/profile`

---

## Part 3 features

### AI coach overview
- Reads the user's real completed and missed tasks, habit history and streaks, productivity scores, weekly/monthly performance, overdue and frequently postponed work, goals, and working hours.
- Produces strengths, weak spots, best/least productive weekdays, pending high-priority tasks, upcoming streak milestones, and prioritised next actions.
- Uses a 60-second server-side context cache for prompts; cache entries are invalidated immediately after task, habit, settings, goal, profile, planner, or account mutations.

### Daily and weekly reports
- Reports are built deterministically from real task, habit, streak, XP, achievement, and score records.
- Saved per user with a unique `{ userId, type, periodKey }` index, so history is stable and regenerating updates the same report.
- Optional AI narrative is added only when the provider is configured and succeeds. On failure the report remains complete with `aiStatus: failed` and no invented text.
- Report UI includes numeric tiles, a score ring, charts, sections, recommendations, history, and deletion.

### AI task planner
- Converts a goal, deadline, and available daily minutes into a reviewable plan.
- Uses the user's workload, working hours, goals, and habits as context.
- Only tasks explicitly selected and approved by the user are written to MongoDB.
- Requires a configured provider; without one the UI shows an honest not-configured state and links to manual task creation.

### Context-aware AI chat
- Conversations and messages are persisted only after a successful provider response.
- Chat prompt is grounded in the authenticated user's real context and coach tone/detail preferences.
- Conversation history is per user with strict `userId` scoping; loading, empty, error, and retry states are implemented.
- Requires a configured provider; no fake replies are generated.

### Smart recommendations
- Real signals: best and least productive weekdays, frequently missed habits, streak milestones within reach, pending high-priority work, delayed tasks, and weekly score movement.
- Recommendations link directly to the relevant workspace page.

### Notifications
- Types: task reminder, pending priority, habit reminder, streak milestone, achievement, daily goal, daily report, weekly report, system.
- Read/unread state, mark one read, mark all read, delete one, clear all.
- Per-type preferences (tasks, habits, streak milestones, daily goal, daily/weekly reports, browser notifications).
- Dedupe keys prevent duplicate reminders. Cleared/deleted notifications are tombstoned so a later sync cannot recreate them.
- Browser notifications are opt-in only and require the Notification API permission.
- The bell in the top bar and the sidebar badge show the live unread count; the centre refreshes on open and every 60 seconds while visible.

### Profile and personalization
- Name, profile image URL, timezone.
- Personal goals: add, complete/reopen, delete; included in coach and planner context.
- Working hours and working days; used by the planner.
- AI coach tone (`supportive`, `direct`, `analytical`) and detail level (`concise`, `detailed`).
- Notification and reminder preferences.
- Theme (light/dark/system) with persistence.
- Password change.
- Full account data export as JSON.
- Account deletion guarded by password plus the exact confirmation text `DELETE`; all user records are cascaded.

---

## Project structure

```text
tracky/
├── backend/
│   ├── config/            # env, MongoDB connection
│   ├── controllers/       # auth, tasks, habits, dashboard, calendar, analytics,
│   │                      # streaks, achievements, xp, productivity, settings,
│   │                      # ai, notifications, account
│   ├── middleware/        # JWT auth, rate limiting, 404 + error handling
│   ├── models/            # all Mongoose schemas
│   ├── routes/            # one router per domain
│   ├── services/          # business logic, scoring, streaks, rewards, AI,
│   │                      # insights, reports, chat, planner, notifications
│   ├── utils/             # date/timezone helpers, validation, ApiError
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/    # UI primitives + ai/, dashboard/, tasks/, habits/, layout/
│   │   ├── context/       # Auth, Settings, Theme, Toast, Notifications
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   ├── vercel.json        # SPA rewrite for client-side routing
│   └── vite.config.js     # dev server on port 5174
├── render.yaml            # Render web-service blueprint
├── PART3_REPORT.md        # Part 3 architecture, audit, and test report
└── README.md
```

---

## Local setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB 6+ locally, or a MongoDB Atlas connection string

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend environment

Copy `backend/.env.example` to `backend/.env` and set at minimum:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tracky_ai
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

To enable AI chat, planning, and narrative reports, also set one provider:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
# or
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
```

`AI_PROVIDER` can be omitted; the server infers it from whichever key is present. Keys are read only by the backend and are never returned by the API or embedded in the frontend bundle.

### 3. Frontend environment

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5174`. Health check: `GET http://localhost:5000/api/health`.

### 5. Production build

```bash
cd frontend
npm run build
npm run preview
```

---

## Environment variables

### Backend

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables strict JWT length checks |
| `PORT` | `5000` | API port |
| `MONGO_URI` | local MongoDB | Local or Atlas connection string |
| `JWT_SECRET` | required | Signing secret; 32+ chars in production |
| `JWT_EXPIRES_IN` | `7d` | Standard session lifetime |
| `JWT_REMEMBER_EXPIRES_IN` | `30d` | “Remember me” lifetime |
| `RESET_TOKEN_TTL_MINUTES` | `60` | Password reset token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated CORS allowlist |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Global fixed window |
| `RATE_LIMIT_MAX` | `600` | Global requests per window |
| `AUTH_RATE_LIMIT_MAX` | `50` | Auth requests per 15 minutes |
| `AI_RATE_LIMIT_MAX` | `30` | AI requests per minute |
| `AI_PROVIDER` | inferred | `gemini`, `openai`, or empty |
| `GEMINI_API_KEY` | empty | Gemini server key |
| `OPENAI_API_KEY` | empty | OpenAI server key |
| `AI_MODEL` | `gemini-2.0-flash` / `gpt-4o-mini` | Model override |
| `AI_BASE_URL` | provider default | Self-hosted / compatible endpoint |
| `AI_TIMEOUT_MS` | `30000` | Provider request timeout |
| `AI_MAX_MESSAGES` | `20` | Chat history messages sent to the model |

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL including `/api` |

Never commit real `.env` files. `.gitignore` ignores `.env`, `.env.local`, and `.env.*.local` while allowing `.env.example`.

---

## Data models

### Core

- **User** — `name`, `email` (unique, lowercase), `password` (bcrypt, excluded by default), `profileImage`, `timezone`, `goals[]` (`title`, `description`, `targetDate`, `status`), `workingHours` (`start`, `end`, `daysOfWeek`), reset-token fields, timestamps.
- **UserSettings** — one per user: `dailyCompletionTarget`, `weeklyGoals`, `notifications` (12 preferences), `coachTone`, `coachDetail`.
- **Task** — `userId`, `title`, `description`, `priority`, `category`, `tags`, `dueDate`, `dueTime`, `recurrence`, `status`, `completedAt`, `postponeCount`, `lastPostponedAt`, `recurrenceSeriesId`, `generatedFrom`, timestamps.
- **Habit** — `userId`, `name`, `description`, `category`, `frequency`, `daysOfWeek`, `target`, `isActive`, timestamps.
- **HabitLog** — `userId`, `habitId`, date-only `date`, `completed`, `completedAt`, timestamps.

### Momentum

- **DailyProductivity** — per-user daily `score`, `target`, `successful`, `hasActivity`, `status`, task/habit counts, weighted `breakdown`.
- **XPTransaction** — server-created XP event with a unique per-user `dedupeKey`.
- **Achievement** — seeded catalogue (`key`, tier, criteria type/value, icon, etc.).
- **UserAchievement** — unlocked achievement per user with `unlockedAt`.

### AI and engagement

- **AIReport** — `userId`, `type` (`daily`/`weekly`), `periodKey`, range, title, summary, sections, recommendations, metrics, insights, `source` (`rules`/`ai`), `aiStatus`, `aiError`, model, `generatedAt`.
- **ChatConversation** — `userId`, title, message count, last-message preview/time.
- **ChatMessage** — `userId`, `conversationId`, `role` (`user`/`assistant`), content, model, metadata.
- **Notification** — `userId`, type, title, body, link, unique `dedupeKey`, `readAt`, `dismissedAt`, timestamps.

Important indexes:

- `Task`: `{ userId, dueDate, status }`, `{ userId, status, priority }`, unique partial recurring occurrence index.
- `HabitLog`: unique `{ userId, habitId, date }`, `{ userId, date, completed }`.
- `DailyProductivity`: unique `{ userId, date }`, unique `{ userId, dateKey }`.
- `XPTransaction`: unique `{ userId, dedupeKey }`.
- `AIReport`: unique `{ userId, type, periodKey }`, `{ userId, generatedAt }`.
- `ChatConversation`: `{ userId, lastMessageAt }`.
- `ChatMessage`: `{ conversationId, createdAt }`, `{ userId, createdAt }`.
- `Notification`: unique `{ userId, dedupeKey }`, `{ userId, dismissedAt, readAt, createdAt }`.

---

## API reference

Base URL: `/api`. All endpoints except auth registration/login/password reset and health require:

```http
Authorization: Bearer <jwt>
```

Errors use:

```json
{ "message": "Human-readable error", "details": { "code": "OPTIONAL_CODE" } }
```

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create account and return JWT |
| POST | `/auth/login` | Authenticate and return JWT |
| GET | `/auth/me` | Current user (includes goals and working hours) |
| PUT | `/auth/profile` | Update name, timezone, profile image |
| PUT | `/auth/password` | Change password |
| POST | `/auth/forgot-password` | Request a reset token |
| POST | `/auth/reset-password/:token` | Reset password |

### Tasks and habits

| Method | Endpoint | Description |
| --- | --- | --- |
| GET/POST | `/tasks` | List / create tasks (`status`, `priority`, `date`, `search`, `sort`) |
| PUT | `/tasks/:id` | Update task (tracks postponements) |
| PATCH | `/tasks/:id/complete` | Complete/undo; creates next recurrence once |
| DELETE | `/tasks/:id` | Delete task |
| GET/POST | `/habits` | List / create habits |
| PUT | `/habits/:id` | Update habit |
| DELETE | `/habits/:id` | Delete habit and logs |
| POST | `/habits/:id/log` | Set completion for a date |

### Dashboard, calendar, momentum

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard/today` | Greeting, stats, today's items, upcoming, progress |
| GET | `/calendar?month=YYYY-MM` | Tasks and habit logs for a month |
| GET | `/streaks/overview` | Overall streak summary and history |
| GET | `/streaks/:habitId` | Per-habit streak detail |
| GET | `/analytics/daily?range=` | Daily analytics |
| GET | `/analytics/weekly?range=` | Weekly analytics |
| GET | `/analytics/monthly?range=` | Monthly analytics |
| GET | `/analytics/heatmap?scope=&year=&month=` | Heatmap data |
| GET | `/productivity/score?date=` | Daily productivity score |
| GET | `/xp` | XP total, level, history, levels |
| GET | `/achievements` | Achievement catalogue with unlock state |

### Settings

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/settings` | Read user settings (created on demand) |
| PUT | `/settings` | Update targets, notifications, coach preferences |

### AI coach

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/ai/status` | Provider configuration and feature flags |
| GET | `/ai/insights` | Deterministic coach overview |
| GET | `/ai/reports` | List saved reports |
| POST | `/ai/reports/daily` | Generate/update a daily report (`date`, `useAI`) |
| POST | `/ai/reports/weekly` | Generate/update a weekly report (`weekStart`, `useAI`) |
| GET | `/ai/reports/:id` | Report detail |
| DELETE | `/ai/reports/:id` | Delete report |
| POST | `/ai/planner/plan` | Generate a plan (`goal`, `deadline`, `dailyMinutes`) |
| POST | `/ai/planner/save` | Save only user-approved tasks |
| GET/POST | `/ai/chat/conversations` | List / create conversations |
| GET/DELETE | `/ai/chat/conversations/:id` | Read / delete a conversation |
| POST | `/ai/chat/conversations/:id/messages` | Send a message |
| POST | `/ai/chat/messages` | Send without an existing conversation |

### Notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/notifications?unread=true&limit=` | List notifications (syncs reminders) |
| GET | `/notifications/unread-count` | Unread count |
| PATCH | `/notifications/:id/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Dismiss one (tombstoned) |
| DELETE | `/notifications` | Dismiss all (tombstoned) |

### Account

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/account` | Account profile with goals/hours |
| POST | `/account/goals` | Add goal |
| PUT | `/account/goals/:goalId` | Update goal |
| DELETE | `/account/goals/:goalId` | Delete goal |
| PUT | `/account/working-hours` | Update hours and working days |
| GET | `/account/export` | Download all user data as JSON |
| DELETE | `/account` | Delete account (`password` + `confirm: "DELETE"`) |

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Service, database, and AI configuration status |

---

## AI integration

- **One abstraction:** `services/aiProviderService.js` supports Gemini and OpenAI with JSON and text generation, timeouts, and provider-specific error mapping.
- **Configuration:** `AI_PROVIDER` plus `GEMINI_API_KEY` or `OPENAI_API_KEY`. Missing credentials produce HTTP `503` with `code: "AI_NOT_CONFIGURED"`.
- **Structured output:** planner and narrative requests use JSON mode where supported; responses are extracted and validated before use. Invalid structured output returns `502 AI_INVALID_RESPONSE` and is never persisted.
- **Error handling:** auth failure (`AI_AUTH_FAILED`), provider rate limit (`AI_RATE_LIMITED` / 429), timeout (`AI_TIMEOUT` / 504), empty response (`AI_EMPTY_RESPONSE`), and unreachable provider (`AI_UNREACHABLE`) all surface as actionable UI states.
- **No fabrication:** deterministic reports and insights work without AI. AI only adds narrative or plans; all metrics remain database-derived.
- **Context:** tasks, habits, streaks, scores, goals, working hours, and postponements, with a short cache invalidated after writes.
- **Privacy:** prompts are built server-side from the authenticated user's records only. No key or raw provider payload is exposed to the client.

---

## Security and performance

- JWT middleware on every user-data route; every query and mutation is scoped by `userId`.
- Ownership checks return `404` for another user's records.
- bcrypt password hashing (cost 12); passwords and reset tokens are never returned.
- Consistent server-side validation with field-level errors.
- CORS allowlist from `CLIENT_URL`; `x-powered-by` disabled.
- JSON body limit of 1 MB.
- Global, auth, and AI rate limits with standard rate-limit headers.
- Account deletion requires password plus exact `DELETE` confirmation and cascades all records.
- Data export is scoped to one user.
- AI keys are backend-only and never sent to the browser.
- Query indexes cover analytics, heatmaps, tasks, habit logs, reports, chat, and notifications.
- AI context caching avoids repeated aggregation during chat/planning, while mutation invalidation keeps insights fresh.
- Frontend uses route guards, skeletons, empty/error states, confirm dialogs, toasts, keyboard-accessible controls, and reduced horizontal overflow at mobile widths.

---

## Testing and verification

Re-verified in this working tree:

| Suite | Result |
| --- | --- |
| Part 1 API regression | **56 / 56 passed** |
| Part 3 API smoke (86 checks) | **86 / 86 passed** |
| Playwright Part 2 browser suite | **36 / 36 passed** |
| Playwright Part 3 browser suite | **68 / 68 passed** |
| Frontend production build | **Passed** (`vite build`) |

Part 3 coverage includes registration, dashboard AI card, coach tabs, insights, daily/weekly report generation and deletion, planner and chat not-configured states, notification generation/dedupe/read/delete/clear, settings persistence, goals, working hours, JSON export, deletion confirmation, cross-user isolation, and mobile overflow on the new pages.

AI provider plumbing is tested for missing credentials and deterministic fallback. Live Gemini/OpenAI calls were not executed in this environment because no API key is available; see `PART3_REPORT.md` for the exact limitation.

---

## Deployment

No deployment has been performed from this workspace. The configuration below is prepared but unverified against live cloud accounts.

### 1. MongoDB Atlas

1. Create a cluster and a database user with read/write access.
2. Create a database named `tracky_ai`.
3. Allow network access from Render (or temporarily `0.0.0.0/0` during setup).
4. Copy the connection string and append the database name:
   ```text
   mongodb+srv://<user>:<password>@<cluster>/tracky_ai?retryWrites=true&w=majority
   ```
5. Mongoose creates collections and indexes on first use; achievement seeding runs at API startup.

### 2. Render backend

1. Create a **Web Service** from the repository, or apply `render.yaml`.
2. Root directory: `backend`; build: `npm ci`; start: `npm start`.
3. Health check path: `/api/health`.
4. Set environment variables:
   - `NODE_ENV=production`
   - `MONGO_URI=<Atlas connection string>`
   - `JWT_SECRET=<32+ random characters>`
   - `CLIENT_URL=https://<your-vercel-app>.vercel.app`
   - optionally `AI_PROVIDER`, `GEMINI_API_KEY` or `OPENAI_API_KEY`, `AI_MODEL`
5. Deploy and confirm `/api/health` reports `database: connected`.

### 3. Vercel frontend

1. Import the repository and set the root directory to `frontend`.
2. Framework preset: Vite. Build: `npm run build`. Output: `dist`.
3. Set `VITE_API_URL=https://<your-render-service>.onrender.com/api`.
4. Deploy. `frontend/vercel.json` rewrites SPA routes to `index.html`.
5. Add the final Vercel URL to the backend `CLIENT_URL` and redeploy the API.

### Post-deploy checklist

- `GET /api/health` returns `status: ok`, `database: connected`, and the expected AI provider.
- Register, create a task and habit, complete them, and verify the dashboard updates.
- Generate a daily and weekly report; check report history.
- If AI keys are set, verify `/ai/status` shows `configured: true`, then test chat and planning.
- Confirm the browser origin is accepted by CORS and no secret appears in frontend build output.

---

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm start` | Start API |
| `backend` | `npm run dev` | Start with Node watch mode |
| `frontend` | `npm run dev` | Vite dev server on port 5174 |
| `frontend` | `npm run build` | Production build |
| `frontend` | `npm run preview` | Preview production build |

---

## Known limitations

- **Live AI not verified locally.** No Gemini/OpenAI key was available. Missing-key behavior, deterministic reports, and UI fallbacks are tested; live provider latency and model output should be verified after adding a key.
- **Password reset does not send email.** Development returns a reset token so the flow can be tested. Production needs an email transport and must not return the token.
- **Email address changes are not supported** from the profile UI.
- **Rate limiting is in-memory per process.** It is best-effort on multi-instance hosts; a shared store would be needed for a strict global quota.
- **Browser notifications depend on browser permission** and only fire while the app is open/polling; they are not push notifications from a service worker.
- **AI context is cached for 60 seconds** for prompts; mutation endpoints invalidate it, but a second API instance would need a shared cache for perfect consistency.
- Deployment configs are prepared but not applied to real Vercel/Render/Atlas accounts.
