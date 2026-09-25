# TaskTrack – Frontend Application

A sleek, modern task tracker and user management application built with **React 19**, **Vite**, **React Router v7**, and tested with **Jest** and **React Testing Library**.

This frontend connects to the FastAPI Task Tracker backend, supporting full authentication workflows (JWT + HttpOnly refresh cookies), role-based dashboards (Normal User & Admin), and comprehensive task & user CRUD operations.

---

## 🚀 Features

### 1. Authentication Screens
- **Login (`/login`):**
  - Username or Email + Password login.
  - Client-side validation with real-time feedback.
  - JWT token storage in `localStorage` + secure HttpOnly refresh cookie handling.
  - Automatic silent session restoration via `/auth/refresh` on application reload.
  - Automatic retry on `401 Unauthorized` with concurrent refresh promise deduplication.
  - Smooth redirects based on auth status.
- **Register (`/register`):**
  - Username, Email, and Password registration.
  - Form validation with clear error alerts.
  - Automatic redirection to login on successful account creation.
- **Sign Out:**
  - Secure `/auth/logout` endpoint call to clear the HttpOnly cookie, plus `localStorage` cleanup.

### 2. User Dashboard (`/`)
- Displays current user profile info (username, role badge).
- Filter tasks by status: **All**, **To do**, **In progress**, **Done**.
- Real-time search across task titles and descriptions.
- Priority indicators (**High**, **Medium**, **Low**) with color-coded tags.
- Direct status toggling between `pending` and `completed`.
- Task deletion with confirmation.
- One-click navigation to edit task details.

### 3. Dedicated Task Creation & Editing (`/tasks/new` & `/tasks/:id/edit`)
- Dedicated full-page form with clean, distraction-free UI.
- Pre-fills task title, description, priority, status, category/tag, and due date when editing.
- Client-side validation (title required, trim whitespace).
- Smooth navigation back to dashboard upon creation or update.

### 4. Admin Management Screens
- **Admin All Tasks (`/admin/tasks`):**
  - Accessible only to admin users (role-protected routes).
  - Shows all tasks across all users in the system.
  - Filter by user and task status, plus real-time search.
  - Create tasks assigned to any user in the system.
  - Edit or delete any task.
- **Admin User Management (`/admin/users`):**
  - View all registered users with usernames, emails, roles, and registration dates.
  - Filter users by role (`Admin`, `User`) and search by username/email.
  - Create new users directly with role assignment (`user` or `admin`).
  - Edit user details or role.
  - Delete user accounts with confirmation (cascades to their tasks on the backend).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Styling** | Modern Vanilla CSS / Tailwind utility classes |
| **Testing** | [Jest 30](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + [jest-dom](https://github.com/testing-library/jest-dom) |
| **API Client** | Native `fetch` with token injection, automatic refresh, and retry |

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── api.js                   # API client, JWT injection, silent refresh, CRUD endpoints
│   ├── App.jsx                  # React Router configuration & protected route wrappers
│   ├── main.jsx                 # React root entry point
│   ├── index.css                # Global design system, typography, and utility classes
│   └── components/
│       ├── Auth.jsx             # Login & Registration screen with tab switching
│       ├── Dashboard.jsx        # User task list, status toggling, deletion, stats
│       ├── Navbar.jsx           # Top navigation with role badge & admin links
│       ├── NewTask.jsx          # Dedicated form for creating & editing tasks
│       ├── AdminTasks.jsx       # Admin view for managing and assigning all tasks
│       └── AdminUsers.jsx       # Admin user management (CRUD users, change roles)
├── tests/
│   ├── __mocks__/
│   │   └── styleMock.js         # CSS mock for Jest
│   ├── setup.js                 # Jest environment polyfills (TextEncoder) & jest-dom
│   ├── Navbar.test.jsx          # Component test: user vs admin navigation rendering
│   ├── NewTask.test.jsx         # Component test: validation and task form submission
│   └── api.test.js              # Integration test: JWT headers, refresh & 401 retry
├── .env.example                 # Template for environment configuration
├── babel.config.js              # Babel presets and AST transforms for Jest (ESM)
├── jest.config.js               # Jest jsdom test configuration (ESM)
├── vite.config.js               # Vite dev server and proxy configuration
└── package.json                 # Scripts and dependencies
```

---

## ⚙️ Installation & Running

### 1. Prerequisites
- [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) (v18+)
- Backend running on `http://127.0.0.1:8000`

### 2. Install Dependencies
```bash
cd frontend
bun install
# or: npm install
```

### 3. Environment Configuration
Copy the template to `.env`:
```bash
cp .env.example .env
```
*(In development, `VITE_API_URL` defaults to empty string so requests leverage Vite's proxy, ensuring same-origin cookie delivery).*

### 4. Start Development Server
```bash
bun run dev
# or: npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Tests

The frontend includes a complete test suite powered by **Jest** and **React Testing Library**:

- **Component Tests:**
  - `tests/Navbar.test.jsx`: Verifies correct rendering of user info, admin links, and sign-out callbacks.
  - `tests/NewTask.test.jsx`: Verifies form rendering, client-side validation for empty fields, and API submission payloads.
- **Integration Test:**
  - `tests/api.test.js`: Verifies `Bearer` token injection into headers, task creation requests, token refresh on `/auth/refresh`, and automated retry on `401 Unauthorized`.

To execute all tests:
```bash
bun run test
# or: npm test
```

To run in watch mode:
```bash
bun run test:watch
# or: npm run test:watch
```

---

## 🔒 Security Best Practices
- **No Hardcoded Secrets or URLs:** Configuration is managed via `import.meta.env.VITE_API_URL`.
- **HttpOnly Refresh Cookies:** Refresh tokens cannot be stolen via XSS scripts.
- **Race Condition Prevention:** In-flight refresh promises are deduplicated so simultaneous 401 responses trigger only a single refresh request.
- **Protected Client Routes:** Unauthenticated users are redirected to `/login`, and normal users attempting to access `/admin/*` routes are redirected to the dashboard.
