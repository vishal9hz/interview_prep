import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  message: { error: 'Too many AI requests, please slow down.' },
});
