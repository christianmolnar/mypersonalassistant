---
applyTo: '**'
---

# Memory - Critical Information

## Working Directory for Christian's AI Personal Team Project

**CRITICAL**: When working on the AI Personal Team project (Memorias AI, email systems, Next.js app), the correct working directory is:
```
/Users/christian/Repos/MyPersonalAssistant/ai-personal-team
```

NOT the root `/Users/christian/Repos/MyPersonalAssistant` directory.

### Key Points:
- The Next.js application is located in the `ai-personal-team` subdirectory
- All npm commands, dev server starts, and API testing should be run from this directory
- The `package.json`, `next.config.js`, and all app files are in this subdirectory
- Running commands from the wrong directory causes "No pages or app directory found" errors

### User Preferences:
- Christian has specifically requested that I remember this and always start in the correct directory to avoid repeating this mistake.
- **NEVER START THE DEV SERVER** - Christian will start it himself when ready. Just tell him when I'm ready and he'll start it.

## Project Structure
- Main repo: `/Users/christian/Repos/MyPersonalAssistant/`
- AI Personal Team app: `/Users/christian/Repos/MyPersonalAssistant/ai-personal-team/`
- Email API: `/Users/christian/Repos/MyPersonalAssistant/ai-personal-team/pages/api/send-email.ts`
- Memorias AI page: `/Users/christian/Repos/MyPersonalAssistant/ai-personal-team/app/memorias-ai/page.tsx`
