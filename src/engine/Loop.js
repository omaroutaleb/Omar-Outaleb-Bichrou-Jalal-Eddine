// ============================================
// Loop - Fixed Timestep Game Loop
// ============================================

import { SIMULATION } from '../config.js';

export class Loop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        
        this.accumulator = 0;
        this.lastTime = 0;
        this.dt = SIMULATION.DT;
        this.maxFrameTime = SIMULATION.MAX_FRAME_TIME;
        
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        this.paused = false;
    }
    
    // Call this from p5's draw()
    tick(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return;
        }
        
        let frameTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Clamp to prevent spiral of death
        if (frameTime > this.maxFrameTime) {
            frameTime = this.maxFrameTime;
        }
        
        // FPS calculation
        this.frameCount++;
        this.fpsTime += frameTime;
        if (this.fpsTime >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime -= 1.0;
        }
        
        if (!this.paused) {
            // Accumulate time
            this.accumulator += frameTime;
            
            // Fixed timestep updates
            while (this.accumulator >= this.dt) {
                this.updateFn(this.dt);
                this.accumulator -= this.dt;
            }
        }
        
        // Render interpolation factor (for smooth rendering between fixed updates)
        const alpha = this.accumulator / this.dt;
        this.renderFn(alpha);
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
    }
    
    toggle() {
        this.paused = !this.paused;
    }
    
    getFPS() {
        return this.fps;
    }
}
