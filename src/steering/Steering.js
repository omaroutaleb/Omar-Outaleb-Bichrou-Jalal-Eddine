
// ============================================
// Steering - Force Combination and Integration
// ============================================

import { Vec2 } from '../math/Vec2.js';

export class Steering {
    // Combine multiple steering forces with weights
    static combine(forces, weights) {
        const result = Vec2.zero();
        
        for (let i = 0; i < forces.length; i++) {
            const force = forces[i];
            const weight = weights[i] || 1;
            
            if (force && !force.isZero()) {
                result.addSelf(force.mult(weight));
            }
        }
        
        return result;
    }
    
    // Combine using priority (first non-zero force wins, with fallback blending)
    static combinePriority(forces, weights, threshold = 0.01) {
        for (let i = 0; i < forces.length; i++) {
            const force = forces[i];
            if (force && force.magSq() > threshold * threshold) {
                return force.mult(weights[i] || 1);
            }
        }
        return Vec2.zero();
    }
    
    // Clamp force to maximum
    static clamp(force, maxForce) {
        return force.limit(maxForce);
    }
    
    // Apply steering force to entity (updates acceleration)
    static applyForce(entity, force) {
        // a = F/m (assuming mass = 1 for all entities)
        entity.acc.addSelf(force);
    }
    
    // Integration helper: update velocity and position
    static integrate(entity, dt) {
        // Apply acceleration to velocity
        entity.vel.addSelf(entity.acc.mult(dt));
        
        // Clamp velocity
        entity.vel.limitSelf(entity.maxSpeed);
        
        // Apply velocity to position
        entity.pos.addSelf(entity.vel.mult(dt));
        
        // Reset acceleration for next frame
        entity.acc.set(0, 0);
    }
    
    // Full steering update: calculate forces, apply, integrate
    static update(entity, steeringForce, dt) {
        // Clamp force
        const clampedForce = steeringForce.limit(entity.maxForce);
        
        // Apply force (F = ma, m = 1)
        entity.acc.addSelf(clampedForce);
        
        // Integrate
        this.integrate(entity, dt);
    }
}
