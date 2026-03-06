import { config } from '../config';
import { createBynderDAMClient } from './bynderAdapter';
import type { DAMClient } from './DAMClient';
import { createStubDAMClient } from './stubAdapter';

export * from './types';
export * from './DAMClient';
export { createStubDAMClient } from './stubAdapter';
export { createBynderDAMClient } from './bynderAdapter';
export { triggerRealtimeScan, triggerBatchScan, triggerFullAudit } from './scanTriggers';

/** Resolve DAM client from config (provider + env). */
export function getDAMClient(): DAMClient {
  if (config.dam.provider === 'bynder') {
    const baseUrl = process.env.BYNDER_BASE_URL;
    const token = process.env.BYNDER_TOKEN;
    if (!baseUrl || !token) {
      throw new Error('BYNDER_BASE_URL and BYNDER_TOKEN are required when DAM_PROVIDER=bynder');
    }
    return createBynderDAMClient({ baseUrl, token });
  }
  return createStubDAMClient();
}
