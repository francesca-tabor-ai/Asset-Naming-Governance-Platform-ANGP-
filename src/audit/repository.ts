import { Pool } from 'pg';
import { config } from '../config';
import type { AssetAuditRecord, ComplianceStatus, ScanMode, UpsertAuditInput } from './types';

export function createPool(): Pool {
  return new Pool({ connectionString: config.database.url });
}

const pool = createPool();

export async function upsertAudit(input: UpsertAuditInput): Promise<AssetAuditRecord> {
  const result = await pool.query(
    `INSERT INTO asset_audits (
      asset_id, filename, compliance_status, violation_type,
      brand, campaign, channel, format, language, market, agency,
      upload_date, scan_mode
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (asset_id) DO UPDATE SET
      filename = EXCLUDED.filename,
      compliance_status = EXCLUDED.compliance_status,
      violation_type = EXCLUDED.violation_type,
      brand = EXCLUDED.brand,
      campaign = EXCLUDED.campaign,
      channel = EXCLUDED.channel,
      format = EXCLUDED.format,
      language = EXCLUDED.language,
      market = EXCLUDED.market,
      agency = EXCLUDED.agency,
      upload_date = EXCLUDED.upload_date,
      scan_mode = EXCLUDED.scan_mode,
      scanned_at = current_timestamp
    RETURNING *`,
    [
      input.asset_id,
      input.filename,
      input.compliance_status,
      input.violation_type,
      input.brand ?? null,
      input.campaign ?? null,
      input.channel ?? null,
      input.format ?? null,
      input.language ?? null,
      input.market ?? null,
      input.agency ?? null,
      input.upload_date ?? null,
      input.scan_mode,
    ]
  );
  return mapRow(result.rows[0]);
}

export async function getAuditByAssetId(assetId: string): Promise<AssetAuditRecord | null> {
  const result = await pool.query('SELECT * FROM asset_audits WHERE asset_id = $1', [assetId]);
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export interface ListAuditsFilter {
  brand?: string;
  campaign?: string;
  market?: string;
  agency?: string;
  channel?: string;
  compliance_status?: ComplianceStatus;
  from_date?: Date;
  to_date?: Date;
}

export async function listAudits(filter: ListAuditsFilter, limit = 100): Promise<AssetAuditRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filter.brand) {
    conditions.push(`brand = $${idx++}`);
    values.push(filter.brand);
  }
  if (filter.campaign) {
    conditions.push(`campaign = $${idx++}`);
    values.push(filter.campaign);
  }
  if (filter.market) {
    conditions.push(`market = $${idx++}`);
    values.push(filter.market);
  }
  if (filter.agency) {
    conditions.push(`agency = $${idx++}`);
    values.push(filter.agency);
  }
  if (filter.channel) {
    conditions.push(`channel = $${idx++}`);
    values.push(filter.channel);
  }
  if (filter.compliance_status) {
    conditions.push(`compliance_status = $${idx++}`);
    values.push(filter.compliance_status);
  }
  if (filter.from_date) {
    conditions.push(`scanned_at >= $${idx++}`);
    values.push(filter.from_date);
  }
  if (filter.to_date) {
    conditions.push(`scanned_at <= $${idx++}`);
    values.push(filter.to_date);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit);
  const result = await pool.query(
    `SELECT * FROM asset_audits ${where} ORDER BY scanned_at DESC LIMIT $${idx}`,
    values
  );
  return result.rows.map(mapRow);
}

function mapRow(row: Record<string, unknown>): AssetAuditRecord {
  return {
    asset_id: row.asset_id as string,
    filename: row.filename as string,
    compliance_status: row.compliance_status as ComplianceStatus,
    violation_type: (row.violation_type as string[]) || [],
    brand: row.brand as string | null,
    campaign: row.campaign as string | null,
    channel: row.channel as string | null,
    format: row.format as string | null,
    language: row.language as string | null,
    market: row.market as string | null,
    agency: row.agency as string | null,
    upload_date: row.upload_date ? new Date(row.upload_date as string) : null,
    scan_mode: row.scan_mode as ScanMode,
    scanned_at: new Date(row.scanned_at as string),
  };
}
