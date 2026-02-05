// ============================================
// Enemy - Base Enemy Class
// ============================================

import { Entity } from '../Entity.js';
import { Vec2 } from '../../math/Vec2.js';
import { ENEMY } from '../../config.js';

export const EnemyState = {
    IDLE: 'idle',
    PURSUING: 'pursuing',
    ATTACKING: 'attacking',
    STUNNED: 'stunned',
    FLEEING: 'fleeing'
};

export class Enemy extends Entity {
    constructor(x, y, radius, config) {
        super(x, y, radius);
        
        this.maxSpeed = config.MAX_SPEED;
        this.maxForce = config.MAX_FORCE;
        this.maxHp = config.HP;
        this.hp = config.HP;
        this.damage = config.DAMAGE;
        this.xpValue = config.XP_VALUE;
        this.coinValue = config.COIN_VALUE;
        
        this.state = EnemyState.IDLE;
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.contactCooldown = 0;
        
        this.baseColor = '#f00';
        this.currentSteeringForce = Vec2.zero();
        
        // Callbacks
        this.onDeathCallback = null;
    }
    
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.stateTimer = 0;
        }
    }
    
    update(dt, player, spatialHash, obstacles, bounds) {
        this.stateTimer += dt;
        
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        if (this.contactCooldown > 0) {
            this.contactCooldown -= dt;
        }
        
        // Get steering force from subclass
        const steering = this.calculateSteering(dt, player, spatialHash, obstacles, bounds);
        this.currentSteeringForce = steering;
        
        // Apply steering
        this.applyForce(steering.limit(this.maxForce));
        
        // Integrate physics
        this.vel.addSelf(this.acc.mult(dt));
        this.vel.limitSelf(this.maxSpeed);
        this.pos.addSelf(this.vel.mult(dt));
        this.acc.set(0, 0);
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        // Override in subclasses
        return Vec2.zero();
    }
    
    canDamagePlayer(player) {
        if (this.contactCooldown > 0) return false;
        
        const dist = this.pos.dist(player.pos);
        return dist < this.radius + player.radius;
    }
    
    onContactWithPlayer(player) {
        this.contactCooldown = 0.5; // Prevent rapid damage
    }
    
    onDeath() {
        if (this.onDeathCallback) {
            this.onDeathCallback(this);
        }
    }
    
    draw(p5) {
        // Override in subclasses
    }
    
    drawBase(p5, color, shape = 'circle') {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash white when hit
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : color;
        
        p5.noStroke();
        p5.fill(drawColor);
        
        if (shape === 'circle') {
            p5.circle(0, 0, this.radius * 2);
        } else if (shape === 'triangle') {
            const angle = this.vel.isZero() ? 0 : this.vel.heading();
            p5.rotate(angle);
            p5.triangle(
                this.radius, 0,
                -this.radius, -this.radius * 0.7,
                -this.radius, this.radius * 0.7
            );
        } else if (shape === 'diamond') {
            const angle = this.vel.isZero() ? 0 : this.vel.heading();
            p5.rotate(angle);
            p5.beginShape();
            p5.vertex(this.radius, 0);
            p5.vertex(0, -this.radius * 0.6);
            p5.vertex(-this.radius, 0);
            p5.vertex(0, this.radius * 0.6);
            p5.endShape(p5.CLOSE);
        }
        
        // Health bar for damaged enemies
        if (this.hp < this.maxHp) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;
            
            p5.fill(60, 60, 60);
            p5.rect(-barWidth / 2, -this.radius - 10, barWidth, barHeight);
            p5.fill(hpPercent > 0.3 ? '#4a4' : '#a44');
            p5.rect(-barWidth / 2, -this.radius - 10, barWidth * hpPercent, barHeight);
        }
        
        p5.pop();
    }
}
