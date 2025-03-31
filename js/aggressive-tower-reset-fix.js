/**
 * aggressive-tower-reset-fix.js - Forces a complete reset of towers when a new puzzle is generated
 * Add this file to your HTML after all other scripts
 */

(function() {
    console.log("Applying aggressive tower reset fix...");

    // Only proceed if required modules exist
    if (!window.SudokuModule || !window.Game) {
        console.error("Required modules not found! Cannot apply tower reset fix.");
        return;
    }

    // Create a forceful board clear function that doesn't rely on TowersModule
    function forceFullBoardClear() {
        console.log("AGGRESSIVE RESET: Performing full board clear");
        
        // Get the Sudoku board element
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) {
            console.error("Board element not found!");
            return;
        }
        
        // Get all cells
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        
        // Clear each cell (remove tower elements)
        cells.forEach(cell => {
            // Get original cell data
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Get current board value from SudokuModule
            const boardValue = window.SudokuModule.getBoard()[row][col];
            const isFixed = window.SudokuModule.getFixedCells()[row][col];
            const isPath = window.SudokuModule.getPathCells().has(`${row},${col}`);
            
            // Clear the cell content (which includes any towers)
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
            
            // Reset class list (keeping only essential classes)
            const originalClasses = cell.className.split(' ').filter(c => c === 'sudoku-cell');
            cell.className = originalClasses.join(' ');
            
            // Re-add fixed class if needed
            if (isFixed) {
                cell.classList.add('fixed');
            }
            
            // Re-add path class if needed
            if (isPath) {
                cell.classList.add('path');
            }
            
            // If this is a fixed cell, restore its text value
            if (isFixed && boardValue > 0) {
                cell.textContent = boardValue.toString();
            } else {
                cell.textContent = '';
            }
        });
        
        // Reset TowersModule internal state if available
        if (window.TowersModule && typeof TowersModule.init === 'function') {
            TowersModule.init();
        }
        
        console.log("AGGRESSIVE RESET: Full board clear completed");
    }

    // Hook into SUDOKU_COMPLETE event
    EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
        console.log("AGGRESSIVE RESET: SUDOKU_COMPLETE event detected");
        
        // Add a delay to ensure the event is processed
        setTimeout(forceFullBoardClear, 100);
    });
    
    // Also hook into the original generatePuzzle function
    const originalGeneratePuzzle = SudokuModule.generatePuzzle;
    SudokuModule.generatePuzzle = function() {
        console.log("AGGRESSIVE RESET: Clearing before generating new puzzle");
        
        // Clear the board first
        forceFullBoardClear();
        
        // Call the original function
        originalGeneratePuzzle.apply(this, arguments);
        
        // Force a second board update after the new puzzle is generated
        setTimeout(() => {
            console.log("AGGRESSIVE RESET: Forcing board update after puzzle generation");
            if (Game && typeof Game.updateBoard === 'function') {
                Game.updateBoard();
            }
        }, 100);
    };
    
    // Also override the Game's updateBoard function to ensure proper display
    const originalUpdateBoard = Game.updateBoard;
    Game.updateBoard = function() {
        // Call original function
        originalUpdateBoard.apply(this, arguments);
        
        // Add a small additional cleanup for any leftover tower visuals
        const boardElement = document.getElementById('sudoku-board');
        if (boardElement) {
            const cells = boardElement.querySelectorAll('.sudoku-cell');
            
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                // Get current board state
                const boardValue = SudokuModule.getBoard()[row][col];
                const isFixed = SudokuModule.getFixedCells()[row][col];
                const isPath = SudokuModule.getPathCells().has(`${row},${col}`);
                
                // If this is a path or empty cell, it shouldn't have tower elements
                if (isPath || boardValue === 0) {
                    // Check for tower elements (div with class containing "tower")
                    const towerElements = cell.querySelectorAll('div[class*="tower"]');
                    if (towerElements.length > 0) {
                        console.log(`AGGRESSIVE RESET: Cleaning up leftover tower at (${row},${col})`);
                        towerElements.forEach(el => el.remove());
                    }
                }
            });
        }
    };
    
    // Add a manual reset function for debugging
    window.forceResetBoard = forceFullBoardClear;

    console.log("Aggressive tower reset fix applied successfully!");
})();