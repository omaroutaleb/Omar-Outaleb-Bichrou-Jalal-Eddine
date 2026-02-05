// ============================================
// Player - Player Character
// ============================================

import { Entity } from './Entity.js';
import { Vec2 } from '../math/Vec2.js';
import { PLAYER, COLORS } from '../config.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER.RADIUS);
        
        this.maxSpeed = PLAYER.MAX_SPEED;
        this.acceleration = PLAYER.ACCELERATION;
        this.friction = PLAYER.FRICTION;
        
        this.maxHp = PLAYER.MAX_HP;
        this.hp = this.maxHp;
        
        // Combat stats
        this.damage = PLAYER.ATTACK_DAMAGE;
        this.attackRange = PLAYER.ATTACK_RANGE;
        this.attackArc = PLAYER.ATTACK_ARC;
        this.attackDuration = PLAYER.ATTACK_DURATION;
        this.attackCooldown = PLAYER.ATTACK_COOLDOWN;
        
        // Dash
        this.dashSpeed = PLAYER.DASH_SPEED;
        this.dashDuration = PLAYER.DASH_DURATION;
        this.dashCooldown = PLAYER.DASH_COOLDOWN;
        
        // Timers
        this.attackTimer = 0;
        this.attackCooldownTimer = 0;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.invulnDuration = PLAYER.INVULN_DURATION;
        
        // State
        this.isAttacking = false;
        this.isDashing = false;
        this.aimDirection = new Vec2(1, 0);
        this.dashDirection = new Vec2(1, 0);
        
        // Progression
        this.xp = 0;
        this.level = 1;
        this.coins = 0;
        
        // Projectiles
        this.projectiles = [];
        this.sprite = null;
        this.walkTimer = 0;
    }
    
    setSprite(img) {
        this.sprite = img;
    }
    
    update(dt, input, enemies) {
        // Update timers
        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }
        if (this.attackCooldownTimer > 0) {
            this.attackCooldownTimer -= dt;
        }
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= dt;
        }
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        
        let isMoving = false;
        
        // Movement
        if (!this.isDashing) {
            const moveInput = input.getMovementVector();
            
            if (!moveInput.isZero()) {
                isMoving = true;
                this.walkTimer += dt * 15; // Animation speed
                
                // Accelerate in input direction
                const accel = moveInput.mult(this.acceleration * dt);
                this.vel.addSelf(accel);
            } else {
                this.walkTimer = 0;
                // Apply friction when no input
                this.vel.multSelf(1 - this.friction * dt);
            }
            
            // Clamp to max speed
            this.vel.limitSelf(this.maxSpeed);
        } else {
            // Dashing - move in dash direction at dash speed
            this.vel = this.dashDirection.mult(this.dashSpeed);
        }
        
        // Auto-Aim Logic & Auto-Fire
        const nearestEnemy = this.findNearestEnemy(enemies);
        if (nearestEnemy) {
            this.aimDirection = nearestEnemy.pos.sub(this.pos).normalize();
            this.startAttack(); // Auto-fire if enemy in range
        } else {
            // Fallback to mouse if no enemy nearby
            const mousePos = input.getWorldMousePos();
            const toMouse = mousePos.sub(this.pos);
            if (!toMouse.isZero()) {
                // Determine direction based on movement if not aiming at enemy
                if (isMoving) {
                    // Optional: Look where moving if not aiming?
                    // For now keep mouse aim as fallback
                     this.aimDirection = toMouse.normalize();
                } else {
                    this.aimDirection = toMouse.normalize();
                }
            }
        }
        
        // Update position
        this.pos.addSelf(this.vel.mult(dt));
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.pos.addSelf(p.vel.mult(dt));
            p.lifetime -= dt;
            if (p.lifetime <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    findNearestEnemy(enemies) {
        let nearest = null;
        let minDistSq = PLAYER.AUTO_AIM_RANGE * PLAYER.AUTO_AIM_RANGE;
        
        if (!enemies) return null;
        
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const dSq = this.pos.distSq(enemy.pos);
            if (dSq < minDistSq) {
                minDistSq = dSq;
                nearest = enemy;
            }
        }
        return nearest;
    }
    
    startAttack() {
        if (this.attackCooldownTimer > 0) return false;
        
        this.isAttacking = true;
        this.attackTimer = 0.1; // Short visual recoil
        this.attackCooldownTimer = this.attackCooldown;
        
        // Fire projectile
        this.projectiles.push({
            pos: this.pos.add(this.aimDirection.mult(this.radius)),
            vel: this.aimDirection.mult(PLAYER.PROJECTILE_SPEED),
            radius: PLAYER.PROJECTILE_RADIUS,
            damage: PLAYER.PROJECTILE_DAMAGE + (this.damage - PLAYER.ATTACK_DAMAGE), // Apply upgrades
            lifetime: PLAYER.PROJECTILE_LIFETIME,
            alive: true
        });
        
        return true;
    }
    
    startDash() {
        if (this.dashCooldownTimer > 0 || this.isDashing) return false;
        
        // Dash in movement direction if moving, otherwise aim direction
        if (!this.vel.isZero() && this.vel.mag() > 10) {
            this.dashDirection = this.vel.normalize();
        } else {
            this.dashDirection = this.aimDirection.copy();
        }
        
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;
        this.invulnTimer = this.dashDuration; // Invulnerable during dash
        
        return true;
    }
    
    takeDamage(amount) {
        if (this.invulnTimer > 0) return false;
        
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        this.invulnTimer = this.invulnDuration;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        
        return true;
    }
    
    addXP(amount) {
        this.xp += amount;
    }
    
    addCoins(amount) {
        this.coins += amount;
    }
    
    // Apply an upgrade
    applyUpgrade(upgrade) {
        switch(upgrade.type) {
            case 'maxHp':
                this.maxHp += upgrade.value;
                this.hp += upgrade.value;
                break;
            case 'damage':
                this.damage += upgrade.value;
                break;
            case 'speed':
                this.maxSpeed += upgrade.value;
                break;
            case 'dashCooldown':
                this.dashCooldown = Math.max(0.2, this.dashCooldown - upgrade.value);
                break;
            case 'attackArc':
                // For gun, maybe increase projectile size or speed?
                // Keeping as dummy for now or converting to Fire Rate could be good
                this.attackCooldown = Math.max(0.1, this.attackCooldown * 0.9);
                break;
            case 'attackRange':
                // Increase projectile lifetime/speed
                PLAYER.PROJECTILE_SPEED += 50;
                break;
        }
    }
    
    draw(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash when hit or invulnerable
        const flashing = this.hitFlashTimer > 0 || (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0);
        
        // Draw dash trail
        if (this.isDashing) {
            p5.noStroke();
            p5.fill(68, 170, 255, 100);
            for (let i = 1; i <= 3; i++) {
                const trailPos = this.dashDirection.mult(-i * 15);
                const size = this.radius * 2 * (1 - i * 0.2);
                p5.circle(trailPos.x, trailPos.y, size);
            }
        }
        
        // Check facing direction
        const isLeft = this.aimDirection.x < 0;
        
        p5.push();
        if (isLeft) {
            p5.scale(-1, 1);
        }
        
        // Bobbing animation
        const bob = Math.sin(this.walkTimer) * 3;
        p5.translate(0, bob);
        
        if (this.sprite) {
            // Draw Sprite
            if (flashing) {
                p5.tint(255); // Just simple tint, ideally we use shader for white flash but this is close enough
                // Or draw white rect over it
            }
            
            p5.imageMode(p5.CENTER);
            // Scale sprite to fit radius roughly (adjust scale as needed)
            // Visual size should be slightly larger than hitbox for top-down view
            const scale = (this.radius * 3.5) / 32; // Increased multiplier for better visibility
            p5.scale(scale); 
            p5.image(this.sprite, 0, -8); // Offset slightly up to center on feet
        } else {
            // Fallback Rendering
            
            // Rotate body to face aim direction (only for simple shapes)
            // But we are in scale(-1, 1) mode so rotation needs correction if we used it.
            // Simplified fallback:
            
            p5.scale(isLeft ? -1 : 1, 1); 
            const aimAngle = this.aimDirection.heading();
            p5.rotate(aimAngle);

            if (flashing) {
                p5.fill(255);
                p5.noStroke();
                p5.circle(0, 0, this.radius * 2);
            } else {
                p5.fill(COLORS.PLAYER_GUN);
                p5.noStroke();
                p5.rect(0, -4, this.radius * 1.8, 8); 
                p5.fill(COLORS.PLAYER);
                p5.circle(0, 0, this.radius * 2);
                p5.fill(COLORS.PLAYER_HELMET);
                p5.arc(0, 0, this.radius * 2, this.radius * 2, -p5.HALF_PI - 1, -p5.HALF_PI + 1, p5.CHORD);
            }
        }
        p5.pop();
        
        p5.pop();
        
        // Draw projectiles
        for (const p of this.projectiles) {
            p5.push();
            p5.noStroke();
            p5.fill(PLAYER.PROJECTILE_COLOR);
            p5.circle(p.pos.x, p.pos.y, p.radius * 2);
            // Trail
            p5.fill(255, 255, 100, 100);
            p5.circle(p.pos.x - p.vel.x * 0.01, p.pos.y - p.vel.y * 0.01, p.radius * 1.5);
            p5.pop();
        }
    }
}
