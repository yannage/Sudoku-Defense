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
        // Fall back to BoardManager if BoardManager isn't available
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
    /**
 * Fix for the reset() function in game.js
 * This is causing the "SudokuModule is not defined" error
 */
function reset() {
    console.log("Game reset started");
    
    // Stop the game loop
    stop();
    
    // Clear the board
    clearBoard();
    
    // Reset all modules explicitly
    PlayerModule.reset();
    
    // Use BoardManager instead of SudokuModule
    if (window.BoardManager && typeof BoardManager.generatePuzzle === 'function') {
        BoardManager.generatePuzzle();
    } else {
        console.warn("BoardManager not available for puzzle generation!");
    }
    
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
        if (window.PixiBoard && typeof PixiBoard.updateEnemySprite === 'function') {
            // Pixi sprites updated during enemy movement
            return;
        }

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
        
        // Use sprite instead of emoji
        // Use sprite instead of emoji
const sprite = document.createElement('div');
sprite.className = 'enemy-sprite';
if (enemy.spriteClass) {
    sprite.classList.add(enemy.spriteClass);
}

// Fix for alignment: adjust scale and position
const scale = cellSize / 256;
sprite.style.setProperty('--enemy-scale', scale);
sprite.style.position = 'absolute';
sprite.style.left = `${(cellSize - 256 * scale) / 2}px`;
sprite.style.top = `${(cellSize - 288 * scale) / 2}px`;

enemyElement.appendChild(sprite);
        
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
        
        // Initialize Pixi board for rendering
        if (window.PixiBoard && typeof PixiBoard.init === 'function') {
            PixiBoard.init({ cellSize: cellSize, onCellClick: handleCellClick });
        }
        
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

  const board = BoardManager.getBoard();
  const fixedCells = BoardManager.getFixedCells();
  const pathCells = BoardManager.getPathCells();
  const isWavePhase = Game.displayMode === 'sprites';

  if (window.PixiBoard && typeof PixiBoard.renderBoard === 'function') {
    PixiBoard.renderBoard(board, fixedCells, pathCells, TowersModule.getTowers(), isWavePhase);
    return;
  }

  const boardElement = document.getElementById("sudoku-board");
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cellElement = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
      if (!cellElement) continue;
      
      const value = board[row][col];
      const isFixed = fixedCells[row][col];
      const isPath = pathCells.has(`${row},${col}`);
      const tower = TowersModule.getTowerAt(row, col);
      
      // Reset content and class
      cellElement.textContent = '';
      cellElement.innerHTML = '';
      cellElement.className = 'sudoku-cell';
      cellElement.classList.remove('path', 'dirt', 'prewave-path', 'prewave', 'grass', 'dark-grass', 'tower-number');
      
      // --- WAVE PHASE ---
      if (isWavePhase) {
        if (isPath) {
          cellElement.classList.add('dirt'); // brown dirt path
        } else if (isFixed) {
          cellElement.classList.add('dark-grass'); // fixed cells = dark grass
        } else {
          cellElement.classList.add('grass'); // default green
        }
        
        if (tower) {
          const sprite = document.createElement('div');
          sprite.classList.add('tower', `tower-${tower.type}`);
          if (tower.level > 1) {
            const levelIndicator = document.createElement('span');
            levelIndicator.className = 'tower-level';
            levelIndicator.textContent = tower.level;
            sprite.appendChild(levelIndicator);
          }
          cellElement.appendChild(sprite);
        }
        
        // --- SUDOKU PHASE ---
      } else {
        if (isPath) {
          cellElement.classList.add('path'); // soft light path
        } else {
          cellElement.classList.add('prewave'); // white
        }
        
        if (isFixed) {
          cellElement.textContent = value;
          cellElement.classList.add('fixed');
        } else if (tower) {
          cellElement.textContent = tower.type;
          cellElement.classList.add('tower-number');
        } else if (value > 0) {
          cellElement.textContent = value;
          cellElement.classList.add('tower-number');
        }
      }
    }
  }
  
  // Optional fix
  if (typeof BoardManager.fixBoardDiscrepancies === 'function') {
    setTimeout(() => BoardManager.fixBoardDiscrepancies(), 50);
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


/**
 * Add a debug button to the UI (optional)
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
  const boardManager = window.BoardManager;
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
    console.log("New Game button clicked - Starting fresh game");
    
    // Use PhaseManager to restart the game from the beginning
    if (window.PhaseManager && typeof PhaseManager.startNewGame === 'function') {
        PhaseManager.startNewGame();
    } else {
        // Fallback to regular reset if PhaseManager not available
        reset();
    }
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
  
/**
 * Handle GameEvents.GAME_OVER by transitioning phases and
 * saving the final score.
 */


EventSystem.subscribe(GameEvents.GAME_OVER, function(data) {
  console.log("Game over event received with score:", data.score);
  
  // Use PhaseManager to handle game over if available
  if (window.PhaseManager && typeof PhaseManager.transitionTo === 'function') {
    PhaseManager.transitionTo(PhaseManager.PHASES.GAME_OVER);
  } else {
    // Fallback to simple alert if PhaseManager is not available
    alert(`Game Over! Final Score: ${data.score}`);
    reset();
  }
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
/**
 * Improved function to apply visual indicators to towers that don't match the solution
 */
function applyIncorrectTowerIndicators() {
    console.log("%c APPLYING INCORRECT TOWER INDICATORS ", "background: purple; color: white;");
    
    const boardElement = document.getElementById('sudoku-board');
    if (!boardElement) {
        console.warn("Board element not found, cannot apply indicators");
        return;
    }
    
    // First, clear all existing incorrect tower indicators
    const allCells = boardElement.querySelectorAll('.sudoku-cell');
    allCells.forEach(cell => {
        cell.classList.remove('incorrect-tower');
        const xMark = cell.querySelector('.incorrect-marker');
        if (xMark) xMark.remove();
    });
    
    // Verify towers module and get towers
    if (!window.TowersModule || typeof TowersModule.getTowers !== 'function') {
        console.error("TowersModule not available!");
        return;
    }
    
    const towers = TowersModule.getTowers();
    console.log(`Found ${towers.length} towers to check`);
    
    // Get solution for comparison
    let solution = null;
    const boardManager = window.BoardManager;
    
    if (boardManager && typeof boardManager.getSolution === 'function') {
        solution = boardManager.getSolution();
    }
    
    if (!solution) {
        console.error("Could not retrieve solution!");
        return;
    }
    
    // Track and mark incorrect towers
    towers.forEach(tower => {
        // Skip special towers
        if (tower.type === 'special') return;
        
        // Convert tower type to number
        const towerValue = parseInt(tower.type);
        
        // Verify tower is a number tower
        if (isNaN(towerValue) || towerValue < 1 || towerValue > 9) return;
        
        // Check if tower matches solution
        const solutionValue = solution[tower.row] && solution[tower.row][tower.col];
        const matchesSolution = towerValue === solutionValue;
        
        console.log(`Tower Check: 
            Position: (${tower.row},${tower.col})
            Tower Value: ${towerValue}
            Solution Value: ${solutionValue}
            Matches Solution: ${matchesSolution}`);
        
        // Find the corresponding cell
        const cell = boardElement.querySelector(
            `.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`
        );
        
        if (cell) {
            // If tower doesn't match solution, add incorrect indicators
            if (!matchesSolution) {
                cell.classList.add('incorrect-tower');
                
                // Add X mark if not already present
                if (!cell.querySelector('.incorrect-marker')) {
                    const xMark = document.createElement('div');
                    xMark.className = 'incorrect-marker';
                    xMark.textContent = '❌';
                    cell.appendChild(xMark);
                    
                    // Add tooltip with correct value
                    cell.title = `Correct value: ${solutionValue}`;
                }
                
                console.log(`%c MARKED CELL AS INCORRECT `, "background: red; color: white;", 
                    `(${tower.row},${tower.col})`);
            }
        }
    });
}

/**
 * Last resort function to handle the tower indicators using direct DOM insertions
 * This can be used if the other approaches aren't working
 */
function emergencyFixTowerIndicators() {
    // Get the board and solution
    const boardElement = document.getElementById('sudoku-board');
    const solution = window.BoardManager && typeof BoardManager.getSolution === 'function'
        ? BoardManager.getSolution() : null;
        
    // If we don't have what we need, abort
    if (!boardElement || !solution || !window.TowersModule || !window.TowersModule.getTowers) {
        console.error("Missing required elements for emergency fix");
        return;
    }
    
    // Get all towers
    const towers = TowersModule.getTowers();
    
    // First remove any existing indicators
    const existingMarkers = document.querySelectorAll('.incorrect-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    document.querySelectorAll('.sudoku-cell').forEach(cell => {
        cell.classList.remove('incorrect-tower');
    });
    
    // Ensure emergency indicator styles are defined in CSS
    
    // Apply indicators using direct DOM manipulation
    towers.forEach(tower => {
        // Skip special towers or ones without a numeric type
        const towerValue = parseInt(tower.type);
        if (isNaN(towerValue) || tower.type === 'special') return;
        
        // Get the solution value
        if (solution[tower.row] && solution[tower.col]) {
            const solutionValue = solution[tower.row][tower.col];
            
            // Check if tower is incorrect
            if (towerValue !== solutionValue) {
                console.log(`Tower at (${tower.row},${tower.col}) is incorrect: ${towerValue} ≠ ${solutionValue}`);
                
                // Try to find the cell in a few different ways
                let cell = null;
                
                // Method 1: Using data attributes
                cell = boardElement.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                
                // Method 2: Using position in grid
                if (!cell && boardElement.children.length >= 81) {
                    const index = tower.row * 9 + tower.col;
                    if (index < boardElement.children.length) {
                        cell = boardElement.children[index];
                    }
                }
                
                // Method 3: Look for the tower's value in content
                if (!cell) {
                    const cells = boardElement.querySelectorAll('.sudoku-cell');
                    cells.forEach(c => {
                        // Check if this cell contains our tower value
                        if (c.textContent.trim() === towerValue.toString()) {
                            // Try to determine if this is our cell by checking nearby content
                            const cellRect = c.getBoundingClientRect();
                            const rowIndex = Math.floor((cellRect.top - boardElement.getBoundingClientRect().top) / (boardElement.clientHeight / 9));
                            const colIndex = Math.floor((cellRect.left - boardElement.getBoundingClientRect().left) / (boardElement.clientWidth / 9));
                            
                            if (rowIndex === tower.row && colIndex === tower.col) {
                                cell = c;
                            }
                        }
                    });
                }
                
                // Apply direct styling if we found the cell
                if (cell) {
                    cell.classList.add('emergency-incorrect');
                    
                    // Add X mark
                    const xMark = document.createElement('div');
                    xMark.className = 'emergency-x-mark';
                    xMark.textContent = '❌';
                    cell.appendChild(xMark);
                    
                    console.log(`Applied emergency indicator to cell at (${tower.row},${tower.col})`);
                } else {
                    console.error(`Could not find cell for tower at (${tower.row},${tower.col})`);
                }
            }
        }
    });
}

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