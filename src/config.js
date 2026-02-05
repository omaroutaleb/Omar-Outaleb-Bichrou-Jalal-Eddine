// ============================================
// CONFIGURATION - All tunable game constants
// ============================================

// Seeded RNG for reproducible procedural generation
export class SeededRNG {
    constructor(seed = 12345) {
        this.seed = seed;
    }
    
    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }
    
    range(min, max) {
        return min + this.next() * (max - min);
    }
    
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}

// World settings
export const WORLD = {
    WIDTH: 2400,
    HEIGHT: 2400,
    TILE_SIZE: 80,
    OBSTACLE_COUNT: 25,
    OBSTACLE_MIN_SIZE: 40,
    OBSTACLE_MAX_SIZE: 120,
    SEED: 42
};

// Fixed timestep simulation
export const SIMULATION = {
    TICK_RATE: 60,
    DT: 1 / 60,
    MAX_FRAME_TIME: 0.25
};

// Spatial hash settings
export const SPATIAL = {
    CELL_SIZE: 150
};

// Player settings
export const PLAYER = {
    RADIUS: 14,
    MAX_SPEED: 280,
    ACCELERATION: 1800,
    FRICTION: 8,
    MAX_HP: 100,
    
    DASH_SPEED: 650,
    DASH_DURATION: 0.15,
    DASH_COOLDOWN: 0.8,
    
    ATTACK_DAMAGE: 25,
    ATTACK_RANGE: 55,
    ATTACK_ARC: Math.PI * 0.6,
    ATTACK_DURATION: 0.2,
    ATTACK_COOLDOWN: 0.35,
    
    INVULN_DURATION: 0.5,
    
    // Projectile (Soldier)
    PROJECTILE_SPEED: 600,
    PROJECTILE_RADIUS: 5,
    PROJECTILE_DAMAGE: 15,
    PROJECTILE_LIFETIME: 1.5,
    PROJECTILE_COLOR: '#ff0',
    AUTO_AIM_RANGE: 600
};

// Camera settings
export const CAMERA = {
    LERP_SPEED: 5,
    DEADZONE: 50
};

// Enemy base settings
export const ENEMY = {
    CONTACT_DAMAGE: 10,
    HIT_FLASH_DURATION: 0.1,
    DEATH_PARTICLE_COUNT: 8
};

// Grunt enemy
export const GRUNT = {
    RADIUS: 16,
    MAX_SPEED: 160,
    MAX_FORCE: 300,
    HP: 40,
    DAMAGE: 12,
    XP_VALUE: 15,
    COIN_VALUE: 5,
    
    // Steering weights
    PURSUE_WEIGHT: 1.0,
    SEPARATION_WEIGHT: 0.8,
    SEPARATION_RADIUS: 50,
    OBSTACLE_AVOIDANCE_WEIGHT: 1.5,
    BOUNDARY_WEIGHT: 2.0
};

// Swarm enemy
export const SWARM = {
    RADIUS: 10,
    MAX_SPEED: 200,
    MAX_FORCE: 400,
    HP: 15,
    DAMAGE: 5,
    XP_VALUE: 8,
    COIN_VALUE: 2,
    
    // Steering weights (boids-style)
    COHESION_WEIGHT: 1.2,
    ALIGNMENT_WEIGHT: 1.0,
    SEPARATION_WEIGHT: 1.5,
    SEEK_WEIGHT: 0.6,
    FLOCK_RADIUS: 80,
    SEPARATION_RADIUS: 30,
    PREFERRED_DISTANCE: 120,
    OBSTACLE_AVOIDANCE_WEIGHT: 1.2,
    BOUNDARY_WEIGHT: 2.0
};

// Ranger enemy
export const RANGER = {
    RADIUS: 14,
    MAX_SPEED: 140,
    MAX_FORCE: 250,
    HP: 30,
    DAMAGE: 8,
    XP_VALUE: 20,
    COIN_VALUE: 8,
    
    // Steering weights
    ARRIVE_WEIGHT: 1.0,
    FLEE_WEIGHT: 2.0,
    SEPARATION_WEIGHT: 0.6,
    PREFERRED_DISTANCE: 280,
    FLEE_DISTANCE: 150,
    SEPARATION_RADIUS: 40,
    
    // Projectile
    PROJECTILE_SPEED: 220,
    PROJECTILE_DAMAGE: 15,
    PROJECTILE_RADIUS: 8,
    SHOOT_COOLDOWN: 2.0,
    OBSTACLE_AVOIDANCE_WEIGHT: 1.5,
    BOUNDARY_WEIGHT: 2.0
};

// Boss settings
export const BOSS = {
    RADIUS: 45,
    MAX_SPEED: 120,
    MAX_FORCE: 200,
    HP: 800,
    DAMAGE: 25,
    XP_VALUE: 200,
    COIN_VALUE: 100,
    
    // Phase 1 (above 60% HP)
    PHASE1_SPAWN_INTERVAL: 5.0,
    PHASE1_SPAWN_COUNT: 4,
    
    // Phase 2 (below 60% HP)
    PHASE2_SPEED_MULT: 1.5,
    CHARGE_SPEED: 450,
    CHARGE_DURATION: 0.6,
    CHARGE_COOLDOWN: 4.0,
    SLAM_RADIUS: 150,
    SLAM_DAMAGE: 35,
    SLAM_COOLDOWN: 6.0,
    
    // Steering
    PURSUE_WEIGHT: 1.0,
    OBSTACLE_AVOIDANCE_WEIGHT: 2.0,
    BOUNDARY_WEIGHT: 3.0,
    
    // Spawn location (center-ish)
    SPAWN_X: 1200,
    SPAWN_Y: 1200
};

// Spawner settings
export const SPAWNER = {
    WAVE_COUNT: 5,
    WAVE_DELAY: 2.0,
    BASE_ENEMIES_PER_WAVE: 8,
    ENEMIES_PER_WAVE_INCREASE: 4,
    SPAWN_MARGIN: 100
};

// Upgrade system
export const UPGRADES = {
    BASE_XP_THRESHOLD: 50,
    XP_MULTIPLIER: 1.5
};

// UI settings
export const UI = {
    HP_BAR_WIDTH: 200,
    HP_BAR_HEIGHT: 20,
    BOSS_BAR_WIDTH: 400,
    BOSS_BAR_HEIGHT: 25,
    MINIMAP_RADIUS: 80,
    MINIMAP_SCALE: 0.04
};

// Colors
export const COLORS = {
    PLAYER: '#5b8', // Soldier Green
    PLAYER_HELMET: '#385',
    PLAYER_GUN: '#222',
    PLAYER_SWORD: '#8cf',
    GRUNT: '#e55',
    SWARM: '#e82',
    RANGER: '#a5e',
    BOSS: '#f44',
    BOSS_PHASE2: '#f82',
    PROJECTILE: '#fa0',
    
    GROUND_1: '#1a1a24',
    GROUND_2: '#16161e',
    OBSTACLE: '#2a2a3a',
    OBSTACLE_STROKE: '#3a3a4a',
    
    HP_BG: '#333',
    HP_FILL: '#4a4',
    HP_LOW: '#a44',
    BOSS_HP_BG: '#222',
    BOSS_HP_FILL: '#c33',
    
    UI_TEXT: '#fff',
    UI_SHADOW: '#000',
    
    MINIMAP_BG: 'rgba(0,0,0,0.5)',
    MINIMAP_PLAYER: '#4af',
    MINIMAP_ENEMY: '#f44',
    MINIMAP_BOSS: '#ff0'
};

// Particle settings
export const PARTICLES = {
    HIT_COUNT: 6,
    HIT_SPEED: 150,
    HIT_LIFETIME: 0.3,
    DASH_COUNT: 3,
    DEATH_COUNT: 12,
    DEATH_SPEED: 200,
    DEATH_LIFETIME: 0.5
};

// Debug settings
export const DEBUG = {
    SHOW_STEERING: true,
    SHOW_SPATIAL_HASH: false,
    SHOW_HITBOXES: true,
    STEERING_VECTOR_SCALE: 0.3
};
