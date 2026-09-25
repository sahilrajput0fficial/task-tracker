# TaskTrack — Full-Stack Task Tracker & User Management System

A full-stack application with a **FastAPI backend** and a **React 19 frontend**, implementing JWT authentication, role-based access control (Admin/User), and complete task CRUD with strict data isolation.

This root README explains the **overall approach, architecture, and design decisions**. Setup/run instructions for each layer live in their own READMEs:
- [`backend/README.md`](./backend/README.md) (or repo root, if backend is not in a subfolder)
- [`frontend/README.md`](./frontend/README.md)

---

## Table of Contents

1. [Problem & Approach](#problem--approach)
2. [Architecture Overview](#architecture-overview)
3. [Key Design Decisions](#key-design-decisions)
4. [Repository Structure](#repository-structure)
5. [Tech Stack](#tech-stack)
6. [Security Model](#security-model)
7. [Testing Strategy](#testing-strategy)
8. [Quick Start](#quick-start)
9. [Possible Future Improvements](#possible-future-improvements)

---

## Problem & Approach

The assignment required a backend system where users can register, log in, and manage their own tasks, with an admin role that can oversee all users and all tasks. I chose to build this as two decoupled layers — a **stateless REST API** (FastAPI) and a **separate SPA client** (React) — rather than a server-rendered monolith, for three reasons:

1. **Separation of concerns** — the API can be evaluated, tested, and consumed independently of any UI (via `curl`/Swagger), which matches how the assignment is graded.
2. **Realistic engineering practice** — most production systems separate the API contract from the client; this mirrors how I'd approach a real assignment at a company that ships a web + mobile client against the same backend.
3. **Security boundaries are clearer** — treating the browser as an untrusted client forced deliberate choices about where tokens live and how refresh works (see [Security Model](#security-model)), rather than relying on server sessions.

The core design principle throughout was **data isolation by default**: every query that touches a `Task` or `User` row is scoped to `current_user.id` unless the caller is an admin. Isolation is enforced at the query layer (not just hidden in the UI), so even a crafted request against the raw API cannot cross user boundaries.

---

## Architecture Overview

```
+----------------------+   JWT (Bearer) + HttpOnly refresh cookie   +------------------------+
|   React 19 (Vite)     | ------------------------------------------> |   FastAPI Backend       |
|   Frontend (SPA)       | <------------------------------------------ |   (REST API)            |
+----------------------+                                             +-----------+------------+
                                                                                    | SQLAlchemy ORM
                                                                                    v
                                                                         +------------------------+
                                                                         |  SQLite / PostgreSQL    |
                                                                         +------------------------+
```

- **Frontend** never talks to the database directly — all state changes go through the API.
- **Backend** is the single source of truth for auth, validation, and authorization; the frontend's route guards (e.g. redirecting non-admins away from `/admin/*`) are a UX convenience, not a security boundary — the real enforcement happens server-side on every request.
- **Database** is swappable via a single `DATABASE_URL` env var (SQLite for local/dev, PostgreSQL for anything resembling production).

---

## Key Design Decisions

| Decision | Reasoning |
| :--- | :--- |
| **JWT (access token) + HttpOnly refresh cookie**, not a single long-lived JWT | A long-lived access token in `localStorage` is a bigger XSS blast radius. Short-lived access token + HttpOnly refresh cookie limits what a script-injection attack can steal, while still avoiding server-side session storage. |
| **Role enforced via dependency injection** (`get_current_user`, `get_current_admin`), not scattered `if` checks | Keeps authorization declarative and centralized — a route either requires admin or it doesn't, and that's visible at the route signature, not buried in business logic. |
| **Ownership checks at the query layer** (`WHERE user_id = current_user.id`), not post-fetch filtering | Prevents a whole class of bugs where data is fetched broadly and "hidden" in the response — the DB never returns another user's row to a non-admin in the first place. |
| **Pydantic v2 schemas separate from ORM models** | Keeps the API's public contract (request/response shape) decoupled from internal DB structure, so the DB can evolve without silently changing the API surface. |
| **Password hashing via argon2-cffi**, not a reversible scheme | Argon2 is the current OWASP-recommended KDF for password storage, more resistant to GPU/ASIC cracking than bcrypt at equivalent settings. |
| **In-memory SQLite for tests** | Tests run fast and are fully isolated from any local dev database — no shared state between test runs, no need to reset a file on disk. |
| **Refresh-promise deduplication on the frontend** | If several API calls 401 simultaneously (e.g. on page load), only one `/auth/refresh` call fires instead of a stampede of concurrent refresh requests racing each other. |

---

## Repository Structure

```
task-tracker/
├── src/                      # Backend source (FastAPI app, routes, models, schemas, services)
├── tests/                    # Backend unit + API tests (pytest)
├── frontend/                 # React 19 + Vite SPA
│   ├── src/                  # Components, API client, routing
│   └── tests/                # Frontend unit/integration tests (Jest + RTL)
├── .env.example               # Backend environment variable template
├── pyproject.toml             # Backend dependencies & pytest config
├── main.py                    # Backend convenience runner
└── README.md                  # This file — overall approach & architecture
```

Each layer (`src/` and `frontend/`) has its own README with detailed setup, run, and test instructions.

---

## Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Backend framework** | FastAPI | Async-first, automatic OpenAPI docs, strong typing via Pydantic |
| **ORM** | SQLAlchemy 2.0 | Mature, explicit, works identically against SQLite and Postgres |
| **Auth** | PyJWT (HS256) + argon2-cffi | Stateless auth; modern, memory-hard password hashing |
| **Validation** | Pydantic v2 | Strict request/response schema enforcement |
| **Backend testing** | pytest + TestClient | Fast, in-memory DB isolation |
| **Frontend framework** | React 19 + Vite | Fast dev server, modern React features (no unnecessary framework weight) |
| **Routing** | React Router v7 | Client-side route guarding for role-based dashboards |
| **Frontend testing** | Jest + React Testing Library | Behavior-driven component and integration tests |

---

## Security Model

1. **Passwords** — never stored in plaintext; hashed with `argon2-cffi` (automatic salting).
2. **Access tokens** — short-lived JWTs (HS256), sent as `Authorization: Bearer <token>`, held in memory/`localStorage` on the client.
3. **Refresh tokens** — delivered as HttpOnly, secure cookies, invisible to JavaScript — mitigates token theft via XSS.
4. **Authorization** — role and ownership checks happen **server-side, per request**, via FastAPI dependencies; the frontend's route guards are UX only.
5. **Secrets** — all configuration (JWT secret, DB URL) comes from environment variables via `.env`, never hardcoded; `.gitignore` excludes `.env`, local DB files, and virtualenvs from version control.
6. **Input validation** — every request body is validated against a Pydantic schema before touching business logic; invalid input returns `422` with a clear error, not a stack trace.

---

## Testing Strategy

- **Backend:** unit tests for password hashing and JWT encode/decode/expiry logic, plus API integration tests covering the full auth flow, role-based access (admin vs. user), task CRUD, and — critically — data isolation (asserting a user genuinely cannot read/edit/delete another user's task).
- **Frontend:** component tests (e.g. `Navbar` rendering correctly for user vs. admin roles, `NewTask` form validation) and an integration test asserting the API client correctly injects Bearer tokens, refreshes on `401`, and deduplicates concurrent refresh calls.

The guiding principle for both suites: test the **boundaries** (auth, roles, ownership) most heavily, since those are where a real security bug would hide — not just the happy path.

---

## Quick Start

```bash
# Backend
uv init
uv sync
uv venv
.venv/Scripts/activate
uv run uvicorn src.main:app 

# Frontend (separate terminal)
cd frontend
bun install   # or npm install
cp .env.example .env
bun run dev   # or npm run dev
```

Backend: `http://127.0.0.1:8000` (docs at `/docs`) · Frontend: `http://localhost:5173`

Full details, including running each test suite, are in the backend README's "Running the Tests" section and [`frontend/README.md`](./frontend/README.md#-running-tests).

---

## Possible Future Improvements

- Rate limiting on `/auth/login` to slow brute-force attempts.
- Refresh token rotation with revocation on logout (currently a single refresh cookie per session).
- Pagination on `GET /tasks` and `GET /users` for large datasets.
- Switch from HS256 to RS256 if the API ever needs to be verified by a separate service without sharing a symmetric secret.
