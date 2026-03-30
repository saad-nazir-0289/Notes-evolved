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

### Notes List | ### Create Note | ### Note Detail

<img width="1536" height="1024" alt="notes-list-reference" src="https://github.com/user-attachments/assets/a57287fa-b540-46a9-9a59-276aeea9d4d5" />|<img width="1536" height="1024" alt="create-note-reference" src="https://github.com/user-attachments/assets/2fda947f-1fb1-44fa-98c6-33ef2a7be8b4" />|<img width="1536" height="1024" alt="note-detail-reference" src="https://github.com/user-attachments/assets/2f163fc1-1e12-4b06-93ef-30dbf371d7de" />


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
