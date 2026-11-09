# Tracky AI — Part 3 Final Report

**Scope:** AI productivity coach, AI reports, task planner, smart recommendations, AI chat, notifications, profile/personalization, UI polish, security/performance audit, testing, and deployment preparation. Parts 1 and 2 remain intact.

**Status:** Complete in the working tree. All automated suites pass. No cloud deployment was performed, and live Gemini/OpenAI calls were not verified because no provider key is available in this environment.

---

## 1. Architecture

```text
React + Vite SPA (Vercel)
  │  Axios, Bearer JWT, React Router
  ▼
Express API (Render)
  ├── authMiddleware (JWT → req.user)
  ├── rate limiters: global / auth / AI
  ├── controllers → services → Mongoose
  │     ├── productivityService, streakService, rewardsService
  │     ├── insightService, reportService
  │     ├── chatService, plannerService
  │     ├── notificationService, accountService
  │     └── aiProviderService (Gemini / OpenAI)
  ▼
MongoDB Atlas
  ├── User, UserSettings, Task, Habit, HabitLog
  ├── DailyProductivity, XPTransaction, Achievement, UserAchievement
  └── AIReport, ChatConversation, ChatMessage, Notification
```

Design rules enforced throughout:

1. **User isolation:** every query and mutation is scoped by `userId` from the verified JWT.
2. **Real data only:** metrics are computed from MongoDB records. AI adds narrative or plans but never invents analytics.
3. **Honest degradation:** without an AI key, reports and insights still work; chat and planning return `503 AI_NOT_CONFIGURED` and the UI explains why.
4. **Approval before persistence:** planner tasks are saved only after explicit user selection.
5. **No secrets in the browser:** provider keys are read only by the backend.

---

## 2. Modules delivered

### Backend

| Module | Purpose |
| --- | --- |
| `aiProviderService` | Gemini/OpenAI abstraction, JSON extraction, timeout, error mapping |
| `aiContextService` | User-scoped coach context and 60-second prompt cache |
| `insightService` | Strengths, weaknesses, recommendations, weekday analysis, milestones, pending priorities |
| `reportService` | Deterministic daily/weekly reports plus optional AI narrative |
| `plannerService` | Structured goal-to-plan generation and approved-task creation |
| `chatService` | Conversation persistence, context-aware prompts, user isolation |
| `notificationService` | Reminder generation, dedupe, tombstones, report sync, achievement notices |
| `accountService` | Goals, working hours, JSON export, guarded account deletion |
| `rateLimit` | Dependency-free fixed-window limiter with headers |
| Models | `AIReport`, `ChatConversation`, `ChatMessage`, `Notification`; extended `User`, `Task`, `UserSettings` |

### Frontend

| Module | Purpose |
| --- | --- |
| `NotificationContext` | 60s polling, unread count, read/clear actions, browser permission |
| `/coach` (`AICoachPage`) | Overview / Reports / Planner / Chat tabs with query-param deep links |
| `InsightOverview` | Real stats, strengths, risks, recommendations, weekday and milestone cards |
| `ReportsPanel` | Generate, view, chart, delete daily/weekly reports |
| `PlannerPanel` | Goal form, editable plan review, selective save |
| `ChatPanel` | Conversation list, message history, loading/error states, disabled offline state |
| `AICoachCard` | Dashboard summary card linked to the coach |
| `/notifications` | Filters, read state, delete/clear, browser opt-in, refresh on open |
| `ProfilePage` | Goals, working hours, export, password + `DELETE` account deletion modal |
| `SettingsPage` | Reminder/report/browser toggles, coach tone/detail |
| Navigation | Live notification bell and sidebar unread badges; removed “Soon” placeholder |

---

## 3. Data model summary

- **User:** `name`, `email`, `password`, `profileImage`, `timezone`, `goals[]`, `workingHours`, reset-token fields.
- **UserSettings:** daily target, weekly goals, 12 notification preferences, `coachTone`, `coachDetail`.
- **Task:** all Part 1 fields plus `postponeCount`, `lastPostponedAt`.
- **Habit / HabitLog:** unchanged from Part 1, indexed for scheduling and history.
- **DailyProductivity:** daily score, target, success state, task/habit counts, weighted breakdown.
- **XPTransaction / Achievement / UserAchievement:** server-computed XP and unlocks.
- **AIReport:** type, period key, range, summary, sections, recommendations, metrics, insights, source, AI status/error, model, generated time.
- **ChatConversation / ChatMessage:** user-scoped history with previews and per-message metadata.
- **Notification:** type, title/body/link, unique dedupe key, `readAt`, `dismissedAt`.

Key constraints:

- Unique `{ userId, type, periodKey }` on `AIReport`.
- Unique `{ userId, dedupeKey }` on `Notification` and `XPTransaction`.
- Unique `{ userId, habitId, date }` on `HabitLog`.
- User-scoped compound indexes for reports, chat, notifications, analytics, and tasks.

Full endpoint tables are in `README.md`.

---

## 4. AI integration

### Provider configuration

```env
AI_PROVIDER=gemini            # or openai, or omit to infer
GEMINI_API_KEY=...            # backend only
OPENAI_API_KEY=...            # backend only
AI_MODEL=...                  # optional override
AI_BASE_URL=...               # optional compatible endpoint
AI_TIMEOUT_MS=30000
AI_MAX_MESSAGES=20
```

`GET /api/health` and `GET /api/ai/status` report whether AI is configured. With no key, features resolve to rules-only mode.

### Behavior

- **Insights and reports:** deterministic from real records. `useAI: true` adds narrative only when configured and successful; failures set `aiStatus: "failed"` and keep verified data.
- **Planner:** requires a provider; returns structured tasks/schedule/tips; nothing is written until `/ai/planner/save` receives approved tasks.
- **Chat:** requires a provider; both messages are persisted only after a successful reply.
- **Validation:** invalid structured output becomes `502 AI_INVALID_RESPONSE`; empty responses, timeouts, auth failures, rate limits, and unreachable providers map to explicit error codes.
- **Privacy:** prompts contain only the authenticated user's data; keys and raw provider payloads never reach the client.

### Limitation

No real key was available, so live model quality/latency was not verified. The deterministic path, missing-key path, and UI states were fully exercised.

---

## 5. Security and performance audit

### Verified controls

- JWT required on all user-data routes; expired/invalid tokens rejected.
- Every task, habit, report, conversation, goal, notification, and export operation is scoped by authenticated `userId`.
- Cross-user reads/updates/deletes return `404` rather than leaking existence.
- bcrypt hashing; password fields excluded from serialization.
- Input validation on every new endpoint (dates, times, weekdays, enums, lengths, IDs).
- Account deletion requires the current password plus exact `DELETE`.
- CORS restricted to the configured origin list; `x-powered-by` disabled.
- AI keys backend-only; health/status endpoints expose only configured/provider/model.
- Rate limits: 600/min global, 50/15min auth, 30/min AI (configurable).
- 1 MB JSON body limit.
- Data export excludes other users and cleared notifications.

### Performance

- Compound and unique indexes cover all high-traffic queries.
- AI context is cached for 60 seconds for prompts.
- Mutations immediately invalidate that cache (tasks, habits, settings, goals, working hours, profile, planner saves, account deletion) so insights and notifications are fresh.
- Analytics and reports aggregate in the service layer and return only the required shape.
- Frontend lazy state handling avoids duplicate requests; notification polling pauses when the tab is hidden.

### Issues found and fixed during the audit

1. **Stale AI context:** insights served cached data for up to 60s after writes. Added `clearContextCache` to all mutation controllers.
2. **Cleared notifications reappearing:** deleting rows removed dedupe keys, so the next sync recreated them. Added `dismissedAt` tombstones; list/unread/export exclude them and sync cannot recreate them.
3. **Stale notification centre on open:** the page relied on the 60s poll. Added a refresh-on-mount.
4. **Build import errors:** corrected relative `FormAlert` imports in three AI components.
5. **E2E selector ambiguity:** dashboard “Overall streak” matched AI card copy; tests now use exact matching. This confirmed the AI card is genuinely rendered.

---

## 6. Testing results

| Suite | Command | Result |
| --- | --- | --- |
| Part 1 API regression | `node tracky-api-test.mjs` | **56 / 56 passed** |
| Part 3 API smoke | `node tracky-part3-smoke.mjs` | **86 / 86 passed** |
| Part 2 browser E2E | `node pwtest/e2e.mjs` | **36 / 36 passed** |
| Part 3 browser E2E | `node pwtest/e2e-part3.mjs` | **68 / 68 passed** |
| Frontend production build | `npm run build` | **Passed** |

Part 3 API coverage:

- health and AI status; registration; auth isolation
- empty and populated insights; real completed task/habit counts; weekday analysis
- settings persistence and invalid coach preference rejection
- goal CRUD; working-hours validation; auth payload includes both
- task postponement tracking; approved planner saves; empty-plan rejection
- daily/weekly report creation, real metrics, list/detail, future-date rejection
- chat `503` without provider; conversation create/read; empty list before success
- notification generation, dedupe, unread counts/filter, mark read, mark all, delete, clear, no resurrection
- export contents; cross-user report/goal/conversation/notification isolation
- deletion password/confirmation guards; token rejection after deletion

Part 3 browser coverage:

- registration; dashboard AI empty/populated states; live unread badge
- coach tabs and all overview sections
- daily report generation, chart, weekly report, history, deletion
- planner/chat honest offline states with disabled controls
- notifications: achievement/reminder rendering, mark all, unread filter, delete one, clear all, persistence after reload
- 7 new preference toggles and coach tone/detail persistence
- goal add/complete, working-hours save, JSON export download, deletion guard
- mobile overflow on coach/report/notification/profile pages
- full UI account deletion and token rejection
- zero console errors and zero uncaught page errors

---

## 7. Setup and deployment

Local setup and all environment variables are documented in `README.md`.

Deployment preparation:

- `frontend/vercel.json` — SPA rewrite.
- `render.yaml` — Render web-service blueprint with backend root, health check, and secret placeholders.
- Backend `.env.example` — MongoDB, auth, CORS, rate limits, and AI provider variables.
- Frontend `.env.example` — API base URL.
- `.gitignore` excludes all real `.env` files and allows `.env.example`.

**Not deployed.** No Vercel/Render/Atlas resources were created and no live URL exists. To deploy, follow README steps and set `CLIENT_URL` to the final Vercel origin.

---

## 8. Known limitations

1. Live Gemini/OpenAI behavior was not exercised (no key). Verify `/ai/status`, chat, planning, and narrative reports after configuring a key.
2. Password reset creates a development token but does not send email.
3. Email address changes are not supported in the profile UI.
4. Rate limiting is in-memory per process; multi-instance deployments need a shared store for a strict global quota.
5. Browser notifications require permission and only work while the app is open and polling; there is no service-worker push.
6. The 60-second AI context cache is per API process; multiple instances would need a shared cache for immediate cross-instance invalidation.
7. Deployment configs are prepared but unverified against real cloud accounts.
