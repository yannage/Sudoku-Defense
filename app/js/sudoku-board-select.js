/**
 * Sudoku Cell Selection System - Fixed Version
 * 
 * This version fixes the issue where clicking a new cell immediately places
 * the previously selected number.
 */

(function() {
  // Track the currently selected cell
  let selectedCell = null;

  // Add required styles for selection system
  function addStyles() {
    // Check if styles are already added
    if (document.getElementById('cell-selection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'cell-selection-styles';
    style.textContent = `
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
    `;
    document.head.appendChild(style);
  }

  /**
   * Clear tower selection from PlayerModule and UI
   * This is the key fix - we ensure no tower is selected after placement
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
   * Enhance the existing cell click handler
   * This preserves the original tower placement but adds cell selection
   */
  function enhanceCellClickHandler() {
    // Get all sudoku cells
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      // Remove existing click listener by cloning
      const newCell = cell.cloneNode(true);
      cell.parentNode.replaceChild(newCell, cell);
      
      // Add our enhanced click handler
      newCell.addEventListener('click', function(event) {
        const row = parseInt(this.dataset.row);
        const col = parseInt(this.dataset.col);
        
        // Get current tower and path information
        const existingTower = TowersModule.getTowerAt(row, col);
        const isPathCell = BoardManager.getPathCells().has(`${row},${col}`);
        const isFixed = BoardManager.getFixedCells()[row][col];
        
        // If the cell already has a tower, use the original behavior (show tower info)
        if (existingTower) {
          // Handle existing tower click - show info or upgrade options
          if (window.Game && typeof Game.showTowerInfo === 'function') {
            Game.showTowerInfo(existingTower);
          } else if (window.showTowerInfo) {
            window.showTowerInfo(existingTower);
          }
          clearCellSelection();
          return;
        }
        
        // If it's a path cell or fixed cell, just clear selection
        if (isPathCell || isFixed) {
          clearCellSelection();
          return;
        }
        
        // Check for tower selection mode vs cell selection mode
        const selectedTower = PlayerModule.getSelectedTower();
        
        if (selectedTower) {
          // Tower selection mode - use original tower placement logic
          const newTower = TowersModule.createTower(selectedTower, row, col);
          
          // If tower placement successful, update the UI
          if (newTower) {
            if (window.Game && typeof Game.updateUI === 'function') {
              Game.updateUI();
            }
            if (window.Game && typeof Game.updateBoard === 'function') {
              Game.updateBoard();
            }
            
            // Key fix: Clear the tower selection after placing
            clearTowerSelection();
          }
          
          // Clear cell selection after tower placement
          clearCellSelection();
        } else {
          // Cell selection mode - show possible values
          selectCell(row, col);
        }
      });
    });
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
   * Enhance tower option click handling for cell selection mode
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
        
        // Remove selected class from all options
        document.querySelectorAll('.tower-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        this.classList.add('selected');
        
        // Select the tower in the PlayerModule
        PlayerModule.selectTower(towerType);
        
        // Show status message
        EventSystem.publish(GameEvents.STATUS_MESSAGE, 
          `Selected ${towerType === 'special' ? 'Special' : towerType} Tower. Cost: ${cost}`);
        
        // If a cell is selected and this is a valid option, place the tower
        if (selectedCell && this.classList.contains('valid-for-cell')) {
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
            
            // Key fix: Clear the tower selection after placing
            clearTowerSelection();
            
            // Clear the selection after placing
            clearCellSelection();
          }
        } else if (selectedCell && this.classList.contains('invalid-for-cell')) {
          // If an invalid number is clicked with a cell selected, show warning
          EventSystem.publish(GameEvents.STATUS_MESSAGE, 
            `${towerType} is not a valid number for this cell based on Sudoku rules.`);
        } else {
          // Normal tower selection mode - clear cell selection
          clearCellSelection();
        }
        
        // Apply number highlighting (from original tower selection code)
        if (towerType !== 'special' && !isNaN(parseInt(towerType))) {
          if (window.highlightNumberCells) {
            highlightNumberCells(parseInt(towerType));
          }
        } else {
          if (window.clearHighlights) {
            clearHighlights();
          }
        }
      });
    });
  }

  /**
   * Add cancel selection on document click
   * This allows players to deselect by clicking elsewhere
   */
  function addDocumentClickHandler() {
    document.addEventListener('click', function(event) {
      // If the click is outside the sudoku board and tower options, clear selection
      const boardElement = document.getElementById('sudoku-board');
      const towerSelection = document.getElementById('tower-selection');
      
      // Check if event target is not part of these elements
      if (boardElement && towerSelection) {
        if (!boardElement.contains(event.target) && !towerSelection.contains(event.target)) {
          clearCellSelection();
        }
      }
    });
  }

  /**
   * Make sure cell selection system gets reinitialized after board changes
   */
  function setupReinitializationHandlers() {
    // Re-initialize when a new puzzle is generated
    EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
      setTimeout(enhanceCellClickHandler, 200);
    });
    
    // Re-initialize when a tower is placed or removed
    EventSystem.subscribe(GameEvents.TOWER_PLACED, function() {
      setTimeout(enhanceCellClickHandler, 200);
      
      // Also clear tower selection after tower placement
      clearTowerSelection();
    });
    
    EventSystem.subscribe(GameEvents.TOWER_REMOVED, function() {
      setTimeout(enhanceCellClickHandler, 200);
    });
    
    // Re-initialize when game board is updated
    if (window.Game && Game.updateBoard) {
      const originalUpdateBoard = Game.updateBoard;
      Game.updateBoard = function() {
        originalUpdateBoard.apply(this, arguments);
        setTimeout(enhanceCellClickHandler, 200);
      };
    }
  }

  /**
   * Initialize the cell selection system
   */
  function init() {
    console.log("Initializing cell selection system (fixed version)");
    
    // Add required styles
    addStyles();
    
    // Enhance cell click handling
    enhanceCellClickHandler();
    
    // Enhance tower option click handlers
    enhanceTowerOptionClickHandlers();
    
    // Add document click handler for canceling selection
    addDocumentClickHandler();
    
    // Set up reinitialization handlers for board changes
    setupReinitializationHandlers();
    
    // Add keyboard shortcut (Escape) to clear selection
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        clearCellSelection();
        
        // Also clear tower selection when pressing Escape
        clearTowerSelection();
      }
    });
    
    console.log("Cell selection system initialized (fixed version)");
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

  // Make some functions available globally for debugging and external use
  window.cellSelectionSystem = {
    init: init,
    selectCell: selectCell,
    clearSelection: clearCellSelection,
    clearTowerSelection: clearTowerSelection,
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