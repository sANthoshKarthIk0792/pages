import GameEnvBackground from './GameEngine/GameEnvBackground.js';
import Player from './GameEngine/Player.js';
import Npc from './GameEngine/Npc.js';
import GhastFireball from './GameEngine/GhastFireball.js';

class GameLevelNether {
  constructor(gameEnv) {
    // Store gameEnv reference for later use
    this.gameEnv = gameEnv;
    
    let width = gameEnv.innerWidth;
    let height = gameEnv.innerHeight;
    let path = gameEnv.path;

    console.log("Game path:", path);

    // Nether background
    const image_src_nether = path + "/images/gamify/nether_background.png";
    const image_data_nether = {
      name: 'Nether-Background',
      src: image_src_nether,
      pixels: { height: 570, width: 1025 }
    };

    // Player - Steve/Alex character
    const sprite_src_steve = path + "/images/gamify/steve.png";
    const STEVE_SCALE_FACTOR = 6;
    const sprite_data_steve = {
      id: 'Steve',
      greeting: "Hi, I am Steve.",
      src: sprite_src_steve,
      SCALE_FACTOR: STEVE_SCALE_FACTOR,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 25,
      INIT_POSITION: { x: width/16, y: height/2 },
      pixels: {height: 256, width: 128},
      orientation: {rows: 8, columns: 4 },
      down: {row: 1, start: 0, columns: 4 },
      downRight: {row: 7, start: 0, columns: 4, rotate: Math.PI/8 },
      downLeft: {row: 5, start: 0, columns: 4, rotate: -Math.PI/8 },
      left: {row: 5, start: 0, columns: 4 },
      right: {row: 7, start: 0, columns: 4 },
      up: {row: 3, start: 0, columns: 4 },
      upLeft: {row: 5, start: 0, columns: 4, rotate: Math.PI/8 },
      upRight: {row: 7, start: 0, columns: 4, rotate: -Math.PI/8 },
      hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
      keypress: { up: 87, left: 65, down: 83, right: 68 },
      health: 100,
      canHitFireballs: true,
      isAttacking: false,
      attackCooldown: 0,
      
      // FIXED: Store gameEnv reference in player data
      gameEnv: gameEnv,
      
      handleAttack: function() {
          if (this.attackCooldown <= 0) {
              this.isAttacking = true;
              this.attackCooldown = 20;
              
              setTimeout(() => {
                  this.isAttacking = false;
              }, 300);
          }
      },
      
      reaction: function () {
        if (this.health > 0) {
          this.health -= 20;
          console.log(`Steve health: ${this.health}`);
          if (this.health <= 0) {
            this.handleGameOver();
          } else {
            console.log(`Ouch! Health remaining: ${this.health}`);
          }
        }
      },
      
      handleGameOver: function() {
        this.showGameOverScreen();
        setTimeout(() => {
          this.resetLevel();
        }, 3000);
      },
      
      showGameOverScreen: function() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'game-over-screen';
        gameOverDiv.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.8); display: flex; flex-direction: column;
          justify-content: center; align-items: center; z-index: 10000;
          color: #FF0000; font-size: 48px; font-family: Arial, sans-serif;
        `;
        gameOverDiv.innerHTML = `
          <div>GAME OVER</div>
          <div style="font-size: 24px; margin-top: 20px;">Restarting in 3 seconds...</div>
        `;
        document.body.appendChild(gameOverDiv);
      },
      
      resetLevel: function() {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
          gameOverScreen.remove();
        }
        
        if (this.gameEnv && this.gameEnv.gameControl) {
          this.gameEnv.gameControl.transitionToLevel();
        } else {
          location.reload();
        }
      }
    };

    // FIXED: Ghast sprite data with proper GhastFireball reference
    const sprite_src_ghast = path + "/images/gamify/ghast_sprite.png";
    const GHAST_SCALE_FACTOR = 3;
    const sprite_data_ghast = {
      id: 'Ghast',
      down: { row: 0, start: 0, columns: 4 },
      greeting: "ROOOOOAAAAAR! *shoots fireballs*",
      src: sprite_src_ghast,
      SCALE_FACTOR: GHAST_SCALE_FACTOR,
      ANIMATION_RATE: 100,
      pixels: { width: 256, height: 256 },
      INIT_POSITION: { x: width - 300, y: 100 },
      orientation: { rows: 2, columns: 4 },
      idle: { row: 0, start: 0, columns: 4 },
      shooting: { row: 1, start: 0, columns: 4 },
      hitbox: { widthPercentage: 0.8, heightPercentage: 0.8 },
      health: 150,
      fireballCooldown: 0,
      fireballRate: 120,
      isEnemy: true,
      
      // Store references needed for fireball creation
      gameEnv: gameEnv,
      GhastFireball: GhastFireball, // FIXED: Store reference to GhastFireball class
      
      update: function () {
        // Ensure gameEnv reference is available
        if (!this.gameEnv) {
          if (this.parent && this.parent.gameEnv) {
            this.gameEnv = this.parent.gameEnv;
          } else {
            console.error("Ghast: gameEnv reference missing!");
            return;
          }
        }

        // Find the player
        const players = this.gameEnv.gameObjects.filter(obj =>
          obj.constructor.name === 'Player' && obj.spriteData.id === 'Steve'
        );

        if (players.length === 0) {
          return;
        }
        
        const player = players[0];

        // Reduce cooldown
        if (this.fireballCooldown > 0) {
          this.fireballCooldown--;
        }

        // Calculate distance to player
        const dx = player.position.x - this.position.x;
        const dy = player.position.y - this.position.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

        // Only shoot if player is within range and cooldown is ready
        if (this.fireballCooldown <= 0 && distanceToPlayer < 800) {
          console.log("Ghast: Attempting to shoot fireball!");
          this.shootFireball(player);
          this.fireballCooldown = this.fireballRate;
          this.direction = 'shooting';
        } else {
          this.direction = 'idle';
        }

        // Enhanced floating movement
        const time = Date.now() * 0.001;
        this.position.y += Math.sin(time) * 0.8;
        this.position.x += Math.cos(time * 0.7) * 0.3;
        
        // Keep Ghast within bounds
        if (this.position.x < this.gameEnv.innerWidth * 0.6) {
          this.position.x = this.gameEnv.innerWidth * 0.6;
        }
        if (this.position.x > this.gameEnv.innerWidth - 100) {
          this.position.x = this.gameEnv.innerWidth - 100;
        }
        if (this.position.y < 50) {
          this.position.y = 50;
        }
        if (this.position.y > this.gameEnv.innerHeight * 0.6) {
          this.position.y = this.gameEnv.innerHeight * 0.6;
        }
      },

      // FIXED: Proper shootFireball method with error handling
      shootFireball: function (target) {
        console.log('Ghast: shootFireball method called!');
        
        if (!this.gameEnv) {
          console.error("Ghast: Cannot shoot - gameEnv missing!");
          return;
        }

        if (!target || !target.position) {
          console.error("Ghast: Cannot shoot - invalid target!");
          return;
        }

        // Calculate spawn position (center of Ghast)
        const spawnX = this.position.x + (this.size ? this.size.width / 2 : 50);
        const spawnY = this.position.y + (this.size ? this.size.height / 2 : 50);
        
        console.log(`Ghast: Creating fireball at (${Math.round(spawnX)}, ${Math.round(spawnY)})`);
        
        try {
          // FIXED: Use the stored GhastFireball reference
          if (this.GhastFireball) {
            const fireball = new this.GhastFireball(
              spawnX, 
              spawnY, 
              target, 
              this.gameEnv,
              3,      // speed
              0.06    // turn rate
            );
            
            // Add the fireball to the game objects
            this.gameEnv.gameObjects.push(fireball);
            console.log(`Ghast: Fireball created successfully!`);
          } else {
            console.error("Ghast: GhastFireball class not available!");
          }
          
        } catch (error) {
          console.error("Ghast: Error creating fireball:", error);
        }
      },

      reaction: function () {
        this.health -= 30;
        console.log(`Ghast health: ${this.health}`);
        if (this.health <= 0) {
          console.log("Victory! You defeated the Ghast!");
          // Remove ghast from game
          const index = this.gameEnv.gameObjects.indexOf(this.parent);
          if (index > -1) {
            this.gameEnv.gameObjects.splice(index, 1);
          }
        } else {
          console.log(`Ghast damaged! Health remaining: ${this.health}`);
        }
      }
    };

    // Portal back to desert
    const sprite_src_portal = path + "/images/gamify/nether_portal.png";
    const sprite_data_portal = {
      id: 'Nether-Portal',
      greeting: "Return to the Desert?",
      src: sprite_src_portal,
      SCALE_FACTOR: 4,
      ANIMATION_RATE: 100,
      pixels: { width: 640, height: 800 },
      INIT_POSITION: { x: 50, y: height - 250 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 2, heightPercentage: 2 },
      dialogues: [
        "The portal shimmers with otherworldly energy.",
        "You can return to the Desert through this portal.",
        "The familiar world awaits beyond this threshold."
      ],
      interact: function () {
        const confirmReturn = confirm("Return to the Desert? (This will end the Nether challenge)");
        if (confirmReturn) {
          if (gameEnv && gameEnv.gameControl) {
            this.cleanupNetherLevel();
            gameEnv.gameControl.goToLevel("Desert");
          }
        }
      },
      cleanupNetherLevel: function() {
        const netherElements = document.querySelectorAll('[id*="nether"], [id*="fireball"], [id*="ghast"]');
        netherElements.forEach(element => element.remove());
      }
    };

    // Other game objects...
    const sprite_src_lava = path + "/images/gamify/lava.png";
    const sprite_data_lava = {
      id: 'Lava-Pool',
      src: sprite_src_lava,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 75,
      pixels: { width: 128, height: 64 },
      INIT_POSITION: { x: width / 2, y: height - 100 },
      orientation: { rows: 1, columns: 8 },
      down: { row: 0, start: 0, columns: 8 },
      hitbox: { widthPercentage: 0.9, heightPercentage: 0.5 },
      damage: 15,
      reaction: function () {
        console.log("Player touched lava!");
      }
    };

    const sprite_src_potion = path + "/images/gamify/health_potion.png";
    const sprite_data_potion = {
      id: 'Health-Potion',
      greeting: "Health Potion - restores 50 HP",
      src: sprite_src_potion,
      SCALE_FACTOR: 12,
      pixels: { width: 32, height: 32 },
      INIT_POSITION: { x: width * 0.75, y: height - 200 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.8, heightPercentage: 0.8 },
      isPickup: true,
      healAmount: 50,
      reaction: function () {
        const players = this.gameEnv.gameObjects.filter(obj =>
          obj.constructor.name === 'Player' && obj.spriteData.id === 'Steve'
        );
        
        if (players.length > 0) {
          const player = players[0];
          player.spriteData.health = Math.min(player.spriteData.health + this.spriteData.healAmount, 100);
          console.log(`Player healed! Health: ${player.spriteData.health}`);
          
          const index = this.gameEnv.gameObjects.indexOf(this);
          if (index > -1) {
            this.gameEnv.gameObjects.splice(index, 1);
          }
        }
      }
    };

    // FIXED: Ensure all objects have gameEnv reference
    this.classes = [
      { class: GameEnvBackground, data: image_data_nether },
      { class: Player, data: sprite_data_steve, gameEnv: gameEnv },
      { class: Npc, data: sprite_data_ghast, gameEnv: gameEnv },
      { class: Npc, data: sprite_data_portal, gameEnv: gameEnv },
      { class: Npc, data: sprite_data_lava, gameEnv: gameEnv },
      { class: Npc, data: sprite_data_potion, gameEnv: gameEnv }
    ];
    
    this.cleanupPreviousLevel(gameEnv);
  }

  // Your existing cleanup methods remain the same...
  cleanupPreviousLevel(gameEnv) {
    console.log("Cleaning up previous level objects...");
    
    const essentialElements = this.preserveEssentialElements();
    this.clearGameObjects(gameEnv);
    this.removePreviousUI(essentialElements);
    this.clearIntervals();
    this.resetGlobalStates();
    this.cleanupEventListeners();
  }
  
  preserveEssentialElements() {
    const essentialSelectors = [
      'canvas',
      '#gameContainer',
      '[data-game-env]',
      '.game-engine'
    ];
    
    const essential = [];
    essentialSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => essential.push(el));
    });
    
    return essential;
  }
  
  clearGameObjects(gameEnv) {
    if (gameEnv && gameEnv.gameObjects) {
      const objectsToRemove = [...gameEnv.gameObjects];
      
      objectsToRemove.forEach(obj => {
        try {
          if (obj && typeof obj.destroy === 'function') {
            obj.destroy();
          }
          
          if (obj && obj.element && obj.element.parentNode) {
            if (obj.element.tagName !== 'CANVAS') {
              obj.element.parentNode.removeChild(obj.element);
            }
          }
          
          if (obj.intervalId) {
            clearInterval(obj.intervalId);
          }
          
          if (obj.timeoutId) {
            clearTimeout(obj.timeoutId);
          }
          
        } catch (error) {
          console.warn('Error cleaning up object:', error);
        }
      });
      
      gameEnv.gameObjects.length = 0;
    }
  }
  
  removePreviousUI(essentialElements = []) {
    const essentialSet = new Set(essentialElements);
    
    const elementsToRemove = [
      'eye-counter-container', 'game-timer', 'dom-portal', 
      'game-over-screen', 'dialogue-container', 'level-ui', 
      'score-display', 'health-bar'
    ];
    
    elementsToRemove.forEach(id => {
      const element = document.getElementById(id);
      if (element && !essentialSet.has(element)) {
        element.remove();
      }
    });
  }
  
  clearIntervals() {
    if (window.gameIntervals) {
      window.gameIntervals.forEach(interval => clearInterval(interval));
      window.gameIntervals = [];
    }
    
    if (window.gameTimeouts) {
      window.gameTimeouts.forEach(timeout => clearTimeout(timeout));
      window.gameTimeouts = [];
    }
  }
  
  cleanupEventListeners() {
    if (window.gameKeyListeners) {
      window.gameKeyListeners.forEach(({ type, listener }) => {
        document.removeEventListener(type, listener);
      });
      window.gameKeyListeners = [];
    }
  }
  
  resetGlobalStates() {
    if (window.gameStats) {
      const preservedStats = {
        totalScore: window.gameStats.totalScore || 0,
        playerName: window.gameStats.playerName || ''
      };
      
      window.gameStats = {
        ...preservedStats,
        eyesCollected: 0,
        gameCompleted: false,
        startTime: Date.now(),
        levelStartTime: Date.now()
      };
    }
    
    window.levelComplete = false;
    window.gameOver = false;
    
    if (window.gameEnv && window.gameEnv.ctx) {
      const ctx = window.gameEnv.ctx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }
}

export default GameLevelNether;