/**
 * enhanced-sudoku-fix.js - Comprehensive fix for Sudoku completion and tower placement issues
 * This script addresses both completion detection and tower persistence problems
 */

(function() {
    console.log("Applying enhanced Sudoku fix...");

    // Only proceed if required modules exist
    if (!window.SudokuModule || !window.TowersModule) {
        console.error("Required modules not found! Cannot apply fix.");
        return;
    }

    // PART 1: Fix tower placement and persistence
    // -----------------------------------------------
    
    // Override the tower creation function to ensure proper Sudoku board updates
    const originalCreateTower = TowersModule.createTower;
    TowersModule.createTower = function(type, row, col) {
        console.log(`ENHANCED FIX: Creating tower type ${type} at (${row}, ${col})`);
        
        // Call original function
        const tower = originalCreateTower.call(this, type, row, col);
        
        if (tower) {
            // Ensure the board is updated with the tower value
            const board = SudokuModule.getBoard();
            
            // Directly set the board value to match the tower type
            if (board && board[row] && typeof board[row][col] !== 'undefined') {
                const currentValue = board[row][col];
                
                if (currentValue !== parseInt(type)) {
                    console.log(`ENHANCED FIX: Fixing board value at (${row}, ${col}) from ${currentValue} to ${type}`);
                    board[row][col] = parseInt(type);
                    
                    // Also make sure this change is reflected in the Sudoku module's internal board
                    if (typeof SudokuModule.setCellValue === 'function') {
                        console.log(`ENHANCED FIX: Calling setCellValue to ensure consistency`);
                        SudokuModule.setCellValue(row, col, parseInt(type));
                    }
                    
                    // Update UI immediately
                    if (window.Game && typeof Game.updateBoard === 'function') {
                        Game.updateBoard();
                    }
                }
            }
            
            // Force a completion check after tower placement
            setTimeout(() => {
                if (typeof SudokuModule.checkUnitCompletion === 'function') {
                    console.log("ENHANCED FIX: Forcing completion check after tower placement");
                    SudokuModule.checkUnitCompletion();
                }
            }, 100);
        }
        
        return tower;
    };

    // PART 2: Fix Sudoku completion detection
    // -----------------------------------------------
    
    // Override the isComplete function with a more robust implementation
    SudokuModule.isComplete = function() {
        console.log("ENHANCED FIX: Running robust isComplete() function");
        
        const board = this.getBoard();
        const pathCells = this.getPathCells();
        
        // Print board and path cells for debugging
        console.log("Current board state:", JSON.stringify(board));
        console.log("Path cells:", Array.from(pathCells).join(", "));
        
        // Check 1: All non-path cells must be filled
        const emptyCells = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Skip path cells
                if (pathCells.has(`${row},${col}`)) {
                    continue;
                }
                
                // Check if the cell is empty
                if (board[row][col] === 0) {
                    emptyCells.push([row, col]);
                }
            }
        }
        
        if (emptyCells.length > 0) {
            console.log(`ENHANCED FIX: Found ${emptyCells.length} empty cells:`, emptyCells);
            return false;
        }
        
        console.log("ENHANCED FIX: All non-path cells are filled");
        
        // Check 2: Each row must have valid Sudoku values (excluding path cells)
        for (let row = 0; row < 9; row++) {
            const values = new Set();
            const nonPathCellsInRow = [];
            
            for (let col = 0; col < 9; col++) {
                if (!pathCells.has(`${row},${col}`)) {
                    nonPathCellsInRow.push([row, col, board[row][col]]);
                    values.add(board[row][col]);
                }
            }
            
            // If there are non-path cells in this row, check for valid values
            if (nonPathCellsInRow.length > 0) {
                // Check that we have the right number of unique values
                if (values.size !== nonPathCellsInRow.length) {
                    console.log(`ENHANCED FIX: Row ${row} has invalid values:`, 
                                nonPathCellsInRow.map(cell => cell[2]).join(', '));
                    return false;
                }
                
                // Make sure all values are in the range 1-9
                for (const value of values) {
                    if (value < 1 || value > 9) {
                        console.log(`ENHANCED FIX: Row ${row} has invalid value: ${value}`);
                        return false;
                    }
                }
            }
        }
        
        // Check 3: Each column must have valid Sudoku values (excluding path cells)
        for (let col = 0; col < 9; col++) {
            const values = new Set();
            const nonPathCellsInCol = [];
            
            for (let row = 0; row < 9; row++) {
                if (!pathCells.has(`${row},${col}`)) {
                    nonPathCellsInCol.push([row, col, board[row][col]]);
                    values.add(board[row][col]);
                }
            }
            
            // If there are non-path cells in this column, check for valid values
            if (nonPathCellsInCol.length > 0) {
                // Check that we have the right number of unique values
                if (values.size !== nonPathCellsInCol.length) {
                    console.log(`ENHANCED FIX: Column ${col} has invalid values:`, 
                                nonPathCellsInCol.map(cell => cell[2]).join(', '));
                    return false;
                }
                
                // Make sure all values are in the range 1-9
                for (const value of values) {
                    if (value < 1 || value > 9) {
                        console.log(`ENHANCED FIX: Column ${col} has invalid value: ${value}`);
                        return false;
                    }
                }
            }
        }
        
        // Check 4: Each 3x3 box must have valid Sudoku values (excluding path cells)
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const values = new Set();
                const nonPathCellsInBox = [];
                
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const row = boxRow * 3 + i;
                        const col = boxCol * 3 + j;
                        
                        if (!pathCells.has(`${row},${col}`)) {
                            nonPathCellsInBox.push([row, col, board[row][col]]);
                            values.add(board[row][col]);
                        }
                    }
                }
                
                // If there are non-path cells in this box, check for valid values
                if (nonPathCellsInBox.length > 0) {
                    // Check that we have the right number of unique values
                    if (values.size !== nonPathCellsInBox.length) {
                        console.log(`ENHANCED FIX: Box ${boxRow},${boxCol} has invalid values:`, 
                                    nonPathCellsInBox.map(cell => cell[2]).join(', '));
                        return false;
                    }
                    
                    // Make sure all values are in the range 1-9
                    for (const value of values) {
                        if (value < 1 || value > 9) {
                            console.log(`ENHANCED FIX: Box ${boxRow},${boxCol} has invalid value: ${value}`);
                            return false;
                        }
                    }
                }
            }
        }
        
        // If we passed all checks, the Sudoku is complete and valid
        console.log("ENHANCED FIX: Sudoku puzzle is COMPLETE!");
        return true;
    };

    // PART 3: Fix checkUnitCompletion to properly trigger SUDOKU_COMPLETE event
    // -------------------------------------------------------------------------
    
    // Override the checkUnitCompletion function to ensure it correctly triggers completion events
    const originalCheckUnitCompletion = SudokuModule.checkUnitCompletion;
    SudokuModule.checkUnitCompletion = function() {
        console.log("ENHANCED FIX: Running enhanced checkUnitCompletion()");
        
        // Call original function if it exists
        if (originalCheckUnitCompletion) {
            originalCheckUnitCompletion.call(this);
        }
        
        // Check if the board is complete
        const isComplete = this.isComplete();
        
        // If complete, trigger the SUDOKU_COMPLETE event
        if (isComplete) {
            console.log("ENHANCED FIX: Sudoku is complete! Triggering SUDOKU_COMPLETE event");
            
            // To avoid duplicate events, check if we've triggered this recently
            if (!window._lastCompletionTime || 
                (Date.now() - window._lastCompletionTime > 5000)) {
                
                window._lastCompletionTime = Date.now();
                EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
            }
        }
    };

    // PART 4: Fix handleCellClick to ensure tower placement updates the board
    // ----------------------------------------------------------------------
    
    // Override the Game.handleCellClick function if it exists
    if (window.Game && typeof Game.handleCellClick === 'function') {
        const originalHandleCellClick = Game.handleCellClick;
        
        Game.handleCellClick = function(row, col) {
            console.log(`ENHANCED FIX: Cell clicked at (${row}, ${col})`);
            
            // Call original function
            originalHandleCellClick.call(this, row, col);
            
            // Force update the board display
            if (typeof Game.updateBoard === 'function') {
                console.log("ENHANCED FIX: Forcing board update after cell click");
                Game.updateBoard();
            }
            
            // Force a completion check after a short delay to ensure state is updated
            setTimeout(() => {
                if (typeof SudokuModule.checkUnitCompletion === 'function') {
                    console.log("ENHANCED FIX: Forcing completion check after cell click");
                    SudokuModule.checkUnitCompletion();
                }
            }, 200);
        };
    }

    // PART 5: Add diagnostic functions for debugging
    // ---------------------------------------------
    
    // Manual trigger for completion check
    window.testSudokuCompletion = function() {
        console.log("ENHANCED FIX: Manual completion check triggered");
        const result = SudokuModule.isComplete();
        console.log("Completion result:", result);
        
        if (result) {
            console.log("ENHANCED FIX: Manually triggering SUDOKU_COMPLETE event");
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        }
        
        return result;
    };
    
    // Function to show the board state
    window.showBoardState = function() {
        const board = SudokuModule.getBoard();
        const pathCells = Array.from(SudokuModule.getPathCells());
        const towers = TowersModule.getTowers();
        
        console.log("Current Board State:");
        console.table(board);
        console.log("Path Cells:", pathCells);
        console.log("Towers:", towers);
        
        // Find discrepancies between board and towers
        const discrepancies = [];
        
        for (const tower of towers) {
            const row = tower.row;
            const col = tower.col;
            const towerType = parseInt(tower.type);
            
            if (!isNaN(towerType) && board[row][col] !== towerType) {
                discrepancies.push({
                    position: [row, col],
                    boardValue: board[row][col],
                    towerType: towerType
                });
            }
        }
        
        if (discrepancies.length > 0) {
            console.log("Discrepancies between board and towers:", discrepancies);
        } else {
            console.log("No discrepancies found between board and towers");
        }
        
        return { board, pathCells, towers, discrepancies };
    };
    
    // Function to fix discrepancies between board and towers
    window.fixBoardDiscrepancies = function() {
        const { discrepancies } = window.showBoardState();
        
        if (discrepancies.length === 0) {
            console.log("No discrepancies to fix");
            return;
        }
        
        // Fix each discrepancy
        for (const disc of discrepancies) {
            const [row, col] = disc.position;
            const towerType = disc.towerType;
            
            console.log(`Fixing discrepancy at (${row}, ${col}): setting board value to ${towerType}`);
            
            // Update the board value
            if (typeof SudokuModule.setCellValue === 'function') {
                SudokuModule.setCellValue(row, col, towerType);
            } else {
                // Direct update if setCellValue is not available
                const board = SudokuModule.getBoard();
                if (board && board[row]) {
                    board[row][col] = towerType;
                }
            }
        }
        
        // Update the board display
        if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
        }
        
        // Check for completion
        if (typeof SudokuModule.checkUnitCompletion === 'function') {
            SudokuModule.checkUnitCompletion();
        }
        
        console.log("Fixed", discrepancies.length, "discrepancies");
        return discrepancies.length;
    };
    
    // Function to directly trigger completion
    window.forceGameCompletion = function() {
        console.log("Forcing game completion");
        
        // Fix any discrepancies first
        window.fixBoardDiscrepancies();
        
        // Trigger completion event
        EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        
        return true;
    };

    console.log("Enhanced Sudoku fix applied successfully!");
})();