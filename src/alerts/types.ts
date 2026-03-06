export interface InvalidFilenameAlertPayload {
  asset_id: string;
  filename: string;
  violation_types: string[];
  uploader?: string | null;
  brand?: string | null;
  campaign?: string | null;
}

export interface AlertSender {
  sendInvalidFilename(payload: InvalidFilenameAlertPayload): Promise<void>;
}
