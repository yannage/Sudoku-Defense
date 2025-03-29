/**
 * Add this to a new file called enemy-fix.js and include it after all other scripts
 * This completely overrides the enemy movement system with a corrected version
 */

(function() {
    console.log("Applying complete enemy movement fix...");
    
    // Only run if we have the required modules
    if (!window.EnemiesModule || !window.SudokuModule) {
        console.error("Required modules not found. Enemy fix not applied.");
        return;
    }
    
    // Store original functions we're going to override
    const originalMoveEnemy = EnemiesModule.moveEnemy;
    const originalUpdate = EnemiesModule.update;
    const originalCreateEnemy = EnemiesModule.createEnemy;
    
    // Override moveEnemy function with fixed version
    EnemiesModule.moveEnemy = function(enemy, deltaTime) {
        if (!enemy || !enemy.active) return;
        
        // Get the path and cell size
        const path = SudokuModule.getPathArray();
        const cellSize = this.getCellSize();
        
        if (!path || path.length === 0) {
            console.error("Path not available for enemy movement");
            return;
        }
        
        if (enemy.pathIndex >= path.length - 1) {
            // Enemy reached the end of the path
            this.enemyReachedEnd(enemy);
            return;
        }
        
        // Calculate movement speed
        const moveSpeed = enemy.speed * 50 * deltaTime;
        
        // Get current and next cells
        const currentCell = path[enemy.pathIndex];
        const nextCell = path[enemy.pathIndex + 1];
        
        if (!currentCell || !nextCell) {
            console.error("Invalid path cells:", enemy.pathIndex, path.length);
            return;
        }
        
        // Calculate cell centers correctly within board coordinates
        const currentX = currentCell[1] * cellSize + cellSize / 2;
        const currentY = currentCell[0] * cellSize + cellSize / 2;
        const nextX = nextCell[1] * cellSize + cellSize / 2;
        const nextY = nextCell[0] * cellSize + cellSize / 2;
        
        // Calculate segment distance
        const distance = Math.sqrt(
            Math.pow(nextX - currentX, 2) + 
            Math.pow(nextY - currentY, 2)
        );
        
        // Update progress along current path segment
        enemy.progress += moveSpeed / distance;
        
        // Move to next path segment if progress is complete
        if (enemy.progress >= 1) {
            enemy.pathIndex++;
            enemy.progress = 0;
            
            // Check if enemy reached the end
            if (enemy.pathIndex >= path.length - 1) {
                this.enemyReachedEnd(enemy);
                return;
            }
        }
        
        // IMPORTANT: Update position directly in board coordinates for both rendering and targeting
        // This is crucial to ensure enemies are drawn correctly and towers can target them
        const startX = currentCell[1] * cellSize + cellSize / 2;
        const startY = currentCell[0] * cellSize + cellSize / 2;
        const endX = nextCell[1] * cellSize + cellSize / 2;
        const endY = nextCell[0] * cellSize + cellSize / 2;
        
        enemy.x = startX + (endX - startX) * enemy.progress;
        enemy.y = startY + (endY - startY) * enemy.progress;
        
        // Log the first time this runs for diagnostic purposes
        if (!window._enemyFixApplied) {
            console.log("Fixed enemy movement applied:", enemy.id, enemy.x, enemy.y);
            window._enemyFixApplied = true;
        }
    };
    
    // Override createEnemy to ensure it starts with correct coordinates
    EnemiesModule.createEnemy = function(type) {
        // Get the path and cell size
        const path = SudokuModule.getPathArray();
        const cellSize = this.getCellSize();
        
        if (!path || path.length === 0) {
            console.error("Path not available for enemy creation");
            return null;
        }
        
        const startCell = path[0];
        const startX = startCell[1] * cellSize + cellSize / 2;
        const startY = startCell[0] * cellSize + cellSize / 2;
        
        // Get base enemy data
        const typeData = this.enemyTypes ? this.enemyTypes[type] : null;
        if (!typeData) {
            console.error("Invalid enemy type:", type);
            return null;
        }
        
        // Apply wave difficulty scaling
        const healthScale = 1 + (this.waveNumber - 1) * 0.2;
        
        // Create enemy with explicit coordinates
        const enemy = {
            id: `enemy_${++this.enemyId}`,
            type: type,
            emoji: typeData.emoji,
            health: typeData.health * healthScale,
            maxHealth: typeData.health * healthScale,
            speed: typeData.speed,
            reward: typeData.reward,
            points: typeData.points,
            x: startX,  // Explicit x position in board coordinates
            y: startY,  // Explicit y position in board coordinates
            pathIndex: 0,
            progress: 0,
            active: true
        };
        
        // Add to enemies array
        this.enemies.push(enemy);
        
        // Publish spawn event
        EventSystem.publish(GameEvents.ENEMY_SPAWN, enemy);
        
        console.log("Created enemy with fixed coordinates:", enemy.id, enemy.x, enemy.y);
        return enemy;
    };
    
    // Override update to use our fixed movement
    EnemiesModule.update = function(deltaTime) {
        if (!this.isWaveActive) {
            return;
        }
        
        let activeEnemies = 0;
        
        // Update each enemy
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            if (!enemy.active) {
                continue;
            }
            
            activeEnemies++;
            
            // Move enemy using our fixed function
            this.moveEnemy(enemy, deltaTime);
            
            // Publish enemy move event
            EventSystem.publish(GameEvents.ENEMY_MOVE, enemy);
        }
        
        // Check if wave is complete
        if (activeEnemies === 0 && this.enemiesRemaining === 0 && !this.spawnInterval) {
            this.waveComplete();
        }
    };
    
    // Also add a fix to the render function in game.js to ensure it uses our corrected coordinates
    if (window.Game && typeof Game.renderEnemies === 'function') {
        const originalRenderEnemies = Game.renderEnemies;
        
        Game.renderEnemies = function() {
            // Get all enemies
            const enemies = EnemiesModule.getEnemies();
            
            // Get or create enemy container
            let enemyContainer = document.getElementById('enemy-container');
            
            if (!enemyContainer) {
                enemyContainer = document.createElement('div');
                enemyContainer.id = 'enemy-container';
                enemyContainer.style.position = 'absolute';
                enemyContainer.style.top = '0';
                enemyContainer.style.left = '0';
                enemyContainer.style.width = '100%';
                enemyContainer.style.height = '100%';
                enemyContainer.style.pointerEvents = 'none';
                boardElement.appendChild(enemyContainer);
            }
            
            // Update existing enemy elements and create new ones as needed
            enemies.forEach(enemy => {
                let enemyElement = document.getElementById(enemy.id);
                
                if (!enemyElement) {
                    // Create new enemy element
                    enemyElement = document.createElement('div');
                    enemyElement.id = enemy.id;
                    enemyElement.className = 'enemy';
                    enemyElement.textContent = enemy.emoji;
                    enemyContainer.appendChild(enemyElement);
                    
                    // Create health bar
                    const healthBar = document.createElement('div');
                    healthBar.className = 'enemy-health-bar';
                    healthBar.style.position = 'absolute';
                    healthBar.style.bottom = '-8px';
                    healthBar.style.left = '0';
                    healthBar.style.width = '100%';
                    healthBar.style.height = '4px';
                    healthBar.style.backgroundColor = '#333';
                    
                    const healthFill = document.createElement('div');
                    healthFill.className = 'enemy-health-fill';
                    healthFill.style.width = '100%';
                    healthFill.style.height = '100%';
                    healthFill.style.backgroundColor = '#ff0000';
                    
                    healthBar.appendChild(healthFill);
                    enemyElement.appendChild(healthBar);
                }
                
                // DIRECT POSITION APPROACH: Always use the fixed coordinates from our movement system
                if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    enemyElement.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
                }
                
                // Update health bar
                const healthFill = enemyElement.querySelector('.enemy-health-fill');
                if (healthFill) {
                    const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                    healthFill.style.width = `${healthPercent}%`;
                }
            });
            
            // Remove enemy elements for defeated enemies
            const enemyElements = enemyContainer.getElementsByClassName('enemy');
            
            for (let i = enemyElements.length - 1; i >= 0; i--) {
                const element = enemyElements[i];
                const enemyId = element.id;
                
                if (!enemies.find(e => e.id === enemyId)) {
                    element.remove();
                }
            }
        };
        
        console.log("Render enemies function patched");
    }
    
    // Add a fix to the tower attack calculations
    if (window.TowerAnimationsModule) {
        // If the module exists, add a patch to the position calculation
        const calculateEnemyPositionPatch = function(originalFunction) {
            return function(enemy) {
                // Always use the direct coordinates from our fixed system first
                if (enemy && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    return { x: enemy.x, y: enemy.y };
                }
                
                // Fall back to the original function if needed
                return originalFunction.apply(this, arguments);
            };
        };
        
        // Try to patch the calculation function if it exists
        if (typeof TowerAnimationsModule.calculateEnemyPosition === 'function') {
            const original = TowerAnimationsModule.calculateEnemyPosition;
            TowerAnimationsModule.calculateEnemyPosition = calculateEnemyPositionPatch(original);
            console.log("Tower target calculation patched");
        }
    }
    
    console.log("Complete enemy movement fix applied successfully");
})();