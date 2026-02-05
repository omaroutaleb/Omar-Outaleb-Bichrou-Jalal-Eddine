// ============================================
// Game - Main Game State Manager
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { SeededRNG, WORLD, COLORS } from '../config.js';
import { Loop } from './Loop.js';
import { Input } from './Input.js';
import { Camera2D } from './Camera2D.js';
import { SpatialHash } from './SpatialHash.js';
import { Collision } from './Collision.js';
import { Debug } from './Debug.js';

import { Player } from '../entities/Player.js';
import { Spawner, SpawnerState } from '../systems/Spawner.js';
import { UpgradeSystem } from '../systems/Upgrades.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { ParticleSystem } from '../fx/Particles.js';
import { Audio } from '../audio/Audio.js';
import { Ranger } from '../entities/enemies/Ranger.js';

export const GameState = {
    PLAYING: 'playing',
    UPGRADE_SELECT: 'upgrade_select',
    PAUSED: 'paused',
    VICTORY: 'victory',
    GAME_OVER: 'game_over'
};

export class Game {
    constructor(p5Instance) {
        this.p5 = p5Instance;
        
        // Core systems
        this.loop = new Loop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );
        this.input = new Input();
        this.camera = new Camera2D(p5Instance.width, p5Instance.height);
        this.spatialHash = new SpatialHash();
        this.debug = new Debug();
        
        // Game systems
        this.spawner = new Spawner();
        this.upgradeSystem = new UpgradeSystem();
        this.hud = new HUD();
        this.minimap = new Minimap();
        this.particles = new ParticleSystem();
        this.audio = new Audio();
        
        // World
        this.rng = new SeededRNG(WORLD.SEED);
        this.obstacles = [];
        this.bounds = {
            left: 0,
            right: WORLD.WIDTH,
            top: 0,
            bottom: WORLD.HEIGHT
        };
        
        // Player
        this.player = null;
        
        // Game state
        this.state = GameState.PLAYING;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Generate obstacles
        this.generateObstacles();
        
        // Create player at center
        this.player = new Player(WORLD.WIDTH / 2, WORLD.HEIGHT / 2);
        
        // Setup camera
        this.camera.setTarget(this.player);
        this.input.setCamera(this.camera);
        
        // Setup spawner callbacks
        this.spawner.onEnemyDeath = (enemy) => {
            this.player.addXP(enemy.xpValue);
            this.player.addCoins(enemy.coinValue);
            this.particles.deathBurst(enemy.pos.x, enemy.pos.y, enemy.baseColor || '#f44');
            this.audio.playEnemyDeath();
            
            // Check for level up
            if (this.upgradeSystem.checkLevelUp(this.player)) {
                this.state = GameState.UPGRADE_SELECT;
                this.loop.pause();
                this.audio.playLevelUp();
            }
        };
        
        this.spawner.onVictory = () => {
            this.state = GameState.VICTORY;
            this.audio.playVictory();
        };
    }
    
    generateObstacles() {
        this.obstacles = [];
        const margin = 200;
        const centerExclusion = 300; // Keep center clear for player spawn
        
        for (let i = 0; i < WORLD.OBSTACLE_COUNT; i++) {
            let x, y;
            let attempts = 0;
            
            do {
                x = this.rng.range(margin, WORLD.WIDTH - margin);
                y = this.rng.range(margin, WORLD.HEIGHT - margin);
                attempts++;
            } while (
                attempts < 20 &&
                Math.abs(x - WORLD.WIDTH / 2) < centerExclusion &&
                Math.abs(y - WORLD.HEIGHT / 2) < centerExclusion
            );
            
            const width = this.rng.range(WORLD.OBSTACLE_MIN_SIZE, WORLD.OBSTACLE_MAX_SIZE);
            const height = this.rng.range(WORLD.OBSTACLE_MIN_SIZE, WORLD.OBSTACLE_MAX_SIZE);
            
            this.obstacles.push({
                x: x - width / 2,
                y: y - height / 2,
                width,
                height
            });
        }
    }
    
    update(dt) {
        if (this.state === GameState.UPGRADE_SELECT) {
            return; // Pause gameplay during upgrade selection
        }
        
        if (!this.player.alive) {
            if (this.state !== GameState.GAME_OVER) {
                this.state = GameState.GAME_OVER;
                this.audio.playGameOver();
            }
            return;
        }
        
        // Update player (pass enemies for auto-aim)
        this.player.update(dt, this.input, this.spawner.getAllEntities());
        
        // Handle player input
        this.handlePlayerInput();
        
        // Constrain player to bounds
        this.constrainToWorld(this.player);
        
        // Resolve player-obstacle collisions
        this.resolveObstacleCollisions(this.player);
        
        // Update spatial hash
        this.spatialHash.clear();
        this.spatialHash.insertAll(this.spawner.getAllEntities());
        
        // Update spawner (and all enemies)
        this.spawner.update(dt, this.player, this.spatialHash, this.obstacles, this.bounds);
        
        // Handle combat
        this.handleCombat(dt);
        
        // Update camera
        this.camera.update(dt);
        
        // Update particles
        this.particles.update(dt);
        
        // Update HUD
        this.hud.update(dt);
        
        // Clear input state
        this.input.endFrame();
    }
    
    handlePlayerInput() {
        // Attack
        if (this.input.isMouseJustPressed(0) || this.input.isMouseDown(0)) { // Auto-fire on hold
            if (this.player.startAttack()) {
                const attackDir = this.player.aimDirection;
                const attackPos = this.player.pos.add(attackDir.mult(this.player.radius * 1.5));
                this.particles.swordSwing(attackPos.x, attackPos.y, attackDir.heading()); // Reusing effect as muzzle flash
                this.audio.playHit(); // Using hit sound as shot sound vs nothing
            }
        }
        
        // Dash
        if (this.input.isKeyJustPressed(32)) { // Space
            if (this.player.startDash()) {
                this.audio.playDash();
            }
        }
        
        // Debug toggle
        if (this.input.isKeyJustPressed(192)) { // Backtick
            this.debug.toggle();
        }
        
        // Restart
        if (this.input.isKeyJustPressed(82)) { // R
            if (this.state === GameState.VICTORY || this.state === GameState.GAME_OVER) {
                this.restart();
            }
        }
    }
    
    handleCombat(dt) {
        const enemies = this.spawner.getAllEntities();
        
        // Player Projectile Collisions
        for (const proj of this.player.projectiles) {
            if (!proj.alive) continue;
            
            // Check vs Enemies
            for (const enemy of enemies) {
                if (Collision.circleCircle({ pos: proj.pos, radius: proj.radius }, enemy)) {
                    enemy.takeDamage(proj.damage);
                    proj.alive = false; // Destroy bullet
                    this.particles.hitSpark(proj.pos.x, proj.pos.y, '#ff0');
                    
                    if (enemy === this.spawner.boss) {
                        this.audio.playBossHit();
                    } else {
                        // Reuse hit sound
                    }
                    break; // One bullet hits one enemy
                }
            }
            
            // Check vs Obstacles
            if (proj.alive) {
                for (const obs of this.obstacles) {
                    if (Collision.circleRect({ pos: proj.pos, radius: proj.radius }, obs)) {
                        proj.alive = false;
                        this.particles.hitSpark(proj.pos.x, proj.pos.y, '#aaa');
                        break;
                    }
                }
            }
        }
        
        // Enemy contact damage
        for (const enemy of enemies) {
            if (enemy.canDamagePlayer && enemy.canDamagePlayer(this.player)) {
                if (this.player.takeDamage(enemy.damage)) {
                    this.audio.playPlayerHit();
                    this.particles.hitSpark(this.player.pos.x, this.player.pos.y, '#f00');
                    enemy.onContactWithPlayer(this.player);
                }
            }
        }
        
        // Projectile collisions
        for (const proj of this.spawner.projectiles) {
            if (!proj.alive) continue;
            
            const dist = this.player.pos.dist(proj.pos);
            if (dist < this.player.radius + proj.radius) {
                if (this.player.takeDamage(proj.damage)) {
                    this.audio.playPlayerHit();
                    this.particles.hitSpark(proj.pos.x, proj.pos.y, '#fa0');
                }
                proj.alive = false;
            }
            
            // Projectile-obstacle collision
            for (const obs of this.obstacles) {
                if (Collision.circleRect({ pos: proj.pos, radius: proj.radius }, obs)) {
                    proj.alive = false;
                    break;
                }
            }
        }
        
        // Boss slam damage
        if (this.spawner.boss && this.spawner.boss.state === 'slamming') {
            const boss = this.spawner.boss;
            if (!boss.slamHitPlayer && boss.slamTimer < 0.3 && boss.slamTimer > 0.25) {
                const dist = this.player.pos.dist(boss.pos);
                if (dist < 150 + this.player.radius) { // BOSS.SLAM_RADIUS
                    if (this.player.takeDamage(35)) { // BOSS.SLAM_DAMAGE
                        this.audio.playBossSlam();
                        this.particles.bossSlam(boss.pos.x, boss.pos.y, 150);
                    }
                }
            }
        }
    }
    
    constrainToWorld(entity) {
        const margin = entity.radius;
        entity.pos.x = Math.max(margin, Math.min(WORLD.WIDTH - margin, entity.pos.x));
        entity.pos.y = Math.max(margin, Math.min(WORLD.HEIGHT - margin, entity.pos.y));
    }
    
    resolveObstacleCollisions(entity) {
        for (const obs of this.obstacles) {
            const info = Collision.circleRectInfo(entity, obs);
            if (info) {
                Collision.separateCircleRect(entity, obs, info);
                
                // Zero velocity in collision direction if moving into obstacle
                const dot = entity.vel.dot(info.normal);
                if (dot < 0) {
                    entity.vel.subSelf(info.normal.mult(dot));
                }
            }
        }
    }
    
    render(alpha) {
        const p5 = this.p5;
        
        // Clear
        p5.background(COLORS.GROUND_1);
        
        // Camera transform
        p5.push();
        this.camera.apply(p5);
        
        // Draw ground (checkerboard pattern)
        this.drawGround(p5);
        
        // Draw obstacles
        this.drawObstacles(p5);
        
        // Draw enemies
        for (const enemy of this.spawner.enemies) {
            enemy.draw(p5);
            
            if (this.debug.enabled) {
                this.debug.drawHitbox(p5, enemy, '#f44');
                this.debug.drawSteeringVector(p5, enemy, enemy.currentSteeringForce, '#0ff');
            }
        }
        
        // Draw boss
        if (this.spawner.boss && this.spawner.boss.alive) {
            this.spawner.boss.draw(p5);
            
            if (this.debug.enabled) {
                this.debug.drawHitbox(p5, this.spawner.boss, '#ff0');
                this.debug.drawSteeringVector(p5, this.spawner.boss, this.spawner.boss.currentSteeringForce, '#0ff');
            }
        }
        
        // Draw player
        this.player.draw(p5);
        
        if (this.debug.enabled) {
            this.debug.drawHitbox(p5, this.player, '#0f0');
        }
        
        // Draw particles
        this.particles.draw(p5);
        
        p5.pop();
        
        // Draw HUD (screen space)
        this.hud.draw(p5, this.player, this.spawner, this.upgradeSystem);
        
        // Draw minimap
        this.minimap.draw(p5, this.player, this.spawner.enemies, this.spawner.boss);
        
        // Draw upgrade selection
        if (this.state === GameState.UPGRADE_SELECT) {
            this.upgradeSystem.draw(p5, p5.width, p5.height);
        }
        
        // Debug overlays
        if (this.debug.enabled) {
            this.debug.drawSpatialHash(p5, this.spatialHash, this.camera);
            this.debug.drawFPS(p5, this.loop.getFPS());
            
            this.debug.drawInfo(p5, 10, p5.height - 100, [
                `Enemies: ${this.spawner.getEnemyCount()}`,
                `Particles: ${this.particles.particles.length}`,
                `Wave: ${this.spawner.currentWave}/${this.spawner.totalWaves}`,
                `State: ${this.spawner.state}`
            ]);
        }
    }
    
    drawGround(p5) {
        const tileSize = WORLD.TILE_SIZE;
        const bounds = this.camera.getVisibleBounds();
        
        const startX = Math.floor(bounds.left / tileSize) * tileSize;
        const startY = Math.floor(bounds.top / tileSize) * tileSize;
        const endX = Math.ceil(bounds.right / tileSize) * tileSize;
        const endY = Math.ceil(bounds.bottom / tileSize) * tileSize;
        
        p5.noStroke();
        
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                p5.fill(isEven ? COLORS.GROUND_1 : COLORS.GROUND_2);
                p5.rect(x, y, tileSize, tileSize);
            }
        }
        
        // World border
        p5.noFill();
        p5.stroke(100, 50, 50);
        p5.strokeWeight(4);
        p5.rect(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    }
    
    drawObstacles(p5) {
        p5.fill(COLORS.OBSTACLE);
        p5.stroke(COLORS.OBSTACLE_STROKE);
        p5.strokeWeight(2);
        
        for (const obs of this.obstacles) {
            p5.rect(obs.x, obs.y, obs.width, obs.height, 4);
        }
    }
    
    tick(currentTime) {
        this.loop.tick(currentTime);
    }
    
    resize(width, height) {
        this.camera.resize(width, height);
    }
    
    // Input passthrough
    keyPressed(keyCode) {
        this.audio.resume(); // Resume audio on first input
        
        // Upgrade selection keys
        if (this.state === GameState.UPGRADE_SELECT) {
            if (keyCode >= 49 && keyCode <= 51) { // 1, 2, 3
                const index = keyCode - 49;
                if (this.upgradeSystem.selectUpgrade(index, this.player)) {
                    this.state = GameState.PLAYING;
                    this.loop.resume();
                }
            }
            if (keyCode === 37 || keyCode === 65) { // Left or A
                this.upgradeSystem.navigateSelection(-1);
            }
            if (keyCode === 39 || keyCode === 68) { // Right or D
                this.upgradeSystem.navigateSelection(1);
            }
            if (keyCode === 13 || keyCode === 32) { // Enter or Space
                if (this.upgradeSystem.selectUpgrade(this.upgradeSystem.selectedIndex, this.player)) {
                    this.state = GameState.PLAYING;
                    this.loop.resume();
                }
            }
            return;
        }
        
        this.input.keyPressed(keyCode);
    }
    
    keyReleased(keyCode) {
        this.input.keyReleased(keyCode);
    }
    
    mousePressed(button) {
        this.audio.resume();
        
        if (this.state === GameState.UPGRADE_SELECT) {
            if (this.upgradeSystem.handleClick(this.p5.mouseX, this.p5.mouseY, this.p5.width, this.p5.height, this.player)) {
                this.state = GameState.PLAYING;
                this.loop.resume();
            }
            return;
        }
        
        this.input.mousePressed(button);
    }
    
    mouseReleased(button) {
        this.input.mouseReleased(button);
    }
    
    mouseMoved(x, y) {
        this.input.mouseMoved(x, y);
    }
    
    restart() {
        // Reset player
        this.player = new Player(WORLD.WIDTH / 2, WORLD.HEIGHT / 2);
        this.camera.setTarget(this.player);
        
        // Reset spawner
        this.spawner.reset();
        this.spawner.onEnemyDeath = (enemy) => {
            this.player.addXP(enemy.xpValue);
            this.player.addCoins(enemy.coinValue);
            this.particles.deathBurst(enemy.pos.x, enemy.pos.y, enemy.baseColor || '#f44');
            this.audio.playEnemyDeath();
            
            if (this.upgradeSystem.checkLevelUp(this.player)) {
                this.state = GameState.UPGRADE_SELECT;
                this.loop.pause();
                this.audio.playLevelUp();
            }
        };
        this.spawner.onVictory = () => {
            this.state = GameState.VICTORY;
            this.audio.playVictory();
        };
        
        // Reset systems
        this.upgradeSystem = new UpgradeSystem();
        this.particles.clear();
        this.hud.reset();
        
        // Reset state
        this.state = GameState.PLAYING;
        this.loop.resume();
    }
}
