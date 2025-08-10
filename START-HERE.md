# 🚀 MyPersonalAssistant - Quick Start Guide

## What is this repository?

This is Christian's comprehensive AI Personal Assistant repository, featuring multiple AI agents and applications including **Memorias AI** - a Spanish-language storytelling application with voice recording and AI transcription.

## 🎯 For New Users - GET STARTED IMMEDIATELY:

### 1. **Want to use Memorias AI (the main app)?**
👉 **Go to: [`MEMORIAS_AI_SETUP_GUIDE.md`](./MEMORIAS_AI_SETUP_GUIDE.md)**

This guide has EVERYTHING you need:
- Complete installation instructions
- All required packages and extensions
- API key setup guide
- Step-by-step configuration
- Troubleshooting help

### 2. **Want to explore the full repository structure?**
👉 **Go to: [`README.md`](./README.md)**

### 3. **Working on other AI agents or tools?**
👉 **Go to: [`framework/docs/`](./framework/docs/)**

## 🔥 Quick Setup (TL;DR)

```bash
# 1. Clone and navigate
git clone https://github.com/christianmolnar/mypersonalassistant.git
cd MyPersonalAssistant/ai-personal-team

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Add your OpenAI and Resend API keys to .env.local

# 4. Run the app
npm run dev
# Opens at http://localhost:3000
```

## 🆘 Need Help?

1. **Setup Issues**: Check [`MEMORIAS_AI_SETUP_GUIDE.md`](./MEMORIAS_AI_SETUP_GUIDE.md) - it has detailed troubleshooting
2. **General Questions**: See [`README.md`](./README.md) for repository overview
3. **Technical Details**: Browse [`framework/docs/`](./framework/docs/) for architecture

---

**Most Important**: The main application is in the `ai-personal-team/` directory - not the root! Always `cd ai-personal-team` before running npm commands.