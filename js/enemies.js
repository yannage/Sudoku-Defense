/**
 * enemies.js - Handles enemy generation, movement, and behavior
 * This module creates and manages enemy entities in the tower defense game
 * MODIFIED: Enemies now follow the grid cells exactly and match grid cell size
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
  
  // Get initial path
  if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
    path = BoardManager.getPathArray();
    console.log("EnemiesModule initialized with path from BoardManager:", path);
  } else if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
    path = BoardManager.getPathArray();
    console.log("EnemiesModule initialized with path from BoardManager:", path);
  } else {
    console.warn("EnemiesModule: No path provider available!");
    path = [];
  }
  
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
  console.log(`Creating enemy of type ${type}`);
  
  const typeData = enemyTypes[type] || enemyTypes[1];
  
  if (!path || path.length < 2) {
    console.error("Cannot create enemy: path is invalid!", path);
    return null;
  }
  
  const startCell = path[0];
  const nextCell = path[1] || startCell;
  
  if (!Array.isArray(startCell) || startCell.length !== 2) {
    console.error("Invalid start cell in path:", startCell);
    return null;
  }
  
  const enemy = {
    id: `enemy_${++enemyId}`,
    type: type,
    emoji: typeData.emoji,
    health: typeData.health * (1 + (waveNumber - 1) * 0.2),
    maxHealth: typeData.health * (1 + (waveNumber - 1) * 0.2),
    speed: typeData.speed,
    reward: typeData.reward,
    points: typeData.points,
    
    // New fields here
    tags: typeData.tags || [],
    resistances: typeData.resistances || [],
    statusEffects: [],
    
    currentPathIndex: 0,
    previousPathIndex: 0,
    progress: 0.01,
    row: startCell[0] + (nextCell[0] - startCell[0]) * 0.01,
    col: startCell[1] + (nextCell[1] - startCell[1]) * 0.01,
    active: true
  };
  
  console.log(`Enemy created at position: (${enemy.row}, ${enemy.col})`);
  
  enemies.push(enemy);
  EventSystem.publish(GameEvents.ENEMY_SPAWN, enemy);
  
  return enemy;
}
    /**
     * Start a wave of enemies
     */
    function startWave() {
  console.log("EnemiesModule.startWave called");
  
  if (isWaveActive) {
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Wave already in progress!");
    return;
  }
  
  // Get the latest path from BoardManager or BoardManager
  if (!path || path.length === 0) {
    const boardManager = window.BoardManager;
    if (boardManager && typeof boardManager.getPathArray === 'function') {
      path = boardManager.getPathArray();
      console.log("EnemiesModule: Updated path from BoardManager:", path);
    } else if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
      path = BoardManager.getPathArray();
      console.log("EnemiesModule: Updated path from BoardManager:", path);
    }
  }
  
  // CRITICAL: Verify we have a valid path
  if (!path || !Array.isArray(path) || path.length === 0) {
    console.error("Cannot start wave: No valid path defined!");
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot start wave: Path not properly defined!");
    
    // Try emergency path generation
    if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
      console.log("Attempting emergency path generation...");
      path = BoardManager.generateEnemyPath();
      
      if (!path || path.length === 0) {
        console.error("Emergency path generation failed!");
        return;
      } else {
        console.log("Emergency path generated successfully:", path);
      }
    } else {
      return;
    }
  }
  
  // Verify path format - each element should be [row, col]
  let validFormat = true;
  for (let i = 0; i < path.length; i++) {
    if (!Array.isArray(path[i]) || path[i].length !== 2) {
      console.error(`Invalid path element at index ${i}:`, path[i]);
      validFormat = false;
      break;
    }
  }
  
  if (!validFormat) {
    console.error("Path format is invalid, attempting to fix...");
    // Try to fix the path format
    if (typeof path[0] === 'string') {
      // Format might be "row,col" strings
      path = path.map(pos => pos.split(',').map(Number));
      console.log("Fixed path:", path);
    } else {
      console.error("Cannot fix path format!");
      EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot start wave: Invalid path format!");
      return;
    }
  }
  
  console.log("Starting wave with path:", path);
  isWaveActive = true;
  
  // Calculate number of enemies based on wave number
  const baseEnemyCount = 6;
  const enemyCount = baseEnemyCount + Math.floor((waveNumber - 1) * 3);
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
    
    console.log(`Spawning enemy #${enemiesSpawned+1}, type: ${enemyType}`);
    createEnemy(enemyType);
    enemiesSpawned++;
  }, 1000 / Math.sqrt(waveNumber)); // Spawn faster in higher waves
}

// Add a direct debug function to check path availability
window.debugEnemyPath = function() {
  let boardManagerPath = window.BoardManager && typeof BoardManager.getPathArray === 'function' ?
    BoardManager.getPathArray() :
    null;
  
  let BoardManagerPath = window.BoardManager && typeof BoardManager.getPathArray === 'function' ?
    BoardManager.getPathArray() :
    null;
  
  let currentEnemiesPath = window.EnemiesModule && EnemiesModule.path ?
    EnemiesModule.path :
    null;
  
  console.log("Path from BoardManager:", boardManagerPath);
  console.log("Path from BoardManager:", BoardManagerPath);
  console.log("Current path in EnemiesModule:", currentEnemiesPath);
  
  // Add explicit check to see if the path is usable
  if (currentEnemiesPath && currentEnemiesPath.length > 0) {
    console.log("EnemiesModule has a valid path with " + currentEnemiesPath.length + " cells");
    return true;
  } else {
    console.error("EnemiesModule path is missing or empty!");
    return false;
  }
};

// Expose path publicly for debugging
window.getEnemyPath = function() {
  return path;
};

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
    if (enemy.currentPathIndex >= path.length - 1) {
        // Enemy reached the end of the path
        enemyReachedEnd(enemy);
        return;
    }
    
    // Calculate movement speed based on enemy speed and deltaTime
    // Adjust this multiplier to control overall movement speed
    const moveSpeed = enemy.speed * 0.8 * deltaTime;
    
    // Get current and next cells in path
    const currentCell = path[enemy.currentPathIndex];
    const nextCell = path[enemy.currentPathIndex + 1];
    
    // Update progress along current path segment
    enemy.progress += moveSpeed;
    
    // Move to next path segment if progress is complete
    if (enemy.progress >= 1) {
        enemy.previousPathIndex = enemy.currentPathIndex;
        enemy.currentPathIndex++;
        enemy.progress = 0; // Reset progress for the next segment
        
        // Check if enemy reached the end
        if (enemy.currentPathIndex >= path.length - 1) {
            enemyReachedEnd(enemy);
            return;
        }
        
        // Update references to current and next cells
        const newCurrentCell = path[enemy.currentPathIndex];
        const newNextCell = path[enemy.currentPathIndex + 1] || newCurrentCell;
        
        // Update the enemy's exact position
        enemy.row = newCurrentCell[0];
        enemy.col = newCurrentCell[1];
    } else {
        // Calculate interpolated position between cells for smoother movement
        // Linear interpolation between current and next cell
        enemy.row = currentCell[0] + (nextCell[0] - currentCell[0]) * enemy.progress;
        enemy.col = currentCell[1] + (nextCell[1] - currentCell[1]) * enemy.progress;
    }
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
    
    // Generate new path for the next wave immediately
    setTimeout(() => {
        // Use BoardManager if available, otherwise fallback to BoardManager
        if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
            const newPath = BoardManager.generateEnemyPath();
            path = newPath;
            
            // Notify other modules of the path change
            EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
                pathCells: newPath
            });
            
            // Also publish a specific event for path updates
            EventSystem.publish('path:updated', newPath);
        }
        else if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
            // Clear existing path
            const pathCells = BoardManager.getPathCells();
            if (pathCells && typeof pathCells.clear === 'function') {
                pathCells.clear();
            }
            
            // Generate new path
            BoardManager.generateEnemyPath();
            console.log("New path generated after wave completion");
            
            // Update the board to show the new path
            if (window.Game && typeof Game.updateBoard === 'function') {
                Game.updateBoard();
            }
            
            // Notify other modules of the path change
            if (typeof BoardManager.getPathArray === 'function') {
                const newPath = BoardManager.getPathArray();
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
 * This code needs to be added to make the status effects visible on enemies.
 * Add this to the end of your enemies.js file or at the end of your game.js file
 * where the renderEnemies function is defined.
 */

// Apply status effect visuals to enemies
function applyStatusEffectsVisuals() {
  // First find all enemy elements
  const enemyElements = document.querySelectorAll('.enemy');
  
  // Check if we have any enemies
  if (!enemyElements.length) return;
  
  // Get all enemies from the module
  if (!window.EnemiesModule || typeof EnemiesModule.getEnemies !== 'function') return;
  
  const enemies = EnemiesModule.getEnemies();
  
  // Match enemies to their elements
  enemies.forEach(enemy => {
    const enemyElement = document.getElementById(enemy.id);
    if (!enemyElement) return;
    
    // Clear previous status classes first
    enemyElement.classList.remove('poisoned', 'slowed', 'stunned');
    
    // Check for status effects and apply the appropriate class
    if (enemy.poisoned) {
      enemyElement.classList.add('poisoned');
    }
    
    if (enemy.slowed) {
      enemyElement.classList.add('slowed');
    }
    
    if (enemy.stunned) {
      enemyElement.classList.add('stunned');
    }
    
    // Check for statusEffects array (used in the comprehensive implementation)
    if (enemy.statusEffects && Array.isArray(enemy.statusEffects) && enemy.statusEffects.length > 0) {
      enemy.statusEffects.forEach(effect => {
        if (effect.type === 'poison') {
          enemyElement.classList.add('poisoned');
        } else if (effect.type === 'slow') {
          enemyElement.classList.add('slowed');
        } else if (effect.type === 'stun') {
          enemyElement.classList.add('stunned');
        }
      });
    }
  });
}

// Call this every frame to update the status effect visuals
function injectStatusEffectVisuals() {
  // Method 1: Override the render function in game.js
  if (window.Game && typeof Game.render === 'function') {
    const originalRender = Game.render;
    Game.render = function() {
      // Call the original render function
      originalRender.apply(this, arguments);
      // Then apply our status effect visuals
      applyStatusEffectsVisuals();
    };
  }
  
  // Method 2: Override the renderEnemies function in game.js
  if (window.Game && typeof Game.renderEnemies === 'function') {
    const originalRenderEnemies = Game.renderEnemies;
    Game.renderEnemies = function() {
      // Call the original renderEnemies function
      originalRenderEnemies.apply(this, arguments);
      // Then apply our status effect visuals
      applyStatusEffectsVisuals();
    };
  }
  
  // Method 3: Set up a recurring interval if we can't override the render functions
  if ((!window.Game || typeof Game.render !== 'function') &&
    (!window.Game || typeof Game.renderEnemies !== 'function')) {
    setInterval(applyStatusEffectsVisuals, 100); // Update 10 times per second
  }
  
  console.log("Status effect visuals enabled");
}

// Additional CSS for the status effect indicators
function addStatusEffectStyles() {
  // Check if styles already exist
  if (document.getElementById('status-effect-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'status-effect-styles';
  styles.textContent = `
        /* Poisoned enemy */
        .enemy.poisoned {
            box-shadow: 0 0 8px #00ff00 !important;
            position: relative;
        }
        
        .enemy.poisoned::after {
            content: "☢️";
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 12px;
            z-index: 35;
        }
        
        /* Slowed enemy */
        .enemy.slowed {
            box-shadow: 0 0 8px #00ffff !important;
            position: relative;
            filter: brightness(0.7);
            transition: transform 0.5s !important; /* Make movement visibly slower */
        }
        
        .enemy.slowed::after {
            content: "🐌";
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 12px;
            z-index: 35;
        }
        
        /* Stunned enemy */
        .enemy.stunned {
            box-shadow: 0 0 8px #ffff00 !important;
            position: relative;
            animation: shake 0.5s infinite;
        }
        
        .enemy.stunned::after {
            content: "💫";
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 12px;
            z-index: 35;
        }
        
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
    `;
  
  document.head.appendChild(styles);
}

// Initialize everything
(function() {
  // Add the styles
  addStatusEffectStyles();
  
  // Set up the visual update system
  injectStatusEffectVisuals();
  
  // Also hook into GameEvents.TOWER_ATTACK to apply status effects
  EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
    if (!data || !data.enemy || !data.tower) return;
    
    // Get tower type
    const towerType = data.tower.type;
    
    // Apply status effects based on tower type
    if (towerType === '2') { // Slowing tower
      data.enemy.slowed = true;
      
      // Save original speed if not already saved
      if (typeof data.enemy.originalSpeed === 'undefined') {
        data.enemy.originalSpeed = data.enemy.speed;
        data.enemy.speed *= 0.7; // Reduce speed by 30%
      }
      
      // Clear the effect after 3 seconds
      setTimeout(() => {
        if (data.enemy && data.enemy.active) {
          data.enemy.slowed = false;
          
          // Restore original speed
          if (typeof data.enemy.originalSpeed !== 'undefined') {
            data.enemy.speed = data.enemy.originalSpeed;
            delete data.enemy.originalSpeed;
          }
        }
      }, 3000);
    }
    else if (towerType === '4') { // Poison tower
      data.enemy.poisoned = true;
      
      // Apply damage over time
      let ticksRemaining = 5;
      const poisonInterval = setInterval(() => {
        if (!data.enemy || !data.enemy.active || ticksRemaining <= 0) {
          clearInterval(poisonInterval);
          
          // Make sure to remove the poisoned flag if the enemy is still active
          if (data.enemy && data.enemy.active) {
            data.enemy.poisoned = false;
          }
          return;
        }
        
        // Apply poison damage
        if (EnemiesModule && typeof EnemiesModule.damageEnemy === 'function') {
          EnemiesModule.damageEnemy(data.enemy.id, 5); // 5 damage per tick
        }
        
        ticksRemaining--;
      }, 1000); // Tick every second
    }
    else if (towerType === '6' && Math.random() < 0.25) { // Stun tower with 25% chance
      data.enemy.stunned = true;
      
      // Save original speed if not already saved
      if (typeof data.enemy.originalSpeed === 'undefined') {
        data.enemy.originalSpeed = data.enemy.speed;
        data.enemy.speed = 0; // Stop movement
      }
      
      // Clear the effect after 1 second
      setTimeout(() => {
        if (data.enemy && data.enemy.active) {
          data.enemy.stunned = false;
          
          // Restore original speed
          if (typeof data.enemy.originalSpeed !== 'undefined') {
            data.enemy.speed = data.enemy.originalSpeed;
            delete data.enemy.originalSpeed;
          }
        }
      }, 1000);
    }
  });
})();
    
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
  
  // Listen for BoardManager initialization
  if (window.BoardManager) {
    EventSystem.subscribe('boardmanager:initialized', function() {
      console.log("EnemiesModule: BoardManager initialized, updating path");
      path = BoardManager.getPathArray();
    });
  }
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

window.debugEnemyPath = function() {
  console.log("========= ENEMY PATH DEBUG =========");
  console.log("EnemiesModule.path:", EnemiesModule.path);
  
  const boardManager = window.BoardManager;
  if (boardManager && typeof boardManager.getPathArray === 'function') {
    console.log("BoardManager.getPathArray():", boardManager.getPathArray());
  }
  
  if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
    console.log("BoardManager.getPathArray():", BoardManager.getPathArray());
  }
  
  if (EnemiesModule.path && EnemiesModule.path.length > 0) {
    console.log("Path elements format check:");
    for (let i = 0; i < Math.min(EnemiesModule.path.length, 5); i++) {
      console.log(`Element ${i}:`, EnemiesModule.path[i],
        "Is Array:", Array.isArray(EnemiesModule.path[i]));
    }
    return true;
  } else {
    console.log("No path available or empty path!");
    return false;
  }
};