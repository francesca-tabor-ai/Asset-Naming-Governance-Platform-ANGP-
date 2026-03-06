# ANGP Product Roadmap

High-level product direction. Update quarterly or when major themes ship.

---

## Phase 1 (current)

**Delivered:**

- Naming convention validation (rules engine, configurable via env/file)
- Audit store (PostgreSQL) and API: get by asset, list with filters (brand, campaign, market, agency, channel, compliance_status, date range)
- Scan modes: real-time (single asset), batch (e.g. hourly), full audit (e.g. daily)
- DAM adapter: stub (dev) + Bynder
- Alerts: Slack and Microsoft Teams on validation failure
- Dashboard at `/`: compliance at a glance, recent audits, trigger batch/full scan

See [README](README.md) for setup and [Runbook](docs/RUNBOOK.md) for operations.

---

## Next

- **Compliance dashboards** — Compliance over time (trend), breakdown by brand/campaign/market/agency/channel, worst offenders (top violating assets or sources).
- **Governance reports** — Export (e.g. CSV) and scheduled reports: period summary, breakdown by dimension, top violations. Supports monthly governance rituals.

---

## Later

- **More DAM adapters** — AEM Assets, Aprimo, Brandfolder (prioritised by demand).
- **Jira alerts** — Optional alert channel for remediation in Jira.
- **Multi-tenant / multi-schema** — Schema-per-tenant or per-brand when one deployment serves multiple divisions.

---

## Ongoing

- **DAM webhooks** — Document Bynder webhook setup for real-time; add webhook handling for other adapters as built.
- **Performance and scale** — Metrics (scan duration, queue depth), worker scaling, chunk sizing for 100k+ assets.
- **Security and auth** — API keys or OAuth, authorization (who can trigger scan, see which brand), audit logging when moving beyond internal use.
