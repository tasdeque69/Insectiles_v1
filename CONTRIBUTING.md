# Contributing to Insectiles

Thank you for your interest in contributing to Insectiles!

We welcome contributions from the community. Please read these guidelines carefully.

---

## 1. Code of Conduct

### 1.1 Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone.

### 1.2 Standards

| Behavior | Encouraged | Discouraged |
|----------|------------|-------------|
| Respect | Be kind and patient | Personal attacks |
| Inclusion | Welcome newcomers | Gatekeeping |
| Collaboration | Help others | Hoarding information |
| Excellence | Strive for quality | Accepting mediocrity |

### 1.3 Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

---

## 2. How to Contribute

### 2.1 Types of Contributions

| Type | Description |
|------|-------------|
| 🐛 Bug Reports | Report issues you find |
| 💡 Features | Suggest new features |
| 🎨 Design | UI/UX improvements |
| 📖 Documentation | Improve docs |
| 🔧 Code | Submit pull requests |
| 🌍 Translations | Localize the game |

### 2.2 Getting Started

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

---

## 3. Development Setup

### 3.1 Prerequisites

- Node.js 18+
- npm 9+

### 3.2 Installation

```bash
git clone https://github.com/yourusername/insectiles.git
cd insectiles
npm install
```

### 3.3 Development Workflow

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

---

## 4. Pull Request Guidelines

### 4.1 Before Submitting

- [ ] Code follows existing style
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Documentation updated
- [ ] No console.log statements

### 4.2 PR Title Format

```
<type>(<scope>): <description>
```

Examples:
```
feat(game): Add fever mode
fix(engine): Fix score calculation bug
docs(readme): Update installation instructions
```

### 4.3 Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Formatting |
| refactor | Code restructuring |
| test | Adding tests |
| chore | Maintenance |

### 4.4 PR Description

Include:
1. **Summary** of changes
2. **Related issues** (closes #123)
3. **Screenshots** (for UI changes)
4. **Testing** steps

---

## 5. Coding Standards

### 5.1 TypeScript

- Use strict mode
- Avoid `any` type
- Export interfaces and types
- Use meaningful names

### 5.2 React

- Use functional components with hooks
- Follow React 19 patterns
- Memoize expensive operations

### 5.3 Testing

- Write tests for new features
- Minimum 80% coverage for critical paths
- Use descriptive test names

### 5.4 Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org):

```
feat: add new insect type
fix: resolve fever mode not triggering
docs: update API documentation
```

---

## 6. Issue Guidelines

### 6.1 Bug Reports

Use the bug template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### 6.2 Feature Requests

Use the feature template and include:
- Problem/Need
- Proposed solution
- Alternatives considered
- Mockups (if applicable)

---

## 7. Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Social media (with permission)

---

## 8. Questions?

- **Discord**: discord.gg/insectiles
- **Email**: dev@insectiles.game
- **GitHub Discussions**: For questions

---

*By contributing, you agree to these guidelines.*
