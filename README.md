# Notes Evolved

A MERN stack notes application with full CRUD functionality and a responsive UI, built to evolve into an AI-powered Second Brain.

## Features

- Create, view, edit, and delete notes
- Search notes by title and description
- Sort notes by creation date, update date, or title
- Pin notes to keep them above unpinned notes in lists and search results
- Server-side pagination for note lists and search results (12 notes by default, maximum 50 per page)
- Account registration and login with scrypt password hashes and signed JWT access tokens
- JWT-protected note CRUD endpoints with bearer-token authentication
- Per-user note ownership across list, search, read, create, update, and delete
- Frontend login/registration, tab-scoped session restoration, and automatic bearer-token API requests
- Rate-limited authentication endpoints and a protected current-user endpoint
- Responsive React interface with loading, empty, and toast feedback states
- MongoDB persistence with Mongoose
- Express API with request rate limiting
- Production mode serves the built frontend from the backend
- Optional shared Upstash rate limiting with an in-memory fallback

## Tech stack

- **Frontend:** React, Vite, React Router, Axios, Tailwind CSS, DaisyUI, Framer Motion
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** Node.js scrypt password hashing and HS256 JWT access tokens
- **Rate limiting:** Upstash Redis when configured, otherwise a bounded in-memory fallback

## Project structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .env.example
├── package.json
├── README.md
└── ROADMAP.md
```

## Requirements

- Node.js LTS
- npm
- MongoDB, local or hosted

Upstash Redis is optional. Without both Upstash environment variables, the backend applies a per-process in-memory limit of 100 requests per client per minute for note endpoints and 10 authentication requests per client per 15 minutes. These fallbacks are not shared between multiple server instances and their counters reset when the process restarts. For multi-instance deployments, configure Upstash.

## Environment setup

Copy the example file to the backend environment file:

```bash
cp .env.example backend/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example backend/.env
```

Set `MONGO_URI` to a MongoDB connection string you control. Generate a random JWT secret for authentication endpoints:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Put the generated value in `JWT_SECRET`. The secret must contain at least 32 bytes. Configure both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to enable shared Upstash rate limiting. Keep real credentials in `backend/.env`, never in source control.

## Run locally

From the repository root:

```bash
npm install
npm run build
npm run start
```

Open [http://localhost:3001](http://localhost:3001).

The root build script installs backend and frontend dependencies and creates the frontend production build. The start script launches the backend, which connects to MongoDB before listening.

For separate development servers, run these commands in two terminals:

**Backend**

```bash
cd backend
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at [http://localhost:5173](http://localhost:5173) and calls the backend at [http://localhost:3001](http://localhost:3001). Set `FRONTEND_URL` if your frontend uses a different development origin.

## API

All endpoints use a consistent JSON envelope. Successful responses use `success: true`, a human-readable `message`, and a `data` field. Errors use `success: false` and `data: null`. Unexpected server errors return a generic message rather than internal details.

### Authentication API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account with a normalized email and a scrypt password hash |
| POST | `/api/auth/login` | Verify credentials and return a signed JWT access token |
| GET | `/api/auth/me` | Validate a bearer token and return the current account |

Registration requires a valid email and a password between 12 and 128 characters. Login accepts passwords between 1 and 128 characters so existing credentials are not rejected by registration policy. Passwords are never returned by the API. Access tokens use HS256, include issuer and audience claims, and expire after 60 minutes. Configure `JWT_SECRET` before using these endpoints. Register and login share a limit of 10 attempts per client per 15 minutes.

**Security gate:** Every notes CRUD endpoint requires a valid JWT bearer token, and every list, count, search, read, update, and delete query is scoped to the authenticated owner. New notes receive their owner from the verified session, never from request input. Notes created before this change remain ownerless and are intentionally invisible until the migration below is run. Automatic migration is permitted only when exactly one account exists; with multiple accounts, legacy ownership cannot be inferred and the tool refuses to assign notes. Back up the database and complete the appropriate migration before deploying this version to an existing database. Access tokens are stored in `sessionStorage`, which is readable by scripts running on the same origin; keep normal XSS defenses in place.

### Migrating existing notes

Notes created before per-user ownership was added have no owner and are not visible to any account. Choose the existing account that should receive those legacy notes. The migration defaults to a read-only dry run and only assigns documents whose `owner` is missing or `null`; it never changes an already-owned note.

Before applying it, take a verified MongoDB backup and stop the running backend so no notes are created while the one-time migration is in progress. From the `backend/` directory, run a dry run first:

```bash
npm run migrate:legacy-notes -- --owner=you@example.com
```

Review the target account, matched note count, and `safeToApply` result. Automatic assignment is allowed only when exactly one registered account exists. If the database has multiple accounts, do not choose one arbitrarily: the earlier shared-notes period means ownership cannot be inferred, so the tool refuses to apply and those notes need a separately verified manual mapping.

Only when the dry run reports `safeToApply: true` and the account/count are correct, apply with an explicit matching confirmation:

```bash
npm run migrate:legacy-notes -- --owner=you@example.com --apply --confirm-owner=you@example.com
```

The command verifies that the target account exists and checks that no ownerless notes remain after the update. Keep the backend stopped until it completes successfully, then deploy/start the ownership-enforcing version. If the selected account is wrong, restore from the verified backup.

### Notes API

The notes API requires an `Authorization: Bearer <access-token>` header on every endpoint. Obtain the token from registration or login. Authentication is enforced before note validation and database access, and all database operations are scoped to that account's owner ID.

The list endpoint returns the current page as an array and includes pagination details in `meta.pagination`.

```json
{
  "success": true,
  "message": "Notes found successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Project",
      "description": "Project details",
      "isPinned": false
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/notes` | List the first page (12 notes by default, newest first) |
| GET | `/api/notes?page=2&limit=12` | Request a specific page |
| GET | `/api/notes?q=project&page=2&limit=12` | Search and paginate titles/descriptions (case-insensitive, maximum 100 search characters) |
| GET | `/api/notes?sortBy=title&sortOrder=asc&page=1&limit=12` | Combine allowlisted sorting and pagination |
| GET | `/api/notes/:id` | Read one note |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update a note title, description, or pin state |
| DELETE | `/api/notes/:id` | Delete a note |

The `page` parameter must be a positive integer. `limit` defaults to 12 and is capped at 50. Requests whose calculated offset exceeds 1,000,000 are rejected to keep deep-offset queries bounded. If a requested page becomes out of range after records are removed, the API clamps it to the last available page. The total count uses the same search filter as the returned page.

The sort field and direction are allowlisted and validated before the database query. Supported fields are `createdAt`, `updatedAt`, and `title`; directions are `asc` and `desc`. Pinned notes always appear before unpinned notes, while the selected sort and `_id` tie-breaker order notes within each group. Update pin state with `PUT /api/notes/:id` and a boolean body such as `{"isPinned":true}`; pin state is accepted only on partial updates.

## Privacy and AI roadmap

The current application stores notes in the configured MongoDB database. It does not send note content to an AI provider. Future AI features must remain disabled unless a provider is explicitly configured by the operator through environment variables, and the app must continue to work without an AI key.

## Screenshots

| Notes list | Create note | Note detail |
| --- | --- | --- |
| <img width="1920" height="878" alt="Notes list" src="https://github.com/user-attachments/assets/5a830bad-8806-4460-bd2e-d61c474f6164" /> | <img width="1920" height="878" alt="Create note" src="https://github.com/user-attachments/assets/23969a56-4166-4ad7-bcaf-16e838c5afbc" /> | <img width="1920" height="878" alt="Note detail" src="https://github.com/user-attachments/assets/0d485f5b-2089-4982-a00b-53cb0f2b2845" /> |

## License

ISC
