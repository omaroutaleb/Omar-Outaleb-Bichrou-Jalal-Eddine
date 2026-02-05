// ============================================
// Entity - Base Entity Class
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { ENEMY } from '../config.js';

export class Entity {
    constructor(x, y, radius) {
        this.pos = new Vec2(x, y);
        this.vel = Vec2.zero();
        this.acc = Vec2.zero();
        
        this.radius = radius;
        this.maxSpeed = 100;
        this.maxForce = 200;
        
        this.hp = 100;
        this.maxHp = 100;
        this.alive = true;
        
        this.hitFlashTimer = 0;
        this.invulnTimer = 0;
        
        // For steering wander behavior
        this.wanderAngle = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        // Base update - integrate physics
        this.vel.addSelf(this.acc.mult(dt));
        this.vel.limitSelf(this.maxSpeed);
        this.pos.addSelf(this.vel.mult(dt));
        this.acc.set(0, 0);
        
        // Timers
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }
    }
    
    applyForce(force) {
        this.acc.addSelf(force);
    }
    
    takeDamage(amount) {
        if (this.invulnTimer > 0) return false;
        
        this.hp -= amount;
        this.hitFlashTimer = ENEMY.HIT_FLASH_DURATION;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.onDeath();
        }
        
        return true;
    }
    
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }
    
    onDeath() {
        // Override in subclasses
    }
    
    draw(p5) {
        // Override in subclasses
    }
    
    // Check if entity is within distance of another position
    isNear(pos, distance) {
        return this.pos.distSq(pos) < distance * distance;
    }
    
    // Get direction toward another entity or position
    directionTo(target) {
        const targetPos = target.pos || target;
        return targetPos.sub(this.pos).normalize();
    }
    
    // Get distance to another entity or position
    distanceTo(target) {
        const targetPos = target.pos || target;
        return this.pos.dist(targetPos);
    }
}
