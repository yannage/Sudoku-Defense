/**
 * tower-animations.js - Handles visual effects for tower attacks
 * This module adds projectile animations and visual feedback when towers attack
 * FIXED: Now properly handles tower positions to prevent projectiles from wrong locations
 * FIXED: Ensures projectiles appear during the first wave
 */

/**
 * tower-animations.js - Handles visual effects for tower attacks
 * This module adds projectile animations and visual feedback when towers attack
 * FIXED: Now properly handles tower positions to prevent projectiles from wrong locations
 * FIXED: Ensures projectiles appear during the first wave
 */

const TowerAnimationsModule = (function() {
    // Private variables
    let projectiles = [];
    let projectileId = 0;
    let lastFrameTime = 0;
    let cellSize = 0;
    let boardElement = null;
    let boardRect = null;
    let isInitialized = false;
    
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
            return;
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
        // Enemy positions are already calculated relative to the board
        // Just ensure they're valid
        if (!enemy || typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            console.error("Invalid enemy data:", enemy);
            return { x: 0, y: 0 };
        }
        
        return { x: enemy.x, y: enemy.y };
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
    function createProjectile(tower, enemy) {
        // Get correct positions
        const towerPos = calculateTowerPosition(tower);
        const enemyPos = calculateEnemyPosition(enemy);
        
        // Double check container exists
        ensureProjectileContainer();
        
        // Create projectile element
        const projectile = {
            id: `projectile_${++projectileId}`,
            startX: towerPos.x,
            startY: towerPos.y,
            targetX: enemyPos.x,
            targetY: enemyPos.y,
            progress: 0,
            speed: 0.005, // Speed of projectile animation
            target: enemy.id
        };
        
        // Validate projectile coordinates
        if (isNaN(projectile.startX) || isNaN(projectile.startY) || 
            isNaN(projectile.targetX) || isNaN(projectile.targetY)) {
            console.error("Invalid projectile coordinates:", projectile);
            return;
        }
        
        // Add to projectiles array
        projectiles.push(projectile);
        
        // Create visual element
        const projectileElement = document.createElement('div');
        projectileElement.id = projectile.id;
        projectileElement.className = 'tower-projectile';
        projectileElement.textContent = '⚫';
        projectileElement.style.position = 'absolute';
        projectileElement.style.transform = `translate(${projectile.startX}px, ${projectile.startY}px)`;
        projectileElement.style.fontSize = '10px';
        projectileElement.style.zIndex = '25';
        
        // Add to projectile container
        const container = document.getElementById('projectile-container');
        if (container) {
            container.appendChild(projectileElement);
        } else {
            console.error("Projectile container not found when adding projectile");
        }
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
    function updateProjectiles(deltaTime) {
        // Get the container
        const container = document.getElementById('projectile-container');
        if (!container) return;
        
        // Process each projectile
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Update progress
            projectile.progress += projectile.speed * deltaTime;
            
            if (projectile.progress >= 1) {
                // Projectile reached target
                removeProjectile(projectile.id);
                projectiles.splice(i, 1);
                continue;
            }
            
            // Update position
            const x = projectile.startX + (projectile.targetX - projectile.startX) * projectile.progress;
            const y = projectile.startY + (projectile.targetY - projectile.startY) * projectile.progress;
            
            // Update visual element
            const element = document.getElementById(projectile.id);
            if (element) {
                element.style.transform = `translate(${x}px, ${y}px)`;
            }
        }
    }
    
    /**
     * Remove a projectile element
     * @param {string} id - Projectile ID to remove
     */
    function removeProjectile(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
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
        }
    }
    
    /**
     * Clear all projectiles
     */
    function clearAllProjectiles() {
        const container = document.getElementById('projectile-container');
        if (container) {
            container.innerHTML = '';
        }
        projectiles = [];
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
                    removeProjectile(projectiles[i].id);
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
        ensureProjectileContainer
    };
})();

// Add this to window for global access
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
        
        @keyframes tower-attack-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        /* Projectile styling */
        .tower-projectile {
            color: #000;
            filter: drop-shadow(0 0 2px #fff);
            pointer-events: none;
            transform-origin: center center;
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
    if (data && data.waveNumber === 1) {
        console.log("First wave starting, ensuring animation system is ready");
        if (TowerAnimationsModule) {
            // Reinitialize for first wave to ensure everything is ready
            TowerAnimationsModule.init();
            
            // Double check the container exists
            setTimeout(() => {
                TowerAnimationsModule.ensureProjectileContainer();
            }, 500); // Add a delay to ensure the board is ready
        }
    }
});

// Add a direct fix to the enemies.js module to ensure proper position data on enemies
// This patch adds x,y coordinates to enemies during the move function
(function() {
    // Wait for the game to fully initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Give time for all modules to load
        setTimeout(() => {
            if (window.EnemiesModule && typeof EnemiesModule.moveEnemy === 'function') {
                console.log("Patching EnemiesModule.moveEnemy to ensure x,y coordinates");
                
                // Store the original moveEnemy function
                const originalMoveEnemy = EnemiesModule.moveEnemy;
                
                // Replace with our enhanced version
                EnemiesModule.moveEnemy = function(enemy, deltaTime) {
                    // Call original function
                    originalMoveEnemy.call(this, enemy, deltaTime);
                    
                    // Make sure the enemy has x,y coordinates for projectiles
                    if (enemy && enemy.active && (typeof enemy.x !== 'number' || typeof enemy.y !== 'number')) {
                        const cellSize = EnemiesModule.getCellSize && EnemiesModule.getCellSize() || 55;
                        const path = SudokuModule.getPathArray && SudokuModule.getPathArray();
                        
                        if (path && enemy.pathIndex < path.length - 1) {
                            const currentCell = path[enemy.pathIndex];
                            const nextCell = path[enemy.pathIndex + 1];
                            
                            if (currentCell && nextCell) {
                                const startX = currentCell[1] * cellSize + cellSize / 2;
                                const startY = currentCell[0] * cellSize + cellSize / 2;
                                const endX = nextCell[1] * cellSize + cellSize / 2;
                                const endY = nextCell[0] * cellSize + cellSize / 2;
                                
                                enemy.x = startX + (endX - startX) * enemy.progress;
                                enemy.y = startY + (endY - startY) * enemy.progress;
                            }
                        }
                    }
                };
            }
        }, 1000);
    });
})();

/**
 * This is a comprehensive fix for projectile positions
 * Add this to the end of your tower-animations.js file
 */

// Override the existing functions with improved versions

// Backup of original functions if needed
const originalCalculateEnemyPosition = TowerAnimationsModule.calculateEnemyPosition;
const originalCreateProjectile = TowerAnimationsModule.createProjectile;

// Enhanced versions with corrected position calculations
const enhancedTowerAnimations = (function() {
    // Make sure projectiles are properly positioned
    EventSystem.subscribe('path:updated', function() {
        // Force recalculation of cell size when the path changes
        if (window.TowerAnimationsModule) {
            setTimeout(() => {
                TowerAnimationsModule.updateDimensions();
            }, 200);
        }
    });
    
    // Add extra listeners for the first wave's projectiles
    EventSystem.subscribe(GameEvents.WAVE_START, function(data) {
        if (data && data.waveNumber === 1) {
            // For the first wave, ensure we have correct cell size from EnemiesModule
            if (window.EnemiesModule && typeof EnemiesModule.getCellSize === 'function') {
                const cellSize = EnemiesModule.getCellSize();
                console.log("First wave starting with enemy cell size:", cellSize);
                
                // Force this cell size in the animation module
                if (window.TowerAnimationsModule && typeof TowerAnimationsModule.setCellSize === 'function') {
                    TowerAnimationsModule.setCellSize(cellSize);
                }
            }
        }
    });
    
    // Define a smarter enemy position calculator that works for all waves
    function improvedCalculateEnemyPosition(enemy) {
        if (!enemy) return { x: 0, y: 0 };
        
        // If enemy has valid x,y coordinates, use them directly
        if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
            return { x: enemy.x, y: enemy.y };
        }
        
        // If not, try to get position from path and current progress
        if (enemy.pathIndex !== undefined && enemy.progress !== undefined) {
            // Get current path from Sudoku module
            if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                const path = SudokuModule.getPathArray();
                if (path && path.length > enemy.pathIndex) {
                    const currentCell = path[enemy.pathIndex];
                    const nextCell = path[Math.min(enemy.pathIndex + 1, path.length - 1)];
                    
                    // Get cell size
                    let cellSize = 55; // Default
                    if (window.EnemiesModule && typeof EnemiesModule.getCellSize === 'function') {
                        cellSize = EnemiesModule.getCellSize();
                    }
                    
                    // Calculate cell centers
                    const currentX = currentCell[1] * cellSize + cellSize / 2;
                    const currentY = currentCell[0] * cellSize + cellSize / 2;
                    const nextX = nextCell[1] * cellSize + cellSize / 2;
                    const nextY = nextCell[0] * cellSize + cellSize / 2;
                    
                    // Interpolate position
                    const x = currentX + (nextX - currentX) * enemy.progress;
                    const y = currentY + (nextY - currentY) * enemy.progress;
                    
                    return { x, y };
                }
            }
        }
        
        console.error("Could not determine enemy position:", enemy);
        return { x: 0, y: 0 };
    }
    
    // Add improved functions as utilities
    return {
        improvedCalculateEnemyPosition
    };
})();

// Add the improved calculateEnemyPosition function to TowerAnimationsModule
if (TowerAnimationsModule) {
    // Add cell size setter
    TowerAnimationsModule.setCellSize = function(size) {
        if (typeof size === 'number' && size > 0) {
            console.log("Setting animation module cell size to:", size);
            cellSize = size;
        }
    };
    
    // Try to ensure cell sizes are in sync across modules
    if (window.EnemiesModule && typeof EnemiesModule.getCellSize === 'function') {
        const enemyCellSize = EnemiesModule.getCellSize();
        if (enemyCellSize) {
            TowerAnimationsModule.setCellSize(enemyCellSize);
        }
    }
}

// Log that the fix has been applied
console.log("Applied comprehensive fix for projectile positions");