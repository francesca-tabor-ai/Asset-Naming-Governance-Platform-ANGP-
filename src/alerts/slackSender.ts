import type { AlertSender } from './types';
import type { InvalidFilenameAlertPayload } from './types';

export function createSlackSender(webhookUrl: string): AlertSender {
  return {
    async sendInvalidFilename(payload: InvalidFilenameAlertPayload): Promise<void> {
      const text = [
        `*Invalid filename (naming convention violation)*`,
        `• Asset: \`${payload.filename}\``,
        `• Asset ID: ${payload.asset_id}`,
        `• Violations: ${payload.violation_types.join(', ')}`,
        payload.uploader ? `• Uploader: ${payload.uploader}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text },
            },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(`Slack webhook failed: ${res.status} ${res.statusText}`);
      }
    },
  };
}
