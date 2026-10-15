// FlowGen ICP, scoring, email formats and personas. Edit here to retune the model.
export const ICP = {
  industries: [
    { k: 'up', label: 'Oil & gas, upstream', pts: 15, useCase: 'production revenue accounting and division orders' },
    { k: 'mid', label: 'Oil & gas, midstream', pts: 15, useCase: 'nominations and take-or-pay tracking' },
    { k: 'down', label: 'Oil & gas, downstream', pts: 15, useCase: 'three-way match and fuel replenishment' },
    { k: 'life', label: 'Life sciences', pts: 15, useCase: 'chargebacks and gross-to-net' },
    { k: 'mfg', label: 'Manufacturing', pts: 15, useCase: 'cash application, disputes and MRP adjustments' },
    { k: 'tech', label: 'Hi-tech', pts: 15, useCase: 'deal desk exceptions and revenue close' },
    { k: 'dist', label: 'Distribution', pts: 15, useCase: 'order-to-cash and invoice processing' },
    { k: 'adj', label: 'Adjacent (chemicals, utilities, medical devices)', pts: 8, useCase: 'order-to-cash and close' },
    { k: 'other', label: 'Other', pts: 0, useCase: 'order-to-cash and close' },
    { k: '', label: 'Unknown', pts: 0, useCase: 'order-to-cash and close' }
  ],
  revenue: [
    { k: 'core', label: '$500M to $15B', pts: 10 },
    { k: 'stretch', label: '$15B to $50B', pts: 6 },
    { k: 'small', label: '$200M to $500M', pts: 3 },
    { k: 'tiny', label: 'Under $200M', pts: 0, disq: true },
    { k: 'huge', label: 'Over $50B', pts: 0 },
    { k: '', label: 'Unknown', pts: 5, unconfirmed: true }
  ],
  geo: [
    { k: 'us', label: 'United States', pts: 5 }, { k: 'caul', label: 'Canada or UK', pts: 3 },
    { k: 'other', label: 'Other', pts: 0 }, { k: '', label: 'Unknown', pts: 0 }
  ],
  own: [
    { k: 'pe', label: 'PE-backed', pts: 5 }, { k: 'ssc', label: 'In-house shared services', pts: 5 },
    { k: 'public', label: 'Public', pts: 3 }, { k: 'private', label: 'Large private', pts: 3 },
    { k: 'outsourced', label: 'Finance fully outsourced', pts: 0 }, { k: '', label: 'Unknown', pts: 0 }
  ],
  sap: [
    { k: 'ecc', label: 'SAP ECC', pts: 15 }, { k: 'ecc_migrating', label: 'ECC, S/4 migration in flight', pts: 13 },
    { k: 's4_recent', label: 'S/4HANA, live under 3 years', pts: 12 }, { k: 's4_mature', label: 'S/4HANA, mature', pts: 8 },
    { k: 'ns_d365', label: 'NetSuite or Dynamics 365', pts: 4 }, { k: 'other', label: 'Other ERP', pts: 0 }, { k: 'unknown', label: 'Not found', pts: 0 }
  ],
  signals: {
    s4_job: { label: 'S/4 or SAP program job post', w: 25, hl: 60, format: 1 },
    s4_program: { label: 'S/4 program or SI announced', w: 22, hl: 90, format: 1 },
    new_leader: { label: 'New finance or IT leader', w: 20, hl: 90, format: 2 },
    mna: { label: 'Acquisition, merger or divestiture', w: 18, hl: 120, format: 3 },
    ecc_evidence: { label: 'Evidence still on ECC', w: 15, hl: 180, format: 4 },
    finance_jobs: { label: 'Manual finance roles hiring at volume', w: 12, hl: 60, format: 1 },
    filing_erp: { label: 'ERP or cost program in filings or earnings', w: 12, hl: 120, format: 2 },
    ai_initiative: { label: 'Public AI or automation initiative', w: 10, hl: 90, format: 2 },
    shared_services: { label: 'Shared-services center opening or consolidation', w: 10, hl: 120, format: 3 }
  },
  stages: ['New', 'Researching', 'Contacted', 'Replied', 'Meeting set', 'Open deal', 'Customer', 'Not now', 'Opted out'],
  blockedStages: ['Open deal', 'Customer', 'Opted out']
};

export const EXCLUDE_RE = /accenture|deloitte|kpmg|\bpwc\b|pricewaterhouse|ernst & young|\bey\b|genpact|nagarro|infosys|wipro|\btcs\b|tata consultancy|cognizant|capgemini|\bibm\b|clarkston|slalom|protiviti|\brsm\b|grant thornton|elliot davis|shrive|westernacher|attain partners|staffing|consult|recruit|robert half|insight global|teksystems|randstad|kforce|\bsap se\b|^sap\b|sap it business|flowgen/i;

export const FORMATS = {
  1: { name: 'S/4 or SAP job posting', subject: 'the {{role_short}} role at {{company}}', body: "Hi {{first_name}},\n\nSaw {{company}} is hiring for {{signal_detail}}. That usually means the S/4 work is getting real, while order-to-cash and close still have to run every day.\n\nFlowGen puts AI agents to work inside SAP, on ECC or S/4, without customizing the core. Veritiv had agents running in its SAP workflows within four weeks.\n\nWould it be useful to see which {{industry_use_case}} steps teams hand to agents during a migration?\n\n{{sender_first_name}}" },
  2: { name: 'New finance or IT leader', subject: 'first months at {{company}}', body: "Hi {{first_name}},\n\nCongrats on the {{new_role}} role. New finance and IT leaders usually get asked for the same two things early: a faster close and less manual work in SAP.\n\nFlowGen runs those processes with AI agents inside SAP. We go from discovery to production in under 10 weeks and price on outcomes, so it shows up as a result rather than a project. Veritiv reports $9M+ in annual process savings.\n\nWant a one-page view of what's usually automatable in an SAP finance team like yours?\n\n{{sender_first_name}}" },
  3: { name: 'Acquisition or merger', subject: 'two ERPs after {{deal}}', body: "Hi {{first_name}},\n\nCongrats on {{deal}}. Integrations often leave finance running two ERPs side by side for longer than planned, with people bridging the gap by hand.\n\nFlowGen's agents work inside SAP, and are live on NetSuite and Dynamics 365 too, so they can run reconciliation and order-to-cash across both while the systems come together.\n\nIs ERP consolidation on the plan for this year?\n\n{{sender_first_name}}" },
  4: { name: 'ECC 2027 deadline', subject: 'ECC after 2027', body: "Hi {{first_name}},\n\nLooks like {{company}} still runs SAP ECC ({{ecc_evidence}}). With mainstream maintenance ending in 2027, teams in that spot are usually weighing a big S/4 move against modernizing in steps.\n\nFlowGen works on either path. Our agents run inside ECC today, move with you to S/4, and keep the core clean. That means the automation you get now isn't thrown away in the migration.\n\nWorth comparing notes on how you're approaching it?\n\n{{sender_first_name}}" }
};

export const PERSONAS = {
  champion: { label: 'Champion', value: 'No workshops or multi-quarter discovery; production in under 10 weeks.', titles: ['Director Enterprise Applications', 'VP Enterprise Applications', 'Head of ERP', 'SAP Director', 'Director Finance Transformation'], search: 'Director or VP of Enterprise Applications, Head of ERP or SAP, Finance Transformation lead', kw: 'enterprise applications ERP SAP' },
  econ_fin: { label: 'Economic buyer, finance', value: 'Agents take over manual order-to-cash and close steps inside SAP, priced on outcomes.', titles: ['Chief Financial Officer', 'CFO', 'VP Finance', 'Corporate Controller'], search: 'CFO, VP Finance, Controller', kw: 'CFO VP Finance' },
  econ_it: { label: 'Economic buyer, IT', value: 'Agents connect to SAP in place and keep a clean core, on ECC or S/4.', titles: ['Chief Information Officer', 'CIO', 'VP IT', 'VP Information Technology'], search: 'CIO, VP IT', kw: 'CIO VP IT' },
  controller: { label: 'Controller', value: 'Every agent action is logged and exportable for audit, and SOC 1 and SOC 2 are in place.', titles: ['Controller', 'Chief Accounting Officer'], search: 'Controller, Chief Accounting Officer', kw: 'Controller' },
  gatekeeper: { label: 'Technical gatekeeper', value: 'Connects in place with clean core; SOC 1 and SOC 2; deploys in your AWS VPC or on SAP BTP.', titles: ['Enterprise Architect', 'SAP Basis Lead'], search: 'Enterprise architect, SAP Basis lead', kw: 'enterprise architect SAP' },
  user: { label: 'Process owner', value: 'Agents take the repetitive steps off your team inside SAP.', titles: ['Accounts Receivable Manager', 'Revenue Accounting Manager'], search: 'AR, AP or revenue accounting manager', kw: 'accounts receivable manager' }
};
export const DEFAULT_SLOTS = ['champion', 'econ_fin', 'econ_it'];

export const PROOF = ['Veritiv got a working AI solution in its SAP workflows in four weeks', 'Veritiv: $9M+ annual process savings', 'Discovery to production in under 10 weeks', 'Outcome-based pricing', 'Connects to SAP ECC and S/4HANA with clean core; also live on NetSuite, Dynamics 365, QuickBooks', 'SOC 1 and SOC 2, SOX-ready, full audit trail'];

export const slug = x => String(x || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
export const normDomain = d => String(d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[\/?#]/)[0];
export const docId = (domain, name) => { const d = normDomain(domain); return d ? d.replace(/[^a-z0-9_\-.~]/g, '-').slice(0, 180) : ('co-' + (slug(name) || Date.now())); };
export const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
export const today = () => new Date().toISOString().slice(0, 10);
const find = (list, k) => list.find(o => o.k === (k || '')) || list[list.length - 1];
const daysSince = d => { const t = Date.parse(d); return isNaN(t) ? null : Math.max(0, Math.round((Date.now() - t) / 864e5)); };

export function roleFor(title) {
  const t = String(title || '').toLowerCase();
  if (/\bcfo\b|chief financial|vp,? finance|vice president,? finance|chief accounting|head of finance/.test(t)) return 'econ_fin';
  if (/controller|comptroller/.test(t)) return 'controller';
  if (/\bcio\b|\bcto\b|chief information|chief digital|chief technology|vp,? (it|information)|vice president,? (it|information)/.test(t)) return 'econ_it';
  if (/basis|architect|security|\bgrc\b/.test(t)) return 'gatekeeper';
  if (/enterprise app|digital|\berp\b|\bsap\b|transformation|business systems|applications/.test(t)) return 'champion';
  return 'user';
}

export function score(a) {
  const ind = find(ICP.industries, a.industry), rev = find(ICP.revenue, a.revenue), geo = find(ICP.geo, a.geo), own = find(ICP.own, a.ownership);
  const sapKey = a.sapOverride || a.research?.sap?.landscape || 'unknown';
  const sap = ICP.sap.find(o => o.k === sapKey) || ICP.sap[ICP.sap.length - 1];
  const fit = ind.pts + rev.pts + geo.pts + own.pts + sap.pts;
  const sigs = [...(a.importedSignals || []), ...(a.research?.signals || [])].map(s => {
    const def = ICP.signals[s.type]; if (!def) return null;
    const age = s.date ? daysSince(s.date) : null;
    const cur = def.w * Math.pow(0.5, (age == null ? 45 : age) / def.hl);
    return { ...s, label: def.label, weight: def.w, format: def.format, age, cur: Math.round(cur * 10) / 10 };
  }).filter(Boolean).sort((x, y) => y.cur - x.cur);
  const timing = Math.min(50, sigs.reduce((t, s) => t + s.cur, 0));
  let tier = null;
  if (ICP.blockedStages.includes(a.stage)) tier = 'blocked';
  else if (rev.disq) tier = 'out';
  else if (a.research || (a.importedSignals || []).length) {
    if (fit >= 35 && timing >= 20) tier = '1'; else if (fit >= 35) tier = '2'; else if (timing >= 20) tier = '3'; else tier = 'out';
  }
  return {
    fit, timing: Math.round(timing * 10) / 10, tier, signals: sigs, useCase: ind.useCase,
    parts: [['Industry', ind.label, ind.pts, 15], ['SAP landscape', sap.label, sap.pts, 15], ['Revenue', rev.label + (rev.unconfirmed ? ' (unconfirmed)' : ''), rev.pts, 10], ['HQ', geo.label, geo.pts, 5], ['Ownership and ops', own.label, own.pts, 5]]
  };
}

export function pickFormat(a, sc) {
  if (sc.signals[0]) return sc.signals[0].format;
  const k = a.sapOverride || a.research?.sap?.landscape;
  return (k === 'ecc' || k === 'ecc_migrating') ? 4 : 2;
}
