/**
 * enemies.js - Handles enemy generation, movement, and behavior
 * This module creates and manages enemy entities in the tower defense game
 */

const EnemiesModule = (function() {
    // Private variables
    let enemies = [];
    let enemyId = 0;
    let waveNumber = 1;
    let isWaveActive = false;
    let spawnInterval = null;
    let enemiesRemaining = 0;
    let path = [];
    let cellSize = 0;
    
    // Enemy types with their properties - FIXED EMOJIS
    const enemyTypes = {
        1: { emoji: '1️⃣', health: 60, speed: 0.9, reward: 15, points: 5 },
        2: { emoji: '2️⃣', health: 70, speed: 1.0, reward: 18, points: 7 },
        3: { emoji: '3️⃣', health: 80, speed: 1.1, reward: 21, points: 9 },
        4: { emoji: '4️⃣', health: 90, speed: 1.2, reward: 24, points: 11 },
        5: { emoji: '5️⃣', health: 100, speed: 1.3, reward: 27, points: 13 },
        6: { emoji: '6️⃣', health: 120, speed: 1.4, reward: 30, points: 15 },
        7: { emoji: '7️⃣', health: 140, speed: 1.5, reward: 33, points: 17 },
        8: { emoji: '8️⃣', health: 160, speed: 1.6, reward: 36, points: 19 },
        9: { emoji: '9️⃣', health: 180, speed: 1.7, reward: 39, points: 21 },
        'boss': { emoji: '👹', health: 300, speed: 0.7, reward: 75, points: 50 }
    };
    
    /**
     * Initialize the enemies module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        enemies = [];
        enemyId = 0;
        waveNumber = 1;
        isWaveActive = false;
        enemiesRemaining = 0;
        cellSize = options.cellSize || 55; // Default cell size
        
        // Stop any active spawn interval
        if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
        }
    }
    
    /**
     * Create a new enemy
     * @param {number|string} type - Enemy type
     * @returns {Object} The created enemy
     */
    function createEnemy(type) {
        const typeData = enemyTypes[type] || enemyTypes[1];
        
        // Calculate starting position (first cell in the path)
        const startCell = path[0];
        const startX = startCell[1] * cellSize + cellSize / 2;
        const startY = startCell[0] * cellSize + cellSize / 2;
        
        // Apply wave difficulty scaling
        const healthScale = 1 + (waveNumber - 1) * 0.2; // 20% more health per wave
        
        const enemy = {
            id: `enemy_${++enemyId}`,
            type: type,
            emoji: typeData.emoji,
            health: typeData.health * healthScale,
            maxHealth: typeData.health * healthScale,
            speed: typeData.speed,
            reward: typeData.reward,
            points: typeData.points,
            x: startX,
            y: startY,
            pathIndex: 0,
            progress: 0, // Progress within current path segment (0-1)
            active: true
        };
        
        // Add to enemies array
        enemies.push(enemy);
        
        // Publish enemy spawn event
        EventSystem.publish(GameEvents.ENEMY_SPAWN, enemy);
        
        return enemy;
    }
    
    /**
     * Start a wave of enemies
     */
    function startWave() {
        if (isWaveActive) {
            return;
        }
        
        // Get the latest path from the Sudoku module
        path = SudokuModule.getPathArray();
        
        if (path.length === 0) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot start wave: No path defined!");
            return;
        }
        
        isWaveActive = true;
        
        // Calculate number of enemies based on wave number - MODIFIED FOR EASIER PROGRESSION
        const baseEnemyCount = 6; // Was 10
        const enemyCount = baseEnemyCount + Math.floor((waveNumber - 1) * 3); // Was (waveNumber - 1) * 5
        enemiesRemaining = enemyCount;
        
        // Determine which enemy types to use in this wave
        const availableTypes = Math.min(9, Math.ceil(waveNumber / 2));
        
        // Publish wave start event
        EventSystem.publish(GameEvents.WAVE_START, {
            waveNumber: waveNumber,
            enemyCount: enemyCount
        });
        
        EventSystem.publish(GameEvents.STATUS_MESSAGE, `Wave ${waveNumber} started! Enemies: ${enemyCount}`);
        
        let enemiesSpawned = 0;
        
        // Clear any existing interval
        if (spawnInterval) {
            clearInterval(spawnInterval);
        }
        
        // Spawn enemies at an interval
        spawnInterval = setInterval(() => {
            if (enemiesSpawned >= enemyCount) {
                clearInterval(spawnInterval);
                spawnInterval = null;
                return;
            }
            
            // Determine enemy type - higher waves have more varied and stronger enemies
            let enemyType;
            
            // Boss enemy at the end of each wave (last 10% of enemies)
            if (enemiesSpawned >= enemyCount * 0.9 && waveNumber % 3 === 0) {
                enemyType = 'boss';
            } else {
                // Random enemy type based on available types
                enemyType = Math.ceil(Math.random() * availableTypes);
            }
            
            createEnemy(enemyType);
            enemiesSpawned++;
        }, 1000 / Math.sqrt(waveNumber)); // Spawn faster in higher waves
    }
    
    /**
     * Update all enemies
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    function update(deltaTime) {
        if (!isWaveActive) {
            return;
        }
        
        let activeEnemies = 0;
        
        // Update each enemy
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            if (!enemy.active) {
                continue;
            }
            
            activeEnemies++;
            
            // Move enemy along the path
            moveEnemy(enemy, deltaTime);
            
            // Publish enemy move event
            EventSystem.publish(GameEvents.ENEMY_MOVE, enemy);
        }
        
        // Check if wave is complete (no active enemies and none remaining to spawn)
        if (activeEnemies === 0 && enemiesRemaining === 0 && !spawnInterval) {
            waveComplete();
        }
    }
    
    /**
     * Move an enemy along the path
     * @param {Object} enemy - The enemy to move
     * @param {number} deltaTime - Time elapsed since last update
     */
    function moveEnemy(enemy, deltaTime) {
        if (enemy.pathIndex >= path.length - 1) {
            // Enemy reached the end of the path
            enemyReachedEnd(enemy);
            return;
        }
        
        // Calculate movement speed based on enemy speed and deltaTime
        const moveSpeed = enemy.speed * 50 * deltaTime;
        
        // Get current path segment
        const currentCell = path[enemy.pathIndex];
        const nextCell = path[enemy.pathIndex + 1];
        
        // Calculate cell centers
        const currentX = currentCell[1] * cellSize + cellSize / 2;
        const currentY = currentCell[0] * cellSize + cellSize / 2;
        const nextX = nextCell[1] * cellSize + cellSize / 2;
        const nextY = nextCell[0] * cellSize + cellSize / 2;
        
        // Update progress along current path segment
        enemy.progress += moveSpeed / Math.sqrt(
            Math.pow(nextX - currentX, 2) + Math.pow(nextY - currentY, 2)
        );
        
        // Move to next path segment if progress is complete
        if (enemy.progress >= 1) {
            enemy.pathIndex++;
            enemy.progress = 0;
            
            // Check if enemy reached the end
            if (enemy.pathIndex >= path.length - 1) {
                enemyReachedEnd(enemy);
                return;
            }
        }
        
        // Interpolate position between current and next cells
        const currentSegment = path[enemy.pathIndex];
        const nextSegment = path[enemy.pathIndex + 1];
        
        const startX = currentSegment[1] * cellSize + cellSize / 2;
        const startY = currentSegment[0] * cellSize + cellSize / 2;
        const endX = nextSegment[1] * cellSize + cellSize / 2;
        const endY = nextSegment[0] * cellSize + cellSize / 2;
        
        enemy.x = startX + (endX - startX) * enemy.progress;
        enemy.y = startY + (endY - startY) * enemy.progress;
    }
    
    /**
     * Handle an enemy reaching the end of the path
     * @param {Object} enemy - The enemy that reached the end
     */
    function enemyReachedEnd(enemy) {
        enemy.active = false;
        
        // Remove from enemies array
        enemies = enemies.filter(e => e.id !== enemy.id);
        
        // Publish event
        EventSystem.publish(GameEvents.ENEMY_REACHED_END, enemy);
        
        // Decrement enemies remaining
        enemiesRemaining--;
    }
    
    /**
     * Damage an enemy
     * @param {string} enemyId - ID of the enemy to damage
     * @param {number} damage - Amount of damage to deal
     * @returns {boolean} Whether the enemy was killed
     */
    function damageEnemy(enemyId, damage) {
        const enemy = enemies.find(e => e.id === enemyId);
        
        if (!enemy || !enemy.active) {
            return false;
        }
        
        enemy.health -= damage;
        
        // Publish enemy damage event
        EventSystem.publish(GameEvents.ENEMY_DAMAGE, {
            enemy: enemy,
            damage: damage
        });
        
        // Check if enemy is defeated
        if (enemy.health <= 0) {
            defeatEnemy(enemy);
            return true;
        }
        
        return false;
    }
    
    /**
     * Defeat an enemy
     * @param {Object} enemy - The enemy to defeat
     */
    function defeatEnemy(enemy) {
        enemy.active = false;
        
        // Remove from enemies array
        enemies = enemies.filter(e => e.id !== enemy.id);
        
        // Publish enemy defeated event
        EventSystem.publish(GameEvents.ENEMY_DEFEATED, {
            enemy: enemy,
            reward: enemy.reward,
            points: enemy.points
        });
        
        // Decrement enemies remaining
        enemiesRemaining--;
    }
    
    /**
     * Handle wave completion
     */
    function waveComplete() {
        isWaveActive = false;
        
        // Clear any enemies that might still be around
        enemies = [];
        
        // Publish wave complete event first, before incrementing
        // This way LevelsModule can handle the increment
        EventSystem.publish(GameEvents.WAVE_COMPLETE, {
            waveNumber: waveNumber
        });
        
        // Don't increment wave number here - let LevelsModule handle it
        // waveNumber++; 
        
        // Generate new path for the next wave immediately
        setTimeout(() => {
            if (window.SudokuModule && typeof SudokuModule.generateEnemyPath === 'function') {
                // Clear existing path
                const pathCells = SudokuModule.getPathCells();
                if (pathCells && typeof pathCells.clear === 'function') {
                    pathCells.clear();
                }
                
                // Generate new path
                SudokuModule.generateEnemyPath();
                console.log("New path generated after wave completion");
                
                // Update the board to show the new path
                if (window.Game && typeof Game.updateBoard === 'function') {
                    Game.updateBoard();
                }
                
                // Notify other modules of the path change
                if (typeof SudokuModule.getPathArray === 'function') {
                    const newPath = SudokuModule.getPathArray();
                    EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
                        pathCells: newPath
                    });
                    
                    // Also publish a specific event for path updates
                    EventSystem.publish('path:updated', newPath);
                }
            }
        }, 500); // Short delay to make sure the wave completion processing is done
    }
    
    /**
     * Set the wave number
     * @param {number} num - New wave number
     */
    function setWaveNumber(num) {
        if (typeof num === 'number' && num > 0) {
            waveNumber = num;
            console.log("EnemiesModule wave number set to: " + waveNumber);
        }
    }
    
    /**
     * Get all active enemies
     * @returns {Object[]} Array of active enemies
     */
    function getEnemies() {
        return enemies.filter(e => e.active);
    }
    
    /**
     * Get the current wave number
     * @returns {number} Current wave number
     */
    function getWaveNumber() {
        return waveNumber;
    }
    
    /**
     * Check if a wave is currently active
     * @returns {boolean} Whether a wave is active
     */
    function isWaveInProgress() {
        return isWaveActive;
    }
    
    /**
     * Get the cell size
     * @returns {number} Cell size in pixels
     */
    function getCellSize() {
        return cellSize;
    }
    
    /**
     * Set the cell size
     * @param {number} size - Cell size in pixels
     */
    function setCellSize(size) {
        cellSize = size;
    }
    
    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Listen for game initialization
        EventSystem.subscribe(GameEvents.GAME_INIT, function(options) {
            init(options);
        });
        
        // Listen for new game
        EventSystem.subscribe(GameEvents.GAME_START, function() {
            init();
        });
        
        // Listen for Sudoku board generation to get the path
        EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function(data) {
            if (data.pathCells) {
                path = data.pathCells;
            }
        });
        
        // Listen for specific path updates
        EventSystem.subscribe('path:updated', function(newPath) {
            if (newPath && Array.isArray(newPath)) {
                path = newPath;
            }
        });
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Public API
    return {
        init,
        startWave,
        update,
        damageEnemy,
        getEnemies,
        getWaveNumber,
        setWaveNumber,
        isWaveInProgress,
        getCellSize,
        setCellSize
    };
})();

// Make module available globally
window.EnemiesModule = EnemiesModule;