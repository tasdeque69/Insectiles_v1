# PR Index & Code Analysis - Insectiles_HT_v1

**Last Updated:** 2026-03-06  
**Analyst:** CODEX

---

## 📋 Executive Summary (Historical + Current)

| Metric | Historical Snapshot (2026-03-05) | Current Verifiable Snapshot (2026-03-06) |
|--------|-----------------------------------|-------------------------------------------|
| Open PRs | 4 listed in legacy analysis (#1-#4) | Not directly queryable (no configured remote in container) |
| Merged PRs in local history | N/A | `#8`, `#12`, `#14`, `#16`, `#17`, `#18` visible in merge log |
| Local branches | N/A | `work`, `main` |
| Recommended mainline | Ordered merge plan (#3 → #1 → #2 → #4) | Keep `main` aligned with verified `work` tip |

---

## 🔍 Legacy PR Detailed Index (Preserved Reference)

### PR #1: Complete Rebuild (FOUNDATIONAL)
| Property | Value |
|----------|-------|
| **Branch** | `feat/rebuild-pinik-pipra-745967440399407299` |
| **Commits** | 2 (`8e2e04d`, `20c186e`) |
| **Author** | Jules (google-labs-jules[bot]) |
| **Status (historical)** | Open - Codex Reviewed |
| **Priority** | 🔴 HIGHEST |

### PR #2: Palette - UX Improvements
| Property | Value |
|----------|-------|
| **Branch** | `palette-ux-improvements-18370837234786191409` |
| **Commits** | 1 (`2edddc6`) |
| **Author** | Jules |
| **Status (historical)** | Open |
| **Priority** | 🟡 MEDIUM |

### PR #3: Sentinel - Security Fix
| Property | Value |
|----------|-------|
| **Branch** | `fix/security-secret-exposure-2970912838501218187` |
| **Commits** | 1 (`dab9607`) |
| **Author** | Jules |
| **Status (historical)** | Open |
| **Priority** | 🔴 CRITICAL |

### PR #4: Bolt - Performance
| Property | Value |
|----------|-------|
| **Branch** | `bolt-render-loop-opt-810275192222613807` |
| **Commits** | 1 (`e540e17`) |
| **Author** | Jules |
| **Status (historical)** | Open |
| **Priority** | 🟢 LOW |

---

## ✅ Current Audit Results (Execution-Backed)

### Commands executed in this environment
```bash
git branch -a
git remote -v
git log --oneline --decorate -n 30
npm run audit:branches
npm run audit:branches:check
npm run audit:branches:validate
```

### Findings
1. Local refs are consolidated at the latest merge tip and include both `work` and `main`.
2. Local history confirms merged PR lineage through `Merge pull request #18 ...`.
3. No remote is configured in this checkout, so live open-PR enumeration cannot be completed from here.
4. A reproducible branch/PR audit script now exists (`scripts/branch-pr-audit.mjs`) and emits `BRANCH_AUDIT_LATEST.md`.

### Best-option decisions (autonomous)
1. Keep `main` as the production pointer, fast-forwarded from `work` only after quality gates pass.
2. Adopt pre-baked Playwright CI image strategy to remove browser-install fragility.
3. Keep release governance split into explicit **Code Complete** and **Ops Complete** gates.

---

## 📎 Latest Machine-Generated Audit Artifact

- See `BRANCH_AUDIT_LATEST.md` for command-derived branch/PR evidence and decision log.

---

## Outcome

✅ No additional “good stuff” is missing from the locally verifiable branch history.  
⚠️ Remote/open-PR visibility remains environment-dependent and must be re-checked from a GitHub-authenticated environment.
