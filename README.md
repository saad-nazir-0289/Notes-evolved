# Notes Evolved

A MERN stack notes application with full CRUD functionality and a responsive UI, built to evolve into an AI-powered Second Brain.

## Features

- Create, view, edit, and delete notes
- Responsive React interface with loading, empty, and toast feedback states
- MongoDB persistence with Mongoose
- Express API with request rate limiting
- Production mode serves the built frontend from the backend
- Optional shared Upstash rate limiting with an in-memory fallback

## Tech stack

- **Frontend:** React, Vite, React Router, Axios, Tailwind CSS, DaisyUI, Framer Motion
- **Backend:** Node.js, Express, MongoDB, Mongoose
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
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

## Requirements

- Node.js LTS
- npm
- MongoDB, local or hosted

Upstash Redis is optional. Without both Upstash environment variables, the backend applies a per-process in-memory limit of 100 requests per client per minute. This fallback is not shared between multiple server instances and its counters reset when the process restarts. For multi-instance deployments, configure Upstash.

## Environment setup

Copy the example file to the backend environment file:

```bash
cp .env.example backend/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example backend/.env
```

Set `MONGO_URI` to a MongoDB connection string you control. The remaining variables are documented in `.env.example`. Configure both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to enable shared Upstash rate limiting. Keep real credentials in `backend/.env`, never in source control.

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

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/notes` | List notes |
| GET | `/api/notes/:id` | Read one note |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

## Privacy and AI roadmap

The current application stores notes in the configured MongoDB database. It does not send note content to an AI provider. Future AI features must remain disabled unless a provider is explicitly configured by the operator through environment variables, and the app must continue to work without an AI key.

## Screenshots

| Notes list | Create note | Note detail |
| --- | --- | --- |
| <img width="1920" height="878" alt="Notes list" src="https://github.com/user-attachments/assets/5a830bad-8806-4460-bd2e-d61c474f6164" /> | <img width="1920" height="878" alt="Create note" src="https://github.com/user-attachments/assets/23969a56-4166-4ad7-bcaf-16e838c5afbc" /> | <img width="1920" height="878" alt="Note detail" src="https://github.com/user-attachments/assets/0d485f5b-2089-4982-a00b-53cb0f2b2845" /> |

## License

ISC
