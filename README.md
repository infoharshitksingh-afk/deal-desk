# FlowGen Deal Desk

An outbound agent for founder-led sales. One run:

1. **Sources** new job postings for SAP and finance-transformation roles across job portals (Greenhouse, Lever, Workday, Ashby, LinkedIn Jobs) using Firecrawl.
2. **Checks the company registry**, so a company is never added or researched twice. Consultancies, integrators, staffing firms and SAP vendors are excluded and remembered.
3. **Researches** each new company (website, careers page, news, SAP landscape) with Firecrawl and Claude, and scores it against the FlowGen ICP (fit and timing, tiers 1–3).
4. **Finds competitors** of similar scale for strong-fit accounts and adds them to the queue.
5. **Finds people** for Tier 1 accounts (champion, finance buyer, IT buyer) through Apollo, with LinkedIn and Sales Navigator search links for manual entry.
6. **Finds emails** through Apollo or Hunter (optional, capped per run).
7. **Drafts** a first email from one of four signal-based formats.
8. **Sends** only the drafts you approve, through Resend or Gmail/SMTP, with an opt-out list and a daily cap.

Everything exports to Excel (Accounts, Contacts, Signals, Drafts, Company registry).

## Deploy (about 10 minutes)

1. Push this folder to a private GitHub repository.
2. In Vercel, choose **Add New → Project**, import the repository and deploy. No build settings are needed.
3. In the project, go to **Storage → Marketplace → Upstash (Redis)**, create a free database and connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. In **Settings → Environment Variables**, add `ACCESS_CODE`, a long passphrase the team will use to sign in. Optionally add `CRON_SECRET` to turn on the weekday scheduled run.
5. **Redeploy** so the variables take effect.
6. Open the site and enter the access code. In **Settings**, paste your API keys and fill in the sender details, then press **Run full pipeline**.

To start from the accounts already sourced, use **Import and export → Import CSV or JSON** with `deal-desk-seed-accounts.json`.

## API keys

| Service | Used for | Required |
|---|---|---|
| Anthropic | Reading job feeds, research, competitors, drafts | Yes |
| Firecrawl | Job search, website and careers pages, news | Yes |
| Apollo.io | People search and work emails (People Search needs a paid plan) | No |
| Hunter.io | Work emails when Apollo has none | No |
| Resend, or Gmail/SMTP | Sending approved emails | Only to send |
| ZoomInfo, Clay, RocketReach | Placeholders for later | No |

Keys pasted in Settings are encrypted (AES-256-GCM, with the key derived from `ACCESS_CODE`) and stored in your Redis. They are never sent back to the browser. Keys set as environment variables take priority. If you change `ACCESS_CODE`, paste the keys again.

## How runs work

Each pipeline stage does one unit of work per request (one search batch, one account, one email), so runs never hit serverless time limits. The Run page calls the stages in order and shows each step live. The optional cron (`vercel.json`, weekdays at 13:00 UTC) runs the same stages for up to about 4.5 minutes. It never sends email.

## Settings worth knowing

- **Roles and portals** decide what sourcing searches for. Fewer, sharper roles give cleaner results.
- **New companies per run** caps how many companies are added in each run (default 15).
- **Competitors per account** defaults to 3. Competitors don't spawn competitors of their own.
- **Find emails automatically** is off by default because it spends Apollo or Hunter credits.
- **Exclude list** keeps existing customers or partners out.

## Sending rules

- Only drafts marked **Approved** are sent, and a sent email is never resent.
- Nothing sends until the footer includes a mailing address and an opt-out line.
- Emails or domains on the opt-out list are blocked.
- A daily cap (default 25) applies across all sends.
- For more than a few dozen emails a day, send from a separate domain with SPF, DKIM and DMARC set up.

## Local development

```bash
npm install
ACCESS_CODE=dev node scripts/dev-server.js           # real APIs, data stored in /tmp
ACCESS_CODE=dev MOCK=1 node scripts/dev-server.js    # fake APIs, no keys needed
npm test                                             # end-to-end test with fake APIs
```

## Changing the model

`api/_lib/icp.js` holds the ICP, signal weights, email formats and personas. `api/_lib/providers.js` holds every outside API endpoint in one place.
