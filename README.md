# Notes Evolved

A MERN stack Notes App with full CRUD functionality and a responsive UI, designed to evolve into an AI-powered “Second Brain” that auto-summarizes, tags, links related notes, and provides insights.

## Overview

Notes Evolved is a full-stack notes application built with MongoDB, Express, React, and Node.js. It provides a clean interface for creating, viewing, editing, and deleting notes, while laying the foundation for future AI-assisted knowledge features.

## Features

- Full CRUD notes management
- Responsive, polished UI
- Toast feedback for success and error states
- Route-based navigation
- Rate-limit handling support
- MongoDB persistence with Mongoose
- Production-ready root build/start workflow

## Tech Stack

### Frontend

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- DaisyUI
- Framer Motion
- React Hot Toast

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Upstash Rate Limiter

## Project Structure

```txt
notes app frontend/
├─ backend/
│  ├─ src/
│  └─ package.json
├─ frontend/
│  ├─ src/
│  └─ package.json
├─ docs/
│  └─ screenshots/
│     ├─ notes-list-reference.png
│     ├─ create-note-reference.png
│     └─ note-detail-reference.png
├─ package.json
└─ README.md
```

## Screenshots

| Notes List | Create Note | Note Detail |
|------------|------------|------------|
| <img width="1920" height="878" alt="2026-03-30 - 18_51_45 - notes-app-frontend" src="https://github.com/user-attachments/assets/5a830bad-8806-4460-bd2e-d61c474f6164" />| <img width="1920" height="878" alt="2026-03-30 - 18_52_10 - notes-app-frontend" src="https://github.com/user-attachments/assets/23969a56-4166-4ad7-bcaf-16e838c5afbc" />| <img width="1920" height="878" alt="2026-03-30 - 18_51_59 - notes-app-frontend" src="https://github.com/user-attachments/assets/0d485f5b-2089-4982-a00b-53cb0f2b2845" />|




## Requirements

- Node.js (LTS recommended)
- npm
- MongoDB connection string
- Upstash Redis credentials for rate limiting

## Environment Setup

Create a `.env` file inside `backend/`:

```env
MONGO_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
PORT=3001
NODE_ENV=production
```

## Run Locally

This project is configured to be built and started from the root folder.

### 1) Install dependencies

From the project root:

```bash
npm install
```

### 2) Build the app

From the project root:

```bash
npm run build
```

This installs dependencies in both `backend/` and `frontend/`, then builds the frontend for production.

### 3) Start the app

From the project root:

```bash
npm run start
```

This starts the backend server, which also serves the built frontend in production mode.

### 4) Open the app

Visit:

```txt
http://localhost:3001
```

## Development Mode

If you want to work on frontend and backend separately:

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Default local dev ports:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## API Endpoints

- `GET /api/notes` - fetch all notes
- `GET /api/notes/:id` - fetch a single note
- `POST /api/notes` - create a note
- `PUT /api/notes/:id` - update a note
- `DELETE /api/notes/:id` - delete a note

## Future Vision

Notes Evolved is intended to grow into an AI-powered “Second Brain” with features such as:

- automatic note summarization
- smart tagging
- related-note linking
- insight generation
- contextual knowledge retrieval

## Troubleshooting

- If MongoDB fails to connect, verify `MONGO_URI` in `backend/.env`.
- If rate limiting fails, verify the Upstash Redis credentials.
- If the app does not load after `npm run start`, make sure `npm run build` completed successfully first.
- If the frontend API path changes, update the frontend base URL accordingly.

## License

ISC
