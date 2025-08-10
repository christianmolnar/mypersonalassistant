# 🚀 MyPersonalAssistant - Complete AI Personal Team

## What is this repository?

This is Christian's **comprehensive AI Personal Team repository** featuring multiple specialized AI agents and applications:

### 🤖 **Available AI Agents:**
- **🎙️ Memorias AI**: Spanish-language storytelling with voice recording and AI transcription
- **🖼️ Image Generator**: Photorealistic image generation from prompts or reference images  
- **💰 F-Insight AI**: Financial insights and market analysis
- **🔍 Fact Checker**: Information verification and validation
- **📊 Researcher Agent**: Comprehensive research and data analysis
- **🎵 Vinyl Researcher**: Music and vinyl record information specialist
- **✉️ Communications Agent**: Email, meetings, business writing, proposals
- **📈 Crypto/Trading Tools**: Coinbase integration and cryptocurrency management
- **🎨 Story Writer**: Creative writing assistance and story development

### 🏗️ **Repository Architecture:**
- **framework/**: Core framework components and shared tools
- **shared/**: Shared structure for all work areas
- **personal/**: Personal workspace (gitignored)
- **ai-personal-team/**: Main Next.js application with all agents

## 🎯 For New Users - GET STARTED IMMEDIATELY:

### 1. **Want to use the AI Personal Team (all agents)?**
👉 **Go to: [`AI_PERSONAL_TEAM_SETUP_GUIDE.md`](./AI_PERSONAL_TEAM_SETUP_GUIDE.md)**

This comprehensive guide covers setup for **ALL AGENTS**, including:
- Complete installation instructions for the entire AI Personal Team
- All required packages, extensions, and tools
- API key setup guide for all services (OpenAI, Resend, Coinbase, etc.)
- Step-by-step configuration for all agents
- Troubleshooting help

### 2. **Want to explore the repository framework and structure?**
👉 **Go to: [`README.md`](./README.md)**

### 3. **Working on specific agents or custom tools?**
👉 **Go to: [`framework/docs/`](./framework/docs/)**

## 🔥 Quick Setup (TL;DR) - All AI Agents

```bash
# 1. Clone and navigate to the main AI application
git clone https://github.com/christianmolnar/mypersonalassistant.git
cd MyPersonalAssistant/ai-personal-team

# 2. Install all dependencies (handles all agents)
npm install

# 3. Set up environment for all services
cp .env.example .env.local
# Add your API keys to .env.local:
# - OPENAI_API_KEY (required for most agents)
# - RESEND_API_KEY (for email features)  
# - COINBASE_API_KEY + COINBASE_API_SECRET (for crypto features)
# - SUPABASE_URL + SUPABASE_ANON_KEY (for database features)

# 4. Run the complete AI Personal Team
npm run dev
# Opens at http://localhost:3000 with access to ALL agents
```

## 🆘 Need Help?

1. **Setup Issues**: Check [`AI_PERSONAL_TEAM_SETUP_GUIDE.md`](./AI_PERSONAL_TEAM_SETUP_GUIDE.md) - it has detailed troubleshooting
2. **General Questions**: See [`README.md`](./README.md) for repository overview
3. **Technical Details**: Browse [`framework/docs/`](./framework/docs/) for architecture

---

**Most Important**: The main AI Personal Team application is in the `ai-personal-team/` directory - not the root! Always `cd ai-personal-team` before running npm commands. This single application provides access to ALL the AI agents.