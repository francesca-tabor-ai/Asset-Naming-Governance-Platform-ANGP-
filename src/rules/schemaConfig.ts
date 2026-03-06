import fs from 'fs';
import path from 'path';
import type { NamingSchemaConfig, SegmentKey } from './types';

const SEGMENT_KEYS: SegmentKey[] = [
  'brand',
  'product',
  'campaign',
  'channel',
  'format',
  'language',
  'market',
];

export const defaultSchemaConfig: NamingSchemaConfig = {
  segmentOrder: [...SEGMENT_KEYS],
  separator: '-',
  channelAllowlist: ['IAB', 'Social', 'OOH', 'Display', 'Video', 'Print', 'DOOH', 'Email'],
  formatDimensionsRegex: /^\d+x\d+$/,
  languageAllowlist: [],
  marketAllowlist: [],
};

/** JSON-serializable shape for file config (formatDimensionsRegex as string) */
interface SchemaConfigFile {
  segmentOrder?: string[];
  separator?: string;
  channelAllowlist?: string[];
  formatDimensionsRegex?: string;
  languageAllowlist?: string[];
  marketAllowlist?: string[];
}

function loadConfigFromFile(filePath: string): Partial<NamingSchemaConfig> | null {
  try {
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) return null;
    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(raw) as SchemaConfigFile;
    const out: Partial<NamingSchemaConfig> = {};

    if (Array.isArray(parsed.segmentOrder)) {
      const valid = parsed.segmentOrder.filter((s): s is SegmentKey =>
        SEGMENT_KEYS.includes(s as SegmentKey)
      );
      if (valid.length === SEGMENT_KEYS.length) out.segmentOrder = valid;
    }
    if (typeof parsed.separator === 'string' && parsed.separator.length > 0)
      out.separator = parsed.separator;
    if (Array.isArray(parsed.channelAllowlist))
      out.channelAllowlist = parsed.channelAllowlist.filter((s) => typeof s === 'string');
    if (typeof parsed.formatDimensionsRegex === 'string')
      out.formatDimensionsRegex = new RegExp(parsed.formatDimensionsRegex);
    if (Array.isArray(parsed.languageAllowlist))
      out.languageAllowlist = parsed.languageAllowlist.filter((s) => typeof s === 'string');
    if (Array.isArray(parsed.marketAllowlist))
      out.marketAllowlist = parsed.marketAllowlist.filter((s) => typeof s === 'string');

    return out;
  } catch {
    return null;
  }
}

function loadOverridesFromEnv(): Partial<NamingSchemaConfig> {
  const overrides: Partial<NamingSchemaConfig> = {};
  const sep = process.env.SCHEMA_SEPARATOR;
  if (sep !== undefined && sep.length > 0) overrides.separator = sep;

  const channelStr = process.env.SCHEMA_CHANNEL_ALLOWLIST;
  if (channelStr !== undefined)
    overrides.channelAllowlist = channelStr.split(',').map((s) => s.trim()).filter(Boolean);

  const formatRegex = process.env.SCHEMA_FORMAT_DIMENSIONS_REGEX;
  if (formatRegex !== undefined && formatRegex.length > 0)
    overrides.formatDimensionsRegex = new RegExp(formatRegex);

  const langStr = process.env.SCHEMA_LANGUAGE_ALLOWLIST;
  if (langStr !== undefined)
    overrides.languageAllowlist = langStr.split(',').map((s) => s.trim()).filter(Boolean);

  const marketStr = process.env.SCHEMA_MARKET_ALLOWLIST;
  if (marketStr !== undefined)
    overrides.marketAllowlist = marketStr.split(',').map((s) => s.trim()).filter(Boolean);

  const orderStr = process.env.SCHEMA_SEGMENT_ORDER;
  if (orderStr !== undefined) {
    const order = orderStr.split(',').map((s) => s.trim().toLowerCase());
    const valid = order.filter((s): s is SegmentKey => SEGMENT_KEYS.includes(s as SegmentKey));
    if (valid.length === SEGMENT_KEYS.length) overrides.segmentOrder = valid;
  }

  return overrides;
}

/**
 * Load naming schema config: file (SCHEMA_CONFIG_PATH) → env overrides → defaults.
 * Call-site overrides (e.g. per-request) are applied last.
 */
export function getSchemaConfig(overrides?: Partial<NamingSchemaConfig>): NamingSchemaConfig {
  const fromFile = process.env.SCHEMA_CONFIG_PATH
    ? loadConfigFromFile(process.env.SCHEMA_CONFIG_PATH)
    : null;
  const fromEnv = loadOverridesFromEnv();

  const base = {
    ...defaultSchemaConfig,
    ...(fromFile ?? {}),
    ...fromEnv,
  };
  return overrides ? { ...base, ...overrides } : base;
}
