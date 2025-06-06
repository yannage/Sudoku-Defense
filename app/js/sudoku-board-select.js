/**
 * Enhanced Sudoku Interaction System
 * Supports both number highlighting and cell analysis modes
 */

(function() {
  // State tracking
  let highlightedNumber = null;
  let selectedCell = null;
  let selectionMode = 'default'; // 'default', 'highlight', or 'analyze'
  
  // UI Elements tracking
  let modeToggleButton = null;
  let modeIndicator = null;

  // Add required styles for the system
  function addStyles() {
    // Check if styles are already added
    if (document.getElementById('sudoku-interaction-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sudoku-interaction-styles';
    style.textContent = `
      /* Number highlighting */
      .sudoku-cell.number-highlighted {
        background-color: rgba(135, 206, 250, 0.4) !important; /* Light blue highlight */
        box-shadow: inset 0 0 0 2px #2196F3 !important; /* Blue border */
        transition: all 0.2s ease;
      }
      
      /* Selected cell highlight */
      .sudoku-cell.cell-selected {
        background-color: rgba(255, 255, 0, 0.3) !important; 
        box-shadow: inset 0 0 0 3px #f9a825 !important;
        transition: all 0.2s ease;
      }
      
      /* Tower options when a cell is selected */
      .tower-option.valid-for-cell {
        opacity: 1;
        cursor: pointer;
        position: relative;
      }
      
      .tower-option.valid-for-cell::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid #4caf50;
        border-radius: 4px;
        pointer-events: none;
        animation: pulse-border 1.5s infinite;
      }
      
      .tower-option.invalid-for-cell {
        opacity: 0.4;
        cursor: not-allowed;
        filter: grayscale(70%);
      }
      
      @keyframes pulse-border {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
        70% { box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
      }
      
      /* Possible values overlay in the cell */
      .possible-values {
        position: absolute;
        top: 2px;
        right: 2px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 11px;
        z-index: 10;
        pointer-events: none;
      }
      
      /* Mode toggle button */
      #sudoku-mode-toggle {
        background-color: #333;
        color: white;
        border: none;
        border-radius: 20px;
        padding: 6px 15px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: background-color 0.3s;
      }
      
      #sudoku-mode-toggle:hover {
        background-color: #444;
      }
      
      #sudoku-mode-toggle.highlight-mode {
        background-color: #2196F3;
      }
      
      #sudoku-mode-toggle.analyze-mode {
        background-color: #4CAF50;
      }
      
      #sudoku-mode-toggle .icon {
        margin-right: 6px;
        font-size: 16px;
      }
      
      /* Mode indicator tooltip */
      #mode-indicator {
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 15px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
      }
      
      #mode-indicator.visible {
        opacity: 1;
      }
      
      /* Keyboard shortcut hint */
      .keyboard-hint {
        margin-left: 5px;
        opacity: 0.7;
        font-size: 12px;
        background-color: rgba(255,255,255,0.2);
        padding: 2px 5px;
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create the mode toggle button and indicator
   */
  function createModeUI() {
    // Create mode toggle button if it doesn't exist
    if (!modeToggleButton) {
      modeToggleButton = document.createElement('button');
      modeToggleButton.id = 'sudoku-mode-toggle';
      modeToggleButton.innerHTML = '<span class="icon">🎯</span> Place Mode <span class="keyboard-hint">Tab</span>';
      const bar = document.getElementById('utility-bar') || document.body;
      bar.appendChild(modeToggleButton);
      
      // Add click handler for mode toggle
      modeToggleButton.addEventListener('click', toggleInteractionMode);
    }
    
    // Create mode indicator if it doesn't exist
    if (!modeIndicator) {
      modeIndicator = document.createElement('div');
      modeIndicator.id = 'mode-indicator';
      document.body.appendChild(modeIndicator);
    }
  }

  /**
   * Toggle between interaction modes (default/highlight/analyze)
   */
  function toggleInteractionMode() {
    // Clear any existing selections
    clearHighlights();
    clearCellSelection();
    
    // Cycle through modes
    switch (selectionMode) {
      case 'default':
        selectionMode = 'analyze';
        modeToggleButton.innerHTML = '<span class="icon">🔍</span> Analyze Mode <span class="keyboard-hint">Tab</span>';
        modeToggleButton.className = 'analyze-mode';
        showModeIndicator('Analyze Mode: Click cells to see possible values');
        break;
        
      case 'analyze':
        selectionMode = 'highlight';
        modeToggleButton.innerHTML = '<span class="icon">🎨</span> Highlight Mode <span class="keyboard-hint">Tab</span>';
        modeToggleButton.className = 'highlight-mode';
        showModeIndicator('Highlight Mode: Click numbers to see all instances on the board');
        break;
        
      case 'highlight':
      default:
        selectionMode = 'default';
        modeToggleButton.innerHTML = '<span class="icon">🎯</span> Place Mode <span class="keyboard-hint">Tab</span>';
        modeToggleButton.className = '';
        showModeIndicator('Place Mode: Click a number then a cell to place it');
        break;
    }
    
    console.log(`Mode switched to: ${selectionMode}`);
  }

  /**
   * Show the mode indicator tooltip briefly
   * @param {string} message - Message to display
   */
  function showModeIndicator(message) {
    if (!modeIndicator) return;
    
    modeIndicator.textContent = message;
    modeIndicator.classList.add('visible');
    
    // Hide after 3 seconds
    setTimeout(() => {
      modeIndicator.classList.remove('visible');
    }, 3000);
  }

  /**
   * Highlight all cells with a specific number
   * @param {number} number - Number to highlight
   */
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

  /**
   * Clear all number highlights
   */
  function clearHighlights() {
    const highlightedCells = document.querySelectorAll('.sudoku-cell.number-highlighted');
    highlightedCells.forEach(cell => {
      cell.classList.remove('number-highlighted');
    });
    highlightedNumber = null;
  }

  /**
   * Select a cell and show possible values
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  function selectCell(row, col) {
    // Clear any existing selection
    clearCellSelection();
    
    // Find the cell element
    const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (!cellElement) return;
    
    // Mark the cell as selected
    cellElement.classList.add('cell-selected');
    
    // Store selected cell info
    selectedCell = { row, col, element: cellElement };
    
    // Get possible values for this cell
    let possibleValues = [];
    if (window.BoardManager && typeof BoardManager.getPossibleValues === 'function') {
      possibleValues = BoardManager.getPossibleValues(row, col);
    } else {
      // Fallback - check valid moves manually
      possibleValues = getPossibleValuesFallback(row, col);
    }
    
    console.log(`Cell [${row},${col}] selected. Possible values:`, possibleValues);
    
    // Show possible values in the number selector
    updateTowerOptions(possibleValues);
    
    // Add a visual indicator showing possible values in the cell
    if (possibleValues.length > 0) {
      const valuesIndicator = document.createElement('div');
      valuesIndicator.className = 'possible-values';
      valuesIndicator.textContent = possibleValues.join(', ');
      cellElement.appendChild(valuesIndicator);
    }
    
    // Announce options to the player
    const message = possibleValues.length > 0 
      ? `Valid numbers for this cell: ${possibleValues.join(', ')}`
      : "No valid numbers for this cell.";
    
    EventSystem.publish(GameEvents.STATUS_MESSAGE, message);
  }

  /**
   * Get possible values for a cell (fallback when BoardManager method isn't available)
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {number[]} Array of valid values
   */
  function getPossibleValuesFallback(row, col) {
    const possibleValues = [];
    const board = window.BoardManager.getBoard();
    
    for (let num = 1; num <= 9; num++) {
      // Check row
      let validForRow = true;
      for (let c = 0; c < 9; c++) {
        if (board[row][c] === num) {
          validForRow = false;
          break;
        }
      }
      
      // Check column
      let validForColumn = true;
      for (let r = 0; r < 9; r++) {
        if (board[r][col] === num) {
          validForColumn = false;
          break;
        }
      }
      
      // Check 3x3 box
      let validForBox = true;
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (board[boxRow + r][boxCol + c] === num) {
            validForBox = false;
            break;
          }
        }
        if (!validForBox) break;
      }
      
      // Add to possible values if valid in all three contexts
      if (validForRow && validForColumn && validForBox) {
        possibleValues.push(num);
      }
    }
    
    return possibleValues;
  }

  /**
   * Clear cell selection
   */
  function clearCellSelection() {
    // Remove selected class from all cells
    document.querySelectorAll('.sudoku-cell.cell-selected').forEach(cell => {
      cell.classList.remove('cell-selected');
      
      // Remove possible values indicator
      const valuesIndicator = cell.querySelector('.possible-values');
      if (valuesIndicator) {
        valuesIndicator.remove();
      }
    });
    
    // Reset number selectors to normal state
    document.querySelectorAll('.tower-option').forEach(option => {
      option.classList.remove('valid-for-cell', 'invalid-for-cell');
    });
    
    // Clear selected cell data
    selectedCell = null;
  }

  /**
   * Update tower options to show which numbers are valid
   * @param {number[]} validValues - Array of valid values
   */
  function updateTowerOptions(validValues) {
    document.querySelectorAll('.tower-option').forEach(option => {
      const towerType = option.getAttribute('data-tower-type');
      
      // Skip the special tower
      if (towerType === 'special') {
        return;
      }
      
      const value = parseInt(towerType);
      if (!isNaN(value)) {
        if (validValues.includes(value)) {
          option.classList.add('valid-for-cell');
          option.classList.remove('invalid-for-cell');
        } else {
          option.classList.add('invalid-for-cell');
          option.classList.remove('valid-for-cell');
        }
      }
    });
  }

  /**
   * Clear tower selection from PlayerModule
   */
  function clearTowerSelection() {
    // Deselect tower in PlayerModule
    if (window.PlayerModule && typeof PlayerModule.selectTower === 'function') {
      PlayerModule.selectTower(null);
    }
    
    // Remove selected class from all tower options
    document.querySelectorAll('.tower-option').forEach(option => {
      option.classList.remove('selected');
    });
  }

  /**
   * Enhanced cell click handler that changes based on mode
   */
  function enhanceCellClickHandler() {
    // Get all sudoku cells
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      // Remove existing click listener by cloning
      const newCell = cell.cloneNode(true);
      cell.parentNode.replaceChild(newCell, cell);
      
      // Add our enhanced handler
      newCell.addEventListener('click', function(event) {
        const row = parseInt(this.dataset.row);
        const col = parseInt(this.dataset.col);
        
        // Get current tower and path information
        const existingTower = TowersModule.getTowerAt(row, col);
        const isPathCell = BoardManager.getPathCells().has(`${row},${col}`);
        const isFixed = BoardManager.getFixedCells()[row][col];
        
        // If the cell already has a tower, show info regardless of mode
        if (existingTower) {
          if (window.Game && typeof Game.showTowerInfo === 'function') {
            Game.showTowerInfo(existingTower);
          }
          clearCellSelection();
          return;
        }
        
        // If it's a path cell or fixed cell, just clear selection
        if (isPathCell || isFixed) {
          clearCellSelection();
          return;
        }
        
        // Handle cell click based on current mode
        switch (selectionMode) {
          case 'analyze':
            // In analyze mode, always show possible values
            selectCell(row, col);
            break;
            
          case 'highlight':
            // In highlight mode, just clear selection
            clearCellSelection();
            break;
            
          case 'default':
          default:
            // Default placement mode - check if a tower is selected
            const selectedTower = PlayerModule.getSelectedTower();
            
            if (selectedTower) {
              // Tower selection mode - place tower
              const newTower = TowersModule.createTower(selectedTower, row, col);
              
              // If tower placement successful, update the UI
              if (newTower) {
                if (window.Game && typeof Game.updateUI === 'function') {
                  Game.updateUI();
                }
                if (window.Game && typeof Game.updateBoard === 'function') {
                  Game.updateBoard();
                }
                
                // If we had a highlighted number, reapply highlighting
                if (highlightedNumber !== null) {
                  setTimeout(() => highlightNumberCells(highlightedNumber), 50);
                }
              }
            } else {
              // No tower selected, show possible values
              selectCell(row, col);
            }
            break;
        }
      });
    });
  }

  /**
   * Enhanced tower option click handler that changes based on mode
   */
  function enhanceTowerOptionClickHandlers() {
    const towerOptions = document.querySelectorAll('.tower-option');
    
    towerOptions.forEach(option => {
      // Clone to remove existing listeners
      const newOption = option.cloneNode(true);
      option.parentNode.replaceChild(newOption, option);
      
      // Add our enhanced handler
      newOption.addEventListener('click', function() {
        const towerType = this.dataset.towerType;
        const cost = TowersModule.getTowerCost(towerType);
        
        // Determine if this is for a selected cell's valid option
        const wasValidForSelection = selectedCell && this.classList.contains('valid-for-cell');
        
        // Remove selected class from all options
        document.querySelectorAll('.tower-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        this.classList.add('selected');
        
        // Handle based on current mode
        switch (selectionMode) {
          case 'highlight':
            // In highlight mode, just highlight and don't select tower
            if (towerType !== 'special' && !isNaN(parseInt(towerType))) {
              highlightNumberCells(parseInt(towerType));
            } else {
              clearHighlights();
            }
            
            // Show info message about highlighting
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
              `Highlighting all ${towerType === 'special' ? 'Special' : towerType} numbers on the board`);
            break;
            
          case 'analyze':
            // In analyze mode, if a cell is selected and this is a valid option, place the tower
            if (wasValidForSelection) {
              // Select the tower in PlayerModule
              PlayerModule.selectTower(towerType);
              
              const row = selectedCell.row;
              const col = selectedCell.col;
              
              // Try to place the tower
              const newTower = TowersModule.createTower(towerType, row, col);
              
              // If successful, update the board
              if (newTower) {
                if (window.Game && typeof Game.updateUI === 'function') {
                  Game.updateUI();
                }
                if (window.Game && typeof Game.updateBoard === 'function') {
                  Game.updateBoard();
                }
                
                // Clear the cell selection
                clearCellSelection();
                
                // Clear tower selection after placement
                clearTowerSelection();
              }
            } else if (selectedCell && this.classList.contains('invalid-for-cell')) {
              // Invalid number warning
              EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                `${towerType} is not a valid number for this cell based on Sudoku rules.`);
            } else {
              // No cell selected, just show info about the number
              if (towerType !== 'special' && !isNaN(parseInt(towerType))) {
                EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                  `Select a cell first to see if ${towerType} can be placed there.`);
              }
            }
            break;
            
          case 'default':
          default:
            // Default placement mode - select tower and optionally highlight
            PlayerModule.selectTower(towerType);
            
            // Show status message
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
              `Selected ${towerType === 'special' ? 'Special' : towerType} Tower. Cost: ${cost}`);
            
            // Also highlight matching numbers if it's a number
            if (towerType !== 'special' && !isNaN(parseInt(towerType))) {
              highlightNumberCells(parseInt(towerType));
            } else {
              clearHighlights();
            }
            
            // If a cell is selected and this is a valid option, place the tower
            if (wasValidForSelection) {
              const row = selectedCell.row;
              const col = selectedCell.col;
              
              // Try to place the tower
              const newTower = TowersModule.createTower(towerType, row, col);
              
              // If successful, update the board
              if (newTower) {
                if (window.Game && typeof Game.updateUI === 'function') {
                  Game.updateUI();
                }
                if (window.Game && typeof Game.updateBoard === 'function') {
                  Game.updateBoard();
                }
                
                // Clear the cell selection
                clearCellSelection();
              }
            }
            break;
        }
      });
    });
  }

  /**
   * Make sure system gets reinitialized after board changes
   */
  function setupReinitializationHandlers() {
    // Re-initialize when a new puzzle is generated
    EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
      setTimeout(function() {
        enhanceCellClickHandler();
        enhanceTowerOptionClickHandlers();
      }, 200);
    });
    
    // Re-initialize when a tower is placed or removed
    EventSystem.subscribe(GameEvents.TOWER_PLACED, function(tower) {
      setTimeout(function() {
        enhanceCellClickHandler();
        
        // Reapply highlighting if needed
        if (highlightedNumber !== null) {
          setTimeout(() => highlightNumberCells(highlightedNumber), 50);
        }
      }, 200);
    });
    
    EventSystem.subscribe(GameEvents.TOWER_REMOVED, function() {
      setTimeout(function() {
        enhanceCellClickHandler();
        enhanceTowerOptionClickHandlers();
      }, 200);
    });
    
    // Re-initialize when game board is updated
    if (window.Game && Game.updateBoard) {
      const originalUpdateBoard = Game.updateBoard;
      Game.updateBoard = function() {
        originalUpdateBoard.apply(this, arguments);
        
        // Reapply highlighting if there was a highlighted number
        if (highlightedNumber !== null) {
          setTimeout(() => highlightNumberCells(highlightedNumber), 50);
        }
      };
    }
  }

  /**
   * Add keyboard shortcuts for mode switching
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
      // Tab key to cycle through modes
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent default Tab behavior
        toggleInteractionMode();
      }
      
      // Escape key to clear selections
      if (event.key === 'Escape') {
        clearCellSelection();
        clearHighlights();
      }
      
      // Number keys 1-9 to select corresponding towers
      if (event.key >= '1' && event.key <= '9' && !event.ctrlKey && !event.altKey) {
        const towerType = event.key;
        const towerOption = document.querySelector(`.tower-option[data-tower-type="${towerType}"]`);
        
        if (towerOption) {
          // Simulate click on the tower option
          towerOption.click();
        }
      }
    });
  }

  /**
   * Initialize the interaction system
   */
  function init() {
    console.log("Initializing Enhanced Sudoku Interaction System");
    
    // Add required styles
    addStyles();
    
    // Create mode toggle UI
    createModeUI();
    
    // Enhance cell click handling
    enhanceCellClickHandler();
    
    // Enhance tower option click handlers
    enhanceTowerOptionClickHandlers();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Set up reinitialization handlers for board changes
    setupReinitializationHandlers();
    
    // Start in default mode and show initial message
    selectionMode = 'default';
    showModeIndicator('Place Mode: Click a number then a cell to place it. Press Tab to change modes');
    
    console.log("Enhanced Sudoku Interaction System initialized successfully");
  }

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization to allow other scripts to load
    setTimeout(init, 1000);
  });

  // Also try to initialize now if the document is already loaded
  if (document.readyState !== 'loading') {
    setTimeout(init, 1000);
  }

  // Make functions available globally for debugging and external use
  window.highlightNumberCells = highlightNumberCells;
  window.clearHighlights = clearHighlights;
  window.selectCell = selectCell;
  window.clearCellSelection = clearCellSelection;
  window.toggleInteractionMode = toggleInteractionMode;
  
  // Additional utility functions for external use
  window.sudokuInteractionSystem = {
    init: init,
    highlightNumber: highlightNumberCells,
    clearHighlights: clearHighlights,
    selectCell: selectCell,
    clearCellSelection: clearCellSelection,
    toggleMode: toggleInteractionMode,
    getCurrentMode: () => selectionMode,
    reinitialize: function() {
      enhanceCellClickHandler();
      enhanceTowerOptionClickHandlers();
    }
  };

  // Try to initialize after key modules are available
  function tryLateInitialization() {
    if (window.BoardManager && window.TowersModule && window.PlayerModule) {
      init();
    } else {
      // Try again in 500ms
      setTimeout(tryLateInitialization, 500);
    }
  }

  // Schedule another initialization attempt
  setTimeout(tryLateInitialization, 2000);
})();