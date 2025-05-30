import Character from './Character.js';
import HomingProjectile from './HomingProjectile.js'; // Import the HomingProjectile class

// Define non-mutable constants as defaults
const SCALE_FACTOR = 25; // 1/nth of the height of the canvas
const STEP_FACTOR = 100; // 1/nth, or N steps up and across the canvas
const ANIMATION_RATE = 1; // 1/nth of the frame rate
const INIT_POSITION = { x: 0, y: 0 };


class Player extends Character {
    /**
     * The constructor method is called when a new Player object is created.
     * 
     * @param {Object|null} data - The sprite data for the object. If null, a default red square is used.
     */
    constructor(data = null, gameEnv = null) {
        super(data, gameEnv);
        this.keypress = data?.keypress || {up: 87, left: 65, down: 83, right: 68};
        this.pressedKeys = {}; // active keys array
        this.bindMovementKeyListners();
        this.bindShootKeyListener(); // Add shoot key listener
        this.gravity = data.GRAVITY || false;
        this.acceleration = 0.001;
        this.time = 0;
        this.moved = false;
        this.projectiles = []; // Array to store active projectiles
    }

    /**
     * Binds key event listeners to handle object movement.
     * 
     * This method binds keydown and keyup event listeners to handle object movement.
     * The .bind(this) method ensures that 'this' refers to the object object.
     */
    bindMovementKeyListners() {
        addEventListener('keydown', this.handleKeyDown.bind(this));
        addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * Binds the shoot key listener
     */
    bindShootKeyListener() {
        addEventListener('keydown', this.handleShootKeyDown.bind(this));
    }

    handleKeyDown({ keyCode }) {
        // capture the pressed key in the active keys array
        this.pressedKeys[keyCode] = true;
        // set the velocity and direction based on the newly pressed key
        this.updateVelocityAndDirection();
    }

    /**
     * Handles key up events to stop the player's velocity.
     * 
     * This method stops the player's velocity based on the key released.
     * 
     * @param {Object} event - The keyup event object.
     */
    handleKeyUp({ keyCode }) {
        // remove the lifted key from the active keys array
        if (keyCode in this.pressedKeys) {
            delete this.pressedKeys[keyCode];
        }
        // adjust the velocity and direction based on the remaining keys
        this.updateVelocityAndDirection();
    }

    /**
     * Fires a homing projectile at the nearest enemy when 'V' is pressed
     */
    handleShootKeyDown(event) {
        if (event.key === 'v' || event.key === 'V') {
            console.log('V key pressed - attempting to fire projectile');
            
            // Debug: Check if gameEnv and gameObjects exist
            if (!this.gameEnv) {
                console.error('gameEnv is not defined');
                return;
            }
            
            if (!this.gameEnv.gameObjects) {
                console.error('gameObjects is not defined');
                return;
            }
            
            console.log('Total game objects:', this.gameEnv.gameObjects.length);
            
            // Find enemies in the game environment with better filtering
            const enemies = this.gameEnv.gameObjects.filter(obj => {
                // Skip if this is the current player
                if (obj === this) {
                    return false;
                }
                
                // Check if object has enemy properties
                const isEnemy = obj?.spriteData?.isEnemy || obj?.isEnemy;
                
                // Debug log each object
                if (obj?.spriteData?.id) {
                    console.log(`Checking ${obj.spriteData.id}: isEnemy=${isEnemy}`);
                }
                
                return isEnemy;
            });
            
            console.log('Found enemies:', enemies.length);
            
            if (enemies.length === 0) {
                console.log('No enemies found to target');
                console.log('Available game objects:');
                this.gameEnv.gameObjects.forEach(obj => {
                    console.log(`- ${obj?.spriteData?.id || 'Unknown'}: isEnemy=${obj?.spriteData?.isEnemy || obj?.isEnemy}`);
                });
                return;
            }

            // Find the closest enemy with better error handling
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            for (const enemy of enemies) {
                if (!enemy.position) {
                    console.warn('Enemy has no position:', enemy);
                    continue;
                }
                
                const dx = enemy.position.x - this.position.x;
                const dy = enemy.position.y - this.position.y;
                const distance = dx * dx + dy * dy;
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
            
            if (!closestEnemy) {
                console.log('No valid enemy with position found');
                return;
            }

            console.log('Targeting closest enemy:', closestEnemy.spriteData?.id || 'Unknown');

            // Create a homing projectile with error handling
            try {
                const projectile = new HomingProjectile(
                    this.position.x + (this.size?.width || 0) / 2, // Center of player
                    this.position.y + (this.size?.height || 0) / 2, // Center of player
                    closestEnemy,
                    this.gameEnv // Pass gameEnv as the 4th parameter
                );
                
                // Add to both local projectiles array and game objects
                this.projectiles.push(projectile);
                this.gameEnv.gameObjects.push(projectile);
                
                console.log('Projectile created and added to game');
            } catch (error) {
                console.error('Error creating projectile:', error);
            }
        }
    }

    /**
     * Update the player's velocity and direction based on the pressed keys.
     */
    updateVelocityAndDirection() {
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Multi-key movements (diagonals: upLeft, upRight, downLeft, downRight)
        if (this.pressedKeys[this.keypress.up] && this.pressedKeys[this.keypress.left]) {
            this.velocity.y -= this.yVelocity;
            this.velocity.x -= this.xVelocity;
            this.direction = 'upLeft';
        } else if (this.pressedKeys[this.keypress.up] && this.pressedKeys[this.keypress.right]) {
            this.velocity.y -= this.yVelocity;
            this.velocity.x += this.xVelocity;
            this.direction = 'upRight';
        } else if (this.pressedKeys[this.keypress.down] && this.pressedKeys[this.keypress.left]) {
            this.velocity.y += this.yVelocity;
            this.velocity.x -= this.xVelocity;
            this.direction = 'downLeft';
        } else if (this.pressedKeys[this.keypress.down] && this.pressedKeys[this.keypress.right]) {
            this.velocity.y += this.yVelocity;
            this.velocity.x += this.xVelocity;
            this.direction = 'downRight';
        // Single key movements (left, right, up, down) 
        } else if (this.pressedKeys[this.keypress.up]) {
            this.velocity.y -= this.yVelocity;
            this.direction = 'up';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.left]) {
            this.velocity.x -= this.xVelocity;
            this.direction = 'left';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.down]) {
            this.velocity.y += this.yVelocity;
            this.direction = 'down';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.right]) {
            this.velocity.x += this.xVelocity;
            this.direction = 'right';
            this.moved = true;
        } else{
            this.moved = false;
        }
    }

    update() {
        super.update();
        
        // Update projectiles more efficiently
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
                const gameIndex = this.gameEnv.gameObjects.indexOf(projectile);
                if (gameIndex > -1) {
                    this.gameEnv.gameObjects.splice(gameIndex, 1);
                }
                continue;
            }
            
            projectile.update();
            
            // Check bounds
            if (projectile.position.x < -50 || projectile.position.x > this.gameEnv.innerWidth + 50 ||
                projectile.position.y < -50 || projectile.position.y > this.gameEnv.innerHeight + 50) {
                
                projectile.active = false;
                this.projectiles.splice(i, 1);
                
                const gameIndex = this.gameEnv.gameObjects.indexOf(projectile);
                if (gameIndex > -1) {
                    this.gameEnv.gameObjects.splice(gameIndex, 1);
                }
            }
        }
        
        // Gravity logic
        if (!this.moved) {
            if (this.gravity) {
                this.time += 1;
                this.velocity.y += 0.5 + this.acceleration * this.time;
            }
        } else {
            this.time = 0;
        }
    }
        
    /**
     * Overrides the reaction to the collision to handle
     *  - clearing the pressed keys array
     *  - stopping the player's velocity
     *  - updating the player's direction   
     * @param {*} other - The object that the player is colliding with
     */
    handleCollisionReaction(other) {    
        this.pressedKeys = {};
        this.updateVelocityAndDirection();
        super.handleCollisionReaction(other);
    }
}

export default Player;