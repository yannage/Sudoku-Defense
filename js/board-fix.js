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
            return false;
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
                        // Find any click handler we can use
                        if (window.Game && typeof Game.handleCellClick === 'function') {
                            Game.handleCellClick(row, col);
                        } else if (window.SudokuModule && typeof SudokuModule.setCellValue === 'function') {
                            // Try direct action if no handler found
                            SudokuModule.setCellValue(row, col, 0);
                        }
                    });
                    
                    // Append to board
                    boardElement.appendChild(newCell);
                }
            }
        }
        
        if (missingCells) {
            console.log("Created missing cells in the board");
            
            // Try to force board update in any way available
            if (window.Game) {
                // Try all possible update methods
                if (typeof Game.updateBoard === 'function') {
                    Game.updateBoard();
                } else if (typeof Game.update === 'function') {
                    Game.update(0);
                }
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
        if (typeof EnemiesModule.setCellSize === 'function') {
            EnemiesModule.setCellSize(cellSize);
        }
        
        // Create a projectile container if it doesn't exist
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
            projectileContainer.style.zIndex = '9999';
            boardElement.appendChild(projectileContainer);
            console.log("Created missing projectile container");
        }
        
        // Override the moveEnemy function
        const originalMoveEnemy = EnemiesModule.moveEnemy;
        EnemiesModule.moveEnemy = function(enemy, deltaTime) {
            // We'll reimplement this entirely to be safe
            if (!enemy || !enemy.active) return;
            
            // Get the path
            let path;
            if (typeof SudokuModule.getPathArray === 'function') {
                path = SudokuModule.getPathArray();
            } else if (this.path) {
                path = this.path;
            }
            
            if (!path || path.length === 0) {
                console.error("Path not available for enemy movement");
                return;
            }
            
            if (enemy.pathIndex >= path.length - 1) {
                // Enemy reached the end of the path
                if (typeof this.enemyReachedEnd === 'function') {
                    this.enemyReachedEnd(enemy);
                } else {
                    // If function isn't available, just mark as inactive
                    enemy.active = false;
                }
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
                    if (typeof this.enemyReachedEnd === 'function') {
                        this.enemyReachedEnd(enemy);
                    } else {
                        // If function isn't available, just mark as inactive
                        enemy.active = false;
                    }
                    return;
                }
            }
            
            // Directly calculate and set x,y coordinates
            // These are used for both rendering and targeting
            enemy.x = currentX + (nextX - currentX) * enemy.progress;
            enemy.y = currentY + (nextY - currentY) * enemy.progress;
        };
        
        // Create an enemy observer that watches for enemy elements and fixes them
        function setupEnemyObserver() {
            // Function to update enemy element position
            function updateEnemyElement(enemyElement) {
                const enemyId = enemyElement.id;
                if (!enemyId) return;
                
                // Find corresponding enemy object
                const enemies = EnemiesModule.getEnemies();
                const enemy = enemies.find(e => e.id === enemyId);
                
                if (enemy && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    // Directly set position
                    enemyElement.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
                }
            }
            
            // Set up mutation observer to watch for new enemy elements
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach(function(node) {
                            // Check if it's an enemy element
                            if (node.nodeType === 1 && node.classList && node.classList.contains('enemy')) {
                                updateEnemyElement(node);
                            }
                        });
                    }
                });
            });
            
            // Start observing the whole document for enemy elements
            observer.observe(document.body, { 
                childList: true, 
                subtree: true 
            });
            
            console.log("Enemy element observer set up");
            
            // Also periodically check for existing enemies
            setInterval(function() {
                document.querySelectorAll('.enemy').forEach(updateEnemyElement);
            }, 100);
        }
        
        // Set up the observer
        setupEnemyObserver();
        
        console.log("Enemy movement system fixed");
        return true;
    }
    
    // Fix tower targeting
    function fixTowerTargeting() {
        // Override calculateEnemyPosition in TowerAnimationsModule if it exists
        if (window.TowerAnimationsModule) {
            // Try to find the position calculation function
            if (typeof TowerAnimationsModule.calculateEnemyPosition === 'function') {
                const originalCalculateEnemyPosition = TowerAnimationsModule.calculateEnemyPosition;
                
                TowerAnimationsModule.calculateEnemyPosition = function(enemy) {
                    // Direct use of enemy's x,y coordinates
                    if (enemy && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                        return { x: enemy.x, y: enemy.y };
                    }
                    
                    // Fall back to original function
                    return originalCalculateEnemyPosition.call(this, enemy);
                };
                
                console.log("Tower targeting fixed");
                return true;
            }
        }
        
        return false;
    }
    
    // Add a completely new direct projectile rendering system
    function setupProjectileSystem() {
        // Create a standalone projectile handler that doesn't rely on existing code
        window.ProjectileSystem = {
            projectiles: [],
            nextId: 0,
            
            // Create a projectile from tower to enemy
            createProjectile: function(tower, enemy) {
                if (!tower || !enemy) return;
                
                const boardElement = document.getElementById('sudoku-board');
                if (!boardElement) return;
                
                // Get cell size for coordinates
                const cellSize = boardElement.clientWidth / 9;
                
                // Calculate tower position
                const towerX = (tower.col + 0.5) * cellSize;
                const towerY = (tower.row + 0.5) * cellSize;
                
                // Use enemy position directly if available
                let enemyX, enemyY;
                if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    enemyX = enemy.x;
                    enemyY = enemy.y;
                } else {
                    // Calculate from path if needed
                    const path = SudokuModule.getPathArray();
                    if (path && path.length > 0 && typeof enemy.pathIndex === 'number') {
                        const currentCell = path[enemy.pathIndex];
                        const nextCell = path[Math.min(enemy.pathIndex + 1, path.length - 1)];
                        
                        const startX = currentCell[1] * cellSize + cellSize / 2;
                        const startY = currentCell[0] * cellSize + cellSize / 2;
                        const endX = nextCell[1] * cellSize + cellSize / 2;
                        const endY = nextCell[0] * cellSize + cellSize / 2;
                        
                        enemyX = startX + (endX - startX) * (enemy.progress || 0);
                        enemyY = startY + (endY - startY) * (enemy.progress || 0);
                    } else {
                        return; // Can't determine enemy position
                    }
                }
                
                // Create projectile object
                const projectile = {
                    id: 'direct-projectile-' + (this.nextId++),
                    startX: towerX,
                    startY: towerY,
                    endX: enemyX,
                    endY: enemyY,
                    progress: 0,
                    element: null
                };
                
                // Create DOM element
                let container = document.getElementById('projectile-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'projectile-container';
                    container.style.position = 'absolute';
                    container.style.top = '0';
                    container.style.left = '0';
                    container.style.width = '100%';
                    container.style.height = '100%';
                    container.style.pointerEvents = 'none';
                    container.style.zIndex = '9999';
                    boardElement.appendChild(container);
                }
                
                const element = document.createElement('div');
                element.id = projectile.id;
                element.className = 'direct-projectile';
                element.style.position = 'absolute';
                element.style.width = '8px';
                element.style.height = '8px';
                element.style.backgroundColor = '#000';
                element.style.borderRadius = '50%';
                element.style.transform = `translate(${towerX}px, ${towerY}px)`;
                element.style.zIndex = '9999';
                
                container.appendChild(element);
                projectile.element = element;
                
                // Add to active projectiles
                this.projectiles.push(projectile);
                
                return projectile;
            },
            
            // Update all projectiles
            update: function(deltaTime) {
                for (let i = this.projectiles.length - 1; i >= 0; i--) {
                    const projectile = this.projectiles[i];
                    
                    // Update progress
                    projectile.progress += deltaTime * 3; // Speed factor
                    
                    if (projectile.progress >= 1) {
                        // Remove projectile
                        if (projectile.element) {
                            projectile.element.remove();
                        }
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                    
                    // Update position
                    if (projectile.element) {
                        const x = projectile.startX + (projectile.endX - projectile.startX) * projectile.progress;
                        const y = projectile.startY + (projectile.endY - projectile.startY) * projectile.progress;
                        projectile.element.style.transform = `translate(${x}px, ${y}px)`;
                    }
                }
            }
        };
        
        // Hook into tower attack events
        EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
            if (data && data.tower && data.enemy) {
                ProjectileSystem.createProjectile(data.tower, data.enemy);
            }
        });
        
        // Set up update loop
        let lastTime = 0;
        function updateLoop(timestamp) {
            const deltaTime = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
            
            ProjectileSystem.update(deltaTime);
            
            requestAnimationFrame(updateLoop);
        }
        
        requestAnimationFrame(updateLoop);
        
        console.log("Direct projectile system set up");
        return true;
    }
    
    // Apply all fixes
    function applyAllFixes() {
        // Fix missing board cells first
        const boardFixed = fixBoardIntegrity();
        
        // Fix enemy movement
        const enemyFixed = fixEnemyMovement();
        
        // Fix tower targeting
        const targetingFixed = fixTowerTargeting();
        
        // Add standalone projectile system
        const projectileSystemAdded = setupProjectileSystem();
        
        console.log(`Fix status: Board=${boardFixed}, Enemy=${enemyFixed}, Targeting=${targetingFixed}, ProjectileSystem=${projectileSystemAdded}`);
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