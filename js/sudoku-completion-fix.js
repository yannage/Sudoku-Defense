/**
 * sudoku-completion-fix.js - Hotfix for Sudoku completion detection
 * This patch fixes issues with detecting when the Sudoku puzzle is complete
 * by properly accounting for path cells in the validation logic.
 */

(function() {
    console.log("Applying Sudoku completion detection hotfix...");

    // Only proceed if SudokuModule exists
    if (!window.SudokuModule) {
        console.error("SudokuModule not found! Cannot apply completion detection fix.");
        return;
    }

    // Store the original isComplete function for reference
    const originalIsComplete = SudokuModule.isComplete;

    // Override the isComplete function with our fixed version
    SudokuModule.isComplete = function() {
        console.log("DEBUG - Running patched isComplete() function");
        
        const board = this.getBoard();
        const pathCells = this.getPathCells();
        
        // First check: All non-path cells must be filled
        let emptyCellCount = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
                    emptyCellCount++;
                }
            }
        }
        
        if (emptyCellCount > 0) {
            console.log(`DEBUG - Sudoku Completion Check: ${emptyCellCount} empty cells remaining`);
            return false;
        }
        
        // Check rows, columns, and boxes for valid Sudoku rules
        // For each unit, we only validate the non-path cells
        
        // Check rows
        for (let row = 0; row < 9; row++) {
            const numbers = new Set();
            const validCells = []; // Positions that aren't path cells
            
            for (let col = 0; col < 9; col++) {
                if (!pathCells.has(`${row},${col}`)) {
                    validCells.push([row, col]);
                    if (board[row][col] > 0) {
                        numbers.add(board[row][col]);
                    }
                }
            }
            
            // Check if all non-path cells have unique values
            if (numbers.size !== validCells.length) {
                console.log(`DEBUG - Row ${row} is invalid: ${numbers.size} unique numbers for ${validCells.length} cells`);
                return false;
            }
        }
        
        // Check columns
        for (let col = 0; col < 9; col++) {
            const numbers = new Set();
            const validCells = []; // Positions that aren't path cells
            
            for (let row = 0; row < 9; row++) {
                if (!pathCells.has(`${row},${col}`)) {
                    validCells.push([row, col]);
                    if (board[row][col] > 0) {
                        numbers.add(board[row][col]);
                    }
                }
            }
            
            // Check if all non-path cells have unique values
            if (numbers.size !== validCells.length) {
                console.log(`DEBUG - Column ${col} is invalid: ${numbers.size} unique numbers for ${validCells.length} cells`);
                return false;
            }
        }
        
        // Check 3x3 boxes
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const numbers = new Set();
                const validCells = []; // Positions that aren't path cells
                
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const row = boxRow * 3 + r;
                        const col = boxCol * 3 + c;
                        
                        if (!pathCells.has(`${row},${col}`)) {
                            validCells.push([row, col]);
                            if (board[row][col] > 0) {
                                numbers.add(board[row][col]);
                            }
                        }
                    }
                }
                
                // Check if all non-path cells have unique values
                if (numbers.size !== validCells.length) {
                    console.log(`DEBUG - Box ${boxRow},${boxCol} is invalid: ${numbers.size} unique numbers for ${validCells.length} cells`);
                    return false;
                }
            }
        }
        
        console.log("DEBUG - SUDOKU COMPLETION CHECK: SUCCESS! All validation passed!");
        
        // If we got here, the Sudoku is complete and valid
        return true;
    };

    // Also fix the checkUnitCompletion function to properly account for path cells
    if (typeof SudokuModule.checkUnitCompletion === 'function') {
        const originalCheckCompletion = SudokuModule.checkUnitCompletion;
        
        SudokuModule.checkUnitCompletion = function() {
            console.log("DEBUG - Running patched checkUnitCompletion() function");
            
            // Call the original function first
            originalCheckCompletion.call(this);
            
            // Now check the full puzzle completion
            const isComplete = this.isComplete();
            
            if (isComplete) {
                console.log("DEBUG - Puzzle is complete! Publishing SUDOKU_COMPLETE event");
                EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
            }
        };
    }
    
    // Add a manual trigger function for testing
    window.testSudokuCompletion = function() {
        console.log("Manual completion check triggered");
        const isComplete = SudokuModule.isComplete();
        console.log("Completion result:", isComplete);
        
        if (isComplete) {
            console.log("Manually triggering SUDOKU_COMPLETE event");
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        }
        
        return isComplete;
    };
    
    // Add a helper function to see which cells are still empty
    window.findEmptySudokuCells = function() {
        const board = SudokuModule.getBoard();
        const pathCells = SudokuModule.getPathCells();
        const emptyCells = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
                    emptyCells.push([row, col]);
                }
            }
        }
        
        console.log("Empty cells that need to be filled:", emptyCells);
        return emptyCells;
    };
    
    // Add a function to see all path cells
    window.showPathCells = function() {
        const pathCells = Array.from(SudokuModule.getPathCells());
        console.log("Path cells:", pathCells);
        return pathCells;
    };
    
    // Force check completion when starting a wave
    const originalStartWave = LevelsModule.startWave;
    if (originalStartWave) {
        LevelsModule.startWave = function() {
            // Check completion first
            SudokuModule.checkUnitCompletion();
            
            // Call original function
            return originalStartWave.apply(this, arguments);
        };
    }
    
    console.log("Sudoku completion detection hotfix applied successfully!");
})();