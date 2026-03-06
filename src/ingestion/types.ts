/** Canonical asset metadata used by the rules engine and audit store */
export interface CanonicalAsset {
  id: string;
  filename: string;
  brand: string | null;
  campaign: string | null;
  channel: string | null;
  format: string | null;
  market: string | null;
  language: string | null;
  uploader: string | null;
  upload_date: Date | null;
}

export interface ListAssetsOptions {
  /** For batch: only assets modified after this date */
  modifiedAfter?: Date;
  /** For full audit: pagination offset */
  offset?: number;
  /** Page size (e.g. 1000) */
  limit?: number;
}

export interface ListAssetsResult {
  assets: CanonicalAsset[];
  hasMore: boolean;
  nextOffset?: number;
}
