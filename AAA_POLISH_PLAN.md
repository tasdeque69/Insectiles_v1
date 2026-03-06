# 🎯 AAA Quality Upgrade Plan - Pinik Pipra

**Date:** 2026-03-07  
**Status:** Draft → Approved  
**Owner:** CODEX (Head Admin)  
**Target:** State-of-the-art piano-tiles style game with "lively" ants

---

## 📊 Current State Analysis

### What We Have
- ✅ Core gameplay: falling tiles in 4 lanes, tap to catch
- ✅ Combo multiplier (1x-5x)
- ✅ Power-ups: shield, slow-mo
- ✅ Leaderboard & persistence
- ✅ 48 passing tests
- ✅ Build: 75KB gzipped
- ✅ 3D model reference: "Pink cartoon ant character" (Sketchfab 86b667a)
- ✅ PNG bug assets (1.5MB each, transparent)

### What's Missing (The "Sad" State)
- ❌ Insects look like **rotating boxes**, not lively ants
- ❌ PNG sprites are static (no walk cycle animation)
- ❌ No squash & stretch on hit
- ❌ No shadow depth (flat rendering)
- ❌ Particle effects basic (no color matching)
- ❌ No hit "pop" animation
- ❌ Background cluttered (mascot images)
- ❌ 3D model exists but **too heavy** (500K polys, unrigged)
- ❌ No proper "strike zone" visual feedback
- ❌ Audio lacks pitch variation per lane

---

## 🏆 AAA Quality Definition

Based on **magic piano tiles** benchmarks (Dream Piano, Magic Tiles, etc.):

| Feature | AAA Standard | Our Current |
|---------|--------------|-------------|
| **Sprite Animation** | 8-frame walk cycle (smooth) | Static image, rotating |
| **Hit Feedback** | Scale pop + particles + sound | Instant disappear |
| **Depth** | Shadows, parallax, layering | Flat 2D |
| **Polish** | Squash/stretch, ease animations | Linear movement |
| **Audio** | Lane-specific pitch, layered SFX | Generic sounds |
| **Performance** | 60fps stable, <16ms frame time | Variable, depends |
| **Visual Cohesion** | Themed palette, consistent style | Mixed assets |

---

## 🎯 Strategic Decision: **2D is the Path**

### Why NOT 3D (Three.js)?
- ❌ 500K poly model → needs decimation to ~5K (loss of detail)
- ❌ No rigging/animations → requires weeks of work
- ❌ 70MB textures → too big for web
- ❌ Mobile performance risk (WebGL overhead)
- ❌ Piano tiles games are **traditionally 2D** (precise hitboxes)

### Why 2D Canvas is Right?
- ✅ Proven performance (60fps achievable)
- ✅ Precise hit detection (pixel-perfect)
- ✅ Lightweight (75KB bundle)
- ✅ Works on all devices (including old phones)
- ✅ Easy to create polished spritesheets

---

## 🚀 **Phase 1: Asset Creation (Weeks 1-2)**

### Task 1.1: Create 2D Ant Sprites Inspired by 3D Model
**Goal:** 8-direction walk cycle + hit/fever variants

**Deliverables:**
- **Walk cycle (8 frames):** Ant "running" with leg/antenna movement
  - Directions: N, NE, E, SE, S, SW, W, NW (or just 4 if using lane-based)
  - Frame size: 150x150px
  - Format: PNG with transparency
  - Style: Cartoon pink, soft shading (emulate PBR from 3D model)
- **Hit animation (1 frame):** Squished/exploding ant (scale up 120% then fade)
- **Fever variant:** Glowing neon outline, particles trailing
- **Shield power-up:** Ant with blue bubble shield
- **Slow-mo power-up:** Ant with hourglass/cog icon

**Method:**
1. Export 3D model from Sketchfab (if license allows) → Blender
2. Rig with simple bones (spine + legs)
3. Create walk cycle animation
4. Render from 8 angles to PNG sequence
5. Touch up in Photoshop/Aseprite for cartoon polish
6. Create sprite sheet (TexturePacker)

**Alternative if 3D export not allowed:**
- Hire 2D artist to create sprites inspired by model's design
- Use the model as visual reference only

**Acceptance Criteria:**
- [ ] 8 unique walk frames per direction
- [ ] Transparent background (no boxes)
- [ ] Consistent lighting/shading (looks 3D-ish)
- [ ] Files: `ant_walk_N.png`, `ant_walk_NE.png`, etc.
- [ ] Sprite sheet generated (ant_sprites.png)

---

## 🎨 **Phase 2: Renderer Polish (Weeks 2-3)**

### Task 2.1: Replace Spinner with Walk Animation
**File:** `src/utils/gameEngine.ts` → `spawnInsect()`, `draw()`

**Changes:**
- Store `frameIndex` in insect state (0-7)
- Increment each spawn tick (animate through walk cycle)
- Draw correct frame from sprite sheet
- Use `ctx.drawImage(spritesheet, sx, sy, sw, sh, dx, dy, dw, dh)`

### Task 2.2: Add Squash & Stretch on Hit
**When ant tapped:**
1. Scale to 1.3x in one frame (pop)
2. Fade out alpha over 200ms
3. Spawn particles matching hit color
4. Play higher-pitched sound

**Implementation:** Add `hitScale` and `hitAlpha` to insect state during `handleTap`.

### Task 2.3: Add Shadow Under Insects
**Draw function:**
- Oval shadow at `(x, y + tileHeight)`
- Scale based on insect height (smaller as it rises)
- Soft blur for depth
- Dark gray with low alpha

### Task 2.4: Remove Rotation, Add Wobble
**Current:** `ctx.rotate(frames * 0.05)` → spinning box  
**New:** Gentle sine-wave horizontal offset:
```ts
const wobbleX = Math.sin(frames * 0.1 + insect.id) * 3;
ctx.translate(centerX + wobbleX, centerY);
```

---

## 🌟 **Phase 3: Polish & Juice (Weeks 3-4)**

### Task 3.1: Particle System Enhancement
**New particles:**
- **Hit explosion:** 12 particles, pink/purple gradient, burst outward
- **Trail:** 2-3 small particles behind falling ant (fade quickly)
- **Combo text:** Floating "+100", "x2 COMBO" that scales up and fades

**Colors:** Match hit lane color (4 distinct colors for 4 lanes)

### Task 3.2: Strike Zone Indicators
**Subtle visual:**
- Draw faint horizontal line at strike height (e.g., 80% from top)
- Or highlight lane background when ant enters strike zone
- Pulse glow when ant is "in the zone"

### Task 3.3: Score Popup Animation
**On hit:**
- Show floating "+100" at tap position
- Scale from 1.2 → 1.0, fade out over 500ms
- Color coded: white (normal), gold (fever), rainbow (combo x3+)

### Task 3.4: Fever Mode Visuals
**Changes during fever:**
- Background: animated gradient (psychedelic)
- Ants: larger (1.2x), glowing neon outline
- Particles: more, faster, rainbow colors
- Screen shake on fever start
- HUD pulse on multiplier increase

---

## 🔊 **Phase 4: Audio Enhancement (Weeks 4-5)**

### Task 4.1: Lane-Specific Pitches
**Map 4 lanes to 4 notes:**
- Lane 0: C5 (523Hz)
- Lane 1: E5 (659Hz)
- Lane 2: G5 (784Hz)
- Lane 3: C6 (1047Hz)

**Implementation:** In `audio.ts`, pass `lane` to `playTapSound(lane)` and play sine wave at pitch based on lane.

### Task 4.2: Audio Layering
- **Hit sound:** Soft "pop" (short sine with quick decay)
- **Combo sound:** Rising arpeggio (3 notes) every 4x combo
- **Power-up:** Unique jingle (shield: shield sound, slow-mo: time-warp)
- **Fever activation:** Rising sweep (pitch bend up)
- **Background music:** Looping psytrance track (already exists?)

### Task 4.3: Haptic Feedback (Mobile)
Use `navigator.vibrate()` on hit:
- Short tap: 15ms
- Long combo: 30ms
- Fever: 50ms double tap

---

## 📱 **Phase 5: Performance Optimization (Weeks 5-6)**

### Task 5.1: Sprite Sheet Optimization
- Single atlas for all ant frames
- Power-of-two dimensions (1024x1024 or 2048x2048)
- PNG-8 with palette (reduces size)
- Preload with priority

### Task 5.2: Particle Pool
- Pre-allocate particle array (avoid GC spikes)
- Reuse dead particles instead of creating new

### Task 5.3: Frame Rate Stability
- Target: <16ms frame time
- Use `performance.now()` delta for movement (not frame count)
- Cap at 60fps (skip frames if lagging)

---

## 🧪 **Phase 6: Testing & QA (Week 6-7)**

### Task 6.1: Device Testing
- iPhone SE (low-end)
- Android budget phone
- iPad Pro (high-end)
- Chrome, Safari, Firefox

**Metrics:**
- FPS consistency
- Touch latency (<100ms)
- Memory usage (<100MB)
- Battery drain (minimal)

### Task 6.2: Playtesting
- 10 testers play for 10 minutes each
- Collect feedback on:
  - "How satisfying are hits?"
  - "Is difficulty progression good?"
  - "Would you play this daily?"
  - "What's missing?"

### Task 6.3: Accessibility Audit
- Color contrast ratios (WCAG AA)
- Reduced motion option (toggle animations)
- Screen reader labels ("Game started", "Score 100")

---

## 📈 **Success Metrics**

| Metric | Target |
|--------|--------|
| **FPS** | 60 stable (no drops below 50) |
| **Load time** | <2s on 3G |
| **Bundle size** | <100KB gzipped |
| **Test coverage** | 70%+ |
| **User rating (if published)** | 4.5+ stars |
| **Session length** | 5+ minutes average |

---

## 🎯 **Immediate Next Steps (This Week)**

1. **✅ Lock in asset pipeline:** Decide on sprite creation method (Blender render vs custom 2D)
2. **✅ Create test sprite:** One 8-frame walk cycle to validate renderer
3. **✅ Update GameEngine:** Support frame-based animation
4. **✅ Implement shadows:** Add depth baseline
5. **✅ Remove rotation:** Replace with wobble (already done)
6. **✅ Add hit pop:** Scale animation on tap

---

## 📋 **Updated Task Pool Structure**

```
P1-AAA-001: Create ant walk cycle sprite sheet (8 frames x 4 dirs)     [PENDING - needs artist]
P1-AAA-002: Update GameEngine to use sprite sheet animation             [✅ DONE]
P1-AAA-003: Add shadow rendering under insects                          [✅ DONE]
P1-AAA-004: Implement squash & stretch on hit                          [✅ DONE]
P1-AAA-005: Enhance particle system (trails, color matching)          [✅ DONE]
P1-AAA-006: Add strike zone visual indicator                           [✅ DONE]
P1-AAA-007: Implement floating score popups                             [✅ DONE]
P1-AAA-008: Overhaul fever mode visuals                                 [PENDING]
P1-AAA-009: Add lane-specific pitch audio                              [PENDING]
P1-AAA-010: Haptic feedback on mobile                                   [PENDING]
P1-AAA-011: Performance optimization (sprite atlas, pool)              [PENDING]
P1-AAA-012: Device testing & optimization                               [PENDING]
P1-AAA-013: Accessibility compliance                                    [PENDING]
```

---

## 🏁 **Launch Criteria**

Ready for production when:
- [ ] All P1-AAA tasks complete
- [ ] 70%+ test coverage
- [ ] 60fps on low-end Android
- [ ] No console errors in normal gameplay
- [ ] Playtest score: 8/10 satisfaction
- [ ] Vercel deployed successfully
- [ ] Real device verified (iOS + Android)

---

**"From sad boxes to AAA ants"** 🐜✨

*Last Updated: 2026-03-07*
