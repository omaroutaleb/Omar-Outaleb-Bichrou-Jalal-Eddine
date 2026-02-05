// ============================================
// Input - Keyboard and Mouse Input Handling
// ============================================

import { Vec2 } from '../math/Vec2.js';

export class Input {
    constructor() {
        this.keys = new Map();
        this.keysPressed = new Set();
        this.keysReleased = new Set();
        
        this.mousePos = new Vec2(0, 0);
        this.worldMousePos = new Vec2(0, 0);
        this.mouseButtons = new Map();
        this.mousePressed = new Set();
        this.mouseReleased = new Set();
        
        this.camera = null;
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    // Call at end of each update to clear one-frame states
    endFrame() {
        this.keysPressed.clear();
        this.keysReleased.clear();
        this.mousePressed.clear();
        this.mouseReleased.clear();
    }
    
    // Keyboard events (called from p5)
    keyPressed(keyCode) {
        if (!this.keys.get(keyCode)) {
            this.keysPressed.add(keyCode);
        }
        this.keys.set(keyCode, true);
    }
    
    keyReleased(keyCode) {
        this.keys.set(keyCode, false);
        this.keysReleased.add(keyCode);
    }
    
    // Mouse events (called from p5)
    mousePressed(button) {
        if (!this.mouseButtons.get(button)) {
            this.mousePressed.add(button);
        }
        this.mouseButtons.set(button, true);
    }
    
    mouseReleased(button) {
        this.mouseButtons.set(button, false);
        this.mouseReleased.add(button);
    }
    
    mouseMoved(x, y) {
        this.mousePos.set(x, y);
        if (this.camera) {
            this.worldMousePos = this.camera.screenToWorld(x, y);
        }
    }
    
    // Check if key is currently held
    isKeyDown(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    // Check if key was just pressed this frame
    isKeyJustPressed(keyCode) {
        return this.keysPressed.has(keyCode);
    }
    
    // Check if key was just released this frame
    isKeyJustReleased(keyCode) {
        return this.keysReleased.has(keyCode);
    }
    
    // Check if mouse button is currently held
    isMouseDown(button = 0) {
        return this.mouseButtons.get(button) || false;
    }
    
    // Check if mouse was just clicked this frame
    isMouseJustPressed(button = 0) {
        return this.mousePressed.has(button);
    }
    
    // Get movement vector from WASD/arrows
    getMovementVector() {
        let x = 0;
        let y = 0;
        
        // WASD
        if (this.isKeyDown(65) || this.isKeyDown(37)) x -= 1; // A or Left
        if (this.isKeyDown(68) || this.isKeyDown(39)) x += 1; // D or Right
        if (this.isKeyDown(87) || this.isKeyDown(38)) y -= 1; // W or Up
        if (this.isKeyDown(83) || this.isKeyDown(40)) y += 1; // S or Down
        
        const vec = new Vec2(x, y);
        if (!vec.isZero()) {
            vec.normalizeSelf();
        }
        return vec;
    }
    
    // Get world mouse position
    getWorldMousePos() {
        return this.worldMousePos.copy();
    }
    
    // Get screen mouse position
    getScreenMousePos() {
        return this.mousePos.copy();
    }
}
