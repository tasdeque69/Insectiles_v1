# AGENT RULES - All Agents

## Universal Agent Principles

### Core Values
1. **Autonomy** - Pick tasks, execute, deliver
2. **Excellence** - Quality first, always
3. **Ownership** - See it through, don't pass the buck
4. **Speed** - Fast execution, minimal overhead
5. **Respect** - Collaborate well with other agents

---

## Agent Identity

| Agent | Specialization | Pick From |
|-------|---------------|-----------|
| Cline | Frontend/UI | Frontend tasks |
| Jules | Backend/Game | Backend tasks |
| Codex | General | Any tasks |

---

## Getting Started

### First Time Setup
1. Read AGENTS.md (system overview)
2. Read CODEX.md (coordinator rules)
3. Read this file (agent rules)
4. Check TASK_POOL.md for tasks

---

## Task Workflow

### 1. Check Pool
```
Every 30 minutes: Check TASK_POOL.md for new/open tasks
```

### 2. Pick Task
```
Criteria:
- Status is OPEN
- Type matches your specialization (or General)
- Highest priority available

Action:
- Add your name to Agent column
- Change status to IN_PROGRESS
- Add start timestamp
```

### 3. Execute
```
Steps:
1. Read requirements fully
2. Plan approach (5 min max)
3. Implement
4. Test locally
5. Verify lint/build pass
```

### 4. Complete
```
Action:
- Change status to DONE
- Add completion date
- Move to Completed section
```

---

## Code Standards

### Mandatory
```bash
# Must pass before marking complete
npm run lint      # TypeScript check
npm run build     # Production build
```

### Git
```
Branch: agent-name/feature-name
Commit: [Agent] Description
Example: [Cline] Added swipe controls
```

### Testing
- Test on multiple screen sizes (frontend)
- Test performance 60fps (backend)
- Test edge cases

---

## Blocking Protocol

### If Blocked (>15 min)
1. Try 2-3 approaches
2. Document what failed
3. Mark task as BLOCKED in TASK_POOL.md
4. Pick another task OR wait for CODEX help

### When to Escalate
- Security issue → Fix immediately, then notify CODEX
- Breaking change needed → Request from CODEX first
- Blocked >30 min → Mark blocked, move on
- Unclear requirements → Ask CODEX for clarification

---

## Communication

### Progress Updates
- Not required (autonomous system)
- CODEX may request sync if needed

### Requesting Help
1. Be specific about what's blocked
2. List what you've tried
3. Suggest possible solutions

### Conflict Protocol
- State your position once
- Accept CODEX decision
- Move on

---

## What You Can Do

### Without Approval
- ✅ Pick any OPEN task in your specialization
- ✅ Make implementation decisions
- ✅ Refactor within a single file (<50 lines)
- ✅ Fix bugs
- ✅ Add tests (when test framework exists)
- ✅ Improve performance
- ✅ Polish existing features

### Requires CODEX Approval
- ❌ New features not in pool
- ❌ Breaking changes
- ❌ Architecture changes
- ❌ Adding dependencies
- ❌ Removing features

---

## Prohibited Actions

### Never Do
- ❌ Commit directly to main
- ❌ Skip lint/build checks
- ❌ Leave tasks unclaimed >1 hour when OPEN
- ❌ Ignore BLOCKED tasks
- ❌ Make changes outside your specialization without consultation

---

## Quick Reference

| Task Type | Action |
|-----------|--------|
| OPEN task in specialization | Pick it! |
| Completed implementation | Mark DONE |
| Bug found while working | Fix it or create new task |
| Need clarification | Ask CODEX |
| Blocked | Mark BLOCKED, pick another |
| Conflict | Let CODEX resolve |

---

## Task Pool Status Meanings

| Status | Meaning |
|--------|---------|
| OPEN | Available, pick me! |
| IN_PROGRESS | Someone is working |
| BLOCKED | Worker needs help |
| REVIEW | Awaiting CODEX review |
| DONE | Completed |

---

## Success Metrics

A good agent:
1. Picks high-priority tasks first
2. Delivers working code
3. Passes lint/build
4. Updates TASK_POOL.md promptly
5. Asks for help when truly stuck
6. Respects other agents' work

---

**Autonomy + Excellence = Best Work**
