import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { upsertAudit } from '../audit/repository';
import { validateFilename } from '../rules/validator';
import type { AssetValidationJobData } from './queue';
import { ASSET_VALIDATION_QUEUE_NAME } from './queue';

const connection = { url: config.redis.url };

export function createAssetValidationWorker(
  onViolations?: (job: Job<AssetValidationJobData>, violationTypes: string[]) => void
): Worker<AssetValidationJobData> {
  const worker = new Worker<AssetValidationJobData>(
    ASSET_VALIDATION_QUEUE_NAME,
    async (job) => {
      const { asset_id, filename, scan_mode, brand, campaign, channel, format, market, language, agency, upload_date } =
        job.data;

      const result = validateFilename(filename);
      const compliance_status = result.pass ? 'pass' : 'fail';
      const violation_type = result.violations.map((v) => v.type);
      const parsed = result.parsed;

      await upsertAudit({
        asset_id,
        filename,
        compliance_status,
        violation_type,
        brand: brand ?? parsed?.brand ?? null,
        campaign: campaign ?? parsed?.campaign ?? null,
        channel: channel ?? parsed?.channel ?? null,
        format: format ?? parsed?.format ?? null,
        language: language ?? parsed?.language ?? null,
        market: market ?? parsed?.market ?? null,
        agency: agency ?? null,
        upload_date: upload_date ? new Date(upload_date) : null,
        scan_mode,
      });

      if (!result.pass && onViolations) {
        onViolations(job, violation_type);
      }
    },
    { connection, concurrency: 10 }
  );

  worker.on('failed', (job, err) => {
    console.error('Asset validation job failed', job?.id, err);
  });

  return worker;
}
