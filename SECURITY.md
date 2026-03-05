# Security Policy

## Reporting
If you discover a security issue, report it privately to maintainers instead of opening a public issue.

## Current controls
- Type-check gate (`npm run lint`)
- Test gate (`npm run test`)
- Build gate (`npm run build`)
- CI workflow enforces these checks on push/PR.

## Hard requirements
- No hardcoded credentials
- No secrets committed to repository
- Keep dependency surface minimal and intentional
