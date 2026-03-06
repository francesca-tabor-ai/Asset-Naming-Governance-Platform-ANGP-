import express, { Request, Response } from 'express';
import path from 'path';
import { config } from '../config';
import {
  getAuditByAssetId,
  listAudits,
  getAggregates,
  getComplianceTrend,
  getSummary,
  type AggregateGroupBy,
} from '../audit/repository';
import { triggerBatchScan, triggerFullAudit, triggerRealtimeScan, getDAMClient } from '../ingestion';

const app = express();
app.use(express.json());

const publicDir = path.join(process.cwd(), 'public');
app.use('/css', express.static(path.join(publicDir, 'css')));
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/internal/audit', async (req: Request, res: Response) => {
  const assetId = req.query.assetId as string | undefined;
  if (assetId) {
    const record = await getAuditByAssetId(assetId);
    if (!record) return res.status(404).json({ error: 'Asset not found' });
    return res.json(record);
  }
  const brand = req.query.brand as string | undefined;
  const campaign = req.query.campaign as string | undefined;
  const market = req.query.market as string | undefined;
  const agency = req.query.agency as string | undefined;
  const channel = req.query.channel as string | undefined;
  const compliance_status = req.query.compliance_status as 'pass' | 'fail' | undefined;
  const from_date = req.query.from_date as string | undefined;
  const to_date = req.query.to_date as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || '100', 10), 500);
  const records = await listAudits(
    {
      brand,
      campaign,
      market,
      agency,
      channel,
      compliance_status,
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
    },
    limit
  );
  res.json({ audits: records });
});

app.get('/internal/audit/aggregates', async (req: Request, res: Response) => {
  const groupBy = (req.query.group_by as AggregateGroupBy) || 'brand';
  const allowed: AggregateGroupBy[] = ['brand', 'campaign', 'market', 'agency', 'channel'];
  if (!allowed.includes(groupBy)) {
    return res.status(400).json({ error: 'Invalid group_by', allowed });
  }
  const from_date = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
  const to_date = req.query.to_date ? new Date(req.query.to_date as string) : undefined;
  const rows = await getAggregates(groupBy, from_date, to_date);
  return res.json({ aggregates: rows });
});

app.get('/internal/audit/trend', async (req: Request, res: Response) => {
  const from_date = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
  const to_date = req.query.to_date ? new Date(req.query.to_date as string) : undefined;
  const bucket = (req.query.bucket as 'day' | 'week') || 'day';
  if (bucket !== 'day' && bucket !== 'week') {
    return res.status(400).json({ error: 'Invalid bucket', expected: 'day | week' });
  }
  const rows = await getComplianceTrend(from_date, to_date, bucket);
  return res.json({ trend: rows });
});

function escapeCsvCell(s: string): string {
  const t = String(s ?? '');
  if (/[",\n\r]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
  return t;
}

app.get('/internal/audit/report', async (req: Request, res: Response) => {
  const from_date = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
  const to_date = req.query.to_date ? new Date(req.query.to_date as string) : undefined;
  const format = (req.query.format as string) || (req.get('accept')?.includes('text/csv') ? 'csv' : 'json');
  if (format !== 'csv') {
    const summary = await getSummary(from_date, to_date);
    const [byBrand, byMarket, byAgency] = await Promise.all([
      getAggregates('brand', from_date, to_date),
      getAggregates('market', from_date, to_date),
      getAggregates('agency', from_date, to_date),
    ]);
    const violations = await listAudits(
      { compliance_status: 'fail', from_date, to_date },
      500
    );
    return res.json({
      from_date: from_date?.toISOString(),
      to_date: to_date?.toISOString(),
      summary: {
        total: summary.total,
        pass: summary.pass,
        fail: summary.fail,
        compliance_pct: summary.total ? Math.round((summary.pass / summary.total) * 100) : 0,
      },
      breakdown: { brand: byBrand, market: byMarket, agency: byAgency },
      violations: violations.map((v) => ({
        filename: v.filename,
        brand: v.brand,
        campaign: v.campaign,
        market: v.market,
        agency: v.agency,
        channel: v.channel,
        scanned_at: v.scanned_at?.toISOString(),
        violation_type: v.violation_type,
      })),
    });
  }
  const summary = await getSummary(from_date, to_date);
  const compliancePct = summary.total ? Math.round((summary.pass / summary.total) * 100) : 0;
  const fromStr = from_date?.toISOString().slice(0, 10) ?? '';
  const toStr = to_date?.toISOString().slice(0, 10) ?? '';
  const [byBrand, byMarket, byAgency] = await Promise.all([
    getAggregates('brand', from_date, to_date),
    getAggregates('market', from_date, to_date),
    getAggregates('agency', from_date, to_date),
  ]);
  const violations = await listAudits(
    { compliance_status: 'fail', from_date, to_date },
    500
  );
  const rows: string[] = [];
  rows.push('Report Type,Metric,Value');
  rows.push('Summary,from_date,' + escapeCsvCell(fromStr));
  rows.push('Summary,to_date,' + escapeCsvCell(toStr));
  rows.push('Summary,total_audited,' + summary.total);
  rows.push('Summary,pass,' + summary.pass);
  rows.push('Summary,fail,' + summary.fail);
  rows.push('Summary,compliance_pct,' + compliancePct);
  rows.push('');
  rows.push('Dimension,Value,Pass,Fail,Total,Compliance %');
  for (const r of byBrand) {
    const pct = r.total ? Math.round((r.pass / r.total) * 100) : 0;
    rows.push('brand,' + escapeCsvCell(r.dimension_value) + ',' + r.pass + ',' + r.fail + ',' + r.total + ',' + pct);
  }
  for (const r of byMarket) {
    const pct = r.total ? Math.round((r.pass / r.total) * 100) : 0;
    rows.push('market,' + escapeCsvCell(r.dimension_value) + ',' + r.pass + ',' + r.fail + ',' + r.total + ',' + pct);
  }
  for (const r of byAgency) {
    const pct = r.total ? Math.round((r.pass / r.total) * 100) : 0;
    rows.push('agency,' + escapeCsvCell(r.dimension_value) + ',' + r.pass + ',' + r.fail + ',' + r.total + ',' + pct);
  }
  rows.push('');
  rows.push('Filename,Brand,Campaign,Market,Agency,Channel,Scanned At,Violation Types');
  for (const v of violations) {
    rows.push(
      escapeCsvCell(v.filename) + ',' +
      escapeCsvCell(v.brand ?? '') + ',' +
      escapeCsvCell(v.campaign ?? '') + ',' +
      escapeCsvCell(v.market ?? '') + ',' +
      escapeCsvCell(v.agency ?? '') + ',' +
      escapeCsvCell(v.channel ?? '') + ',' +
      escapeCsvCell(v.scanned_at?.toISOString() ?? '') + ',' +
      escapeCsvCell((v.violation_type || []).join('; '))
    );
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="angp-governance-report.csv"');
  res.send(rows.join('\n'));
});

app.post('/internal/scan', async (req: Request, res: Response) => {
  const mode = (req.body?.mode ?? req.query.mode) as string;
  if (mode === 'realtime' && req.body?.assetId) {
    const client = getDAMClient();
    const getAsset = client.getAssetById ?? (async () => null);
    const asset = await getAsset(req.body.assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const jobId = await triggerRealtimeScan(asset);
    return res.json({ mode: 'realtime', jobId });
  }
  if (mode === 'batch') {
    const modifiedAfter = req.body?.modifiedAfter
      ? new Date(req.body.modifiedAfter)
      : new Date(Date.now() - 60 * 60 * 1000);
    const enqueued = await triggerBatchScan(modifiedAfter);
    return res.json({ mode: 'batch', enqueued });
  }
  if (mode === 'full_audit') {
    const enqueued = await triggerFullAudit();
    return res.json({ mode: 'full_audit', enqueued });
  }
  return res.status(400).json({
    error: 'Invalid mode',
    expected: 'realtime (body: assetId) | batch (optional body: modifiedAfter) | full_audit',
  });
});

export function createApp() {
  return app;
}

export function getPort(): number {
  return config.port;
}
