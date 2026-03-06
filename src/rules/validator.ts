import { getSchemaConfig } from './schemaConfig';
import type { NamingSchemaConfig, ParsedFilename, ValidationResult, Violation } from './types';

const EXPECTED_SEGMENT_COUNT = 7; // brand, product, campaign, channel, format, language, market
const ISO_2_LETTER = /^[A-Za-z]{2}$/;

export function validateFilename(
  filename: string,
  schemaConfig?: Partial<NamingSchemaConfig>
): ValidationResult {
  const config = getSchemaConfig(schemaConfig);
  const violations: Violation[] = [];

  if (!filename || typeof filename !== 'string') {
    violations.push({ type: 'missing_filename', severity: 'critical', message: 'Filename is required' });
    return { pass: false, violations };
  }

  const lastDot = filename.lastIndexOf('.');
  const nameWithoutExt = lastDot >= 0 ? filename.slice(0, lastDot) : filename;
  const extension = lastDot >= 0 ? filename.slice(lastDot + 1) : '';

  const segments = nameWithoutExt.split(config.separator);

  if (segments.length !== EXPECTED_SEGMENT_COUNT) {
    violations.push({
      type: 'segment_count',
      severity: 'critical',
      message: `Expected ${EXPECTED_SEGMENT_COUNT} segments separated by "${config.separator}", got ${segments.length}`,
    });
  }

  const regex =
    typeof config.formatDimensionsRegex === 'string'
      ? new RegExp(config.formatDimensionsRegex)
      : config.formatDimensionsRegex;

  const [brand = '', product = '', campaign = '', channel = '', format = '', language = '', market = ''] =
    segments;

  const parsed: ParsedFilename = {
    brand,
    product,
    campaign,
    channel,
    format,
    language,
    market,
    extension,
  };

  if (segments.length === EXPECTED_SEGMENT_COUNT) {
    if (!brand.trim())
      violations.push({ type: 'required_field', severity: 'high', message: 'Brand is empty' });
    if (!campaign.trim())
      violations.push({ type: 'required_field', severity: 'high', message: 'Campaign is empty' });

    if (config.channelAllowlist.length > 0 && channel && !config.channelAllowlist.includes(channel)) {
      violations.push({
        type: 'invalid_channel',
        severity: 'high',
        message: `Channel "${channel}" not in allowlist: ${config.channelAllowlist.join(', ')}`,
      });
    }

    if (format && !regex.test(format)) {
      violations.push({
        type: 'invalid_format',
        severity: 'high',
        message: `Format "${format}" does not match dimensions pattern (e.g. 300x250)`,
      });
    }

    if (language && !ISO_2_LETTER.test(language)) {
      violations.push({
        type: 'invalid_language',
        severity: 'medium',
        message: `Language "${language}" should be ISO 639-1 two-letter code`,
      });
    } else if (
      config.languageAllowlist &&
      config.languageAllowlist.length > 0 &&
      language &&
      !config.languageAllowlist.includes(language.toUpperCase())
    ) {
      violations.push({
        type: 'invalid_language',
        severity: 'medium',
        message: `Language "${language}" not in allowlist`,
      });
    }

    if (market && !ISO_2_LETTER.test(market)) {
      violations.push({
        type: 'invalid_market',
        severity: 'medium',
        message: `Market "${market}" should be ISO country two-letter code`,
      });
    } else if (
      config.marketAllowlist &&
      config.marketAllowlist.length > 0 &&
      market &&
      !config.marketAllowlist.includes(market.toUpperCase())
    ) {
      violations.push({
        type: 'invalid_market',
        severity: 'medium',
        message: `Market "${market}" not in allowlist`,
      });
    }
  }

  return {
    pass: violations.length === 0,
    violations,
    parsed: segments.length === EXPECTED_SEGMENT_COUNT ? parsed : undefined,
  };
}
