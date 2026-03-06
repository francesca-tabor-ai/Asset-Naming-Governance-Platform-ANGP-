import { getDAMClient } from './index';
import type { CanonicalAsset } from './types';
import { enqueueManyAssetValidations, enqueueAssetValidation } from '../jobs/queue';
import type { ScanMode } from '../audit/types';

const BATCH_CHUNK_SIZE = 1000;

function toJobData(asset: CanonicalAsset, scan_mode: ScanMode) {
  return {
    asset_id: asset.id,
    filename: asset.filename,
    brand: asset.brand,
    campaign: asset.campaign,
    channel: asset.channel,
    format: asset.format,
    market: asset.market,
    language: asset.language,
    agency: asset.uploader,
    upload_date: asset.upload_date?.toISOString() ?? null,
    scan_mode,
  };
}

/** Enqueue a single asset for validation (real-time / webhook). */
export async function triggerRealtimeScan(asset: CanonicalAsset): Promise<string> {
  const jobId = await enqueueAssetValidation(toJobData(asset, 'realtime'));
  return jobId;
}

/** Enqueue assets modified after the given date (hourly batch). */
export async function triggerBatchScan(modifiedAfter: Date): Promise<number> {
  const client = getDAMClient();
  let total = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await client.listAssets({
      modifiedAfter,
      offset,
      limit: BATCH_CHUNK_SIZE,
    });
    if (result.assets.length === 0) break;
    const ids = await enqueueManyAssetValidations(
      result.assets.map((a) => toJobData(a, 'batch'))
    );
    total += ids.length;
    offset = result.nextOffset ?? offset + result.assets.length;
    hasMore = result.hasMore;
  }

  return total;
}

/** Enqueue all assets in chunks (daily full audit). */
export async function triggerFullAudit(): Promise<number> {
  const client = getDAMClient();
  let total = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await client.listAssets({
      offset,
      limit: BATCH_CHUNK_SIZE,
    });
    if (result.assets.length === 0) break;
    const ids = await enqueueManyAssetValidations(
      result.assets.map((a) => toJobData(a, 'full_audit'))
    );
    total += ids.length;
    offset = result.nextOffset ?? offset + result.assets.length;
    hasMore = result.hasMore;
  }

  return total;
}
