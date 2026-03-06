import type { AlertSender } from './types';
import type { InvalidFilenameAlertPayload } from './types';

export function createTeamsSender(webhookUrl: string): AlertSender {
  return {
    async sendInvalidFilename(payload: InvalidFilenameAlertPayload): Promise<void> {
      const text = [
        `**Invalid filename (naming convention violation)**`,
        `- Asset: ${payload.filename}`,
        `- Asset ID: ${payload.asset_id}`,
        `- Violations: ${payload.violation_types.join(', ')}`,
        payload.uploader ? `- Uploader: ${payload.uploader}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: 'ANGP: Invalid filename',
          themeColor: 'FF0000',
          sections: [
            {
              activityTitle: 'Naming convention violation',
              facts: [
                { name: 'Filename', value: payload.filename },
                { name: 'Asset ID', value: payload.asset_id },
                { name: 'Violations', value: payload.violation_types.join(', ') },
                ...(payload.uploader ? [{ name: 'Uploader', value: payload.uploader }] : []),
              ],
              text,
            },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(`Teams webhook failed: ${res.status} ${res.statusText}`);
      }
    },
  };
}
