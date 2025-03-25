/**
 * game.js - Main game module
 * This module coordinates all game components and handles the main game loop
 */

const Game = (function() {
    // Private variables
    let isInitialized = false;
    let isRunning = false;
    let isPaused = false;
    let lastUpdateTime = 0;
    let cellSize = 0;
    let boardElement = null;
    
    /**
     * Initialize the game
     */
    function init() {
        if (isInitialized) {
            return;
        }
        
        // Get the board element
        boardElement = document.getElementById('sudoku-board');
        
        // Calculate cell size based on board size
        const boardWidth = boardElement.clientWidth;
        cellSize = Math.floor(boardWidth / 9);
        
        // Initialize other modules with game settings
        const gameSettings = {
            cellSize: cellSize
        };
        
        // Publish initialization event
        EventSystem.publish(GameEvents.GAME_INIT, gameSettings);
        
        // Set up the Sudoku board
        setupBoard();
        
        // Set up UI event listeners
        setupUIEventListeners();
        
        // Start the game loop
        isInitialized = true;
        start();
    }
    
    /**
     * Start the game
     */
    function start() {
        if (isRunning) {
            return;
        }
        
        isRunning = true;
        isPaused = false;
        lastUpdateTime = performance.now();
        
        // Publish game start event
        EventSystem.publish(GameEvents.GAME_START);
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }
    
    /**
     * Pause the game
     */
    function pause() {
        if (!isRunning || isPaused) {
            return;
        }
        
        isPaused = true;
        
        // Publish game pause event
        EventSystem.publish(GameEvents.GAME_PAUSE);
    }
    
    /**
     * Resume the game
     */
    function resume() {
        if (!isRunning || !isPaused) {
            return;
        }
        
        isPaused = false;
        lastUpdateTime = performance.now();
        
        // Publish game resume event
        EventSystem.publish(GameEvents.GAME_RESUME);
        
        // Resume game loop
        requestAnimationFrame(gameLoop);
    }
    
    /**
     * Stop the game
     */
    function stop() {
        isRunning = false;
        isPaused = false;
    }
    
    /**
     * Reset the game
     */
    function reset() {
    // First stop the game loop
    stop();
    
    // Clear the board completely
    clearBoard();
    
    // Reset all modules explicitly
    PlayerModule.reset();
    SudokuModule.generatePuzzle();
    EnemiesModule.init();
    TowersModule.init();
    
    // Force full re-initialization
    isInitialized = false; 
    init();
    
    // Make sure we update the UI
    const playerState = PlayerModule.getState();
    EventSystem.publish(GameEvents.PLAYER_UPDATE, playerState);
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "New game started!");
}
    
    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    function gameLoop(timestamp) {
        if (!isRunning || isPaused) {
            return;
        }
        
        // Calculate delta time
        const deltaTime = (timestamp - lastUpdateTime) / 1000; // Convert to seconds
        lastUpdateTime = timestamp;
        
        // Update game state
        update(deltaTime);
        
        // Render game state
        render();
        
        // Continue loop
        requestAnimationFrame(gameLoop);
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time elapsed since last update
     */
    function update(deltaTime) {
        // Update enemies
        EnemiesModule.update(deltaTime);
        
        // Update towers
        TowersModule.update(deltaTime);
    }
    
    /**
     * Render game state
     */
    function render() {
        // Update enemy elements
        renderEnemies();
    }
    
    /**
     * Render enemies on the board
     */
    function renderEnemies() {
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
            
            // Update enemy position
            enemyElement.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
            
            // Update health bar
            const healthFill = enemyElement.querySelector('.enemy-health-fill');
            const healthPercent = (enemy.health / enemy.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
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
    }
    
    /**
     * Set up the Sudoku board
     */
    function setupBoard() {
        // Clear any existing board
        clearBoard();
        
        // Create cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click event listener
                cell.addEventListener('click', function() {
                    handleCellClick(row, col);
                });
                
                boardElement.appendChild(cell);
            }
        }
        
        // Update board with initial values
        updateBoard();
    }
    
    /**
     * Clear the Sudoku board
     */
    function clearBoard() {
        while (boardElement.firstChild) {
            boardElement.removeChild(boardElement.firstChild);
        }
    }
    
    /**
     * Update the Sudoku board display
     */
    function updateBoard() {
        const board = SudokuModule.getBoard();
        const fixedCells = SudokuModule.getFixedCells();
        const pathCells = SudokuModule.getPathCells();
        
        // Update each cell
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellElement = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
                
                if (!cellElement) continue;
                
                // Clear previous classes
                cellElement.classList.remove('fixed', 'path');
                
                // Set value
                const value = board[row][col];
                cellElement.textContent = value > 0 ? value : '';
                
                // Mark fixed cells
                if (fixedCells[row][col]) {
                    cellElement.classList.add('fixed');
                }
                
                // Mark path cells
                if (pathCells.has(`${row},${col}`)) {
                    cellElement.classList.add('path');
                }
                
                // Check for tower
                const tower = TowersModule.getTowerAt(row, col);
                
                if (tower && !pathCells.has(`${row},${col}`)) {
                    // Clear number and show tower emoji
                    cellElement.textContent = tower.emoji;
                    
                    // Add level indicator if tower level > 1
                    if (tower.level > 1) {
                        const levelIndicator = document.createElement('span');
                        levelIndicator.className = 'tower-level';
                        levelIndicator.textContent = tower.level;
                        levelIndicator.style.position = 'absolute';
                        levelIndicator.style.bottom = '2px';
                        levelIndicator.style.right = '2px';
                        levelIndicator.style.fontSize = '12px';
                        levelIndicator.style.fontWeight = 'bold';
                        levelIndicator.style.color = '#fff';
                        levelIndicator.style.backgroundColor = '#333';
                        levelIndicator.style.borderRadius = '50%';
                        levelIndicator.style.padding = '1px 3px';
                        
                        // Remove existing level indicator
                        const existingIndicator = cellElement.querySelector('.tower-level');
                        if (existingIndicator) {
                            existingIndicator.remove();
                        }
                        
                        cellElement.appendChild(levelIndicator);
                    }
                }
            }
        }
    }
    
    /**
     * Handle cell click event
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    function handleCellClick(row, col) {
        const selectedTower = PlayerModule.getSelectedTower();
        
        if (!selectedTower) {
            // No tower selected, show info about existing tower
            const tower = TowersModule.getTowerAt(row, col);
            
            if (tower) {
                showTowerInfo(tower);
            }
            
            return;
        }
        
        // Attempt to place the selected tower
        TowersModule.createTower(selectedTower, row, col);
        
        // Update the board
        updateBoard();
    }
    
    /**
     * Show tower information
     * @param {Object} tower - The tower to show info for
     */
    function showTowerInfo(tower) {
        const towerType = TowersModule.getTowerTypeData(tower.type);
        
        if (!towerType) {
            return;
        }
        
        const upgradeCost = Math.floor(towerType.cost * 0.75 * tower.level);
        
        EventSystem.publish(GameEvents.STATUS_MESSAGE, 
            `Tower Level ${tower.level}: Damage ${tower.damage}, Range ${Math.floor(tower.range / cellSize)}, Attack Speed ${(1 / tower.attackSpeed).toFixed(1)}/s. Upgrade Cost: ${upgradeCost}`
        );
    }
    
    /**
     * Set up UI event listeners
     */
    function setupUIEventListeners() {
        // Tower selection
        const towerOptions = document.querySelectorAll('.tower-option');
        
        towerOptions.forEach(option => {
            option.addEventListener('click', function() {
                const towerType = this.dataset.towerType;
                const cost = TowersModule.getTowerCost(towerType);
                
                // Remove selected class from all options
                towerOptions.forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Select the tower
                PlayerModule.selectTower(towerType);
                
                EventSystem.publish(GameEvents.STATUS_MESSAGE, `Selected ${towerType === 'special' ? 'Special' : towerType} Tower. Cost: ${cost}`);
            });
        });
        
        // Game controls
        document.getElementById('start-wave').addEventListener('click', function() {
            LevelsModule.startWave();
        });
        
        document.getElementById('pause-game').addEventListener('click', function() {
            if (isPaused) {
                resume();
                this.textContent = 'Pause';
            } else {
                pause();
                this.textContent = 'Resume';
            }
        });
        
        document.getElementById('new-game').addEventListener('click', function() {
            reset();
        });
        

    // Subscribe to events for UI updates
    EventSystem.subscribe(GameEvents.PLAYER_UPDATE, function(data) {
        // Update UI with player data
        document.getElementById('score-value').textContent = data.score;
        document.getElementById('lives-value').textContent = data.lives;
        document.getElementById('currency-value').textContent = data.currency;
    });
        
        EventSystem.subscribe(GameEvents.UI_UPDATE, function(data) {
            // Update wave display
            if (data.waveNumber !== undefined) {
                document.getElementById('wave-value').textContent = data.waveNumber;
            }
        });
        
        EventSystem.subscribe(GameEvents.STATUS_MESSAGE, function(message) {
            // Update status message
            document.getElementById('status-message').textContent = message;
            
            // Clear message after 5 seconds
            setTimeout(() => {
                if (document.getElementById('status-message').textContent === message) {
                    document.getElementById('status-message').textContent = 'Place towers to defend against enemies!';
                }
            }, 5000);
        });
        
        EventSystem.subscribe(GameEvents.GAME_OVER, function(data) {
            alert(`Game Over! Final Score: ${data.score}`);
            reset();
        });
        
        EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
            // Update the board when a new puzzle is generated
            updateBoard();
        });
        
        EventSystem.subscribe(GameEvents.TOWER_PLACED, function() {
            // Update the board when a tower is placed
            updateBoard();
        });
        
        EventSystem.subscribe(GameEvents.TOWER_REMOVED, function() {
            // Update the board when a tower is removed
            updateBoard();
        });
        
        EventSystem.subscribe(GameEvents.TOWER_UPGRADE, function() {
            // Update the board when a tower is upgraded
            updateBoard();
        });
        
        // Listen for window resize to adjust cell size
        window.addEventListener('resize', function() {
            if (!boardElement) return;
            
            const boardWidth = boardElement.clientWidth;
            cellSize = Math.floor(boardWidth / 9);
            
            // Update cell size in other modules
            EnemiesModule.setCellSize(cellSize);
            TowersModule.setCellSize(cellSize);
            
            // Update board display
            updateBoard();
        });
    }
    
    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Listen for DOM content loaded to initialize the game
        document.addEventListener('DOMContentLoaded', function() {
            init();
        });
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Public API
    return {
        init,
        start,
        pause,
        resume,
        stop,
        reset
    };
})();

// Make module available globally
window.Game = Game;
