# Pinik Pipra - Jules Post-Audit

The game has been completely rebuilt to meet production standards for Fahad Ibrahim (HopeTheory).

## Tech Stack
- **React 19**: Latest React standards with functional components and hooks.
- **Vite**: Ultra-fast development and optimized production builds.
- **TypeScript**: Strict type safety across the entire codebase.
- **Tailwind CSS v4**: Modern utility-first styling.
- **Zustand**: Lightweight state management for score, game status, and fever mode.
- **Framer Motion**: High-performance UI animations and "psychedelic" transitions.
- **Web Audio API**: Custom AudioEngine providing generative acid techno and interactive sound effects.

## Core Features
- **60fps Canvas Engine**: Optimized rendering loop using `requestAnimationFrame`.
- **Asset Integration**: All 14 original assets preloaded and used (insects, psychedelic backgrounds, and idle animations).
- **Fever Mode**: Automatically triggers at 500 points, doubling score gains and activating intense psychedelic visuals using mascot animations.
- **Score System**: Progressive difficulty scaling and persistent High Score via `localStorage`.
- **Responsive Design**: Adapts to mobile and desktop with touch/click support.

## Workflow
- Main branch: `main`
- Integration branch: `dev`
- Verified with `npm run lint` and `npm run build`.

## Performance Note
Targeted 60fps reached. Assets are preloaded to ensure zero-jank during transitions into Fever Mode.
