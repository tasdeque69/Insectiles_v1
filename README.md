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
| AUDIT_REPORT.md | Codebase audit (4.2/10) |

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
