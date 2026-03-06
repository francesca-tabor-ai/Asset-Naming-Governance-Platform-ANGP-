import dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/angp',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  port: parseInt(process.env.PORT || '3000', 10),
  dam: {
    provider: process.env.DAM_PROVIDER || 'stub',
  },
  alerts: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,
  },
  /** Optional path to naming schema JSON config; env vars override file values */
  schemaConfigPath: process.env.SCHEMA_CONFIG_PATH,
} as const;
