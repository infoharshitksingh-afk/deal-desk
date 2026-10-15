// Access gate and request helpers. Every API route except /api/cron needs the ACCESS_CODE.
import crypto from 'node:crypto';

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function requireAccess(req, res) {
  const code = process.env.ACCESS_CODE;
  if (!code) { send(res, 503, { error: 'setup', message: 'Set an ACCESS_CODE environment variable in Vercel, then redeploy.' }); return false; }
  if (!safeEqual(req.headers['x-access-code'], code)) { send(res, 401, { error: 'unauthorized', message: 'Wrong access code.' }); return false; }
  return true;
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function handle(fn) {
  return async (req, res) => {
    globalThis.__ddReqStart = Date.now();
    try {
      if (!requireAccess(req, res)) return;
      await fn(req, res);
    } catch (e) {
      console.error(e);
      send(res, e.status || 500, { error: e.code || 'error', message: e.message || 'Something went wrong.' });
    }
  };
}

export class UserError extends Error { constructor(message, status = 400, code = 'bad_request') { super(message); this.status = status; this.code = code; } }
