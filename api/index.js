/**
 * Vercel Serverless API – all /api/* requests are handled by the Express app.
 * Set OLLAMA_BASE_URL and DATABASE_URL (Neon Postgres) in Vercel env.
 */
import app from '../server/app.js';

export default function handler(req, res) {
  return app(req, res);
}
