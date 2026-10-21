import { HttpError } from '../lib/errors.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  if (err?.name === 'CastError') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid identifier' } });
  if (err?.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE', message: 'That value is already in use.' } });
  if (err?.name === 'ValidationError') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: err.message } });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } });
  console.error('Unhandled error:', req.method, req.path, env.nodeEnv === 'production' ? err.message : err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side.' } });
}
