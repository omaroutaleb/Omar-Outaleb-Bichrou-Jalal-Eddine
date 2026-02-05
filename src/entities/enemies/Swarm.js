// ============================================
// Swarm - Boids-style Flocking Enemy
// ============================================

import { Enemy, EnemyState } from './Enemy.js';
import { Vec2 } from '../../math/Vec2.js';
import { SWARM, COLORS } from '../../config.js';
import { Steering } from '../../steering/Steering.js';
import * as Behaviors from '../../steering/Behaviors.js';

export class Swarm extends Enemy {
    constructor(x, y) {
        super(x, y, SWARM.RADIUS, SWARM);
        this.baseColor = COLORS.SWARM;
        this.state = EnemyState.PURSUING;
        
        // Slight variation in appearance
        this.rotationOffset = Math.random() * Math.PI * 2;
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        const forces = [];
        const weights = [];
        
        // Get flockmates (other Swarm entities)
        const allNearby = spatialHash.queryNear(this, SWARM.FLOCK_RADIUS);
        const flockmates = allNearby.filter(e => e instanceof Swarm);
        
        // Boids behaviors
        forces.push(Behaviors.cohesion(this, flockmates));
        weights.push(SWARM.COHESION_WEIGHT);
        
        forces.push(Behaviors.alignment(this, flockmates));
        weights.push(SWARM.ALIGNMENT_WEIGHT);
        
        forces.push(Behaviors.separation(this, flockmates, SWARM.SEPARATION_RADIUS));
        weights.push(SWARM.SEPARATION_WEIGHT);
        
        // Seek player as a group (using arrive to maintain some distance)
        forces.push(Behaviors.arrive(this, player.pos, SWARM.PREFERRED_DISTANCE));
        weights.push(SWARM.SEEK_WEIGHT);
        
        // Avoid obstacles
        forces.push(Behaviors.avoidObstacles(this, obstacles, 60));
        weights.push(SWARM.OBSTACLE_AVOIDANCE_WEIGHT);
        
        // Stay in bounds
        forces.push(Behaviors.containWithinBounds(this, bounds, 50));
        weights.push(SWARM.BOUNDARY_WEIGHT);
        
        return Steering.combine(forces, weights);
    }
    
    draw(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash white when hit
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : this.baseColor;
        
        // Draw as small triangle pointing in velocity direction
        const angle = this.vel.isZero() ? this.rotationOffset : this.vel.heading();
        p5.rotate(angle);
        
        p5.noStroke();
        p5.fill(drawColor);
        
        // Triangle shape
        p5.beginShape();
        p5.vertex(this.radius, 0);
        p5.vertex(-this.radius * 0.7, -this.radius * 0.6);
        p5.vertex(-this.radius * 0.5, 0);
        p5.vertex(-this.radius * 0.7, this.radius * 0.6);
        p5.endShape(p5.CLOSE);
        
        p5.pop();
        
        // Health bar for damaged enemies
        if (this.hp < this.maxHp) {
            p5.push();
            p5.translate(this.pos.x, this.pos.y);
            const barWidth = this.radius * 2;
            const barHeight = 3;
            const hpPercent = this.hp / this.maxHp;
            
            p5.noStroke();
            p5.fill(60, 60, 60);
            p5.rect(-barWidth / 2, -this.radius - 8, barWidth, barHeight);
            p5.fill(hpPercent > 0.3 ? '#4a4' : '#a44');
            p5.rect(-barWidth / 2, -this.radius - 8, barWidth * hpPercent, barHeight);
            p5.pop();
        }
    }
}
