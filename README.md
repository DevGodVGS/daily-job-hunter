# 🎯 Daily Job Hunter Agent (Dynamic Search & AI ATS)

A Node.js-powered agent that queries the JSearch API (aggregates LinkedIn, Indeed, Glassdoor, Naukri, and more) to scan the entire internet for React/Frontend developer roles in India posted in the **last 24 hours**, evaluates them semantically using Google Gemini AI (acting as an ATS evaluator), and sends a beautifully formatted email report every morning at 9 AM.

## ⚡ Quick Start

### 1. Install dependencies
```bash
cd daily-job-hunter
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env` and fill in the following:
1. **Gmail App Password** (NOT your regular password):
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" → Generate
   - Copy the 16-character password into `EMAIL_PASS`
2. **RapidAPI JSearch Key** (200 free requests/month, no card required):
   - Sign up at [RapidAPI](https://rapidapi.com)
   - Subscribe to the free "Basic" plan on [JSearch API](https://rapidapi.com/letscrape-65710003/api/jsearch)
   - Copy your Application Key (`X-RapidAPI-Key`) into `RAPIDAPI_KEY`
3. **Gemini API Key** (Free tier, no card required):
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Click "Create API Key"
   - Copy the key and paste it into `GEMINI_API_KEY`

### 3. Test run (one-shot)
```bash
npm start
```

### 4. Start daily scheduler (9 AM IST every day)
```bash
npm run schedule
```

## 📁 Project Structure

```
daily-job-hunter/
├── index.js           # Main entry point & orchestrator
├── search-engine.js   # Dynamic API search and Gemini ATS parser
├── email-builder.js   # HTML email builder & sender
├── scheduler.js       # Cron scheduler (9 AM IST daily)
├── .env.example       # Environment config template
├── package.json       # Dependencies & scripts
└── README.md          # This file
```

## ⚙️ Configuration

All settings are in `.env`:

| Variable | Default | Description |
|---|---|---|
| `EMAIL_USER` | — | Gmail address |
| `EMAIL_PASS` | — | Gmail App Password |
| `EMAIL_TO` | Same as USER | Recipient email |
| `RAPIDAPI_KEY` | — | JSearch API Key |
| `GEMINI_API_KEY` | — | Google Gemini API Key |
| `TARGET_CITIES` | `Hyderabad,Bangalore,Pune` | Cities to scan |
| `TARGET_ROLES` | `Frontend Developer,...` | Role titles |
| `CORE_SKILLS` | `React,Redux,...` | Skills to match |
| `MIN_SALARY_LPA` | `10` | Min salary in LPA |
| `MAX_SALARY_LPA` | `20` | Max salary in LPA |
| `CRON_SCHEDULE` | `0 9 * * *` | Cron expression |
| `TZ` | `Asia/Kolkata` | Timezone |

## 🚀 Running as a Background Service

To keep the scheduler running 24/7, use `pm2`:

```bash
# Install pm2 globally
npm install -g pm2

# Start the scheduler as a daemon
pm2 start scheduler.js --name "job-hunter"

# Auto-start on system boot
pm2 startup
pm2 save

# View logs
pm2 logs job-hunter

# Stop
pm2 stop job-hunter
```

## 📧 Email Preview

The daily email includes:
- 🔥 Dynamic, fresh job postings from the last 24 hours across the entire web
- 🎯 Semantic ATS Match Percentage calculated using Google Gemini AI
- 💡 List of matching skills extracted from your resume
- 🏷️ Publishing source (LinkedIn, Indeed, etc.) and post time
- 💰 Salary estimate (if specified)
- 📍 Location details
- 💡 Random tip of the day

## License

MIT
