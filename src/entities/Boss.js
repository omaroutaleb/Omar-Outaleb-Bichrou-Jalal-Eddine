// ============================================
// Boss - Ennemi Boss à deux phases
// ============================================

import { Vehicle } from './Entity.js';
import { Vec2 } from '../math/Vec2.js';
import { BOSS, COLORS } from '../config.js';

export const BossPhase = {
    PHASE1: 1,
    PHASE2: 2
};

export const BossState = {
    IDLE: 'idle',
    PURSUING: 'pursuing',
    CHARGING: 'charging',
    SLAMMING: 'slamming',
    SPAWNING: 'spawning'
};

export class Boss extends Vehicle {
    constructor(x, y) {
        super(x, y, BOSS.RADIUS);
        
        // Propriétés de mouvement
        this.maxSpeed = BOSS.MAX_SPEED;
        this.maxForce = BOSS.MAX_FORCE;
        
        // Points de vie
        this.maxHp = BOSS.HP;
        this.hp = BOSS.HP;
        
        // Combat
        this.damage = BOSS.DAMAGE;
        this.xpValue = BOSS.XP_VALUE;
        this.coinValue = BOSS.COIN_VALUE;
        
        // Phase et état
        this.phase = BossPhase.PHASE1;
        this.state = BossState.PURSUING;
        this.stateTimer = 0;
        
        // Timers d'attaque
        this.spawnTimer = BOSS.PHASE1_SPAWN_INTERVAL;
        this.chargeCooldown = BOSS.CHARGE_COOLDOWN;
        this.slamCooldown = BOSS.SLAM_COOLDOWN;
        
        // Variables de charge
        this.chargeDirection = Vec2.zero();
        this.chargeTimer = 0;
        this.slamTimer = 0;
        this.slamHitPlayer = false;
        
        // Force de pilotage actuelle (pour debug)
        this.currentSteeringForce = Vec2.zero();
        
        // Callbacks
        this.onSpawnAdds = null;
        this.onSlam = null;
        this.onDeathCallback = null;
        
        // Animation
        this.pulseTimer = 0;
    }
    
    update(dt, player, spatialHash, obstacles, bounds) {
        this.stateTimer += dt;
        this.pulseTimer += dt;
        
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        
        // Transition de phase à 60% HP
        if (this.phase === BossPhase.PHASE1 && this.hp <= this.maxHp * 0.6) {
            this.enterPhase2();
        }
        
        // Machine d'états
        switch (this.state) {
            case BossState.PURSUING:
                this.updatePursuing(dt, player, spatialHash, obstacles, bounds);
                break;
            case BossState.CHARGING:
                this.updateCharging(dt, player);
                break;
            case BossState.SLAMMING:
                this.updateSlamming(dt, player);
                break;
            case BossState.SPAWNING:
                this.updateSpawning(dt);
                break;
        }
        
        // Cooldowns
        if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
        if (this.slamCooldown > 0) this.slamCooldown -= dt;
    }
    
    enterPhase2() {
        this.phase = BossPhase.PHASE2;
        this.maxSpeed = BOSS.MAX_SPEED * BOSS.PHASE2_SPEED_MULT;
    }
    
    updatePursuing(dt, player, spatialHash, obstacles, bounds) {
        // ETAPE 1: Calculer la force de poursuite
        let pursueForce = this.pursue(player, 0.5);
        pursueForce = pursueForce.mult(BOSS.PURSUE_WEIGHT);
        
        // ETAPE 2: Évitement d'obstacles
        let avoidForce = this.avoid(obstacles, 150);
        avoidForce = avoidForce.mult(BOSS.OBSTACLE_AVOIDANCE_WEIGHT);
        
        // ETAPE 3: Rester dans les limites
        let boundaryForce = this.containWithinBounds(bounds, 100);
        boundaryForce = boundaryForce.mult(BOSS.BOUNDARY_WEIGHT);
        
        // Combinaison des forces
        const steering = Vec2.zero();
        steering.addSelf(pursueForce);
        steering.addSelf(avoidForce);
        steering.addSelf(boundaryForce);
        
        this.currentSteeringForce = steering;
        
        // Application du mouvement
        this.applyForce(steering.limit(this.maxForce));
        this.vel.addSelf(this.acc.mult(dt));
        this.vel.limitSelf(this.maxSpeed);
        this.pos.addSelf(this.vel.mult(dt));
        this.acc.set(0, 0);
        
        // Phase 1: Faire apparaître des ennemis
        if (this.phase === BossPhase.PHASE1) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.state = BossState.SPAWNING;
                this.stateTimer = 0;
            }
        }
        
        // Phase 2: Attaques de charge et de frappe
        if (this.phase === BossPhase.PHASE2) {
            const distToPlayer = this.pos.dist(player.pos);
            
            // Attaque de charge
            if (this.chargeCooldown <= 0 && distToPlayer > 200) {
                this.startCharge(player);
            }
            // Attaque de frappe quand proche
            else if (this.slamCooldown <= 0 && distToPlayer < 150) {
                this.startSlam();
            }
        }
    }
    
    // PURSUE: Prédire la position future de la cible
    pursue(target, predictionTime = 0.5) {
        const toTarget = target.pos.sub(this.pos);
        const dist = toTarget.mag();
        
        // Échelle de prédiction par distance
        const t = Math.min(predictionTime, dist / this.maxSpeed);
        const futurePos = target.pos.add(target.vel.mult(t));
        
        return this.seek(futurePos);
    }
    
    // Rester dans les limites
    containWithinBounds(bounds, margin = 50) {
        if (!bounds) return Vec2.zero();
        
        const steer = Vec2.zero();
        
        if (this.pos.x < bounds.left + margin) {
            steer.x = this.maxSpeed;
        } else if (this.pos.x > bounds.right - margin) {
            steer.x = -this.maxSpeed;
        }
        
        if (this.pos.y < bounds.top + margin) {
            steer.y = this.maxSpeed;
        } else if (this.pos.y > bounds.bottom - margin) {
            steer.y = -this.maxSpeed;
        }
        
        if (!steer.isZero()) {
            steer.subSelf(this.vel);
        }
        
        return steer;
    }
    
    updateCharging(dt, player) {
        this.chargeTimer -= dt;
        
        // Mouvement rapide dans la direction de charge
        this.vel = this.chargeDirection.mult(BOSS.CHARGE_SPEED);
        this.pos.addSelf(this.vel.mult(dt));
        
        if (this.chargeTimer <= 0) {
            this.state = BossState.PURSUING;
            this.chargeCooldown = BOSS.CHARGE_COOLDOWN;
        }
    }
    
    updateSlamming(dt, player) {
        this.slamTimer -= dt;
        
        // Arrêt du mouvement pendant la frappe
        this.vel.set(0, 0);
        
        // Vérifier le hit au bon moment
        if (!this.slamHitPlayer && this.slamTimer < 0.3) {
            if (this.onSlam) {
                this.onSlam(this.pos, BOSS.SLAM_RADIUS, BOSS.SLAM_DAMAGE);
            }
            this.slamHitPlayer = true;
        }
        
        if (this.slamTimer <= 0) {
            this.state = BossState.PURSUING;
            this.slamCooldown = BOSS.SLAM_COOLDOWN;
        }
    }
    
    updateSpawning(dt) {
        // Pause brève pendant l'invocation
        this.vel.multSelf(0.9);
        
        if (this.stateTimer > 0.5) {
            // Faire apparaître des sbires
            if (this.onSpawnAdds) {
                this.onSpawnAdds(this.pos, BOSS.PHASE1_SPAWN_COUNT);
            }
            
            this.spawnTimer = BOSS.PHASE1_SPAWN_INTERVAL;
            this.state = BossState.PURSUING;
        }
    }
    
    startCharge(player) {
        this.state = BossState.CHARGING;
        this.chargeDirection = player.pos.sub(this.pos).normalize();
        this.chargeTimer = BOSS.CHARGE_DURATION;
        this.stateTimer = 0;
    }
    
    startSlam() {
        this.state = BossState.SLAMMING;
        this.slamTimer = 0.6;
        this.slamHitPlayer = false;
        this.stateTimer = 0;
    }
    
    canDamagePlayer(player) {
        const dist = this.pos.dist(player.pos);
        return dist < this.r + player.r;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.onDeath();
        }
        
        return true;
    }
    
    onDeath() {
        if (this.onDeathCallback) {
            this.onDeathCallback(this);
        }
    }
    
    // ========================================
    // Affichage
    // ========================================
    
    show(p5) {
        p5.push();
        p5.translate(this.pos.x, this.pos.y);
        
        const baseColor = this.phase === BossPhase.PHASE2 ? COLORS.BOSS_PHASE2 : COLORS.BOSS;
        const drawColor = this.hitFlashTimer > 0 ? '#fff' : baseColor;
        
        // Effet de pulsation
        const pulse = 1 + Math.sin(this.pulseTimer * 4) * 0.05;
        
        // Télégraphe de la frappe
        if (this.state === BossState.SLAMMING && this.slamTimer > 0.3) {
            p5.noFill();
            p5.stroke(255, 100, 100, 150);
            p5.strokeWeight(3);
            const slamProgress = 1 - (this.slamTimer - 0.3) / 0.3;
            p5.circle(0, 0, BOSS.SLAM_RADIUS * 2 * slamProgress);
        }
        
        // Impact de la frappe
        if (this.state === BossState.SLAMMING && this.slamTimer <= 0.3) {
            p5.noStroke();
            p5.fill(255, 100, 50, 100 * (this.slamTimer / 0.3));
            p5.circle(0, 0, BOSS.SLAM_RADIUS * 2);
        }
        
        // Traînée de charge
        if (this.state === BossState.CHARGING) {
            p5.noStroke();
            for (let i = 1; i <= 4; i++) {
                const trailPos = this.chargeDirection.mult(-i * 25);
                const alpha = 150 - i * 35;
                p5.fill(this.phase === BossPhase.PHASE2 ? 
                    `rgba(255, 136, 50, ${alpha / 255})` : 
                    `rgba(255, 68, 68, ${alpha / 255})`);
                p5.circle(trailPos.x, trailPos.y, this.r * 2 * (1 - i * 0.15));
            }
        }
        
        // Corps principal
        p5.noStroke();
        p5.fill(drawColor);
        
        // Anneau extérieur
        p5.circle(0, 0, this.r * 2 * pulse);
        
        // Corps intérieur (plus sombre)
        const innerColor = this.phase === BossPhase.PHASE2 ? '#c64' : '#c33';
        p5.fill(this.hitFlashTimer > 0 ? '#ddd' : innerColor);
        p5.circle(0, 0, this.r * 1.5 * pulse);
        
        // Yeux (menaçants)
        p5.fill(255);
        const eyeOffset = this.r * 0.3;
        p5.circle(-eyeOffset, -eyeOffset * 0.5, 12);
        p5.circle(eyeOffset, -eyeOffset * 0.5, 12);
        
        // Pupilles (suivent la direction)
        p5.fill(0);
        const dir = this.vel.isZero() ? new Vec2(0, 1) : this.vel.normalize();
        const pupilOffset = dir.mult(3);
        p5.circle(-eyeOffset + pupilOffset.x, -eyeOffset * 0.5 + pupilOffset.y, 6);
        p5.circle(eyeOffset + pupilOffset.x, -eyeOffset * 0.5 + pupilOffset.y, 6);
        
        // Sourcils en colère pour la phase 2
        if (this.phase === BossPhase.PHASE2) {
            p5.stroke(0);
            p5.strokeWeight(3);
            p5.line(-eyeOffset - 8, -eyeOffset - 8, -eyeOffset + 8, -eyeOffset - 4);
            p5.line(eyeOffset - 8, -eyeOffset - 4, eyeOffset + 8, -eyeOffset - 8);
        }
        
        // Mode debug
        if (Vehicle.debug) {
            p5.stroke(0, 255, 255);
            p5.strokeWeight(2);
            const force = this.currentSteeringForce.mult(0.3);
            p5.line(0, 0, force.x, force.y);
        }
        
        p5.pop();
    }
}
