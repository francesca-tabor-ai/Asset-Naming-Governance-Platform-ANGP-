# Asset Naming Governance Platform (ANGP)

Automated DAM scanning, naming convention validation, and compliance alerting for creative asset ecosystems.

## Requirements

- Node.js 18+
- PostgreSQL
- Redis (for BullMQ)

## Setup

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

## API (Phase 1)

- **GET /health** – Health check.
- **GET /internal/audit?assetId=...** – Get compliance result for one asset.
- **GET /internal/audit** – List audits with optional filters: `brand`, `campaign`, `market`, `agency`, `channel`, `compliance_status`, `from_date`, `to_date`, `limit`.
- **POST /internal/scan** – Trigger a scan:
  - `{ "mode": "realtime", "assetId": "<uuid>" }` – validate one asset (DAM must support `getAssetById`).
  - `{ "mode": "batch" }` or `{ "mode": "batch", "modifiedAfter": "<ISO date>" }` – hourly batch (assets modified since given time, default last hour).
  - `{ "mode": "full_audit" }` – daily full audit (all assets in chunks).

## Scan modes

| Mode        | Use case              | Frequency (configure externally) |
| ----------- | --------------------- | --------------------------------- |
| Real-time   | On asset upload       | Webhook or event from DAM         |
| Batch       | Recent changes        | e.g. hourly cron                  |
| Full audit  | Complete compliance   | e.g. daily cron                  |

Trigger batch or full audit via cron calling `POST /internal/scan` with the desired `mode`.

## DAM adapter

Set `DAM_PROVIDER=stub` (default) for development with fake data. For Bynder set:

- `DAM_PROVIDER=bynder`
- `BYNDER_BASE_URL` – Bynder instance URL
- `BYNDER_TOKEN` – API token

## Alerts

When a filename fails validation, the worker sends an alert to configured channels:

- **Slack**: set `SLACK_WEBHOOK_URL` (incoming webhook).
- **Microsoft Teams**: set `TEAMS_WEBHOOK_URL` (incoming webhook).

## Naming convention

Default pattern: `BRAND-PRODUCT-CAMPAIGN-CHANNEL-FORMAT-LANGUAGE-MARKET` (e.g. `BRAND-PRODUCT-CAMPAIGN-IAB-300x250-EN-UK.psd`). Channel and format are validated against an allowlist and dimensions regex; language and market must be two-letter codes.

## Tests

```bash
npm test
```

## License

Proprietary.
