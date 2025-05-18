/**
 * towers.js - Handles tower placement, upgrades, and attacks
 * This module creates and manages tower entities for the tower defense game
 */

const TowersModule = (function() {
    // Private variables
    let towers = [];
    let towerId = 0;
    let cellSize = 0;
    
    // Tower types with their properties - ENHANCED DAMAGE VERSION
  /**
 * Tower types with specialized behaviors
 * Replace the existing towerTypes object in towers.js with this enhanced version
 */
const towerTypes = {
  // 1: Fast-firing "machine gun" towers with low damage but high attack speed
  1: {
    damage: 5,
    range: 2.5,
    attackSpeed: 0.3, // 3x faster than normal
    cost: 30,
    specialType: "rapid",
    projectileEmoji: "⚪", // Small white projectile
    description: "Rapid-fire tower with low damage but 3x attack speed"
  },
  
  // 2: Slowing towers that reduce enemy speed
  2: {
    damage: 20,
    range: 3.0,
    attackSpeed: 0.9,
    cost: 30,
    specialType: "slow",
    slowEffect: 0.3, // Slows enemies by 30%
    slowDuration: 3, // Seconds
    projectileEmoji: "🟦", // Blue projectile
    description: "Slows enemies by 30% for 3 seconds"
  },
  
  // 3: Splash damage towers that hit multiple enemies
  3: {
    damage: 40,
    range: 2.0,
    attackSpeed: 1.0,
    cost: 35,
    specialType: "splash",
    splashRadius: 1.0, // Affects enemies within 1 cell
    projectileEmoji: "💢", // Splash effect
    description: "Deals splash damage to nearby enemies"
  },
  
  // 4: Poison towers that apply damage over time
  4: {
    damage: 15,
    range: 2.5,
    attackSpeed: 0.8,
    cost: 35,
    specialType: "poison",
    poisonDamage: 5, // Damage per tick
    poisonDuration: 5, // Seconds
    projectileEmoji: "🟢", // Green projectile
    description: "Poisons enemies, dealing damage over time"
  },
  
  // 5: Shield-breaking towers effective against armored enemies
  5: {
    damage: 50,
    range: 2.5,
    attackSpeed: 0.8,
    cost: 35,
    specialType: "pierce",
    armorPierce: 0.5, // 50% armor penetration (for future armored enemies)
    projectileEmoji: "🔵", // Blue pierce projectile
    description: "Pierces enemy armor, effective against tough enemies"
  },
  
  // 6: Stun towers with a chance to freeze enemies
  6: {
    damage: 25,
    range: 2.0,
    attackSpeed: 1.0,
    cost: 35,
    specialType: "stun",
    stunChance: 0.25, // 25% chance to stun
    stunDuration: 1.0, // 1 second
    projectileEmoji: "⚡", // Lightning projectile
    description: "25% chance to stun enemies for 1 second"
  },
  
  // 7: Gambling towers with random effects
  7: {
    damage: 30,
    range: 2.2,
    attackSpeed: 0.9,
    cost: 40,
    specialType: "gamble",
    bonusRange: [0.5, 2.0], // Min and max multiplier for bonuses
    projectileEmoji: "🎲", // Dice projectile
    description: "Random chance for bonus damage or currency"
  },
  
  // 8: Sniper towers with high damage but slow attack
  8: {
    damage: 120,
    range: 5.0,
    attackSpeed: 1.5,
    cost: 40,
    specialType: "sniper",
    critChance: 0.2, // 20% chance for critical hit
    critMultiplier: 2.0, // 2x damage on critical hit
    projectileEmoji: "🔴", // Red sniper projectile
    description: "Long range, high damage, slow attack with critical hits"
  },
  
  // 9: Support towers that boost adjacent towers
  9: {
    damage: 20,
    range: 1.5,
    attackSpeed: 1.0,
    cost: 40,
    specialType: "support",
    boostRange: 1, // Affects towers within 1 cell
    damageBoost: 0.2, // 20% damage boost
    projectileEmoji: "⭐", // Star projectile
    description: "Boosts damage of adjacent towers by 20%"
  },
  
  // Special tower (unchanged but with added properties)
  'special': {
    emoji: '🔮',
    damage: 80,
    range: 4.0,
    attackSpeed: 0.3,
    cost: 100,
    specialType: "special",
    projectileEmoji: "🪩", // Disco ball
    description: "Powerful magical tower with rapid attacks"
  }
};
    // Track which towers are incorrect
    const incorrectTowers = new Set();
    
    /**
     * Initialize the towers module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        towers = [];
        towerId = 0;
        cellSize = options.cellSize || 55; // Default cell size
        incorrectTowers.clear();
        console.log("TowersModule initialized with cellSize:", cellSize);
    }
    
    /**
     * Create a new tower
     * @param {number|string} type - Tower type
     * @param {number} row - Row index on the grid
     * @param {number} col - Column index on the grid
     * @returns {Object|null} The created tower or null if creation failed
     */
    /**
 * Update for the TowersModule to allow strategic placement of towers
 * that violate Sudoku rules.
 */

/**
 * Create a new tower
 * @param {number|string} type - Tower type
 * @param {number} row - Row index on the grid
 * @param {number} col - Column index on the grid
 * @returns {Object|null} The created tower or null if creation failed
 */
/**
 * Create a new tower
 * @param {number|string} type - Tower type
 * @param {number} row - Row index on the grid
 * @param {number} col - Column index on the grid
 * @returns {Object|null} The created tower or null if creation failed
 */
/**
 * Create a new tower
 * @param {number|string} type - Tower type
 * @param {number} row - Row index on the grid
 * @param {number} col - Column index on the grid
 * @returns {Object|null} The created tower or null if creation failed
 */
/**
 * Create a new tower with improved validation and UI updates
 * @param {number|string} type - Tower type
 * @param {number} row - Row index on the grid
 * @param {number} col - Column index on the grid
 * @returns {Object|null} The created tower or null if creation failed
 */
/**
 * Add this code to your TowersModule to fix incorrect tower removal
 * Place these functions inside the TowersModule IIFE
 */

/**
 * Tracking recent tower placements to influence enemy paths
 * Add this to the createTower function in TowersModule
 */
function createTower(type, row, col, options = {}) {
    const { free = false } = options;
    console.log(`Creating tower: Type=${type}, Position=(${row},${col})`);
    
    const typeData = towerTypes[type];
    
    if (!typeData) {
        console.error("Invalid tower type:", type);
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower type!");
        return null;
    }
    
    // Check if player has enough currency
    const playerState = PlayerModule.getState();
    if (!free && playerState.currency < typeData.cost) {
        console.log("Not enough currency to build tower");
        EventSystem.publish(GameEvents.STATUS_MESSAGE, `Not enough currency to build this tower! Need ${typeData.cost}`);
        return null;
    }
    
    // Check if there's already a tower at this position
    if (getTowerAt(row, col)) {
        console.log(`Tower already exists at position (${row},${col})`);
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "There's already a tower in this cell!");
        return null;
    }
    
    // Check if the cell is fixed or on a path
    const boardManager = window.BoardManager;
    if (!boardManager) {
        console.error("BoardManager not available");
        return null;
    }
    
    const fixedCells = boardManager.getFixedCells();
    const pathCells = boardManager.getPathCells();
    
    if (fixedCells && fixedCells[row] && fixedCells[row][col]) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on a fixed Sudoku cell!");
        return null;
    }
    
    if (pathCells && pathCells.has && pathCells.has(`${row},${col}`)) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on the enemy path!");
        return null;
    }
    
    // Calculate tower position
    const x = col * cellSize + cellSize / 2;
    const y = row * cellSize + cellSize / 2;
    
    // Create tower instance
    const tower = {
        id: `tower_${++towerId}`,
        type: type,
        emoji: typeData.emoji,
        damage: typeData.damage,
        range: typeData.range * cellSize,
        attackSpeed: typeData.attackSpeed,
        attackCooldown: 0,
        level: 1,
        row: row,
        col: col,
        x: x,
        y: y,
        target: null
    };
    
    // Check if the tower matches the solution
    const solution = boardManager.getSolution();
    if (solution && type !== 'special') {
        const typeValue = parseInt(type);
        if (!isNaN(typeValue) && solution[row][col] !== typeValue) {
            // Mark as incorrect
            tower.isCorrect = false;
            tower.matchesSolution = false;
            incorrectTowers.add(tower.id);
            
            console.log(`Tower at (${row},${col}) is incorrect. Solution value: ${solution[row][col]}, Tower type: ${type}`);
            EventSystem.publish(GameEvents.STATUS_MESSAGE, `Warning: This tower does not match the solution and will be removed after the wave.`);
        } else {
            tower.isCorrect = true;
            tower.matchesSolution = true;
        }
    }
    
    // Spend currency if applicable
    if (!free) {
        PlayerModule.spendCurrency(typeData.cost);
    }
    
    // Update the board first via BoardManager
    if (boardManager && typeof boardManager.setCellValue === 'function') {
        const numberValue = parseInt(type);
        if (!isNaN(numberValue) && numberValue >= 1 && numberValue <= 9) {
            const success = boardManager.setCellValue(row, col, numberValue);
            if (!success) {
                console.error(`Failed to set cell value ${numberValue} at (${row},${col})`);
                // Refund currency if placement fails
                if (!free) {
                    PlayerModule.addCurrency(typeData.cost);
                }
                return null;
            }
        }
    }
    
    // Add to towers array
    towers.push(tower);
    
    // Record this placement for path generation (only if it's a valid Sudoku placement)
    if (tower.isCorrect !== false && type !== 'special') {
        // Initialize the array if it doesn't exist
        if (!window.recentTowerPlacements) {
            window.recentTowerPlacements = [];
        }
        
        // Add this placement to recent towers
        window.recentTowerPlacements.push({ row, col, type });
        
        // Keep the list manageable (last 5 placements)
        if (window.recentTowerPlacements.length > 5) {
            window.recentTowerPlacements.shift();
        }
        
        console.log(`Added tower at (${row},${col}) to recent placements list. Total: ${window.recentTowerPlacements.length}`);
    }
    
    // Publish tower placed event
    EventSystem.publish(GameEvents.TOWER_PLACED, tower);
    
    // Force UI update
    setTimeout(() => {
        if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
        }
    }, 10);
    
    return tower;
}

// Replace your removeIncorrectTowers function with this version
function removeIncorrectTowers() {
  console.log("Checking for incorrect towers to remove...");
  console.log(`Currently tracking ${incorrectTowers.size} incorrect towers`);
  
  if (incorrectTowers.size === 0) {
    // If the set is empty, let's try to identify towers that don't match the solution
    const boardManager = window.BoardManager;
    if (!boardManager || typeof boardManager.getSolution !== 'function') {
      console.error("Cannot check for incorrect towers: BoardManager not available or getSolution method missing");
      return;
    }
    
    const solution = boardManager.getSolution();
    
    // Search through towers to find any that don't match the solution
    towers.forEach(tower => {
      if (tower.type === 'special') return; // Skip special towers
      
      const typeValue = parseInt(tower.type);
      if (!isNaN(typeValue) && solution[tower.row][tower.col] !== typeValue) {
        console.log(`Found incorrect tower at (${tower.row},${tower.col}): ${tower.type} vs solution ${solution[tower.row][tower.col]}`);
        incorrectTowers.add(tower.id);
        
        // Also mark the tower object itself
        tower.isCorrect = false;
        tower.matchesSolution = false;
      }
    });
    
    console.log(`Identified ${incorrectTowers.size} incorrect towers during cleanup check`);
  }
  
  if (incorrectTowers.size === 0) return;
  
  let refundAmount = 0;
  const towersToRemove = [];
  
  // Identify towers to remove and calculate refund
  towers.forEach(tower => {
    if (incorrectTowers.has(tower.id)) {
      console.log(`Removing incorrect tower:
        Tower ID: ${tower.id}
        Type: ${tower.type}
        Position: (${tower.row},${tower.col})`);
      
      towersToRemove.push(tower);
      
      // Calculate 50% refund
      const towerData = towerTypes[tower.type];
      if (towerData) {
        const baseRefund = Math.floor(towerData.cost * 0.5);
        const upgradeRefund = Math.floor(baseRefund * (tower.level - 1) * 0.75);
        refundAmount += baseRefund + upgradeRefund;
      }
    }
  });
  
  // Process refund
  if (refundAmount > 0 && towersToRemove.length > 0) {
    PlayerModule.addCurrency(refundAmount);
    EventSystem.publish(GameEvents.STATUS_MESSAGE,
      `${towersToRemove.length} incorrect towers removed. Refunded ${refundAmount} currency.`);
  }
  
  // Remove towers
  towersToRemove.forEach(tower => {
    // Clear cell value using BoardManager
    const boardManager = window.BoardManager;
    if (boardManager && typeof boardManager.setCellValue === 'function') {
      boardManager.setCellValue(tower.row, tower.col, 0);
    }
    
    // Remove tower from array
    towers = towers.filter(t => t.id !== tower.id);
    
    // Publish tower removed event
    EventSystem.publish(GameEvents.TOWER_REMOVED, tower);
  });
  
  // Clear tracking set
  incorrectTowers.clear();
  
  // Update board display
  if (window.Game && typeof Game.updateBoard === 'function') {
    Game.updateBoard();
  }
}

// Add this to your initEventListeners function or create it if it doesn't exist
function initEventListeners() {
  // Listen for game initialization
  EventSystem.subscribe(GameEvents.GAME_INIT, function(options) {
    init(options);
  });
  
  // Listen for new game
  EventSystem.subscribe(GameEvents.GAME_START, function() {
    init();
  });
  
  // Listen for wave completion to remove incorrect towers
  EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
    console.log("Wave complete - checking for incorrect towers to remove");
    removeIncorrectTowers();
  });
  
  // Listen for BoardManager initialization
  if (window.BoardManager) {
    EventSystem.subscribe('boardmanager:initialized', function() {
      console.log("TowersModule: BoardManager initialized, synchronizing state");
      // Fix any discrepancies between towers and board
      if (typeof BoardManager.fixBoardDiscrepancies === 'function') {
        BoardManager.fixBoardDiscrepancies();
      }
    });
  }
}

// Add this to your Event Subscription for better visual indicators
EventSystem.subscribe(GameEvents.TOWER_PLACED, function(tower) {
  if (tower && tower.id && incorrectTowers.has(tower.id)) {
    // Add visual indicator for incorrect towers
    setTimeout(() => {
      const cellElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
      if (cellElement) {
        cellElement.classList.add('incorrect-tower');
        
        // Add X mark if not already present
        if (!cellElement.querySelector('.incorrect-marker')) {
          const xMark = document.createElement('div');
          xMark.className = 'incorrect-marker';
          xMark.textContent = '❌';
          cellElement.appendChild(xMark);
        }
      }
    }, 100);
  }
});

// Make incorrectTowers available for debugging
window.debugIncorrectTowers = function() {
  return {
    count: incorrectTowers.size,
    ids: Array.from(incorrectTowers),
    towers: towers.filter(t => incorrectTowers.has(t.id))
  };
};
function manuallyCheckSudokuRules(row, col, value) {
  const boardManager = window.BoardManager;
  const boardData = boardManager.getBoard();
  
  // Check row
  for (let i = 0; i < 9; i++) {
    if (i !== col && boardData[row][i] === value) {
      return false;
    }
  }
  
  // Check column
  for (let i = 0; i < 9; i++) {
    if (i !== row && boardData[i][col] === value) {
      return false;
    }
  }
  
  // Check 3x3 box
  let boxRow = Math.floor(row / 3) * 3;
  let boxCol = Math.floor(col / 3) * 3;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if ((boxRow + i !== row || boxCol + j !== col) &&
        boardData[boxRow + i][boxCol + j] === value) {
        return false;
      }
    }
  }
  
  return true;
}

    /**
     * Remove a tower
     * @param {string} towerId - ID of the tower to remove
     * @returns {boolean} Whether the tower was removed
     */
    function removeTower(towerId) {
  const tower = towers.find(t => t.id === towerId);
  
  if (!tower) {
    return false;
  }
  
  // Remove from towers array
  towers = towers.filter(t => t.id !== towerId);
  
  // Remove number from Sudoku grid
  const boardManager = window.BoardManager;
  if (boardManager && typeof boardManager.setCellValue === 'function') {
    boardManager.setCellValue(tower.row, tower.col, 0);
  }
  
  // Remove from incorrect towers set if it's there
  if (incorrectTowers.has(tower.id)) {
    incorrectTowers.delete(tower.id);
  }
  
  // Publish tower removed event
  EventSystem.publish(GameEvents.TOWER_REMOVED, tower);
  
  return true;
}
    /**
     * Upgrade a tower
     * @param {string} towerId - ID of the tower to upgrade
     * @returns {boolean} Whether the tower was upgraded
     */
    function upgradeTower(towerId) {
        const tower = towers.find(t => t.id === towerId);
        
        if (!tower) {
            return false;
        }
        
        // Calculate upgrade cost based on tower level
        const upgradeCost = Math.floor(towerTypes[tower.type].cost * 0.75 * tower.level);
        
        // Check if player has enough currency
        if (!PlayerModule.spendCurrency(upgradeCost)) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, `Not enough currency to upgrade this tower! Need ${upgradeCost}`);
            return false;
        }
        
        // Apply upgrade effects - ENHANCED
        tower.level++;
        tower.damage = Math.floor(tower.damage * 1.8);    // Was 1.5 (50% increase)
        tower.range = Math.floor(tower.range * 1.3);      // Was 1.2 (20% increase)
        tower.attackSpeed *= 0.7;                         // Was 0.8 (Lower is faster)
        
        // Publish tower upgrade event
        EventSystem.publish(GameEvents.TOWER_UPGRADE, tower);
        
        return true;
    }
    
    /**
     * Update all towers
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    function update(deltaTime) {
        const enemies = EnemiesModule.getEnemies();
        
        if (enemies.length === 0) {
            return;
        }
        
        // Update each tower
        for (let i = 0; i < towers.length; i++) {
            const tower = towers[i];
            
            // Update attack cooldown
            if (tower.attackCooldown > 0) {
                tower.attackCooldown -= deltaTime;
            }
            
            // Skip if tower is on cooldown
            if (tower.attackCooldown > 0) {
                continue;
            }
            
            // Find a target for the tower
            const target = findTarget(tower, enemies);
            
            if (target) {
                // Attack the target
                attackEnemy(tower, target);
                
                // Set attack cooldown
                tower.attackCooldown = tower.attackSpeed;
            }
        }
    }
    
    /**
     * Find a target for a tower
     * @param {Object} tower - The tower
     * @param {Object[]} enemies - Array of enemies
     * @returns {Object|null} The target enemy or null if no target found
     */
    function findTarget(tower, enemies) {
    // Special tower attacks any enemy in range
    if (tower.type === 'special') {
        return findClosestEnemy(tower, enemies);
    }
    
    // For number towers, simply return the closest enemy
    return findClosestEnemy(tower, enemies);
}
    
    /**
     * Find the closest enemy within range
     * @param {Object} tower - The tower
     * @param {Object[]} enemies - Array of enemies
     * @returns {Object|null} The closest enemy or null if no enemy in range
     */
function findClosestEnemy(tower, enemies) {
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    // Get cell size for distance calculations
    const cellSize = window.EnemiesModule ? EnemiesModule.getCellSize() : 55;
    
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        // Convert tower position to cell coordinates for consistent comparison
        const towerRow = tower.row;
        const towerCol = tower.col;
        
        // Calculate distance in cell units
        const rowDist = enemy.row - towerRow;
        const colDist = enemy.col - towerCol;
        const distance = Math.sqrt(rowDist * rowDist + colDist * colDist);
        
        // Convert tower range from pixels to cell units
        const towerRangeInCells = tower.range / cellSize;
        
        // Check if enemy is in range and closer than current closest
        if (distance <= towerRangeInCells && distance < closestDistance) {
            closestEnemy = enemy;
            closestDistance = distance;
        }
    }
    
    return closestEnemy;
}
    
    /**
     * Attack an enemy
     * @param {Object} tower - The tower
     * @param {Object} enemy - The enemy
     */
    /**
 * Attack an enemy with specialized tower effects
 * @param {Object} tower - The tower
 * @param {Object} enemy - The enemy
 */
function attackEnemy(tower, enemy) {
    // Get base values
    const towerTypeData = towerTypes[tower.type];
    const baseDamage = tower.damage;
    const basePoints = enemy.points || 5;
    const baseCurrency = enemy.reward || 10;
    
    // Initialize effects and bonuses
    let damage = baseDamage;
    let points = basePoints;
    let currency = baseCurrency;
    let statusEffects = [];
    let isCritical = false;
    
    // Apply tower type special effects
    if (towerTypeData && towerTypeData.specialType) {
        switch (towerTypeData.specialType) {
            case "sniper":
                // Sniper tower has chance for critical hit
                if (Math.random() < towerTypeData.critChance) {
                    damage *= towerTypeData.critMultiplier;
                    isCritical = true;
                }
                break;
                
            case "gamble":
                // Gambling tower has random effects
                const roll = Math.random();
                if (roll < 0.3) {
                    // Bonus damage (30% chance)
                    const multiplier = towerTypeData.bonusRange[0] + Math.random() * (towerTypeData.bonusRange[1] - towerTypeData.bonusRange[0]);
                    damage *= multiplier;
                    showFloatingText(tower, `${Math.round(multiplier * 100)}% DMG!`);
                } else if (roll < 0.6) {
                    // Bonus currency (30% chance)
                    const multiplier = towerTypeData.bonusRange[0] + Math.random() * (towerTypeData.bonusRange[1] - towerTypeData.bonusRange[0]);
                    currency *= multiplier;
                    showFloatingText(tower, `${Math.round(multiplier * 100)}% GOLD!`);
                }
                // 40% chance of no bonus
                break;
                
            case "poison":
                // Poison tower applies damage over time effect
                statusEffects.push({
                    type: "poison",
                    damage: towerTypeData.poisonDamage,
                    duration: towerTypeData.poisonDuration,
                    ticksRemaining: towerTypeData.poisonDuration * 10, // 10 ticks per second
                    source: tower.id
                });
                break;
                
            case "slow":
                // Slowing tower reduces enemy speed
                statusEffects.push({
                    type: "slow",
                    slowFactor: towerTypeData.slowEffect,
                    duration: towerTypeData.slowDuration,
                    timeRemaining: towerTypeData.slowDuration,
                    source: tower.id
                });
                break;
                
            case "stun":
                // Stun tower has chance to freeze enemy
                if (Math.random() < towerTypeData.stunChance) {
                    statusEffects.push({
                        type: "stun",
                        duration: towerTypeData.stunDuration,
                        timeRemaining: towerTypeData.stunDuration,
                        source: tower.id
                    });
                    showFloatingText(enemy, "STUN!");
                }
                break;
                
            case "splash":
                // Splash damage affects nearby enemies
                if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
                    const allEnemies = EnemiesModule.getEnemies();
                    const splashRadius = towerTypeData.splashRadius * cellSize;
                    
                    // Calculate primary target damage
                    const isKilled = EnemiesModule.damageEnemy(enemy.id, damage);
                    
                    // Find and damage enemies near the primary target
                    allEnemies.forEach(nearbyEnemy => {
                        if (nearbyEnemy.id !== enemy.id) {
                            // Calculate distance between enemies
                            const dx = (nearbyEnemy.col - enemy.col) * cellSize;
                            const dy = (nearbyEnemy.row - enemy.row) * cellSize;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            // Apply splash damage if within radius (with falloff)
                            if (distance <= splashRadius) {
                                const falloff = 1 - (distance / splashRadius);
                                const splashDamage = damage * 0.5 * falloff; // 50% damage with distance falloff
                                EnemiesModule.damageEnemy(nearbyEnemy.id, splashDamage);
                                
                                // Create smaller splash effect
                                createSplashEffect(nearbyEnemy, 0.7);
                            }
                        }
                    });
                    
                    // Create main splash effect
                    createSplashEffect(enemy, 1.0);
                    
                    // We handled the damage directly, so return to avoid double damage
                    EventSystem.publish(GameEvents.TOWER_ATTACK, {
                        tower: tower,
                        enemy: enemy,
                        damage: damage,
                        killed: isKilled,
                        points: isKilled ? points : 0,
                        currency: isKilled ? currency : 0,
                        isCritical: isCritical,
                        statusEffects: statusEffects
                    });
                    return;
                }
                break;
                
            case "support":
                // Support towers boost nearby towers
                boostNearbyTowers(tower);
                break;
        }
    }
    
    // Apply completion bonuses if the module exists
    if (window.CompletionBonusModule && 
        typeof CompletionBonusModule.applyEffects === 'function') {
        const bonusEffects = CompletionBonusModule.applyEffects(
            tower, enemy, basePoints, baseCurrency
        );
        damage = bonusEffects.damage;
        points = bonusEffects.points;
        currency = bonusEffects.currency;
    }
    
    // Damage the enemy
    const isKilled = EnemiesModule.damageEnemy(enemy.id, damage);
    
    // Apply status effects to the enemy
    if (statusEffects.length > 0 && !isKilled) {
        applyStatusEffects(enemy, statusEffects);
    }
    
    // Publish tower attack event with all information
    EventSystem.publish(GameEvents.TOWER_ATTACK, {
        tower: tower,
        enemy: enemy,
        damage: damage,
        killed: isKilled,
        points: isKilled ? points : 0,
        currency: isKilled ? currency : 0,
        isCritical: isCritical,
        statusEffects: statusEffects
    });
    
    // Create appropriate visual effect
    if (isCritical) {
        showFloatingText(enemy, `CRIT! ${Math.round(damage)}`);
    }
}

/**
 * Apply status effects to an enemy
 * @param {Object} enemy - The enemy
 * @param {Array} statusEffects - Array of status effects to apply
 */
function applyStatusEffects(enemy, statusEffects) {
    // Initialize enemy status effects array if it doesn't exist
    if (!enemy.statusEffects) {
        enemy.statusEffects = [];
    }
    
    // Process each new status effect
    statusEffects.forEach(newEffect => {
        // Check if the enemy already has this type of effect
        const existingEffectIndex = enemy.statusEffects.findIndex(
            effect => effect.type === newEffect.type && effect.source === newEffect.source
        );
        
        if (existingEffectIndex >= 0) {
            // Refresh the existing effect
            enemy.statusEffects[existingEffectIndex] = newEffect;
        } else {
            // Add the new effect
            enemy.statusEffects.push(newEffect);
            
            // Apply immediate effects
            if (newEffect.type === "slow" && typeof enemy.originalSpeed === 'undefined') {
                enemy.originalSpeed = enemy.speed;
                enemy.speed *= (1 - newEffect.slowFactor);
            } else if (newEffect.type === "stun") {
                enemy.stunned = true;
                enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                enemy.speed = 0;
            }
        }
    });
}

/**
 * Create a splash effect around an enemy
 * @param {Object} enemy - The enemy
 * @param {number} scale - Effect size scale
 */
function createSplashEffect(enemy, scale) {
    // Create a splash effect at the enemy's position
    const explosion = document.createElement('div');
    explosion.className = 'splash-effect';
    explosion.style.position = 'absolute';
    explosion.style.left = `${enemy.col * cellSize + cellSize / 2}px`;
    explosion.style.top = `${enemy.row * cellSize + cellSize / 2}px`;
    explosion.style.width = `${cellSize * scale}px`;
    explosion.style.height = `${cellSize * scale}px`;
    explosion.style.transform = 'translate(-50%, -50%)';
    explosion.style.borderRadius = '50%';
    explosion.style.backgroundColor = 'rgba(255, 100, 0, 0.5)';
    explosion.style.zIndex = '25';
    
    // Add to the board
    const projectileContainer = document.getElementById('projectile-container');
    if (projectileContainer) {
        projectileContainer.appendChild(explosion);
        
        // Animate and remove
        let size = 0.8;
        const expandInterval = setInterval(() => {
            size += 0.1;
            explosion.style.transform = `translate(-50%, -50%) scale(${size})`;
            explosion.style.opacity = (1.5 - size).toString();
            
            if (size >= 1.5) {
                clearInterval(expandInterval);
                explosion.remove();
            }
        }, 30);
    }
}

/**
 * Show floating text above an object
 * @param {Object} obj - The object (tower or enemy)
 * @param {string} text - Text to display
 */
function showFloatingText(obj, text) {
    // Create a floating text element
    const textElement = document.createElement('div');
    textElement.className = 'floating-text';
    textElement.textContent = text;
    textElement.style.position = 'absolute';
    textElement.style.left = `${obj.col * cellSize + cellSize / 2}px`;
    textElement.style.top = `${obj.row * cellSize}px`;
    textElement.style.transform = 'translate(-50%, -100%)';
    textElement.style.color = 'white';
    textElement.style.fontWeight = 'bold';
    textElement.style.fontSize = '12px';
    textElement.style.textShadow = '0 0 3px black';
    textElement.style.zIndex = '30';
    
    // Add to the board
    const boardElement = document.getElementById('sudoku-board');
    if (boardElement) {
        boardElement.appendChild(textElement);
        
        // Animate and remove
        let y = 0;
        const moveInterval = setInterval(() => {
            y -= 1;
            textElement.style.transform = `translate(-50%, calc(-100% + ${y}px))`;
            textElement.style.opacity = (1 + y / 20).toString();
            
            if (y <= -20) {
                clearInterval(moveInterval);
                textElement.remove();
            }
        }, 30);
    }
}

/**
 * Boost nearby towers
 * @param {Object} supportTower - The support tower
 */
function boostNearbyTowers(supportTower) {
    const supportType = towerTypes[supportTower.type];
    if (!supportType || supportType.specialType !== 'support') return;
    
    // Get all towers
    if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
        const towers = TowersModule.getTowers();
        const boostRadius = supportType.boostRange * cellSize;
        
        towers.forEach(tower => {
            // Skip self or other support towers
            if (tower.id === supportTower.id || 
                (towerTypes[tower.type] && towerTypes[tower.type].specialType === 'support')) {
                return;
            }
            
            // Calculate distance
            const dx = (tower.col - supportTower.col) * cellSize;
            const dy = (tower.row - supportTower.row) * cellSize;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Apply boost if within radius
            if (distance <= boostRadius) {
                // Apply damage boost if not already boosted
                if (!tower.supportBoosted) {
                    tower.baseDamage = tower.baseDamage || tower.damage; // Store original damage
                    tower.damage = Math.floor(tower.baseDamage * (1 + supportType.damageBoost));
                    tower.supportBoosted = true;
                    tower.supportSource = supportTower.id;
                    
                    // Visual indication
                    const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                    if (towerElement) {
                        towerElement.classList.add('support-boosted');
                    }
                }
            } 
            // Remove boost if tower moved out of range
            else if (tower.supportBoosted && tower.supportSource === supportTower.id) {
                tower.damage = tower.baseDamage;
                tower.supportBoosted = false;
                tower.supportSource = null;
                
                // Remove visual indication
                const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                if (towerElement) {
                    towerElement.classList.remove('support-boosted');
                }
            }
        });
    }
}
    
    /**
     * Remove incorrect towers after a wave
     */
  function removeIncorrectTowers() {
  if (incorrectTowers.size === 0) return;
  
  let refundAmount = 0;
  const towersToRemove = [];
  
  // Identify towers to remove and calculate refund
  towers.forEach(tower => {
    if (incorrectTowers.has(tower.id)) {
      console.log(`Identifying incorrect tower for removal:
        Tower ID: ${tower.id}
        Type: ${tower.type}
        Position: (${tower.row},${tower.col})
        Is Correct (Sudoku Rules): ${tower.isCorrect}
        Matches Solution: ${tower.matchesSolution}`);
      
      towersToRemove.push(tower);
      
      // Calculate 50% refund
      const towerData = towerTypes[tower.type];
      if (towerData) {
        const baseRefund = Math.floor(towerData.cost * 0.5);
        const upgradeRefund = Math.floor(baseRefund * (tower.level - 1) * 0.75);
        refundAmount += baseRefund + upgradeRefund;
      }
    }
  });
  
  // Process refund
  if (refundAmount > 0) {
    PlayerModule.addCurrency(refundAmount);
    EventSystem.publish(GameEvents.STATUS_MESSAGE,
      `${towersToRemove.length} incorrect towers removed. Refunded ${refundAmount} currency.`);
  }
  
  // Remove towers
  towersToRemove.forEach(tower => {
    // Clear cell value using BoardManager
    const boardManager = window.BoardManager;
    if (boardManager && typeof boardManager.setCellValue === 'function') {
      boardManager.setCellValue(tower.row, tower.col, 0);
    }
    
    // Remove tower from array
    towers = towers.filter(t => t.id !== tower.id);
    
    // Publish tower removed event
    EventSystem.publish(GameEvents.TOWER_REMOVED, tower);
  });
  
  // Clear tracking set
  incorrectTowers.clear();
  
  // Update board display
  if (Game.updateBoard) {
    Game.updateBoard();
  }
}
    /**
     * Get all towers
     * @returns {Object[]} Array of towers
     */
    function getTowers() {
        return towers;
    }
    
    /**
     * Get a tower by position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object|null} The tower at the position or null if no tower found
     */
    function getTowerAt(row, col) {
        return towers.find(t => t.row === row && t.col === col);
    }
    
    /**
     * Get tower cost by type
     * @param {number|string} type - Tower type
     * @returns {number} Tower cost
     */
    function getTowerCost(type) {
        return towerTypes[type] ? towerTypes[type].cost : 0;
    }
    
    /**
     * Get tower type data
     * @param {number|string} type - Tower type
     * @returns {Object|null} Tower type data
     */
    function getTowerTypeData(type) {
        return towerTypes[type] ? { ...towerTypes[type] } : null;
    }
    
    /**
     * Get all tower types
     * @returns {Object} Tower types
     */
    function getTowerTypes() {
        return { ...towerTypes };
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
  
  // Listen for wave completion to remove incorrect towers
  EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
    removeIncorrectTowers();
  });
  
  // Listen for BoardManager initialization
  if (window.BoardManager) {
    EventSystem.subscribe('boardmanager:initialized', function() {
      console.log("TowersModule: BoardManager initialized, synchronizing state");
      // Fix any discrepancies between towers and board
      if (typeof BoardManager.fixBoardDiscrepancies === 'function') {
        BoardManager.fixBoardDiscrepancies();
      }
    });
  }
}
    // Initialize event listeners
    initEventListeners();
    
    // Public API
    return {
        init,
        createTower,
        removeTower,
        upgradeTower,
        update,
        getTowers,
        getTowerAt,
        getTowerCost,
        getTowerTypeData,
        getTowerTypes,
        setCellSize,
        // Make towerTypes accessible to other modules
towerTypes: towerTypes
    };
})();

// Make module available globally
window.TowersModule = TowersModule;

// Add highlighting functionality for number cells
(function() {
    // Track the currently highlighted number
    let highlightedNumber = null;
    
    // Function to highlight all cells with a specific number
    function highlightNumberCells(number) {
        // Clear any existing highlights
        clearHighlights();
        
        if (!number || number === highlightedNumber) {
            highlightedNumber = null;
            return;
        }
        
        highlightedNumber = number;
        
        // Get the board element
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) return;
        
        // Get all cells
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        
        // Highlight cells with the matching number
        cells.forEach(cell => {
            // Check if the cell contains the number
            const cellText = cell.textContent.trim();
            
            if (cellText === number.toString() || cellText === `${number}️⃣`) {
                cell.classList.add('number-highlighted');
            } else {
                // Check for towers (might have additional elements inside)
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                // If we have access to the tower data directly
                if (window.TowersModule && typeof TowersModule.getTowerAt === 'function') {
                    const tower = TowersModule.getTowerAt(row, col);
                    if (tower && tower.type == number) {
                        cell.classList.add('number-highlighted');
                    }
                }
            }
        });
    }
    
    // Function to clear all highlights
    function clearHighlights() {
        const highlightedCells = document.querySelectorAll('.sudoku-cell.number-highlighted');
        highlightedCells.forEach(cell => {
            cell.classList.remove('number-highlighted');
        });
    }
    
    // Setup tower selection highlighting
    document.addEventListener('DOMContentLoaded', function() {
        function setupTowerSelection() {
            const towerOptions = document.querySelectorAll('.tower-option');
            if (!towerOptions.length) {
                setTimeout(setupTowerSelection, 100);
                return;
            }
            
            towerOptions.forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
                
                newOption.addEventListener('click', function() {
                    const towerType = this.dataset.towerType;
                    const cost = TowersModule.getTowerCost(towerType);
                    
                    document.querySelectorAll('.tower-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    this.classList.add('selected');
                    PlayerModule.selectTower(towerType);
                    
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                        `Selected ${towerType === 'special' ? 'Special' : towerType} Tower. Cost: ${cost}`);
                    
                    if (towerType !== 'special' && !isNaN(parseInt(towerType))) {
                        highlightNumberCells(parseInt(towerType));
                    } else {
                        clearHighlights();
                    }
                });
            });
        }
        
        setupTowerSelection();
    });
    
    // Update highlights when towers are placed
    EventSystem.subscribe(GameEvents.TOWER_PLACED, function(tower) {
        if (highlightedNumber && tower.type == highlightedNumber) {
            setTimeout(() => highlightNumberCells(highlightedNumber), 50);
        }
    });
})();