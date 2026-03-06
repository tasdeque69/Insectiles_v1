# Branch Analysis - 2026-03-06

## Scope & Method
This analysis follows the CODEX mission request to enumerate and compare all significant branches before merges.

### Commands executed
```bash
git branch -a
gh repo branches FahadIbrahim93/Insectiles_HT_v1
git for-each-ref --format='%(refname:short) %(committerdate:iso8601) %(objectname:short)' refs/heads refs/remotes
git ls-remote --heads https://github.com/FahadIbrahim93/Insectiles_HT_v1.git
```

### Environment limitations encountered
- `gh` CLI is not installed in this container.
- Repository remote is not configured in local checkout.
- Direct GitHub HTTPS access is blocked in this environment (`CONNECT tunnel failed, response 403`).

As a result, only local refs are directly observable here.

## Branches Analyzed
1. `work` - **available locally**, active head commit `00d167a`.
2. `main` - **not present as local ref** in this checkout.
3. `dev` - **not present as local ref** in this checkout.
4. `codex/*`, `jules/*`, `feat/*`, `fix/*` - **not present as local refs**; inferred from historical docs only.

## Code Quality Comparison (Best Effort)

| Branch | CTO Score | Tests | Features | Last Commit | Notes |
|--------|-----------|-------|----------|-------------|-------|
| `work` | 8.1 (latest local CTO audit) | 59 passing (local run) | Core + P2/P3 + AAA tasks tracked in local docs | 2026-03-06 | Only branch directly verifiable in this environment |
| `main` | N/A (not fetched) | N/A | N/A | N/A | Missing ref in local checkout |
| `dev` | N/A (not fetched) | N/A | N/A | N/A | Missing ref in local checkout |
| `fix/*` (doc-inferred) | N/A in local refs | N/A in local refs | Security PRs listed in `PR_INDEX.md` | N/A | Requires GitHub access to validate |
| `codex/*` (doc-inferred) | N/A in local refs | N/A in local refs | Consolidation work referenced in `REPOSITORY_COMPARISON.md` | N/A | Requires GitHub access to validate |

## Best Code Identified
**Champion Branch (verifiable):** `work`

**Reason:**
1. Only branch accessible and testable in this environment.
2. Passes local quality gates (`lint`, `test`, `build`).
3. Contains the most recent locally available governance, test, and polish documentation.

## Merge Strategy Recommended
Because GitHub branch and PR access is blocked from this environment, execute merge operations from a network-enabled workstation with `gh` installed and authenticated, then re-run full quality gates.

Recommended operational order remains the requested order:
1. Security PRs (#3, #5)
2. AAA/hardening PRs (#13, #11)
3. Gameplay feature PR (#10)
4. UX PRs (#7, #2)
5. Performance PRs (#6, #4)

After remote merges complete, sync this repo and rerun:
```bash
npm run lint
npm run test
npm run build
npm run audit:prod
```
