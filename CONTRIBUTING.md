# Contributing Guide

## Branching
- Production: `main`
- Integration: `dev`
- Feature/fix branches: `feat/*`, `fix/*`

## Local quality gate
Before opening a PR, run:

```bash
npm run lint
npm run test
npm run build
```

## Pull requests
- Keep PRs focused and small.
- Include risk notes and verification evidence.
- Attach screenshots for visual changes.

## Commit style
Use clear, imperative commit messages with scope context.
