// Add this at the beginning of the Game module to ensure events are properly initialized
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
        
        console.log("Game initialization started");
        
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
        
        // Make sure UI is updated with initial values
        updateUI();
        
        // Start the game loop
        isInitialized = true;
        start();
        
        console.log("Game initialization completed");
    }
    
    /**
     * Update UI elements with current game state
     */
    function updateUI() {
        // Get current player state
        const playerState = PlayerModule.getState();
        
        // Update UI elements directly
        document.getElementById('score-value').textContent = playerState.score;
        document.getElementById('lives-value').textContent = playerState.lives;
        document.getElementById('currency-value').textContent = playerState.currency;
        
        // Update wave number
        document.getElementById('wave-value').textContent = EnemiesModule.getWaveNumber();
        
        console.log("UI updated with: Lives=" + playerState.lives + ", Currency=" + playerState.currency);
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
        console.log("Game reset started");
        
        // Stop the game loop
        stop();
        
        // Clear the board
        clearBoard();
        
        // Reset all modules explicitly
        PlayerModule.reset();
        SudokuModule.generatePuzzle();
        EnemiesModule.init();
        TowersModule.init();
        
        // Force full re-initialization
        isInitialized = false;
        init();
        
        // Update UI with initial values
        updateUI();
        
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "New game started!");
        
        console.log("Game reset completed");
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
        console.log("Setting up board");
        
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
        
        // Count cells to ensure all were created
        console.log("Created " + boardElement.childElementCount + " cells");
        
        // Update board with initial values
        updateBoard();
    }
    
    /**
     * Clear the Sudoku board
     */
    function clearBoard() {
        console.log("Clearing board");
        while (boardElement.firstChild) {
            boardElement.removeChild(boardElement.firstChild);
        }
    }
    
    /**
     * Update the Sudoku board display
     */
    function updateBoard() {
        console.log("Updating board display");
        const board = SudokuModule.getBoard();
        const fixedCells = SudokuModule.getFixedCells();
        const pathCells = SudokuModule.getPathCells();
        
        // Update each cell
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellElement = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
                
                if (!cellElement) {
                    console.warn(`Cell element not found for row ${row}, col ${col}`);
                    continue;
                }
                
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
        const newTower = TowersModule.createTower(selectedTower, row, col);
        
        // If tower was successfully placed, update the UI immediately
        if (newTower) {
            updateUI();
        }
        
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
        console.log("Setting up UI event listeners");
        
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
            console.log("New Game button clicked");
            reset();
        });
        
        // Subscribe to events for UI updates
        EventSystem.subscribe(GameEvents.PLAYER_UPDATE, function(data) {
            // Update UI with player data
            document.getElementById('score-value').textContent = data.score;
            document.getElementById('lives-value').textContent = data.lives;
            document.getElementById('currency-value').textContent = data.currency;
            console.log("Player update event received: Lives=" + data.lives + ", Currency=" + data.currency);
        });
        
        // Add direct listeners for individual stat changes
        EventSystem.subscribe(GameEvents.CURRENCY_CHANGE, function(newCurrency) {
            document.getElementById('currency-value').textContent = newCurrency;
            console.log("Currency change event received: " + newCurrency);
        });
        
        EventSystem.subscribe(GameEvents.LIVES_CHANGE, function(newLives) {
            document.getElementById('lives-value').textContent = newLives;
            console.log("Lives change event received: " + newLives);
        });
        
        EventSystem.subscribe(GameEvents.SCORE_CHANGE, function(newScore) {
            document.getElementById('score-value').textContent = newScore;
            console.log("Score change event received: " + newScore);
        });
        
        EventSystem.subscribe(GameEvents.UI_UPDATE, function(data) {
            // Update wave display
            if (data.waveNumber !== undefined) {
                document.getElementById('wave-value').textContent = data.waveNumber;
            }
            
            // Update other UI elements if data is provided
            if (data.currency !== undefined) {
                document.getElementById('currency-value').textContent = data.currency;
            }
            
            if (data.lives !== undefined) {
                document.getElementById('lives-value').textContent = data.lives;
            }
            
            if (data.score !== undefined) {
                document.getElementById('score-value').textContent = data.score;
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
        
        EventSystem.subscribe(GameEvents.TOWER_PLACED, function(tower) {
            // Update the board when a tower is placed
            updateBoard();
            // Immediately update UI to reflect currency change
            updateUI();
        });
        
        EventSystem.subscribe(GameEvents.TOWER_REMOVED, function() {
            // Update the board when a tower is removed
            updateBoard();
        });
        
        EventSystem.subscribe(GameEvents.TOWER_UPGRADE, function() {
            // Update the board when a tower is upgraded
            updateBoard();
            // Immediately update UI to reflect currency change
            updateUI();
        });
        
        EventSystem.subscribe(GameEvents.ENEMY_REACHED_END, function() {
            // Update UI to reflect lives change
            updateUI();
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
            console.log("DOMContentLoaded event received");
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
        reset,
        updateUI // Export updateUI for manual refreshes if needed
    };
})();

// Make module available globally
window.Game = Game;


// Function to add highlighting feature to the game
(function() {
    // Add CSS for highlighting
    const style = document.createElement('style');
    style.textContent = `
        .sudoku-cell.number-highlighted {
            background-color: rgba(135, 206, 250, 0.4) !important; /* Light blue highlight */
            box-shadow: inset 0 0 0 2px #2196F3; /* Blue border */
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Track the currently highlighted number
    let highlightedNumber = null;
    
    // Function to highlight all cells with a specific number
    function highlightNumberCells(number) {
        // Clear any existing highlights
        clearHighlights();
        
        if (!number || number === highlightedNumber) {
            highlightedNumber = null;
            return;
        }
        
        highlightedNumber = number;
        
        // Get the board element
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) return;
        
        // Get all cells
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        
        // Highlight cells with the matching number
        cells.forEach(cell => {
            // Check if the cell contains the number
            // We need to check both text content and if it has a tower with that number
            const cellText = cell.textContent.trim();
            
            if (cellText === number.toString() || cellText === `${number}️⃣`) {
                cell.classList.add('number-highlighted');
            } else {
                // Check for towers (might have additional elements inside)
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                // If we have access to the tower data directly
                if (window.TowersModule && typeof TowersModule.getTowerAt === 'function') {
                    const tower = TowersModule.getTowerAt(row, col);
                    if (tower && tower.type == number) {
                        cell.classList.add('number-highlighted');
                    }
                }
            }
        });
    }
    
    // Function to clear all highlights
    function clearHighlights() {
        const highlightedCells = document.querySelectorAll('.sudoku-cell.number-highlighted');
        highlightedCells.forEach(cell => {
            cell.classList.remove('number-highlighted');
        });
    }
    
    // Override the tower selection event
    // First, store the original event listeners
    const towerOptions = document.querySelectorAll('.tower-option');
    
    // Remove existing event listeners and add new ones
    towerOptions.forEach(option => {
        // Clone the element to remove all event listeners
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        // Add our new event listener
        newOption.addEventListener('click', function() {
            const towerType = this.dataset.towerType;
            const cost = TowersModule.getTowerCost(towerType);
            
            // Remove selected class from all options
            towerOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Select the tower in the game logic
            PlayerModule.selectTower(towerType);
            
            // Show status message
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                `Selected ${towerType === 'special' ? 'Special' : towerType} Tower. Cost: ${cost}`);
            
            // Highlight matching numbers
            if (towerType !== 'special') {
                highlightNumberCells(parseInt(towerType));
            } else {
                clearHighlights();
            }
        });
    });
    
    // Also update the board when new towers are placed
    EventSystem.subscribe(GameEvents.TOWER_PLACED, function(tower) {
        if (highlightedNumber && tower.type == highlightedNumber) {
            // Update highlights after a brief delay to ensure the DOM is updated
            setTimeout(() => highlightNumberCells(highlightedNumber), 50);
        }
    });
    
    // Update highlights when the board is updated (such as after placing a tower)
    const originalUpdateBoard = Game.updateBoard || window.updateBoard;
    if (typeof originalUpdateBoard === 'function') {
        Game.updateBoard = function() {
            originalUpdateBoard.apply(this, arguments);
            // Reapply highlighting after board update
            if (highlightedNumber) {
                highlightNumberCells(highlightedNumber);
            }
        };
    }
    
    console.log("Number highlighting feature installed successfully!");
})();


/**
 * Comprehensive fix for incorrect tower visuals
 * This addresses issues with the cell background color and X marker
 */
(function() {
    // Add stronger CSS for the incorrect tower indicators
    const style = document.createElement('style');
    style.textContent = `
        /* Force all existing incorrect tower styles to be overridden */
        .sudoku-cell.incorrect-tower {
            background-color: rgba(255, 0, 0, 0.6) !important;
            box-shadow: inset 0 0 0 2px #ff0000 !important;
            z-index: 5 !important;
        }
        
        /* Reset any hover effects that might override our styling */
        .sudoku-cell.incorrect-tower:hover {
            background-color: rgba(255, 0, 0, 0.7) !important;
        }
        
        /* Make X mark more visible */
        .incorrect-marker {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            font-size: 2em !important;
            color: #ff0000 !important;
            font-weight: bold !important;
            pointer-events: none !important;
            z-index: 100 !important;
            text-shadow: 2px 2px 3px white, -2px -2px 3px white, 2px -2px 3px white, -2px 2px 3px white !important;
        }
    `;
    document.head.appendChild(style);
    
    // Directly override the updateBoard function in Game module
    if (window.Game && typeof window.Game.updateBoard === 'function') {
        const originalUpdateBoard = window.Game.updateBoard;
        
        window.Game.updateBoard = function() {
            // Call original function
            originalUpdateBoard.apply(this, arguments);
            
            // Direct manipulation after board update
            setTimeout(() => {
                applyIncorrectTowerIndicators();
            }, 10);
        };
    }
    
    // Create a function to apply incorrect tower indicators
    function applyIncorrectTowerIndicators() {
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) return;
        
        // First, clear all indicators
        const allCells = boardElement.querySelectorAll('.sudoku-cell');
        allCells.forEach(cell => {
            cell.classList.remove('incorrect-tower');
            const xMark = cell.querySelector('.incorrect-marker');
            if (xMark) xMark.remove();
        });
        
        // Get all towers
        if (!window.TowersModule || typeof window.TowersModule.getTowers !== 'function') return;
        
        const towers = window.TowersModule.getTowers();
        
        // Apply indicators to incorrect towers
        towers.forEach(tower => {
            if (tower.isCorrect === false) {
                const cell = boardElement.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                if (cell) {
                    // Apply incorrect tower class
                    cell.classList.add('incorrect-tower');
                    
                    // Add X mark
                    if (!cell.querySelector('.incorrect-marker')) {
                        const xMark = document.createElement('div');
                        xMark.className = 'incorrect-marker';
                        xMark.textContent = '❌';
                        cell.appendChild(xMark);
                    }
                }
            }
        });
    }
    
    // Hook into tower placement event
    EventSystem.subscribe(GameEvents.TOWER_PLACED, function(tower) {
        setTimeout(() => {
            applyIncorrectTowerIndicators();
        }, 50);
    });
    
    // Apply on cell click
    const sudokuBoard = document.getElementById('sudoku-board');
    if (sudokuBoard) {
        const originalClickHandler = sudokuBoard.onclick;
        
        sudokuBoard.onclick = function(event) {
            // Call original handler if it exists
            if (typeof originalClickHandler === 'function') {
                originalClickHandler.apply(this, arguments);
            }
            
            // Apply our indicators after a short delay
            setTimeout(() => {
                applyIncorrectTowerIndicators();
            }, 50);
        };
    }
    
    // Apply on game init
    EventSystem.subscribe(GameEvents.GAME_INIT, function() {
        setTimeout(() => {
            applyIncorrectTowerIndicators();
        }, 500);
    });
    
    // Apply on wave complete
    EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
        setTimeout(() => {
            applyIncorrectTowerIndicators();
        }, 200);
    });
    
    // Apply immediately
    setTimeout(() => {
        applyIncorrectTowerIndicators();
    }, 100);
    
    console.log("Comprehensive incorrect tower visual fix applied!");
})();