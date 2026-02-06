// ============================================
// Swarm - Ennemi de type Boids (comportement de groupe)
// ============================================

import { Enemy, EnemyState } from './Enemy.js';
import { Vehicle } from '../Entity.js';
import { Vec2 } from '../../math/Vec2.js';
import { SWARM, COLORS } from '../../config.js';

export class Swarm extends Enemy {
    constructor(x, y) {
        super(x, y, SWARM.RADIUS, SWARM);
        this.baseColor = COLORS.SWARM;
        this.state = EnemyState.PURSUING;
        
        // Légère variation dans l'apparence
        this.rotationOffset = Math.random() * Math.PI * 2;
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        // Obtenir les voisins du même type (autres Swarm)
        const allNearby = spatialHash ? spatialHash.queryNear(this, SWARM.FLOCK_RADIUS) : [];
        const flockmates = allNearby.filter(e => e instanceof Swarm);
        
        let totalForce = Vec2.zero();
        
        // ETAPE 1: Comportements Boids
        
        // Cohésion: aller vers le centre du groupe
        let cohesionForce = this.cohesion(flockmates);
        cohesionForce = cohesionForce.mult(SWARM.COHESION_WEIGHT);
        totalForce.addSelf(cohesionForce);
        
        // Alignement: aligner sa vitesse avec les voisins
        let alignmentForce = this.alignment(flockmates);
        alignmentForce = alignmentForce.mult(SWARM.ALIGNMENT_WEIGHT);
        totalForce.addSelf(alignmentForce);
        
        // Séparation: s'éloigner des voisins trop proches
        let separationForce = this.separation(flockmates, SWARM.SEPARATION_RADIUS);
        separationForce = separationForce.mult(SWARM.SEPARATION_WEIGHT);
        totalForce.addSelf(separationForce);
        
        // ETAPE 2: Poursuivre le joueur en groupe (avec arrive)
        let seekForce = this.arrive(player.pos, SWARM.PREFERRED_DISTANCE);
        seekForce = seekForce.mult(SWARM.SEEK_WEIGHT);
        totalForce.addSelf(seekForce);
        
        // ETAPE 3: Éviter les obstacles
        let avoidForce = this.avoid(obstacles, 60);
        avoidForce = avoidForce.mult(SWARM.OBSTACLE_AVOIDANCE_WEIGHT);
        totalForce.addSelf(avoidForce);
        
        // ETAPE 4: Rester dans les limites
        let boundaryForce = this.containWithinBounds(bounds, 50);
        boundaryForce = boundaryForce.mult(SWARM.BOUNDARY_WEIGHT);
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
    
    show(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash blanc quand touché
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : this.baseColor;
        
        // Dessin en forme de triangle pointant vers la direction
        const angle = this.vel.isZero() ? this.rotationOffset : this.vel.heading();
        p5.rotate(angle);
        
        p5.noStroke();
        p5.fill(drawColor);
        
        // Forme de triangle
        p5.beginShape();
        p5.vertex(this.r, 0);
        p5.vertex(-this.r * 0.7, -this.r * 0.6);
        p5.vertex(-this.r * 0.5, 0);
        p5.vertex(-this.r * 0.7, this.r * 0.6);
        p5.endShape(p5.CLOSE);
        
        // Mode debug
        if (Vehicle.debug) {
            p5.stroke(0, 255, 255);
            p5.strokeWeight(2);
            const force = this.currentSteeringForce.mult(0.3);
            p5.line(0, 0, force.x, force.y);
        }
        
        p5.pop();
        
        // Barre de vie pour les ennemis blessés
        if (this.hp < this.maxHp) {
            p5.push();
            p5.translate(this.pos.x, this.pos.y);
            const barWidth = this.r * 2;
            const barHeight = 3;
            const hpPercent = this.hp / this.maxHp;
            
            p5.noStroke();
            p5.fill(60, 60, 60);
            p5.rect(-barWidth / 2, -this.r - 8, barWidth, barHeight);
            p5.fill(hpPercent > 0.3 ? '#4a4' : '#a44');
            p5.rect(-barWidth / 2, -this.r - 8, barWidth * hpPercent, barHeight);
            p5.pop();
        }
    }
}
