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

## Email System Information
- **Email Service**: Resend API with key `re_6gEvmDWs_9vqzQexRotKu8FPnhxAz6mGe`
- **Current Status**: Domain verification in progress - Domain key ✅ verified, SPF/MX records pending propagation
- **Verified Email**: `chrismolhome@hotmail.com` (Christian's email)
- **Domain**: `memorias-ai.com` (owned and domain key verified with Resend)
- **Sender**: Using `onboarding@resend.dev` (will switch to `stories@memorias-ai.com` after full verification)

### DNS Configuration Status (August 10, 2025)
- **Domain Key (resend._domainkey)**: ✅ Verified
- **DMARC (_dmarc)**: ✅ Verified (`v=DMARC1; p=none;`)
- **SPF (send subdomain)**: 🟡 Pending (`v=spf1 include:amazonses.com ~all`)
- **MX (send subdomain)**: 🟡 Pending (feedback-smtp.us-east-1.amazonses.com)
- **TTL**: 1 Hour (changes take up to 1 hour to propagate)

### Email Restrictions
- Resend account WAS in testing mode but domain verification appears to be progressing
- Error message was: "You can only send testing emails to your own email address"
- Current workaround: `chrismolhome@hotmail.com` confirmed working
- Expected: Full email capability once SPF/MX records finish propagating

## Recent UX Improvements
- **Storytelling Transition Enhancement** (August 10, 2025): Enhanced button behavior during agent transition from info gathering to storytelling phase. When agent speaks the confirmation message ("Ya tengo toda la información..."), the button now correctly shows "⏸️ Interrumpir" (red with pulse animation) instead of "Grabar Historia". When interrupted during this transition, recording automatically starts instead of requiring another button click.
- **Audio Filename Enhancement**: Implemented smart filename generation using story titles (up to 10 chars) for downloaded audio files, formatted as "story-title-YYYY-MM-DD.extension"
- **Enhanced Error Handling**: Improved email error messages to detect Resend sandbox restrictions and provide user-friendly Spanish explanations
