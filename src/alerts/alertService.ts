import { config } from '../config';
import type { AlertSender } from './types';
import type { InvalidFilenameAlertPayload } from './types';
import { createSlackSender } from './slackSender';
import { createTeamsSender } from './teamsSender';

let senders: AlertSender[] = [];

function getSenders(): AlertSender[] {
  if (senders.length > 0) return senders;
  if (config.alerts.slackWebhookUrl) {
    senders.push(createSlackSender(config.alerts.slackWebhookUrl));
  }
  if (config.alerts.teamsWebhookUrl) {
    senders.push(createTeamsSender(config.alerts.teamsWebhookUrl));
  }
  return senders;
}

/** Send invalid-filename alerts to all configured channels (Slack, Teams). */
export async function sendInvalidFilenameAlert(payload: InvalidFilenameAlertPayload): Promise<void> {
  const list = getSenders();
  await Promise.allSettled(list.map((s) => s.sendInvalidFilename(payload)));
}
