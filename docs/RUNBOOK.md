# ANGP Runbook

Operations guide for running and scaling ANGP.

---

## Environment checklist

Before going live, ensure:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis for BullMQ (default `redis://localhost:6379`) |
| `PORT` | No | Default 3000 |
| `DAM_PROVIDER` | No | `stub` (default) or `bynder` |
| `BYNDER_BASE_URL`, `BYNDER_TOKEN` | If Bynder | For DAM integration |
| `SLACK_WEBHOOK_URL` | No | Alerts on validation failure |
| `TEAMS_WEBHOOK_URL` | No | Alerts on validation failure |
| `SCHEMA_CONFIG_PATH` | No | Path to naming schema JSON (optional) |

See `.env.example` for optional naming schema env overrides (`SCHEMA_SEPARATOR`, `SCHEMA_CHANNEL_ALLOWLIST`, etc.).

---

## Cron: triggering scans

The app does not schedule scans itself. Use cron (or your scheduler) to call the scan API.

**Hourly batch** (assets modified in the last hour):

```bash
curl -X POST http://localhost:3000/internal/scan \
  -H "Content-Type: application/json" \
  -d '{"mode":"batch"}'
```

With explicit `modifiedAfter` (ISO 8601):

```bash
curl -X POST http://localhost:3000/internal/scan \
  -H "Content-Type: application/json" \
  -d '{"mode":"batch","modifiedAfter":"2025-03-05T10:00:00Z"}'
```

**Daily full audit** (all assets, in chunks):

```bash
curl -X POST http://localhost:3000/internal/scan \
  -H "Content-Type: application/json" \
  -d '{"mode":"full_audit"}'
```

Example crontab (batch at :00 every hour; full audit at 02:00 daily):

```
0 * * * * curl -s -X POST http://localhost:3000/internal/scan -H "Content-Type: application/json" -d '{"mode":"batch"}' > /dev/null 2>&1
0 2 * * * curl -s -X POST http://localhost:3000/internal/scan -H "Content-Type: application/json" -d '{"mode":"full_audit"}' > /dev/null 2>&1
```

Use a dedicated host or internal URL and ensure the app is reachable from the cron runner.

---

## Health and debugging

- **Health check:** `GET /health` — use for load balancer or readiness probes.
- **Recent audits:** `GET /internal/audit?limit=20` — verify scans are writing.
- **Filter violations:** `GET /internal/audit?compliance_status=fail&limit=50` — list recent failures.
- **Governance report (CSV):** `GET /internal/audit/report?format=csv&from_date=2025-01-01&to_date=2025-01-31` — download period summary, breakdown by brand/market/agency, and top violations. Omit dates for all-time.

Logs: ensure stdout/stderr are captured (e.g. by your process manager). The app logs request and job activity.

---

## Scaling

- **Single process:** API and BullMQ worker run in the same process (`npm run dev` / `npm start`). Suitable for moderate volume.
- **Workers:** To scale validation throughput, run additional worker-only processes (consume from same Redis queue). Codebase would need a worker-only entrypoint; today use one process.
- **Database:** Use connection pooling (e.g. PgBouncer) if you run multiple instances. Run migrations once before scaling.
- **Redis:** Single instance is enough for typical queue depth; use Redis HA if required.

---

## Migrations

```bash
npm run migrate:up   # apply pending migrations
npm run migrate:down # rollback last migration (use with care)
```

Run `migrate:up` after deploy before starting the app.
