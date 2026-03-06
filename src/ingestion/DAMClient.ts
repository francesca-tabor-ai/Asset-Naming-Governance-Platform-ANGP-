import type { CanonicalAsset, ListAssetsOptions, ListAssetsResult } from './types';

/** Adapter interface for DAM systems (AEM, Bynder, Aprimo, Brandfolder) */
export interface DAMClient {
  /** List assets, optionally filtered by modifiedAfter or paginated */
  listAssets(options?: ListAssetsOptions): Promise<ListAssetsResult>;
  /** Fetch a single asset by ID (for real-time webhook handling) */
  getAssetById?(id: string): Promise<CanonicalAsset | null>;
}
