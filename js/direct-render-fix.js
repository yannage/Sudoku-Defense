/**
 * direct-render-fix.js - Completely replaces enemy rendering with a direct approach
 * Add as a new file and include after all other scripts
 */

(function() {
    console.log("Implementing direct enemy rendering system...");
    
    // Get required elements and dimensions
    const boardElement = document.getElementById('sudoku-board');
    if (!boardElement) {
        console.error("Board element not found, cannot apply fix");
        return;
    }
    
    // Calculate cell size from the board
    const boardWidth = boardElement.clientWidth;
    const cellSize = boardWidth / 9;
    console.log(`Board width: ${boardWidth}px, cell size: ${cellSize}px`);
    
    // Create our own container for rendering enemies
    let ourContainer = document.createElement('div');
    ourContainer.id = 'direct-render-container';
    ourContainer.style.position = 'absolute';
    ourContainer.style.top = '0';
    ourContainer.style.left = '0';
    ourContainer.style.width = '100%';
    ourContainer.style.height = '100%';
    ourContainer.style.pointerEvents = 'none';
    ourContainer.style.zIndex = '50';
    boardElement.appendChild(ourContainer);
    
    // Create a container for projectiles
    let projectileContainer = document.createElement('div');
    projectileContainer.id = 'direct-projectile-container';
    projectileContainer.style.position = 'absolute';
    projectileContainer.style.top = '0';
    projectileContainer.style.left = '0';
    projectileContainer.style.width = '100%';
    projectileContainer.style.height = '100%';
    projectileContainer.style.pointerEvents = 'none';
    projectileContainer.style.zIndex = '60';
    boardElement.appendChild(projectileContainer);
    
    // Track all rendered enemies
    const renderedEnemies = {};
    
    // Track all projectiles
    const projectiles = [];
    let nextProjectileId = 0;
    
    // Main render function that runs continuously
    function renderLoop() {
        if (!window.EnemiesModule || typeof EnemiesModule.getEnemies !== 'function') {
            requestAnimationFrame(renderLoop);
            return;
        }
        
        try {
            // Get current enemies
            const enemies = EnemiesModule.getEnemies();
            if (!enemies) {
                requestAnimationFrame(renderLoop);
                return;
            }
            
            // Get path data to calculate positions
            let path;
            if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                path = SudokuModule.getPathArray();
            }
            
            // Render each enemy
            enemies.forEach(enemy => {
                if (!enemy.active) {
                    // Remove inactive enemies
                    if (renderedEnemies[enemy.id]) {
                        renderedEnemies[enemy.id].element.remove();
                        delete renderedEnemies[enemy.id];
                    }
                    return;
                }
                
                // Calculate enemy position
                let x, y;
                
                // Method 1: Use enemy.x and enemy.y if available
                if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    // Check if values are too large (could be using a different scale)
                    if (enemy.x > boardWidth * 1.5 || enemy.y > boardWidth * 1.5) {
                        // Scale down oversized coordinates - this happens in some versions
                        const scale = 0.12; // Experimental scaling factor
                        x = enemy.x * scale;
                        y = enemy.y * scale;
                    } else {
                        // Use coordinates directly
                        x = enemy.x;
                        y = enemy.y;
                    }
                }
                // Method 2: Calculate from path and pathIndex
                else if (path && path.length > 0 && typeof enemy.pathIndex === 'number') {
                    const currentCell = path[Math.min(enemy.pathIndex, path.length - 1)];
                    const nextCell = path[Math.min(enemy.pathIndex + 1, path.length - 1)];
                    
                    const startX = currentCell[1] * cellSize + cellSize / 2;
                    const startY = currentCell[0] * cellSize + cellSize / 2;
                    const endX = nextCell[1] * cellSize + cellSize / 2;
                    const endY = nextCell[0] * cellSize + cellSize / 2;
                    
                    const progress = typeof enemy.progress === 'number' ? enemy.progress : 0;
                    x = startX + (endX - startX) * progress;
                    y = startY + (endY - startY) * progress;
                    
                    // Update the enemy object for tower targeting
                    enemy.x = x;
                    enemy.y = y;
                }
                // Method 3: Fallback - use cell in first column
                else {
                    // Place along the first column at different rows based on ID
                    const idNum = parseInt(enemy.id.replace(/\D/g, '')) || 0;
                    x = cellSize / 2;
                    y = (1 + (idNum % 9)) * cellSize / 2;
                }
                
                // Render or update enemy
                if (!renderedEnemies[enemy.id]) {
                    // Create new enemy element
// Create new enemy element
const element = document.createElement('div');
element.id = `direct-enemy-${enemy.id}`;
element.className = 'direct-enemy';
element.textContent = enemy.emoji;
element.style.position = 'absolute';
element.style.transform = `translate(-50%, -50%)`;
element.style.fontSize = `${cellSize * 0.4}px`; // Reduced size
element.style.zIndex = '50';
element.style.lineHeight = '1'; // Prevent extra vertical space
element.style.display = 'flex'; // Better emoji centering
element.style.justifyContent = 'center';
element.style.alignItems = 'center';
element.style.width = `${cellSize * 0.8}px`; // Control width
element.style.height = `${cellSize * 0.8}px`; // Control height

// Create health bar
const healthBar = document.createElement('div');
healthBar.className = 'direct-enemy-health';
healthBar.style.position = 'absolute';
healthBar.style.bottom = '-6px'; // Moved slightly closer
healthBar.style.left = '-10px';
healthBar.style.width = '20px';
healthBar.style.height = '3px'; // Slightly smaller
healthBar.style.backgroundColor = '#333';
healthBar.style.borderRadius = '2px';

const healthFill = document.createElement('div');
healthFill.className = 'direct-enemy-health-fill';
healthFill.style.height = '100%';
healthFill.style.backgroundColor = '#ff0000';
healthFill.style.width = '100%';

healthBar.appendChild(healthFill);
element.appendChild(healthBar);

ourContainer.appendChild(element);

// Store rendered enemy
renderedEnemies[enemy.id] = {
    element: element,
    healthFill: healthFill
};
                
                // Update position
                const rendered = renderedEnemies[enemy.id];
                rendered.element.style.left = `${x}px`;
                rendered.element.style.top = `${y}px`;
                
                // Update health bar
                if (rendered.healthFill) {
                    const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                    rendered.healthFill.style.width = `${healthPercent}%`;
                }
            });
            
            // Remove any rendered enemies that are no longer in the enemies array
            Object.keys(renderedEnemies).forEach(id => {
                if (!enemies.find(e => e.id === id)) {
                    renderedEnemies[id].element.remove();
                    delete renderedEnemies[id];
                }
            });
            
            // Update projectiles
            updateProjectiles();
        } catch (err) {
            console.error("Error in direct render loop:", err);
        }
        
        // Continue loop
        requestAnimationFrame(renderLoop);
    }
    
    // Create a projectile
    function createProjectile(tower, enemy) {
        if (!tower || !enemy) return null;
        
        // Calculate positions
        let towerX, towerY, enemyX, enemyY;
        
        // Get tower position
        towerX = (tower.col + 0.5) * cellSize;
        towerY = (tower.row + 0.5) * cellSize;
        
        // Get enemy position
        if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
            // Use directly if they seem to be in the board range
            if (enemy.x <= boardWidth * 1.5 && enemy.y <= boardWidth * 1.5) {
                enemyX = enemy.x;
                enemyY = enemy.y;
            } else {
                // Scale down large coordinates
                enemyX = enemy.x * 0.12; // Same scaling factor as for enemies
                enemyY = enemy.y * 0.12;
            }
        } else {
            // Try to get from rendered enemy
            const rendered = renderedEnemies[enemy.id];
            if (rendered && rendered.element) {
                const style = window.getComputedStyle(rendered.element);
                enemyX = parseFloat(style.left);
                enemyY = parseFloat(style.top);
            } else {
                // Can't determine position
                return null;
            }
        }
        
        // Create projectile element
        const element = document.createElement('div');
        element.className = 'direct-projectile';
        element.style.position = 'absolute';
        element.style.width = '8px';
        element.style.height = '8px';
        element.style.borderRadius = '50%';
        element.style.backgroundColor = '#000';
        element.style.zIndex = '60';
        element.style.left = `${towerX}px`;
        element.style.top = `${towerY}px`;
        element.style.transform = 'translate(-50%, -50%)';
        
        projectileContainer.appendChild(element);
        
        // Create projectile object
        const projectile = {
            id: `projectile-${nextProjectileId++}`,
            element: element,
            startX: towerX,
            startY: towerY,
            endX: enemyX,
            endY: enemyY,
            progress: 0
        };
        
        projectiles.push(projectile);
        return projectile;
    }
    
    // Update all projectiles
    function updateProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Increment progress
            projectile.progress += 0.05;
            
            // Remove completed projectiles
            if (projectile.progress >= 1) {
                projectile.element.remove();
                projectiles.splice(i, 1);
                continue;
            }
            
            // Update position
            const x = projectile.startX + (projectile.endX - projectile.startX) * projectile.progress;
            const y = projectile.startY + (projectile.endY - projectile.startY) * projectile.progress;
            
            projectile.element.style.left = `${x}px`;
            projectile.element.style.top = `${y}px`;
        }
    }
    
    // Intercept tower attack events to create projectiles
    function setupAttackInterception() {
        // Try to intercept at the event system level
        if (window.EventSystem && typeof EventSystem.publish === 'function') {
            const originalPublish = EventSystem.publish;
            
            EventSystem.publish = function(eventName, data) {
                // Intercept tower attack events
                if (eventName === GameEvents.TOWER_ATTACK && data && data.tower && data.enemy) {
                    createProjectile(data.tower, data.enemy);
                }
                
                // Call original function
                return originalPublish.call(this, eventName, data);
            };
            
            console.log("Tower attack event interception enabled");
        }
    }
    
    // Add CSS for our elements
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .direct-enemy {
                pointer-events: none;
                transition: left 0.1s linear, top 0.1s linear;
            }
            
            .direct-projectile {
                pointer-events: none;
                transition: left 0.05s linear, top 0.05s linear;
                box-shadow: 0 0 3px white;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Hide any existing enemy container to avoid duplicates
    function hideExistingEnemies() {
        // Try to find and hide the original enemy container
        const existingContainer = document.getElementById('enemy-container');
        if (existingContainer) {
            existingContainer.style.opacity = '0';
            existingContainer.style.visibility = 'hidden';
        }
        
        // Also hide any existing projectile container
        const existingProjectiles = document.getElementById('projectile-container');
        if (existingProjectiles) {
            existingProjectiles.style.opacity = '0';
            existingProjectiles.style.visibility = 'hidden';
        }
    }
    
    // Override enemy position calculation in tower animations if possible
    function patchTowerTargeting() {
        if (window.TowerAnimationsModule && typeof TowerAnimationsModule.calculateEnemyPosition === 'function') {
            const originalCalc = TowerAnimationsModule.calculateEnemyPosition;
            
            TowerAnimationsModule.calculateEnemyPosition = function(enemy) {
                // Use rendered position if available
                if (enemy && renderedEnemies[enemy.id]) {
                    const element = renderedEnemies[enemy.id].element;
                    const left = parseFloat(element.style.left);
                    const top = parseFloat(element.style.top);
                    
                    if (!isNaN(left) && !isNaN(top)) {
                        return { x: left, y: top };
                    }
                }
                
                // If we have enemy's x,y but they're too large, scale them
                if (enemy && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    if (enemy.x > boardWidth * 1.5 || enemy.y > boardWidth * 1.5) {
                        return { 
                            x: enemy.x * 0.12, 
                            y: enemy.y * 0.12 
                        };
                    }
                }
                
                // Fall back to original function
                return originalCalc.call(this, enemy);
            };
            
            console.log("Tower targeting patched to use rendered positions");
        }
    }
    
    // Initialize everything
    function init() {
        addStyles();
        hideExistingEnemies();
        setupAttackInterception();
        patchTowerTargeting();
        
        // Start render loop
        requestAnimationFrame(renderLoop);
        
        console.log("Direct rendering system initialized");
    }
    
    // Start everything
    init();
})();