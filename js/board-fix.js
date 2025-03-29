/**
 * board-fix.js - Fixes both board integrity issues and enemy positioning
 * Add this as a new file and include it after all other scripts
 */

(function() {
    console.log("Applying comprehensive board and enemy fix...");
    
    // Fix board integrity issues
    function fixBoardIntegrity() {
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) {
            console.error("Board element not found!");
            return;
        }
        
        // Check if we have all required cells
        let missingCells = false;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
                if (!cell) {
                    console.warn(`Missing cell at row ${row}, col ${col}, will create it`);
                    missingCells = true;
                    
                    // Create the missing cell
                    const newCell = document.createElement('div');
                    newCell.className = 'sudoku-cell';
                    newCell.dataset.row = row;
                    newCell.dataset.col = col;
                    
                    // Add click event handler
                    newCell.addEventListener('click', function() {
                        if (window.Game && typeof Game.handleCellClick === 'function') {
                            Game.handleCellClick(row, col);
                        }
                    });
                    
                    // Append to board
                    boardElement.appendChild(newCell);
                }
            }
        }
        
        if (missingCells) {
            console.log("Created missing cells in the board");
            
            // Force board update
            if (window.Game && typeof Game.updateBoard === 'function') {
                console.log("Forcing board update after cell creation");
                Game.updateBoard();
            }
        }
        
        return !missingCells;
    }
    
    // Fix enemy movement system
    function fixEnemyMovement() {
        if (!window.EnemiesModule) {
            console.error("EnemiesModule not found, cannot fix enemy movement");
            return false;
        }
        
        // Calculate proper cell size directly from the board
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) return false;
        
        const cellSize = boardElement.clientWidth / 9;
        console.log(`Using cell size: ${cellSize}px for enemy movement`);
        
        // Store cell size in the module
        EnemiesModule.setCellSize(cellSize);
        
        // Override the moveEnemy function
        const originalMoveEnemy = EnemiesModule.moveEnemy;
        EnemiesModule.moveEnemy = function(enemy, deltaTime) {
            // We'll reimplement this entirely to be safe
            if (!enemy || !enemy.active) return;
            
            // Get the path
            const path = SudokuModule.getPathArray();
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
                console.error("Invalid path cells for enemy:", enemy.id);
                return;
            }
            
            // Calculate cell centers
            const currentX = currentCell[1] * cellSize + cellSize / 2;
            const currentY = currentCell[0] * cellSize + cellSize / 2;
            const nextX = nextCell[1] * cellSize + cellSize / 2;
            const nextY = nextCell[0] * cellSize + cellSize / 2;
            
            // Calculate distance
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
            
            // Directly calculate and set x,y coordinates
            // These are used for both rendering and targeting
            enemy.x = currentX + (nextX - currentX) * enemy.progress;
            enemy.y = currentY + (nextY - currentY) * enemy.progress;
        };
        
        // Make sure enemies have correct coordinates from creation
        const originalCreateEnemy = EnemiesModule.createEnemy;
        EnemiesModule.createEnemy = function(type) {
            const path = SudokuModule.getPathArray();
            if (!path || path.length === 0) {
                console.error("Path not available for enemy creation");
                return null;
            }
            
            // Call original function to create enemy
            const enemy = originalCreateEnemy.call(this, type);
            
            if (enemy) {
                // Explicitly set x,y based on path start
                const startCell = path[0];
                enemy.x = startCell[1] * cellSize + cellSize / 2;
                enemy.y = startCell[0] * cellSize + cellSize / 2;
                
                console.log(`Created enemy with fixed coordinates: (${enemy.x}, ${enemy.y})`);
            }
            
            return enemy;
        };
        
        console.log("Enemy movement system fixed");
        return true;
    }
    
    // Fix rendering system
    function fixRenderingSystem() {
        if (!window.Game || typeof Game.renderEnemies !== 'function') {
            console.error("Game.renderEnemies not found, cannot fix rendering");
            return false;
        }
        
        // Override the renderEnemies function
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
                
                const boardElement = document.getElementById('sudoku-board');
                if (boardElement) {
                    boardElement.appendChild(enemyContainer);
                } else {
                    document.body.appendChild(enemyContainer);
                    console.error("Board element not found for enemyContainer attachment");
                }
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
                
                // Apply position - use translate for performance and to match the original game's approach
                // This is the critical part - using enemy.x and enemy.y directly with no assumptions
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
        
        console.log("Rendering system fixed");
        return true;
    }
    
    // Fix tower targeting
    function fixTowerTargeting() {
        // Override calculateEnemyPosition in TowerAnimationsModule if it exists
        if (window.TowerAnimationsModule && typeof TowerAnimationsModule.calculateEnemyPosition === 'function') {
            const originalCalculateEnemyPosition = TowerAnimationsModule.calculateEnemyPosition;
            
            TowerAnimationsModule.calculateEnemyPosition = function(enemy) {
                // Just directly use the enemy's x,y coordinates that we've carefully ensured are correct
                if (enemy && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    return { x: enemy.x, y: enemy.y };
                }
                
                // Fall back to original function
                return originalCalculateEnemyPosition.call(this, enemy);
            };
            
            console.log("Tower targeting fixed");
            return true;
        }
        
        return false;
    }
    
    // Apply all fixes
    function applyAllFixes() {
        // Fix missing board cells first
        const boardFixed = fixBoardIntegrity();
        
        // Fix enemy movement
        const enemyFixed = fixEnemyMovement();
        
        // Fix rendering
        const renderingFixed = fixRenderingSystem();
        
        // Fix tower targeting
        const targetingFixed = fixTowerTargeting();
        
        console.log(`Fix status: Board=${boardFixed}, Enemy=${enemyFixed}, Rendering=${renderingFixed}, Targeting=${targetingFixed}`);
        
        // Show a notification if everything was fixed
        if (boardFixed && enemyFixed && renderingFixed && targetingFixed) {
            // Create a notification
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '10px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.background = '#4CAF50';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '9999';
            notification.textContent = 'Game fixed! Reload if issues persist.';
            
            document.body.appendChild(notification);
            
            // Remove after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit to ensure all modules are initialized
        setTimeout(applyAllFixes, 500);
    });
    
    // Also try to apply fixes immediately if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(applyAllFixes, 100);
    }
})();