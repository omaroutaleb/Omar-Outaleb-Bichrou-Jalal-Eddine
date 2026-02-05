// ============================================
// Upgrades - Progression and Upgrade System
// ============================================

import { UPGRADES } from '../config.js';

export const UpgradeType = {
    MAX_HP: 'maxHp',
    DAMAGE: 'damage',
    SPEED: 'speed',
    DASH_COOLDOWN: 'dashCooldown',
    ATTACK_ARC: 'attackArc',
    ATTACK_RANGE: 'attackRange'
};

// All possible upgrades
const UPGRADE_POOL = [
    {
        type: UpgradeType.MAX_HP,
        name: '+25 Max HP',
        description: 'Increase maximum health',
        value: 25,
        icon: '❤️'
    },
    {
        type: UpgradeType.DAMAGE,
        name: '+10 Damage',
        description: 'Hit harder',
        value: 10,
        icon: '⚔️'
    },
    {
        type: UpgradeType.SPEED,
        name: '+30 Speed',
        description: 'Move faster',
        value: 30,
        icon: '👟'
    },
    {
        type: UpgradeType.DASH_COOLDOWN,
        name: '-0.15s Dash CD',
        description: 'Dash more often',
        value: 0.15,
        icon: '💨'
    },
    {
        type: UpgradeType.ATTACK_ARC,
        name: '+20° Arc',
        description: 'Wider sword swing',
        value: Math.PI * 20 / 180,
        icon: '🌙'
    },
    {
        type: UpgradeType.ATTACK_RANGE,
        name: '+15 Range',
        description: 'Longer reach',
        value: 15,
        icon: '📏'
    }
];

export class UpgradeSystem {
    constructor() {
        this.xpThreshold = UPGRADES.BASE_XP_THRESHOLD;
        this.xpMultiplier = UPGRADES.XP_MULTIPLIER;
        
        this.pendingUpgrade = false;
        this.upgradeOptions = [];
        this.selectedIndex = -1;
    }
    
    // Calculate XP needed for next level
    getXPForLevel(level) {
        return Math.floor(UPGRADES.BASE_XP_THRESHOLD * Math.pow(this.xpMultiplier, level - 1));
    }
    
    // Check if player should level up
    checkLevelUp(player) {
        const xpNeeded = this.getXPForLevel(player.level);
        
        if (player.xp >= xpNeeded) {
            player.xp -= xpNeeded;
            player.level++;
            this.triggerUpgradeSelection();
            return true;
        }
        
        return false;
    }
    
    // Start upgrade selection
    triggerUpgradeSelection() {
        this.pendingUpgrade = true;
        this.upgradeOptions = this.getRandomUpgrades(3);
        this.selectedIndex = 0;
    }
    
    // Get random upgrades from pool
    getRandomUpgrades(count) {
        const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    // Select an upgrade
    selectUpgrade(index, player) {
        if (index < 0 || index >= this.upgradeOptions.length) return false;
        
        const upgrade = this.upgradeOptions[index];
        player.applyUpgrade(upgrade);
        
        this.pendingUpgrade = false;
        this.upgradeOptions = [];
        this.selectedIndex = -1;
        
        return true;
    }
    
    // Navigate selection
    navigateSelection(direction) {
        if (!this.pendingUpgrade) return;
        
        this.selectedIndex += direction;
        if (this.selectedIndex < 0) this.selectedIndex = this.upgradeOptions.length - 1;
        if (this.selectedIndex >= this.upgradeOptions.length) this.selectedIndex = 0;
    }
    
    // Draw upgrade selection UI
    draw(p5, screenWidth, screenHeight) {
        if (!this.pendingUpgrade) return;
        
        // Darken background
        p5.push();
        p5.fill(0, 0, 0, 180);
        p5.noStroke();
        p5.rect(0, 0, screenWidth, screenHeight);
        
        // Title
        p5.fill(255);
        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('LEVEL UP!', screenWidth / 2, 100);
        
        p5.textSize(18);
        p5.text('Choose an upgrade (1/2/3 or click)', screenWidth / 2, 140);
        
        // Draw upgrade cards
        const cardWidth = 180;
        const cardHeight = 220;
        const cardSpacing = 30;
        const totalWidth = this.upgradeOptions.length * cardWidth + (this.upgradeOptions.length - 1) * cardSpacing;
        const startX = (screenWidth - totalWidth) / 2;
        const cardY = screenHeight / 2 - cardHeight / 2;
        
        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const upgrade = this.upgradeOptions[i];
            const x = startX + i * (cardWidth + cardSpacing);
            const isSelected = i === this.selectedIndex;
            
            // Card background
            if (isSelected) {
                p5.fill(80, 120, 180);
                p5.stroke(255);
                p5.strokeWeight(3);
            } else {
                p5.fill(40, 50, 70);
                p5.stroke(100);
                p5.strokeWeight(1);
            }
            p5.rect(x, cardY, cardWidth, cardHeight, 10);
            
            // Icon
            p5.textSize(40);
            p5.noStroke();
            p5.fill(255);
            p5.text(upgrade.icon, x + cardWidth / 2, cardY + 50);
            
            // Name
            p5.textSize(16);
            p5.fill(255);
            p5.text(upgrade.name, x + cardWidth / 2, cardY + 110);
            
            // Description
            p5.textSize(12);
            p5.fill(180);
            p5.text(upgrade.description, x + cardWidth / 2, cardY + 140);
            
            // Key hint
            p5.textSize(14);
            p5.fill(isSelected ? 255 : 150);
            p5.text(`[${i + 1}]`, x + cardWidth / 2, cardY + cardHeight - 30);
        }
        
        p5.pop();
    }
    
    // Handle click on upgrade card
    handleClick(mouseX, mouseY, screenWidth, screenHeight, player) {
        if (!this.pendingUpgrade) return false;
        
        const cardWidth = 180;
        const cardHeight = 220;
        const cardSpacing = 30;
        const totalWidth = this.upgradeOptions.length * cardWidth + (this.upgradeOptions.length - 1) * cardSpacing;
        const startX = (screenWidth - totalWidth) / 2;
        const cardY = screenHeight / 2 - cardHeight / 2;
        
        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const x = startX + i * (cardWidth + cardSpacing);
            
            if (mouseX >= x && mouseX <= x + cardWidth &&
                mouseY >= cardY && mouseY <= cardY + cardHeight) {
                return this.selectUpgrade(i, player);
            }
        }
        
        return false;
    }
}
