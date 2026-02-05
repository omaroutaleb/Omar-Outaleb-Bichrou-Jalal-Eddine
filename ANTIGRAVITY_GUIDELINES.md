# Antigravity Project Guidelines (p5.js 2D Arena)

These rules are mandatory. If a rule conflicts with another, follow the one that most improves: (1) runnable project, (2) simplicity, (3) clarity.

## 1) Product constraints
- Target: a simple 2D top-down arena game in the browser using p5.js.
- No copyrighted assets, names, logos, or direct text from the referenced game; use original naming and procedural shapes.
- Must run as a static site: open via a local server (documented in README).

## 2) Definition of “done”
- The project runs without errors from a local static server.
- Player can move, dash, aim, and attack.
- Enemies spawn in waves and use steering behaviors (Reynolds-style) to navigate and engage.
- Boss spawns after final wave, has a visible boss bar, and can be defeated.
- HUD shows HP, coins, level, timer, objective, minimap; debug overlay exists.
- Codebase has a coherent architecture with ES module imports and no missing files.

## 3) Architecture rules
- Use ES modules and the specified file structure.
- Game loop:
  - Use fixed timestep simulation (e.g., 1/60s) with an accumulator.
  - Rendering can happen every frame; simulation steps are discrete.
- Separate responsibilities:
  - `entities/*` contain state + update logic; no direct DOM manipulation.
  - `ui/*` draws HUD only; reads from game state.
  - `steering/*` contains math and behaviors; behavior functions are pure (no side effects).
  - `engine/*` contains loop, input, camera, collision, spatial hash, debug.
- Do not use p5.Vector in simulation logic; use the project Vec2 class.

## 4) Steering behaviors (Craig Reynolds principles)
- Implement behaviors as forces (accelerations) applied to velocity:
  - Seek, Flee, Arrive
  - Pursue, Evade
  - Wander
  - Separation, Cohesion, Alignment
  - Obstacle avoidance (simple) and boundary containment
- Combine multiple forces with weights:
  - Sum weighted forces
  - Clamp to `maxForce`
  - Integrate velocity, clamp to `maxSpeed`
- Avoid jitter:
  - Use smoothing on wander direction.
  - Use arrive near target radius.
- Neighbor queries for group behaviors MUST use `SpatialHash` (no O(n²) scans).

## 5) Performance rules
- Use Spatial Hash / uniform grid:
  - Insert entities each simulation step
  - Query by radius for neighbors and collision candidates
- Avoid per-frame allocations in hot paths:
  - Reuse Vec2 temporaries where reasonable
  - Keep arrays small; clear and reuse buffers if needed
- Target: 60 FPS with ~100 enemies on a typical laptop.

## 6) Collision rules
- Prefer circle collisions for dynamic entities.
- Obstacles are rectangles (AABB).
- Minimum viable:
  - Player vs obstacles: prevent penetration by pushing out along smallest axis.
  - Enemy vs obstacles: simple avoidance + push-out.
  - Sword arc: detect enemies within arc sector (angle + distance).
  - Projectiles: circle hit test.

## 7) Gameplay simplicity rules
- Choose the simplest implementation that still feels complete:
  - One arena map
  - Three enemy archetypes + boss
  - Basic upgrades (3 random choices on level up) with pause overlay
- Avoid complex inventories, crafting, or meta-progression.

## 8) UI/UX rules
- HUD must be readable:
  - HP bar clearly visible
  - Objective text visible at all times
  - Boss bar appears only when boss alive
- Minimap: radar-style is enough (player center + nearby dots).
- Provide a restart flow after victory/defeat.

## 9) Debug & tuning
- Add a debug toggle key:
  - Show steering vectors, target points, neighbor radius, FPS
- All tunables go to `config.js`:
  - Speeds, forces, weights, radii, spawn counts, wave count, XP thresholds
- Provide comments in config describing what each parameter affects.

## 10) README requirements
README must include:
- How to run (local server command)
- Controls
- AI overview: list steering behaviors and where weights are configured
- Troubleshooting tips (e.g., “must use a local server for ES modules”)

## 11) Output formatting (for Antigravity)
- Output each file with an explicit header:
  - `--- FILE: path/to/file ---`
- Do not use placeholders like “TODO: code here” for core features.
- Ensure imports/exports are correct and consistent.
- If you must cut scope, cut optional audio first, then fancy particles, then minimap details—never cut core loop, input, steering, spawning, boss fight.
