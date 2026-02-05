// ============================================
// Audio - Sound Effects (WebAudio Stub)
// ============================================

export class Audio {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.volume = 0.3;
        
        // Try to initialize audio context
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('WebAudio not supported');
            this.enabled = false;
        }
    }
    
    // Resume audio context (required after user interaction)
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    
    // Play a simple tone
    playTone(frequency, duration, type = 'square', volumeMult = 1) {
        if (!this.enabled || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.value = this.volume * volumeMult;
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }
    
    // Sound effects
    playHit() {
        this.playTone(200, 0.1, 'square', 0.5);
        setTimeout(() => this.playTone(150, 0.05, 'square', 0.3), 30);
    }
    
    playDash() {
        this.playTone(400, 0.1, 'sawtooth', 0.3);
        this.playTone(600, 0.05, 'sawtooth', 0.2);
    }
    
    playPlayerHit() {
        this.playTone(100, 0.15, 'square', 0.6);
        this.playTone(80, 0.1, 'square', 0.4);
    }
    
    playEnemyDeath() {
        this.playTone(300, 0.1, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.3), 50);
    }
    
    playLevelUp() {
        this.playTone(400, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.4), 100);
        setTimeout(() => this.playTone(600, 0.15, 'sine', 0.5), 200);
    }
    
    playBossHit() {
        this.playTone(150, 0.15, 'square', 0.6);
    }
    
    playBossSlam() {
        this.playTone(60, 0.3, 'sawtooth', 0.7);
        this.playTone(50, 0.4, 'square', 0.5);
    }
    
    playVictory() {
        const notes = [400, 500, 600, 800];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.5), i * 150);
        });
    }
    
    playGameOver() {
        const notes = [300, 250, 200, 150];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'square', 0.4), i * 200);
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
}
