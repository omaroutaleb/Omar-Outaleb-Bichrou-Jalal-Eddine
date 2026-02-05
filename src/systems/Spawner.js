// ============================================
// Spawner - Wave-based Enemy Spawning System
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { SPAWNER, WORLD, BOSS } from '../config.js';
import { Grunt } from '../entities/enemies/Grunt.js';
import { Swarm } from '../entities/enemies/Swarm.js';
import { Ranger } from '../entities/enemies/Ranger.js';
import { Boss } from '../entities/Boss.js';

export const SpawnerState = {
    WAVES: 'waves',
    WAVE_COMPLETE: 'wave_complete',
    BOSS_SPAWNED: 'boss_spawned',
    VICTORY: 'victory',
    GAME_OVER: 'game_over'
};

export class Spawner {
    constructor() {
        this.state = SpawnerState.WAVES;
        this.currentWave = 0;
        this.totalWaves = SPAWNER.WAVE_COUNT;
        this.waveDelay = SPAWNER.WAVE_DELAY;
        this.waveDelayTimer = 0;
        
        this.enemies = [];
        this.boss = null;
        this.projectiles = [];
        
        this.objective = "Clear the waves";
        
        // Callbacks
        this.onEnemyDeath = null;
        this.onBossSpawn = null;
        this.onVictory = null;
    }
    
    getEnemyCountForWave(wave) {
        return SPAWNER.BASE_ENEMIES_PER_WAVE + wave * SPAWNER.ENEMIES_PER_WAVE_INCREASE;
    }
    
    spawnWave() {
        this.currentWave++;
        const count = this.getEnemyCountForWave(this.currentWave);
        
        // Spawn enemies at arena edges
        for (let i = 0; i < count; i++) {
            const enemy = this.createRandomEnemy(this.currentWave);
            this.enemies.push(enemy);
            
            enemy.onDeathCallback = (e) => {
                if (this.onEnemyDeath) this.onEnemyDeath(e);
            };
        }
        
        this.objective = `Wave ${this.currentWave}/${this.totalWaves}`;
    }
    
    createRandomEnemy(wave) {
        const pos = this.getEdgeSpawnPosition();
        
        // Weighted random based on wave number
        const roll = Math.random();
        const swarmChance = 0.5;
        const rangerChance = Math.min(0.3, wave * 0.05);
        
        if (roll < rangerChance && wave >= 2) {
            return new Ranger(pos.x, pos.y);
        } else if (roll < rangerChance + swarmChance) {
            return new Swarm(pos.x, pos.y);
        } else {
            return new Grunt(pos.x, pos.y);
        }
    }
    
    getEdgeSpawnPosition() {
        const margin = SPAWNER.SPAWN_MARGIN;
        const side = Math.floor(Math.random() * 4);
        
        switch (side) {
            case 0: // Top
                return new Vec2(
                    margin + Math.random() * (WORLD.WIDTH - margin * 2),
                    margin
                );
            case 1: // Right
                return new Vec2(
                    WORLD.WIDTH - margin,
                    margin + Math.random() * (WORLD.HEIGHT - margin * 2)
                );
            case 2: // Bottom
                return new Vec2(
                    margin + Math.random() * (WORLD.WIDTH - margin * 2),
                    WORLD.HEIGHT - margin
                );
            case 3: // Left
                return new Vec2(
                    margin,
                    margin + Math.random() * (WORLD.HEIGHT - margin * 2)
                );
        }
    }
    
    spawnBoss() {
        this.boss = new Boss(BOSS.SPAWN_X, BOSS.SPAWN_Y);
        this.state = SpawnerState.BOSS_SPAWNED;
        this.objective = "Defeat the Boss!";
        
        this.boss.onDeathCallback = () => {
            this.state = SpawnerState.VICTORY;
            this.objective = "Victory!";
            if (this.onVictory) this.onVictory();
        };
        
        this.boss.onSpawnAdds = (pos, count) => {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const offset = Vec2.fromAngle(angle, 80);
                const enemy = new Swarm(pos.x + offset.x, pos.y + offset.y);
                enemy.onDeathCallback = (e) => {
                    if (this.onEnemyDeath) this.onEnemyDeath(e);
                };
                this.enemies.push(enemy);
            }
        };
        
        this.boss.onSlam = (pos, radius, damage) => {
            // Handled in Game.js
        };
        
        if (this.onBossSpawn) this.onBossSpawn(this.boss);
    }
    
    update(dt, player, spatialHash, obstacles, bounds) {
        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.alive);
        
        // Collect all projectiles from Rangers
        this.projectiles = [];
        for (const enemy of this.enemies) {
            if (enemy instanceof Ranger) {
                this.projectiles.push(...enemy.projectiles);
            }
        }
        
        // Update based on state
        switch (this.state) {
            case SpawnerState.WAVES:
                if (this.enemies.length === 0) {
                    if (this.currentWave >= this.totalWaves) {
                        // All waves complete, spawn boss
                        this.state = SpawnerState.WAVE_COMPLETE;
                        this.waveDelayTimer = this.waveDelay;
                        this.objective = "Boss incoming...";
                    } else if (this.currentWave === 0) {
                        // Start first wave
                        this.spawnWave();
                    } else {
                        // Wave complete, wait for next
                        this.state = SpawnerState.WAVE_COMPLETE;
                        this.waveDelayTimer = this.waveDelay;
                    }
                }
                break;
                
            case SpawnerState.WAVE_COMPLETE:
                this.waveDelayTimer -= dt;
                if (this.waveDelayTimer <= 0) {
                    if (this.currentWave >= this.totalWaves) {
                        this.spawnBoss();
                    } else {
                        this.spawnWave();
                        this.state = SpawnerState.WAVES;
                    }
                }
                break;
                
            case SpawnerState.BOSS_SPAWNED:
                if (this.boss && !this.boss.alive) {
                    this.state = SpawnerState.VICTORY;
                }
                break;
        }
        
        // Update all enemies
        for (const enemy of this.enemies) {
            enemy.update(dt, player, spatialHash, obstacles, bounds);
        }
        
        // Update boss
        if (this.boss && this.boss.alive) {
            this.boss.update(dt, player, spatialHash, obstacles, bounds);
        }
    }
    
    getAllEntities() {
        const entities = [...this.enemies];
        if (this.boss && this.boss.alive) {
            entities.push(this.boss);
        }
        return entities;
    }
    
    getEnemyCount() {
        return this.enemies.length + (this.boss && this.boss.alive ? 1 : 0);
    }
    
    reset() {
        this.state = SpawnerState.WAVES;
        this.currentWave = 0;
        this.waveDelayTimer = 0;
        this.enemies = [];
        this.boss = null;
        this.projectiles = [];
        this.objective = "Clear the waves";
    }
}
