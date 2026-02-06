// ============================================
// Enemy - Classe de base pour les ennemis
// ============================================

import { Vehicle } from '../Entity.js';
import { Vec2 } from '../../math/Vec2.js';
import { ENEMY } from '../../config.js';

export const EnemyState = {
    IDLE: 'idle',
    PURSUING: 'pursuing',
    ATTACKING: 'attacking',
    STUNNED: 'stunned',
    FLEEING: 'fleeing'
};

export class Enemy extends Vehicle {
    constructor(x, y, radius, config) {
        super(x, y, radius);
        
        // Propriétés de mouvement
        this.maxSpeed = config.MAX_SPEED;
        this.maxForce = config.MAX_FORCE;
        
        // Points de vie
        this.maxHp = config.HP;
        this.hp = config.HP;
        
        // Combat
        this.damage = config.DAMAGE;
        this.xpValue = config.XP_VALUE;
        this.coinValue = config.COIN_VALUE;
        
        // État
        this.state = EnemyState.IDLE;
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.contactCooldown = 0;
        
        // Couleur de base
        this.baseColor = '#f00';
        
        // Force de pilotage actuelle (pour debug)
        this.currentSteeringForce = Vec2.zero();
        
        // Callback de mort
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
        
        // Mise à jour des timers
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        if (this.contactCooldown > 0) {
            this.contactCooldown -= dt;
        }
        
        // Calcul de la force de pilotage (à surcharger)
        const steering = this.calculateSteering(dt, player, spatialHash, obstacles, bounds);
        this.currentSteeringForce = steering;
        
        // Application de la force (limitée par maxForce)
        this.applyForce(steering.limit(this.maxForce));
        
        // Intégration de la physique (vélocité = vélocité + accélération)
        this.vel.addSelf(this.acc.mult(dt));
        this.vel.limitSelf(this.maxSpeed);
        this.pos.addSelf(this.vel.mult(dt));
        this.acc.set(0, 0);
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        // À surcharger dans les sous-classes
        return Vec2.zero();
    }
    
    canDamagePlayer(player) {
        if (this.contactCooldown > 0) return false;
        
        const dist = this.pos.dist(player.pos);
        return dist < this.r + player.r;
    }
    
    onContactWithPlayer(player) {
        this.contactCooldown = 0.5; // Empêche les dégâts rapides
    }
    
    onDeath() {
        if (this.onDeathCallback) {
            this.onDeathCallback(this);
        }
    }
    
    // ========================================
    // Affichage
    // ========================================
    
    show(p5) {
        // À surcharger dans les sous-classes
    }
    
    showBase(p5, color, shape = 'circle') {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash blanc quand touché
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : color;
        
        p5.noStroke();
        p5.fill(drawColor);
        
        if (shape === 'circle') {
            p5.circle(0, 0, this.r * 2);
        } else if (shape === 'triangle') {
            const angle = this.vel.isZero() ? 0 : this.vel.heading();
            p5.rotate(angle);
            p5.triangle(
                this.r, 0,
                -this.r, -this.r * 0.7,
                -this.r, this.r * 0.7
            );
        } else if (shape === 'diamond') {
            const angle = this.vel.isZero() ? 0 : this.vel.heading();
            p5.rotate(angle);
            p5.beginShape();
            p5.vertex(this.r, 0);
            p5.vertex(0, -this.r * 0.6);
            p5.vertex(-this.r, 0);
            p5.vertex(0, this.r * 0.6);
            p5.endShape(p5.CLOSE);
        }
        
        // Barre de vie pour les ennemis blessés
        if (this.hp < this.maxHp) {
            const barWidth = this.r * 2;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;
            
            p5.fill(60, 60, 60);
            p5.rect(-barWidth / 2, -this.r - 10, barWidth, barHeight);
            p5.fill(hpPercent > 0.3 ? '#4a4' : '#a44');
            p5.rect(-barWidth / 2, -this.r - 10, barWidth * hpPercent, barHeight);
        }
        
        // Mode debug: afficher la force de pilotage
        if (Vehicle.debug) {
            p5.stroke(0, 255, 255);
            p5.strokeWeight(2);
            const force = this.currentSteeringForce.mult(0.3);
            p5.line(0, 0, force.x, force.y);
        }
        
        p5.pop();
    }
}
