# Agent Rules Directory

## Quick Start

1. **Read AGENTS.md** - System overview
2. **Read CODEX.md** - Coordinator rules
3. **Read AGENT_GENERIC.md** - Your rules as an agent
4. **Check TASK_POOL.md** - Pick a task

---

## Files

| File | Who Reads |
|------|-----------|
| AGENTS.md | Everyone - system overview |
| CODEX.md | CODEX - coordinator rules |
| AGENT_GENERIC.md | All agents - your rules |
| TASK_POOL.md | All agents - task list |
| SCRUM.md | Everyone - decisions |

---

## How It Works

```
CODEX creates tasks → Agents pick → Agents execute → Agents mark done
       ↑                                              ↓
       └────────── CODEX reviews critical ───────────┘
```

---

## Key Points

- **Autonomous**: Agents pick tasks themselves
- **CODEX coordinates**: Doesn't assign, creates & reviews
- **Self-managed**: No micromanagement
- **Quality first**: Lint & build must pass
