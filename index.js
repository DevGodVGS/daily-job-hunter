/**
 * ============================================
 *  DAILY JOB HUNTER — MAIN ENTRY POINT
 * ============================================
 *  Orchestrates the job search pipeline:
 *  1. Load config from .env
 *  2. Search all platforms using JSearch API
 *  3. Score matches semantically with Gemini API
 *  4. Build HTML email and send via Gmail
 * ============================================
 */

import dotenv from 'dotenv';
import { fetchJobsFromJSearch } from './search-engine.js';
import { buildEmailHTML, createTransport, sendEmail } from './email-builder.js';

// Load environment variables
dotenv.config();

/**
 * Load and validate configuration from environment.
 * @returns {object} Validated config
 */
function loadConfig() {
  const config = {
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    emailTo: process.env.EMAIL_TO || process.env.EMAIL_USER,
    rapidApiKey: process.env.RAPIDAPI_KEY,
    geminiApiKey:  process.env.GEMINI_API_KEY,
    targetCities: (process.env.TARGET_CITIES || 'Hyderabad,Bangalore,Pune').split(',').map((s) => s.trim()),
    targetRoles: (process.env.TARGET_ROLES || 'Frontend Developer,React Developer,Software Engineer,Full-Stack Developer,UI Engineer').split(',').map((s) => s.trim()),
    coreSkills: (process.env.CORE_SKILLS || 'React,Redux,JavaScript').split(',').map((s) => s.trim()),
    minSalary: parseInt(process.env.MIN_SALARY_LPA || '10', 10),
    maxSalary: parseInt(process.env.MAX_SALARY_LPA || '20', 10),
    experienceYears: parseInt(process.env.EXPERIENCE_YEARS || '2', 10),
    cronSchedule: process.env.CRON_SCHEDULE || '0 9 * * *',
  };

  // Validation of Email settings
  if (!config.emailUser || !config.emailPass) {
    console.error('❌ ERROR: EMAIL_USER and EMAIL_PASS are required in .env');
    console.error('   Copy .env.example to .env and fill in your Gmail App Password.');
    console.error('   See: https://myaccount.google.com/apppasswords');
    process.exit(1);
  }

  // Check if JSearch API Key is set
  if (!config.rapidApiKey) {
    console.warn('⚠️  WARNING: RAPIDAPI_KEY is not configured in your .env file.');
  }

  // Check if Gemini API Key is set
  if (!config.geminiApiKey) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not configured in your .env file.');
    console.warn('   Will fall back to static keyword matching for ATS scoring.');
  }

  return config;
}

/**
 * Run the complete job hunt pipeline.
 * @param {object} [overrideConfig] - Optional config override (for testing)
 */
export async function runJobHunt(overrideConfig) {
  const config = overrideConfig || loadConfig();
  const isTest = process.argv.includes('--test');

  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     🎯 DAILY JOB HUNTER AGENT v1.0      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  console.log(`🏙️  Cities: ${config.targetCities.join(', ')}`);
  console.log(`💼 Roles: ${config.targetRoles.join(', ')}`);
  console.log(`💰 Salary: ₹${config.minSalary}–${config.maxSalary} LPA`);
  console.log(`📊 Experience: ${config.experienceYears}+ years`);
  console.log('');

  // Step 1: Scan real-time jobs from JSearch API
  console.log('🔍 Step 1: Querying JSearch API for fresh postings...');
  let jobs = [];
  try {
    jobs = await fetchJobsFromJSearch(config);
    console.log(`   Found ${jobs.length} matching jobs posted in the last 24 hours.`);
  } catch (error) {
    console.error(`   ❌ Failed to query JSearch API: ${error.message}`);
    if (isTest || !config.rapidApiKey || config.rapidApiKey === 'your_rapidapi_key_here') {
      console.log('   💡 Falling back to mock job list for testing purposes...');
      jobs = [
        {
          id: 'mock-1',
          title: 'Frontend Engineer (React)',
          company: 'Razorpay',
          logo: 'https://via.placeholder.com/40',
          location: 'Bangalore, Karnataka, India',
          salaryRange: '₹14.0–22.0 LPA (INR)',
          applyLink: 'https://razorpay.com/jobs/',
          publisher: 'LinkedIn',
          postedTime: 'Just Now',
          description: 'We are looking for a Software Engineer, Frontend (React) to help scale our payment systems. Your experience with SSO and microservices will be highly valuable.',
          atsScore: 92,
          matchedSkills: ['REACT', 'REDUX', 'JAVASCRIPT', 'SECURITY', 'ARCHITECTURE']
        },
        {
          id: 'mock-2',
          title: 'Software Developer (Full-Stack)',
          company: 'CRED',
          logo: 'https://via.placeholder.com/40',
          location: 'Bangalore, Karnataka, India',
          salaryRange: '₹15.0–25.0 LPA (INR)',
          applyLink: 'https://cred.club/careers',
          publisher: 'Indeed',
          postedTime: '1 hour ago',
          description: 'Join the core web experience team at CRED. You will own the front-to-back delivery of user-facing products using React, Redux, Node.js, and TypeScript.',
          atsScore: 88,
          matchedSkills: ['REACT', 'REDUX', 'JAVASCRIPT', 'NODEJS', 'APIS']
        }
      ];
    } else {
      throw error;
    }
  }

  // Step 2: Build email
  console.log('📧 Step 2: Building email report...');
  const html = buildEmailHTML(jobs, config);
  console.log('   HTML email built successfully.');

  // Step 3: Send email
  if (isTest && (!config.emailUser || config.emailPass === 'your_gmail_app_password_here')) {
    console.log('');
    console.log('⚠️  TEST MODE: Skipping email send (no valid credentials).');
    console.log('   To send a real email, configure .env with your Gmail App Password.');
    console.log('');
    console.log('📋 Jobs that would be included:');
    jobs.forEach((j, i) => {
      console.log(`   ${i + 1}. ${j.title} at ${j.company} (${j.location}) via ${j.publisher}`);
    });
  } else {
    console.log('📨 Step 3: Sending email...');
    try {
      const transporter = createTransport(config);
      await sendEmail(transporter, html, config);
      console.log(`   ✅ Email sent to: ${config.emailTo}`);
    } catch (error) {
      console.error(`   ❌ Failed to send email: ${error.message}`);
      if (error.message.includes('Invalid login')) {
        console.error('   💡 Make sure you are using a Gmail App Password, NOT your regular password.');
        console.error('   📎 Generate one at: https://myaccount.google.com/apppasswords');
      }
      throw error;
    }
  }

  console.log('');
  console.log('✅ Job hunt complete!');
  console.log(`📊 ${jobs.length} opportunities reported.`);
  console.log('');

  return { jobs, config };
}

// Run if called directly
runJobHunt().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
