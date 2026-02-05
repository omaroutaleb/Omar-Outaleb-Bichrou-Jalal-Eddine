// ============================================
// Grunt - Basic Melee Pursuer
// ============================================

import { Enemy, EnemyState } from './Enemy.js';
import { Vec2 } from '../../math/Vec2.js';
import { GRUNT, COLORS, WORLD } from '../../config.js';
import { Steering } from '../../steering/Steering.js';
import * as Behaviors from '../../steering/Behaviors.js';

export class Grunt extends Enemy {
    constructor(x, y) {
        super(x, y, GRUNT.RADIUS, GRUNT);
        this.baseColor = COLORS.GRUNT;
        this.state = EnemyState.PURSUING;
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        const forces = [];
        const weights = [];
        
        // Main behavior: Pursue player
        forces.push(Behaviors.pursue(this, player, 0.3));
        weights.push(GRUNT.PURSUE_WEIGHT);
        
        // Separation from other enemies
        const neighbors = spatialHash.queryNear(this, GRUNT.SEPARATION_RADIUS);
        forces.push(Behaviors.separation(this, neighbors, GRUNT.SEPARATION_RADIUS));
        weights.push(GRUNT.SEPARATION_WEIGHT);
        
        // Avoid obstacles
        forces.push(Behaviors.avoidObstacles(this, obstacles));
        weights.push(GRUNT.OBSTACLE_AVOIDANCE_WEIGHT);
        
        // Stay in bounds
        forces.push(Behaviors.containWithinBounds(this, bounds, 80));
        weights.push(GRUNT.BOUNDARY_WEIGHT);
        
        return Steering.combine(forces, weights);
    }
    
    draw(p5) {
        this.drawBase(p5, this.baseColor, 'circle');
        
        // Add angry eyes
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        const dir = this.vel.isZero() ? new Vec2(1, 0) : this.vel.normalize();
        
        p5.fill(255);
        p5.noStroke();
        
        // Two small eyes
        const eyeOffset = dir.mult(this.radius * 0.3);
        const perpOffset = new Vec2(-dir.y, dir.x).mult(this.radius * 0.4);
        
        p5.circle(eyeOffset.x + perpOffset.x, eyeOffset.y + perpOffset.y, 5);
        p5.circle(eyeOffset.x - perpOffset.x, eyeOffset.y - perpOffset.y, 5);
        
        p5.pop();
    }
}
