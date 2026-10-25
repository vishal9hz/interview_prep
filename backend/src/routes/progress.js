import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const trend = await query(
      `SELECT s.title, s.created_at, s.attempt,
        ROUND(AVG(a.score)) as avg_score,
        ROUND(AVG(a.content_score)) as avg_content,
        ROUND(AVG(a.structure_score)) as avg_structure,
        ROUND(AVG(a.communication_score)) as avg_communication,
        ROUND(AVG(a.wpm)) as avg_wpm,
        ROUND(AVG(a.fillers)) as avg_fillers,
        COUNT(a.id) FILTER (WHERE a.score IS NOT NULL) as evaluated_count
       FROM prep_sets s
       LEFT JOIN questions q ON q.set_id = s.id
       LEFT JOIN answers a ON a.question_id = q.id
       GROUP BY s.id
       ORDER BY s.created_at ASC`
    );
    res.json(trend.rows);
  } catch (err) { next(err); }
});

export default router;
