# AI Personal Team - Complete Setup Guide

## 🚀 Quick Start for New Developers

This guide will help you set up the complete **AI Personal Team** - a comprehensive suite of AI agents including Memorias AI, Image Generator, F-Insight AI, Fact Checker, Research Agents, and more.

## 🤖 What You're Setting Up

### Core AI Agents:
- **🎙️ Memorias AI**: Spanish storytelling with voice recording and AI transcription
- **🖼️ Image Generator**: Photorealistic image generation from prompts
- **💰 F-Insight AI**: Financial insights and market analysis  
- **🔍 Fact Checker**: Information verification and validation
- **📊 Researcher Agent**: Comprehensive research and data analysis
- **🎵 Vinyl Researcher**: Music and vinyl record specialist
- **✉️ Communications Agent**: Email and business writing assistance
- **📈 Crypto Tools**: Coinbase integration and trading features
- **🎨 Story Writer**: Creative writing assistance

### Supporting Tools:
- **Framework Scripts**: PowerShell utilities (ConvertCSV-ToJSON.ps1)
- **Database Management**: Supabase integration for data persistence
- **Email Services**: Resend API for email delivery
- **Audio Processing**: OpenAI Whisper for transcription
- **Text-to-Speech**: OpenAI TTS with gender-aware Spanish grammar

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

### Optional System Tools (for advanced features)
4. **PowerShell** (Windows) or **Bash** (Mac/Linux)
   - For running framework scripts (e.g., ConvertCSV-ToJSON.ps1)
   
5. **Docker** (optional)
   - For containerized deployment
   - Download from: https://docker.com/

### Browser Requirements
- **Chrome/Firefox/Safari** (latest versions)
- **Microphone access** required for audio recording features
- **HTTPS support** required for audio recording (automatic in development)

### Recommended VS Code Extensions
- **TypeScript/JavaScript Support**: Built-in (no extension needed)
- **ES7+ React/Redux/React-Native snippets**: For React development
- **Prettier - Code formatter**: For consistent code formatting
- **Auto Rename Tag**: For HTML/JSX tag editing

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
- `openai` (^5.1.0) - OpenAI API for Whisper transcription, text-to-speech, and image generation
- `formidable` (^3.5.4) - File upload handling for audio and image files
- `natural` (^6.2.3) - Natural language processing utilities

### Financial & Trading Services  
- `@coinbase/cdp-sdk` (^1.26.0) - Coinbase API for cryptocurrency features
- `coinbase` (^2.0.8) - Additional Coinbase integration
- `axios` (^1.10.0) - HTTP client for API communications

### Data Processing & Web Scraping
- `cheerio` (^1.0.0-rc.12) - Web scraping and HTML parsing
- `puppeteer` (^22.0.0) - Browser automation for advanced scraping
- `rss-parser` (^3.12.0) - RSS feed parsing for research agents

### Email & Communication
- `resend` (^6.0.1) - Email delivery service

### Database & Storage
- `@supabase/supabase-js` (^2.39.1) - Database integration for data persistence

### Development & Testing
- `express` (^4.18.2) - Development server utilities
- `dotenv` (^16.3.1) - Environment variable management
- `jest` (^29.7.0) - Testing framework
- `tsx` (^4.7.0) - TypeScript execution utilities

## 🔑 Environment Variables Setup

### 1. Create Environment File
```bash
cp .env.example .env.local
```

### 2. Required API Keys

#### Essential for Core AI Features:
```bash
# OpenAI API (Required for most agents)
OPENAI_API_KEY=your_openai_api_key_here

# Resend API (Required for email features across agents)
RESEND_API_KEY=your_resend_api_key_here
```

#### For Financial/Crypto Agents:
```bash
# Coinbase API (Required for crypto and trading features)
COINBASE_API_KEY=your_coinbase_api_key_here
COINBASE_API_SECRET=your_coinbase_api_secret_here
```

#### For Database Features:
```bash
# Supabase (Required for data persistence and user management)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### For Market Data & Research Agents:
```bash
# Market Data APIs (Optional - for enhanced financial research)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
```

## 🌐 API Account Setup Guide

### 1. OpenAI API Setup (Required for Most Agents)
1. Go to: https://platform.openai.com/
2. Sign up/Login to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the key and add to `.env.local` as `OPENAI_API_KEY`
6. **Cost:** Pay-per-use (~$0.006 per minute of audio, ~$0.020 per image)

### 2. Resend Email Service Setup (Required for Email Features)
1. Go to: https://resend.com/
2. Sign up for free account (3,000 emails/month free)
3. Go to: https://resend.com/api-keys
4. Create a new API key
5. Copy the key and add to `.env.local` as `RESEND_API_KEY`
6. **Cost:** Free tier: 3,000 emails/month

### 3. Coinbase API Setup (Required for Crypto Features)
1. Go to: https://www.coinbase.com/developer-platform
2. Create a developer account
3. Generate API Key and Secret
4. Add to `.env.local` as `COINBASE_API_KEY` and `COINBASE_API_SECRET`
5. **Cost:** Free for API access, transaction fees apply

### 4. Supabase Database Setup (Required for Data Persistence)
1. Go to: https://supabase.com/
2. Create a free account and new project
3. Get your project URL and anon key from Settings > API
4. Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Cost:** Free tier: 500MB database, 5GB bandwidth
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

### 3. Domain Verification (Recommended for Production)
1. In Resend dashboard, go to: https://resend.com/domains
2. Add your domain (e.g., `memorias-ai.com`) and verify it
3. **DNS Configuration Required:**
   - Add TXT record for domain verification (resend._domainkey)
   - Add TXT record for SPF (send subdomain): `v=spf1 include:amazonses.com ~all`
   - Add MX record for email routing (send subdomain): `feedback-smtp.us-east-1.amazonses.com`
   - Add DMARC policy (optional): `v=DMARC1; p=none;`
4. Wait for DNS propagation (up to 24 hours)
5. Update the `from` field in `/pages/api/send-email.ts` from `onboarding@resend.dev` to `stories@yourdomain.com`

**Note:** While domain verification is pending, emails can only be sent to verified addresses in your Resend account.

## 🛠️ System Tools & Scripts

### Framework Scripts
The repository includes utility scripts in `framework/tools/scripts/`:

#### ConvertCSV-ToJSON.ps1 (PowerShell)
- **Purpose**: Convert CSV files to JSON format for data processing
- **Requirements**: PowerShell (Windows) or PowerShell Core (Mac/Linux)
- **Usage**: Run from PowerShell terminal
- **Location**: `framework/tools/scripts/ConvertCSV-ToJSON.ps1`

#### Installing PowerShell (if needed):
- **Windows**: Built-in
- **Mac**: `brew install powershell`
- **Linux**: Follow instructions at https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell-core-on-linux

### Development Scripts
Additional scripts in `ai-personal-team/` directory:
- **populate-mock-data**: `npm run populate-mock-data` - Populate database with test data
- **setup-database**: `npm run setup-database` - Initialize database schema

## 🤖 Agent-Specific Requirements

### Image Generator Agent
- **Location**: `/app/image-generator/`
- **Dependencies**: OpenAI API (DALL-E), file system access
- **Storage**: Generated images saved to local filesystem
- **Features**: Text-to-image generation with customizable prompts
- **Cost**: ~$0.040 per image (1024x1024)

### F-Insight AI
- **Location**: `/app/f-insight-ai/`
- **Dependencies**: OpenAI API (GPT models), web scraping tools
- **Features**: Financial market analysis, economic insights
- **Data Sources**: Real-time financial data via web scraping
- **Cost**: Based on OpenAI API usage

### Fact Checker
- **Location**: `/app/fact-checker/`
- **Dependencies**: OpenAI API, Puppeteer, web scraping libraries
- **Features**: Information verification, source validation
- **Requirements**: Stable internet connection for fact verification
- **Browser**: Chromium installed for Puppeteer operations

### Research Agents
- **Location**: `/agents/ResearcherAgent.ts`, `/agents/VinylResearcherAgent.ts`
- **Dependencies**: Puppeteer, Cheerio, RSS parsers, web APIs
- **Features**: Web research, data collection, RSS feed processing
- **Browser**: Chromium-based for web scraping operations
- **Storage**: Research results cached locally

### Communications Agent
- **Location**: `/agents/CommunicationsAgent.ts`
- **Dependencies**: Resend API, email templates
- **Features**: Email composition and delivery
- **Requirements**: Verified email domain for production use
- **Templates**: Customizable email templates with attachments

### Crypto Tools
- **Location**: `/app/crypto-dashboard/`, `/services/coinbase.ts`
- **Dependencies**: Coinbase SDK, financial APIs
- **Features**: Portfolio tracking, trading operations
- **Requirements**: Coinbase account and API credentials
- **Security**: Read-only API access recommended

### Story Writer
- **Location**: `/agents/story_writer.ts`
- **Dependencies**: OpenAI API (GPT models)
- **Features**: Creative writing, story generation
- **Storage**: Generated stories can be saved locally
- **Integration**: Works with TTS for audio storytelling

### Memorias AI (Core Agent)
- **Location**: `/app/memorias-ai/`
- **Dependencies**: OpenAI API (TTS, STT, GPT), Resend
- **Features**: Voice interaction, memory management, email stories
- **Audio**: Text-to-speech with gender-aware Spanish grammar
- **Memory**: Persistent conversation history and user preferences

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

## 🔧 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database connection issues
1. Verify Supabase URL and key in `.env.local`
2. Check database schema is properly migrated
3. Run: `npm run setup-database`

#### API key errors
1. Double-check all API keys are correctly copied
2. Ensure no extra spaces in `.env.local`
3. Restart development server after adding keys

#### Puppeteer/Browser issues
```bash
# Install Chromium manually if needed
npx puppeteer browsers install chrome
```

#### TTS/STT not working
1. Verify OpenAI API key has proper permissions
2. Check audio codec support in browser
3. Ensure microphone permissions are granted

#### Email delivery failing
1. Verify Resend API key
2. Check domain verification status
3. Use verified email address for testing

### Development Tips
- Use `npm run dev` with hot reload for faster development
- Check browser console for client-side errors
- Monitor API usage in respective service dashboards
- Use TypeScript strict mode for better error catching

### Performance Optimization
- Enable caching for API responses where appropriate
- Optimize image sizes for web delivery
- Use environment-specific configurations
- Monitor memory usage for long-running processes

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
- **🗣️ Gender-Aware Voice Selection:** Multiple Argentine Spanish voices (Carmen, Diego, Valentina, Mateo) with proper gender grammar
- **🎙️ Smart Audio Recording:** Browser-based audio capture with enhanced UX
- **🤖 AI Transcription:** OpenAI Whisper for accurate Spanish transcription
- **📖 Story Management:** Edit and organize transcribed stories with smart formatting
- **📧 Email Delivery:** Send stories via email using Resend service
- **💾 Smart Audio Download:** Download recorded audio with descriptive filenames

### 🆕 Latest Enhancements (August 2025)
- **Gender-Aware Grammar:** Female agents speak with proper feminine Spanish grammar ("estoy lista" not "estoy listo")
- **Enhanced Button States:** Clear "Interrumpir" button during agent speech transitions
- **Auto-Recording:** Seamless flow from interruption to recording during storytelling phase
- **Smart Filenames:** Downloaded audio files use story titles + date (e.g., "mi-historia-2025-08-10.mp3")
- **Better Error Handling:** Clear Spanish error messages for email restrictions

### Technical Features
- Real-time audio recording with state management
- Redux-pattern state management for complex interactions
- Responsive design optimized for mobile and desktop
- Comprehensive error handling and validation
- Email format validation with user-friendly feedback
- Multiple audio format support (MP3, WAV, OGG)

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
