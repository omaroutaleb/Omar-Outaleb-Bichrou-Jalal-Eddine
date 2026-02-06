// ============================================
// Grunt - Ennemi de base qui poursuit le joueur
// ============================================

import { Enemy, EnemyState } from './Enemy.js';
import { Vec2 } from '../../math/Vec2.js';
import { GRUNT, COLORS } from '../../config.js';

export class Grunt extends Enemy {
    constructor(x, y) {
        super(x, y, GRUNT.RADIUS, GRUNT);
        this.baseColor = COLORS.GRUNT;
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        // Toujours poursuivre le joueur
        this.setState(EnemyState.PURSUING);
        
        // ETAPE 1: Force de poursuite (Seek)
        let pursueForce = this.seek(player.pos);
        pursueForce = pursueForce.mult(GRUNT.PURSUE_WEIGHT);
        
        // ETAPE 2: Force de séparation des autres ennemis
        const neighbors = spatialHash ? 
            spatialHash.query(this, GRUNT.SEPARATION_RADIUS) : [];
        let separationForce = this.separation(neighbors, GRUNT.SEPARATION_RADIUS);
        separationForce = separationForce.mult(GRUNT.SEPARATION_WEIGHT);
        
        // ETAPE 3: Évitement d'obstacles
        let avoidForce = this.avoid(obstacles);
        avoidForce = avoidForce.mult(GRUNT.OBSTACLE_AVOIDANCE_WEIGHT);
        
        // ETAPE 4: Rester dans les limites
        let boundaryForce = this.containWithinBounds(bounds);
        boundaryForce = boundaryForce.mult(GRUNT.BOUNDARY_WEIGHT);
        
        // Combinaison des forces
        const totalForce = Vec2.zero();
        totalForce.addSelf(pursueForce);
        totalForce.addSelf(separationForce);
        totalForce.addSelf(avoidForce);
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
        this.showBase(p5, this.baseColor, 'triangle');
    }
}
