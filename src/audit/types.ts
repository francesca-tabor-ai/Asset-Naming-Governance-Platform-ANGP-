export type ComplianceStatus = 'pass' | 'fail';
export type ScanMode = 'realtime' | 'batch' | 'full_audit';

export interface AssetAuditRecord {
  asset_id: string;
  filename: string;
  compliance_status: ComplianceStatus;
  violation_type: string[];
  brand: string | null;
  campaign: string | null;
  channel: string | null;
  format: string | null;
  language: string | null;
  market: string | null;
  agency: string | null;
  upload_date: Date | null;
  scan_mode: ScanMode;
  scanned_at: Date;
}

export interface UpsertAuditInput {
  asset_id: string;
  filename: string;
  compliance_status: ComplianceStatus;
  violation_type: string[];
  brand?: string | null;
  campaign?: string | null;
  channel?: string | null;
  format?: string | null;
  language?: string | null;
  market?: string | null;
  agency?: string | null;
  upload_date?: Date | null;
  scan_mode: ScanMode;
}
