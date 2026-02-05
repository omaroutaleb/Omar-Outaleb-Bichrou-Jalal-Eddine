// ============================================
// HUD - Heads-Up Display
// ============================================

import { UI, COLORS } from '../config.js';

export class HUD {
    constructor() {
        this.gameTime = 0;
    }
    
    update(dt) {
        this.gameTime += dt;
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    draw(p5, player, spawner, upgradeSystem) {
        p5.push();
        
        // HP Bar (top-left)
        this.drawPlayerHP(p5, player);
        
        // Stats (below HP)
        this.drawStats(p5, player);
        
        // Time (top-left, below stats)
        this.drawTime(p5);
        
        // Objective text (left side)
        this.drawObjective(p5, spawner);
        
        // Boss HP bar (top-center)
        if (spawner.boss && spawner.boss.alive) {
            this.drawBossHP(p5, spawner.boss);
        }
        
        // Victory/Game Over overlay
        if (spawner.state === 'victory') {
            this.drawVictory(p5);
        } else if (!player.alive) {
            this.drawGameOver(p5);
        }
        
        p5.pop();
    }
    
    drawPlayerHP(p5, player) {
        const x = 20;
        const y = 20;
        const w = UI.HP_BAR_WIDTH;
        const h = UI.HP_BAR_HEIGHT;
        
        // Background
        p5.noStroke();
        p5.fill(COLORS.HP_BG);
        p5.rect(x, y, w, h, 3);
        
        // HP fill
        const hpPercent = player.hp / player.maxHp;
        const fillColor = hpPercent > 0.3 ? COLORS.HP_FILL : COLORS.HP_LOW;
        p5.fill(fillColor);
        p5.rect(x, y, w * hpPercent, h, 3);
        
        // Border
        p5.noFill();
        p5.stroke(100);
        p5.strokeWeight(2);
        p5.rect(x, y, w, h, 3);
        
        // HP text
        p5.fill(255);
        p5.noStroke();
        p5.textSize(14);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text(`${Math.ceil(player.hp)} / ${player.maxHp}`, x + w / 2, y + h / 2);
    }
    
    drawStats(p5, player) {
        const x = 20;
        let y = 50;
        
        p5.fill(255);
        p5.noStroke();
        p5.textSize(14);
        p5.textAlign(p5.LEFT, p5.TOP);
        
        // Level
        p5.text(`Level: ${player.level}`, x, y);
        y += 20;
        
        // Coins
        p5.fill(255, 215, 0);
        p5.text(`💰 ${player.coins}`, x, y);
        y += 20;
        
        // XP bar small
        p5.fill(100);
        p5.rect(x, y, 100, 8, 2);
        const xpNeeded = 50 * Math.pow(1.5, player.level - 1);
        const xpPercent = Math.min(1, player.xp / xpNeeded);
        p5.fill(100, 200, 255);
        p5.rect(x, y, 100 * xpPercent, 8, 2);
    }
    
    drawTime(p5) {
        const x = 20;
        const y = 110;
        
        p5.fill(200);
        p5.noStroke();
        p5.textSize(14);
        p5.textAlign(p5.LEFT, p5.TOP);
        p5.text(`Time: ${this.formatTime(this.gameTime)}`, x, y);
    }
    
    drawObjective(p5, spawner) {
        const x = 20;
        const y = 140;
        
        p5.fill(255, 200, 100);
        p5.noStroke();
        p5.textSize(16);
        p5.textAlign(p5.LEFT, p5.TOP);
        p5.text(`🎯 ${spawner.objective}`, x, y);
        
        // Enemy count
        p5.fill(200);
        p5.textSize(12);
        p5.text(`Enemies: ${spawner.getEnemyCount()}`, x, y + 22);
    }
    
    drawBossHP(p5, boss) {
        const x = (p5.width - UI.BOSS_BAR_WIDTH) / 2;
        const y = 20;
        const w = UI.BOSS_BAR_WIDTH;
        const h = UI.BOSS_BAR_HEIGHT;
        
        // Boss name
        p5.fill(255);
        p5.noStroke();
        p5.textSize(18);
        p5.textAlign(p5.CENTER, p5.BOTTOM);
        p5.text('THE CRIMSON TITAN', x + w / 2, y - 5);
        
        // Background
        p5.fill(COLORS.BOSS_HP_BG);
        p5.noStroke();
        p5.rect(x, y, w, h, 4);
        
        // HP fill
        const hpPercent = boss.hp / boss.maxHp;
        const gradient = boss.phase === 2 ? '#f82' : COLORS.BOSS_HP_FILL;
        p5.fill(gradient);
        p5.rect(x, y, w * hpPercent, h, 4);
        
        // Phase indicator
        if (boss.phase === 2) {
            p5.fill(255, 100, 50);
            p5.textSize(12);
            p5.textAlign(p5.RIGHT, p5.CENTER);
            p5.text('ENRAGED', x + w - 10, y + h / 2);
        }
        
        // Border
        p5.noFill();
        p5.stroke(200, 50, 50);
        p5.strokeWeight(2);
        p5.rect(x, y, w, h, 4);
    }
    
    drawVictory(p5) {
        // Darken
        p5.fill(0, 0, 0, 150);
        p5.noStroke();
        p5.rect(0, 0, p5.width, p5.height);
        
        // Victory text
        p5.fill(255, 215, 0);
        p5.textSize(64);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('VICTORY!', p5.width / 2, p5.height / 2 - 40);
        
        p5.fill(255);
        p5.textSize(24);
        p5.text(`Time: ${this.formatTime(this.gameTime)}`, p5.width / 2, p5.height / 2 + 20);
        
        p5.textSize(18);
        p5.fill(200);
        p5.text('Press R to restart', p5.width / 2, p5.height / 2 + 60);
    }
    
    drawGameOver(p5) {
        // Darken
        p5.fill(0, 0, 0, 150);
        p5.noStroke();
        p5.rect(0, 0, p5.width, p5.height);
        
        // Game Over text
        p5.fill(255, 50, 50);
        p5.textSize(64);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('GAME OVER', p5.width / 2, p5.height / 2 - 40);
        
        p5.fill(255);
        p5.textSize(24);
        p5.text(`Time survived: ${this.formatTime(this.gameTime)}`, p5.width / 2, p5.height / 2 + 20);
        
        p5.textSize(18);
        p5.fill(200);
        p5.text('Press R to restart', p5.width / 2, p5.height / 2 + 60);
    }
    
    reset() {
        this.gameTime = 0;
    }
}
