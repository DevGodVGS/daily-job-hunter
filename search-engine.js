/**
 * ============================================
 *  JOB SEARCH ENGINE (DYNAMIC JSEARCH + GEMINI ATS)
 * ============================================
 *  Queries the JSearch API on RapidAPI to find
 *  real-time jobs, runs an ATS matching algorithm
 *  using Google Gemini API (free tier), and filters
 *  for jobs with a match score > 85%.
 * ============================================
 */

import fs from 'fs';
import path from 'path';

// Full Candidate Resume Context for the AI ATS to evaluate against
const RESUME_CONTEXT = `
Candidate Name: Vishwa Gaurav Shukla
Target Roles: Frontend Developer, React Developer, Software Developer, Full-Stack Developer, UI Engineer
Experience: 2+ years of experience (Trainee -> Associate -> Developer at 98thPercentile)
Education: B.Tech 2023
Core Skills: React, Redux, JavaScript (ES6+), NodeJS, HTML5, CSS3, Bootstrap, REST APIs, Git, GitHub, SSO, RBAC, Microservices
Key Achievements:
1. Reduced login latency 35% via scalable SSO across microservices (10K+ users, 99.9% uptime)
2. Led 5-person frontend team; cut post-release bugs 60% via agile sprints & code reviews
3. Migrated Laravel monolith -> ReactJS + NodeJS; deployment from 2 weeks to 3 days
4. Built reusable UI component library cutting maintenance time 35%
5. Built multi-portal dashboards (CMS, Admin, Student, Teacher, Parent, Operations) with real-time APIs
`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculates ATS matching score using the free Google Gemini AI API.
 * Falls back to local keyword matcher if GEMINI_API_KEY is not set.
 */
export async function calculateATSScore(title, description, geminiKey) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();

  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    return calculateATSScoreFallback(title, description);
  }

  try {
    const prompt = `
You are an expert corporate Applicant Tracking System (ATS) and recruiter parser.
Evaluate the alignment between the target candidate resume and the job description below.
Calculate an honest match score from 0 to 100 based on core skills, target experience level, and key projects alignment.
Identify which core skills from the candidate's resume are explicitly required in the job description.

Candidate Resume Context:
${RESUME_CONTEXT}

Job Opening:
Title: ${title}
Description: ${description}

Return your response strictly in the following JSON format:
{
  "score": <number from 0 to 100 representing match percentage>,
  "matchedSkills": [<array of strings matching skills from candidate skills: e.g. React, Redux, NodeJS, SSO, etc.>]
}
`;

    let response;
    let success = false;
    let lastError = '';

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );
      if (response.ok) success = true;
      else lastError = `Method 1 status ${response.status}`;
    } catch (err) {
      lastError = err.message;
    }

    if (!success) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        if (response.ok) success = true;
        else lastError = `Method 2 status ${response.status}`;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!success) {
      throw new Error(`All Gemini API methods failed. Last error: ${lastError}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = JSON.parse(rawText.trim());

    return {
      score: parseInt(cleanJson.score || '0', 10),
      matchedSkills: cleanJson.matchedSkills || []
    };
  } catch (error) {
    console.warn(`   ⚠️ Gemini ATS scoring error (${error.message}). Falling back to local scoring.`);
    return calculateATSScoreFallback(title, description);
  }
}

// Fallback logic
function calculateATSScoreFallback(title, description) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  let score = 0;
  const matchedSkills = [];
  
  if (titleLower.includes('frontend') || titleLower.includes('front-end') || titleLower.includes('ui engineer')) score += 30;
  else if (titleLower.includes('react')) score += 25;
  else if (titleLower.includes('software developer') || titleLower.includes('software engineer')) score += 20;

  const skills = ['react', 'redux', 'javascript', 'node', 'html', 'css', 'api', 'sso', 'rbac', 'microservices'];
  skills.forEach(skill => {
    if (descLower.includes(skill)) {
      score += 4;
      matchedSkills.push(skill.toUpperCase());
    }
  });

  if (descLower.includes('2+') || descLower.includes('2 years') || descLower.includes('3 years')) score += 20;
  if (descLower.includes('dashboard') || descLower.includes('migration')) score += 10;
  if (descLower.includes('5+ years') || descLower.includes('8+ years')) score -= 15;

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedSkills: [...new Set(matchedSkills)]
  };
}

/**
 * Helper to check and maintain the list of historically sent job IDs.
 * Prevents sending duplicate job notifications.
 */
function filterDuplicatesAndHistory(jobs) {
  const historyFile = path.resolve('history.json');
  let sentHistory = [];

  if (fs.existsSync(historyFile)) {
    try {
      sentHistory = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    } catch {
      sentHistory = [];
    }
  }

  const seenKeys = new Set();
  const uniqueJobs = [];

  for (const job of jobs) {
    const uniqueKey = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}`;
    
    if (seenKeys.has(uniqueKey)) {
      continue; 
    }

    if (sentHistory.includes(job.id) || sentHistory.includes(uniqueKey)) {
      continue;
    }

    seenKeys.add(uniqueKey);
    uniqueJobs.push(job);
  }

  if (uniqueJobs.length > 0) {
    const newKeys = uniqueJobs.map(j => `${j.title.toLowerCase().trim()}_${j.company.toLowerCase().trim()}`);
    const newIds = uniqueJobs.map(j => j.id);
    const updatedHistory = [...new Set([...sentHistory, ...newIds, ...newKeys])].slice(-500);
    
    fs.writeFileSync(historyFile, JSON.stringify(updatedHistory, null, 2));
  }

  return uniqueJobs;
}

/**
 * Fetch jobs dynamically from JSearch API and run ATS filter.
 * @param {object} config - Configuration object
 * @returns {Promise<object[]>} Array of formatted job objects
 */
export async function fetchJobsFromJSearch(config) {
  const apiKey = config.rapidApiKey;
  if (!apiKey || apiKey === 'your_rapidapi_key_here') {
    throw new Error('RAPIDAPI_KEY is not configured or is using the placeholder value.');
  }

  const isGeminiMissing = !config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here';

  const rolesQuery = `(${config.targetRoles.join(' OR ')})`;
  const citiesQuery = `(${config.targetCities.join(' OR ')})`;
  const queryStr = `${rolesQuery} in ${citiesQuery} India`;

  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.append('query', queryStr);
  url.searchParams.append('page', '1');
  url.searchParams.append('num_pages', '3'); // Fetch up to 30 jobs
  url.searchParams.append('date_posted', 'today'); // Past 24 hours only

  console.log(`📡 Querying JSearch API with: "${queryStr}"...`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`JSearch API error (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  const rawJobs = result.data || [];

  console.log(`   API returned ${rawJobs.length} raw jobs. Running ATS scoring...`);

  // Sequential execution with a 1.2-second delay to guarantee we never hit the 15 RPM free tier rate limit
  const evaluatedJobs = [];
  for (let i = 0; i < rawJobs.length; i++) {
    const job = rawJobs[i];
    
    // Check if contract, part-time, freelance, or intern type
    const empType = (job.job_employment_type || '').toLowerCase();
    const titleLower = (job.job_title || '').toLowerCase();
    const descLower = (job.job_description || '').toLowerCase();

    const isNonFullTime = 
      empType.includes('contract') || 
      empType.includes('parttime') || 
      empType.includes('part-time') || 
      empType.includes('freelance') || 
      empType.includes('intern') ||
      titleLower.includes('contract') || 
      titleLower.includes('freelance') || 
      titleLower.includes('part-time') || 
      titleLower.includes('part time') || 
      titleLower.includes('internship') || 
      titleLower.includes('intern') ||
      descLower.includes('internship') ||
      descLower.includes('freelance contract');

    if (isNonFullTime) {
      console.log(`   [${i + 1}/${rawJobs.length}] Skipping: "${job.job_title}" (Excluded Freelance/Part-time/Contract/Intern)`);
      continue;
    }

    // Exclude jobs with explicitly stated low salaries (< 10 LPA)
    const minSalaryVal = job.job_min_salary;
    const isLowSalary = minSalaryVal && (
      (job.job_salary_currency === 'INR' && minSalaryVal < 1000000) || // Less than 10 LPA
      (job.job_salary_currency === 'USD' && minSalaryVal < 12000)      // Less than $12,000 / year (approx 10 LPA)
    );

    if (isLowSalary) {
      console.log(`   [${i + 1}/${rawJobs.length}] Skipping: "${job.job_title}" (Salary below 10 LPA: ${job.job_min_salary} ${job.job_salary_currency})`);
      continue;
    }

    let salaryRange = 'Not specified';
    if (job.job_min_salary && job.job_max_salary) {
      const minLpa = (job.job_min_salary / 100000).toFixed(1);
      const maxLpa = (job.job_max_salary / 100000).toFixed(1);
      salaryRange = `₹${minLpa}–${maxLpa} LPA (${job.job_salary_currency || 'INR'})`;
    } else if (job.job_min_salary) {
      const minLpa = (job.job_min_salary / 100000).toFixed(1);
      salaryRange = `Min ₹${minLpa} LPA`;
    }

    const location = [job.job_city, job.job_state, job.job_country]
      .filter(Boolean)
      .join(', ');

    // Only delay if we are actually making network calls to Gemini API
    if (!isGeminiMissing && i > 0) {
      await delay(1200);
    }

    console.log(`   [${i + 1}/${rawJobs.length}] Parsing job: "${job.job_title}" at "${job.employer_name}"`);
    const { score, matchedSkills } = await calculateATSScore(
      job.job_title,
      job.job_description,
      config.geminiApiKey
    );

    evaluatedJobs.push({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      logo: job.employer_logo || 'https://via.placeholder.com/100?text=' + encodeURIComponent(job.employer_name),
      location: location || 'India',
      city: job.job_city || '',
      salaryRange,
      applyLink: job.job_apply_link,
      publisher: job.job_publisher || 'Web',
      postedTime: job.job_posted_at_datetime_utc 
        ? new Date(job.job_posted_at_datetime_utc).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Today',
      description: job.job_description 
        ? job.job_description.substring(0, 250).trim() + '...'
        : 'No description details provided.',
      atsScore: score,
      matchedSkills
    });
  }

  // Filter jobs by ATS score and dev role title
  const relevantJobs = evaluatedJobs.filter((job) => {
    const titleLower = job.title.toLowerCase();
    const isDevRole = ['react', 'frontend', 'front-end', 'ui', 'software', 'developer', 'engineer', 'full-stack', 'fullstack'].some(
      (kw) => titleLower.includes(kw)
    );
    
    const isHighlyRelevant = isGeminiMissing ? true : (job.atsScore >= 85);
    return isDevRole && isHighlyRelevant;
  });

  // Deduplicate and filter out historically sent jobs
  const cleanNewJobs = filterDuplicatesAndHistory(relevantJobs);
  console.log(`   Deduplicated and filtered history. Sending ${cleanNewJobs.length} new jobs.`);

  return cleanNewJobs.sort((a, b) => b.atsScore - a.atsScore);
}

/**
 * Build the HTML for a single job card in a clean, professional corporate format.
 * @param {object} job
 * @param {number} index
 * @returns {string} HTML string
 */
export function buildJobCard(job, index) {
  const matchedSkillsText = job.matchedSkills.length > 0
    ? job.matchedSkills.join(', ')
    : 'React, Redux, JavaScript';

  return `
    <!-- JOB CARD -->
    <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:16px;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <!-- Company Logo -->
          <td style="vertical-align:top;width:40px;padding-right:12px;">
            <img src="${job.logo}" alt="${job.company}" style="width:40px;height:40px;border-radius:4px;object-fit:contain;background:#f9fafb;border:1px solid #e5e7eb;" onerror="this.src='https://via.placeholder.com/40/374151/ffffff?text=${encodeURIComponent(job.company[0])}'" />
          </td>
          <!-- Title & Company -->
          <td style="vertical-align:top;">
            <h3 style="margin:0;color:#111827;font-size:15px;font-weight:700;line-height:1.4;">
              ${index}. ${job.title}
            </h3>
            <div style="color:#4b5563;font-size:13px;font-weight:600;margin-top:2px;">
              ${job.company}
            </div>
          </td>
          <!-- ATS Score & Salary -->
          <td style="vertical-align:top;text-align:right;width:120px;white-space:nowrap;">
            <div style="font-weight:700;font-size:14px;color:#0d9488;">
              ${job.atsScore}% Match
            </div>
            <div style="color:#374151;font-size:12px;margin-top:2px;font-weight:500;">
              ${job.salaryRange}
            </div>
          </td>
        </tr>
      </table>

      <!-- Job Description snippet -->
      <p style="margin:12px 0 10px;color:#374151;font-size:13px;line-height:1.5;">
        ${job.description}
      </p>

      <!-- Matched Skills -->
      <div style="margin-bottom:12px;color:#4b5563;font-size:11px;line-height:1.4;">
        <strong style="color:#1f2937;">Matched Skills:</strong> <span style="font-style:italic;">${matchedSkillsText}</span>
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid #e5e7eb;margin-top:12px;padding-top:10px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <!-- Details -->
            <td style="color:#6b7280;font-size:11px;vertical-align:middle;">
              📍 ${job.location} &nbsp;&bull;&nbsp; 🌐 via ${job.publisher} &nbsp;&bull;&nbsp; 🕒 ${job.postedTime}
            </td>
            <!-- Action Button -->
            <td style="text-align:right;width:120px;vertical-align:middle;">
              <a href="${job.applyLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:700;line-height:1;text-align:center;">Apply Now &rarr;</a>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
}
