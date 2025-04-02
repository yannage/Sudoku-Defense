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
    
    // Initialize game settings
    const gameSettings = {
        cellSize: cellSize
    };
    
    // Initialize BoardManager first
    if (window.BoardManager && typeof BoardManager.init === 'function') {
        BoardManager.init(gameSettings);
    } else {
        // Fall back to SudokuModule if BoardManager isn't available
        EventSystem.publish(GameEvents.GAME_INIT, gameSettings);
    }
    
    // Initialize other modules
    PlayerModule.init(gameSettings);
    EnemiesModule.init(gameSettings);
    TowersModule.init(gameSettings);
    
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
        
        // Update completion bonus system if it exists
        if (window.CompletionBonusModule && 
            typeof CompletionBonusModule.checkBoardCompletions === 'function') {
            CompletionBonusModule.checkBoardCompletions();
        }
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
     * MODIFIED: Enemies now follow grid cells exactly
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
            
            // Apply grid cell styling
            enemyElement.style.position = 'absolute';
            enemyElement.style.display = 'flex';
            enemyElement.style.justifyContent = 'center';
            enemyElement.style.alignItems = 'center';
            enemyElement.style.width = `${cellSize}px`;
            enemyElement.style.height = `${cellSize}px`;
            enemyElement.style.fontSize = `${cellSize * 0.6}px`;
            enemyElement.style.zIndex = '10';
            
            // Create health bar
            const healthBar = document.createElement('div');
            healthBar.className = 'enemy-health-bar';
            healthBar.style.position = 'absolute';
            healthBar.style.bottom = '4px';
            healthBar.style.left = '10%';
            healthBar.style.width = '80%';
            healthBar.style.height = '4px';
            healthBar.style.backgroundColor = '#333';
            
            const healthFill = document.createElement('div');
            healthFill.className = 'enemy-health-fill';
            healthFill.style.width = '100%';
            healthFill.style.height = '100%';
            healthFill.style.backgroundColor = '#ff0000';
            
            healthBar.appendChild(healthFill);
            enemyElement.appendChild(healthBar);
            
            // Place at exact position immediately before adding to DOM (prevents flashing)
            const left = enemy.col * cellSize;
            const top = enemy.row * cellSize;
            enemyElement.style.left = `${left}px`;
            enemyElement.style.top = `${top}px`;
            
            // Add to container only after all styles are set
            enemyContainer.appendChild(enemyElement);
        }
        
        // Calculate position based on grid coordinates (with decimal precision for smooth movement)
        const left = enemy.col * cellSize;
        const top = enemy.row * cellSize;
        
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
            // Update enemy position
            enemyElement.style.left = `${left}px`;
            enemyElement.style.top = `${top}px`;
            
            // Update health bar
            const healthFill = enemyElement.querySelector('.enemy-health-fill');
            if (healthFill) {
                const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                healthFill.style.width = `${healthPercent}%`;
            }
        });
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
     * This function has been modified to properly handle path cells with numbers
     */
    function updateBoard() {
    console.log("Updating board display");
    
    // Get board state from BoardManager (or fallback to SudokuModule)
    const board = window.BoardManager ? BoardManager.getBoard() : SudokuModule.getBoard();
    const fixedCells = window.BoardManager ? BoardManager.getFixedCells() : SudokuModule.getFixedCells();
    const pathCells = window.BoardManager ? BoardManager.getPathCells() : SudokuModule.getPathCells();
    
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
            
            // Mark path cells - a cell can be both a path and have a number
            if (pathCells.has(`${row},${col}`)) {
                cellElement.classList.add('path');
            }
            
            // Check for tower
            const tower = TowersModule.getTowerAt(row, col);
            
            if (tower && !pathCells.has(`${row},${col}`)) {
                // Clear existing content
                cellElement.textContent = '';
                
                // Create tower sprite element
                const towerSprite = document.createElement('div');
                towerSprite.classList.add('tower');
                
                if (tower.type === 'special') {
                    towerSprite.classList.add('tower-special');
                } else {
                    towerSprite.classList.add(`tower-${tower.type}`);
                }
                
                // Add level indicator if tower level > 1
                if (tower.level > 1) {
                    const levelIndicator = document.createElement('span');
                    levelIndicator.className = 'tower-level';
                    levelIndicator.textContent = tower.level;
                    towerSprite.appendChild(levelIndicator);
                }
                
                // Append sprite to cell
                cellElement.appendChild(towerSprite);
            }
        }
    }
    
    // Fix any discrepancies between board state and towers
    if (window.BoardManager && typeof BoardManager.fixBoardDiscrepancies === 'function') {
        setTimeout(() => {
            BoardManager.fixBoardDiscrepancies();
        }, 50);
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
    
    /**
 * Set up UI event listeners
 */
function setupUIEventListeners() {
    console.log("Setting up UI event listeners");
    
    // Listen for board events from BoardManager
    if (window.BoardManager) {
  EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function(data) {
    // Update the board when a new puzzle is generated or path changes
    updateBoard();
  });
  
  // If SudokuModule events are still being used elsewhere, forward them
  EventSystem.subscribe('board:updated', function(data) {
    updateBoard();
  });

/**
 * Add a debug button to the UI (optional)
 * Add this to your game.js file in the setupUIEventListeners function
 */
// Add debug solution button for development
function addDebugSolutionButton() {
    // Only add in development environment
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        const gameControls = document.getElementById('game-controls');
        if (!gameControls) return;
        
        const debugButton = document.createElement('button');
        debugButton.id = 'debug-solution-btn';
        debugButton.textContent = 'Show Solution';
        debugButton.style.background = '#ff5722';
        debugButton.style.color = 'white';
        
        // Add click handler
        debugButton.addEventListener('click', function() {
            if (window.debugShowSolution) {
                window.debugShowSolution();
            } else {
                console.log("debugShowSolution function not available");
            }
        });
        
        // Add to controls
        gameControls.appendChild(debugButton);
    }
}

// Call this function after DOM is loaded
setTimeout(addDebugSolutionButton, 1000);



  
}
  
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
  console.log("Start Wave button clicked!");
  
  // Check if path data is available
  const boardManager = window.BoardManager || window.SudokuModule;
  if (boardManager && typeof boardManager.getPathArray === 'function') {
    const path = boardManager.getPathArray();
    console.log("Current path data:", path);
    console.log("Path length:", path ? path.length : 0);
  } else {
    console.error("No path provider available!");
  }
  
  // Check if EnemiesModule and LevelsModule are available
  console.log("EnemiesModule available:", !!window.EnemiesModule);
  console.log("LevelsModule available:", !!window.LevelsModule);
  
  // Call LevelsModule.startWave() to start the wave
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
  
  // Font selector
  const fontSelector = document.getElementById('font-selector');
  if (fontSelector) {
    // Set initial font based on saved preference or default
    let currentFont = localStorage.getItem('sudoku_td_font') || 'font-default';
    document.body.className = currentFont;
    fontSelector.value = currentFont;
    
    fontSelector.addEventListener('change', function() {
      const selectedFont = this.value;
      
      // Remove all font classes from body
      document.body.classList.remove('font-default', 'font-retro', 'font-elegant', 'font-playful', 'font-modern');
      
      // Add selected font class to body
      document.body.classList.add(selectedFont);
      
      // Save preference to localStorage
      localStorage.setItem('sudoku_td_font', selectedFont);
      
      // Update UI to reflect changes
      updateBoard();
      
      EventSystem.publish(GameEvents.STATUS_MESSAGE, `Font style changed to ${selectedFont.replace('font-', '')}`);
    });
  }
  
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
  
  EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function(data) {
    // Update the board when a new puzzle is generated or path changes
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
  
  // Listen for specific path updates
  EventSystem.subscribe('path:updated', function() {
    // Update the board to show the new path
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
        updateUI, // Export updateUI for manual refreshes if needed
        updateBoard // Export updateBoard so it can be called from other modules
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
            
            if (cellText === number.toString() || cellText === `${number}ï¸âƒ£`) {
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
 * Comprehensive fix for incorrect tower visuals with semi-transparent X mark
 * This addresses issues with the cell background color and makes the X mark more subtle
 */
(function() {
    // Add CSS for the incorrect tower indicators with a more subtle X mark
    const style = document.createElement('style');
    style.textContent = `
        /* Force all existing incorrect tower styles to be overridden */
        .sudoku-cell.incorrect-tower {
            background-color: rgba(255, 0, 0, 0.5) !important;
            box-shadow: inset 0 0 0 2px #ff0000 !important;
            z-index: 5 !important;
        }
        
        /* Reset any hover effects that might override our styling */
        .sudoku-cell.incorrect-tower:hover {
            background-color: rgba(255, 0, 0, 0.6) !important;
        }
        
        /* Make X mark semi-transparent so the tower number is still visible */
        .incorrect-marker {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            font-size: 1.6em !important;
            color: rgba(255, 0, 0, 0.25) !important; /* Semi-transparent red */
            pointer-events: none !important;
            z-index: 10 !important;
            text-shadow: none !important; /* Remove text shadow for subtlety */
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
   /**
 * Apply visual indicators to towers that don't match the solution
 */
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
    
    // Apply indicators to towers that don't match the solution
    towers.forEach(tower => {
        // Check if tower doesn't match the solution value
        // This is the critical change - now we check matchesSolution rather than just isCorrect
        if (tower.matchesSolution === false) {
            const cell = boardElement.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
            if (cell) {
                // Apply incorrect tower class for red background
                cell.classList.add('incorrect-tower');
                
                // Add semi-transparent X mark
                if (!cell.querySelector('.incorrect-marker')) {
                    const xMark = document.createElement('div');
                    xMark.className = 'incorrect-marker';
                    xMark.textContent = '❌';
                    cell.appendChild(xMark);
                    
                    // Add tooltip showing correct value if available
                    if (tower.solutionValue) {
                        cell.title = `Correct value: ${tower.solutionValue}`;
                    }
                }
            }
        }
    });
    
    // Also apply indicators to towers that violate Sudoku rules
    // (This preserves the existing behavior while adding the solution-checking)
    towers.forEach(tower => {
        if (tower.isCorrect === false) {
            const cell = boardElement.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
            if (cell && !cell.classList.contains('incorrect-tower')) {
                // Apply incorrect tower class
                cell.classList.add('incorrect-tower');
                
                // Add semi-transparent X mark if not already added
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
    
    console.log("Comprehensive incorrect tower visual fix applied with semi-transparent X mark!");


// Integrate Tower Animation Module with Game Module
(function() {
    // Ensure the TowerAnimationsModule is loaded after the game starts
    const originalStart = Game.start;
    
    if (typeof originalStart === 'function') {
        Game.start = function() {
            // Call the original start method
            originalStart.apply(this, arguments);
            
            // Initialize the tower animations module
            if (window.TowerAnimationsModule && typeof TowerAnimationsModule.init === 'function') {
                setTimeout(() => {
                    TowerAnimationsModule.init();
                }, 100);
            }
        };
    }
    
    // Make sure projectile container is recreated when the board is cleared
    const originalClearBoard = Game.clearBoard;
    
    if (typeof originalClearBoard === 'function') {
        Game.clearBoard = function() {
            // Call the original clearBoard method
            originalClearBoard.apply(this, arguments);
            
            // Remove projectile container if it exists
            const projectileContainer = document.getElementById('projectile-container');
            if (projectileContainer) {
                projectileContainer.remove();
            }
        };
    }
    
    // Make sure projectile positions are updated when the board size changes
    window.addEventListener('resize', function() {
        if (window.TowerAnimationsModule && typeof TowerAnimationsModule.init === 'function') {
            TowerAnimationsModule.init();
        }
    });
    
    console.log("Tower attack animations integration complete!");
})();
})();