/**
 * first-wave-fix.js - Direct fix for first wave projectile rendering issues
 * Add this as a new file and include it in your HTML after all other scripts
 */

(function() {
    console.log("Applying first wave projectile fix...");
    
    // Wait for all modules to load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(applyFixes, 500);
    });
    
    function applyFixes() {
        // 1. Directly modify the tower attack event handling
        const originalPublish = EventSystem.publish;
        EventSystem.publish = function(eventName, data) {
            // Intercept tower attack events
            if (eventName === GameEvents.TOWER_ATTACK) {
                // Ensure we have valid tower and enemy
                if (data && data.tower && data.enemy) {
                    // Ensure enemy has proper position data
                    ensureEnemyPosition(data.enemy);
                    
                    // Create a direct projectile visualization
                    createDirectProjectile(data.tower, data.enemy);
                }
            }
            
            // Call original publish for normal event flow
            return originalPublish.call(this, eventName, data);
        };
        
        console.log("Tower attack event interception enabled");
    }
    
    // Ensure enemy object has x,y position coordinates
    function ensureEnemyPosition(enemy) {
        // Skip if enemy already has position or is inactive
        if (!enemy || enemy.active === false) {
            return;
        }
        
        // If enemy already has valid coordinates, keep them
        if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
            console.log(`Enemy ${enemy.id} already has position: x=${enemy.x}, y=${enemy.y}`);
            return;
        }
        
        try {
            // Get board and calculate cell size
            const boardElement = document.getElementById('sudoku-board');
            if (!boardElement) {
                console.error("Board element not found");
                return;
            }
            
            const cellSize = boardElement.clientWidth / 9;
            console.log(`Using cell size: ${cellSize}`);
            
            // METHOD 1: Use pathIndex and progress if available
            if (typeof enemy.pathIndex === 'number' && enemy.pathIndex >= 0) {
                console.log(`Trying to calculate position using pathIndex=${enemy.pathIndex}`);
                
                // Try to get path data
                let path;
                if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                    path = SudokuModule.getPathArray();
                    console.log(`Got path with ${path.length} cells`);
                } else if (window.EnemiesModule && EnemiesModule.path) {
                    path = EnemiesModule.path;
                    console.log(`Got path from EnemiesModule with ${path.length} cells`);
                }
                
                // If we have valid path data
                if (path && path.length > 0) {
                    let currentCell, nextCell;
                    
                    // Handle edge case where enemy is at last path index
                    if (enemy.pathIndex >= path.length - 1) {
                        currentCell = path[path.length - 2] || path[0];
                        nextCell = path[path.length - 1] || path[path.length - 2] || path[0];
                    } else {
                        currentCell = path[enemy.pathIndex];
                        nextCell = path[Math.min(enemy.pathIndex + 1, path.length - 1)];
                    }
                    
                    if (currentCell && nextCell) {
                        // Calculate current and next cell centers
                        const currentX = currentCell[1] * cellSize + cellSize / 2;
                        const currentY = currentCell[0] * cellSize + cellSize / 2;
                        const nextX = nextCell[1] * cellSize + cellSize / 2;
                        const nextY = nextCell[0] * cellSize + cellSize / 2;
                        
                        // Interpolate position based on progress (default to 0 if not set)
                        const progress = typeof enemy.progress === 'number' ? enemy.progress : 0;
                        enemy.x = currentX + (nextX - currentX) * progress;
                        enemy.y = currentY + (nextY - currentY) * progress;
                        
                        console.log(`Set position from path: x=${enemy.x}, y=${enemy.y}`);
                        return;
                    }
                }
            }
            
            // METHOD 2: Use row/col if available
            if (typeof enemy.row === 'number' && typeof enemy.col === 'number') {
                console.log(`Calculating position from row=${enemy.row}, col=${enemy.col}`);
                
                // Calculate position based on grid coordinates
                enemy.x = (enemy.col + 0.5) * cellSize;
                enemy.y = (enemy.row + 0.5) * cellSize;
                
                console.log(`Set position from row/col: x=${enemy.x}, y=${enemy.y}`);
                return;
            }
            
            // METHOD 3: Try to find the enemy in the DOM and get its position
            const enemyElements = document.getElementsByClassName('enemy');
            for (let i = 0; i < enemyElements.length; i++) {
                const el = enemyElements[i];
                if (el.id === enemy.id || el.textContent === enemy.emoji) {
                    // Found matching element
                    const rect = el.getBoundingClientRect();
                    const boardRect = boardElement.getBoundingClientRect();
                    
                    // Calculate position relative to board
                    enemy.x = rect.left - boardRect.left + rect.width / 2;
                    enemy.y = rect.top - boardRect.top + rect.height / 2;
                    
                    console.log(`Set position from DOM element: x=${enemy.x}, y=${enemy.y}`);
                    return;
                }
            }
            
            // METHOD 4: Fallback - use the path start position
            let path;
            if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                path = SudokuModule.getPathArray();
            } else if (window.EnemiesModule && EnemiesModule.path) {
                path = EnemiesModule.path;
            }
            
            if (path && path.length > 0) {
                const startCell = path[0];
                enemy.x = startCell[1] * cellSize + cellSize / 2;
                enemy.y = startCell[0] * cellSize + cellSize / 2;
                
                console.log(`Set position using path start: x=${enemy.x}, y=${enemy.y}`);
                return;
            }
            
            // METHOD 5: Last resort - use center of board
            enemy.x = boardElement.clientWidth / 2;
            enemy.y = boardElement.clientHeight / 2;
            console.log(`FALLBACK: Using board center for position: x=${enemy.x}, y=${enemy.y}`);
            
        } catch (err) {
            console.error("Error ensuring enemy position:", err);
            
            // Emergency fallback - at least set some values
            enemy.x = 200;
            enemy.y = 200;
        }
    }
    
    // Create a direct projectile that bypasses the normal animation system
    function createDirectProjectile(tower, enemy) {
        // Check that we have the necessary elements
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement || !tower || !enemy) {
            console.log("Missing required elements for projectile");
            return;
        }
        
        // Log debug info
        console.log(`Creating projectile from tower ${tower.id} (${tower.row},${tower.col}) to enemy ${enemy.id}`);
        console.log(`Enemy position: x=${enemy.x}, y=${enemy.y}`);
        
        // Force position recalculation to be extra sure
        ensureEnemyPosition(enemy);
        
        // If enemy position is still invalid, skip projectile
        if (typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            console.log("Skipping projectile - invalid enemy position after recalculation");
            return;
        }
        
        // Create a completely separate container that's a direct child of the body
        // This ensures no CSS from parent elements can interfere
        let container = document.getElementById('direct-projectile-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'direct-projectile-container';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '9999';
            
            // Add to body instead of board for maximum visibility
            document.body.appendChild(container);
            console.log("Created direct projectile container as child of body");
        }
        
        // Calculate tower position
        const cellSize = boardElement.clientWidth / 9;
        const boardRect = boardElement.getBoundingClientRect();
        const towerX = boardRect.left + (tower.col + 0.5) * cellSize;
        const towerY = boardRect.top + (tower.row + 0.5) * cellSize;
        
        // Adjust enemy position to page coordinates
        const enemyX = boardRect.left + enemy.x;
        const enemyY = boardRect.top + enemy.y;
        
        // Create projectile element with extreme visibility settings
        const projectile = document.createElement('div');
        projectile.className = 'direct-projectile';
        projectile.textContent = '➡️'; // Using a more visible emoji
        projectile.style.position = 'fixed'; // Using fixed positioning for maximum reliability
        projectile.style.left = `${towerX}px`;
        projectile.style.top = `${towerY}px`;
        projectile.style.transform = 'translate(-50%, -50%)';
        projectile.style.fontSize = '24px'; // Larger size
        projectile.style.color = '#FF0000'; // Bright red
        projectile.style.textShadow = '0 0 5px white, 0 0 10px white'; // Strong glow
        projectile.style.zIndex = '9999999'; // Extremely high z-index
        projectile.style.pointerEvents = 'none';
        
        // For debugging visibility, add a temporary outline
        projectile.style.outline = '2px solid red';
        projectile.style.background = 'rgba(255,255,0,0.5)';
        
        // Add it to our container
        container.appendChild(projectile);
        
        console.log(`Projectile created at ${towerX},${towerY} targeting ${enemyX},${enemyY}`);
        
        // Animate the projectile
        const startX = towerX;
        const startY = towerY;
        const endX = enemyX;
        const endY = enemyY;
        
        let progress = 0;
        const duration = 500; // Slower for visibility
        const startTime = performance.now();
        
        function animateProjectile(timestamp) {
            progress = (timestamp - startTime) / duration;
            
            if (progress >= 1) {
                // Create impact effect
                const impact = document.createElement('div');
                impact.className = 'direct-impact';
                impact.textContent = '💥';
                impact.style.position = 'fixed';
                impact.style.left = `${endX}px`;
                impact.style.top = `${endY}px`;
                impact.style.transform = 'translate(-50%, -50%)';
                impact.style.fontSize = '36px'; // Larger size
                impact.style.zIndex = '9999999';
                container.appendChild(impact);
                
                // Log completion
                console.log("Projectile animation completed");
                
                // Remove impact after animation
                setTimeout(() => {
                    if (impact.parentNode) {
                        impact.parentNode.removeChild(impact);
                    }
                }, 500);
                
                // Remove projectile
                if (projectile.parentNode) {
                    projectile.parentNode.removeChild(projectile);
                }
                return;
            }
            
            // Calculate current position
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            // Update projectile position
            projectile.style.left = `${x}px`;
            projectile.style.top = `${y}px`;
            
            // Point projectile in direction of movement
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
            projectile.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            
            // Continue animation
            requestAnimationFrame(animateProjectile);
        }
        
        // Start animation
        requestAnimationFrame(animateProjectile);
        
        // Also create a persistent marker at the enemy position (for debugging)
        const marker = document.createElement('div');
        marker.style.position = 'fixed';
        marker.style.left = `${enemyX}px`;
        marker.style.top = `${enemyY}px`;
        marker.style.width = '10px';
        marker.style.height = '10px';
        marker.style.background = 'red';
        marker.style.borderRadius = '50%';
        marker.style.zIndex = '9999990';
        marker.style.transform = 'translate(-50%, -50%)';
        container.appendChild(marker);
        
        // Remove marker after a few seconds
        setTimeout(() => {
            if (marker.parentNode) {
                marker.parentNode.removeChild(marker);
            }
        }, 3000);
    }
    
    // Add CSS for direct projectiles
    const style = document.createElement('style');
    style.textContent = `
        .direct-projectile {
            transition: none;
            will-change: transform, left, top;
        }
        
        .direct-impact {
            animation: direct-impact 0.3s forwards;
        }
        
        @keyframes direct-impact {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();