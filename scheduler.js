/**
 * ============================================
 *  SCHEDULER — Daily 9 AM IST Cron Job
 * ============================================
 *  Runs the job hunter agent on a schedule.
 *  Uses node-cron for reliable cron scheduling.
 * 
 *  Usage:
 *    npm run schedule    # Starts the cron daemon
 *    npm start           # One-shot run (no scheduling)
 * ============================================
 */

import cron from 'node-cron';
import dotenv from 'dotenv';
import { runJobHunt } from './index.js';

// Load environment variables
dotenv.config();

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9 * * *';
const TZ = process.env.TZ || 'Asia/Kolkata';

console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║      🕐 DAILY JOB HUNTER — SCHEDULER DAEMON     ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');
console.log(`📅 Schedule: ${CRON_SCHEDULE}`);
console.log(`🌍 Timezone: ${TZ}`);
console.log(`📧 Sending to: ${process.env.EMAIL_TO || process.env.EMAIL_USER}`);
console.log('');
console.log('⏳ Waiting for next scheduled run...');
console.log('   Press Ctrl+C to stop.\n');

// Validate cron expression
if (!cron.validate(CRON_SCHEDULE)) {
  console.error(`❌ Invalid cron expression: ${CRON_SCHEDULE}`);
  process.exit(1);
}

// Schedule the job
const task = cron.schedule(
  CRON_SCHEDULE,
  async () => {
    console.log(`\n🔔 [${new Date().toLocaleString('en-IN', { timeZone: TZ })}] Triggered! Running job hunt...`);
    try {
      await runJobHunt();
      console.log(`✅ [${new Date().toLocaleString('en-IN', { timeZone: TZ })}] Run complete.\n`);
    } catch (error) {
      console.error(`❌ [${new Date().toLocaleString('en-IN', { timeZone: TZ })}] Error:`, error.message);
    }
  },
  {
    timezone: TZ,
  }
);

task.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Scheduler stopped. Goodbye!\n');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  task.stop();
  process.exit(0);
});
