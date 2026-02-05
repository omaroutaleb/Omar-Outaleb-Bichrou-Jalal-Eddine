// ============================================
// Debug - Debug Visualization Overlay
// ============================================

import { DEBUG, SPATIAL, COLORS } from '../config.js';

export class Debug {
    constructor() {
        this.enabled = false;
        this.showSteering = DEBUG.SHOW_STEERING;
        this.showSpatialHash = DEBUG.SHOW_SPATIAL_HASH;
        this.showHitboxes = DEBUG.SHOW_HITBOXES;
        this.vectorScale = DEBUG.STEERING_VECTOR_SCALE;
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
    
    drawFPS(p5, fps) {
        if (!this.enabled) return;
        
        p5.push();
        p5.fill(255);
        p5.noStroke();
        p5.textSize(14);
        p5.textAlign(p5.LEFT, p5.TOP);
        p5.text(`FPS: ${fps}`, 10, p5.height - 30);
        p5.pop();
    }
    
    drawSpatialHash(p5, spatialHash, camera) {
        if (!this.enabled || !this.showSpatialHash) return;
        
        p5.push();
        camera.apply(p5);
        
        const cells = spatialHash.getOccupiedCells();
        for (const cell of cells) {
            p5.noFill();
            p5.stroke(100, 100, 255, 100);
            p5.strokeWeight(1);
            p5.rect(cell.x, cell.y, SPATIAL.CELL_SIZE, SPATIAL.CELL_SIZE);
            
            p5.fill(100, 100, 255);
            p5.noStroke();
            p5.textSize(10);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.text(cell.count, cell.x + SPATIAL.CELL_SIZE / 2, cell.y + SPATIAL.CELL_SIZE / 2);
        }
        
        p5.pop();
    }
    
    drawSteeringVector(p5, entity, force, color = '#ff0') {
        if (!this.enabled || !this.showSteering) return;
        if (!force || force.isZero()) return;
        
        const scaled = force.mult(this.vectorScale);
        
        p5.push();
        p5.stroke(color);
        p5.strokeWeight(2);
        p5.line(
            entity.pos.x, entity.pos.y,
            entity.pos.x + scaled.x, entity.pos.y + scaled.y
        );
        p5.pop();
    }
    
    drawHitbox(p5, entity, color = '#0f0') {
        if (!this.enabled || !this.showHitboxes) return;
        
        p5.push();
        p5.noFill();
        p5.stroke(color);
        p5.strokeWeight(1);
        p5.circle(entity.pos.x, entity.pos.y, entity.radius * 2);
        p5.pop();
    }
    
    drawNeighborRadius(p5, entity, radius, color = 'rgba(255,255,0,0.2)') {
        if (!this.enabled) return;
        
        p5.push();
        p5.noFill();
        p5.stroke(color);
        p5.strokeWeight(1);
        p5.circle(entity.pos.x, entity.pos.y, radius * 2);
        p5.pop();
    }
    
    drawInfo(p5, x, y, lines) {
        if (!this.enabled) return;
        
        p5.push();
        p5.fill(255);
        p5.noStroke();
        p5.textSize(12);
        p5.textAlign(p5.LEFT, p5.TOP);
        
        let offsetY = 0;
        for (const line of lines) {
            p5.text(line, x, y + offsetY);
            offsetY += 16;
        }
        
        p5.pop();
    }
}
