import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { globalLimiter } from './middleware.js';
import setsRouter from './routes/sets.js';
import questionsRouter from './routes/questions.js';
import progressRouter from './routes/progress.js';

const app = express();

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50kb' }));

app.use(globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/sets', setsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/progress', progressRouter);

// Bookmarks shortcut
app.get('/api/bookmarks', async (req, res, next) => {
  try {
    const { pool } = await import('./db.js');
    const result = await pool.query(
      `SELECT q.*, s.title as set_title, s.jd, a.score, a.text as answer_text
       FROM questions q
       JOIN prep_sets s ON s.id = q.set_id
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE q.bookmarked = true
       ORDER BY q.set_id, q.position`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
