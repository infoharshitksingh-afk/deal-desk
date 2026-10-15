// Storage: Upstash Redis over REST when configured (Vercel marketplace sets KV_REST_API_URL / KV_REST_API_TOKEN),
// otherwise a JSON file (fine for local use; on Vercel it does not persist, and the UI warns about it).
import fs from 'node:fs';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const FILE = process.env.DD_STORE_FILE || '/tmp/deal-desk-store.json';
const P = 'dd:';

export const persistent = () => !!(URL_ && TOKEN) || !process.env.VERCEL;
export const backend = () => (URL_ && TOKEN) ? 'redis' : 'file';

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('Database error: ' + (j.error || r.status));
  return j.result;
}
function readFile() { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } }
function writeFile(d) { fs.writeFileSync(FILE, JSON.stringify(d)); }

export async function hgetall(key) {
  if (backend() === 'redis') {
    const arr = await redis(['HGETALL', P + key]) || [];
    const out = {};
    for (let i = 0; i < arr.length; i += 2) { try { out[arr[i]] = JSON.parse(arr[i + 1]); } catch {} }
    return out;
  }
  return { ...(readFile()[P + key] || {}) };
}
export async function hget(key, field) {
  if (backend() === 'redis') { const v = await redis(['HGET', P + key, field]); return v ? JSON.parse(v) : null; }
  return (readFile()[P + key] || {})[field] ?? null;
}
export async function hset(key, field, value) {
  if (backend() === 'redis') return redis(['HSET', P + key, field, JSON.stringify(value)]);
  const d = readFile(); (d[P + key] ||= {})[field] = value; writeFile(d);
}
export async function hdel(key, field) {
  if (backend() === 'redis') return redis(['HDEL', P + key, field]);
  const d = readFile(); if (d[P + key]) delete d[P + key][field]; writeFile(d);
}
export async function get(key) {
  if (backend() === 'redis') { const v = await redis(['GET', P + key]); return v ? JSON.parse(v) : null; }
  return readFile()[P + key] ?? null;
}
export async function set(key, value) {
  if (backend() === 'redis') return redis(['SET', P + key, JSON.stringify(value)]);
  const d = readFile(); d[P + key] = value; writeFile(d);
}
export async function pushLog(entry, max = 200) {
  const e = { at: new Date().toISOString(), ...entry };
  if (backend() === 'redis') { await redis(['LPUSH', P + 'log', JSON.stringify(e)]); await redis(['LTRIM', P + 'log', '0', String(max - 1)]); return; }
  const d = readFile(); d[P + 'log'] = [e, ...(d[P + 'log'] || [])].slice(0, max); writeFile(d);
}
export async function getLog(n = 60) {
  if (backend() === 'redis') return ((await redis(['LRANGE', P + 'log', '0', String(n - 1)])) || []).map(x => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
  return (readFile()[P + 'log'] || []).slice(0, n);
}
