
/**
 * towers.js - Handles tower placement, upgrades, and attacks
 * This module creates and manages tower entities for the tower defense game
 */

const TowersModule = (function() {
    // Private variables
    let towers = [];
    let towerId = 0;
    let cellSize = 0;
    
    // Tower types with their properties
    const towerTypes = {
    // Number towers (1-9) with BOOSTED damage values
    1: { emoji: '1️⃣', damage: 40, range: 2, attackSpeed: 0.8, cost: 50 },  // Was 20 damage, 1.0 speed
    2: { emoji: '2️⃣', damage: 50, range: 2, attackSpeed: 0.8, cost: 50 },  // Was 25 damage, 1.0 speed
    3: { emoji: '3️⃣', damage: 60, range: 2, attackSpeed: 0.8, cost: 50 },  // Was 30 damage, 1.0 speed
    4: { emoji: '4️⃣', damage: 70, range: 2, attackSpeed: 0.8, cost: 50 },  // Was 35 damage, 1.0 speed
    5: { emoji: '5️⃣', damage: 80, range: 2, attackSpeed: 0.8, cost: 50 },  // Was 40 damage, 1.0 speed
    6: { emoji: '6️⃣', damage: 90, range: 2, attackSpeed: 0.8, cost: 50 },  // Was 45 damage, 1.0 speed
    7: { emoji: '7️⃣', damage: 100, range: 2, attackSpeed: 0.8, cost: 50 }, // Was 50 damage, 1.0 speed
    8: { emoji: '8️⃣', damage: 110, range: 2, attackSpeed: 0.8, cost: 50 }, // Was 55 damage, 1.0 speed
    9: { emoji: '9️⃣', damage: 120, range: 2.5, attackSpeed: 0.8, cost: 50 }, // Was 60 damage, 1.0 speed
    // Special tower with BOOSTED stats
    'special': { emoji: '🔮', damage: 60, range: 3.5, attackSpeed: 0.4, cost: 150 } // Was 30 damage, 0.5 speed
};
    
    /**
     * Initialize the towers module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        towers = [];
        towerId = 0;
        cellSize = options.cellSize || 55; // Default cell size
    }
    
    /**
     * Create a new tower
     * @param {number|string} type - Tower type
     * @param {number} row - Row index on the grid
     * @param {number} col - Column index on the grid
     * @returns {Object|null} The created tower or null if creation failed
     */
    function createTower(type, row, col) {
        const typeData = towerTypes[type];
        
        if (!typeData) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower type!");
            return null;
        }
        
        // Check if player has enough currency
        const playerState = PlayerModule.getState();
        if (playerState.currency < typeData.cost) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, `Not enough currency to build this tower! Need ${typeData.cost}`);
            return null;
        }
        
        // Place the number in the Sudoku grid
        const numberValue = parseInt(type);
        if (!isNaN(numberValue) && numberValue >= 1 && numberValue <= 9) {
            if (!SudokuModule.setCellValue(row, col, numberValue)) {
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
            const target = function findTarget(tower, enemies) {
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
    
    console.log(`Tower ${towerNumber} targeting enemies ${minTargetNumber}-${maxTargetNumber}`);
    
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
    
    // If debugging, log how many eligible targets we found
    if (matchingEnemies.length > 0) {
        console.log(`Tower ${towerNumber} found ${matchingEnemies.length} eligible targets`);
    }
    
    // Find the closest eligible enemy
    return findClosestEnemy(tower, matchingEnemies);
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
        
        // Number towers attack enemies with matching numbers
        const towerNumber = parseInt(tower.type);
        if (isNaN(towerNumber)) {
            return null;
        }
        
        // Filter enemies by type
        const matchingEnemies = enemies.filter(enemy => {
            const enemyNumber = parseInt(enemy.type);
            return !isNaN(enemyNumber) && enemyNumber === towerNumber;
        });
        
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