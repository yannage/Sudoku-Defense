/**
 * Simplified tower animation logic that restores original
 * position calculation while ensuring first-wave projectiles.
 */
 
 function getTowerTypeData(towerType) {
  // Try to get tower type data from the TowersModule
  if (window.TowersModule && typeof TowersModule.getTowerTypeData === 'function') {
    return TowersModule.getTowerTypeData(towerType);
  }
  
  // Fallback in case TowersModule is not accessible
  const fallbackTypes = {
    1: { projectileEmoji: "⚪" },
    2: { projectileEmoji: "🟦" },
    3: { projectileEmoji: "💢" },
    4: { projectileEmoji: "🟢" },
    5: { projectileEmoji: "🔵" },
    6: { projectileEmoji: "⚡" },
    7: { projectileEmoji: "🎲" },
    8: { projectileEmoji: "🔴" },
    9: { projectileEmoji: "⭐" },
    'special': { projectileEmoji: "🪩" }
  };
  
  return fallbackTypes[towerType] || { projectileEmoji: "⚪" };
}

const TowerAnimationsModule = (function() {
    // Private variables
    let projectiles = [];
    let projectileId = 0;
    let lastFrameTime = 0;
    let cellSize = 0;
    let boardElement = null;
    let boardRect = null;
    let isInitialized = false;

    // Pixi elements
    let pixiApp = null;
    let projectileContainerPixi = null;
    let hitEffects = [];
    
    /**
     * Initialize the animations module
     */
    function init() {
        console.log("TowerAnimations initialization started");
        projectiles = [];
        
        // Get the board element and its dimensions
        boardElement = document.getElementById('sudoku-board');
        if (boardElement) {
            boardRect = boardElement.getBoundingClientRect();
            
            // Get cell size from the board dimensions
            cellSize = boardRect.width / 9;
            console.log("TowerAnimations initialized with cellSize:", cellSize);
        } else {
            console.warn("Board element not found during TowerAnimations init");
            // Try again after a short delay
            setTimeout(init, 100);
            return;
        }
        
        // Create projectile container if it doesn't exist
        ensureProjectileContainer();

        // Create Pixi application and container
        ensurePixiApp();
        
        // Set up event listeners
        setupEventListeners();
        
        // Start animation loop
        requestAnimationFrame(animationLoop);
        
        isInitialized = true;
        console.log("TowerAnimations initialization completed");
    }
    
    /**
     * Ensure the projectile container exists
     */
    function ensureProjectileContainer() {
        if (!boardElement) {
            console.warn("Board element not available, can't create projectile container");
            boardElement = document.getElementById('sudoku-board');
            if (!boardElement) return;
        }

        // Check if container already exists
        let projectileContainer = document.getElementById('projectile-container');

        if (!projectileContainer) {
            projectileContainer = document.createElement('div');
            projectileContainer.id = 'projectile-container';
            projectileContainer.style.position = 'absolute';
            projectileContainer.style.top = '0';
            projectileContainer.style.left = '0';
            projectileContainer.style.width = '100%';
            projectileContainer.style.height = '100%';
            projectileContainer.style.pointerEvents = 'none';
            projectileContainer.style.zIndex = '20';
            boardElement.appendChild(projectileContainer);
            console.log("Projectile container created");
        }
    }

    /**
     * Ensure a Pixi application and projectile container exist
     */
    function ensurePixiApp() {
        if (!window.PIXI) return;

        const container = document.getElementById('projectile-container');
        if (!container) return;

        if (!pixiApp) {
            pixiApp = new PIXI.Application({
                width: container.clientWidth,
                height: container.clientHeight,
                transparent: true,
                antialias: true
            });
            container.appendChild(pixiApp.view);
            projectileContainerPixi = new PIXI.Container();
            pixiApp.stage.addChild(projectileContainerPixi);
            pixiApp.ticker.add(updateProjectiles);
        } else {
            pixiApp.renderer.resize(container.clientWidth, container.clientHeight);
        }
    }
    
    /**
     * Calculate tower position relative to the board
     * @param {Object} tower - The tower object
     * @returns {Object} Position {x, y} relative to the board
     */
    function calculateTowerPosition(tower) {
        if (!tower || typeof tower.row !== 'number' || typeof tower.col !== 'number') {
            console.error("Invalid tower data:", tower);
            return { x: 0, y: 0 };
        }
        
        // Calculate position based on grid coordinates
        const x = (tower.col + 0.5) * cellSize;
        const y = (tower.row + 0.5) * cellSize;
        
        return { x, y };
    }
    
    /**
     * Calculate enemy position relative to the board
     * @param {Object} enemy - The enemy object
     * @returns {Object} Position {x, y} relative to the board
     */
function calculateEnemyPosition(enemy) {
    // Check if enemy has direct x,y coordinates
    if (enemy && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
        return { x: enemy.x, y: enemy.y };
    }
    
    // If enemy has row, col, and progress (based on your error log), calculate position
    if (enemy && typeof enemy.row === 'number' && typeof enemy.col === 'number') {
        // Calculate position based on row, col and cellSize
        const x = enemy.col * cellSize;
        const y = enemy.row * cellSize;
        
        console.log("Calculated enemy position from row/col:", { x, y });
        return { x, y };
    }
    
    // Last fallback for other properties
    if (enemy) {
        console.log("Enemy missing standard coordinates, checking for other properties:", enemy);
        
        // Check if enemy has pathIndex and we can get path data
        if (typeof enemy.currentPathIndex === 'number' || typeof enemy.pathIndex === 'number') {
            // Use whichever path index is available
            const pathIndex = (typeof enemy.currentPathIndex === 'number') ? 
                  enemy.currentPathIndex : enemy.pathIndex;
            
            // Get path data if available
            let path = null;
            if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
                path = BoardManager.getPathArray();
                
                if (path && path.length > pathIndex) {
                    const pathCell = path[pathIndex];
                    if (pathCell && pathCell.length >= 2) {
                        // Path cells are usually [row, col] format
                        const x = pathCell[1] * cellSize + cellSize / 2;
                        const y = pathCell[0] * cellSize + cellSize / 2; 
                        
                        console.log("Calculated position from path:", { x, y });
                        return { x, y };
                    }
                }
            }
        }
    }
    
    // If no calculation methods worked, use fallback
    console.error("Could not determine enemy position, using fallback:", enemy);
    return { x: cellSize * 4, y: cellSize * 4 }; // Center of board as fallback
}
    
    /**
     * Create a tower attack effect
     * @param {Object} tower - The attacking tower
     * @param {Object} enemy - The target enemy
     */
    function createTowerAttackEffect(tower, enemy) {
        // Make sure we're initialized
        if (!isInitialized) {
            console.log("Tower animation not initialized yet, initializing now...");
            init();
            // Try again after initialization
            setTimeout(() => createTowerAttackEffect(tower, enemy), 50);
            return;
        }
        
        // Validate input data
        if (!tower || !enemy) {
            console.error("Invalid tower or enemy data for attack effect");
            return;
        }
        
        // Ensure tower is actually on the board (has row and col)
        if (typeof tower.row !== 'number' || typeof tower.col !== 'number') {
            console.error("Tower doesn't have valid position data:", tower);
            return;
        }
        
        // Make sure projectile container exists
        ensureProjectileContainer();
        
        // Add drop shadow to the tower
        addTowerGlowEffect(tower);
        
        // Create projectile from tower to enemy
        createProjectile(tower, enemy);
    }
    
    /**
     * Add glow effect to a tower
     * @param {Object} tower - The tower to add effect to
     */
    function addTowerGlowEffect(tower) {
        // Find the tower element
        const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
        
        if (!towerElement) return;
        
        // Add attacking class with drop shadow
        towerElement.classList.add('tower-attacking');
        
        // Remove the class after animation completes
        setTimeout(() => {
            towerElement.classList.remove('tower-attacking');
        }, 300);
    }
    
    /**
     * Create a projectile from tower to enemy
     * @param {Object} tower - The source tower
     * @param {Object} enemy - The target enemy
     */
    /**
 * Create a projectile from tower to enemy with specialized visuals
 * @param {Object} tower - The source tower
 * @param {Object} enemy - The target enemy
 */
function createProjectile(tower, enemy) {
    // Get correct positions
    const towerPos = calculateTowerPosition(tower);
    const enemyPos = calculateEnemyPosition(enemy);

    ensureProjectileContainer();
    ensurePixiApp();

    const projectile = {
        id: `projectile_${++projectileId}`,
        startX: towerPos.x,
        startY: towerPos.y,
        targetX: enemyPos.x,
        targetY: enemyPos.y,
        progress: 0,
        speed: 0.02,
        target: enemy.id,
        towerType: tower.type
    };

    if (isNaN(projectile.startX) || isNaN(projectile.startY) ||
        isNaN(projectile.targetX) || isNaN(projectile.targetY)) {
        console.error("Invalid projectile coordinates:", projectile);
        return;
    }

    // Create PIXI graphic for projectile
    if (projectileContainerPixi) {
        const colorMap = {
            '4': 0x00ff00,
            '8': 0xff0000,
            '3': 0xff6400,
            '6': 0xffff00
        };
        const color = colorMap[tower.type] || 0xffffff;
        const gfx = new PIXI.Graphics();
        gfx.beginFill(color);
        gfx.drawCircle(0, 0, cellSize * 0.15);
        gfx.endFill();
        gfx.x = projectile.startX;
        gfx.y = projectile.startY;
        projectileContainerPixi.addChild(gfx);
        projectile.sprite = gfx;
    }

    projectiles.push(projectile);
}

/**
 * Update all projectiles
 * @param {number} deltaTime - Time elapsed since last update
 */

/**
 * Create a hit effect when a projectile reaches its target
 * @param {Object} projectile - The projectile
 * @param {string} effectType - Type of effect to create
 */
function createHitEffect(projectile, effectType) {
  if (!projectileContainerPixi) return;

  const colorMap = {
    splash: 0xff6400,
    poison: 0x00ff00,
    stun: 0xffff00,
    default: 0xffffff
  };

  const radiusMap = {
    splash: cellSize * 0.75,
    poison: cellSize * 0.4,
    stun: cellSize * 0.4,
    default: cellSize * 0.2
  };

  const color = colorMap[effectType] || colorMap.default;
  const radius = radiusMap[effectType] || radiusMap.default;

  const g = new PIXI.Graphics();
  g.beginFill(color, 0.5);
  g.drawCircle(0, 0, radius);
  g.endFill();
  g.x = projectile.targetX;
  g.y = projectile.targetY;
  projectileContainerPixi.addChild(g);
  hitEffects.push({ gfx: g, life: 30, maxLife: 30 });
}
    /**
     * Animation loop for projectiles
     * @param {number} timestamp - Current animation frame timestamp
     */
    function animationLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - (lastFrameTime || timestamp);
        lastFrameTime = timestamp;
        
        // Update projectiles
        updateProjectiles(deltaTime);
        
        // Continue animation loop
        requestAnimationFrame(animationLoop);
    }
    
    /**
     * Update all projectiles
     * @param {number} deltaTime - Time elapsed since last update
     */
    function updateProjectiles(delta) {
        if (!projectileContainerPixi) return;

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.progress += p.speed * delta;

            if (p.progress >= 1) {
                createHitEffect(p, getTowerTypeData(p.towerType)?.specialType);
                removeProjectile(p);
                projectiles.splice(i, 1);
                continue;
            }

            const x = p.startX + (p.targetX - p.startX) * p.progress;
            const y = p.startY + (p.targetY - p.startY) * p.progress;
            if (p.sprite) {
                p.sprite.x = x;
                p.sprite.y = y;
                p.sprite.rotation += 0.1 * delta;
            }
        }

        for (let i = hitEffects.length - 1; i >= 0; i--) {
            const eff = hitEffects[i];
            eff.life -= delta;
            if (eff.life <= 0) {
                projectileContainerPixi.removeChild(eff.gfx);
                hitEffects.splice(i, 1);
            } else {
                eff.gfx.alpha = eff.life / eff.maxLife;
                const scale = 1 + (eff.maxLife - eff.life) / eff.maxLife;
                eff.gfx.scale.set(scale);
            }
        }
    }
    
    /**
     * Remove a projectile element
     * @param {string} id - Projectile ID to remove
     */
    function removeProjectile(projectile) {
        if (projectile.sprite && projectileContainerPixi) {
            projectileContainerPixi.removeChild(projectile.sprite);
        }
    }
    
    /**
     * Update the cell size and board dimensions
     * Used when window is resized
     */
    function updateDimensions() {
        if (!boardElement) {
            boardElement = document.getElementById('sudoku-board');
        }
        
        if (boardElement) {
            boardRect = boardElement.getBoundingClientRect();
            cellSize = boardRect.width / 9;
            if (pixiApp) {
                pixiApp.renderer.resize(boardRect.width, boardRect.height);
            }
        }
    }
    
    /**
     * Clear all projectiles
     */
    function clearAllProjectiles() {
        if (projectileContainerPixi) {
            projectileContainerPixi.removeChildren();
        }
        projectiles = [];
        hitEffects = [];
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Listen for tower attack events
        EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
            if (data && data.tower && data.enemy) {
                createTowerAttackEffect(data.tower, data.enemy);
            }
        });
        
        // Listen for enemy defeated events to remove projectiles targeting that enemy
        EventSystem.subscribe(GameEvents.ENEMY_DEFEATED, function(data) {
            // Remove projectiles targeting this enemy
            for (let i = projectiles.length - 1; i >= 0; i--) {
                if (projectiles[i].target === data.enemy.id) {
                    removeProjectile(projectiles[i]);
                    projectiles.splice(i, 1);
                }
            }
        });
        
        // Listen for wave completion to clear all projectiles
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
            clearAllProjectiles();
        });
        
        // Listen for wave start to ensure container is ready
        EventSystem.subscribe(GameEvents.WAVE_START, function() {
            // Ensure the container is ready for the wave
            console.log("Wave start detected, ensuring container exists");
            ensureProjectileContainer();
        });
        
        // Listen for resize events to update dimensions
        window.addEventListener('resize', function() {
            updateDimensions();
        });
        
        // Listen for game pause to pause animations
        EventSystem.subscribe(GameEvents.GAME_PAUSE, function() {
            // Clear all projectiles when game is paused
            clearAllProjectiles();
        });
    }
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for other modules to initialize first
        setTimeout(init, 100);
    });
    
    // Public API
    return {
        init,
        updateDimensions,
        clearAllProjectiles,
        ensureProjectileContainer,
        getTowerTypeData
    };
})();

// Expose the module globally
window.TowerAnimationsModule = TowerAnimationsModule;

// Add CSS styles for tower attack animations
(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* Tower attack effect (glow/drop shadow) */
        .tower-attacking {
            animation: tower-attack-pulse 0.3s ease-in-out;
            filter: drop-shadow(0 0 5px #ffff00) drop-shadow(0 0 10px #ff9900);
            z-index: 15;
        }
        }

    `;
    document.head.appendChild(style);
})();

// Initialize when game starts
EventSystem.subscribe(GameEvents.GAME_INIT, function() {
    if (TowerAnimationsModule) {
        console.log("Initializing TowerAnimationsModule from GAME_INIT event");
        TowerAnimationsModule.init();
    }
});

// Update dimensions whenever the board is refreshed
EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
    if (TowerAnimationsModule && TowerAnimationsModule.updateDimensions) {
        setTimeout(TowerAnimationsModule.updateDimensions, 100);
    }
});

// Ensure animations are ready when the first wave starts
EventSystem.subscribe(GameEvents.WAVE_START, function(data) {
    console.log("Wave starting, ensuring animation system is ready");
    if (TowerAnimationsModule) {
        // Reinitialize to ensure everything is ready
        TowerAnimationsModule.init();
        
        // Double check the container exists
        setTimeout(() => {
            if (TowerAnimationsModule.ensureProjectileContainer) {
                TowerAnimationsModule.ensureProjectileContainer();
            }
        }, 200);
    }
});

// Manually create projectile container on game start
setTimeout(() => {
    if (TowerAnimationsModule && TowerAnimationsModule.ensureProjectileContainer) {
        TowerAnimationsModule.ensureProjectileContainer();
        console.log("Created projectile container after initial timeout");
    }
}, 1000);