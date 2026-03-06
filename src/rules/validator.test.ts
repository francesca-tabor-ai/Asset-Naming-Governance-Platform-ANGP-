import { validateFilename } from './validator';

describe('validateFilename', () => {
  it('passes for valid filename BRAND-PRODUCT-CAMPAIGN-IAB-300x250-EN-UK.psd', () => {
    const result = validateFilename('BRAND-PRODUCT-CAMPAIGN-IAB-300x250-EN-UK.psd');
    expect(result.pass).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.parsed).toEqual({
      brand: 'BRAND',
      product: 'PRODUCT',
      campaign: 'CAMPAIGN',
      channel: 'IAB',
      format: '300x250',
      language: 'EN',
      market: 'UK',
      extension: 'psd',
    });
  });

  it('fails when segment count is wrong', () => {
    const result = validateFilename('IQOS-ILUMA-Campaign-IAB-300x250.psd');
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.type === 'segment_count')).toBe(true);
  });

  it('fails when channel is not in allowlist', () => {
    const result = validateFilename('IQOS-ILUMA-Campaign-UnknownChannel-300x250-EN-UK.psd');
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.type === 'invalid_channel')).toBe(true);
  });

  it('fails when format does not match dimensions pattern', () => {
    const result = validateFilename('IQOS-ILUMA-Campaign-IAB-invalid-EN-UK.psd');
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.type === 'invalid_format')).toBe(true);
  });

  it('accepts format 1920x1080', () => {
    const result = validateFilename('BRAND-PRODUCT-CAMPAIGN-IAB-1920x1080-EN-UK.png');
    expect(result.pass).toBe(true);
  });

  it('fails when language is not two letters', () => {
    const result = validateFilename('IQOS-ILUMA-Campaign-IAB-300x250-ENG-UK.psd');
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.type === 'invalid_language')).toBe(true);
  });

  it('fails when market is not two letters', () => {
    const result = validateFilename('IQOS-ILUMA-Campaign-IAB-300x250-EN-UKR.psd');
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.type === 'invalid_market')).toBe(true);
  });

  it('returns violation types array for audit storage', () => {
    const result = validateFilename('IQOS-ILUMA-Campaign-BadChannel-300x250-EN-UK.psd');
    expect(result.pass).toBe(false);
    expect(result.violations.map((v) => v.type)).toContain('invalid_channel');
  });

  it('handles missing filename', () => {
    const result = validateFilename('');
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.type === 'missing_filename')).toBe(true);
  });
});
