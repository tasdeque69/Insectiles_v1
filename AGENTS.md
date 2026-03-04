# Pinik Pipra - AI Agent Workflow System

## Repository
**https://github.com/FahadIbrahim93/Insectiles_HT_v1**

## For Jules, Grok, Codex, and All AI Agents

Welcome! This project uses a structured workflow so any AI can pick up work seamlessly.

## Project Overview
- **Name:** Pinik Pipra (Insectiles)
- **Description:** Psychedelic insect tile-matching falling game
- **Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Web Audio API

## Branch Strategy
```
main          ← Production-ready code
├── dev        ← Integration branch  
├── feat/*     ← Feature branches
├── fix/*      ← Bug fix branches
└── hotfix/*  ← Emergency fixes
```

## Task Workflow

### 1. Pick a Task
- Check Linear issues or GitHub Issues
- Assign yourself to a task

### 2. Create Branch
```bash
git checkout -b feat/add-sprites
# or
git checkout -b fix/audio-bug
```

### 3. Code
- Make your changes
- Keep code clean and focused

### 4. Test & Validate
```bash
npm run lint    # Type check - MUST pass
npm run build   # Build - MUST pass
```

### 5. Commit (Conventional)
```
feat:     Add game sprites
fix:      Fix audio issue
refactor: Clean up renderer
docs:     Add README
test:     Add tests for game engine
```

### 6. Push & PR
- Push branch
- Create PR to `dev` branch
- Link the issue
- Tag @FahadIbrahim93

### 7. Merge
- After approval → merge to `dev`
- Then merge `dev` to `main` for release

## Critical Rules

### Before ANY Commit
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No secrets in code (use .env.local)
- [ ] No console.log in production

### Code Standards
- TypeScript for everything
- Functional components + hooks
- Tailwind CSS for styling
- 200-400 lines per file max

## Quick Commands
```bash
npm install     # Install deps
npm run dev    # Dev server (port 3000)
npm run build  # Production build
```

## Secrets
- Copy `.env.example` to `.env.local`
- Add your API keys there
- NEVER commit secrets!

## Important Links
- **Repo:** https://github.com/FahadIbrahim93/Insectiles_HT_v1
- **Game Live:** (TBD)
