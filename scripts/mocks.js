// Fake responses for every outside API, so the full pipeline can be exercised without keys or network.
const real = globalThis.fetch;
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
globalThis.__sent = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url), body = opts.body ? JSON.parse(opts.body) : {};
  if (u.includes('api.theirstack.com/v1/jobs/search')) {
    (globalThis.__tsBodies ||= []).push(body);
    return json({ metadata: {}, data: [
      { job_title: 'SAP S/4HANA Finance Lead', company: 'Ridgeway Chemicals', company_domain: 'ridgewaychem.com', short_location: 'Houston, TX', final_url: 'https://boards.greenhouse.io/ridgeway/jobs/9', date_posted: new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10), technology_slugs: ['sap-s4hana'], company_object: { employee_count: 2400 } },
      { job_title: 'ERP Program Manager', company: 'Acme Flow Controls', company_domain: 'acmeflow.com', short_location: 'Houston, TX', url: 'https://x/2', date_posted: new Date().toISOString().slice(0, 10) },
      { job_title: 'SAP Consultant', company: 'Deloitte', company_domain: 'deloitte.com', url: 'https://x/3' } ] });
  }
  if (u.includes('api.firecrawl.dev/v2/search')) {
    globalThis.__fcCalls = (globalThis.__fcCalls || 0) + 1;
    if (globalThis.__fcCalls === 2) { globalThis.__fc429 = (globalThis.__fc429 || 0) + 1; return json({ success: false, error: 'Rate limit exceeded. Consumed (req/min): 17, Remaining (req/min): 0. please retry after 1s' }, 429); }
    const q = body.query || '';
    if (q.startsWith('site:boards.greenhouse.io')) return json({ success: true, data: { web: [
      { url: 'https://boards.greenhouse.io/acmeflow/jobs/1', title: 'Senior SAP S/4HANA Finance Lead at Acme Flow Controls', description: 'Posted 3 days ago. Lead our S/4HANA migration.' },
      { url: 'https://boards.greenhouse.io/accenture/jobs/2', title: 'SAP Integration Lead at Accenture', description: 'Consulting role' } ] } });
    if (q.startsWith('site:')) return json({ success: true, data: { web: [{ url: 'https://jobs.lever.co/northpeak/3', title: 'SAP Program Manager - Northpeak Pharma', description: 'Finance transformation, 5 days ago' }] } });
    if (q.includes('official website')) return json({ success: true, data: { web: [{ url: 'https://www.' + q.split(' ')[0].toLowerCase() + '.com/', title: 'Home' }] } });
    if (q.includes('careers')) return json({ success: true, data: { web: [{ url: 'https://www.' + q.split(' ')[0].toLowerCase() + '.com/careers', title: 'Careers - open jobs' }] } });
    if (q.includes('competitors')) return json({ success: true, data: { web: [{ url: 'https://example.com/x', title: 'Top competitors', description: 'Valvecore and Rotalink compete' }] } });
    return json({ success: true, data: { web: [{ url: 'https://news.example.com/a', title: 'Company names new CFO', description: 'Named new CFO in September' }], news: [{ url: 'https://news.example.com/b', title: 'New CFO appointed', snippet: 'appointed a new CFO', date: '2026-09-20' }] } });
  }
  if (u.includes('api.firecrawl.dev/v2/scrape')) return json({ success: true, data: { markdown: 'Open roles: SAP S/4HANA delivery manager; we run SAP ECC today.' } });
  if (u.includes('api.anthropic.com')) {
    const p = body.messages[0].content;
    let out;
    if (p.startsWith('Extract job postings')) out = [
      { company: 'Acme Flow Controls', title: 'Senior SAP S/4HANA Finance Lead', location: 'Houston, TX', days_ago: 3, url: 'https://boards.greenhouse.io/acmeflow/jobs/1', vendor: false },
      { company: 'Accenture', title: 'SAP Integration Lead', location: '', days_ago: 2, vendor: true },
      { company: 'Northpeak Pharma', title: 'SAP Program Manager', location: 'NJ', days_ago: 5, vendor: false }];
    else if (p.startsWith('You research')) out = { summary: 'Industrial manufacturer with SAP ECC.', segment: p.includes('Pharma') ? 'life' : 'mfg', revenue: 'core', hq: 'us', sap: { landscape: 'ecc_migrating', evidence: 'we run SAP ECC today', source: 'S1' }, signals: [{ type: 'new_leader', quote: 'appointed a new CFO', source: 'S1', date: '2026-09-20', why: 'new leader' }], disqualifiers: [], outreach_angle: 'migration' };
    else if (p.startsWith('List direct competitors')) out = [{ name: 'Valvecore Industries', domain: 'valvecore.com', why: 'similar valves' }, { name: 'Accenture', domain: '', why: 'bad' }];
    else if (p.startsWith('Write a first cold email')) out = { subject: 'the sap lead role at acme', body: 'Hi Dana,\n\nSaw Acme is hiring a Senior SAP S/4HANA Finance Lead.\n\nKriti' };
    else out = {};
    return json({ content: [{ type: 'text', text: JSON.stringify(out) }] });
  }
  if (u.includes('mixed_people/api_search')) return json({ people: [
    { id: 'a1', first_name: 'Dana', last_name: 'Ruiz', title: 'Chief Financial Officer', linkedin_url: 'https://www.linkedin.com/in/dana-ruiz' },
    { id: 'a2', first_name: 'Sam', last_name: 'Ito', title: 'Director, Enterprise Applications', linkedin_url: 'https://www.linkedin.com/in/sam-ito' },
    { id: 'a3', first_name: 'Lee', last_name: 'Park', title: 'CIO', linkedin_url: '' }] });
  if (u.includes('people/match')) return json({ person: { first_name: 'X', last_name: 'Y', email: (body.id || 'p') + '@acmeflow.com', email_status: 'verified' } });
  if (u.includes('api.hunter.io')) return json({ data: { email: 'h@example.com', verification: { status: 'valid' } } });
  if (u.includes('api.resend.com')) { globalThis.__sent.push(body); return json({ id: 'msg_' + globalThis.__sent.length }); }
  return real(url, opts);
};
