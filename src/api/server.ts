import { createApp, getPort } from './app';
import { createAssetValidationWorker } from '../jobs/worker';
import { sendInvalidFilenameAlert } from '../alerts';

const app = createApp();

const worker = createAssetValidationWorker((job, violationTypes) => {
  sendInvalidFilenameAlert({
    asset_id: job.data.asset_id,
    filename: job.data.filename,
    violation_types: violationTypes,
    uploader: job.data.agency ?? undefined,
    brand: job.data.brand ?? undefined,
    campaign: job.data.campaign ?? undefined,
  }).catch((err) => console.error('Alert send failed', err));
});

const port = getPort();
app.listen(port, () => {
  console.log(`ANGP API listening on port ${port}`);
});

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
