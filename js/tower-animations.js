/**
 * A simplified fix that reverts to the original position calculation but ensures first wave projectiles.
 * Replace your tower-animations.js with this version.
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
/**
 * Drop this function into your tower-animations.js file to replace the current calculateEnemyPosition function
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
            if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                path = SudokuModule.getPathArray();
                
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


/**
 * This is a debugging version of the enemy position calculation function.
 * Add this at the END of your tower-animations.js file.
 */

(function() {
    // Add a very simplified fallback enemy position calculator
    function simplifiedEnemyPosition(enemy) {
        if (!enemy) {
            console.error("No enemy data provided to position calculator");
            return { x: 0, y: 0 };
        }
        
        // Dump the entire enemy object to console for inspection
        console.log("Enemy object structure:", JSON.stringify(enemy, null, 2));
        
        // Direct properties check
        if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
            console.log("Using direct x,y coordinates:", enemy.x, enemy.y);
            return { x: enemy.x, y: enemy.y };
        }
        
        // Check if we have the required properties
        console.log("Enemy properties:", {
            hasPathIndex: typeof enemy.pathIndex !== 'undefined',
            pathIndexValue: enemy.pathIndex,
            hasProgress: typeof enemy.progress !== 'undefined', 
            progressValue: enemy.progress
        });
        
        // Get information about available data for diagnosis
        console.log("Environment state:", {
            enemiesModuleAvailable: typeof window.EnemiesModule !== 'undefined',
            enemiesPathAvailable: window.EnemiesModule && Array.isArray(window.EnemiesModule.path),
            pathLength: window.EnemiesModule && Array.isArray(window.EnemiesModule.path) ? window.EnemiesModule.path.length : 0,
            sudokuModuleAvailable: typeof window.SudokuModule !== 'undefined',
            getPathArrayAvailable: window.SudokuModule && typeof SudokuModule.getPathArray === 'function'
        });
        
        // Try to access path through EnemiesModule
        let path = null;
        if (window.EnemiesModule) {
            console.log("Examining EnemiesModule for path data:");
            for (const key in window.EnemiesModule) {
                if (Array.isArray(window.EnemiesModule[key]) && window.EnemiesModule[key].length > 0) {
                    console.log(`- Found array in EnemiesModule.${key} with length ${window.EnemiesModule[key].length}`);
                }
            }
        }
        
        // Get cell size for calculation
        let cellSize = 55; // Default fallback
        if (window.EnemiesModule && typeof EnemiesModule.getCellSize === 'function') {
            const enemyCellSize = EnemiesModule.getCellSize();
            console.log("Cell size from EnemiesModule:", enemyCellSize);
            if (enemyCellSize && enemyCellSize > 0) {
                cellSize = enemyCellSize;
            }
        }
        
        // Last resort - if the enemy is available in the EnemiesModule enemies list, try to get its position
        if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
            const allEnemies = EnemiesModule.getEnemies();
            if (allEnemies && Array.isArray(allEnemies)) {
                const foundEnemy = allEnemies.find(e => e.id === enemy.id);
                if (foundEnemy && typeof foundEnemy.x === 'number' && typeof foundEnemy.y === 'number') {
                    console.log("Found enemy position in EnemiesModule list:", foundEnemy.x, foundEnemy.y);
                    return { x: foundEnemy.x, y: foundEnemy.y };
                }
            }
        }
        
        // Get any tower to use as reference point if all else fails
        if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
            const towers = TowersModule.getTowers();
            if (towers && towers.length > 0) {
                const tower = towers[0];
                const x = (tower.col + 0.5) * cellSize;
                const y = (tower.row + 0.5) * cellSize;
                console.log("Using tower position as fallback:", x, y);
                return { x, y };
            }
        }
        
        // Absolute fallback - use board center
        console.error("Using fallback center position");
        return { x: cellSize * 4.5, y: cellSize * 4.5 };
    }
    
    // Override the calculate enemy position function with our debugging version
    // This is a temporary approach that logs information but ensures projectiles appear
    if (TowerAnimationsModule) {
        // If we can't access the internal function directly, intercept the tower attack event
        const originalHandler = EventSystem.events[GameEvents.TOWER_ATTACK][0];
        EventSystem.clear(GameEvents.TOWER_ATTACK);
        
        // Add our modified handler
        EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
            if (data && data.tower && data.enemy) {
                console.log("Tower attack event. Debugging enemy position:");
                
                // If enemy is missing x,y, try to add them
                if (typeof data.enemy.x !== 'number' || typeof data.enemy.y !== 'number') {
                    const position = simplifiedEnemyPosition(data.enemy);
                    // Add position to the enemy object
                    data.enemy.x = position.x;
                    data.enemy.y = position.y;
                    console.log("Added position to enemy:", position);
                }
                
                // Call original handler or createTowerAttackEffect directly
                if (typeof TowerAnimationsModule.createTowerAttackEffect === 'function') {
                    TowerAnimationsModule.createTowerAttackEffect(data.tower, data.enemy);
                } else if (originalHandler) {
                    originalHandler(data);
                } else {
                    // Direct DOM approach if all else fails
                    const boardElement = document.getElementById('sudoku-board');
                    if (boardElement) {
                        // Visual feedback on attack
                        const towerElement = boardElement.querySelector(`.sudoku-cell[data-row="${data.tower.row}"][data-col="${data.tower.col}"]`);
                        if (towerElement) {
                            towerElement.classList.add('tower-attacking');
                            setTimeout(() => {
                                towerElement.classList.remove('tower-attacking');
                            }, 300);
                        }
                    }
                }
            }
        });
        
        console.log("Installed debugging enemy position handler");
    }
})();