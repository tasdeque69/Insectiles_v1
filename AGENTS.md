# AGENTS.md - Multi-Agent Autonomous System

## Project: Pinik Pipra

This project uses an **Autonomous Multi-Agent Development System** with CODEX as Head Admin.

---

## System Architecture

```
                    ┌─────────────┐
                    │    CODEX    │
                    │Head Admin   │
                    │Coordinator  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │  Cline │  │  Jules │  │  Codex  │
         │ Agent  │  │ Agent  │  │ Agent  │
         └────────┘  └────────┘  └────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    TASK POOL
              (Self-pick autonomous)
```

---

## CODEX - Head Admin & Coordinator

**Status**: ACTIVE - Head Admin

### Responsibilities
1. **Task Management**: Creates, prioritizes, and manages the task pool
2. **Decision Authority**: Final say on architecture, breaking changes, conflicts
3. **Quality Gate**: Reviews critical changes before merge
4. **Conflict Resolution**: Resolves disputes between agents
5. **Direction**: Sets technical direction and priorities

### What CODEX Does NOT Do
- CODEX does NOT assign specific tasks to specific agents
- CODEX does NOT micromanage daily work
- CODEX trusts agents to self-pick tasks from the pool

### What CODEX DOES Do
- Creates clear task descriptions in TASK_POOL.md
- Sets priority levels (P0-P3)
- Defines deadlines when needed
- Reviews and approves completed work
- Intervenes only when:
  - Agents conflict
  - Breaking changes proposed
  - Architecture decisions needed
  - Quality issues arise

---

## Agent Autonomy Model

### How It Works
1. CODEX creates tasks in TASK_POOL.md with priority
2. Agents self-pick tasks based on their specialization
3. Agent executes task independently
4. Agent marks task complete in TASK_POOL.md
5. CODEX reviews if critical

### Agent Rights
- ✅ Pick any task matching your specialization
- ✅ Make implementation decisions within scope
- ✅ Request clarification from CODEX
- ✅ Propose new tasks to CODEX
- ✅ Skip tasks if blocked (mark as blocked)

### Agent Responsibilities
- ✅ Read task requirements fully before starting
- ✅ Follow code standards (see below)
- ✅ Test locally before marking complete
- ✅ Update TASK_POOL.md with progress
- ✅ Report blockers immediately

---

## Agent Specializations

| Agent | Specialization | Can Pick |
|-------|---------------|----------|
| Cline | Frontend/UI | UI, styling, animations, components |
| Jules | Backend/Game | Game logic, canvas, audio, performance |
| Codex | General | Any task, backup for both |

---

## Decision Authority

| Change Type | Action Required |
|-------------|-----------------|
| UI styling | Agent proceeds autonomously |
| Component creation | Agent proceeds autonomously |
| Bug fix (<20 lines) | Agent proceeds autonomously |
| Game logic | Agent proceeds autonomously |
| New feature | CODEX creates task → Agent picks |
| Refactoring (>50 lines) | CODEX creates task → Agent picks |
| Architecture change | CODEX approval required |
| Breaking change | CODEX approval required |
| Security change | CODEX approval required |

---

## Code Standards (All Agents Must Follow)

### Commands
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run lint         # TypeScript check
npm run clean        # Remove dist
```

### Before Committing
1. Run `npm run lint` - must pass
2. Run `npm run build` - must succeed
3. Test your changes locally

### Git Workflow
```
Branch naming:
- cline/feature-name
- jules/feature-name
- coodex/feature-name

Commit: [Agent] Description
```

---

## Task Pool System

### Reading Tasks
All agents must check TASK_POOL.md:
- At start of session
- After completing a task
- Every 30 minutes during active work

### Picking Tasks
1. Find highest priority unclaimed task matching your specialization
2. Claim by adding your name to the task
3. Execute independently
4. Mark complete when done

### Task States
- `OPEN` - Available to pick
- `IN_PROGRESS` - Claimed, actively working
- `BLOCKED` - Needs help, escalate to CODEX
- `REVIEW` - Awaiting CODEX review (if required)
- `DONE` - Completed and verified

---

## Communication Protocol

### Daily (Optional for Autonomous Agents)
- Agents work independently - no daily standups required
- CODEX may call sync if needed

### When Blocked (>15 minutes)
1. Document what you tried
2. Mark task as BLOCKED in TASK_POOL.md
3. Continue to next task OR wait for CODEX

### Conflict Between Agents
1. Each agent states position once
2. Both comply with CODEX decision
3. CODEX resolves within 1 hour

### Emergency
- Security issues: Fix immediately, report to CODEX
- Production down: All agents focus on fix

---

## Important Files

| File | Purpose |
|------|---------|
| AGENTS.md | This file - system overview |
| TASK_POOL.md | Current task list |
| SCRUM.md | Decision history |
| .agent-rules/CODEX.md | CODEX full rules |
| .agent-rules/AGENT_GENERIC.md | Shared agent rules |

---

## Quick Start

1. **Read AGENTS.md** (this file)
2. **Check TASK_POOL.md** for available tasks
3. **Pick a task** matching your specialization
4. **Execute** autonomously
5. **Mark complete** when done

---

**Autonomous agents, pick your tasks and execute!**
**CODEX coordinates, you deliver!**
