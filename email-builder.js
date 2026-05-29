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
      <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:6px;padding:14px;margin-bottom:20px;color:#b45309;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;">
        <strong style="font-size:13px;display:block;margin-bottom:2px;">⚠️ Gemini API Key Missing</strong>
        The Google Gemini API Key is not configured in your environment. The agent has bypassed the strict 85% ATS match filter and sent **all matching full-time developer jobs** found today using a basic local keyword parser instead of AI evaluation. 
        To enable semantic AI ATS matching and filter out low-match roles, configure <code>GEMINI_API_KEY</code>.
      </div>
    `
    : '';

  const jobCards = jobs.length > 0 
    ? jobs.map((job, i) => buildJobCard(job, i + 1)).join('')
    : `
      <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:30px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <p style="margin:0;color:#374151;font-size:15px;font-weight:600;">📭 No new jobs matching the filter criteria were found today.</p>
        <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">This occasionally happens on weekends or holidays. We'll scan again tomorrow!</p>
      </div>
    `;

  // Dynamically extract unique portals where jobs were found
  const publishers = [...new Set(jobs.map(job => job.publisher))];
  const publishersList = publishers.length > 0
    ? publishers.join(' &nbsp;&bull;&nbsp; ')
    : 'Global Web Sources';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Job Hunt Report</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      
      <!-- HEADER -->
      <div style="background:#1f2937;border-radius:6px;padding:24px;margin-bottom:20px;text-align:left;border-bottom:3px solid #2563eb;">
        <h1 style="margin:0 0 4px;color:#ffffff;font-size:20px;font-weight:700;">🎯 Daily Job Hunt Report</h1>
        <p style="margin:0;color:#9ca3af;font-size:13px;font-weight:500;">${date}</p>
        <p style="margin:8px 0 0;color:#cbd5e1;font-size:11px;">
          Cities: ${config.targetCities.join(' · ')} | ATS Filter: ${isGeminiMissing ? 'Disabled' : '&ge; 85% Match'} | Exp: 2+ yrs
        </p>
      </div>

      <!-- WARNING BANNER -->
      ${warningBanner}

      <!-- SUMMARY -->
      <div style="background:#ffffff;border-radius:6px;padding:14px 18px;margin-bottom:20px;border:1px solid #d1d5db;">
        <p style="margin:0;color:#1f2937;font-size:13px;line-height:1.4;">
          <strong>📊 Daily Scan Summary:</strong> Found <strong>${jobs.length}</strong> new job postings in the last 24 hours across
          <strong>${config.targetCities.join(', ')}</strong>.
        </p>
      </div>

      <!-- COMPANY LISTINGS -->
      <h2 style="color:#111827;font-size:16px;margin-bottom:12px;font-weight:700;">🔥 High-Match Opportunities</h2>
      ${jobCards}

      <!-- JOB PORTAL SOURCES -->
      <div style="background:#ffffff;border-radius:6px;padding:18px;margin-top:20px;border:1px solid #d1d5db;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <h3 style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:700;">📡 Search Scope (Portals Scanned Today)</h3>
        <p style="margin:0 0 12px;color:#4b5563;font-size:12px;line-height:1.5;">
          The agent automatically scanned the entire internet and identified matching positions on the following job portals and ATS systems:
        </p>
        <div style="color:#1f2937;font-size:12px;font-weight:600;background:#f9fafb;padding:10px;border-radius:4px;border:1px solid #e5e7eb;">
          ${publishersList}
        </div>
      </div>

      <!-- TIPS -->
      <div style="background:#f0fdf4;border-radius:6px;padding:14px;margin-top:16px;border:1px solid #bbf7d0;color:#166534;font-size:12px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <strong style="display:block;margin-bottom:4px;font-size:13px;">💡 Daily Tip</strong>
        ${getRandomTip()}
      </div>

      <!-- FOOTER -->
      <div style="text-align:center;margin-top:24px;padding:16px;color:#6b7280;font-size:11px;line-height:1.5;">
        Generated by <strong>Daily Job Hunter Agent v1.0</strong><br>
        Next report: Tomorrow at 9:00 AM IST<br>
        <span style="color:#9ca3af;font-size:10px;margin-top:8px;display:block;">To stop receiving these emails, remove the cron job or delete the .env file.</span>
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
    'Set up job alerts on Wellfound, Cutshort, and Instahyre. Many startup roles are filed within 1 week of posting.',
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
