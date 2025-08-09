# Memorias AI - Development Backlog

## Current Sprint - Critical Fixes & UI Improvement

### 🚨 PRIORITY 1: Core Bug Fixes
- [ ] **Fix transcription concatenation** - Currently only saving last transcription instead of combining all segments
- [ ] **Fix audio concatenation** - Currently only saving last audio segment instead of combining all story audio

### 🎯 PRIORITY 2: Simplified Info Collection UI
- [ ] **Replace step-by-step info gathering** with notebook-style 3-line control
- [ ] **Full-width layout** with left-aligned headers (Nombre, Edad, Lugar)
- [ ] **Always editable** - user can modify any field before saying "Grabar historia"
- [ ] **Persistent display** during storytelling phase for easy editing

---

## Future Enhancements (Post-Sprint)

### 3. Three-Button Storytelling Workflow
- [ ] "Grabar Historia" - Continue adding to current story
- [ ] "Historia Completa" - Mark story as finished and trigger OpenAI summarization  
- [ ] "Historia Nueva" - Start completely fresh story

### 4. OpenAI Story Summarization Integration
- [ ] Call OpenAI when story marked complete
- [ ] Display AI-generated warm, personal summary
- [ ] Allow user to edit summary before finalizing

### 5. Enhanced UX Features
- [ ] Confirmation modals for critical actions
- [ ] Conditional email/download display (only after story complete)
- [ ] Gender-aware Spanish messaging
- [ ] Better story finalization process

---

## Current Status
✅ Working conversational flow with reducer architecture (commit a1f05cd)
✅ Agent interruption and speech state management  
✅ Step-by-step conversation working properly

## Next Action
Implement Priority 1 & 2 items only, then reassess.
