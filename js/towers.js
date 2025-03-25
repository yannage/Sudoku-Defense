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
        1: { emoji: '1️⃣', damage: 60, range: 2.5, attackSpeed: 0.7, cost: 30 },
        2: { emoji: '2️⃣', damage: 70, range: 2.5, attackSpeed: 0.7, cost: 30 },
        3: { emoji: '3️⃣', damage: 80, range: 2.5, attackSpeed: 0.7, cost: 30 },
        4: { emoji: '4️⃣', damage: 90, range: 2.5, attackSpeed: 0.7, cost: 35 },
        5: { emoji: '5️⃣', damage: 100, range: 2.5, attackSpeed: 0.7, cost: 35 },
        6: { emoji: '6️⃣', damage: 110, range: 2.5, attackSpeed: 0.7, cost: 35 },
        7: { emoji: '7️⃣', damage: 120, range: 2.5, attackSpeed: 0.7, cost: 40 },
        8: { emoji: '8️⃣', damage: 130, range: 2.5, attackSpeed: 0.7, cost: 40 },
        9: { emoji: '9️⃣', damage: 140, range: 3.0, attackSpeed: 0.7, cost: 40 },
        // Special tower
        'special': { emoji: '🔮', damage: 80, range: 4.0, attackSpeed: 0.3, cost: 100 }
    };
    
    /**
     * Initialize the towers module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        towers = [];
        towerId = 0;
        cellSize = options.cellSize || 55; // Default cell size
        console.log("TowersModule initialized with cellSize:", cellSize);
    }
    
    /**
     * Create a new tower
     * @param {number|string} type - Tower type
     * @param {number} row - Row index on the grid
     * @param {number} col - Column index on the grid
     * @returns {Object|null} The created tower or null if creation failed
     */
    function createTower(type, row, col) {
        console.log("TowersModule.createTower called with type:", type, "row:", row, "col:", col);
        
        const typeData = towerTypes[type];
        
        if (!typeData) {
            console.error("Invalid tower type:", type);
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower type!");
            return null;
        }
        
        // Check if player has enough currency
        const playerState = PlayerModule.getState();
        console.log("Player currency:", playerState.currency, "Tower cost:", typeData.cost);
        
        if (playerState.currency < typeData.cost) {
            console.log("Not enough currency to build tower");
            EventSystem.publish(GameEvents.STATUS_MESSAGE, `Not enough currency to build this tower! Need ${typeData.cost}`);
            return null;
        }
        
        // Check if the cell is on a fixed cell or path
        const fixedCells = SudokuModule.getFixedCells();
        const pathCells = SudokuModule.getPathCells();
        
        if (fixedCells[row][col]) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on a fixed Sudoku cell!");
            return null;
        }
        
        if (pathCells.has(`${row},${col}`)) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on the enemy path!");
            return null;
        }
        
        // For number towers, validate according to Sudoku rules
        const numberValue = parseInt(type);
        if (!isNaN(numberValue) && numberValue >= 1 && numberValue <= 9) {
            console.log("Setting cell value in Sudoku:", numberValue);
            
            // Check if this number is valid for this cell
            if (!SudokuModule.isValidMove(row, col, numberValue)) {
                // Get possible values for this cell
                const validNumbers = SudokuModule.getPossibleValues(row, col);
                if (validNumbers.length > 0) {
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                        `Cannot place ${numberValue} here. Valid options: ${validNumbers.join(', ')}`);
                } else {
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                        `No valid numbers can be placed in this cell.`);
                }
                return null;
            }
            
            // Try to set the cell value
            if (!SudokuModule.setCellValue(row, col, numberValue)) {
                console.log("SudokuModule.setCellValue returned false");
                return null;
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
            target: null
        };
        
        // Spend currency
        PlayerModule.spendCurrency(typeData.cost);
        
        // Add to towers array
        towers.push(tower);
        
        // Publish tower placed event
        EventSystem.publish(GameEvents.TOWER_PLACED, tower);
        
        return tower;
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
        SudokuModule.setCellValue(tower.row, tower.col, 0);
        
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
        
        // Parse tower number
        const towerNumber = parseInt(tower.type);
        if (isNaN(towerNumber)) {
            return null;
        }
        
        // Calculate the range of enemy numbers this tower can attack
        // A tower can attack its own number and up to 2 higher numbers
        const minTargetNumber = towerNumber;
        const maxTargetNumber = towerNumber + 2;
        
        // Filter enemies by eligible type numbers
        const matchingEnemies = enemies.filter(enemy => {
            // Convert enemy type to a number
            let enemyType = enemy.type;
            
            // If it's a string (like emoji "1️⃣"), convert to number
            if (typeof enemyType === 'string') {
                // Try to extract the first digit
                const match = enemyType.match(/\d+/);
                if (match) {
                    enemyType = parseInt(match[0]);
                } else if (enemyType === 'boss') {
                    // Special case for boss - all towers can attack the boss
                    return true;
                } else {
                    // If we can't parse a number, try direct parseInt
                    enemyType = parseInt(enemyType);
                }
            }
            
            // Check if the enemy number is within the tower's target range
            return !isNaN(enemyType) && 
                   enemyType >= minTargetNumber && 
                   enemyType <= maxTargetNumber;
        });
        
        // Find the closest eligible enemy
        return findClosestEnemy(tower, matchingEnemies);
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
        
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            // Calculate distance
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if enemy is in range and closer than current closest
            if (distance <= tower.range && distance < closestDistance) {
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
        // Calculate damage with level multiplier
        const damage = tower.damage;
        
        // Damage the enemy
        const isKilled = EnemiesModule.damageEnemy(enemy.id, damage);
        
        // Publish tower attack event
        EventSystem.publish(GameEvents.TOWER_ATTACK, {
            tower: tower,
            enemy: enemy,
            damage: damage,
            killed: isKilled
        });
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