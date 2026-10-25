import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { generateQuestions } from '../ai.js';
import { aiLimiter } from '../middleware.js';

const router = express.Router();

const createSetSchema = z.object({
  jd: z.string().min(50, 'JD too short').max(8000, 'JD too long (max 8000 chars)'),
  role: z.string().max(100).optional(),
  experience: z.string().max(50).optional(),
  salary: z.string().max(50).optional(),
  domain: z.string().max(100).optional(),
  count: z.number().int().min(1).max(20).default(10),
  focus: z.string().max(200).optional(),
});

router.post('/', aiLimiter, async (req, res, next) => {
  try {
    const data = createSetSchema.parse(req.body);
    const ai = await generateQuestions(data);

    const setResult = await query(
      `INSERT INTO prep_sets (title, jd, role, experience, salary, domain)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ai.title || 'Untitled Set', data.jd, data.role, data.experience, data.salary, data.domain]
    );
    const set = setResult.rows[0];

    const questions = [];
    for (let i = 0; i < ai.questions.length; i++) {
      const q = ai.questions[i];
      const qResult = await query(
        `INSERT INTO questions (set_id, position, text, type, tip)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [set.id, i + 1, q.q, q.type, q.tip]
      );
      questions.push(qResult.rows[0]);
    }

    res.status(201).json({ ...set, questions });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*,
        COUNT(DISTINCT q.id) as question_count,
        ROUND(AVG(a.score)) as avg_score,
        COUNT(DISTINCT a.id) FILTER (WHERE a.score IS NOT NULL) as evaluated_count
       FROM prep_sets s
       LEFT JOIN questions q ON q.set_id = s.id
       LEFT JOIN answers a ON a.question_id = q.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const setResult = await query('SELECT * FROM prep_sets WHERE id = $1', [req.params.id]);
    if (!setResult.rows.length) return res.status(404).json({ error: 'Set not found' });

    const questionsResult = await query(
      `SELECT q.*, a.id as answer_id, a.text as answer_text, a.mode,
        a.score, a.content_score, a.structure_score, a.communication_score,
        a.strengths, a.improvements, a.delivery, a.model_answer,
        a.wpm, a.words, a.duration_secs, a.fillers
       FROM questions q
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE q.set_id = $1
       ORDER BY q.position`,
      [req.params.id]
    );
    res.json({ ...setResult.rows[0], questions: questionsResult.rows });
  } catch (err) { next(err); }
});

router.post('/:id/reattempt', async (req, res, next) => {
  try {
    const origResult = await query('SELECT * FROM prep_sets WHERE id = $1', [req.params.id]);
    if (!origResult.rows.length) return res.status(404).json({ error: 'Set not found' });
    const orig = origResult.rows[0];

    const newSetResult = await query(
      `INSERT INTO prep_sets (title, jd, role, experience, salary, domain, parent_set_id, attempt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orig.title, orig.jd, orig.role, orig.experience, orig.salary, orig.domain, orig.id, (orig.attempt || 1) + 1]
    );
    const newSet = newSetResult.rows[0];

    const origQs = await query(
      'SELECT * FROM questions WHERE set_id = $1 AND parent_question_id IS NULL ORDER BY position',
      [req.params.id]
    );
    const questions = [];
    for (const q of origQs.rows) {
      const qResult = await query(
        `INSERT INTO questions (set_id, position, text, type, tip, bookmarked)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [newSet.id, q.position, q.text, q.type, q.tip, q.bookmarked]
      );
      questions.push(qResult.rows[0]);
    }

    res.status(201).json({ ...newSet, questions });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM prep_sets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
