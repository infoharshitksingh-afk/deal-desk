// API keys and settings. Keys can come from environment variables (preferred) or be pasted in the Settings page,
// where they are encrypted with AES-256-GCM using a key derived from ACCESS_CODE and stored server-side.
// Keys are never sent back to the browser; the UI only sees which ones are set and their last 4 characters.
import crypto from 'node:crypto';
import { get, set } from './store.js';

export const KEY_FIELDS = {
  anthropic: { env: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude)' },
  firecrawl: { env: 'FIRECRAWL_API_KEY', label: 'Firecrawl' },
  apollo: { env: 'APOLLO_API_KEY', label: 'Apollo.io' },
  hunter: { env: 'HUNTER_API_KEY', label: 'Hunter.io' },
  resend: { env: 'RESEND_API_KEY', label: 'Resend' },
  smtpPass: { env: 'SMTP_PASS', label: 'SMTP password or Gmail app password' },
  zoominfo: { env: 'ZOOMINFO_API_KEY', label: 'ZoomInfo', placeholder: true },
  clay: { env: 'CLAY_API_KEY', label: 'Clay', placeholder: true },
  rocketreach: { env: 'ROCKETREACH_API_KEY', label: 'RocketReach', placeholder: true }
};

export const DEFAULT_SETTINGS = {
  roles: ['SAP S/4HANA migration', 'SAP program lead', 'SAP finance transformation', 'SAP FICO lead', 'ERP transformation finance', 'Head of finance transformation'],
  portals: ['boards.greenhouse.io', 'jobs.lever.co', 'myworkdayjobs.com', 'jobs.ashbyhq.com', 'linkedin.com/jobs'],
  recency: 'qdr:w',
  maxNewCompaniesPerRun: 15,
  competitorsPerAccount: 3,
  autoFindEmails: false,
  maxEmailLookupsPerRun: 10,
  autoDraft: true,
  modelSmart: 'claude-sonnet-5-5',
  modelFast: 'claude-haiku-5-5',
  sender: { name: '', title: '', fromEmail: '', footer: '' },
  email: { provider: 'none', smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpUser: '', dailyCap: 25 },
  optOut: [],
  excludeExtra: []
};

function encKey() { return crypto.scryptSync(String(process.env.ACCESS_CODE || ''), 'flowgen-deal-desk-v1', 32); }
function encrypt(obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}
let unreadable = false;
function decrypt(blob) {
  unreadable = false;
  if (!blob) return {};
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(blob.iv, 'base64'));
    d.setAuthTag(Buffer.from(blob.tag, 'base64'));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(blob.data, 'base64')), d.final()]).toString('utf8'));
  } catch { unreadable = true; return {}; }
}

export async function getKeys() {
  const stored = decrypt(await get('keys'));
  const out = {};
  for (const [k, f] of Object.entries(KEY_FIELDS)) out[k] = process.env[f.env] || stored[k] || '';
  // Lets "isn't set up" errors explain the real cause when saved keys exist but can't be decrypted.
  Object.defineProperty(out, '_unreadable', { value: unreadable, enumerable: false });
  return out;
}
export async function keyStatus() {
  const stored = decrypt(await get('keys'));
  const out = {};
  for (const [k, f] of Object.entries(KEY_FIELDS)) {
    const v = process.env[f.env] || stored[k] || '';
    out[k] = { label: f.label, set: !!v, source: process.env[f.env] ? 'environment' : (stored[k] ? 'settings' : ''), last4: v ? v.slice(-4) : '', placeholder: !!f.placeholder };
  }
  return out;
}
export async function keysReadable() { decrypt(await get('keys')); return !unreadable;
}
export async function saveKeys(patch) {
  const stored = decrypt(await get('keys'));
  if (unreadable) for (const k of Object.keys(stored)) delete stored[k]; // old blob from a previous ACCESS_CODE: start fresh
  for (const [k, v] of Object.entries(patch || {})) {
    if (!(k in KEY_FIELDS)) continue;
    if (v === null || v === '') delete stored[k];
    else if (typeof v === 'string' && v.trim()) stored[k] = v.trim();
  }
  await set('keys', encrypt(stored));
}
export async function getSettings() {
  const s = (await get('settings')) || {};
  return { ...DEFAULT_SETTINGS, ...s, sender: { ...DEFAULT_SETTINGS.sender, ...(s.sender || {}) }, email: { ...DEFAULT_SETTINGS.email, ...(s.email || {}) } };
}
export async function saveSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch, sender: { ...cur.sender, ...(patch.sender || {}) }, email: { ...cur.email, ...(patch.email || {}) } };
  for (const k of ['roles', 'portals', 'optOut', 'excludeExtra']) if (!Array.isArray(next[k])) next[k] = cur[k];
  for (const k of ['maxNewCompaniesPerRun', 'competitorsPerAccount', 'maxEmailLookupsPerRun']) next[k] = Math.max(0, Math.min(100, Number(next[k]) || 0));
  next.email.dailyCap = Math.max(1, Math.min(500, Number(next.email.dailyCap) || 25));
  await set('settings', next);
  return next;
}
