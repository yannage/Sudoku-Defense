/**
 * event-tracker.js - Diagnoses event flow issues in the game
 * This file tracks all events and visualizes when tower attacks happen
 */

(function() {
    console.log("Event Tracker initializing...");
    
    // Track basic game state
    let currentWave = 0;
    let isFirstWave = true;
    let attackCount = 0;
    
    // Create diagnostic UI
    function createDiagnosticPanel() {
        const panel = document.createElement('div');
        panel.id = 'event-tracker-panel';
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.right = '10px';
        panel.style.width = '280px';
        panel.style.background = 'rgba(0,0,0,0.8)';
        panel.style.color = 'white';
        panel.style.padding = '10px';
        panel.style.borderRadius = '5px';
        panel.style.zIndex = '99999';
        panel.style.fontSize = '12px';
        panel.style.fontFamily = 'monospace';
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div>Event Tracker</div>
                <button id="test-attack-btn" style="padding: 2px 5px; background: #f44336; color: white; border: none; cursor: pointer;">Test Attack</button>
            </div>
            <table style="width: 100%">
                <tr>
                    <td>Current Wave:</td>
                    <td id="current-wave">0</td>
                </tr>
                <tr>
                    <td>Attack Count:</td>
                    <td id="attack-count">0</td>
                </tr>
                <tr>
                    <td>First Wave Attacks:</td>
                    <td id="first-wave-attacks">0</td>
                </tr>
            </table>
            <div style="margin-top: 10px; border-top: 1px solid #555; padding-top: 5px;">
                <div id="log-container" style="max-height: 150px; overflow-y: auto;"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add button handler
        document.getElementById('test-attack-btn').addEventListener('click', testAttack);
    }
    
    // Add log entry
    function addLog(message, type = 'info') {
        const container = document.getElementById('log-container');
        if (!container) return;
        
        const entry = document.createElement('div');
        entry.style.borderBottom = '1px solid #333';
        entry.style.padding = '3px 0';
        entry.style.fontSize = '11px';
        
        switch (type) {
            case 'error':
                entry.style.color = '#ff5252';
                break;
            case 'success':
                entry.style.color = '#4caf50';
                break;
            case 'warn':
                entry.style.color = '#ffc107';
                break;
            default:
                entry.style.color = '#fff';
        }
        
        entry.textContent = message;
        container.insertBefore(entry, container.firstChild);
        
        // Keep log size reasonable
        if (container.children.length > 30) {
            container.removeChild(container.lastChild);
        }
    }
    
    // Update UI stats
    function updateStats() {
        document.getElementById('current-wave').textContent = currentWave;
        document.getElementById('attack-count').textContent = attackCount;
        document.getElementById('first-wave-attacks').textContent = 
            isFirstWave ? attackCount : document.getElementById('first-wave-attacks').textContent;
    }
    
    // Test attack functionality directly
    function testAttack() {
        addLog('Testing manual attack visualization...', 'warn');
        
        // Create a projectile effect directly in the DOM
        createTestProjectile();
    }
    
    // Create a test projectile
    function createTestProjectile() {
        // Get the game board for positioning
        const board = document.getElementById('sudoku-board');
        if (!board) {
            addLog('Game board not found!', 'error');
            return;
        }
        
        const boardRect = board.getBoundingClientRect();
        
        // Create projectile element
        const projectile = document.createElement('div');
        projectile.className = 'test-projectile';
        projectile.style.position = 'fixed';
        projectile.style.width = '20px';
        projectile.style.height = '20px';
        projectile.style.background = 'red';
        projectile.style.borderRadius = '50%';
        projectile.style.zIndex = '999999';
        projectile.style.pointerEvents = 'none';
        
        // Random positions within the board
        const startX = boardRect.left + boardRect.width * 0.25;
        const startY = boardRect.top + boardRect.height * 0.25;
        const endX = boardRect.left + boardRect.width * 0.75;
        const endY = boardRect.top + boardRect.height * 0.75;
        
        // Set initial position
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;
        
        // Add to body
        document.body.appendChild(projectile);
        
        addLog(`Created test projectile from (${Math.round(startX)},${Math.round(startY)}) to (${Math.round(endX)},${Math.round(endY)})`, 'success');
        
        // Animate
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                clearInterval(interval);
                
                // Create explosion
                const explosion = document.createElement('div');
                explosion.className = 'test-explosion';
                explosion.style.position = 'fixed';
                explosion.style.left = `${endX}px`;
                explosion.style.top = `${endY}px`;
                explosion.style.width = '40px';
                explosion.style.height = '40px';
                explosion.style.background = 'orange';
                explosion.style.borderRadius = '50%';
                explosion.style.transform = 'translate(-50%, -50%)';
                explosion.style.zIndex = '999999';
                document.body.appendChild(explosion);
                
                // Animate explosion
                let size = 1;
                const explosionInterval = setInterval(() => {
                    size *= 1.2;
                    explosion.style.transform = `translate(-50%, -50%) scale(${size})`;
                    explosion.style.opacity = (1 - (size - 1) / 5).toString();
                    
                    if (size > 5) {
                        clearInterval(explosionInterval);
                        explosion.remove();
                    }
                }, 50);
                
                projectile.remove();
                addLog('Test projectile animation complete', 'success');
                return;
            }
            
            // Calculate position
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            // Move projectile
            projectile.style.left = `${x}px`;
            projectile.style.top = `${y}px`;
        }, 30);
    }
    
    // Trap all game events to track them
    function trapEvents() {
        // Save original publish function
        const originalPublish = EventSystem.publish;
        
        // Override with our tracking version
        EventSystem.publish = function(eventName, data) {
            // Track specific events
            if (eventName === GameEvents.WAVE_START) {
                currentWave++;
                isFirstWave = currentWave === 1;
                addLog(`Wave ${currentWave} started`, 'info');
                updateStats();
            } 
            else if (eventName === GameEvents.TOWER_ATTACK) {
                attackCount++;
                const waveText = isFirstWave ? "FIRST WAVE" : `Wave ${currentWave}`;
                addLog(`${waveText} - Tower attack #${attackCount}`, isFirstWave ? 'warn' : 'info');
                updateStats();
                
                // If this is the first wave, visualize the attack
                if (isFirstWave) {
                    visualizeAttack(data);
                }
            }
            else if (eventName === GameEvents.WAVE_COMPLETE) {
                addLog(`Wave ${currentWave} completed`, 'success');
            }
            
            // Call original function
            return originalPublish.call(this, eventName, data);
        };
    }
    
    // Visualize a tower attack
    function visualizeAttack(data) {
        if (!data || !data.tower || !data.enemy) {
            addLog('Invalid attack data', 'error');
            return;
        }
        
        // Get board for positioning
        const board = document.getElementById('sudoku-board');
        if (!board) {
            addLog('Board not found for visualization', 'error');
            return;
        }
        
        const boardRect = board.getBoundingClientRect();
        const cellSize = board.clientWidth / 9;
        
        // Calculate tower position
        const towerX = boardRect.left + (data.tower.col + 0.5) * cellSize;
        const towerY = boardRect.top + (data.tower.row + 0.5) * cellSize;
        
        // Get enemy position
        let enemyX, enemyY;
        
        // Try different methods to get enemy position
        if (typeof data.enemy.x === 'number' && typeof data.enemy.y === 'number') {
            // Enemy has direct coordinates
            enemyX = boardRect.left + data.enemy.x;
            enemyY = boardRect.top + data.enemy.y;
            addLog('Using direct enemy coordinates', 'info');
        } 
        else if (typeof data.enemy.pathIndex === 'number' && typeof data.enemy.progress === 'number') {
            // Enemy uses path following
            try {
                const path = SudokuModule.getPathArray();
                if (!path || path.length === 0) {
                    addLog('Path data not available', 'error');
                    return;
                }
                
                if (data.enemy.pathIndex >= path.length - 1) {
                    addLog('Enemy at end of path', 'warn');
                    return;
                }
                
                const currentCell = path[data.enemy.pathIndex];
                const nextCell = path[data.enemy.pathIndex + 1];
                
                const startX = boardRect.left + currentCell[1] * cellSize + cellSize / 2;
                const startY = boardRect.top + currentCell[0] * cellSize + cellSize / 2;
                const endX = boardRect.left + nextCell[1] * cellSize + cellSize / 2;
                const endY = boardRect.top + nextCell[0] * cellSize + cellSize / 2;
                
                enemyX = startX + (endX - startX) * data.enemy.progress;
                enemyY = startY + (endY - startY) * data.enemy.progress;
                addLog('Calculated enemy position from path', 'info');
            } catch (err) {
                addLog(`Error calculating from path: ${err.message}`, 'error');
                return;
            }
        } else {
            addLog('Cannot determine enemy position', 'error');
            return;
        }
        
        // Create projectile
        const projectile = document.createElement('div');
        projectile.style.position = 'fixed';
        projectile.style.left = `${towerX}px`;
        projectile.style.top = `${towerY}px`;
        projectile.style.width = '15px';
        projectile.style.height = '15px';
        projectile.style.background = 'yellow';
        projectile.style.border = '2px solid black';
        projectile.style.borderRadius = '50%';
        projectile.style.zIndex = '999999';
        document.body.appendChild(projectile);
        
        // Create origin marker
        const originMarker = document.createElement('div');
        originMarker.style.position = 'fixed';
        originMarker.style.left = `${towerX}px`;
        originMarker.style.top = `${towerY}px`;
        originMarker.style.width = '10px';
        originMarker.style.height = '10px';
        originMarker.style.background = 'blue';
        originMarker.style.borderRadius = '50%';
        originMarker.style.zIndex = '999998';
        originMarker.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(originMarker);
        
        // Create target marker
        const targetMarker = document.createElement('div');
        targetMarker.style.position = 'fixed';
        targetMarker.style.left = `${enemyX}px`;
        targetMarker.style.top = `${enemyY}px`;
        targetMarker.style.width = '10px';
        targetMarker.style.height = '10px';
        targetMarker.style.background = 'red';
        targetMarker.style.borderRadius = '50%';
        targetMarker.style.zIndex = '999998';
        targetMarker.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(targetMarker);
        
        addLog(`Visualizing: Tower(${towerX.toFixed(0)},${towerY.toFixed(0)}) → Enemy(${enemyX.toFixed(0)},${enemyY.toFixed(0)})`, 'success');
        
        // Animate projectile
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                clearInterval(interval);
                projectile.remove();
                
                // Remove markers after a delay
                setTimeout(() => {
                    originMarker.remove();
                    targetMarker.remove();
                }, 2000);
                
                return;
            }
            
            const x = towerX + (enemyX - towerX) * progress;
            const y = towerY + (enemyY - towerY) * progress;
            
            projectile.style.left = `${x}px`;
            projectile.style.top = `${y}px`;
        }, 30);
    }
    
    // Initialize
    function init() {
        createDiagnosticPanel();
        trapEvents();
        addLog('Event tracker initialized', 'success');
    }
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for all game scripts to load
        setTimeout(init, 1000);
    });
})();