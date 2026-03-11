# Psychedelic Insect Tiles - AAA Game Design Document

> **Version**: 1.0  
> **Date**: March 2026  
> **Status**: Design Document  
> **Priority**: Visual Excellence (PRIMARY)

---

## Executive Summary

This document outlines the architectural and design roadmap for transforming the current React/Canvas prototype into a commercially viable AAA title. The primary focus is **visual excellence** with rapid iteration for maximum surprise factor.

**Current State**: 752-line React/Canvas prototype with basic psytrance audio sync and psychedelic effects.

**Target State**: Enterprise-grade WebGL game with advanced shaders, particle systems, and cross-platform support.

---

# 1. Visual Excellence (PRIMARY FOCUS)

## 1.1 Advanced Shader Effects (GLSL/WebGL)

### Priority: CRITICAL

The current Canvas 2D implementation is limiting. Moving to WebGL is essential for AAA visuals.

### Recommended Stack
- **Three.js** or **PixiJS** (WebGL abstraction)
- **Custom GLSL Shaders** for:
  - Chromatic aberration (RGB split)
  - Wave distortion
  - Kaleidoscope effects
  - Bloom/glow
  - Vignette

### Quick Win Shader Effects (Week 1)

```glsl
// Chromatic Aberration Shader - HIGH IMPACT
// Fragment shader for post-processing
uniform sampler2D tDiffuse;
uniform float amount;
varying vec2 vUv;

void main() {
    vec2 offset = amount * vec2(1.0, 0.0);
    vec4 cr = texture2D(tDiffuse, vUv + offset);
    vec4 cg = texture2D(tDiffuse, vUv);
    vec4 cb = texture2D(tDiffuse, vUv - offset);
    gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
}
```

| Effect | Impact | Effort | Priority |
|--------|--------|--------|----------|
| Chromatic Aberration | ★★★★★ | Low | P0 |
| Bloom/Glow | ★★★★★ | Medium | P0 |
| Wave Distortion | ★★★★☆ | Low | P0 |
| Vignette | ★★★☆☆ | Low | P1 |
| Motion Blur | ★★★★☆ | Medium | P2 |

## 1.2 Particle System Architecture

### Current State
Basic psyEffects array with emoji rendering.

### Target Architecture
```typescript
// Particle System Design
interface Particle {
    id: number;
    position: Vector3;
    velocity: Vector3;
    acceleration: Vector3;
    life: number;
    maxLife: number;
    color: Color;
    size: number;
    rotation: number;
    angularVelocity: number;
    blendMode: 'additive' | 'normal';
    texture: Texture | null;
}

class ParticleSystem {
    private pool: Particle[] = [];
    private activeParticles: Set<number> = new Set();
    
    emit(config: EmitConfig): void;
    update(deltaTime: number): void;
    render(renderer: WebGLRenderer): void;
}
```

### Particle Types for Psychedelic Effects
1. **Burst Particles** - On successful tap (explosion of colored particles)
2. **Trail Particles** - Behind moving insects (rainbow trails)
3. **Ambient Particles** - Floating background (mushrooms, eyes, spirals)
4. **Beat Particles** - Sync with bass hits (screen shake + particle burst)
5. **Fever Particles** - Dense particle fog during fever mode

### Quick Win: GPU Particles
- Use point sprites for maximum performance
- Pre-allocate particle pool (1000+ particles)
- Use transform feedback for GPU-based updates

## 1.3 Post-Processing Pipeline

### Pipeline Architecture
```
Scene → Render Target → Effect Pass 1 → Effect Pass 2 → ... → Screen
```

### Recommended Effects Stack
1. **Bloom** - HDR glow for neon elements
2. **Chromatic Aberration** - RGB channel separation
3. **Distortion** - Wave/warp effects
4. **Color Grading** - Psychedelic color shifting
5. **Vignette** - Edge darkening
6. **Film Grain** - Retro aesthetic (optional)

### Implementation Priority
| Pass | Effect | Implementation |
|------|--------|----------------|
| 1 | Bloom | Three.js UnrealBloomPass or custom |
| 2 | Chromatic Aberration | Custom shader |
| 3 | Color Grading | HSL shift shader |
| 4 | Vignette | Simple radial gradient |

## 1.4 Dynamic Lighting

### Current State
Static HSL color cycling.

### Target: Dynamic Point Lights
- **Beat-reactive lights** that pulse with bass
- **Moving light sources** following insects
- **Global ambient** that shifts with music sections

```typescript
interface Light {
    position: Vector3;
    color: Color;
    intensity: number;
    decay: number;
    isBeatReactive: boolean;
}
```

### Quick Win
Add 3-5 point lights that react to frequency bands:
- Low frequency (bass) → Red/orange lights
- Mid frequency → Green/cyan lights  
- High frequency → Purple/blue lights

## 1.5 Visual Style Guide

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Primary | Electric Purple | #8B5CF6 |
| Secondary | Neon Cyan | #06B6D4 |
| Accent 1 | Hot Pink | #EC4899 |
| Accent 2 | Acid Green | #84CC16 |
| Background Dark | Deep Space | #0F0F1A |
| Background Light | Cosmic Gray | #1A1A2E |

### Typography
- **Primary Font**: "Orbitron" (futuristic, geometric)
- **Secondary Font**: "Exo 2" (readable, techy)
- **Score Display**: "Press Start 2P" (retro arcade feel)

### UI Design Principles
- Glassmorphism with blur effects
- Neon glow borders
- Animated transitions
- Touch-friendly (min 48px tap targets)

### Insect Visual Identity
Replace emojis with custom WebGL-rendered sprites:
- **Weed Ant** - Green gradient, leaf particles
- **Rainbow Ant** - Animated HSL shader
- **Neon Ant** - Pink/purple with strong bloom
- **Alien Bug** - Pulsing glow, otherworldly
- **Fire/Ice Ant** - Dual gradient with steam particles

## 1.6 Asset Pipeline Recommendations

### Texture Assets
- Use **compressed textures** (Basis/KTX2) for mobile
- Generate **mipmaps** automatically
- Sprite atlases for UI elements

### Recommended Tools
| Asset Type | Tool | Format |
|------------|------|--------|
| Sprites | Aseprite | PNG |
| UI | Figma → SVG | SVG |
| Effects | After Effects → Rive/Lottie | JSON |
| Audio | Ableton/FLM Studio | OGG + MP3 |

### Procedural Generation
- Use procedural patterns for backgrounds
- Shader-based insects (no texture loading)
- Real-time mandala generation

---

# 2. Game Engine Architecture

## 2.1 Entity-Component-System (ECS) Pattern

### Architecture Overview
```
Entities (IDs) → Components (Data) → Systems (Logic)
```

### Component Definitions
```typescript
// Components
interface TransformComponent {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
}

interface VisualComponent {
    mesh: Mesh;
    material: Material;
    effects: string[];
}

interface GameplayComponent {
    insectType: InsectType;
    scored: boolean;
    speed: number;
    lane: number;
}

interface ParticleEmitterComponent {
    emitConfig: EmitConfig;
    active: boolean;
}
```

### System Categories
1. **RenderingSystem** - Draw all visual components
2. **PhysicsSystem** - Movement, collision detection
3. **GameplaySystem** - Scoring, spawning, game rules
4. **ParticleSystem** - Emit and update particles
5. **AudioSystem** - Sync with music
6. **PostProcessSystem** - Apply visual effects

## 2.2 Object Pooling System

### Critical for Performance
```typescript
class ObjectPool<T> {
    private available: T[] = [];
    private inUse: Set<T> = new Set();
    
    acquire(): T;
    release(obj: T): void;
    preallocate(count: number): void;
}
```

### Pool Types Needed
- **Insect Pool** - Reuse insect entities
- **Particle Pool** - 1000+ particle slots
- **Effect Pool** - One-shot visual effects
- **Audio Pool** - Sound effect instances

## 2.3 Frame Budget Management

### Target Budget (60 FPS = 16.67ms)
| System | Budget | Priority |
|--------|--------|----------|
| Physics | 2ms | Critical |
| Gameplay | 1ms | Critical |
| Rendering | 10ms | Critical |
| Particles | 2ms | Important |
| Post-FX | 1ms | Important |

### Strategies
1. **Time-slicing** - Distribute work across frames
2. **LOD** - Reduce detail at distance
3. **Culling** - Don't render off-screen
4. **Batching** - Single draw call for similar objects

## 2.4 Render Pipeline Optimization

### WebGL Optimizations
1. **Draw Call Batching** - Combine similar objects
2. **Texture Atlases** - Single texture for multiple sprites
3. **Instanced Rendering** - For repeated geometry
4. **Deferred Shading** - Complex lighting (future)

### Mobile-Specific
- Reduce shadow quality
- Lower particle count
- Simplified shaders
- Target 30fps fallback

## 2.5 Cross-Platform Considerations

### Platform Matrix
| Platform | Renderer | Target FPS | Notes |
|----------|----------|------------|-------|
| Desktop Chrome | WebGL2 | 120 | Maximum effects |
| Desktop Firefox | WebGL2 | 60 | Slightly reduced |
| Mobile iOS | WebGL1 | 60 | Simplified FX |
| Mobile Android | WebGL2 | 60 | Varies by device |
| Nintendo Switch | Custom | 60 | Future (if successful) |

### WebGPU Migration Path
- Three.js supports WebGPU backend
- Plan shader compatibility
- Feature detection for fallback

---

# 3. Audio Engine

## 3.1 Dynamic Music System

### Architecture
```
Music Track (OGG/MP3)
    ↓
Audio Analysis (FFT)
    ↓
Beat Detection → Intensity Curve
    ↓
Game Events ← Combine
    ↓
Dynamic Mix Parameters
```

### Music Sections
| Section | BPM | Intensity | Visual Response |
|---------|-----|-----------|------------------|
| Intro | 138 | 0.3 | Calm, slow movement |
| Build | 138 | 0.6 | Increasing particles |
| Drop | 138 | 1.0 | Full chaos, fever |
| Break | 138 | 0.4 | Cool down |

### Implementation
```typescript
interface AudioAnalyzer {
    getFrequencyData(): Uint8Array;
    getBeatIntensity(): number;
    getSection(): MusicSection;
}

class DynamicMusicSystem {
    private tracks: Map<string, AudioBuffer> = new Map();
    private currentSection: MusicSection = 'intro';
    
    updateSection(score: number, combo: number): void;
    crossfadeTo(track: string, duration: number): void;
}
```

## 3.2 Spatial Audio

### Use Cases
- **Insect sounds** - Positioned in 3D space
- **UI feedback** - Spatial click sounds
- **Music** - Immersive stereo field

### Web Audio Implementation
```typescript
const panner = audioCtx.createPanner();
panner.panningModel = 'HRTF';
panner.setPosition(insect.x, insect.y, 0);
```

## 3.3 Sound Design Pipeline

### Sound Categories
| Category | Examples | Format |
|----------|----------|--------|
| SFX - Tap | Pop, whoosh, zap | OGG 128kbps |
| SFX - Special | Power-up, fever start | OGG 192kbps |
| SFX - UI | Click, hover, error | OGG 96kbps |
| Music | Main track, variants | OGG 320kbps |

### Tools
- **bfxr** - Retro sound effects
- **Vital** - Synth for psytrance elements
- **Ableton Live** - Full track production

## 3.4 Audio-Visual Synchronization

### Beat Sync Methods
1. **Frequency Analysis** - FFT for real-time intensity
2. **Pre-mapped Beats** - Timestamp-known beats
3. **Hybrid** - Analyze + pre-mapped fallback

### Sync Points
- Every beat (quarter note)
- Every bar (4 beats)
- Music section changes
- Drop detection

---

# 4. Gameplay Loop

## 4.1 Progression System

### Level Structure
```
Level 1-10: Tutorial + Basic
Level 11-25: Speed increases
Level 26-50: New insect types
Level 51-100: Fever mode unlocked
Level 100+: Endless with leaderboard
```

### Unlockables
| Unlock | Requirement | Type |
|--------|-------------|------|
| Fire Ant | Score 100 | Visual |
| Alien Bug | Score 500 | Visual |
| Rainbow Ant | Score 1000 | Visual |
| Fever Mode | Score 500 | Feature |
| Hard Mode | Complete level 50 | Difficulty |

## 4.2 Achievement Framework

### Achievement Categories
1. **Score** - High score milestones
2. **Combo** - Chain tap achievements
3. **Streak** - Daily play streaks
4. **Collection** - Unlock all insects
5. **Mastery** - Perfect runs

### Sample Achievements
| ID | Name | Requirement | Reward |
|----|------|-------------|--------|
| first_tap | First Tap | Score 1 | 10 coins |
| combo_10 | Combo Master | 10 combo | 50 coins |
| fever_rush | Fever Rush | Trigger fever 5x | Unlock rainbow ant |
| score_1000 | Thousand Club | Score 1000 | 100 coins |

## 4.3 Daily Challenges

### Challenge Types
1. **Score Attack** - Highest score in 3 minutes
2. **Time Attack** - Clear X insects in time
3. **No Miss** - Perfect run challenge
4. **Speed Run** - Reach score X as fast as possible

### Rewards
- Coins (currency)
- Rare insect unlock chances
- Leaderboard placement

## 4.4 Events System

### Event Types
| Event | Duration | Theme |
|-------|----------|-------|
| Weekend Warrior | Sat-Sun | 2x points |
| Full Moon | Monthly | Special visuals |
| Anniversary | Annual | Exclusive rewards |

### Event Structure
- Special background music
- Unique visual filters
- Exclusive insects
- Bonus objectives

## 4.5 Season/Battle Pass (Future Monetization)

### Season Structure
- **12-week seasons**
- **100 tiers** (free + premium)
- **Weekly unlocks**

### Pass Tiers
| Tier | Cost | Rewards |
|------|------|---------|
| Free | $0 | 50% of rewards |
| Premium | $9.99 | 100% + exclusive |

### Future Monetization (v2.0)
- Cosmetic skins
- Power-ups
- Extra lives
- Custom backgrounds

---

# 5. Technical Architecture

## 5.1 State Management Patterns

### Recommended: Zustand + ECS Hybrid
```typescript
// Game State Store
interface GameState {
    score: number;
    highScore: number;
    isPlaying: boolean;
    currentLevel: number;
    unlockedInsects: InsectType[];
    settings: Settings;
}

// Use Zustand for UI/Game state
// Use ECS for runtime entities
```

### State Categories
| State Type | Manager | Persistence |
|------------|---------|-------------|
| UI State | Zustand | None |
| Game State | Zustand | LocalStorage |
| Entity State | ECS | None |
| Network State | Custom | Server |

## 5.2 Network Architecture

### Backend Stack
- **Express** (existing)
- **SQLite** (existing) → PostgreSQL (scale)
- **Redis** (caching, sessions)

### API Endpoints
```
POST /api/auth/login
POST /api/auth/register
GET  /api/leaderboard/:type
POST /api/scores
GET  /api/progress
POST /api/progress/sync
POST /api/challenges/daily
```

### Cloud Saves
- Automatic sync on game end
- Manual sync button
- Conflict resolution (latest wins)

## 5.3 Performance Targets

### Desktop
| Metric | Target | Acceptable |
|--------|--------|------------|
| FPS | 120 | 60 |
| Frame Time | 8.3ms | 16.7ms |
| Load Time | 2s | 5s |
| Memory | 512MB | 1GB |

### Mobile
| Metric | Target | Acceptable |
|--------|--------|------------|
| FPS | 60 | 30 |
| Frame Time | 16.7ms | 33.3ms |
| Load Time | 5s | 10s |
| Memory | 256MB | 512MB |

## 5.4 Memory Budget

### Allocation
| Category | Desktop | Mobile |
|----------|---------|--------|
| Textures | 200MB | 100MB |
| Audio | 100MB | 50MB |
| Geometry | 50MB | 25MB |
| Scripts | 10MB | 10MB |
| Reserve | 152MB | 71MB |
| **Total** | **512MB** | **256MB** |

### Strategies
- Lazy loading for assets
- Texture compression
- Audio streaming
- Object pooling

---

# 6. Quick Win Features (SURPRISE PRIORITY)

## 6.1 Top 5 Visual Upgrades (Maximum Impact)

### #1: Bloom/Glow Effect (P0 - Do First)
**Impact**: ★★★★★  
**Effort**: Low  
**Implementation**:
```typescript
// Three.js bloom setup
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
const bloomPass = new UnrealBloomPass(
    new Vector2(width, height),
    1.5,  // strength
    0.4,  // radius
    0.85  // threshold
);
```
**Effect**: Insects will glow intensely, creating that "neon" feel instantly.

### #2: Chromatic Aberration on Beat (P0)
**Impact**: ★★★★★  
**Effort**: Low  
**Implementation**: Add post-processing pass that triggers on bass hits.  
**Effect**: Screen "shatters" slightly on each beat - very psychedelic.

### #3: Particle Explosions on Tap (P0)
**Impact**: ★★★★☆  
**Effort**: Medium  
**Implementation**: Replace emoji psyEffects with GPU particles.  
**Effect**: Satisfying burst of 50+ particles on every successful tap.

### #4: Dynamic Background (P0)
**Impact**: ★★★★☆  
**Effort**: Low  
**Implementation**: Animated shader background that responds to music.  
**Effect**: Constantly shifting, never-repeating psychedelic patterns.

### #5: Fever Mode Visual Overhaul (P1)
**Impact**: ★★★★★  
**Effort**: Medium  
**Implementation**: Special render pipeline during fever:
- Increased bloom
- Wave distortion
- Color saturation boost
- Particle density 3x

**Effect**: Player feels "inside" the music during fever.

## 6.2 Low-Hanging Fruit (Performance)

### Immediate Wins
1. **Canvas → WebGL** - 10x rendering performance
2. **Object pooling** - Zero GC during gameplay
3. **RequestAnimationFrame** throttling - Consistent frame times
4. **Texture atlases** - Reduce draw calls by 90%
5. **Audio preloading** - No loading during play

## 6.3 "Wow Factor" Additions

### #1: Camera Shake on Miss
- Screen shake when missing an insect
- Intensity scales with combo

### #2: Screen-Fill Mandala on Fever Start
- One-time celebration effect
- Player reward for triggering fever

### #3: Real-time Frequency Visualizer
- Circular spectrum around player
- Reactive to all frequencies

### #4: Particle Trails
- Each insect leaves a trail
- Color matches insect type

### #5: Dynamic Lane Colors
- Lanes pulse to the beat
- Color shifts with score

---

# Implementation Roadmap

## Phase 1: Visual Foundation (Week 1)
| Task | Priority | Estimate |
|------|----------|----------|
| Set up Three.js | P0 | 2h |
| Add bloom post-processing | P0 | 2h |
| Add chromatic aberration | P0 | 2h |
| Replace emojis with sprites | P0 | 4h |
| Add particle system | P0 | 4h |
| Dynamic background shader | P0 | 2h |

## Phase 2: Audio Integration (Week 2)
| Task | Priority | Estimate |
|------|----------|----------|
| Beat detection system | P0 | 4h |
| Audio-reactive visuals | P0 | 4h |
| Spatial audio | P1 | 2h |
| Dynamic music sections | P1 | 8h |

## Phase 3: Gameplay Enhancement (Week 3)
| Task | Priority | Estimate |
|------|----------|----------|
| Unlock progression | P1 | 4h |
| Achievements system | P1 | 4h |
| Daily challenges | P2 | 8h |
| Leaderboards | P2 | 8h |

## Phase 4: Polish (Week 4)
| Task | Priority | Estimate |
|------|----------|----------|
| Mobile optimization | P0 | 8h |
| Performance profiling | P0 | 4h |
| UI polish | P1 | 4h |
| Bug fixing | P0 | 8h |

---

# Appendix

## Recommended Dependencies (Future)
```json
{
  "three": "^0.170.0",
  "@react-three/fiber": "^9.0.0",
  "@react-three/postprocessing": "^3.0.0",
  "zustand": "^5.0.0",
  "howler": "^2.2.4",
  "tone": "^15.0.0"
}
```

## File Structure Recommendation
```
src/
├── components/
│   ├── Game.tsx
│   ├── Canvas.tsx
│   └── UI/
├── engine/
│   ├── ECS/
│   │   ├── Entity.ts
│   │   ├── Component.ts
│   │   └── System.ts
│   ├── Rendering/
│   │   ├── Renderer.ts
│   │   ├── PostProcessing.ts
│   │   └── Shaders/
│   ├── Particles/
│   │   ├── ParticleSystem.ts
│   │   └── Emitters/
│   └── Audio/
│       ├── AudioEngine.ts
│       └── BeatDetection.ts
├── game/
│   ├── Gameplay/
│   ├── Progression/
│   └── Achievements/
├── assets/
│   ├── textures/
│   ├── audio/
│   └── shaders/
└── utils/
```

---

*Document Version: 1.0*  
*Next Review: After Phase 1 Completion*
