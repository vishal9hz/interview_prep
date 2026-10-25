# Interview Prep Studio

An AI-powered interview preparation tool built with React + Vite (frontend), Node 20 + Express (backend), PostgreSQL, and Anthropic Claude.

## Features

- **AI Question Generation** — Paste a job description and get tailored interview questions (Technical, Behavioral, Situational, HR, Role-specific)
- **Voice & Typed Answers** — Answer by typing or using the Web Speech API
- **AI Evaluation** — Get scores (0–10) for content, structure, and communication, plus strengths, improvements, and a model answer
- **Delivery Analysis** — For spoken answers: WPM, filler word count, pacing feedback
- **Follow-up Questions** — AI generates a sharp follow-up based on your answer
- **Bookmarks** — Bookmark key questions and review them on the Bookmarks page
- **Re-attempt Sets** — Clone a set with blank answers to practice again
- **Progress Tracking** — Score trend charts across sessions using Recharts

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts + Lucide |
| Backend | Node 20 + Express + Zod + express-rate-limit |
| Database | PostgreSQL (Render free tier) |
| AI | Groq API (`groq-sdk`, default `openai/gpt-oss-120b`) |
| Deployment | Render (Static Site + Web Service + PostgreSQL) |

## Project Structure

```
interview_prep/
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── pages/    # Home, Practice, Saved, Bookmarks, Progress
│       ├── components/ # Layout, QuestionCard, FeedbackPanel, VoiceRecorder, WakeupBanner
│       ├── api.js    # Fetch wrapper for all API calls
│       └── speech.js # Web Speech API helpers + filler word detection
└── backend/          # Express REST API
    └── src/
        ├── server.js     # Entry point, CORS, error handling
        ├── middleware.js # Global and AI rate limiters
        ├── db.js         # pg Pool connection
        ├── ai.js         # Groq LLM helpers (generate, evaluate, follow-up)
        ├── schema.sql    # Database schema
        └── routes/       # sets.js, questions.js, progress.js
```

## Local Development

### Prerequisites
- Node 20+
- PostgreSQL (connected to your Render database)
- Groq API key

### Backend

```bash
cd backend
# .env is already configured with your Groq API key and Render Postgres URL!
npm run dev
# Runs on http://localhost:10000
```

### Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## Deployment on Render

### 1. Database (Already Provisioned & Schema Applied)
- Database: `interview_prep_studio` on Render
- Schema has already been run and all tables (`prep_sets`, `questions`, `answers`) are created with indexes.

### 2. Backend (Render Web Service)

1. Create a **Web Service** on Render connected to your Git repository.
2. Root Directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables to add in Render:
   - `GROQ_API_KEY` — `gsk_...`
   - `GROQ_MODEL` — `openai/gpt-oss-120b`
   - `DATABASE_URL` — your Render PostgreSQL connection string (use Internal connection string if inside Render)
   - `PORT` — `10000`
   - `ALLOWED_ORIGIN` — your frontend Render URL (e.g. `https://your-app.onrender.com`)

### 3. Frontend (Render Static Site)

1. Create a **Static Site** on Render connected to your Git repository.
2. Root Directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variables:
   - `VITE_API_URL` — your backend Web Service URL (e.g. `https://your-api.onrender.com`)
6. Rewrite rules: Add a rewrite rule for SPA routing (`/*` -> `/index.html`, 200).

> **Note:** Render free tier spins down after inactivity. The `WakeupBanner` component notifies users when the backend is waking up.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/sets` | Generate questions from JD |
| `GET` | `/api/sets` | List all prep sets |
| `GET` | `/api/sets/:id` | Get set with questions + answers |
| `POST` | `/api/sets/:id/reattempt` | Clone set for a fresh attempt |
| `DELETE` | `/api/sets/:id` | Delete a set |
| `PUT` | `/api/questions/:id/answer` | Autosave answer |
| `POST` | `/api/questions/:id/evaluate` | AI evaluation |
| `POST` | `/api/questions/:id/followup` | Generate follow-up question |
| `PATCH` | `/api/questions/:id/bookmark` | Toggle bookmark |
| `GET` | `/api/bookmarks` | All bookmarked questions |
| `GET` | `/api/progress` | Progress data for charts |

## Rate Limits

- Global: 60 requests/min
- AI endpoints (`/evaluate`, `/followup`, `POST /sets`): 10 requests/min

## License

MIT
