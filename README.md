# Asset Naming Governance Platform (ANGP)

**The quality control layer for your creative asset ecosystem.**  
ANGP ensures every asset in the DAM follows your naming and templating standards—so automation scales, search works, and governance is visible.

---

## Who this is for (Ideal Customer Profile)

ANGP is built for **global marketing and creative operations teams** who manage large volumes of digital assets across many markets, agencies, and channels.

| Role | How they use ANGP |
|------|-------------------|
| **Creative Operations** | Own template governance and asset quality; use dashboards and reports to drive compliance and reduce rework. |
| **DAM Administrators** | Control asset ingestion and metadata; use ANGP to validate before or after upload and keep the DAM searchable. |
| **Creative Agencies** | See their own violations and fix naming before delivery; avoid rejections and round-trips. |
| **Marketing Operations** | Track campaign asset performance and localisation; rely on compliant naming for automation and reporting. |

**Typical environment:** Tens of thousands of assets per year, multiple DAMs (e.g. AEM Assets, Bynder, Aprimo, Brandfolder), 100+ markets, 50+ agencies, and a need for templatisation and automation.

---

## Pain points we solve

| Pain point | Impact | How ANGP helps |
|------------|--------|-----------------|
| **Poor asset discoverability** | Wrong or inconsistent file names break DAM search; teams can’t find the right asset. | Naming convention validation and enforcement so every asset is consistently, machine-readable named. |
| **Automation failures** | Templating and localisation pipelines depend on predictable naming; bad names break workflows. | Validation at ingest (real-time or batch) so only compliant assets enter automation. |
| **No governance visibility** | Creative Ops can’t see compliance rates, violation trends, or which agencies or markets underperform. | Audit database, compliance dashboards (Phase 2), and monthly governance reports. |
| **Manual QC bottlenecks** | People manually check filenames and templates; it doesn’t scale with global production. | Automated scanning, validation, and alerts so QC is continuous and violations are flagged immediately. |

---

## What ANGP delivers

- **Automated DAM scanning** — Connect to your DAM (Bynder, AEM, Aprimo, Brandfolder); scan in real time on upload, hourly batch, or daily full audit.
- **Naming convention validation** — Rules engine checks filenames against your schema (e.g. `BRAND-PRODUCT-CAMPAIGN-CHANNEL-FORMAT-LANGUAGE-MARKET`), with configurable channel allowlists, format dimensions, and ISO language/market codes.
- **Real-time alerting** — Invalid filenames trigger notifications to Slack or Microsoft Teams (and optionally Jira) so uploaders and governance owners can act fast.
- **Audit trail and drill-down** — Every scan is stored; filter by brand, campaign, market, agency, channel, and date for remediation and reporting.
- **Scalable by design** — Built for 100,000+ assets, &lt;5 min latency on upload, and horizontal scaling of workers.

**Success outcomes:** Higher naming compliance (&gt;97% target), better DAM discoverability, fewer automation failures, and significant reduction in manual QC.

---

## Technical overview

- **Stack:** Node.js, TypeScript, PostgreSQL (audit store), Redis + BullMQ (job queue).
- **Integrations:** DAM adapters (stub + Bynder in Phase 1); Slack and Teams webhooks for alerts.
- **UI & design:** Dashboard at `/` (see [Design system](#design-system)). Humanist sans-serif (Source Sans 3), minimal palette with cool greys and a signature gradient accent, rounded components, strong typographic hierarchy.

### Design system

The app uses a consistent design language: **humanist sans-serif** typography (high legibility, technical but friendly), **minimal + expressive** colour (black/white, cool greys, signature purple–blue–pink–orange gradient used sparingly), **rounded UI** and generous white space. Tokens live in `public/css/design-tokens.css`; override or extend for branding.

### Requirements

- Node.js 18+
- PostgreSQL
- Redis (for BullMQ)

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set at least:

   - `DATABASE_URL` – PostgreSQL connection string
   - `REDIS_URL` – Redis connection string (default `redis://localhost:6379`)

3. **Run database migrations**

   ```bash
   npm run migrate:up
   ```

4. **Start the application**

   ```bash
   npm run dev
   ```

   Or for production: `npm run build && npm start`

The API and BullMQ worker run in the same process. The API listens on `PORT` (default 3000).

**Phase 1 scope:** Validation, audit API, Bynder + stub DAM, Slack/Teams alerts, dashboard, scan modes. **Coming next:** Compliance dashboards (trends, breakdowns), governance reports. See [ROADMAP.md](ROADMAP.md) and [Runbook](docs/RUNBOOK.md) for operations (cron, env checklist, scaling).

### API (Phase 1)

- **GET /health** – Health check.
- **GET /internal/audit?assetId=...** – Get compliance result for one asset.
- **GET /internal/audit** – List audits with optional filters: `brand`, `campaign`, `market`, `agency`, `channel`, `compliance_status`, `from_date`, `to_date`, `limit`.
- **GET /internal/audit/aggregates** – Compliance breakdown: `group_by=brand|campaign|market|agency|channel`, optional `from_date`, `to_date`.
- **GET /internal/audit/trend** – Compliance over time: optional `from_date`, `to_date`, `bucket=day|week`.
- **GET /internal/audit/report** – Governance report: JSON (default) or CSV (`format=csv` or `Accept: text/csv`). Optional `from_date`, `to_date`. Includes summary, breakdown by brand/market/agency, and top violations.
- **POST /internal/scan** – Trigger a scan:
  - `{ "mode": "realtime", "assetId": "<uuid>" }` – validate one asset (DAM must support `getAssetById`).
  - `{ "mode": "batch" }` or `{ "mode": "batch", "modifiedAfter": "<ISO date>" }` – hourly batch (assets modified since given time, default last hour).
  - `{ "mode": "full_audit" }` – daily full audit (all assets in chunks).

### Scan modes

| Mode        | Use case              | Frequency (configure externally) |
| ----------- | --------------------- | --------------------------------- |
| Real-time   | On asset upload       | Webhook or event from DAM         |
| Batch       | Recent changes        | e.g. hourly cron                  |
| Full audit  | Complete compliance   | e.g. daily cron                   |

Trigger batch or full audit via cron calling `POST /internal/scan` with the desired `mode`.

### DAM adapter

Set `DAM_PROVIDER=stub` (default) for development with fake data. For Bynder set:

- `DAM_PROVIDER=bynder`
- `BYNDER_BASE_URL` – Bynder instance URL
- `BYNDER_TOKEN` – API token

### Alerts

When a filename fails validation, the worker sends an alert to configured channels:

- **Slack:** set `SLACK_WEBHOOK_URL` (incoming webhook).
- **Microsoft Teams:** set `TEAMS_WEBHOOK_URL` (incoming webhook).

### Naming convention

Default pattern: `BRAND-PRODUCT-CAMPAIGN-CHANNEL-FORMAT-LANGUAGE-MARKET` (e.g. `BRAND-PRODUCT-CAMPAIGN-IAB-300x250-EN-UK.psd`). Channel and format are validated against an allowlist and dimensions regex; language and market must be two-letter codes.

**Configurable schema:** Set `SCHEMA_CONFIG_PATH` to a JSON file (see `schema-config.example.json`), or override via env: `SCHEMA_SEPARATOR`, `SCHEMA_CHANNEL_ALLOWLIST`, `SCHEMA_FORMAT_DIMENSIONS_REGEX`, `SCHEMA_LANGUAGE_ALLOWLIST`, `SCHEMA_MARKET_ALLOWLIST`, `SCHEMA_SEGMENT_ORDER`. Env overrides file; both override defaults.

### Tests

```bash
npm test
```

---

## License

Proprietary.
