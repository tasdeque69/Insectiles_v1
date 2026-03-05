# Pinik Pipra (Insectiles) 🎮

**A psychedelic insect tile-matching falling game**  
*Owner: Fahad Ibrahim (HopeTheory)*

---

## 🎯 Quick Start

```bash
# Clone
git clone https://github.com/FahadIbrahim93/Insectiles_HT_v1.git
cd Insectiles_HT_v1

# Install & Run
npm install
npm run dev
```

**Game runs on:** http://localhost:3000

---

## 🎮 Gameplay

- Tap the lowest insect before it reaches the bottom
- Don't tap empty lanes!
- Score points to trigger **FEVER MODE**
- Beat the high score!

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| TypeScript | Type Safety |
| Tailwind CSS 4 | Styling |
| Web Audio API | Audio Engine |

---

## 📁 Project Structure

```
src/
├── components/
│   └── Game.tsx        # Main game component (776 lines)
├── utils/
│   ├── audio.ts        # Psytrance audio generator
│   └── assetLoader.ts  # Sprite/image loader
├── App.tsx
├── main.tsx
└── index.css
public/                  # Game assets (14 files)
├── *.jpeg              # Sprites
└── *.mp4               # Animations
```

---

## 🤖 For AI Agents

See [AGENTS.md](./AGENTS.md) for:
- Branch strategy
- Commit format
- Code standards
- Task workflow

### Branch Flow
```
main ← Production (live)
  ↑
dev ← Integration (PRs go here)
  ↑
feat/* or fix/* ← Your branches
```

---


## 🚀 Deployment (Vercel)

This repo now includes `vercel.json` for Vite + SPA rewrite support.

```bash
npm run build
```

Then deploy from Vercel (Import Git Repository) or with Vercel CLI:

```bash
npx vercel --prod
```

> Note: real-device mobile testing is still required before launch.

---

## ✅ CI Quality Gate

GitHub Actions workflow added at `.github/workflows/ci.yml` to enforce:
- `npm run lint`
- `npm run test`
- `npm run build`

on push/PR for `main` and `dev`.

---

## 📊 Current Status

| Metric | Status |
|--------|--------|
| Build | ✅ Passing |
| Lint | ✅ Passing |
| Assets | ✅ 14 Integrated |
| Test Coverage | ⚠️ Needs Work |

---

## 📜 Documentation

| File | Description |
|------|-------------|
| AGENTS.md | AI agent workflow |
| TASKS.md | Task board |
| JULES_PROMPT.md | Jules development instructions |
| AUDIT_REPORT.md | Historical codebase audit (4.2/10) |
| CTO_AUDIT_REPORT_2026-03-05.md | CTO-level forensic audit and roadmap |
| CTO_AUDIT_REPORT_2026-03-07.md | CTO progress re-audit (8.1/10) |
| CONTRIBUTING.md | Contribution workflow and quality gate |
| SECURITY.md | Security policy and reporting |
| MOBILE_TEST_REPORT.md | Mobile emulation verification evidence |
| RELEASE_READINESS.md | Release readiness and external blockers |
| RELEASE_SIGNOFF_CHECKLIST.md | Final release approval checklist |

---

## 🔗 Important Links

- **GitHub:** https://github.com/FahadIbrahim93/Insectiles_HT_v1
- **Linear:** https://linear.app/hope-theory
- **Game Demo:** (Coming Soon)

---

## 📄 License

MIT

---

*Built with ❤️ by HopeTheory*
