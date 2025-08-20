const { CronJob } = require('cron');

let job = null;
let lastRun = null;
const MOCK_MODE = String(process.env.MOCK_MODE || '').toLowerCase() === 'true';

function startScheduler() {
  if (job) return false;
  job = new CronJob('*/5 * * * * *', async () => {
    try { await executeOnce({ scheduled: true }); }
    catch (err) { console.error('[quantum] scheduled execute error:', err); }
  });
  job.start();
  return true;
}

async function executeOnce(input = {}) {
  const earned = Number((Math.random() * 0.01 + 0.001).toFixed(4));
  lastRun = new Date().toISOString();
  return { ok: true, mocked: MOCK_MODE, earned, input, ts: lastRun };
}

function health() {
  const running = !!job && (job.running === true || typeof job.nextDate === 'function');
  return { ok: true, scheduler: running, lastRun };
}

module.exports = { startScheduler, executeOnce, health };
