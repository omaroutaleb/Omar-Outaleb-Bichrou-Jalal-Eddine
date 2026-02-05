// ============================================
// Camera2D - Smooth Following Camera
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { CAMERA, WORLD } from '../config.js';

export class Camera2D {
    constructor(viewWidth, viewHeight) {
        this.pos = new Vec2(0, 0);
        this.target = null;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.lerpSpeed = CAMERA.LERP_SPEED;
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    resize(width, height) {
        this.viewWidth = width;
        this.viewHeight = height;
    }
    
    update(dt) {
        if (!this.target) return;
        
        // Target position (center on target)
        const targetPos = this.target.pos.copy();
        
        // Smooth follow with lerp
        const t = 1 - Math.exp(-this.lerpSpeed * dt);
        this.pos = this.pos.lerp(targetPos, t);
        
        // Clamp to world bounds
        const halfW = this.viewWidth / 2;
        const halfH = this.viewHeight / 2;
        
        this.pos.x = Math.max(halfW, Math.min(WORLD.WIDTH - halfW, this.pos.x));
        this.pos.y = Math.max(halfH, Math.min(WORLD.HEIGHT - halfH, this.pos.y));
    }
    
    // Apply camera transform (call before drawing world)
    apply(p5) {
        p5.translate(
            this.viewWidth / 2 - this.pos.x,
            this.viewHeight / 2 - this.pos.y
        );
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(sx, sy) {
        return new Vec2(
            sx - this.viewWidth / 2 + this.pos.x,
            sy - this.viewHeight / 2 + this.pos.y
        );
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(wx, wy) {
        return new Vec2(
            wx - this.pos.x + this.viewWidth / 2,
            wy - this.pos.y + this.viewHeight / 2
        );
    }
    
    // Check if a world position is visible on screen
    isVisible(x, y, margin = 100) {
        const screen = this.worldToScreen(x, y);
        return screen.x > -margin && 
               screen.x < this.viewWidth + margin &&
               screen.y > -margin && 
               screen.y < this.viewHeight + margin;
    }
    
    // Get visible bounds in world coordinates
    getVisibleBounds() {
        return {
            left: this.pos.x - this.viewWidth / 2,
            right: this.pos.x + this.viewWidth / 2,
            top: this.pos.y - this.viewHeight / 2,
            bottom: this.pos.y + this.viewHeight / 2
        };
    }
}
