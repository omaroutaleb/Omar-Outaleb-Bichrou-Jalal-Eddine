// ============================================
// Collision - Detection and Resolution
// Détection et résolution de collisions
// ============================================

import { Vec2 } from '../math/Vec2.js';

export class Collision {
    // Helper: obtenir le rayon (supporte 'r' ou 'radius')
    static getRadius(entity) {
        return entity.r !== undefined ? entity.r : entity.radius;
    }
    
    // Circle-circle collision check
    static circleCircle(a, b) {
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const distSq = dx * dx + dy * dy;
        const radiiSum = this.getRadius(a) + this.getRadius(b);
        return distSq < radiiSum * radiiSum;
    }
    
    // Circle-circle with penetration info
    static circleCircleInfo(a, b) {
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const distSq = dx * dx + dy * dy;
        const radiiSum = this.getRadius(a) + this.getRadius(b);
        
        if (distSq >= radiiSum * radiiSum) {
            return null;
        }
        
        const dist = Math.sqrt(distSq);
        const overlap = radiiSum - dist;
        
        let normal;
        if (dist === 0) {
            normal = new Vec2(1, 0);
        } else {
            normal = new Vec2(dx / dist, dy / dist);
        }
        
        return { overlap, normal };
    }
    
    // Circle-rectangle collision check
    static circleRect(circle, rect) {
        // Find closest point on rectangle to circle center
        const closestX = Math.max(rect.x, Math.min(circle.pos.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.pos.y, rect.y + rect.height));
        
        const dx = circle.pos.x - closestX;
        const dy = circle.pos.y - closestY;
        const distSq = dx * dx + dy * dy;
        
        const r = this.getRadius(circle);
        return distSq < r * r;
    }
    
    // Circle-rectangle with penetration info
    static circleRectInfo(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.pos.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.pos.y, rect.y + rect.height));
        
        const dx = circle.pos.x - closestX;
        const dy = circle.pos.y - closestY;
        const distSq = dx * dx + dy * dy;
        const r = this.getRadius(circle);
        const radiusSq = r * r;
        
        if (distSq >= radiusSq) {
            return null;
        }
        
        const dist = Math.sqrt(distSq);
        const overlap = r - dist;
        
        let normal;
        if (dist === 0) {
            // Circle center is inside rectangle, push out to nearest edge
            const toLeft = circle.pos.x - rect.x;
            const toRight = rect.x + rect.width - circle.pos.x;
            const toTop = circle.pos.y - rect.y;
            const toBottom = rect.y + rect.height - circle.pos.y;
            
            const minDist = Math.min(toLeft, toRight, toTop, toBottom);
            
            if (minDist === toLeft) normal = new Vec2(-1, 0);
            else if (minDist === toRight) normal = new Vec2(1, 0);
            else if (minDist === toTop) normal = new Vec2(0, -1);
            else normal = new Vec2(0, 1);
        } else {
            normal = new Vec2(dx / dist, dy / dist);
        }
        
        return { overlap, normal, closestX, closestY };
    }
    
    // Separate two circles
    static separateCircles(a, b, info = null) {
        if (!info) info = this.circleCircleInfo(a, b);
        if (!info) return;
        
        const push = info.normal.mult(info.overlap * 0.5);
        a.pos.subSelf(push);
        b.pos.addSelf(push);
    }
    
    // Push circle out of rectangle
    static separateCircleRect(circle, rect, info = null) {
        if (!info) info = this.circleRectInfo(circle, rect);
        if (!info) return;
        
        const push = info.normal.mult(info.overlap);
        circle.pos.addSelf(push);
    }
    
    // Check if point is inside arc (for sword attack hit detection)
    static pointInArc(point, origin, direction, range, arcAngle) {
        const toPoint = point.sub(origin);
        const dist = toPoint.mag();
        
        if (dist > range) return false;
        if (dist === 0) return true;
        
        const pointAngle = toPoint.heading();
        const dirAngle = direction.heading();
        
        let angleDiff = pointAngle - dirAngle;
        // Normalize to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        return Math.abs(angleDiff) <= arcAngle / 2;
    }
    
    // Check if circle center is in arc
    static circleInArc(circle, origin, direction, range, arcAngle) {
        return this.pointInArc(circle.pos, origin, direction, range + this.getRadius(circle), arcAngle);
    }
}
