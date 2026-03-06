# Jules - Pinik Pipra Game Development Prompt

## Context
You are working on **Pinik Pipra** (formerly Insectiles), a psychedelic insect tile-matching falling game. The owner is **Fahad Ibrahim** (HopeTheory brand).

## Repository
**https://github.com/FahadIbrahim93/Insectiles_HT_v1**

## Your Mission
Audit, analyze, and rebuild the game using the **latest best standards**. Make it production-ready.

---

## Phase 1: Audit & Analysis

### 1.1 Review Current State
- Clone and explore: `https://github.com/FahadIbrahim93/Insectiles_HT_v1`
- Run `npm install && npm run dev`
- Test the current game
- Identify issues: bugs, missing features, code quality

### 1.2 Research Best Practices
For a React 19 + Vite + TypeScript game:
- Canvas rendering optimization
- Game loop patterns (requestAnimationFrame)
- State management (Zustand/Context)
- Audio system best practices
- Mobile/touch handling
- Performance (60fps target)

### 1.3 Analyze Assets
We have **14 assets** in the repo:
- 10 JPEG sprites (mascots, backgrounds, falling insects)
- 2 MP4 animations (idle animations)

Review how they can be integrated into the game.

---

## Phase 2: Implementation

### 2.1 Architecture Rebuild
Using latest standards:
- **React 19** with hooks
- **Vite** for fast builds
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management (score, game state)
- **Canvas API** for rendering

### 2.2 Core Features to Implement
- [ ] Falling insects mechanic with proper sprites
- [ ] Tap/click interaction system
- [ ] Score system
- [ ] Fever mode at 500 points
- [ ] High score (localStorage)
- [ ] Audio system with beat visualization
- [ ] Mobile touch support
- [ ] Animations using assets

### 2.3 Code Standards
- Functional components + hooks
- TypeScript strict mode
- Tailwind utility classes
- No console.log in production
- Environment variables for secrets
- Proper error handling

### 2.4 Performance
- Target 60fps
- Use requestAnimationFrame
- Optimize canvas rendering
- Lazy load assets

---

## Phase 3: Polish

### 3.1 Game Feel
- Smooth animations
- Visual feedback on tap
- Fever mode visual effects
- Score animations

### 3.2 Mobile
- Touch controls
- Responsive canvas
- PWA support (optional)

### 3.3 Audio
- Web Audio API integration
- Beat visualization
- Sound effects

---

## Deliverables

1. **Working Game** - Fully playable in browser
2. **Clean Code** - Well-structured, documented
3. **Assets Integrated** - All 14 assets properly used
4. **Performance** - Smooth 60fps
5. **Mobile Ready** - Works on phones

---

## Important Notes

- You have full access to the repo - push directly to `dev` branch
- Create PRs to `main` when ready
- Run `npm run lint` and `npm run build` before any commit
- Tag @FahadIbrahim93 for review
- Document your changes in PRs

## Tech Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS
- Web Audio API

## Brand
- **Game Name:** Pinik Pipra
- **Tagline:** "Get high with the ants"
- **Vibe:** Psychedelic, fun, addictive

---

## Ready to Start?
Clone the repo, analyze it, and begin implementation. Push your work to the `dev` branch.

**Repository:** https://github.com/FahadIbrahim93/Insectiles_HT_v1
