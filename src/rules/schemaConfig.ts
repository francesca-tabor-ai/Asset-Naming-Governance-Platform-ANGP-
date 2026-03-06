import type { NamingSchemaConfig } from './types';

export const defaultSchemaConfig: NamingSchemaConfig = {
  segmentOrder: ['brand', 'product', 'campaign', 'channel', 'format', 'language', 'market'],
  separator: '-',
  channelAllowlist: ['IAB', 'Social', 'OOH', 'Display', 'Video', 'Print', 'DOOH', 'Email'],
  formatDimensionsRegex: /^\d+x\d+$/,
  languageAllowlist: [], // empty = accept any 2-letter code
  marketAllowlist: [], // empty = accept any 2-letter code
};

/** Load config from env or file in future; for now return default */
export function getSchemaConfig(overrides?: Partial<NamingSchemaConfig>): NamingSchemaConfig {
  return overrides ? { ...defaultSchemaConfig, ...overrides } : { ...defaultSchemaConfig };
}
