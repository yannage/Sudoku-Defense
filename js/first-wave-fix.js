
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
        if (!enemy || enemy.active === false || (enemy.x !== undefined && enemy.y !== undefined)) {
            return;
        }
        
        try {
            // Calculate position based on path
            const cellSize = document.getElementById('sudoku-board').clientWidth / 9;
            
            // Try to get path data
            let path;
            if (window.SudokuModule && typeof SudokuModule.getPathArray === 'function') {
                path = SudokuModule.getPathArray();
            }
            
            // If we have valid path data and enemy has pathIndex
            if (path && path.length > 0 && enemy.pathIndex !== undefined && enemy.pathIndex < path.length) {
                let currentCell, nextCell;
                
                // Handle edge case where enemy is at last path index
                if (enemy.pathIndex >= path.length - 1) {
                    currentCell = path[path.length - 2];
                    nextCell = path[path.length - 1];
                } else {
                    currentCell = path[enemy.pathIndex];
                    nextCell = path[enemy.pathIndex + 1];
                }
                
                if (currentCell && nextCell) {
                    // Calculate current and next cell centers
                    const currentX = currentCell[1] * cellSize + cellSize / 2;
                    const currentY = currentCell[0] * cellSize + cellSize / 2;
                    const nextX = nextCell[1] * cellSize + cellSize / 2;
                    const nextY = nextCell[0] * cellSize + cellSize / 2;
                    
                    // Interpolate position based on progress
                    const progress = enemy.progress || 0;
                    enemy.x = currentX + (nextX - currentX) * progress;
                    enemy.y = currentY + (nextY - currentY) * progress;
                    
                    console.log(`Added missing position to enemy ${enemy.id}: x=${enemy.x}, y=${enemy.y}`);
                }
            }
            // Fallback if we couldn't calculate from path
            else if (enemy.row !== undefined && enemy.col !== undefined) {
                // Calculate position based on grid coordinates
                enemy.x = (enemy.col + 0.5) * cellSize;
                enemy.y = (enemy.row + 0.5) * cellSize;
                console.log(`Added position to enemy ${enemy.id} from row/col: x=${enemy.x}, y=${enemy.y}`);
            }
        } catch (err) {
            console.error("Error ensuring enemy position:", err);
        }
    }
    
    // Create a direct projectile that bypasses the normal animation system
    function createDirectProjectile(tower, enemy) {
        // Check that we have the necessary elements
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement || !tower || !enemy) return;
        
        // Create or get projectile container with forced z-index
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
            
            // Ensure board has relative positioning
            if (getComputedStyle(boardElement).position === 'static') {
                boardElement.style.position = 'relative';
            }
            
            boardElement.appendChild(container);
            console.log("Created direct projectile container");
        }
        
        // Calculate tower position
        const cellSize = boardElement.clientWidth / 9;
        const towerX = (tower.col + 0.5) * cellSize;
        const towerY = (tower.row + 0.5) * cellSize;
        
        // Ensure enemy has x,y coordinates
        ensureEnemyPosition(enemy);
        
        // If enemy position is still invalid, skip projectile
        if (enemy.x === undefined || enemy.y === undefined) {
            console.log("Skipping projectile - invalid enemy position");
            return;
        }
        
        // Create projectile element
        const projectile = document.createElement('div');
        projectile.className = 'direct-projectile';
        projectile.textContent = '⚫';
        projectile.style.position = 'absolute';
        projectile.style.left = `${towerX}px`;
        projectile.style.top = `${towerY}px`;
        projectile.style.transform = 'translate(-50%, -50%)';
        projectile.style.fontSize = '14px';
        projectile.style.color = '#000';
        projectile.style.textShadow = '0 0 3px white';
        projectile.style.zIndex = '9999';
        projectile.style.pointerEvents = 'none';
        
        // Customize based on tower type
        if (tower.type === 'special') {
            projectile.textContent = '✨';
            projectile.style.color = '#9c27b0';
        } else if (!isNaN(parseInt(tower.type))) {
            const towerNum = parseInt(tower.type);
            const colors = ['#ff5252', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', 
                           '#9c27b0', '#e91e63', '#795548', '#607d8b'];
            if (towerNum >= 1 && towerNum <= 9) {
                projectile.style.color = colors[towerNum - 1];
                projectile.style.textShadow = `0 0 5px ${colors[towerNum - 1]}`;
            }
        }
        
        container.appendChild(projectile);
        
        // Animate the projectile
        const startX = towerX;
        const startY = towerY;
        const endX = enemy.x;
        const endY = enemy.y;
        
        let progress = 0;
        const duration = 200; // ms
        const startTime = performance.now();
        
        function animateProjectile(timestamp) {
            progress = (timestamp - startTime) / duration;
            
            if (progress >= 1) {
                // Create impact effect
                const impact = document.createElement('div');
                impact.className = 'direct-impact';
                impact.textContent = '💥';
                impact.style.position = 'absolute';
                impact.style.left = `${endX}px`;
                impact.style.top = `${endY}px`;
                impact.style.transform = 'translate(-50%, -50%)';
                impact.style.fontSize = '18px';
                impact.style.zIndex = '9999';
                container.appendChild(impact);
                
                // Remove impact after animation
                setTimeout(() => {
                    if (impact.parentNode) {
                        impact.parentNode.removeChild(impact);
                    }
                }, 300);
                
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
            
            // Continue animation
            requestAnimationFrame(animateProjectile);
        }
        
        // Start animation
        requestAnimationFrame(animateProjectile);
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