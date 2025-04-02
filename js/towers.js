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
    const towerTypes = {
        // Number towers with reduced costs and improved stats
        1: { damage: 60, range: 2.5, attackSpeed: 0.7, cost: 30 },
        2: { damage: 70, range: 2.5, attackSpeed: 0.7, cost: 30 },
        3: { damage: 80, range: 2.5, attackSpeed: 0.7, cost: 30 },
        4: { damage: 90, range: 2.5, attackSpeed: 0.7, cost: 35 },
        5: { damage: 100, range: 2.5, attackSpeed: 0.7, cost: 35 },
        6: { damage: 110, range: 2.5, attackSpeed: 0.7, cost: 35 },
        7: { damage: 120, range: 2.5, attackSpeed: 0.7, cost: 40 },
        8: { damage: 130, range: 2.5, attackSpeed: 0.7, cost: 40 },
        9: { damage: 140, range: 3.0, attackSpeed: 0.7, cost: 40 },
        // Special tower
        'special': { emoji: '🔮', damage: 80, range: 4.0, attackSpeed: 0.3, cost: 100 }
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
function createTower(type, row, col) {
  console.log("TowersModule.createTower called with type:", type, "row:", row, "col:", col);
  
  // Add debug logging here to check solution value
  if (window.BoardManager && typeof BoardManager.getSolution === 'function') {
    const solution = BoardManager.getSolution();
    if (solution && solution[row] && solution[row][col]) {
      console.log("TOWER DEBUG - Solution value at this position:", solution[row][col]);
      if (parseInt(type) !== solution[row][col]) {
        console.log("TOWER DEBUG - MISMATCH: Tower value does not match solution!");
      } else {
        console.log("TOWER DEBUG - MATCH: Tower value matches solution.");
      }
    }
  }
  
  const typeData = towerTypes[type];
  
  if (!typeData) {
    console.error("Invalid tower type:", type);
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower type!");
    return null;
  }
  
  // Check if player has enough currency
  const playerState = PlayerModule.getState();
  if (playerState.currency < typeData.cost) {
    console.log("Not enough currency to build tower");
    EventSystem.publish(GameEvents.STATUS_MESSAGE, `Not enough currency to build this tower! Need ${typeData.cost}`);
    return null;
  }
  
  // Check if the cell is fixed or on a path
  const boardManager = window.BoardManager || window.SudokuModule;
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
  
  // Check if there's already a tower at this position
  if (getTowerAt(row, col)) {
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "There's already a tower in this cell!");
    return null;
  }
  
  // Determine if the tower is "correct" according to Sudoku rules ONLY
  // THE CRITICAL FIX: Don't check against solution
  let isCorrect = true;
  const numberValue = parseInt(type);
  
  if (!isNaN(numberValue) && numberValue >= 1 && numberValue <= 9 && type !== 'special') {
    // Check if placement is valid according to Sudoku rules
    if (boardManager && typeof boardManager.isValidMove === 'function') {
      isCorrect = boardManager.isValidMove(row, col, numberValue);
    } else {
      // Fallback if isValidMove isn't available: manually check Sudoku rules
      isCorrect = manuallyCheckSudokuRules(row, col, numberValue);
    }
    
    // Show warning if tower violates Sudoku rules
    if (!isCorrect) {
      EventSystem.publish(GameEvents.STATUS_MESSAGE,
        `Warning: This tower violates Sudoku rules. It will be removed after the wave with 50% refund.`);
    }
  }
  
  // Calculate tower position
  const x = col * cellSize + cellSize / 2;
  const y = row * cellSize + cellSize / 2;
  
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
    target: null,
    isCorrect: isCorrect
  };
  
  // Spend currency
  PlayerModule.spendCurrency(typeData.cost);
  
  // Add to towers array
  towers.push(tower);
  
  // For number towers, set the board value in the Sudoku board
  if (!isNaN(numberValue) && numberValue >= 1 && numberValue <= 9) {
    // Use BoardManager to update the board (or fallback to SudokuModule)
    if (boardManager && typeof boardManager.setCellValue === 'function') {
      boardManager.setCellValue(row, col, numberValue);
    } else {
      // Fallback to direct setting if setCellValue is not available
      const boardData = boardManager.getBoard();
      if (boardData && boardData[row]) {
        boardData[row][col] = numberValue;
      }
    }
    
    // If incorrect, track it
    if (!isCorrect) {
      incorrectTowers.add(tower.id);
    }
  }
  
  // Publish tower placed event
  EventSystem.publish(GameEvents.TOWER_PLACED, tower);
  
  return tower;
}

function manuallyCheckSudokuRules(row, col, value) {
  const boardManager = window.BoardManager || window.SudokuModule;
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
  const boardManager = window.BoardManager || window.SudokuModule;
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
    function attackEnemy(tower, enemy) {
        // Get base values
        const baseDamage = tower.damage;
        const basePoints = enemy.points || 5;
        const baseCurrency = enemy.reward || 10;
        
        // Apply completion bonuses if the module exists
        let damage = baseDamage;
        let points = basePoints;
        let currency = baseCurrency;
        
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
        
        // Publish tower attack event with bonus information
        EventSystem.publish(GameEvents.TOWER_ATTACK, {
            tower: tower,
            enemy: enemy,
            damage: damage,
            killed: isKilled,
            points: isKilled ? points : 0,
            currency: isKilled ? currency : 0
        });
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
    const boardManager = window.BoardManager || window.SudokuModule;
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
        setCellSize
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