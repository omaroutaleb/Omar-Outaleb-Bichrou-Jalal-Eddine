// ============================================
// Minimap - Circular Radar Display
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { UI, COLORS, WORLD } from '../config.js';

export class Minimap {
    constructor() {
        this.radius = UI.MINIMAP_RADIUS;
        this.scale = UI.MINIMAP_SCALE;
    }
    
    draw(p5, player, enemies, boss) {
        const margin = 20;
        const centerX = p5.width - this.radius - margin;
        const centerY = this.radius + margin;
        
        p5.push();
        
        // Background circle
        p5.fill(COLORS.MINIMAP_BG);
        p5.noStroke();
        p5.circle(centerX, centerY, this.radius * 2);
        
        // Border
        p5.noFill();
        p5.stroke(100);
        p5.strokeWeight(2);
        p5.circle(centerX, centerY, this.radius * 2);
        
        // Clip to circle (approximate with checking distance)
        p5.noStroke();
        
        // Draw enemies
        for (const enemy of enemies) {
            const rel = this.worldToMinimap(enemy.pos, player.pos);
            if (rel.mag() <= this.radius - 3) {
                p5.fill(COLORS.MINIMAP_ENEMY);
                p5.circle(centerX + rel.x, centerY + rel.y, 4);
            }
        }
        
        // Draw boss
        if (boss && boss.alive) {
            const rel = this.worldToMinimap(boss.pos, player.pos);
            const clampedRel = this.clampToRadius(rel, this.radius - 8);
            
            // Boss marker (larger, different color)
            p5.fill(COLORS.MINIMAP_BOSS);
            p5.circle(centerX + clampedRel.x, centerY + clampedRel.y, 10);
            
            // If boss is off minimap, show direction arrow
            if (rel.mag() > this.radius - 8) {
                this.drawDirectionArrow(p5, centerX, centerY, rel);
            }
        }
        
        // Draw player (always at center)
        p5.fill(COLORS.MINIMAP_PLAYER);
        p5.circle(centerX, centerY, 6);
        
        // Player direction indicator
        const heading = player.aimDirection;
        p5.stroke(COLORS.MINIMAP_PLAYER);
        p5.strokeWeight(2);
        p5.line(
            centerX, centerY,
            centerX + heading.x * 12,
            centerY + heading.y * 12
        );
        
        // World bounds indicator (corners)
        this.drawBoundsIndicators(p5, centerX, centerY, player.pos);
        
        p5.pop();
    }
    
    worldToMinimap(worldPos, playerPos) {
        const rel = worldPos.sub(playerPos);
        return rel.mult(this.scale);
    }
    
    clampToRadius(pos, maxRadius) {
        if (pos.mag() > maxRadius) {
            return pos.normalize().mult(maxRadius);
        }
        return pos;
    }
    
    drawDirectionArrow(p5, centerX, centerY, direction) {
        const normalized = direction.normalize();
        const arrowDist = this.radius - 5;
        const arrowPos = normalized.mult(arrowDist);
        
        p5.push();
        p5.translate(centerX + arrowPos.x, centerY + arrowPos.y);
        p5.rotate(direction.heading());
        
        p5.fill(COLORS.MINIMAP_BOSS);
        p5.noStroke();
        p5.triangle(8, 0, -4, -5, -4, 5);
        
        p5.pop();
    }
    
    drawBoundsIndicators(p5, centerX, centerY, playerPos) {
        p5.stroke(60);
        p5.strokeWeight(1);
        p5.noFill();
        
        // Calculate corners relative to player
        const corners = [
            new Vec2(0, 0),
            new Vec2(WORLD.WIDTH, 0),
            new Vec2(WORLD.WIDTH, WORLD.HEIGHT),
            new Vec2(0, WORLD.HEIGHT)
        ];
        
        // Draw edges of world on minimap if visible
        for (let i = 0; i < 4; i++) {
            const c1 = this.worldToMinimap(corners[i], playerPos);
            const c2 = this.worldToMinimap(corners[(i + 1) % 4], playerPos);
            
            // Only draw if within extended radius
            if (c1.mag() < this.radius * 2 || c2.mag() < this.radius * 2) {
                const clipped1 = this.clampToRadius(c1, this.radius);
                const clipped2 = this.clampToRadius(c2, this.radius);
                p5.line(
                    centerX + clipped1.x, centerY + clipped1.y,
                    centerX + clipped2.x, centerY + clipped2.y
                );
            }
        }
    }
}
