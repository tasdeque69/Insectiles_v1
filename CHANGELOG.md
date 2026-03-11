# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-03-11

### Added
- Analytics integration with event tracking
- Session-based privacy-friendly analytics
- Menu system with How to Play, Settings, Credits
- Sound toggle and volume slider
- Express.js backend API
- PostgreSQL database infrastructure
- JWT authentication with bcrypt password hashing
- Rate limiting and Zod input validation
- GitHub Actions CI/CD pipeline
- Playwright E2E tests

### Technical
- GameEngine extracted from monolithic component
- ObjectPool for performance optimization
- Zustand store with persistence
- ErrorBoundary for error handling
- Context caching and frame skipping for performance

### Fixed
- Game lag issues
- Security vulnerabilities (X-User-ID trust, fake JWT, unhashed passwords)

---

## [1.0.0] - 2026-03-11

### Added
- Initial release of Insectiles
- Psychedelic tile-matching gameplay
- Synthesized psytrance audio engine
- Fever mode with double speed
- 5 unique insect types
- 4 psychedelic effect types (mandala, buddha, kaleidoscope, profile)
- Canvas-based rendering with audio-reactive visuals
- Local high score tracking
- Mobile touch support

### Technical
- React 19 with TypeScript
- Vite build system
- Zustand state management
- Vitest testing framework
- GameEngine class architecture
- Object pooling system
- API client infrastructure

---

## [Unreleased]

### Planned Features

#### Visual Enhancements (Phase 1)
- [ ] Three.js/WebGL migration
- [ ] Bloom post-processing effects
- [ ] Chromatic aberration shaders
- [ ] GPU particle system
- [ ] Custom insect 3D models
- [ ] Dynamic procedural backgrounds

#### Audio-Visual Integration (Phase 2)
- [ ] Beat detection system
- [ ] Audio-reactive visuals
- [ ] Spatial audio
- [ ] Dynamic music sections

#### Gameplay & Progression (Phase 3)
- [ ] User accounts
- [ ] Cloud saves
- [ ] Global leaderboards
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Season events

#### Monetization (Phase 4)
- [ ] Premium currency
- [ ] Cosmetic skins
- [ ] Battle pass
- [ ] Ad integration

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2026-03-11 | Current |

---

*For older versions, see [release notes](https://github.com/insectiles/releases)*
