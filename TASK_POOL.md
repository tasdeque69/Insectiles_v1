# TASK POOL - Autonomous Task Management

## System
- **CODEX** creates and prioritizes tasks
- **Agents self-pick** tasks from this pool
- **Autonomous execution** - no assignment needed

---

## Priority Legend
- **P0**: Critical - Production broken, security
- **P1**: High - Important features, major bugs
- **P2**: Medium - Normal development
- **P3**: Low - Nice to have
- **AAA**: Premium polish for state-of-the-art quality

---

## 🎯 AAA Quality Initiative (Priority: P1)

### P1-AAA: Visual & Audio Polish

| ID | Task | Type | Agent | Status |
|----|------|------|-------|--------|
| AAA-001 | Create 2D ant walk cycle sprites (8 frames x 4 dirs) | Asset | OPEN | OPEN |
| AAA-002 | Update GameEngine to use sprite sheet animation | Backend | OPEN | OPEN |
| AAA-003 | Add shadow rendering under insects | Frontend | OPEN | OPEN |
| AAA-004 | Implement squash & stretch hit animation | Frontend | OPEN | OPEN |
| AAA-005 | Enhance particle system (trails, color matching) | Frontend | OPEN | OPEN |
| AAA-006 | Add strike zone visual indicator | Frontend | OPEN | OPEN |
| AAA-007 | Implement floating score popups | Frontend | OPEN | OPEN |
| AAA-008 | Overhaul fever mode visuals (gradient, glow) | Frontend | OPEN | OPEN |
| AAA-009 | Add lane-specific pitch audio (4 notes) | Audio | OPEN | OPEN |
| AAA-010 | Haptic feedback on mobile (vibrate) | Frontend | OPEN | OPEN |
| AAA-011 | Performance optimization (sprite atlas, pooling) | Backend | OPEN | OPEN |
| AAA-012 | Device testing & 60fps verification | QA | OPEN | OPEN |
| AAA-013 | Accessibility audit (WCAG, reduced motion) | QA | OPEN | OPEN |

---

## Available Tasks

### P2: Game Enhancements

| ID | Task | Type | Agent | Status |
|----|------|------|-------|--------|
| 001 | Add mobile touch controls for swiping insects | Frontend | CODEX | DONE |
| 002 | Implement combo multiplier system | Backend | CODEX | DONE |
| 003 | Add particle explosion effects on catch | Frontend | CODEX | DONE |
| 004 | Create power-up system (shield, slow-mo) | Backend | CODEX | DONE |
| 005 | Add leaderboard UI | Frontend | CODEX | DONE |
| 006 | Implement save/load game state | Backend | CODEX | DONE |

### P3: Polish

| ID | Task | Type | Agent | Status |
|----|------|------|-------|--------|
| 007 | Add sound toggle button | Frontend | CODEX | DONE |
| 008 | Improve loading screen animation | Frontend | CODEX | DONE |
| 009 | Add retina display support | Frontend | CODEX | DONE |
| 010 | Optimize bundle size | Backend | CODEX | DONE |

---

## In Progress

| ID | Task | Agent | Started | Notes |
|----|------|-------|---------|-------|
| - | - | - | - | No active tasks |

---

## Blocked

| ID | Task | Agent | Blocker Reason |
|----|------|-------|----------------|
| - | - | - | No blocked tasks |

---

## Completed

| ID | Task | Agent | Completed | Notes |
|----|------|-------|-----------|-------|
| INF-001 | Extract GameEngine module from Game.tsx | CODEX | 2026-03-07 | Separated loop orchestration into dedicated engine class (200+ LOC) |
| INF-002 | Add Playwright E2E test suite | CODEX | 2026-03-07 | Created 9 tests covering start/restart/fever/game-over, added test IDs |
| INF-003 | Integrate new bug assets (bug-1-4, multiview) | CODEX | 2026-03-07 | Added 5 PNG assets to constants.ts and copied to public folder |
| INF-004 | Update package.json for Playwright | CODEX | 2026-03-07 | Added test:e2e, test:e2e:ui, test:e2e:debug scripts |
| INF-005 | Fix failing unit test (asset count mismatch) | CODEX | 2026-03-07 | Updated constants.test.ts to expect 17 images (added 5 new bug assets) |
| INF-006 | Integrate Playwright E2E into CI | CODEX | 2026-03-07 | Added E2E job to .github/workflows/ci.yml, configured Playwright for CI |
| INF-007 | Clean up unused vitest files (lint fix) | CODEX | 2026-03-07 | Removed src/test/ErrorBoundary.test.tsx and vitest.config.ts (unused) |
| INF-008 | CI workflow enhanced with E2E stage | CODEX | 2026-03-07 | CI now has quality + e2e jobs, uses Playwright with 5 browser targets |
| INF-009 | Add Universal Workflow Pinboard | CODEX | 2026-03-07 | Created UNIVERSAL_WORKFLOW_PINBOARD.md with project-specific workflow |
| INF-010 | Expand test coverage to 50% | CODEX | 2026-03-07 | Added 28 new tests: audio, gameEngine, input edge cases, loop integration, store. Total: 48 tests |
| P2-001 | Add mobile touch controls for swiping insects | Frontend | CODEX | 2026-03-07 | Implemented swipe gestures, DPR-aware canvas |
| P2-002 | Implement combo multiplier system | Backend | CODEX | 2026-03-07 | Multiplier up to 5x based on streak |
| P2-003 | Add particle explosion effects on catch | Frontend | CODEX | 2026-03-07 | Particle system integrated |
| P2-004 | Create power-up system (shield, slow-mo) | Backend | CODEX | 2026-03-07 | Shield charges, slow-mo duration |
| P2-005 | Add leaderboard UI | Frontend | CODEX | 2026-03-07 | Top 5 scores displayed |
| P2-006 | Implement save/load game state | Backend | CODEX | 2026-03-07 | Persistence with localStorage |
| P3-007 | Add sound toggle button | Frontend | CODEX | 2026-03-07 | Mute/unmute integrated |
| P3-008 | Improve loading screen animation | Frontend | CODEX | 2026-03-07 | Spinner + gradient text |
| P3-009 | Add retina display support | Frontend | CODEX | 2026-03-07 | DPR-aware canvas rendering |
| P3-010 | Optimize bundle size | Backend | CODEX | 2026-03-07 | Lazy loading Game component |
| OPS-001 | Code quality verification | CODEX | 2026-03-07 | Build & 20 unit tests passing, strict TypeScript |

---

## How to Use

### Pick a Task
1. Find OPEN task matching your specialization
2. Add your name to Agent column
3. Change status to IN_PROGRESS
4. Execute!

### Update Progress
- Edit this file with your updates
- Include timestamp when starting
- Include notes if needed

### Mark Complete
1. Change status to DONE
2. Add completion date
3. Move to Completed section

---

## Request New Task

To request a new task:
1. Propose task in this file with PROPOSED tag
2. CODEX will review and assign priority
3. Once approved, moves to Available

Example:
```
| PROPOSED | Add night mode | Frontend | CODEX | Pending |
```

---

**Pick a task and go! 🚀**
