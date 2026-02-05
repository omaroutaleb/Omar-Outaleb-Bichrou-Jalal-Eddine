// ============================================
// Vec2 - 2D Vector Math Class
// ============================================

export class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    // Create a copy
    copy() {
        return new Vec2(this.x, this.y);
    }
    
    // Set values
    set(x, y) {
        if (x instanceof Vec2) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
        return this;
    }
    
    // Addition (returns new Vec2)
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    
    // In-place addition
    addSelf(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    // Subtraction (returns new Vec2)
    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    
    // In-place subtraction
    subSelf(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    // Scalar multiplication (returns new Vec2)
    mult(s) {
        return new Vec2(this.x * s, this.y * s);
    }
    
    // In-place scalar multiplication
    multSelf(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    
    // Scalar division (returns new Vec2)
    div(s) {
        if (s === 0) return new Vec2(0, 0);
        return new Vec2(this.x / s, this.y / s);
    }
    
    // In-place scalar division
    divSelf(s) {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
        }
        return this;
    }
    
    // Magnitude (length)
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    // Squared magnitude (faster, for comparisons)
    magSq() {
        return this.x * this.x + this.y * this.y;
    }
    
    // Normalize (returns new Vec2 with length 1)
    normalize() {
        const m = this.mag();
        if (m === 0) return new Vec2(0, 0);
        return this.div(m);
    }
    
    // In-place normalize
    normalizeSelf() {
        const m = this.mag();
        if (m !== 0) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }
    
    // Limit magnitude (returns new Vec2)
    limit(max) {
        const mSq = this.magSq();
        if (mSq > max * max) {
            return this.normalize().mult(max);
        }
        return this.copy();
    }
    
    // In-place limit
    limitSelf(max) {
        const mSq = this.magSq();
        if (mSq > max * max) {
            this.normalizeSelf().multSelf(max);
        }
        return this;
    }
    
    // Set magnitude (returns new Vec2)
    setMag(len) {
        return this.normalize().mult(len);
    }
    
    // In-place set magnitude
    setMagSelf(len) {
        return this.normalizeSelf().multSelf(len);
    }
    
    // Distance to another vector
    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Squared distance (faster)
    distSq(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }
    
    // Dot product
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    
    // Cross product (returns scalar in 2D)
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    
    // Heading angle in radians
    heading() {
        return Math.atan2(this.y, this.x);
    }
    
    // Rotate by angle (returns new Vec2)
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
    
    // In-place rotation
    rotateSelf(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nx = this.x * cos - this.y * sin;
        const ny = this.x * sin + this.y * cos;
        this.x = nx;
        this.y = ny;
        return this;
    }
    
    // Linear interpolation
    lerp(v, t) {
        return new Vec2(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t
        );
    }
    
    // Check if zero vector
    isZero() {
        return this.x === 0 && this.y === 0;
    }
    
    // Check equality
    equals(v, epsilon = 0.0001) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }
    
    // String representation
    toString() {
        return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
    
    // Static factory methods
    static zero() {
        return new Vec2(0, 0);
    }
    
    static fromAngle(angle, length = 1) {
        return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    
    static random(length = 1) {
        const angle = Math.random() * Math.PI * 2;
        return Vec2.fromAngle(angle, length);
    }
    
    static randomInRange(minX, maxX, minY, maxY) {
        return new Vec2(
            minX + Math.random() * (maxX - minX),
            minY + Math.random() * (maxY - minY)
        );
    }
}
