// End-to-end test with mocked outside APIs: settings, sourcing, dedupe, research, competitors, people, emails, drafts, send, export.
process.env.ACCESS_CODE = 'test-code'; process.env.DD_STORE_FILE = '/tmp/dd-e2e.json'; process.env.FIRECRAWL_GAP_MS = '0'; process.env.DD_SKIP_SEED = '1';
import fs from 'node:fs';
try { fs.unlinkSync('/tmp/dd-e2e.json'); } catch {}
await import('./mocks.js');
const { createServer } = await import('./dev-server.js');
const srv = createServer().listen(0); const port = srv.address().port;
const api = async (p, body, code = 'test-code') => { const r = await fetch(`http://localhost:${port}/api/${p}`, { method: body ? 'POST' : 'GET', headers: { 'x-access-code': code, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: r.headers.get('content-type')?.includes('json') ? await r.json() : await r.arrayBuffer() }; };
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };

ok((await api('state', null, 'wrong')).status === 401, 'wrong access code is refused');
let r = await api('settings', { keys: { anthropic: 'sk-test-AAAA', firecrawl: 'fc-test-BBBB', apollo: 'ap-CCCC', resend: 're_DDDD' }, settings: { autoFindEmails: true, sender: { name: 'Kriti', title: 'Co-founder', fromEmail: 'kriti@flowgen.example', footer: 'FlowGen Labs, 1 Main St, SF. Not relevant? Reply "no" and I won\'t follow up.' }, email: { provider: 'resend' } } });
ok(r.body.keys.anthropic.set && r.body.keys.anthropic.last4 === 'AAAA' && !JSON.stringify(r.body).includes('sk-test'), 'keys saved encrypted; only last 4 returned');
ok(!fs.readFileSync('/tmp/dd-e2e.json', 'utf8').includes('sk-test'), 'raw keys not stored in plain text');

const log = [];
let used = 0;
for (const stage of ['source', 'research', 'competitors', 'research', 'people', 'emails', 'drafts']) {
  for (let i = 0; i < 20; i++) { const x = await api('run', { stage, used }); if (x.status !== 200) { log.push(stage + ' ERROR ' + x.body.message); break; } if (x.body.used != null) used = x.body.used; log.push(stage + ': ' + x.body.message); if (!x.body.remaining) break; }
}
console.log(log.join('\n'));
let st = (await api('state')).body;
const names = st.accounts.map(a => a.name).sort();
ok(names.includes('Acme Flow Controls') && names.includes('Northpeak Pharma'), 'sourced companies added as accounts');
ok(!names.includes('Accenture'), 'vendor excluded');
// TheirStack sourcing
await api('settings', { keys: { theirstack: 'ts-test-KEY1' } });
let tsr = await api('run', { stage: 'source', used: 0 });
let tsr2 = await api('run', { stage: 'source', used: 0 });
let st2 = (await api('state')).body;
const ridge = st2.accounts.find(a => a.name === 'Ridgeway Chemicals');
ok(tsr.status === 200 && ridge && ridge.domain === 'ridgewaychem.com' && !st2.accounts.some(a => a.name === 'Deloitte'), 'TheirStack postings add new companies with domain; consultancies excluded');
ok(globalThis.__tsBodies[0].posted_at_max_age_days === 7 && globalThis.__tsBodies[0].company_type === 'direct_employer' && globalThis.__tsBodies.every(b => b.limit <= 25) && globalThis.__tsBodies[1].posted_at_gte && !globalThis.__tsBodies[1].posted_at_max_age_days, 'TheirStack second run only asks for jobs since the last run');
ok(st2.accounts.filter(a => a.name === 'Acme Flow Controls').length === 1, 'TheirStack job at a known company updates it instead of duplicating');
await api('settings', { keys: { theirstack: null } });
ok(globalThis.__fc429 === 1 && !log.some(l => l.includes('ERROR')), 'Firecrawl rate limit is waited out and retried');
ok(st.registry.some(x => x.name === 'Accenture' && x.status === 'excluded'), 'excluded company recorded in the registry');
ok(names.includes('Valvecore Industries'), 'competitor added');
const acme = st.accounts.find(a => a.name === 'Acme Flow Controls');
ok(acme.research && acme.score.tier === '1', 'research done and tier 1 (' + acme.score.tier + ')');
ok(acme.contacts.filter(c => !c.placeholder).length === 3, 'three people found via Apollo');
ok(acme.contacts.every(c => c.placeholder || c.email), 'emails found');
ok(acme.contacts.some(c => c.draft), 'drafts written');

// second run: no duplicates
st = (await api('state')).body;
const before = st.accounts.length;
await api('run', { stage: 'source' });
st = (await api('state')).body;
ok(st.accounts.length === before, 'second sourcing run adds no duplicates');

// approve + send
const idx = acme.contacts.findIndex(c => c.draft);
r = await api('accounts', { action: 'updateContact', id: acme.id, idx, patch: { draft: { status: 'Approved' } } });
ok(r.body.account.contacts[idx].draft.status === 'Approved', 'draft approved');
r = await api('send', {});
ok(r.body.sent === 1 && globalThis.__sent.length === 1 && globalThis.__sent[0].text.includes('Reply "no"'), 'approved email sent with footer');
r = await api('send', {});
ok(r.body.sent === 0, 'sent email is never resent');

// feed import + manual add + export
r = await api('accounts', { action: 'importFeed', text: 'Tsenta page text with recommended SAP roles at several companies' });
ok(r.status === 200 && r.body.known >= 1, 'pasted feed import dedupes against known companies');
r = await api('accounts', { action: 'importFeed', source: 'Tsenta', text: 'Recommended for you\nSequoia Capital — Venture Associate — Menlo Park — 1 day ago' });
ok(r.status === 200 && r.body.relevant === 0 && /none are SAP/.test(r.body.message), 'feed with only unrelated roles explains why nothing was added');
r = await api('accounts', { action: 'importFeed', source: 'Tsenta', text: 'Bluewater Distribution — Cash Application Lead — Dallas — 2 days ago\nSequoia Capital — Venture Associate — 1 day ago' });
st = (await api('state')).body;
ok(r.status === 200 && r.body.relevant === 1 && st.accounts.some(a => a.name === 'Bluewater Distribution' && a.source === 'Tsenta') && !st.accounts.some(a => a.name === 'Sequoia Capital'), 'Tsenta feed imports relevant roles labelled by source and skips the rest');
r = await api('accounts', { action: 'add', name: 'Gulfline Midstream', domain: 'gulfline.example' });
ok(r.body.status === 'added', 'manual add works');
const ex = await fetch(`http://localhost:${port}/api/export?code=test-code`);
const buf = Buffer.from(await ex.arrayBuffer());
ok(ex.status === 200 && buf.slice(0, 2).toString() === 'PK', 'Excel export downloads (' + buf.length + ' bytes)');
const XLSX = (await import('xlsx')).default; const wb = XLSX.read(buf);
ok(['Accounts', 'Contacts', 'Signals', 'Drafts', 'Company registry'].every(n => wb.SheetNames.includes(n)), 'workbook has all five sheets');

// ---- team access, limits, starting data ----
r = await api('settings', { teamCode: 'team-pass-123' });
ok(r.status === 200 && r.body.teamSet, 'owner sets a team code');
r = await api('settings', { teamCode: 'test-code' });
ok(r.status === 400, 'team code must differ from the owner code');
const T = (p, body) => api(p, body, 'team-pass-123');
st = (await api('state')).body;
let ts1 = await T('state');
ok(ts1.status === 200 && ts1.body.role === 'team' && ts1.body.accounts.length === st.accounts.length, 'team signs in and sees the same accounts');
ok(Object.values(ts1.body.keys).every(k => !k.last4) && ts1.body.keys.anthropic.set, 'team sees which keys are connected but no key characters');
ok((await T('settings', { keys: { anthropic: 'sk-evil' } })).status === 403, 'team cannot change API keys');
ok((await T('settings', { teamCode: 'another-code-1' })).status === 403, 'team cannot change the team code');
ok((await T('test-keys', {})).status === 403, 'team cannot run key tests');
await T('settings', { settings: { limits: { anthropic: 99999 }, sender: { title: 'Co-founder' } } });
let st3 = (await api('state')).body;
ok(st3.settings.limits.anthropic === 400 && st3.settings.sender.title === 'Co-founder', 'team can edit rules and sender but not limits');
const acctId = st3.accounts[0].id;
ok((await T('accounts', { action: 'update', id: acctId, patch: { notes: 'edited by team' } })).status === 200 && (await api('state')).body.accounts.find(a => a.id === acctId).notes === 'edited by team', 'team edits are visible to the owner');
await api('settings', { settings: { limits: { anthropic: 0 } } });
r = await T('accounts', { action: 'importFeed', text: 'Bluewater Distribution — Cash Application Lead — Dallas — 2 days ago, more text' });
ok(r.status === 429 && r.body.error === 'budget', 'daily limit stops paid calls with a clear message');
await api('settings', { settings: { limits: { anthropic: 400 } } });
ok(Number((await api('state')).body.usage.anthropic) > 0, 'usage is counted per day');
ok((await api('state', null, 'wrong-team-code')).status === 401, 'wrong team code is refused');
await api('settings', { teamCode: null });
ok((await T('state')).status === 401, 'turning off team access revokes the team code');
delete process.env.DD_SKIP_SEED;
let s1 = (await api('state')).body, s2 = (await api('state')).body;
const seedNames = s1.accounts.map(a => a.name);
ok(s1.accounts.length >= st3.accounts.length + 10 && s2.accounts.length === s1.accounts.length && new Set(seedNames).size === seedNames.length, `starting accounts load once without duplicates (${s1.accounts.length} accounts)`);
ok(s1.accounts.filter(a => a.score.tier === '1').length >= 4 && s1.accounts.some(a => (a.contacts || []).some(c => c.email)), 'starting data keeps Tier 1 accounts and contacts');
srv.close();
