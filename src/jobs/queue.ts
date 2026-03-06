import { Queue } from 'bullmq';
import { config } from '../config';

const connection = { url: config.redis.url };

export const ASSET_VALIDATION_QUEUE_NAME = 'angp:asset-validation';

export interface AssetValidationJobData {
  asset_id: string;
  filename: string;
  brand?: string | null;
  campaign?: string | null;
  channel?: string | null;
  format?: string | null;
  market?: string | null;
  language?: string | null;
  agency?: string | null;
  upload_date?: string | null; // ISO string
  scan_mode: 'realtime' | 'batch' | 'full_audit';
}

export const assetValidationQueue = new Queue<AssetValidationJobData>(ASSET_VALIDATION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 10000 },
  },
});

export async function enqueueAssetValidation(data: AssetValidationJobData): Promise<string> {
  const job = await assetValidationQueue.add('validate', data, {
    jobId: data.asset_id, // optional: dedupe by asset_id for idempotency within a run
  });
  return job.id!;
}

export async function enqueueManyAssetValidations(
  items: AssetValidationJobData[]
): Promise<string[]> {
  const jobs = await assetValidationQueue.addBulk(
    items.map((data) => ({ name: 'validate', data }))
  );
  return jobs.map((j) => j.id!);
}
