// ============================================
// Particles - Visual Effects System
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { PARTICLES } from '../config.js';

class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(vx, vy);
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alive = true;
    }
    
    update(dt) {
        this.pos.addSelf(this.vel.mult(dt));
        this.vel.multSelf(0.95); // Drag
        this.lifetime -= dt;
        
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    draw(p5) {
        const alpha = (this.lifetime / this.maxLifetime) * 255;
        const size = this.size * (this.lifetime / this.maxLifetime);
        
        p5.push();
        p5.noStroke();
        
        // Parse color and add alpha
        p5.fill(this.parseColorWithAlpha(p5, this.color, alpha));
        p5.circle(this.pos.x, this.pos.y, size);
        
        p5.pop();
    }
    
    parseColorWithAlpha(p5, colorStr, alpha) {
        // Handle hex colors
        if (colorStr.startsWith('#')) {
            const r = parseInt(colorStr.slice(1, 3), 16);
            const g = parseInt(colorStr.slice(3, 5), 16);
            const b = parseInt(colorStr.slice(5, 7), 16);
            return p5.color(r, g, b, alpha);
        }
        // Default fallback
        return p5.color(255, 255, 255, alpha);
    }
}

export class ParticleSystem {
    constructor(maxParticles = 500) {
        this.particles = [];
        this.maxParticles = maxParticles;
    }
    
    update(dt) {
        for (const particle of this.particles) {
            particle.update(dt);
        }
        
        // Remove dead particles
        this.particles = this.particles.filter(p => p.alive);
    }
    
    draw(p5) {
        for (const particle of this.particles) {
            particle.draw(p5);
        }
    }
    
    emit(x, y, count, config = {}) {
        const {
            color = '#fff',
            speed = 100,
            speedVariance = 50,
            size = 8,
            sizeVariance = 4,
            lifetime = 0.5,
            lifetimeVariance = 0.2,
            direction = null, // null = all directions
            spread = Math.PI * 2
        } = config;
        
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            let angle;
            if (direction !== null) {
                angle = direction + (Math.random() - 0.5) * spread;
            } else {
                angle = Math.random() * Math.PI * 2;
            }
            
            const spd = speed + (Math.random() - 0.5) * speedVariance * 2;
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            
            const sz = size + (Math.random() - 0.5) * sizeVariance * 2;
            const lt = lifetime + (Math.random() - 0.5) * lifetimeVariance * 2;
            
            this.particles.push(new Particle(x, y, vx, vy, color, sz, lt));
        }
    }
    
    // Preset effects
    hitSpark(x, y, color = '#ff0') {
        this.emit(x, y, PARTICLES.HIT_COUNT, {
            color,
            speed: PARTICLES.HIT_SPEED,
            speedVariance: 50,
            size: 6,
            sizeVariance: 2,
            lifetime: PARTICLES.HIT_LIFETIME,
            lifetimeVariance: 0.1
        });
    }
    
    deathBurst(x, y, color = '#f44') {
        this.emit(x, y, PARTICLES.DEATH_COUNT, {
            color,
            speed: PARTICLES.DEATH_SPEED,
            speedVariance: 80,
            size: 10,
            sizeVariance: 4,
            lifetime: PARTICLES.DEATH_LIFETIME,
            lifetimeVariance: 0.2
        });
    }
    
    dashTrail(x, y, direction) {
        const backDir = direction + Math.PI;
        this.emit(x, y, PARTICLES.DASH_COUNT, {
            color: '#4af',
            speed: 50,
            speedVariance: 30,
            size: 12,
            sizeVariance: 4,
            lifetime: 0.2,
            lifetimeVariance: 0.05,
            direction: backDir,
            spread: Math.PI * 0.5
        });
    }
    
    swordSwing(x, y, direction) {
        this.emit(x, y, 4, {
            color: '#8cf',
            speed: 80,
            speedVariance: 20,
            size: 8,
            sizeVariance: 2,
            lifetime: 0.15,
            lifetimeVariance: 0.05,
            direction: direction,
            spread: Math.PI * 0.3
        });
    }
    
    bossSlam(x, y, radius) {
        // Ring of particles
        const count = 24;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            this.emit(px, py, 2, {
                color: '#f84',
                speed: 100,
                speedVariance: 30,
                size: 12,
                sizeVariance: 4,
                lifetime: 0.4,
                lifetimeVariance: 0.1,
                direction: angle,
                spread: Math.PI * 0.3
            });
        }
    }
    
    clear() {
        this.particles = [];
    }
}
