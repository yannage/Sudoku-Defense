
/**
 * Debugging tools for tower defense animation issues
 * Add this to a new file called debug-tools.js and include it in your HTML after all other scripts
 */

const AnimationDebugger = (function() {
    // Debug state tracking
    const state = {
        waveCount: 0,
        firstAttackData: null,
        enemyPositionSamples: [],
        projectileAttempts: 0,
        successfulProjectiles: 0,
        containerSetup: false
    };
    
    // Set up visual debug panel
    function setupDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.position = 'fixed';
        panel.style.bottom = '10px';
        panel.style.right = '10px';
        panel.style.width = '300px';
        panel.style.background = 'rgba(0,0,0,0.8)';
        panel.style.color = 'white';
        panel.style.padding = '10px';
        panel.style.borderRadius = '5px';
        panel.style.zIndex = '9999';
        panel.style.fontSize = '12px';
        panel.style.maxHeight = '300px';
        panel.style.overflow = 'auto';
        panel.style.fontFamily = 'monospace';
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0">Animation Debugger</h3>
            <div id="debug-stats">Loading...</div>
            <div style="margin-top: 10px">
                <button id="debug-toggle-container">Show Container</button>
                <button id="debug-force-projectile">Force Projectile</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add button handlers
        document.getElementById('debug-toggle-container').addEventListener('click', toggleContainerVisibility);
        document.getElementById('debug-force-projectile').addEventListener('click', forceProjectile);
        
        // Update stats regularly
        setInterval(updateDebugStats, 1000);
    }
    
    // Update debug stats in panel
    function updateDebugStats() {
        const statsDiv = document.getElementById('debug-stats');
        if (!statsDiv) return;
        
        statsDiv.innerHTML = `
            <div>Wave Count: ${state.waveCount}</div>
            <div>Projectile Attempts: ${state.projectileAttempts}</div>
            <div>Successful Projectiles: ${state.successfulProjectiles}</div>
            <div>Container Setup: ${state.containerSetup}</div>
            <div>Enemy Position Samples: ${state.enemyPositionSamples.length}</div>
            ${state.firstAttackData ? `<div>First Attack: ${JSON.stringify(state.firstAttackData)}</div>` : ''}
        `;
    }
    
    // Toggle projectile container visibility
    function toggleContainerVisibility() {
        const container = document.getElementById('projectile-container');
        if (!container) {
            logDebug('Projectile container not found!');
            return;
        }
        
        if (container.style.background) {
            container.style.background = '';
            container.style.outline = '';
        } else {
            container.style.background = 'rgba(255,0,0,0.2)';
            container.style.outline = '2px solid red';
        }
        
        logDebug('Toggled container visibility: ' + (container.style.background ? 'visible' : 'hidden'));
    }
    
    // Force a test projectile
    function forceProjectile() {
        const container = document.getElementById('projectile-container');
        if (!container) {
            logDebug('Cannot create projectile - container not found!');
            return;
        }
        
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) {
            logDebug('Board element not found!');
            return;
        }
        
        // Create test projectile
        const projectile = document.createElement('div');
        projectile.className = 'tower-projectile';
        projectile.textContent = '⚫';
        projectile.style.position = 'absolute';
        projectile.style.left = '50%';
        projectile.style.top = '50%';
        projectile.style.fontSize = '20px';
        projectile.style.color = 'red';
        projectile.style.zIndex = '9999';
        
        container.appendChild(projectile);
        
        // Animate projectile
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                clearInterval(interval);
                projectile.remove();
                logDebug('Test projectile completed');
                return;
            }
            
            const x = 50 + Math.cos(progress * Math.PI * 2) * 30;
            const y = 50 + Math.sin(progress * Math.PI * 2) * 30;
            projectile.style.transform = `translate(${x}%, ${y}%)`;
        }, 50);
        
        logDebug('Created test projectile');
    }
    
    // Log to console and panel
    function logDebug(message) {
        console.log('[AnimationDebugger]', message);
        
        // Create log in panel
        const statsDiv = document.getElementById('debug-stats');
        if (statsDiv) {
            const logEntry = document.createElement('div');
            logEntry.style.borderTop = '1px solid #333';
            logEntry.style.padding = '4px 0';
            logEntry.style.color = '#aaffaa';
            logEntry.textContent = message;
            
            statsDiv.appendChild(logEntry);
            
            // Keep log size reasonable
            if (statsDiv.children.length > 20) {
                statsDiv.removeChild(statsDiv.firstChild);
            }
        }
    }
    
    // Track wave events
    function setupEventTracking() {
        // Track wave starts
        EventSystem.subscribe(GameEvents.WAVE_START, function(data) {
            state.waveCount++;
            logDebug(`Wave ${state.waveCount} started`);
            
            // Check container on wave start
            setTimeout(() => {
                const container = document.getElementById('projectile-container');
                state.containerSetup = !!container;
                logDebug(`Projectile container check: ${state.containerSetup ? 'Found' : 'Missing'}`);
                
                if (container) {
                    // Ensure container has proper settings
                    container.style.zIndex = '9999';
                    logDebug(`Container z-index set to ${container.style.zIndex}`);
                }
            }, 100);
            
            // Sample enemy data after wave starts
            setTimeout(() => {
                if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
                    const enemies = EnemiesModule.getEnemies();
                    if (enemies.length > 0) {
                        state.enemyPositionSamples.push({
                            wave: state.waveCount,
                            time: Date.now(),
                            enemyData: JSON.parse(JSON.stringify(enemies[0]))
                        });
                        logDebug(`Sampled enemy data from wave ${state.waveCount}`);
                    }
                }
            }, 1000);
        });
        
        // Track tower attacks
        const originalSubscribe = EventSystem.subscribe;
        EventSystem.subscribe = function(eventName, callback) {
            if (eventName === GameEvents.TOWER_ATTACK) {
                // Wrap the tower attack callback with debugging
                const debugCallback = function(data) {
                    // Save first attack data
                    if (!state.firstAttackData && data && data.tower && data.enemy) {
                        state.firstAttackData = {
                            tower: {
                                id: data.tower.id,
                                type: data.tower.type,
                                row: data.tower.row,
                                col: data.tower.col
                            },
                            enemy: {
                                id: data.enemy.id,
                                type: data.enemy.type,
                                hasX: typeof data.enemy.x === 'number',
                                hasY: typeof data.enemy.y === 'number',
                                active: data.enemy.active,
                                pathIndex: data.enemy.pathIndex,
                                progress: data.enemy.progress,
                                hasRowCol: typeof data.enemy.row === 'number' && typeof data.enemy.col === 'number'
                            },
                            wave: state.waveCount,
                            time: Date.now()
                        };
                        logDebug(`First tower attack recorded in wave ${state.waveCount}`);
                    }
                    
                    // Count projectile attempts
                    state.projectileAttempts++;
                    
                    // Call original callback
                    return callback(data);
                };
                
                return originalSubscribe.call(this, eventName, debugCallback);
            }
            
            // Normal subscription for other events
            return originalSubscribe.call(this, eventName, callback);
        };
        
        // Track projectile creation
        if (window.TowerAnimationsModule) {
            const originalCreateProjectile = TowerAnimationsModule.createProjectile;
            if (typeof originalCreateProjectile === 'function') {
                TowerAnimationsModule.createProjectile = function(tower, enemy) {
                    state.successfulProjectiles++;
                    logDebug(`Projectile created from tower ${tower.id} to enemy ${enemy.id}`);
                    return originalCreateProjectile.call(this, tower, enemy);
                };
            }
        }
    }
    
    // Initialize the debugger
    function init() {
        console.log("Animation Debugger initializing...");
        setupDebugPanel();
        setupEventTracking();
        
        // Add emergency fix button to navbar if present
        const gameHeader = document.getElementById('game-header');
        if (gameHeader) {
            const fixButton = document.createElement('button');
            fixButton.textContent = "Fix Animations";
            fixButton.style.background = '#ff5722';
            fixButton.style.color = 'white';
            fixButton.style.border = 'none';
            fixButton.style.padding = '4px 8px';
            fixButton.style.cursor = 'pointer';
            fixButton.style.marginLeft = '10px';
            
            fixButton.addEventListener('click', emergencyFix);
            gameHeader.appendChild(fixButton);
        }
        
        console.log("Animation Debugger initialized");
    }
    
    // Emergency fix function
    function emergencyFix() {
        logDebug("Applying emergency animation fix...");
        
        // Force recreate container
        const boardElement = document.getElementById('sudoku-board');
        if (boardElement) {
            // Ensure board has relative position
            boardElement.style.position = 'relative';
            
            // Remove any existing container
            const oldContainer = document.getElementById('projectile-container');
            if (oldContainer) oldContainer.remove();
            
            // Create new container with extreme properties
            const container = document.createElement('div');
            container.id = 'projectile-container';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '9999';
            container.style.overflow = 'visible';
            
            // Make container stand out temporarily for debugging
            container.style.background = 'rgba(0,255,0,0.1)';
            container.style.border = '2px dashed green';
            
            // Add to board
            boardElement.appendChild(container);
            
            // Clear visual indicators after 3 seconds
            setTimeout(() => {
                container.style.background = '';
                container.style.border = '';
            }, 3000);
            
            state.containerSetup = true;
            logDebug("Container recreated with max z-index");
        } else {
            logDebug("ERROR: Board element not found");
        }
        
        // Reset internal tracking
        if (window.TowerAnimationsModule && Array.isArray(TowerAnimationsModule.projectiles)) {
            TowerAnimationsModule.projectiles = [];
            logDebug("Projectile array reset");
        }
        
        // Force recalculate cell size
        if (window.TowerAnimationsModule && typeof TowerAnimationsModule.updateDimensions === 'function') {
            TowerAnimationsModule.updateDimensions();
            logDebug("Dimensions recalculated");
        }
        
        // Add test projectile to verify container works
        setTimeout(forceProjectile, 500);
    }
    
    // Expose public API
    return {
        init,
        logDebug,
        state,
        forceProjectile,
        emergencyFix
    };
})();

// Initialize the debugger when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to make sure all other scripts are loaded
    setTimeout(function() {
        AnimationDebugger.init();
    }, 1000);
});