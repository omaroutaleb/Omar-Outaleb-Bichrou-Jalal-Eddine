// ============================================
// Behaviors - Craig Reynolds Steering Behaviors
// ============================================

import { Vec2 } from '../math/Vec2.js';

// All behaviors return a steering force (Vec2)

// SEEK: Steer toward target position at max speed
export function seek(entity, target) {
    const desired = target.sub(entity.pos);
    if (desired.magSq() === 0) return Vec2.zero();
    
    desired.setMagSelf(entity.maxSpeed);
    return desired.sub(entity.vel);
}

// FLEE: Steer away from target position
export function flee(entity, target, panicRadius = Infinity) {
    const toTarget = target.sub(entity.pos);
    const dist = toTarget.mag();
    
    if (dist > panicRadius) return Vec2.zero();
    
    const desired = entity.pos.sub(target).setMag(entity.maxSpeed);
    return desired.sub(entity.vel);
}

// ARRIVE: Seek with deceleration near target
export function arrive(entity, target, slowRadius = 100) {
    const toTarget = target.sub(entity.pos);
    const dist = toTarget.mag();
    
    if (dist === 0) return Vec2.zero();
    
    let speed;
    if (dist < slowRadius) {
        speed = entity.maxSpeed * (dist / slowRadius);
    } else {
        speed = entity.maxSpeed;
    }
    
    const desired = toTarget.setMag(speed);
    return desired.sub(entity.vel);
}

// PURSUE: Predict target's future position and seek it
export function pursue(entity, targetEntity, predictionTime = 0.5) {
    const toTarget = targetEntity.pos.sub(entity.pos);
    const dist = toTarget.mag();
    
    // Scale prediction by distance
    const t = Math.min(predictionTime, dist / entity.maxSpeed);
    const futurePos = targetEntity.pos.add(targetEntity.vel.mult(t));
    
    return seek(entity, futurePos);
}

// EVADE: Predict target's future position and flee from it
export function evade(entity, targetEntity, panicRadius = Infinity, predictionTime = 0.5) {
    const toTarget = targetEntity.pos.sub(entity.pos);
    const dist = toTarget.mag();
    
    if (dist > panicRadius) return Vec2.zero();
    
    const t = Math.min(predictionTime, dist / entity.maxSpeed);
    const futurePos = targetEntity.pos.add(targetEntity.vel.mult(t));
    
    return flee(entity, futurePos);
}

// WANDER: Random steering with smooth changes
// Uses entity.wanderAngle which should be initialized
export function wander(entity, wanderRadius = 50, wanderDistance = 80, wanderJitter = 0.3) {
    if (entity.wanderAngle === undefined) {
        entity.wanderAngle = Math.random() * Math.PI * 2;
    }
    
    // Add random jitter to the wander angle
    entity.wanderAngle += (Math.random() - 0.5) * wanderJitter * Math.PI;
    
    // Calculate wander target on a circle in front of entity
    const heading = entity.vel.mag() > 0.01 ? entity.vel.heading() : 0;
    const circleCenter = Vec2.fromAngle(heading, wanderDistance).addSelf(entity.pos);
    const wanderPoint = Vec2.fromAngle(entity.wanderAngle, wanderRadius).addSelf(circleCenter);
    
    return seek(entity, wanderPoint);
}

// SEPARATION: Steer away from nearby neighbors
export function separation(entity, neighbors, desiredSeparation = 40) {
    if (neighbors.length === 0) return Vec2.zero();
    
    const steer = Vec2.zero();
    let count = 0;
    
    for (const other of neighbors) {
        if (other === entity) continue;
        
        const d = entity.pos.dist(other.pos);
        if (d > 0 && d < desiredSeparation) {
            // Weight by distance (closer = stronger repulsion)
            const diff = entity.pos.sub(other.pos).normalize().div(d);
            steer.addSelf(diff);
            count++;
        }
    }
    
    if (count > 0) {
        steer.divSelf(count);
        if (steer.magSq() > 0) {
            steer.setMagSelf(entity.maxSpeed);
            steer.subSelf(entity.vel);
        }
    }
    
    return steer;
}

// COHESION: Steer toward average position of neighbors
export function cohesion(entity, neighbors) {
    if (neighbors.length === 0) return Vec2.zero();
    
    const center = Vec2.zero();
    let count = 0;
    
    for (const other of neighbors) {
        if (other === entity) continue;
        center.addSelf(other.pos);
        count++;
    }
    
    if (count > 0) {
        center.divSelf(count);
        return seek(entity, center);
    }
    
    return Vec2.zero();
}

// ALIGNMENT: Steer to match average heading/velocity of neighbors
export function alignment(entity, neighbors) {
    if (neighbors.length === 0) return Vec2.zero();
    
    const avgVel = Vec2.zero();
    let count = 0;
    
    for (const other of neighbors) {
        if (other === entity) continue;
        avgVel.addSelf(other.vel);
        count++;
    }
    
    if (count > 0) {
        avgVel.divSelf(count);
        avgVel.setMagSelf(entity.maxSpeed);
        return avgVel.sub(entity.vel);
    }
    
    return Vec2.zero();
}

// OBSTACLE AVOIDANCE: Steer around rectangular obstacles
export function avoidObstacles(entity, obstacles, lookAhead = 100) {
    if (obstacles.length === 0) return Vec2.zero();
    
    const ahead = entity.vel.mag() > 0.01 
        ? entity.vel.normalize().mult(lookAhead)
        : Vec2.fromAngle(0, lookAhead);
    
    const aheadPos = entity.pos.add(ahead);
    const aheadHalf = entity.pos.add(ahead.mult(0.5));
    
    let mostThreatening = null;
    let closestDist = Infinity;
    
    for (const obs of obstacles) {
        // Check if ahead points or entity intersect obstacle
        if (pointInRect(aheadPos, obs) || pointInRect(aheadHalf, obs) || 
            circleRectIntersect(entity.pos, entity.radius, obs)) {
            const dist = entity.pos.dist(new Vec2(obs.x + obs.width / 2, obs.y + obs.height / 2));
            if (dist < closestDist) {
                closestDist = dist;
                mostThreatening = obs;
            }
        }
    }
    
    if (!mostThreatening) return Vec2.zero();
    
    // Steer away from obstacle center
    const obsCenter = new Vec2(
        mostThreatening.x + mostThreatening.width / 2,
        mostThreatening.y + mostThreatening.height / 2
    );
    
    const avoidance = entity.pos.sub(obsCenter).normalize().mult(entity.maxSpeed);
    return avoidance;
}

// BOUNDARY CONTAINMENT: Steer back into bounds
export function containWithinBounds(entity, bounds, margin = 50) {
    const steer = Vec2.zero();
    
    if (entity.pos.x < bounds.left + margin) {
        steer.x = entity.maxSpeed;
    } else if (entity.pos.x > bounds.right - margin) {
        steer.x = -entity.maxSpeed;
    }
    
    if (entity.pos.y < bounds.top + margin) {
        steer.y = entity.maxSpeed;
    } else if (entity.pos.y > bounds.bottom - margin) {
        steer.y = -entity.maxSpeed;
    }
    
    if (!steer.isZero()) {
        steer.subSelf(entity.vel);
    }
    
    return steer;
}

// Helper: Check if point is inside rectangle
function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
}

// Helper: Check if circle intersects rectangle
function circleRectIntersect(circlePos, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(circlePos.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circlePos.y, rect.y + rect.height));
    
    const dx = circlePos.x - closestX;
    const dy = circlePos.y - closestY;
    
    return (dx * dx + dy * dy) < (radius * radius);
}
