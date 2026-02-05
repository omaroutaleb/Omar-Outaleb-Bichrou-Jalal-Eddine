// ============================================
// Ranger - Ranged Enemy that Keeps Distance
// ============================================

import { Enemy, EnemyState } from './Enemy.js';
import { Vec2 } from '../../math/Vec2.js';
import { RANGER, COLORS } from '../../config.js';
import { Steering } from '../../steering/Steering.js';
import * as Behaviors from '../../steering/Behaviors.js';

export class Ranger extends Enemy {
    constructor(x, y) {
        super(x, y, RANGER.RADIUS, RANGER);
        this.baseColor = COLORS.RANGER;
        this.state = EnemyState.PURSUING;
        
        this.shootCooldown = RANGER.SHOOT_COOLDOWN;
        this.projectiles = [];
    }
    
    calculateSteering(dt, player, spatialHash, obstacles, bounds) {
        const forces = [];
        const weights = [];
        
        const distToPlayer = this.pos.dist(player.pos);
        
        // If too close, flee
        if (distToPlayer < RANGER.FLEE_DISTANCE) {
            forces.push(Behaviors.flee(this, player.pos, RANGER.FLEE_DISTANCE));
            weights.push(RANGER.FLEE_WEIGHT);
        } else {
            // Arrive at preferred distance (orbit around player)
            // Calculate target position at preferred distance
            const toPlayer = player.pos.sub(this.pos).normalize();
            const targetPos = player.pos.sub(toPlayer.mult(RANGER.PREFERRED_DISTANCE));
            
            forces.push(Behaviors.arrive(this, targetPos, 100));
            weights.push(RANGER.ARRIVE_WEIGHT);
        }
        
        // Separation from other enemies
        const neighbors = spatialHash.queryNear(this, RANGER.SEPARATION_RADIUS);
        forces.push(Behaviors.separation(this, neighbors, RANGER.SEPARATION_RADIUS));
        weights.push(RANGER.SEPARATION_WEIGHT);
        
        // Avoid obstacles
        forces.push(Behaviors.avoidObstacles(this, obstacles, 80));
        weights.push(RANGER.OBSTACLE_AVOIDANCE_WEIGHT);
        
        // Stay in bounds
        forces.push(Behaviors.containWithinBounds(this, bounds, 80));
        weights.push(RANGER.BOUNDARY_WEIGHT);
        
        return Steering.combine(forces, weights);
    }
    
    update(dt, player, spatialHash, obstacles, bounds) {
        super.update(dt, player, spatialHash, obstacles, bounds);
        
        // Shooting logic
        this.shootCooldown -= dt;
        
        if (this.shootCooldown <= 0) {
            const distToPlayer = this.pos.dist(player.pos);
            
            // Only shoot if within range and has line of sight (simple check)
            if (distToPlayer < RANGER.PREFERRED_DISTANCE + 150 && distToPlayer > RANGER.FLEE_DISTANCE) {
                this.shoot(player);
                this.shootCooldown = RANGER.SHOOT_COOLDOWN;
            }
        }
        
        // Update projectiles
        for (const proj of this.projectiles) {
            proj.pos.addSelf(proj.vel.mult(dt));
            proj.lifetime -= dt;
        }
        
        // Remove dead projectiles
        this.projectiles = this.projectiles.filter(p => p.lifetime > 0 && p.alive);
    }
    
    shoot(player) {
        const dir = player.pos.sub(this.pos).normalize();
        const projectile = {
            pos: this.pos.add(dir.mult(this.radius + 5)),
            vel: dir.mult(RANGER.PROJECTILE_SPEED),
            radius: RANGER.PROJECTILE_RADIUS,
            damage: RANGER.PROJECTILE_DAMAGE,
            lifetime: 4,
            alive: true
        };
        this.projectiles.push(projectile);
    }
    
    draw(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        // Flash white when hit
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : this.baseColor;
        
        // Draw as diamond shape
        const angle = this.vel.isZero() ? 0 : this.vel.heading();
        p5.rotate(angle);
        
        p5.noStroke();
        p5.fill(drawColor);
        
        p5.beginShape();
        p5.vertex(this.radius, 0);
        p5.vertex(0, -this.radius * 0.7);
        p5.vertex(-this.radius, 0);
        p5.vertex(0, this.radius * 0.7);
        p5.endShape(p5.CLOSE);
        
        // Inner circle (eye)
        p5.fill(255);
        p5.circle(this.radius * 0.3, 0, 6);
        
        p5.pop();
        
        // Draw projectiles
        for (const proj of this.projectiles) {
            p5.push();
            p5.noStroke();
            p5.fill(COLORS.PROJECTILE);
            p5.circle(proj.pos.x, proj.pos.y, proj.radius * 2);
            
            // Glow effect
            p5.fill(255, 200, 50, 100);
            p5.circle(proj.pos.x, proj.pos.y, proj.radius * 3);
            p5.pop();
        }
        
        // Health bar for damaged enemies
        if (this.hp < this.maxHp) {
            p5.push();
            p5.translate(this.pos.x, this.pos.y);
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;
            
            p5.noStroke();
            p5.fill(60, 60, 60);
            p5.rect(-barWidth / 2, -this.radius - 10, barWidth, barHeight);
            p5.fill(hpPercent > 0.3 ? '#4a4' : '#a44');
            p5.rect(-barWidth / 2, -this.radius - 10, barWidth * hpPercent, barHeight);
            p5.pop();
        }
    }
}
