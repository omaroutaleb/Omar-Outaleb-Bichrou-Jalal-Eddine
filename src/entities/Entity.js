// ============================================
// Vehicle - Classe de base pour les agents autonomes
// Inspiré du style "Antigravity" du professeur
// ============================================

import { Vec2 } from '../math/Vec2.js';
import { ENEMY } from '../config.js';

export class Vehicle {
    // Variable statique pour le mode debug
    static debug = false;
    
    constructor(x, y, r = 16) {
        // Position, vitesse, accélération
        this.pos = new Vec2(x, y);
        this.vel = Vec2.zero();
        this.acc = Vec2.zero();
        
        // Propriétés de mouvement
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.r = r; // Rayon pour le dessin/collision
        this.perceptionRadius = 50; // Pour les boids/vision
        
        // Propriétés de santé
        this.hp = 100;
        this.maxHp = 100;
        this.alive = true;
        
        // Timers
        this.hitFlashTimer = 0;
        this.invulnTimer = 0;
        
        // Pour le comportement wander (errance)
        this.wanderTheta = Math.random() * Math.PI * 2;
        this.wanderDistance = 80;
        this.wanderRadius = 50;
    }
    
    // ========================================
    // Physique Eulérienne
    // ========================================
    
    update(dt) {
        // vitesse = vitesse + accélération
        this.vel.addSelf(this.acc.mult(dt));
        // Limite la vitesse maximale
        this.vel.limitSelf(this.maxSpeed);
        // position = position + vitesse
        this.pos.addSelf(this.vel.mult(dt));
        // Reset accélération pour le prochain frame
        this.acc.set(0, 0);
        
        // Mise à jour des timers
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }
    }
    
    // ========================================
    // Application des Forces
    // ========================================
    
    applyForce(force) {
        // F = ma, on suppose m = 1
        this.acc.addSelf(force);
    }
    
    applyBehaviors(target, obstacles, vehicles) {
        // Calculs des forces
        let seekForce = this.seek(target);
        let avoidForce = this.avoid(obstacles);
        
        // Pondération
        seekForce = seekForce.mult(1);
        avoidForce = avoidForce.mult(3);
        
        // Application
        this.applyForce(seekForce);
        this.applyForce(avoidForce);
    }
    
    // ========================================
    // Comportements de Pilotage (Steering)
    // ========================================
    
    // SEEK: Poursuite d'une cible
    seek(target) {
        const targetPos = target.pos || target;
        
        // ETAPE 1 : Vitesse désirée (vers la cible)
        let desired = targetPos.sub(this.pos);
        if (desired.magSq() === 0) return Vec2.zero();
        desired = desired.setMag(this.maxSpeed);
        
        // ETAPE 2 : Force de pilotage (Steering force)
        let steer = desired.sub(this.vel);
        steer = steer.limit(this.maxForce);
        return steer;
    }
    
    // FLEE: Fuite d'une cible
    flee(target, panicRadius = Infinity) {
        const targetPos = target.pos || target;
        const toTarget = targetPos.sub(this.pos);
        const dist = toTarget.mag();
        
        if (dist > panicRadius) return Vec2.zero();
        
        // Vitesse désirée = opposée de la direction vers la cible
        let desired = this.pos.sub(targetPos).setMag(this.maxSpeed);
        let steer = desired.sub(this.vel);
        return steer.limit(this.maxForce);
    }
    
    // ARRIVE: Arrivée en douceur avec ralentissement
    arrive(target, slowRadius = 100) {
        const targetPos = target.pos || target;
        let desired = targetPos.sub(this.pos);
        let d = desired.mag();
        
        if (d === 0) return Vec2.zero();
        
        // Ralentissement dans le rayon
        if (d < slowRadius) {
            // map(d, 0, slowRadius, 0, maxSpeed)
            let m = (d / slowRadius) * this.maxSpeed;
            desired = desired.setMag(m);
        } else {
            desired = desired.setMag(this.maxSpeed);
        }
        
        let steer = desired.sub(this.vel);
        return steer.limit(this.maxForce);
    }
    
    // WANDER: Errance aléatoire
    wander(jitter = 0.3) {
        // Déplacement aléatoire de l'angle
        this.wanderTheta += (Math.random() - 0.5) * jitter * Math.PI;
        
        // Point devant le véhicule
        const heading = this.vel.mag() > 0.01 ? this.vel.heading() : 0;
        let center = Vec2.fromAngle(heading, this.wanderDistance);
        center = center.add(this.pos);
        
        // Point sur le cercle
        let offset = new Vec2(
            this.wanderRadius * Math.cos(this.wanderTheta),
            this.wanderRadius * Math.sin(this.wanderTheta)
        );
        let wanderTarget = center.add(offset);
        
        // Force (Seek vers le point cible)
        return this.seek(wanderTarget);
    }
    
    // SEPARATION: S'éloigner des voisins proches
    separation(vehicles, desiredSeparation = 40) {
        if (!vehicles || vehicles.length === 0) return Vec2.zero();
        
        const steer = Vec2.zero();
        let count = 0;
        
        for (const other of vehicles) {
            if (other === this) continue;
            
            const d = this.pos.dist(other.pos);
            if (d > 0 && d < desiredSeparation) {
                // Poids par distance (plus proche = répulsion plus forte)
                let diff = this.pos.sub(other.pos).normalize().div(d);
                steer.addSelf(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.divSelf(count);
            if (steer.magSq() > 0) {
                steer.setMagSelf(this.maxSpeed);
                steer.subSelf(this.vel);
            }
        }
        
        return steer.limit(this.maxForce);
    }
    
    // COHESION: Aller vers le centre du groupe
    cohesion(vehicles) {
        if (!vehicles || vehicles.length === 0) return Vec2.zero();
        
        const center = Vec2.zero();
        let count = 0;
        
        for (const other of vehicles) {
            if (other === this) continue;
            center.addSelf(other.pos);
            count++;
        }
        
        if (count > 0) {
            center.divSelf(count);
            return this.seek(center);
        }
        
        return Vec2.zero();
    }
    
    // ALIGNMENT: Aligner sa vitesse avec les voisins
    alignment(vehicles) {
        if (!vehicles || vehicles.length === 0) return Vec2.zero();
        
        const avgVel = Vec2.zero();
        let count = 0;
        
        for (const other of vehicles) {
            if (other === this) continue;
            avgVel.addSelf(other.vel);
            count++;
        }
        
        if (count > 0) {
            avgVel.divSelf(count);
            avgVel.setMagSelf(this.maxSpeed);
            return avgVel.sub(this.vel).limit(this.maxForce);
        }
        
        return Vec2.zero();
    }
    
    // AVOID: Évitement d'obstacles
    avoid(obstacles, lookAhead = 100) {
        if (!obstacles || obstacles.length === 0) return Vec2.zero();
        
        const ahead = this.vel.mag() > 0.01
            ? this.vel.normalize().mult(lookAhead)
            : Vec2.fromAngle(0, lookAhead);
        
        const aheadPos = this.pos.add(ahead);
        
        let mostThreatening = null;
        let closestDist = Infinity;
        
        for (const obs of obstacles) {
            // Vérifier si le point ahead est dans l'obstacle
            if (this.pointInRect(aheadPos, obs)) {
                const obsCenter = new Vec2(obs.x + obs.width / 2, obs.y + obs.height / 2);
                const dist = this.pos.dist(obsCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    mostThreatening = obs;
                }
            }
        }
        
        if (!mostThreatening) return Vec2.zero();
        
        // S'éloigner du centre de l'obstacle
        const obsCenter = new Vec2(
            mostThreatening.x + mostThreatening.width / 2,
            mostThreatening.y + mostThreatening.height / 2
        );
        
        return this.pos.sub(obsCenter).normalize().mult(this.maxSpeed);
    }
    
    // Utilitaire: Point dans rectangle
    pointInRect(point, rect) {
        return point.x >= rect.x && point.x <= rect.x + rect.width &&
               point.y >= rect.y && point.y <= rect.y + rect.height;
    }
    
    // ========================================
    // Gestion des dégâts
    // ========================================
    
    takeDamage(amount) {
        if (this.invulnTimer > 0) return false;
        
        this.hp -= amount;
        this.hitFlashTimer = ENEMY.HIT_FLASH_DURATION;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.onDeath();
        }
        
        return true;
    }
    
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }
    
    onDeath() {
        // À surcharger dans les sous-classes
    }
    
    // ========================================
    // Affichage
    // ========================================
    
    show(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        p5.rotate(this.vel.heading());
        
        // Dessin par défaut: triangle
        p5.fill(100);
        p5.noStroke();
        p5.triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        
        // Mode debug: afficher les vecteurs
        if (Vehicle.debug) {
            this.showDebug(p5);
        }
        
        p5.pop();
    }
    
    showDebug(p5) {
        // Vecteur vitesse (vert)
        p5.stroke(0, 255, 0);
        p5.strokeWeight(2);
        p5.line(0, 0, this.vel.x * 10, this.vel.y * 10);
        
        // Rayon de perception (cercle)
        p5.noFill();
        p5.stroke(255, 255, 0, 100);
        p5.circle(0, 0, this.perceptionRadius * 2);
    }
    
    // ========================================
    // Utilitaires
    // ========================================
    
    // Vérifie si proche d'une position
    isNear(pos, distance) {
        return this.pos.distSq(pos) < distance * distance;
    }
    
    // Direction vers une cible
    directionTo(target) {
        const targetPos = target.pos || target;
        return targetPos.sub(this.pos).normalize();
    }
    
    // Distance vers une cible
    distanceTo(target) {
        const targetPos = target.pos || target;
        return this.pos.dist(targetPos);
    }
}

// Alias pour compatibilité arrière
export { Vehicle as Entity };
