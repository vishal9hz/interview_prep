import express from 'express';
import { query } from '../db.js';
import { evaluateAnswer, followUp } from '../ai.js';
import { aiLimiter } from '../middleware.js';

const router = express.Router();

// PUT /api/questions/:id/answer — autosave answer
router.put('/:id/answer', async (req, res, next) => {
  try {
    const { text, mode, duration_secs, words, wpm, fillers, filler_list } = req.body;

    await query(
      `INSERT INTO answers (question_id, text, mode, duration_secs, words, wpm, fillers, filler_list, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       ON CONFLICT (question_id) DO UPDATE SET
         text = EXCLUDED.text, mode = EXCLUDED.mode,
         duration_secs = EXCLUDED.duration_secs, words = EXCLUDED.words,
         wpm = EXCLUDED.wpm, fillers = EXCLUDED.fillers, filler_list = EXCLUDED.filler_list,
         updated_at = now()`,
      [req.params.id, text || '', mode || 'typed', duration_secs, words, wpm, fillers, filler_list]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/questions/:id/evaluate — AI evaluation
router.post('/:id/evaluate', aiLimiter, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT q.text as question_text, q.type, a.text as answer_text, a.mode,
        a.wpm, a.words, a.duration_secs, a.fillers,
        s.jd, s.experience
       FROM questions q
       JOIN prep_sets s ON s.id = q.set_id
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE q.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    const row = result.rows[0];
    if (!row.answer_text?.trim()) return res.status(400).json({ error: 'Answer is empty' });

    const ev = await evaluateAnswer({
      jd: row.jd,
      experience: row.experience,
      question: row.question_text,
      answer: row.answer_text,
      mode: row.mode,
      stats: row.wpm ? { secs: row.duration_secs, words: row.words, wpm: row.wpm, fillers: row.fillers } : null,
    });

    await query(
      `UPDATE answers SET
        score = $1, content_score = $2, structure_score = $3, communication_score = $4,
        strengths = $5, improvements = $6, delivery = $7, model_answer = $8, updated_at = now()
       WHERE question_id = $9`,
      [ev.score, ev.content, ev.structure, ev.communication,
       JSON.stringify(ev.strengths), JSON.stringify(ev.improve),
       ev.delivery, ev.model, req.params.id]
    );

    res.json(ev);
  } catch (err) { next(err); }
});

// POST /api/questions/:id/followup — AI follow-up question
router.post('/:id/followup', aiLimiter, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT q.*, a.text as answer_text, s.jd
       FROM questions q
       JOIN prep_sets s ON s.id = q.set_id
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE q.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    const row = result.rows[0];

    const fu = await followUp({ jd: row.jd, question: row.text, answer: row.answer_text });

    // Count existing questions in set for position
    const posResult = await query('SELECT COUNT(*) as cnt FROM questions WHERE set_id = $1', [row.set_id]);
    const position = parseInt(posResult.rows[0].cnt) + 1;

    const newQ = await query(
      `INSERT INTO questions (set_id, parent_question_id, position, text, tip)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [row.set_id, req.params.id, position, fu.q, fu.tip]
    );
    res.status(201).json(newQ.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/questions/:id/bookmark — toggle bookmark
router.patch('/:id/bookmark', async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE questions SET bookmarked = NOT bookmarked WHERE id = $1 RETURNING bookmarked',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json({ bookmarked: result.rows[0].bookmarked });
  } catch (err) { next(err); }
});

export default router;
