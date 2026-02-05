// ============================================
// Main Entry Point - p5.js Setup
// ============================================

import { Game } from './engine/Game.js';

let game;

// p5.js instance mode setup
window.setup = function() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent(document.body);
    
    game = new Game(window);
};

window.draw = function() {
    game.tick(millis());
};

window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
    game.resize(windowWidth, windowHeight);
};

window.keyPressed = function() {
    game.keyPressed(keyCode);
    return false; // Prevent default browser behavior
};

window.keyReleased = function() {
    game.keyReleased(keyCode);
    return false;
};

window.mousePressed = function() {
    game.mousePressed(mouseButton === LEFT ? 0 : mouseButton === RIGHT ? 2 : 1);
    return false;
};

window.mouseReleased = function() {
    game.mouseReleased(mouseButton === LEFT ? 0 : mouseButton === RIGHT ? 2 : 1);
    return false;
};

window.mouseMoved = function() {
    game.mouseMoved(mouseX, mouseY);
};

window.mouseDragged = function() {
    game.mouseMoved(mouseX, mouseY);
};
