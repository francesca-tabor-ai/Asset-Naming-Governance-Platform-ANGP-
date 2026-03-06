import type { DAMClient } from './DAMClient';
import type { CanonicalAsset, ListAssetsOptions, ListAssetsResult } from './types';

/** Stub adapter for development and tests. Returns a small set of fake assets. */
export function createStubDAMClient(): DAMClient {
  const stubAssets: CanonicalAsset[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      filename: 'BRAND-PRODUCT-CAMPAIGN-IAB-300x250-EN-UK.psd',
      brand: 'BRAND',
      campaign: 'CAMPAIGN',
      channel: 'IAB',
      format: '300x250',
      market: 'UK',
      language: 'EN',
      uploader: 'ops@example.com',
      upload_date: new Date(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      filename: 'Bad-Segments.psd',
      brand: null,
      campaign: null,
      channel: null,
      format: null,
      market: null,
      language: null,
      uploader: 'agency@example.com',
      upload_date: new Date(),
    },
  ];

  return {
    async listAssets(options?: ListAssetsOptions): Promise<ListAssetsResult> {
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? 1000;
      const slice = stubAssets.slice(offset, offset + limit);
      return {
        assets: slice,
        hasMore: offset + slice.length < stubAssets.length,
        nextOffset: offset + slice.length < stubAssets.length ? offset + slice.length : undefined,
      };
    },
    async getAssetById(id: string): Promise<CanonicalAsset | null> {
      return stubAssets.find((a) => a.id === id) ?? null;
    },
  };
}
