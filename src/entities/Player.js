// ============================================
// Player - Personnage du joueur (style soldat)
// ============================================

import { Vehicle } from './Entity.js';
import { Vec2 } from '../math/Vec2.js';
import { PLAYER, COLORS } from '../config.js';

export class Player extends Vehicle {
    constructor(x, y) {
        super(x, y, PLAYER.RADIUS);
        
        // Propriétés de mouvement
        this.maxSpeed = PLAYER.MAX_SPEED;
        this.acceleration = PLAYER.ACCELERATION;
        this.friction = PLAYER.FRICTION;
        
        // Points de vie
        this.maxHp = PLAYER.MAX_HP;
        this.hp = this.maxHp;
        
        // Statistiques de combat
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
        
        // État
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
        // Mise à jour des timers
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
        
        // Mouvement
        if (!this.isDashing) {
            const moveInput = input.getMovementVector();
            
            if (!moveInput.isZero()) {
                isMoving = true;
                this.walkTimer += dt * 15; // Vitesse d'animation
                
                // Accélérer dans la direction d'entrée
                const accel = moveInput.mult(this.acceleration * dt);
                this.vel.addSelf(accel);
            } else {
                this.walkTimer = 0;
                // Appliquer la friction sans entrée
                this.vel.multSelf(1 - this.friction * dt);
            }
            
            // Limiter à la vitesse maximale
            this.vel.limitSelf(this.maxSpeed);
        } else {
            // Dash - se déplacer dans la direction du dash
            this.vel = this.dashDirection.mult(this.dashSpeed);
        }
        
        // Logique de visée automatique et tir
        const nearestEnemy = this.findNearestEnemy(enemies);
        if (nearestEnemy) {
            this.aimDirection = nearestEnemy.pos.sub(this.pos).normalize();
            this.startAttack(); // Tir automatique si ennemi à portée
        } else {
            // Repli sur la souris si pas d'ennemi proche
            const mousePos = input.getWorldMousePos();
            const toMouse = mousePos.sub(this.pos);
            if (!toMouse.isZero()) {
                if (isMoving) {
                    this.aimDirection = toMouse.normalize();
                } else {
                    this.aimDirection = toMouse.normalize();
                }
            }
        }
        
        // Mise à jour de la position
        this.pos.addSelf(this.vel.mult(dt));
        
        // Mise à jour des projectiles
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
        this.attackTimer = 0.1; // Court recul visuel
        this.attackCooldownTimer = this.attackCooldown;
        
        // Tirer un projectile
        this.projectiles.push({
            pos: this.pos.add(this.aimDirection.mult(this.r)),
            vel: this.aimDirection.mult(PLAYER.PROJECTILE_SPEED),
            radius: PLAYER.PROJECTILE_RADIUS,
            damage: PLAYER.PROJECTILE_DAMAGE + (this.damage - PLAYER.ATTACK_DAMAGE),
            lifetime: PLAYER.PROJECTILE_LIFETIME,
            alive: true
        });
        
        return true;
    }
    
    startDash() {
        if (this.dashCooldownTimer > 0 || this.isDashing) return false;
        
        // Dash dans la direction du mouvement si en mouvement
        if (!this.vel.isZero() && this.vel.mag() > 10) {
            this.dashDirection = this.vel.normalize();
        } else {
            this.dashDirection = this.aimDirection.copy();
        }
        
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;
        this.invulnTimer = this.dashDuration; // Invulnérable pendant le dash
        
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
    
    // Appliquer une amélioration
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
                this.attackCooldown = Math.max(0.1, this.attackCooldown * 0.9);
                break;
            case 'attackRange':
                PLAYER.PROJECTILE_SPEED += 50;
                break;
        }
    }
    
    // ========================================
    // Affichage
    // ========================================
    
    show(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash quand touché ou invulnérable
        const flashing = this.hitFlashTimer > 0 || (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0);
        
        // Traînée du dash
        if (this.isDashing) {
            p5.noStroke();
            p5.fill(68, 170, 255, 100);
            for (let i = 1; i <= 3; i++) {
                const trailPos = this.dashDirection.mult(-i * 15);
                const size = this.r * 2 * (1 - i * 0.2);
                p5.circle(trailPos.x, trailPos.y, size);
            }
        }
        
        // Vérifier la direction
        const isLeft = this.aimDirection.x < 0;
        
        p5.push();
        if (isLeft) {
            p5.scale(-1, 1);
        }
        
        // Animation de balancement
        const bob = Math.sin(this.walkTimer) * 3;
        p5.translate(0, bob);
        
        if (this.sprite) {
            // Dessiner le sprite
            if (flashing) {
                p5.tint(255);
            }
            
            p5.imageMode(p5.CENTER);
            const scale = (this.r * 3.5) / 32;
            p5.scale(scale);
            p5.image(this.sprite, 0, -8);
        } else {
            // Rendu de secours
            p5.scale(isLeft ? -1 : 1, 1);
            const aimAngle = this.aimDirection.heading();
            p5.rotate(aimAngle);

            if (flashing) {
                p5.fill(255);
                p5.noStroke();
                p5.circle(0, 0, this.r * 2);
            } else {
                p5.fill(COLORS.PLAYER_GUN);
                p5.noStroke();
                p5.rect(0, -4, this.r * 1.8, 8);
                p5.fill(COLORS.PLAYER);
                p5.circle(0, 0, this.r * 2);
                p5.fill(COLORS.PLAYER_HELMET);
                p5.arc(0, 0, this.r * 2, this.r * 2, -p5.HALF_PI - 1, -p5.HALF_PI + 1, p5.CHORD);
            }
        }
        p5.pop();
        
        // Mode debug
        if (Vehicle.debug) {
            p5.stroke(0, 255, 0);
            p5.strokeWeight(2);
            p5.line(0, 0, this.vel.x * 0.5, this.vel.y * 0.5);
            
            p5.stroke(255, 0, 0);
            p5.line(0, 0, this.aimDirection.x * 30, this.aimDirection.y * 30);
        }
        
        p5.pop();
        
        // Dessiner les projectiles
        for (const proj of this.projectiles) {
            p5.push();
            p5.noStroke();
            p5.fill(PLAYER.PROJECTILE_COLOR);
            p5.circle(proj.pos.x, proj.pos.y, proj.radius * 2);
            // Traînée
            p5.fill(255, 255, 100, 100);
            p5.circle(proj.pos.x - proj.vel.x * 0.01, proj.pos.y - proj.vel.y * 0.01, proj.radius * 1.5);
            p5.pop();
        }
    }
}
