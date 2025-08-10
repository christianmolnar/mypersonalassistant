# Memorias AI - Complete Setup Guide

## 🚀 Quick Start for New Developers

This guide will help you set up the complete Memorias AI application from scratch.

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **Code Editor** (recommended: VS Code)
   - Download from: https://code.visualstudio.com/

## 🔧 Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/christianmolnar/mypersonalassistant.git
cd MyPersonalAssistant
```

### 2. Navigate to the Correct Directory
⚠️ **CRITICAL:** All development work must be done from the Next.js app directory:
```bash
cd ai-personal-team
```

### 3. Install Dependencies
```bash
npm install
```

## 📦 Required Packages & Dependencies

The following packages are automatically installed with `npm install`:

### Core Framework
- `next` (15.3.3) - React framework
- `react` (^19.0.0) - UI library
- `react-dom` (^19.0.0) - React DOM bindings
- `typescript` (^5) - TypeScript support

### AI & Audio Processing
- `openai` (^5.1.0) - OpenAI API for Whisper transcription and text-to-speech
- `formidable` (^3.5.4) - File upload handling for audio files

### Email Service
- `resend` (^6.0.1) - Email delivery service

### Optional Services (for full functionality)
- `@supabase/supabase-js` (^2.39.1) - Database (if needed)
- `@coinbase/cdp-sdk` (^1.26.0) - Crypto features (optional)
- `axios` (^1.10.0) - HTTP client
- `cheerio` (^1.0.0-rc.12) - Web scraping
- `puppeteer` (^22.0.0) - Browser automation

## 🔑 Environment Variables Setup

### 1. Create Environment File
```bash
cp .env.example .env.local
```

### 2. Required API Keys

#### Essential for Memorias AI:
```bash
# OpenAI API (Required for transcription and text-to-speech)
OPENAI_API_KEY=your_openai_api_key_here

# Resend API (Required for email functionality)
RESEND_API_KEY=your_resend_api_key_here
```

#### Optional (for extended features):
```bash
# Supabase (if using database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Market Data APIs (for other features)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
```

## 🌐 API Account Setup Guide

### 1. OpenAI API Setup (Required)
1. Go to: https://platform.openai.com/
2. Sign up/Login to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the key and add to `.env.local` as `OPENAI_API_KEY`
6. **Cost:** Pay-per-use (~$0.006 per minute of audio)

### 2. Resend Email Service Setup (Required)
1. Go to: https://resend.com/
2. Sign up for free account (3,000 emails/month free)
3. Go to: https://resend.com/api-keys
4. Create a new API key
5. Copy the key and add to `.env.local` as `RESEND_API_KEY`
6. **Cost:** Free tier: 3,000 emails/month

### 3. Domain Verification (Optional but Recommended)
1. In Resend dashboard, go to: https://resend.com/domains
2. Add your domain and verify it
3. Update the `from` field in `/pages/api/send-email.ts`

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Opens at: http://localhost:3000

### Build for Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## 📁 Project Structure

```
ai-personal-team/
├── app/                          # Next.js app directory
│   ├── memorias-ai/             # Memorias AI application
│   │   ├── page.tsx             # Main Memorias AI interface
│   │   └── globals.css          # Global styles
│   └── page.tsx                 # Home page
├── pages/api/                   # API routes
│   ├── send-email.ts           # Email sending endpoint
│   ├── text-to-speech.ts       # TTS endpoint
│   └── transcribe-audio.ts     # Audio transcription
├── components/                  # React components
├── services/                    # Service layer
├── agents/                      # AI agent definitions
├── package.json                # Dependencies and scripts
├── .env.example                # Environment template
└── .env.local                  # Your environment variables
```

## 🎯 Features Overview

### Core Memorias AI Features
- **Voice Selection:** Multiple Argentine Spanish voice options
- **Audio Recording:** Browser-based audio capture
- **AI Transcription:** OpenAI Whisper for Spanish transcription
- **Story Management:** Edit and organize transcribed stories
- **Email Delivery:** Send stories via email using Resend
- **Audio Download:** Download recorded audio files

### Technical Features
- Real-time audio recording
- State management with Redux pattern
- Responsive design
- Error handling and validation
- Email format validation
- Audio format support

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

## 🌍 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Netlify
- Railway
- Heroku
- AWS
- DigitalOcean

## 💰 Cost Breakdown

### Essential Services (Monthly)
- **OpenAI API:** ~$5-20 (depending on usage)
- **Resend Email:** Free (up to 3,000 emails/month)
- **Hosting (Vercel):** Free (hobby plan) or $20/month (pro)

### Total Monthly Cost: $5-40

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 2. TypeScript errors
```bash
npm run build
# Fix any TypeScript errors shown
```

#### 3. API key not working
- Check `.env.local` file exists in correct directory
- Verify API key format (no extra spaces/quotes)
- Restart development server after adding keys

#### 4. Audio recording not working
- Ensure HTTPS (required for audio recording)
- Check browser permissions for microphone
- Test in Chrome/Firefox (best support)

### Getting Help
1. Check console logs in browser developer tools
2. Check terminal logs where `npm run dev` is running
3. Verify all environment variables are set correctly

## 📞 Support

For technical questions or issues:
1. Check the documentation in `/personal/memorias-ai-documentation/`
2. Review error logs in browser console
3. Ensure all API keys are correctly configured

## 🎉 Success Checklist

- [ ] Node.js installed and working
- [ ] Repository cloned and in correct directory (`ai-personal-team/`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with API keys
- [ ] OpenAI API key configured and working
- [ ] Resend API key configured
- [ ] Development server running (`npm run dev`)
- [ ] Can access application at http://localhost:3000
- [ ] Audio recording works in browser
- [ ] Email sending works

Once all items are checked, you're ready to use Memorias AI! 🎊
