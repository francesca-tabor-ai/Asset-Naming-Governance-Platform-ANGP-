import type { DAMClient } from './DAMClient';
import type { CanonicalAsset, ListAssetsOptions, ListAssetsResult } from './types';

/** Map Bynder API response to canonical asset. Bynder-specific types are inline for simplicity. */
function mapBynderToCanonical(item: Record<string, unknown>): CanonicalAsset {
  const date = item.dateCreated ?? item.dateModified;
  const meta = (item.metaproperty ?? {}) as Record<string, unknown>;
  const createdBy = (item.createdBy ?? {}) as Record<string, unknown>;
  return {
    id: String(item.id ?? ''),
    filename: String(item.name ?? item.filename ?? ''),
    brand: item.brand ? String(item.brand) : (meta.brand as string) ?? null,
    campaign: (meta.campaign as string) ?? (item.campaign as string) ?? null,
    channel: (meta.channel as string) ?? null,
    format: (meta.format as string) ?? (item.width && item.height ? `${item.width}x${item.height}` : null) ?? null,
    market: (meta.market as string) ?? (item.country as string) ?? null,
    language: (meta.language as string) ?? (item.language as string) ?? null,
    uploader: (item.userCreated as string) ?? (createdBy.email as string) ?? null,
    upload_date: date ? new Date(date as string) : null,
  };
}

export interface BynderAdapterConfig {
  baseUrl: string;
  token: string;
}

/**
 * Bynder DAM adapter. Uses Bynder's REST API (assets list with filters).
 * Requires BYNDER_BASE_URL and BYNDER_TOKEN (or equivalent) in env.
 */
export function createBynderDAMClient(cfg: BynderAdapterConfig): DAMClient {
  const { baseUrl, token } = cfg;
  const base = baseUrl.replace(/\/$/, '');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return {
    async listAssets(options?: ListAssetsOptions): Promise<ListAssetsResult> {
      const params = new URLSearchParams();
      params.set('page', String(Math.floor((options?.offset ?? 0) / (options?.limit ?? 100)) + 1));
      params.set('pageSize', String(options?.limit ?? 100));
      if (options?.modifiedAfter) {
        params.set('dateModified', options.modifiedAfter.toISOString());
      }
      const url = `${base}/api/v4/media/?${params.toString()}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Bynder API error: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as { media?: Record<string, unknown>[]; next?: string };
      const media = data.media ?? [];
      const assets: CanonicalAsset[] = media.map(mapBynderToCanonical);
      return {
        assets,
        hasMore: !!data.next,
        nextOffset: options && data.next ? (options.offset ?? 0) + assets.length : undefined,
      };
    },
    async getAssetById(id: string): Promise<CanonicalAsset | null> {
      const url = `${base}/api/v4/media/${id}/`;
      const res = await fetch(url, { headers });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Bynder API error: ${res.status}`);
      const item = (await res.json()) as Record<string, unknown>;
      return mapBynderToCanonical(item);
    },
  };
}
