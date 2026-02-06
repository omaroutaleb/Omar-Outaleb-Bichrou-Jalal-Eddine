// ============================================
// Ranger - Ennemi à distance qui garde ses distances
// ============================================

import { Enemy, EnemyState } from './Enemy.js';
import { Vehicle } from '../Entity.js';
import { Vec2 } from '../../math/Vec2.js';
import { RANGER, COLORS } from '../../config.js';

export class Ranger extends Enemy {
    constructor(x, y) {
        super(x, y, RANGER.RADIUS, RANGER);
        this.baseColor = COLORS.RANGER;
        this.state = EnemyState.PURSUING;
        
        this.shootCooldown = RANGER.SHOOT_COOLDOWN;
        this.projectiles = [];
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        const distToPlayer = this.pos.dist(player.pos);
        
        let totalForce = Vec2.zero();
        
        // ETAPE 1: Si trop proche, fuir
        if (distToPlayer < RANGER.FLEE_DISTANCE) {
            let fleeForce = this.flee(player.pos, RANGER.FLEE_DISTANCE);
            fleeForce = fleeForce.mult(RANGER.FLEE_WEIGHT);
            totalForce.addSelf(fleeForce);
        } else {
            // ETAPE 2: Arriver à la distance préférée (orbiter autour du joueur)
            const toPlayer = player.pos.sub(this.pos).normalize();
            const targetPos = player.pos.sub(toPlayer.mult(RANGER.PREFERRED_DISTANCE));
            
            let arriveForce = this.arrive(targetPos, 100);
            arriveForce = arriveForce.mult(RANGER.ARRIVE_WEIGHT);
            totalForce.addSelf(arriveForce);
        }
        
        // ETAPE 3: Séparation des autres ennemis
        const neighbors = spatialHash ? spatialHash.queryNear(this, RANGER.SEPARATION_RADIUS) : [];
        let separationForce = this.separation(neighbors, RANGER.SEPARATION_RADIUS);
        separationForce = separationForce.mult(RANGER.SEPARATION_WEIGHT);
        totalForce.addSelf(separationForce);
        
        // ETAPE 4: Évitement d'obstacles
        let avoidForce = this.avoid(obstacles, 80);
        avoidForce = avoidForce.mult(RANGER.OBSTACLE_AVOIDANCE_WEIGHT);
        totalForce.addSelf(avoidForce);
        
        // ETAPE 5: Rester dans les limites
        let boundaryForce = this.containWithinBounds(bounds, 80);
        boundaryForce = boundaryForce.mult(RANGER.BOUNDARY_WEIGHT);
        totalForce.addSelf(boundaryForce);
        
        return totalForce;
    }
    
    // Rester dans les limites du monde
    containWithinBounds(bounds, margin = 50) {
        if (!bounds) return Vec2.zero();
        
        const steer = Vec2.zero();
        
        if (this.pos.x < bounds.left + margin) {
            steer.x = this.maxSpeed;
        } else if (this.pos.x > bounds.right - margin) {
            steer.x = -this.maxSpeed;
        }
        
        if (this.pos.y < bounds.top + margin) {
            steer.y = this.maxSpeed;
        } else if (this.pos.y > bounds.bottom - margin) {
            steer.y = -this.maxSpeed;
        }
        
        if (!steer.isZero()) {
            steer.subSelf(this.vel);
        }
        
        return steer;
    }
    
    update(dt, player, spatialHash, obstacles, bounds) {
        super.update(dt, player, spatialHash, obstacles, bounds);
        
        // Logique de tir
        this.shootCooldown -= dt;
        
        if (this.shootCooldown <= 0) {
            const distToPlayer = this.pos.dist(player.pos);
            
            // Tirer seulement si dans la portée
            if (distToPlayer < RANGER.PREFERRED_DISTANCE + 150 && distToPlayer > RANGER.FLEE_DISTANCE) {
                this.shoot(player);
                this.shootCooldown = RANGER.SHOOT_COOLDOWN;
            }
        }
        
        // Mise à jour des projectiles
        for (const proj of this.projectiles) {
            proj.pos.addSelf(proj.vel.mult(dt));
            proj.lifetime -= dt;
        }
        
        // Supprimer les projectiles morts
        this.projectiles = this.projectiles.filter(p => p.lifetime > 0 && p.alive);
    }
    
    shoot(player) {
        const dir = player.pos.sub(this.pos).normalize();
        const projectile = {
            pos: this.pos.add(dir.mult(this.r + 5)),
            vel: dir.mult(RANGER.PROJECTILE_SPEED),
            radius: RANGER.PROJECTILE_RADIUS,
            damage: RANGER.PROJECTILE_DAMAGE,
            lifetime: 4,
            alive: true
        };
        this.projectiles.push(projectile);
    }
    
    show(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash blanc quand touché
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : this.baseColor;
        
        // Dessin en forme de losange
        const angle = this.vel.isZero() ? 0 : this.vel.heading();
        p5.rotate(angle);
        
        p5.noStroke();
        p5.fill(drawColor);
        
        p5.beginShape();
        p5.vertex(this.r, 0);
        p5.vertex(0, -this.r * 0.7);
        p5.vertex(-this.r, 0);
        p5.vertex(0, this.r * 0.7);
        p5.endShape(p5.CLOSE);
        
        // Cercle intérieur (œil)
        p5.fill(255);
        p5.circle(this.r * 0.3, 0, 6);
        
        // Mode debug
        if (Vehicle.debug) {
            p5.stroke(0, 255, 255);
            p5.strokeWeight(2);
            const force = this.currentSteeringForce.mult(0.3);
            p5.line(0, 0, force.x, force.y);
        }
        
        p5.pop();
        
        // Dessiner les projectiles
        for (const proj of this.projectiles) {
            p5.push();
            p5.noStroke();
            p5.fill(COLORS.PROJECTILE);
            p5.circle(proj.pos.x, proj.pos.y, proj.radius * 2);
            
            // Effet de lueur
            p5.fill(255, 200, 50, 100);
            p5.circle(proj.pos.x, proj.pos.y, proj.radius * 3);
            p5.pop();
        }
        
        // Barre de vie pour les ennemis blessés
        if (this.hp < this.maxHp) {
            p5.push();
            p5.translate(this.pos.x, this.pos.y);
            const barWidth = this.r * 2;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;
            
            p5.noStroke();
            p5.fill(60, 60, 60);
            p5.rect(-barWidth / 2, -this.r - 10, barWidth, barHeight);
            p5.fill(hpPercent > 0.3 ? '#4a4' : '#a44');
            p5.rect(-barWidth / 2, -this.r - 10, barWidth * hpPercent, barHeight);
            p5.pop();
        }
    }
}
