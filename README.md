# 🎯 Daily Job Hunter Agent (Dynamic Search, AI ATS & WhatsApp)

A Node.js-powered agent that queries the JSearch API (aggregates LinkedIn, Indeed, Glassdoor, Naukri, and more) to scan the entire internet for React/Frontend developer roles in India posted in the **last 24 hours**, evaluates them semantically using Google Gemini AI (acting as an ATS evaluator), and sends a beautifully formatted email report and a **WhatsApp summary alert** directly to your phone every morning at 9 AM.

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
4. **WhatsApp Twilio Credentials** (Free Sandbox):
   - Create a free account at [Twilio](https://www.twilio.com)
   - Copy your **Account SID** and **Auth Token** into `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`.
   - Setup the WhatsApp Sandbox: send the join code (e.g. `join <sandbox-code-word>`) to `+14155238886`.
   - Put your sandbox details into `TWILIO_FROM` (`whatsapp:+14155238886`) and `TWILIO_TO` (`whatsapp:+91XXXXXXXXXX`).

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
├── whatsapp-sender.js # WhatsApp notification builder & sender (Twilio)
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
| `TWILIO_ACCOUNT_SID`| — | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | — | Twilio Auth Token |
| `TWILIO_FROM` | `whatsapp:+14155238886` | Twilio Sandbox Number |
| `TWILIO_TO` | — | Target WhatsApp (with `whatsapp:+country_code`) |
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

## 📧 Notification Formats

### Email Preview
- 🔥 Dynamic, fresh job postings from the last 24 hours across the entire web
- 🎯 Semantic ATS Match Percentage calculated using Google Gemini AI
- 💡 List of matching skills extracted from your resume
- 🏷️ Publishing source (LinkedIn, Indeed, etc.) and post time
- 💰 Salary estimate (if specified)
- 📍 Location details
- 💡 Random tip of the day

### WhatsApp Preview
- 🎯 Clean markdown list of top 5 highest-matching jobs delivered directly to your WhatsApp chat.
- 🏢 Title, Company, Match Score, Salary, and direct Apply link.
- 📧 Quick summary with a prompt to check your email inbox for the full detailed scan.

## License

MIT
