# Interview Prep Studio: Full-Stack Project Guide

Paste a job description, get a tailored question bank, answer by typing or speaking, get AI feedback, and keep everything saved. Re-attempt sets, bookmark questions, and ask follow-ups.

## 1. Where does question creation and evaluation run?

**In the backend (Render), never in the frontend.**

| Job | Where | Why |
|---|---|---|
| Record voice and live transcription | Frontend (Vercel) | The browser microphone and Web Speech API only work in the user's own browser tab |
| Pace and filler-word stats | Frontend | Simple maths on the transcript and timer |
| **Create questions** | **Backend (Render) calling the Anthropic API** | Keeps your API key secret |
| **Evaluate answers** | **Backend (Render) calling the Anthropic API** | Same, plus lets you rate-limit and log |
| **Follow-up questions** | **Backend (Render) calling the Anthropic API** | Same |
| Store users, sets, answers, scores | Backend and database | Persistent data |

If you call the Anthropic API directly from the Vercel frontend, your API key is visible to anyone who opens the browser dev tools. Keep it only in Render's environment variables.

## 2. Architecture

```
Browser (Vercel, React or plain JS)
  - mic + speech-to-text (Web Speech API)
  - UI: new prep, practice, saved, bookmarks, progress
        |  HTTPS (JSON, auth token)
        v
API server (Render Web Service, Node + Express)
  - auth, rate limiting, validation
  - /api/questions/generate   -> Anthropic API
  - /api/answers/evaluate     -> Anthropic API
  - /api/questions/followup   -> Anthropic API
  - CRUD for sets, answers, bookmarks
        |
        v
PostgreSQL (Render Postgres, Neon or Supabase)
```

## 3. Tech stack

- **Frontend:** Vite and React (or keep the single HTML page and split the script), deployed on Vercel.
- **Backend:** Node 20, Express, `@anthropic-ai/sdk`, `zod` (validation), `express-rate-limit`, `cors`, `pg` (or Prisma).
- **Database:** PostgreSQL. Check the current free-tier limits: free databases on some hosts expire or pause, so confirm before relying on one for long-term data.
- **Auth:** pick one:
  - Simple: single shared password or token in an env var (personal use).
  - Better: Clerk, Supabase Auth, or Auth0 (public use, many users).

## 4. Folder structure

```
interview-prep/
  frontend/
    index.html
    src/ (api.js, speech.js, components...)
    .env            # VITE_API_URL=https://your-api.onrender.com
  backend/
    package.json
    src/
      server.js
      db.js
      auth.js
      ai.js         # all Anthropic calls and prompts
      routes/
        questions.js
        answers.js
        sets.js
    schema.sql
    .env            # local only, never commit
  README.md
```

## 5. Database schema (`schema.sql`)

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table prep_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  jd text not null,
  role text, experience text, salary text, domain text,
  language text default 'en-IN',
  parent_set_id uuid references prep_sets(id),   -- for re-attempts
  attempt int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references prep_sets(id) on delete cascade,
  parent_question_id uuid references questions(id),  -- follow-ups
  position int not null,
  text text not null,
  type text,
  tip text,
  bookmarked boolean default false
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  text text not null default '',
  mode text default 'typed',            -- typed | spoken
  duration_secs int, words int, wpm int, fillers int, filler_list text,
  score int, content_score int, structure_score int, communication_score int,
  strengths jsonb, improvements jsonb, delivery text, model_answer text,
  updated_at timestamptz default now()
);

create index on prep_sets (user_id, created_at desc);
create index on questions (set_id);
create index on questions (user_bookmarks) where bookmarked;  -- optional, adjust
```

(Remove the last index line if you don't add a `user_id` column to `questions`. It's only an example.)

## 6. API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/sets` | Create a set: body has JD and optional details. Server calls AI, saves questions, returns the set |
| GET | `/api/sets` | List my sets with average scores |
| GET | `/api/sets/:id` | Set with questions, answers, feedback |
| POST | `/api/sets/:id/reattempt` | Clone the set with blank answers (keeps bookmarks) |
| DELETE | `/api/sets/:id` | Delete a set |
| PUT | `/api/questions/:id/answer` | Autosave typed or spoken answer and stats |
| POST | `/api/questions/:id/evaluate` | AI scores the saved answer, stores result |
| POST | `/api/questions/:id/followup` | AI writes a follow-up question |
| PATCH | `/api/questions/:id/bookmark` | Toggle bookmark |
| GET | `/api/bookmarks` | All bookmarked questions across sets |
| GET | `/api/progress` | Score trend and average pace and fillers |

## 7. Backend AI module (`backend/src/ai.js`)

```js
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";

async function askJson(prompt, maxTokens = 2000) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content.filter(b => b.type === "text").map(b => b.text).join("");
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  return JSON.parse(text.slice(s, e + 1));
}

export function generateQuestions({ jd, role, experience, salary, domain, count, focus }) {
  return askJson(`You are a senior interviewer. Create exactly ${count} interview questions.
JOB DESCRIPTION:\n${jd}
Optional: role ${role || "n/a"}; experience ${experience || "n/a"}; salary ${salary || "n/a"}; domain ${domain || "n/a"}.
Mix: ${focus}. Be specific to the JD's skills and the candidate's level.
Return ONLY JSON: {"title":"...","questions":[{"q":"...","type":"Technical|Behavioral|Situational|HR|Role-specific","tip":"..."}]}`, 3000);
}

export function evaluateAnswer({ jd, experience, question, answer, mode, stats }) {
  return askJson(`You are a strict but encouraging interview coach.
JOB DESCRIPTION:\n${jd}\nExperience: ${experience || "n/a"}
QUESTION: ${question}
ANSWER (${mode}): ${answer}
${stats ? `Delivery: ${stats.secs}s, ${stats.words} words, ${stats.wpm} wpm, ${stats.fillers} fillers.` : ""}
Scores are integers 0-10. For spoken answers comment on pace (ideal 120-160 wpm), fillers, structure.
Return ONLY JSON: {"score":0,"content":0,"structure":0,"communication":0,"strengths":[],"improve":[],"delivery":"","model":"120-180 word improved answer"}`);
}

export function followUp({ jd, question, answer }) {
  return askJson(`You are the interviewer. Write ONE sharp follow-up question.
JD:\n${jd.slice(0, 1500)}\nQUESTION: ${question}\nANSWER: ${answer || "(not answered)"}
Return ONLY JSON: {"q":"...","tip":"..."}`, 500);
}
```

Always validate inputs with `zod` (JD length cap such as 8,000 characters, answer cap such as 4,000) before calling the AI. This limits cost and abuse.

## 8. Example route (`routes/answers.js`)

```js
router.post("/questions/:id/evaluate", requireAuth, limiter, async (req, res) => {
  const row = await db.getQuestionWithAnswerAndSet(req.params.id, req.user.id); // checks ownership
  if (!row || !row.answer_text.trim()) return res.status(400).json({ error: "Answer is empty" });
  const ev = await evaluateAnswer({
    jd: row.jd, experience: row.experience, question: row.question_text,
    answer: row.answer_text, mode: row.mode,
    stats: row.wpm ? { secs: row.duration_secs, words: row.words, wpm: row.wpm, fillers: row.fillers } : null,
  });
  await db.saveEvaluation(row.answer_id, ev);
  res.json(ev);
});
```

## 9. Frontend: voice (Vercel)

On Vercel the page is a normal top-level site, so the microphone prompt works:

```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new SR();
rec.continuous = true; rec.interimResults = true; rec.lang = "en-IN";
rec.onresult = e => { /* join e.results into the answer textarea */ };
rec.onend = () => { if (recording) rec.start(); };   // keep listening
```

- Use Chrome or Edge (Firefox lacks speech recognition; Safari support is partial).
- Site must be served over HTTPS (Vercel does this by default).
- Autosave the answer to the backend about 500 ms after typing stops and on stop-recording.
- Compute duration, words per minute and filler words in the browser, then send them with the answer.

## 10. Environment variables

**Render (backend):**
```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-5-5
DATABASE_URL=postgres://...
JWT_SECRET=long-random-string
ALLOWED_ORIGIN=https://your-app.vercel.app
PORT=10000
```

**Vercel (frontend):**
```
VITE_API_URL=https://your-api.onrender.com
```

## 11. Deployment steps

1. **Database:** create a Postgres instance, run `schema.sql` against it, copy the connection string.
2. **Backend on Render:** New → Web Service → connect the repo, root directory `backend`, build `npm install`, start `node src/server.js`. Add the env vars above. Add a `/health` route.
3. **Frontend on Vercel:** import the repo, root directory `frontend`, framework Vite, add `VITE_API_URL`.
4. **CORS:** in Express, allow only your Vercel domain (`ALLOWED_ORIGIN`).
5. **Test:** generate a set, record an answer on the Vercel URL, evaluate, reload, and confirm everything persists.

## 12. Things to plan for

- **Cold starts:** free Render web services go to sleep after inactivity, so the first request can take around a minute. Show a "waking up the server" message or use a paid instance.
- **Cost control:** every generate, evaluate and follow-up is a paid API call. Add per-user rate limits (e.g. 30 AI calls per hour) and a monthly budget alert in the Anthropic console.
- **Public sign-up:** require login before any AI endpoint, otherwise strangers can spend your API credit.
- **Privacy:** JDs and answers are personal data. Scope every query by `user_id`, use HTTPS only, and offer delete-my-data.
- **Long AI calls:** evaluation can take 5 to 20 seconds. Show a loading state and set the server timeout above that.
- **Audio files:** this design stores transcripts, not recordings. If you want playback later, store audio in object storage (S3, Cloudflare R2, Supabase Storage) and save only the file URL in the database.

## 13. Build order

1. Backend skeleton, database, auth.
2. `POST /api/sets` with AI question generation.
3. Frontend: new prep and practice screens with typed answers and autosave.
4. Evaluate endpoint and feedback UI.
5. Voice recording and speaking stats.
6. Saved list, re-attempt, bookmarks, follow-ups, progress page.
7. Rate limits, validation, deploy, test on a phone.

## 14. Optional future features

- Mock interview mode that reads questions aloud (browser speech synthesis) and asks AI follow-ups automatically.
- Weekly score and pace trend chart, with a reminder email.
- Company-specific question packs.
- Export a set as PDF.
- Application tracker linked to each set.
