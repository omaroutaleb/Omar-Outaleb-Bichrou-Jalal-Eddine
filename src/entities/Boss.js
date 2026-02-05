// ============================================
// Boss - Two-Phase Boss Enemy
// ============================================

import { Entity } from './Entity.js';
import { Vec2 } from '../math/Vec2.js';
import { BOSS, COLORS } from '../config.js';
import { Steering } from '../steering/Steering.js';
import * as Behaviors from '../steering/Behaviors.js';

export const BossPhase = {
    PHASE1: 1,
    PHASE2: 2
};

export const BossState = {
    IDLE: 'idle',
    PURSUING: 'pursuing',
    CHARGING: 'charging',
    SLAMMING: 'slamming',
    SPAWNING: 'spawning'
};

export class Boss extends Entity {
    constructor(x, y) {
        super(x, y, BOSS.RADIUS);
        
        this.maxSpeed = BOSS.MAX_SPEED;
        this.maxForce = BOSS.MAX_FORCE;
        this.maxHp = BOSS.HP;
        this.hp = BOSS.HP;
        this.damage = BOSS.DAMAGE;
        this.xpValue = BOSS.XP_VALUE;
        this.coinValue = BOSS.COIN_VALUE;
        
        this.phase = BossPhase.PHASE1;
        this.state = BossState.PURSUING;
        this.stateTimer = 0;
        
        this.spawnTimer = BOSS.PHASE1_SPAWN_INTERVAL;
        this.chargeCooldown = BOSS.CHARGE_COOLDOWN;
        this.slamCooldown = BOSS.SLAM_COOLDOWN;
        
        this.chargeDirection = Vec2.zero();
        this.chargeTimer = 0;
        this.slamTimer = 0;
        this.slamHitPlayer = false;
        
        this.currentSteeringForce = Vec2.zero();
        
        // Callbacks
        this.onSpawnAdds = null;
        this.onSlam = null;
        this.onDeathCallback = null;
        
        this.pulseTimer = 0;
    }
    
    update(dt, player, spatialHash, obstacles, bounds) {
        this.stateTimer += dt;
        this.pulseTimer += dt;
        
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        
        // Phase transition at 60% HP
        if (this.phase === BossPhase.PHASE1 && this.hp <= this.maxHp * 0.6) {
            this.enterPhase2();
        }
        
        // State machine
        switch (this.state) {
            case BossState.PURSUING:
                this.updatePursuing(dt, player, spatialHash, obstacles, bounds);
                break;
            case BossState.CHARGING:
                this.updateCharging(dt, player);
                break;
            case BossState.SLAMMING:
                this.updateSlamming(dt, player);
                break;
            case BossState.SPAWNING:
                this.updateSpawning(dt);
                break;
        }
        
        // Cooldowns
        if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
        if (this.slamCooldown > 0) this.slamCooldown -= dt;
    }
    
    enterPhase2() {
        this.phase = BossPhase.PHASE2;
        this.maxSpeed = BOSS.MAX_SPEED * BOSS.PHASE2_SPEED_MULT;
        // Visual feedback would go here
    }
    
    updatePursuing(dt, player, spatialHash, obstacles, bounds) {
        // Calculate steering
        const forces = [];
        const weights = [];
        
        forces.push(Behaviors.pursue(this, player, 0.5));
        weights.push(BOSS.PURSUE_WEIGHT);
        
        forces.push(Behaviors.avoidObstacles(this, obstacles, 150));
        weights.push(BOSS.OBSTACLE_AVOIDANCE_WEIGHT);
        
        forces.push(Behaviors.containWithinBounds(this, bounds, 100));
        weights.push(BOSS.BOUNDARY_WEIGHT);
        
        const steering = Steering.combine(forces, weights);
        this.currentSteeringForce = steering;
        
        // Apply movement
        this.applyForce(steering.limit(this.maxForce));
        this.vel.addSelf(this.acc.mult(dt));
        this.vel.limitSelf(this.maxSpeed);
        this.pos.addSelf(this.vel.mult(dt));
        this.acc.set(0, 0);
        
        // Phase 1: Spawn adds periodically
        if (this.phase === BossPhase.PHASE1) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.state = BossState.SPAWNING;
                this.stateTimer = 0;
            }
        }
        
        // Phase 2: Use charge and slam attacks
        if (this.phase === BossPhase.PHASE2) {
            const distToPlayer = this.pos.dist(player.pos);
            
            // Charge attack
            if (this.chargeCooldown <= 0 && distToPlayer > 200) {
                this.startCharge(player);
            }
            // Slam attack when close
            else if (this.slamCooldown <= 0 && distToPlayer < 150) {
                this.startSlam();
            }
        }
    }
    
    updateCharging(dt, player) {
        this.chargeTimer -= dt;
        
        // Move fast in charge direction
        this.vel = this.chargeDirection.mult(BOSS.CHARGE_SPEED);
        this.pos.addSelf(this.vel.mult(dt));
        
        if (this.chargeTimer <= 0) {
            this.state = BossState.PURSUING;
            this.chargeCooldown = BOSS.CHARGE_COOLDOWN;
        }
    }
    
    updateSlamming(dt, player) {
        this.slamTimer -= dt;
        
        // Stop movement during slam
        this.vel.set(0, 0);
        
        // Check for slam hit at the right moment (halfway through)
        if (!this.slamHitPlayer && this.slamTimer < 0.3) {
            if (this.onSlam) {
                this.onSlam(this.pos, BOSS.SLAM_RADIUS, BOSS.SLAM_DAMAGE);
            }
            this.slamHitPlayer = true;
        }
        
        if (this.slamTimer <= 0) {
            this.state = BossState.PURSUING;
            this.slamCooldown = BOSS.SLAM_COOLDOWN;
        }
    }
    
    updateSpawning(dt) {
        // Brief pause while spawning
        this.vel.multSelf(0.9);
        
        if (this.stateTimer > 0.5) {
            // Spawn minions
            if (this.onSpawnAdds) {
                this.onSpawnAdds(this.pos, BOSS.PHASE1_SPAWN_COUNT);
            }
            
            this.spawnTimer = BOSS.PHASE1_SPAWN_INTERVAL;
            this.state = BossState.PURSUING;
        }
    }
    
    startCharge(player) {
        this.state = BossState.CHARGING;
        this.chargeDirection = player.pos.sub(this.pos).normalize();
        this.chargeTimer = BOSS.CHARGE_DURATION;
        this.stateTimer = 0;
    }
    
    startSlam() {
        this.state = BossState.SLAMMING;
        this.slamTimer = 0.6;
        this.slamHitPlayer = false;
        this.stateTimer = 0;
    }
    
    canDamagePlayer(player) {
        const dist = this.pos.dist(player.pos);
        return dist < this.radius + player.radius;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.onDeath();
        }
        
        return true;
    }
    
    onDeath() {
        if (this.onDeathCallback) {
            this.onDeathCallback(this);
        }
    }
    
    draw(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        const baseColor = this.phase === BossPhase.PHASE2 ? COLORS.BOSS_PHASE2 : COLORS.BOSS;
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : baseColor;
        
        // Pulsing effect
        const pulse = 1 + Math.sin(this.pulseTimer * 4) * 0.05;
        
        // Slam telegraph
        if (this.state === BossState.SLAMMING && this.slamTimer > 0.3) {
            p5.noFill();
            p5.stroke(255, 100, 100, 150);
            p5.strokeWeight(3);
            const slamProgress = 1 - (this.slamTimer - 0.3) / 0.3;
            p5.circle(0, 0, BOSS.SLAM_RADIUS * 2 * slamProgress);
        }
        
        // Slam impact
        if (this.state === BossState.SLAMMING && this.slamTimer <= 0.3) {
            p5.noStroke();
            p5.fill(255, 100, 50, 100 * (this.slamTimer / 0.3));
            p5.circle(0, 0, BOSS.SLAM_RADIUS * 2);
        }
        
        // Charge trail
        if (this.state === BossState.CHARGING) {
            p5.noStroke();
            for (let i = 1; i <= 4; i++) {
                const trailPos = this.chargeDirection.mult(-i * 25);
                const alpha = 150 - i * 35;
                p5.fill(this.phase === BossPhase.PHASE2 ? 
                    `rgba(255, 136, 50, ${alpha / 255})` : 
                    `rgba(255, 68, 68, ${alpha / 255})`);
                p5.circle(trailPos.x, trailPos.y, this.radius * 2 * (1 - i * 0.15));
            }
        }
        
        // Main body
        p5.noStroke();
        p5.fill(drawColor);
        
        // Outer ring
        p5.circle(0, 0, this.radius * 2 * pulse);
        
        // Inner body (darker)
        const innerColor = this.phase === BossPhase.PHASE2 ? '#c64' : '#c33';
        p5.fill(this.hitFlashTimer > 0 ? '#ddd' : innerColor);
        p5.circle(0, 0, this.radius * 1.5 * pulse);
        
        // Eyes (menacing)
        p5.fill(255);
        const eyeOffset = this.radius * 0.3;
        p5.circle(-eyeOffset, -eyeOffset * 0.5, 12);
        p5.circle(eyeOffset, -eyeOffset * 0.5, 12);
        
        // Pupils (follow player direction)
        p5.fill(0);
        const dir = this.vel.isZero() ? new Vec2(0, 1) : this.vel.normalize();
        const pupilOffset = dir.mult(3);
        p5.circle(-eyeOffset + pupilOffset.x, -eyeOffset * 0.5 + pupilOffset.y, 6);
        p5.circle(eyeOffset + pupilOffset.x, -eyeOffset * 0.5 + pupilOffset.y, 6);
        
        // Angry eyebrows for phase 2
        if (this.phase === BossPhase.PHASE2) {
            p5.stroke(0);
            p5.strokeWeight(3);
            p5.line(-eyeOffset - 8, -eyeOffset - 8, -eyeOffset + 8, -eyeOffset - 4);
            p5.line(eyeOffset - 8, -eyeOffset - 4, eyeOffset + 8, -eyeOffset - 8);
        }
        
        p5.pop();
    }
}
