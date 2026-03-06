# Device Verification Blocker Report (AAA-012)

Date: 2026-03-06

## Goal
Complete `AAA-012` (device testing & 60fps verification).

## What was attempted
1. Browser-tool screenshot/playwright launch in container runtime.
2. `npx playwright install chromium` to bootstrap local browser binaries.
3. Local E2E preflight (`npm run e2e:preflight`).
4. Added synthetic performance smoke benchmark (`npm run perf:smoke`) to validate core loop throughput while true device tests are blocked.
5. Added in-app telemetry HUD (`?debugPerf=1` or `localStorage.pinik_debug_perf=1`) to capture live FPS, frame time, and dropped-frame counts during manual real-device passes.
6. Wired telemetry sampling directly to the game engine frame loop (no separate monitor loop) for lower overhead and more representative measurements.
7. Hardened telemetry lifecycle handling so sampling only occurs during active play and never updates UI after unmount.
8. Added resilient `safeStorage` fallback so perf debug flags and persisted state keep working in storage-restricted environments.
9. Standardized debug-flag parsing (`1/true/yes/on`) with shared utility and added fallback-precedence regression tests.

## Observed blockers
- Playwright browser downloads fail with `403 Forbidden` from CDN in this environment.
- Browser container Chromium crashes with `SIGSEGV` before page interaction.

## Evidence summary
- `npm run e2e:preflight` exits non-zero and reports missing browser binary.
- `npx playwright install chromium` fails with repeated `403 Forbidden` responses.
- Browser-tool launch fails with Chromium `SIGSEGV`.

## Current status
- `AAA-012` remains **BLOCKED** due environment-level constraints, not repository code issues.

## Next actions to close AAA-012
1. Run `npm run e2e:install` in an environment with CDN/browser access.
2. Execute `npm run test:e2e:smoke` and full `npm run test:e2e`.
3. Run on at least one low-end Android + one iPhone hardware target and capture FPS traces.
4. Attach artifacts and update TASK_POOL to mark DONE.

## Added readiness support

- Open the game with `?debugPerf=1` to display a lightweight HUD at the top-right.
- The HUD reports smoothed FPS, average frame time, and dropped-frame count so QA can capture screenshot/video evidence from real Android/iOS sessions.
