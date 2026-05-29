/**
 * ============================================
 *  EMAIL BUILDER & SENDER
 * ============================================
 *  Builds beautiful HTML emails and sends them
 *  via Gmail SMTP using Nodemailer.
 * ============================================
 */

import nodemailer from 'nodemailer';
import { buildJobCard } from './search-engine.js';

/**
 * Build the full HTML email body.
 * @param {object[]} jobs - Dynamic job listings
 * @param {object} config - App configuration
 * @returns {string} Full HTML email string
 */
export function buildEmailHTML(jobs, config) {
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isGeminiMissing = !config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here';

  // Warning Banner if Gemini API Key is missing
  const warningBanner = isGeminiMissing
    ? `
      <div style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:12px;padding:16px;margin-bottom:24px;color:#e65100;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.5;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <strong style="font-size:14px;display:block;margin-bottom:4px;">⚠️ Gemini API Key Missing</strong>
        The Google Gemini API Key is not configured in your environment. The agent has bypassed the strict 85% ATS match filter and sent **all matching full-time developer jobs** found today using a basic local keyword parser instead of AI evaluation. 
        <br><br>
        To enable semantic AI ATS matching and filter out low-match roles, configure <code>GEMINI_API_KEY</code>.
      </div>
    `
    : '';

  const jobCards = jobs.length > 0 
    ? jobs.map((job, i) => buildJobCard(job, i + 1)).join('')
    : `
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:30px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="margin:0;color:#666;font-size:16px;font-weight:500;">📭 No new jobs matching the filter criteria were found today.</p>
        <p style="margin:8px 0 0;color:#888;font-size:13px;">This occasionally happens on weekends or holidays. We'll scan again tomorrow!</p>
      </div>
    `;

  // Dynamically extract unique portals where jobs were found
  const publishers = [...new Set(jobs.map(job => job.publisher))];
  const publishersList = publishers.length > 0
    ? publishers.map(pub => `<span style="display:inline-block;background:#f1f3f4;color:#5f6368;border:1px solid #dadce0;padding:4px 12px;border-radius:16px;font-size:12px;margin-right:6px;margin-bottom:6px;font-weight:600;">🌐 ${pub}</span>`).join('')
    : '<span style="display:inline-block;background:#f5f5f5;color:#888;padding:4px 12px;border-radius:16px;font-size:12px;">Global Web Sources</span>';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Job Hunt Report</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:20px;">
      
      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:16px;padding:32px 24px;margin-bottom:24px;text-align:center;">
        <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700;">🎯 Daily Job Hunt Report</h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">${date}</p>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">
          Cities: ${config.targetCities.join(' · ')} | ATS Filter: ${isGeminiMissing ? 'Disabled' : '&ge; 85% Match'} | Exp: 2+ yrs
        </p>
      </div>

      <!-- WARNING BANNER -->
      ${warningBanner}

      <!-- SUMMARY -->
      <div style="background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #e0e0e0;">
        <p style="margin:0;color:#333;font-size:14px;">
          <strong>📊 Today's scan:</strong> Found <strong>${jobs.length}</strong> new job postings in the last 24 hours across
          <strong>${config.targetCities.join(', ')}</strong>.
        </p>
      </div>

      <!-- COMPANY LISTINGS -->
      <h2 style="color:#1a1a1a;font-size:18px;margin-bottom:16px;">🔥 High-Match Opportunities</h2>
      ${jobCards}

      <!-- JOB PORTAL SOURCES -->
      <div style="background:#fff;border-radius:12px;padding:20px;margin-top:24px;border:1px solid #e0e0e0;">
        <h3 style="margin:0 0 10px;color:#1a1a1a;font-size:15px;font-weight:700;">📡 Search Scope (Portals Scanned Today)</h3>
        <p style="margin:0 0 12px;color:#666;font-size:13px;line-height:1.4;">
          The agent automatically scanned the entire internet and identified matching positions on the following job portals and ATS systems:
        </p>
        <div style="display:flex;flex-wrap:wrap;">
          ${publishersList}
        </div>
      </div>

      <!-- TIPS -->
      <div style="background:#fff3e0;border-radius:12px;padding:20px;margin-top:16px;border:1px solid #ffe0b2;">
        <h3 style="margin:0 0 8px;color:#e65100;font-size:14px;">💡 Daily Tip</h3>
        <p style="margin:0;color:#666;font-size:13px;">${getRandomTip()}</p>
      </div>

      <!-- FOOTER -->
      <div style="text-align:center;margin-top:24px;padding:16px;">
        <p style="margin:0;color:#999;font-size:12px;">
          Generated by <strong>Daily Job Hunter Agent v1.0</strong><br>
          Next report: Tomorrow at 9:00 AM IST
        </p>
        <p style="margin:8px 0 0;color:#bbb;font-size:11px;">
          To stop receiving these emails, remove the cron job or delete the .env file.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Get a random job search tip.
 * @returns {string}
 */
function getRandomTip() {
  const tips = [
    'Employee referrals are the #1 fastest way to get interviews at top companies. Reach out to engineers on LinkedIn!',
    'Apply within the first 24 hours of a job posting for 3x higher response rates. Use LinkedIn "Past 24 hours" filter.',
    'Tailor your resume for each company. Highlight the specific achievements that match their product domain.',
    'Having a live project on GitHub that demonstrates clean, modular React code is worth more than 10 certificates.',
    'When a job says "React Developer", they usually also want TypeScript. Start adding TS to your projects today.',
    'Follow engineering blogs of target companies — it gives you talking points in interviews and shows genuine interest.',
    'Practice system design for frontend: how would you architect a dashboard with real-time updates? You\'ve done this!',
    "Your SSO/RBAC experience for 10K+ users is a rare differentiator at the 2-year mark. Lead with it in interviews.",
    "Don't ignore Pune — companies like BrowserStack, Mindtickle, and Druva offer excellent comp with lower cost of living.",
    'Set up job alerts on Wellfound, Cutshort, and Instahyre. Many startup roles are filled within 1 week of posting.',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Create and return a Nodemailer transport.
 * @param {object} config
 * @returns {nodemailer.Transporter}
 */
export function createTransport(config) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });
}

/**
 * Send the job hunt email.
 * @param {nodemailer.Transporter} transporter
 * @param {string} html - Full HTML email body
 * @param {object} config
 */
export async function sendEmail(transporter, html, config) {
  const date = new Date().toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });

  const mailOptions = {
    from: `"Job Hunter Agent 🎯" <${config.emailUser}>`,
    to: config.emailTo,
    subject: `🔥 Daily Job Report — ${date} | ATS Filtered`,
    html: html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
  return info;
}
