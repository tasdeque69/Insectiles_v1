# Universal Workflow Pinboard - Pinik Pipra Edition

This document adapts the Universal Workflow Pinboard to the specific needs of the Pinik Pipra game project.

---

## 🔍 Research & Planning

### Plan & Research – Deep Problem Framing

**Goals:**
- Deliver a production-ready psychedelic insect tile-matching game
- Achieve 10/10 code quality (currently 8.1/10)
- Complete deployment to Vercel and real device testing
- Reach 50%+ test coverage (currently ~20%)

**Requirements:**
- Core gameplay: falling insects, tap-to-catch, scoring, fever mode
- Mobile-responsive with touch controls
- Audio integration with psytrance soundtrack
- High score persistence (localStorage)
- Error boundaries and crash resilience
- CI/CD with automated testing
- E2E coverage for critical flows

**Constraints:**
- Single developer (Fahad Ibrahim) for final launch
- Web browser only (no native app yet)
- Must support iOS Safari & Android Chrome
- 67KB gzipped bundle limit target

**Edge Cases:**
- Low-end Android devices (memory constraints)
- Audio policy restrictions (user gesture required)
- localStorage quota exceeded / disabled
- Network failures (asset loading)
- Canvas context loss

**Research Citations:**
- React 19 concurrent features review
- Web Audio API best practices for games
- Vite production optimization guide
- Playwright E2E testing patterns

**Architecture Decision Records:**
- See ADR-001: GameEngine extraction (completed 2026-03-07)
- ADR-002: E2E test strategy (Playwright selected)

**Unknowns:**
- Real device performance metrics
- iOS audio autoplay policy impact
- Long-term localStorage reliability

**Tech-Debt Mines:**
- Game.tsx still 163 lines (should be <100 ideally)
- No proper error logging service (Sentry TODO)
- No analytics/monitoring
- No A/B testing infrastructure

**Deliverable:** Completed CTO_AUDIT_REPORT_2026-03-07.md

### Clarifying Questions for Product Owner

1. Should we implement analytics (e.g., Google Analytics, Mixpanel)?
2. Monetization strategy: ads, paid upgrade, or both?
3. Required iOS/Android OS version support?
4. Expected launch date?
5. Post-launch feature roadmap priority?

---

## 🛠️ Implementation

### Implement Plan – Full Production Execution

**Approved Plan:** Execute all remaining P2 and P3 tasks from TASK_POOL.md

**Task Breakdown:**
- 6 P2 tasks (game enhancements)
- 4 P3 tasks (polish items)
- 3 operational tasks (deployment, testing, documentation)

**Execution Mode:**
- CODEX coordinates as Head Admin
- Tasks picked autonomously by agents (Cline/F Jules/Codex)
- Atomic commits with conventional format
- No stubs or placeholders

**Quality Gates:**
- ✅ `npm run lint` passes (TypeScript strict)
- ✅ `npm run test` passes (100% unit test pass)
- ✅ `npm run build` succeeds
- ⏳ `npm run test:e2e` passes in CI (pending final validation)

**Deliverable:** Shippable artifact (production build + deployment)

### Autonomous Completion Sweep

**Activated:** 2026-03-07

**Items in sequence:**
1. Fix failing unit test (✅ DONE)
2. Integrate Playwright E2E into CI (✅ DONE)
3. Lint/build verification (✅ DONE)
4. Vercel production deployment (⏳ BLOCKED: login required)
5. Expand test coverage to 50% (⏳ IN PROGRESS)
6. Complete all P2 tasks
7. Complete all P3 tasks
8. Code quality refactor
9. Scrutiny follow-up
10. Deployment hardening checklist
11. Zero issues closure loop
12. Final signoff

**Current blocker:** Vercel CLI requires authentication (network-restricted environment)

---

## ✨ Quality & Refactor

### Code Quality & Idiomatic Refactor

**Target Metrics:**
- Average line count per file: <200
- Nesting depth: ≤3 levels
- Function complexity: <15
- Dead code: 0%

**Planned Actions:**
- Split Game.tsx further (currently 163 lines)
- Consolidate duplicate state logic
- Standardize naming (camelCase for variables, PascalCase for components)
- Add JSDoc to complex functions (< 60% coverage)

**Output:** Before/after diffs with rationale

### Aggressive Deslop & Cruft Removal

**Delete List:**
- Unused imports (any `import` not used)
- Dead code paths (unreachable branches)
- Verbose comments that state the obvious
- Impossible defensive checks (e.g., `if (undefined)` when type guarantees defined)
- Over-generic utility functions used only once
- Redundant type assertions

**Rationale Document:** CLEANUP.md

---

## 🧪 Verification & Testing

### Verification & Coverage Expansion

**Current Coverage:**
- Unit tests: 20 tests, ~20% coverage estimate
- Integration tests: 0
- E2E tests: 9 (created, not yet in CI)

**Target:** 50%+ coverage

**Planned Tests (8-12 additional edge cases):**
1. Invalid input handling (negative scores, NaN)
2. Concurrency: rapid fire taps
3. Memory leak: session long-running (1000+ insects)
4. Canvas context loss recovery
5. localStorage write failures
6. Audio API unavailability
7. Asset loading failures (404s)
8. Fever mode edge: exactly at threshold
9. Game restart after fever active
10. High score overflow (big integers)
11. Multi-lane tap coordination
12. Responsive layout extremes

**Integration > Unit:** Focus on GameEngine integration tests

**Deliverable:** Coverage report + execution evidence

### Scrutiny Follow-Up

**Anti-Hallucination Verification Pass:**
- Re-justify all CTO audit scores with concrete evidence
- Verify examples in code match documentation
- Validate fixes with diffs + actual execution proofs
- Update summary tables

**Deliverable:** SCRUTINY_FOLLOWUP.md

### Hallucination Audit & Hard Fix Loop

**Slop Pattern Detection:**
- Fake returns (functions returning placeholder values)
- Silent errors (try/catch with empty catch)
- Mocked tests that don't actually test real behavior
- Unexecuted branches (dead code)

**Fix Process:**
1. Run code coverage to identify untested branches
2. Review all `any` types and casts
3. Audit all `console.warn`/`error` for silent failures
4. Ensure all promises have error handlers

**Loop Until:** All slop patterns eliminated + coverage improves

---

## 🚀 Deployment & Hardening

### Production Hardening & Deployment Checklist

**Quality Gates:**
- [x] `npm run lint` passed
- [x] `npm run test` passed (20 unit tests, 100% pass rate)
- [ ] `npm run audit:prod` passed (deferred - blocked in CI)
- [ ] `npm run test:e2e` passed in CI (pending deployment)
- [x] `npm run build` passed (67KB gzipped)

**Security:**
- [x] No hardcoded secrets
- [x] CSP headers configured in vercel.json
- [ ] Dependencies audited (npm audit)
- [ ] Security scan via GitHub Advanced Security (if available)

**Observability:**
- [x] Structured logging (logger.ts)
- [ ] Sentry error monitoring (TODO)
- [ ] Performance monitoring (TODO)
- [] Analytics integration (TODO)

**Rollback/Canary:**
- [ ] Rollback plan documented (Vercel rollback command)
- [ ] Canary deployment strategy defined (5% → 100%)

**Load/Performance:**
- [ ] Load test with 100 concurrent simulated users (TODO)
- [ ] Bundle size analysis (target: <100KB gzipped)
- [ ] Code splitting verification

**Deliverable:** DEPLOYMENT_HARDENING.md with evidence for each item

---

## 📊 Retrospective & Closure

### Honest Post-Mortem

**Verification Checklist:**
- [ ] Real outputs match original problem statement
- [ ] All core features functional (gameplay, audio, scoring)
- [ ] Mobile-responsive verified on real devices
- [ ] Performance acceptable on low-end devices

**Deferred/Half-Done Items:**
- [ ] Vercel production deployment (blocked: auth)
- [ ] Real device testing (external)
- [ ] Analytics integration
- [ ] A/B testing capability
- [ ] PWA support
- [ ] Accessibility audit

**Assumptions Made:**
- Browser emulation is sufficient for pre-launch
- 67KB bundle acceptable for initial launch
- localStorage sufficient for high score persistence

**Unmitigated Risks:**
- No crash reporting in production
- No performance monitoring
- No feature flags for rapid rollback
- Real device compatibility unknown

**Deliverable:** POST_MORTEM.md with TODO → immediate fixes

### Zero Issues Closure Loop

**Process:**
1. Enumerate all remaining issues from all reports
2. Sort by impact (high/medium/low)
3. Fix each issue in priority order
4. Verify fix with test/execution
5. Update documentation

**Final Output:** "All issues closed. Ready."

---

## 📋 Project Management

### AGENTS+TASKBOARD Integration

**Guideline Document for Agents:**
- See AGENTS.md (system overview)
- See this document (project-specific workflow)
- See TASK_POOL.md for task selection

**Logbook Protocol:**
```
Task ID: <from TASK_POOL.md>
Summary: <one-line description>
Date/Time: <YYYY-MM-DD HH:MM>
Agent: <Cline/Jules/Codex>
Issues: <any blockers>
Acceptance Criteria: <how to verify>
```

**Single Source of Truth:** TASK_POOL.md

**Transparent Progress Tracking:** Agents update TASK_POOL.md in real-time

---

## Current Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Research & Planning | ✅ Complete | 100% |
| Implementation | ⏳ In Progress | 60% |
| Quality & Refactor | ⏳ Pending | 0% |
| Testing | ⏳ Partial | 25% |
| Deployment | ⏳ Blocked | 0% |
| Retrospective | ⏳ Pending | 0% |

**Overall Progress:** 55%

**Next Immediate Action:** Expand test coverage to reach 50%

---

*Last Updated: 2026-03-07*
*Maintainer: CODEX (Head Admin)*
