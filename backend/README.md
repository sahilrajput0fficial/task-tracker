# Task Tracker & User Management API

A robust, secure backend REST API built with **FastAPI**, **SQLAlchemy ORM**, **Pydantic v2**, and **JWT Authentication**.

This system implements role-based access control (**Admin** and **Normal User**), password hashing with **argon2-cffi**, user profile management, and a complete CRUD task management system with strict data isolation.

---

## 🚀 Features

- **Authentication & Security:**
  - Password hashing using `argon2-cffi` with automatic salting.
  - Stateless JSON Web Token (**JWT**) authentication via `PyJWT` (HMAC-SHA256).
  - Bearer token authentication required on all protected endpoints.
  - Zero hardcoded secrets: all configuration is driven by environment variables (`.env`).
  - `.gitignore` configured to prevent committing `.env`, databases, or temporary caches.

- **Role-Based Access Control (RBAC):**
  - **Admin Role:**
    - View all registered users (`GET /users`).
    - Delete any user account (`DELETE /users/{id}`) with cascade deletion of their tasks.
    - View and delete tasks across all users in the system.
  - **Normal User Role:**
    - View own profile only (`GET /users/me`).
    - Create, view, update, and delete only their own tasks.
    - Strict isolation: attempting to access or modify another user's task results in `403 Forbidden`.

- **Task Management (CRUD):**
  - `POST /tasks`: Create task (`title` required, `description` optional, `status` enum: `pending` or `completed`).
  - `GET /tasks`: Retrieve user tasks (or all tasks for admins). Supports query filtering: `?status=pending` or `?status=completed`.
  - `GET /tasks/{id}`: Retrieve a specific task by ID.
  - `PUT /tasks/{id}`: Update task title, description, or completion status.
  - `DELETE /tasks/{id}`: Delete a task.

- **Validation & Error Handling:**
  - Robust Pydantic request/response schema validation.
  - Consistent HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `422`, `500`).
  - Clear, human-readable error messages.

- **Testing:**
  - Comprehensive unit and API test suite using `pytest` and `fastapi.testclient.TestClient`.
  - In-memory SQLite isolation for lightning-fast, reproducible tests.

---

## 📁 Project Structure

```text
task-tracker/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI application factory, middleware, and exception handlers
│   ├── config.py            # Pydantic BaseSettings configuration (reads .env)
│   ├── database.py          # SQLAlchemy engine, session generator, table initialization
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # JWT authentication and Admin role dependency injection
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py      # POST /auth/register, POST /auth/login
│   │       ├── users.py     # GET /users/me, GET /users, DELETE /users/{id}
│   │       └── tasks.py     # POST /tasks, GET /tasks, PUT /tasks/{id}, DELETE /tasks/{id}
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # SQLAlchemy User model and UserRole enum
│   │   └── task.py          # SQLAlchemy Task model and TaskStatus enum
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py          # Register, Login, Token schemas
│   │   ├── user.py          # User response and message schemas
│   │   └── task.py          # Task create, update, and response schemas
│   └── services/
│       ├── __init__.py
│       └── auth_service.py  # argon2-cffi password hashing & JWT encode/decode logic
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # In-memory test DB, test client, user & admin fixtures
│   ├── test_unit.py         # Unit tests (password hashing, JWT verification, expiration)
│   └── test_api.py          # API integration tests (Auth, RBAC, Task CRUD, Isolation)
├── .env.example             # Template for required environment variables
├── .gitignore               # Strict exclusion of secrets, DBs, and virtualenvs
├── pyproject.toml           # Project dependencies and pytest configuration
├── main.py                  # Convenience root runner: python main.py
└── README.md                # Project documentation and API reference
```

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High performance, automatic OpenAPI documentation, clean dependency injection |
| **ORM** | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | Industry-standard Python ORM with connection pooling & transaction safety |
| **Database** | [SQLite](https://www.sqlite.org/) | Zero-configuration file database (also compatible with PostgreSQL via `DATABASE_URL`) |
| **Security / JWT** | [PyJWT](https://pyjwt.readthedocs.io/) & [argon2-cffi](https://github.com/pyca/argon2-cffi) | Industry-standard password hashing and cryptographically secure token signing |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) | Strict input validation, deserialization, and serialization |
| **Testing** | [pytest](https://docs.pytest.org/) & `TestClient` | Automated unit and integration testing suite |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python **3.11+** (Python 3.13 supported)
- Git

### 2. Clone the Repository
```bash
git clone <repository-url>
cd task-tracker
```

### 3. Create and Activate Virtual Environment
```bash
# On Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# On Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# On Windows (Command Prompt):
.\.venv\Scripts\activate.bat
```

### 4. Install Dependencies
```bash
pip install -r pyproject.toml
# Or install using pip directly:
pip install "fastapi[standard]" "sqlalchemy>=2.0.0" "pydantic-settings" "pyjwt[crypto]" "argon2-cffi>=4.0.0" "pytest" "pytest-asyncio" "httpx"
```

### 5. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Review or update values inside `.env`:
```env
PROJECT_NAME="Task Tracker API"
VERSION="1.0.0"
SECRET_KEY="your_secure_random_secret_key_at_least_32_chars_long"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///./task_tracker.db"
```

---

## ▶️ Running the Server

Start the application with hot-reloading:

```bash
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```
Or simply run:
```bash
python main.py
```

The server will be available at:
- **Base URL:** `http://127.0.0.1:8000`
- **Interactive Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** `http://127.0.0.1:8000/health`

---

## 🧪 Running the Tests

The project includes unit tests for hashing/JWT and end-to-end API tests covering auth, roles, CRUD operations, and data isolation.

Execute the test suite with:

```bash
pytest
```

For verbose output with test names:
```bash
pytest -v
```

---

## 📖 API Documentation & Sample Requests

### 1. Authentication Endpoints

#### Register a New User
- **Endpoint:** `POST /auth/register`
- **Auth Required:** No
- **Status Code:** `201 Created`

```bash
curl -X POST "http://127.0.0.1:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "Password123!",
    "role": "user"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "user",
  "created_at": "2026-09-24T16:00:00.000Z"
}
```

*Note: To register an **admin**, set `"role": "admin"` in the payload.*

---

#### User Login
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No
- **Status Code:** `200 OK`

```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username_or_email": "alice",
    "password": "Password123!"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### 2. User & Profile Endpoints

#### View Own Profile
- **Endpoint:** `GET /users/me`
- **Auth Required:** Yes (Any authenticated user)
- **Status Code:** `200 OK`

```bash
curl -X GET "http://127.0.0.1:8000/users/me" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "user",
  "created_at": "2026-09-24T16:00:00.000Z"
}
```

---

#### View All Users (Admin Only)
- **Endpoint:** `GET /users`
- **Auth Required:** Yes (`admin` role required)
- **Status Code:** `200 OK` (`403 Forbidden` for regular users)

```bash
curl -X GET "http://127.0.0.1:8000/users" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com",
    "role": "user",
    "created_at": "2026-09-24T16:00:00.000Z"
  },
  {
    "id": 2,
    "username": "admin_user",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2026-09-24T16:05:00.000Z"
  }
]
```

---

#### Delete User (Admin Only)
- **Endpoint:** `DELETE /users/{id}`
- **Auth Required:** Yes (`admin` role required)
- **Status Code:** `200 OK` (`403 Forbidden` for regular users)

```bash
curl -X DELETE "http://127.0.0.1:8000/users/1" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response (200 OK):**
```json
{
  "message": "User 'alice' (ID: 1) deleted successfully."
}
```

---

### 3. Task Management Endpoints

#### Create Task
- **Endpoint:** `POST /tasks`
- **Auth Required:** Yes (Any authenticated user)
- **Status Code:** `201 Created`

```bash
curl -X POST "http://127.0.0.1:8000/tasks" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build user management endpoints",
    "description": "Implement authentication and role-based access control.",
    "status": "pending"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Build user management endpoints",
  "description": "Implement authentication and role-based access control.",
  "status": "pending",
  "created_at": "2026-09-24T16:10:00.000Z",
  "user_id": 1
}
```

---

#### List Tasks
- **Endpoint:** `GET /tasks`
- **Auth Required:** Yes
- **Behavior:**
  - Normal users receive **only their own** tasks.
  - Admin users receive **all** tasks in the system.
  - Optional status filter: `GET /tasks?status=pending` or `GET /tasks?status=completed`.

```bash
curl -X GET "http://127.0.0.1:8000/tasks?status=pending" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Build user management endpoints",
    "description": "Implement authentication and role-based access control.",
    "status": "pending",
    "created_at": "2026-09-24T16:10:00.000Z",
    "user_id": 1
  }
]
```

---

#### Update Task
- **Endpoint:** `PUT /tasks/{id}`
- **Auth Required:** Yes (Task owner or Admin)
- **Status Code:** `200 OK` (`403 Forbidden` if regular user tries updating someone else's task)

```bash
curl -X PUT "http://127.0.0.1:8000/tasks/1" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build user management endpoints - Completed",
    "status": "completed"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Build user management endpoints - Completed",
  "description": "Implement authentication and role-based access control.",
  "status": "completed",
  "created_at": "2026-09-24T16:10:00.000Z",
  "user_id": 1
}
```

---

#### Delete Task
- **Endpoint:** `DELETE /tasks/{id}`
- **Auth Required:** Yes (Task owner or Admin)
- **Status Code:** `200 OK` (`403 Forbidden` if regular user tries deleting someone else's task)

```bash
curl -X DELETE "http://127.0.0.1:8000/tasks/1" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**
```json
{
  "message": "Task 1 deleted successfully."
}
```

---

## 🔒 Security Summary

1. **Password Hashing:** Passwords are never stored in plain text. Stored passwords use `argon2-cffi` key derivation with random salting.
2. **JWT Authentication:** Tokens are signed using `HS256` with configurable expiry (default 24 hours).
3. **Role Validation:** Enforced cleanly via FastAPI dependency injection (`get_current_user` and `get_current_admin`).
4. **Data Isolation:** User queries enforce `Task.user_id == current_user.id` so users cannot read or modify tasks created by other users.
5. **Input Sanitation:** All inputs are strictly typed and validated with Pydantic.
6. **No Secret Leakage:** All secrets are managed via `.env` and kept out of version control.

---

## 💻 Frontend Application (React 19 + Vite + Jest)

The frontend is located in the `frontend/` directory.

### Quick Start:
```bash
cd frontend
bun install     # or npm install
bun run dev     # or npm run dev
```

### Running Frontend Tests (Jest + React Testing Library):
```bash
cd frontend
bun run test    # or npm test
```
See [frontend/README.md](file:///d:/Sahil%20Rajput/Documents/Coding%20By%20Sahil/task-tracker/frontend/README.md) for full details.

#   t a s k - t r a c k e r 
 
 