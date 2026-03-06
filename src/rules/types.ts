export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Violation {
  type: string;
  severity: ViolationSeverity;
  message: string;
}

export interface ValidationResult {
  pass: boolean;
  violations: Violation[];
  parsed?: ParsedFilename;
}

export interface ParsedFilename {
  brand: string;
  product: string;
  campaign: string;
  channel: string;
  format: string;
  language: string;
  market: string;
  extension: string;
}

export type SegmentKey = 'brand' | 'product' | 'campaign' | 'channel' | 'format' | 'language' | 'market';

export interface NamingSchemaConfig {
  /** Segment order in the filename, e.g. ['brand','product','campaign','channel','format','language','market'] */
  segmentOrder: SegmentKey[];
  /** Separator between segments, e.g. '-' */
  separator: string;
  /** Allowed channel codes (e.g. IAB, Social, OOH) */
  channelAllowlist: string[];
  /** Regex for format dimensions, e.g. /^\d+x\d+$/ */
  formatDimensionsRegex: RegExp | string;
  /** ISO 639-1 language codes allowed (e.g. EN, DE) - empty means any 2-letter */
  languageAllowlist?: string[];
  /** ISO country codes allowed (e.g. UK, US) - empty means any 2-letter */
  marketAllowlist?: string[];
}
