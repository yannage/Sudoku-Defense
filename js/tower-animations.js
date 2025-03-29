/**
 * tower-animations.js - Handles visual effects for tower attacks
 * This module adds projectile animations and visual feedback when towers attack
 * FIXED: Properly handles enemy positioning and inactive enemies
 */

const TowerAnimationsModule = (function() {
    // Private variables
    let projectiles = [];
    let projectileId = 0;
    let lastFrameTime = 0;
    let cellSize = 0;
    let boardElement = null;
    let boardRect = null;
    
    /**
     * Initialize the animations module
     */
    function init() {
        projectiles = [];
        projectileId = 0;
        
        // Get the board element and its dimensions
        boardElement = document.getElementById('sudoku-board');
        if (boardElement) {
            // Ensure the board has relative positioning for proper absolute positioning of children
            if (getComputedStyle(boardElement).position === 'static') {
                boardElement.style.position = 'relative';
            }
            
            boardRect = boardElement.getBoundingClientRect();
            
            // Get cell size from the board dimensions
            cellSize = boardRect.width / 9;
            console.log("TowerAnimations initialized with cellSize:", cellSize);
        }
        
        // Create projectile container if it doesn't exist
        ensureProjectileContainer();
        
        // Set up event listeners
        setupEventListeners();
        
        // Start animation loop
        requestAnimationFrame(animationLoop);
    }
    
    /**
     * Ensure the projectile container exists
     */
    function ensureProjectileContainer() {
        if (!boardElement) return;
        
        // Remove any existing container to start fresh
        const existingContainer = document.getElementById('projectile-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Create new container
        const projectileContainer = document.createElement('div');
        projectileContainer.id = 'projectile-container';
        projectileContainer.style.position = 'absolute';
        projectileContainer.style.top = '0';
        projectileContainer.style.left = '0';
        projectileContainer.style.width = '100%';
        projectileContainer.style.height = '100%';
        projectileContainer.style.pointerEvents = 'none';
        projectileContainer.style.zIndex = '100'; // Higher z-index to ensure visibility
        projectileContainer.style.overflow = 'visible'; // Allow projectiles to extend outside container
        boardElement.appendChild(projectileContainer);
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
        // First check if the enemy is active
        if (!enemy || enemy.active === false) {
            console.log("Skipping inactive enemy:", enemy);
            return null;
        }
    
        // Check if enemy already has x,y coordinates
        if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
            return { x: enemy.x, y: enemy.y };
        }
        
        // If enemy uses row/col/progress format, calculate position
        if (typeof enemy.row === 'number' && typeof enemy.col === 'number') {
            // Calculate position based on grid coordinates plus progress
            const x = (enemy.col + (enemy.progress || 0)) * cellSize;
            const y = (enemy.row + (enemy.progress || 0)) * cellSize;
            return { x, y };
        }
        
        // If enemy uses pathIndex format from your enemy data
        if (typeof enemy.pathIndex === 'number' && typeof enemy.progress === 'number') {
            try {
                // Get the current path from SudokuModule if available
                if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                    const path = SudokuModule.getPathArray();
                    
                    if (path && enemy.pathIndex < path.length - 1) {
                        const currentCell = path[enemy.pathIndex];
                        const nextCell = path[enemy.pathIndex + 1];
                        
                        if (currentCell && nextCell) {
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
            } catch (err) {
                console.error("Error calculating enemy position from path:", err);
            }
        }
        
        console.error("Unable to determine enemy position:", enemy);
        return null;
    }
    
    /**
     * Create a tower attack effect
     * @param {Object} tower - The attacking tower
     * @param {Object} enemy - The target enemy
     */
    function createTowerAttackEffect(tower, enemy) {
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
        
        // Don't create effects for inactive enemies
        if (enemy.active === false) {
            return;
        }
        
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
        
        // Skip if we couldn't determine enemy position
        if (!enemyPos) {
            return;
        }
        
        // Create projectile object
        const projectile = {
            id: `projectile_${++projectileId}`,
            startX: towerPos.x,
            startY: towerPos.y,
            targetX: enemyPos.x,
            targetY: enemyPos.y,
            progress: 0,
            speed: 0.005, // Speed of projectile animation
            target: enemy.id,
            type: tower.type // Store tower type for visual customization
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
        
        // Custom projectile appearance based on tower type
        let projectileContent = '⚫'; // Default
        
        // Customize projectile based on tower type
        if (tower.type === 'special') {
            projectileContent = '✨'; // Special towers shoot sparkles
            projectileElement.classList.add('special-projectile');
        } else if (typeof tower.type === 'number' || !isNaN(parseInt(tower.type))) {
            // Number towers
            const towerNum = parseInt(tower.type);
            projectileElement.classList.add(`projectile-${towerNum}`);
            
            // Different colors for different numbers
            const colors = ['#ff5252', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', 
                            '#9c27b0', '#e91e63', '#795548', '#607d8b'];
            if (towerNum >= 1 && towerNum <= 9) {
                projectileElement.style.color = colors[towerNum - 1];
                projectileElement.style.textShadow = `0 0 5px ${colors[towerNum - 1]}`;
            }
        }
        
        projectileElement.textContent = projectileContent;
        projectileElement.style.position = 'absolute';
        projectileElement.style.transform = `translate(${projectile.startX}px, ${projectile.startY}px)`;
        projectileElement.style.fontSize = '12px';
        projectileElement.style.zIndex = '150'; // Higher z-index
        
        // Add to projectile container
        const container = document.getElementById('projectile-container');
        if (container) {
            container.appendChild(projectileElement);
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
                handleProjectileImpact(projectile);
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
     * Handle projectile impact with visual effect
     * @param {Object} projectile - The projectile that reached its target
     */
    function handleProjectileImpact(projectile) {
        // Create impact element
        const impactElement = document.createElement('div');
        impactElement.className = 'projectile-impact';
        impactElement.style.position = 'absolute';
        impactElement.style.left = `${projectile.targetX}px`;
        impactElement.style.top = `${projectile.targetY}px`;
        impactElement.style.transform = 'translate(-50%, -50%)';
        impactElement.style.zIndex = '140';
        impactElement.textContent = '💥';
        
        // Add to container
        const container = document.getElementById('projectile-container');
        if (container) {
            container.appendChild(impactElement);
            
            // Remove after animation
            setTimeout(() => {
                if (impactElement.parentNode) {
                    impactElement.parentNode.removeChild(impactElement);
                }
            }, 300);
        }
    }
    
    /**
     * Remove a projectile element
     * @param {string} id - Projectile ID to remove
     */
    function removeProjectile(id) {
        const element = document.getElementById(id);
        if (element) {
            // Fade out quickly instead of abrupt removal
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.1s';
            
            // Remove from DOM after fade
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 100);
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
        
        // Listen for resize events to update dimensions
        window.addEventListener('resize', function() {
            updateDimensions();
        });
        
        // Listen for game pause to pause animations
        EventSystem.subscribe(GameEvents.GAME_PAUSE, function() {
            // Clear all projectiles when game is paused
            clearAllProjectiles();
        });
        
        // Listen for when the board is updated/regenerated
        EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
            // Reinitialize the projectile container
            setTimeout(() => {
                ensureProjectileContainer();
            }, 100);
        });
    }
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        init();
    });
    
    // Public API
    return {
        init,
        updateDimensions,
        clearAllProjectiles
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
            font-size: 14px !important;
            will-change: transform; /* Performance optimization */
            position: absolute;
            z-index: 150;
        }
        
        /* Special projectile effect */
        .special-projectile {
            color: #9c27b0;
            filter: drop-shadow(0 0 5px #9c27b0);
            animation: rotate-projectile 0.5s linear infinite;
        }
        
        @keyframes rotate-projectile {
            from { transform: rotate(0deg) translate(var(--x), var(--y)); }
            to { transform: rotate(360deg) translate(var(--x), var(--y)); }
        }
        
        /* Impact animation */
        .projectile-impact {
            animation: impact-effect 0.3s ease-out forwards;
            font-size: 18px;
            transform-origin: center center;
            pointer-events: none;
        }
        
        @keyframes impact-effect {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();

// Initialize when game starts
EventSystem.subscribe(GameEvents.GAME_INIT, function() {
    if (TowerAnimationsModule) {
        TowerAnimationsModule.init();
    }
});

// Update dimensions whenever the board is refreshed
EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
    if (TowerAnimationsModule && TowerAnimationsModule.updateDimensions) {
        setTimeout(TowerAnimationsModule.updateDimensions, 100);
    }
});

/**
 * Add this code to the end of your tower-animations.js file
 * This adds explicit wave handling to ensure projectiles work on all waves
 */

// Add wave start handling to ensure projectiles work on the first wave
(function() {
    // Original event listener setup
    const originalSetupEventListeners = TowerAnimationsModule.setupEventListeners || function() {};
    
    // Override the function to add our wave-specific handling
    TowerAnimationsModule.setupEventListeners = function() {
        // Call the original function first
        if (typeof originalSetupEventListeners === 'function') {
            originalSetupEventListeners.call(this);
        }
        
        // Add wave start event listener
        EventSystem.subscribe(GameEvents.WAVE_START, function(data) {
            console.log("Wave started, ensuring animations are ready:", data);
            
            // Force recreation of projectile container
            const boardElement = document.getElementById('sudoku-board');
            if (boardElement) {
                // Remove any existing container
                const existingContainer = document.getElementById('projectile-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
                
                // Create new container with proper z-index
                const projectileContainer = document.createElement('div');
                projectileContainer.id = 'projectile-container';
                projectileContainer.style.position = 'absolute';
                projectileContainer.style.top = '0';
                projectileContainer.style.left = '0';
                projectileContainer.style.width = '100%';
                projectileContainer.style.height = '100%';
                projectileContainer.style.pointerEvents = 'none';
                projectileContainer.style.zIndex = '150'; // Higher z-index to ensure visibility
                projectileContainer.style.overflow = 'visible'; // Allow projectiles to extend outside container
                boardElement.appendChild(projectileContainer);
                
                // Set a data attribute on the board to flag that animations are ready
                boardElement.setAttribute('data-animations-ready', 'true');
            }
            
            // Force update dimensions
            if (TowerAnimationsModule.updateDimensions) {
                TowerAnimationsModule.updateDimensions();
            }
        });
    };
    
    // Also patch the tower attack event to ensure position calculation works
    const originalSubscribe = EventSystem.subscribe;
    
    // Temporarily override subscribe to intercept tower attack events
    EventSystem.subscribe = function(eventName, callback) {
        if (eventName === GameEvents.TOWER_ATTACK) {
            // Wrap the callback with our position validation logic
            const wrappedCallback = function(data) {
                if (!data || !data.tower || !data.enemy) return;
                
                // Fix enemy position issues if needed
                if (data.enemy && !data.enemy.x && !data.enemy.y) {
                    // Try to calculate x/y from path if not present
                    const path = window.SudokuModule ? SudokuModule.getPathArray() : null;
                    if (path && typeof data.enemy.pathIndex === 'number') {
                        try {
                            const cellSize = document.getElementById('sudoku-board').clientWidth / 9;
                            const currentCell = path[data.enemy.pathIndex];
                            const nextCell = path[data.enemy.pathIndex + 1];
                            
                            if (currentCell && nextCell) {
                                // Calculate interpolated position
                                const currentX = currentCell[1] * cellSize + cellSize / 2;
                                const currentY = currentCell[0] * cellSize + cellSize / 2;
                                const nextX = nextCell[1] * cellSize + cellSize / 2;
                                const nextY = nextCell[0] * cellSize + cellSize / 2;
                                
                                // Add x/y to enemy object
                                data.enemy.x = currentX + (nextX - currentX) * (data.enemy.progress || 0);
                                data.enemy.y = currentY + (nextY - currentY) * (data.enemy.progress || 0);
                            }
                        } catch (e) {
                            console.warn('Error calculating enemy position:', e);
                        }
                    }
                }
                
                // Call original callback
                return callback(data);
            };
            
            return originalSubscribe.call(this, eventName, wrappedCallback);
        }
        
        // Normal behavior for other events
        return originalSubscribe.call(this, eventName, callback);
    };
    
    // Immediately reinitialize if the module is already loaded
    if (window.TowerAnimationsModule && typeof TowerAnimationsModule.init === 'function') {
        // Wait a moment to ensure all modules are loaded
        setTimeout(() => {
            console.log("Reinitializing TowerAnimationsModule with wave fixes...");
            TowerAnimationsModule.init();
        }, 500);
    }
})();

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