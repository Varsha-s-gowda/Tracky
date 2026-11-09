# Tracky AI

Tracky AI is a full-stack daily productivity and habit tracking platform. This repository contains **Part 1: the foundation and core application** — a production-quality base with real authentication, persistent user-scoped data, task and habit management, a live dashboard, and a monthly calendar.

Analytics, Achievements, and the AI Coach are intentionally placeholders for Parts 2 and 3.

---

## Overview

- **Frontend:** React 18 + Vite + Tailwind CSS, React Router, Axios, Recharts, Lucide icons
- **Backend:** Node.js + Express + MongoDB + Mongoose, JWT auth, bcrypt password hashing
- **Design:** Responsive light/dark UI, premium design system, loading, empty, and error states throughout

Every dashboard number, task, habit, and calendar entry in the app comes from the API and is scoped to the signed-in user.

---

## Part 1 features

### Authentication
- Register, login, logout, and protected routes
- JWT-based sessions (`Authorization: Bearer <token>`)
- Passwords hashed with bcrypt (cost 12) and never returned by the API
- Profile update, password change, forgot password, and reset password
- Client-side and server-side validation with meaningful error messages

### Tasks
- Full CRUD with completion and undo
- Priority (low / medium / high), due date, due time, category, and tags
- Recurrence: none, daily, weekly, monthly
- Recurring tasks generate exactly one next occurrence (no duplicates) when completed
- Filter by status and priority, search by title / description / category / tags, sort by due date, priority, or creation date

### Habits
- Full CRUD for daily habits and weekly habits on selected weekdays
- Target amount and unit (for example, 20 minutes)
- Completion and undo for any calendar date
- Historical `HabitLog` records with a unique `{ userId, habitId, date }` index
- Repeating completion requests safely upsert the same log instead of duplicating it

### Dashboard
- Timezone-aware greeting, date, and daily motivation
- Four real productivity cards: tasks today, completed, pending, daily completion
- Today's tasks with complete / edit / delete
- Today's habits with quick completion
- Upcoming tasks for the next seven days
- Daily progress ring and task / habit breakdown

### Calendar
- Monthly grid showing tasks, completed tasks, and habit check-ins
- Select any day to inspect its tasks and habits
- Month navigation and "Today" shortcut

### Application shell
- Responsive sidebar with Dashboard, My Tasks, My Habits, Calendar, placeholders (Analytics, AI Coach, Achievements), Settings, and Logout
- Light/dark theme with persisted preference
- Profile and Settings pages
- Landing, login, register, forgot password, reset password, and 404 pages
- Toast notifications, modals, confirm dialogs, skeletons, empty states, and error states

---

## Project structure

```text
tracky/
├── backend/
│   ├── config/            # Environment config and MongoDB connection
│   ├── controllers/       # HTTP request/response handlers
│   ├── middleware/        # JWT auth, 404, centralized error handling
│   ├── models/            # User, Task, Habit, HabitLog (Mongoose)
│   ├── routes/            # Auth, tasks, habits, dashboard, calendar
│   ├── services/          # Business logic, recurrence, aggregation
│   ├── utils/             # Date/timezone helpers, validation, ApiError
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/    # UI primitives and feature components
│   │   ├── context/       # Auth, theme, toast providers
│   │   ├── hooks/
│   │   ├── layouts/       # Protected app shell
│   │   ├── pages/         # Dashboard, tasks, habits, calendar, auth, etc.
│   │   ├── services/      # Axios API clients
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB 6 or newer, running locally or a MongoDB Atlas connection string
- npm

### 1. Clone and install

```bash
cd tracky

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Backend — copy `backend/.env.example` to `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tracky_ai
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
JWT_REMEMBER_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
```

Frontend — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Use a long random value for `JWT_SECRET` in production (for example, `openssl rand -hex 32`). Never commit real `.env` files.

### 3. Start MongoDB

If MongoDB is installed locally, make sure the service is running and listening on `127.0.0.1:27017` (or update `MONGO_URI`).

### 4. Run the backend

```bash
cd backend
npm run dev      # node --watch server.js
# or
npm start
```

The API starts at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

### 5. Run the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`, register an account, and start creating tasks and habits.

### Production build

```bash
cd frontend
npm run build
npm run preview
```

The backend can be run with `NODE_ENV=production npm start` behind a process manager or container. Serve the built frontend with any static host and point `VITE_API_URL` at the deployed API.

---

## API reference

Base URL: `http://localhost:5000/api`

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

Errors use a consistent shape:

```json
{ "message": "Human-readable error", "errors": { "field": "Specific message" } }
```

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create an account and return a JWT |
| POST | `/auth/login` | Authenticate and return a JWT |
| GET | `/auth/me` | Current user profile |
| PUT | `/auth/profile` | Update name, timezone, or profile image |
| PUT | `/auth/password` | Change password |
| POST | `/auth/forgot-password` | Request a password reset token |
| POST | `/auth/reset-password/:token` | Reset password with a token |

### Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/tasks` | List tasks. Query: `status`, `priority`, `date`, `search`, `sort` |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| PATCH | `/tasks/:id/complete` | Toggle completion (creates the next recurrence once) |
| DELETE | `/tasks/:id` | Delete a task |

### Habits

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/habits` | List habits. Query: `date`, `includeInactive` |
| POST | `/habits` | Create a habit |
| PUT | `/habits/:id` | Update a habit |
| DELETE | `/habits/:id` | Delete a habit and its logs |
| POST | `/habits/:id/log` | Set completion for a date: `{ "date": "YYYY-MM-DD", "completed": true }` |

### Dashboard and calendar

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard/today` | Greeting, stats, today's tasks and habits, upcoming tasks, progress |
| GET | `/calendar?month=YYYY-MM` | Tasks, completed tasks, and habit logs for a month |

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | API and database status |

---

## Data models

### User
`name`, `email` (unique, lowercase), `password` (bcrypt hash, never selected by default), `profileImage`, `timezone`, `resetPasswordTokenHash`, `resetPasswordExpires`, timestamps.

### Task
`userId`, `title`, `description`, `priority`, `category`, `tags`, `dueDate` (UTC midnight date key), `dueTime`, `recurrence`, `status`, `completedAt`, `recurrenceSeriesId`, `generatedFrom`, timestamps.

Indexes:
- `{ userId, dueDate, status }`
- `{ userId, status, priority }`
- Unique partial `{ userId, recurrenceSeriesId, dueDate }` for recurring occurrences

### Habit
`userId`, `name`, `description`, `category`, `frequency` (`daily` / `weekly`), `daysOfWeek` (0–6), `target: { value, unit }`, `isActive`, timestamps.

Index: `{ userId, isActive, createdAt }`

### HabitLog
`userId`, `habitId`, `date` (UTC midnight date key), `completed`, `completedAt`, timestamps.

Indexes:
- Unique `{ userId, habitId, date }` — one record per habit per day
- `{ userId, date, completed }` for calendar and dashboard queries

---

## Date, timezone, and recurrence notes

- Task dates and habit-log dates are stored as **date-only values at UTC midnight** so a calendar day is stable regardless of server timezone.
- The user's `timezone` is used to determine their current local date key for the dashboard, habit scheduling, and default habit logging.
- Weekly habits are scheduled by weekday number: `0` = Sunday through `6` = Saturday.
- Completing a recurring task creates the next occurrence with the same title, description, priority, category, and tags. A unique partial index prevents a duplicate next occurrence from being created by repeated or concurrent completion requests.

---

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm start` | Start the API |
| `backend` | `npm run dev` | Start with Node watch mode |
| `frontend` | `npm run dev` | Start Vite dev server |
| `frontend` | `npm run build` | Production build |
| `frontend` | `npm run preview` | Preview the production build |

---

## Verification performed

- Backend API regression suite: **56 checks passed, 0 failed**, covering auth, validation, protected routes, task CRUD, recurrence deduplication, habit scheduling and logging, dashboard, calendar, user isolation, and password reset.
- Frontend production build succeeds.
- Browser end-to-end run completed with **no console errors and no page errors**, covering registration, task creation with recurrence, habit creation and completion, task completion, calendar, settings, light/dark themes, and mobile layout.
- `npm audit` reports zero vulnerabilities for both packages.

---

## Security notes

- Passwords are hashed with bcrypt and removed from every JSON response.
- JWT-protected middleware scopes all task, habit, dashboard, and calendar queries by `userId`.
- Update and delete operations verify ownership before modifying data.
- CORS is restricted to the configured `CLIENT_URL`.
- `x-powered-by` is disabled; JSON request bodies are limited to 1 MB.
- Validation is applied on both client and server.

---

## Known limitations and next steps

- **Analytics, Achievements, and AI Coach** are placeholders for Parts 2 and 3.
- **Forgot password does not send email yet.** In development the API returns a reset token/link so the flow can be tested. Production must add email transport and must never expose the token in the response.
- Email addresses cannot be changed from the profile page.
- Notifications, offline support, exports, and integrations are out of scope for Part 1.

The codebase is structured so Parts 2 and 3 can add analytics, achievements, and AI features without restructuring the API, data models, or application shell.
