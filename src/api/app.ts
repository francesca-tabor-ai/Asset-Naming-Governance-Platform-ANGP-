import express, { Request, Response } from 'express';
import path from 'path';
import { config } from '../config';
import { getAuditByAssetId, listAudits } from '../audit/repository';
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
