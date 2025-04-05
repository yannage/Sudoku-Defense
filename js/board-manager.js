/**
 * board-manager.js - Centralized board state management system
 * This module serves as the single source of truth for the Sudoku board state
 * and centralizes all board-related functionality.
 */

const BoardManager = (function() {
    // Private variables
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let solution = Array(9).fill().map(() => Array(9).fill(0));
    let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
    let pathCells = new Set(); // Cells that form the enemy path
    let difficulty = 'medium'; // easy, medium, hard
    
    // Track completed units to avoid triggering events multiple times
    let completedRows = new Set();
    let completedColumns = new Set();
    let completedGrids = new Set();
    
    // Difficulty settings (number of cells to reveal)
    const difficultySettings = {
        easy: 40,
        medium: 30,
        hard: 25
    };
    
    /**
     * Initialize the board manager
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        console.log("BoardManager initializing...");
        difficulty = options.difficulty || 'medium';
        
        // Clear completion tracking
        completedRows.clear();
        completedColumns.clear();
        completedGrids.clear();
        
        // Generate a new puzzle
        generatePuzzle();
    }
    
    /**
     * Generate a complete, random Sudoku solution
     * @returns {number[][]} Completed Sudoku grid
     */
    function generateCompleteSolution() {
        // Start with an empty grid
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal 3x3 boxes (these can be filled independently)
        for (let box = 0; box < 3; box++) {
            let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            shuffle(nums);
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    grid[box * 3 + i][box * 3 + j] = nums[i * 3 + j];
                }
            }
        }
        
        // Solve the rest of the puzzle using backtracking
        solveSudoku(grid);
        
        return grid;
    }
    
    /**
     * Check if a number can be placed in a specific position
     * @param {number[][]} grid - The Sudoku grid
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} Whether the number can be placed
     */
    function isValid(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) {
                return false;
            }
        }
        
        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        let boxRow = Math.floor(row / 3) * 3;
        let boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Find an empty cell in the grid
     * @param {number[][]} grid - The Sudoku grid
     * @returns {[number, number]|null} Coordinates of empty cell or null if none found
     */
    function findEmptyCell(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null; // No empty cells
    }
    
    /**
     * Solve the Sudoku grid using backtracking
     * @param {number[][]} grid - The Sudoku grid to solve
     * @returns {boolean} Whether the puzzle was solved
     */
    function solveSudoku(grid) {
        let emptyCell = findEmptyCell(grid);
        if (!emptyCell) return true; // No empty cells left - puzzle solved
        
        const [row, col] = emptyCell;
        
        // Try each number 1-9
        for (let num = 1; num <= 9; num++) {
            if (isValid(grid, row, col, num)) {
                grid[row][col] = num;
                
                if (solveSudoku(grid)) {
                    return true;
                }
                
                grid[row][col] = 0; // Backtrack if the solution doesn't work
            }
        }
        
        return false; // Trigger backtracking
    }
    
    /**
     * Create a puzzle from a complete solution by removing numbers
     * @param {number[][]} solution - Complete Sudoku solution
     * @param {Set<string>} pathCells - Set of cells reserved for the path
     * @param {number} numToReveal - Number of cells to reveal
     * @returns {Object} Board and fixed cells
     */
    function createPuzzleFromSolution(solution, pathCells, numToReveal) {
        // Create copies to work with
        const puzzle = JSON.parse(JSON.stringify(solution));
        const fixed = Array(9).fill().map(() => Array(9).fill(false));
        
        // Create a list of all positions
        let positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        // Shuffle positions
        shuffle(positions);
        
        // Keep track of cells to reveal
        let revealed = 0;
        
        // First, clear all path cells
        for (let pos of pathCells) {
            const [row, col] = pos.split(',').map(Number);
            puzzle[row][col] = 0;
            fixed[row][col] = false;
        }
        
        // Mark cells for revealing
        for (let [row, col] of positions) {
            // Skip path cells
            if (pathCells.has(`${row},${col}`)) {
                continue;
            }
            
            if (revealed < numToReveal) {
                // Keep this cell visible
                fixed[row][col] = true;
                revealed++;
            } else {
                // Hide this cell
                puzzle[row][col] = 0;
                fixed[row][col] = false;
            }
        }
        
        return { puzzle, fixed };
    }
    
    /**
     * Generate a path for enemies to follow
     * Creates a non-overlapping path from a starting point to an end point
     */
    function generateEnemyPath() {
        console.log("BoardManager: Generating enemy path");
        pathCells.clear();
        
        // Only use horizontal and vertical movements to avoid diagonal overlaps
        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, 1]   // right - only move right, never left to prevent overlaps
        ];
        
        // Start at a random position on the left edge
        let startRow = Math.floor(Math.random() * 9);
        let currentRow = startRow;
        let currentCol = 0;
        
        // Choose an end row for the right edge
        let endRow = Math.floor(Math.random() * 9);
        
        // Mark the starting position
        pathCells.add(`${currentRow},${currentCol}`);
        
        // Keep track of visited columns to ensure we always make progress
        const visitedColumns = new Set([0]);
        
        // Generate path until we reach the last column
        while (currentCol < 8) {
            let possibleMoves = [];
            
            // Check each direction
            for (let [dr, dc] of directions) {
                let newRow = currentRow + dr;
                let newCol = currentCol + dc;
                
                // Check if the new position is valid
                if (
                    newRow >= 0 && newRow < 9 && 
                    newCol >= 0 && newCol < 9 && 
                    !pathCells.has(`${newRow},${newCol}`)
                ) {
                    // If we're already at the target column, only allow vertical moves
                    if (currentCol === 7 && newCol > currentCol) {
                        // We've reached column 7, only allow moving to endRow
                        if (newRow === endRow) {
                            possibleMoves = [[dr, dc]];
                            break;
                        }
                    } else {
                        // Otherwise, consider this move
                        possibleMoves.push([dr, dc]);
                    }
                }
            }
            
            // If no valid moves, force a move right
            if (possibleMoves.length === 0) {
                // Try to move right
                let newRow = currentRow;
                let newCol = currentCol + 1;
                
                if (newCol < 9 && !pathCells.has(`${newRow},${newCol}`)) {
                    currentRow = newRow;
                    currentCol = newCol;
                    pathCells.add(`${currentRow},${currentCol}`);
                    visitedColumns.add(currentCol);
                    continue;
                } else {
                    // If we can't move right, try to find any non-visited cell
                    let found = false;
                    for (let r = 0; r < 9; r++) {
                        for (let c = currentCol; c < 9; c++) {
                            if (!pathCells.has(`${r},${c}`)) {
                                // Check if we can connect to this cell without crossing the path
                                if (canConnect(currentRow, currentCol, r, c, pathCells)) {
                                    // Add connecting cells
                                    const connectingCells = getConnectingCells(currentRow, currentCol, r, c);
                                    for (const cell of connectingCells) {
                                        pathCells.add(cell);
                                    }
                                    currentRow = r;
                                    currentCol = c;
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (found) break;
                    }
                    
                    if (!found) {
                        // If still no valid moves, break and use what we have
                        break;
                    }
                    continue;
                }
            }
            
            // Prefer moving toward the end
            let bestMoves = [];
            
            // If we're not in the last column, prioritize moving right
            if (currentCol < 7) {
                // Prefer moving right
                const rightMoves = possibleMoves.filter(([dr, dc]) => dc > 0);
                if (rightMoves.length > 0) {
                    bestMoves = rightMoves;
                } else {
                    // If we can't move right, prefer moving vertically toward endRow
                    const verticalMoves = possibleMoves.filter(([dr, dc]) => dc === 0);
                    if (verticalMoves.length > 0) {
                        const movesTowardEnd = verticalMoves.filter(([dr, dc]) => 
                            (dr > 0 && currentRow < endRow) || (dr < 0 && currentRow > endRow)
                        );
                        
                        bestMoves = movesTowardEnd.length > 0 ? movesTowardEnd : verticalMoves;
                    } else {
                        bestMoves = possibleMoves;
                    }
                }
            } else {
                // In the last column, prioritize getting to endRow
                const verticalMoves = possibleMoves.filter(([dr, dc]) => dc === 0);
                if (verticalMoves.length > 0) {
                    const movesTowardEnd = verticalMoves.filter(([dr, dc]) => 
                        (dr > 0 && currentRow < endRow) || (dr < 0 && currentRow > endRow)
                    );
                    
                    bestMoves = movesTowardEnd.length > 0 ? movesTowardEnd : verticalMoves;
                } else {
                    bestMoves = possibleMoves;
                }
            }
            
            // Choose a move
            const [dr, dc] = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            
            // Move to the new position
            currentRow += dr;
            currentCol += dc;
            pathCells.add(`${currentRow},${currentCol}`);
            
            // Track visited columns
            visitedColumns.add(currentCol);
        }
        
        // If we haven't reached the end row in the last column, add a straight path to it
        if (currentCol === 8 && currentRow !== endRow) {
            // Add a path from current position to the end position
            const step = currentRow < endRow ? 1 : -1;
            for (let r = currentRow + step; step > 0 ? r <= endRow : r >= endRow; r += step) {
                if (!pathCells.has(`${r},${currentCol}`)) {
                    pathCells.add(`${r},${currentCol}`);
                }
            }
        }
        
        // Reset completion tracking when path changes
        completedRows.clear();
        completedColumns.clear();
        completedGrids.clear();
        
        // Convert the path to an array for compatibility with existing code
        const pathArray = Array.from(pathCells).map(pos => pos.split(',').map(Number));
        
        console.log(`BoardManager: Generated enemy path with ${pathArray.length} cells`);
        
        // Publish path update event
        EventSystem.publish('path:updated', pathArray);
        
        // Return the path array
        return pathArray;
    }

    // Export a new method for direct path access
    function exportPath() {
        const pathArray = Array.from(pathCells).map(pos => pos.split(',').map(Number));
        console.log("BoardManager.exportPath:", pathArray);
        return pathArray;
    }
    
    /**
     * Check if we can connect two cells without crossing the existing path
     */
    function canConnect(row1, col1, row2, col2, existingPath) {
        // For simplicity, only allow connecting in a straight line (horizontal or vertical)
        if (row1 !== row2 && col1 !== col2) {
            return false;
        }
        
        // Check if there's a clear path
        if (row1 === row2) {
            // Horizontal path
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            
            for (let c = minCol + 1; c < maxCol; c++) {
                if (existingPath.has(`${row1},${c}`)) {
                    return false;
                }
            }
            return true;
        } else {
            // Vertical path
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            
            for (let r = minRow + 1; r < maxRow; r++) {
                if (existingPath.has(`${r},${col1}`)) {
                    return false;
                }
            }
            return true;
        }
    }
    
    /**
     * Get connecting cells between two points
     */
    function getConnectingCells(row1, col1, row2, col2) {
        const cells = [];
        
        if (row1 === row2) {
            // Horizontal path
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            
            for (let c = minCol + 1; c <= maxCol; c++) {
                cells.push(`${row1},${c}`);
            }
        } else if (col1 === col2) {
            // Vertical path
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            
            for (let r = minRow + 1; r <= maxRow; r++) {
                cells.push(`${r},${col1}`);
            }
        }
        
        return cells;
    }
    
    
/**
 * Generate a random valid Sudoku puzzle
 * Modified to ensure the puzzle is solvable even with path cells
 */
/**
 * Generate a random valid Sudoku puzzle
 * Modified to ensure the puzzle is solvable even with path cells
 */
/**
 * Generate a random valid Sudoku puzzle
 * Modified with a better validation approach
 */
function generatePuzzle() {
    console.log("BoardManager: Generating new Sudoku puzzle...");
    
    // Reset completion tracking
    completedRows.clear();
    completedColumns.clear();
    completedGrids.clear();
    
    let attempts = 0;
    let validPuzzleFound = false;
    
    while (!validPuzzleFound && attempts < 5) {
        attempts++;
        console.log(`BoardManager: Puzzle generation attempt ${attempts}`);
        
        // Generate the enemy path first
        let pathLength = 9; // Start with shorter paths
        if (attempts > 3) {
            // Use an even simpler path on later attempts
            pathLength = 6;
        }
        const pathArray = generateEnemyPath(pathLength);
        
        // Generate a complete solution
        solution = generateCompleteSolution();
        
        // Determine how many cells to reveal based on difficulty
        let cellsToReveal = difficultySettings[difficulty];
        
        // Create a puzzle from the solution
        const { puzzle, fixed } = createPuzzleFromSolution(solution, pathCells, cellsToReveal);
        
        // TEST THE PUZZLE: Check if it's still solvable with backtracking
        validPuzzleFound = isSudokuSolvable(JSON.parse(JSON.stringify(puzzle)));
        
        if (validPuzzleFound) {
            // Set the board and fixed cells
            board = puzzle;
            fixedCells = fixed;
            
            console.log("BoardManager: Valid solvable puzzle generated!");
        } else {
            console.log("BoardManager: Generated puzzle is not solvable with current path, retrying...");
            // Clear path cells for the next attempt
            pathCells.clear();
        }
    }
    
    if (!validPuzzleFound) {
        console.log("BoardManager: Failed to generate a valid puzzle after multiple attempts");
        // Emergency fallback - generate a very simple puzzle with minimal path
        emergencyPuzzleGeneration();
    }
    
    // Count fixed cells for debugging
    let fixedCount = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (fixedCells[row][col]) fixedCount++;
        }
    }
    console.log(`BoardManager: Generated puzzle with ${fixedCount} fixed cells`);
    
    // Notify other modules that the board has been updated
    EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
        board: getBoard(),
        solution: getSolution(),
        fixedCells: getFixedCells(),
        pathCells: getPathArray()
    });
    
    // Remove all towers when a new puzzle is generated
    setTimeout(() => {
        if (window.TowersModule && typeof TowersModule.init === 'function') {
            TowersModule.init();
        }
        // Force a board update to ensure correct display
        if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
        }
    }, 100);
    
    return board;
}

/**
 * Generate a path with a controlled length
 * @param {number} maxLength - Maximum number of cells in the path
 * @returns {Array} Array of path coordinates
 */
function generateEnemyPath(maxLength = 13) {
    console.log("BoardManager: Generating enemy path");
    pathCells.clear();
    
    // Only use horizontal and vertical movements to avoid diagonal overlaps
    const directions = [
        [-1, 0], // up
        [1, 0],  // down
        [0, 1]   // right - only move right, never left to prevent overlaps
    ];
    
    // Start at a random position on the left edge
    let startRow = Math.floor(Math.random() * 9);
    let currentRow = startRow;
    let currentCol = 0;
    
    // Choose an end row for the right edge
    let endRow = Math.floor(Math.random() * 9);
    
    // Mark the starting position
    pathCells.add(`${currentRow},${currentCol}`);
    
    // Generate path until we reach max length or the right edge
    while (pathCells.size < maxLength && currentCol < 8) {
        let possibleMoves = [];
        
        // Check each direction
        for (let [dr, dc] of directions) {
            let newRow = currentRow + dr;
            let newCol = currentCol + dc;
            
            // Check if the new position is valid
            if (
                newRow >= 0 && newRow < 9 && 
                newCol >= 0 && newCol < 9 && 
                !pathCells.has(`${newRow},${newCol}`)
            ) {
                // Prioritize horizontal movement where possible
                if (dc > 0) {
                    possibleMoves = [[dr, dc]];
                    break;
                } else {
                    possibleMoves.push([dr, dc]);
                }
            }
        }
        
        // If no valid moves, force a move right if possible
        if (possibleMoves.length === 0) {
            let newRow = currentRow;
            let newCol = currentCol + 1;
            
            if (newCol < 9 && !pathCells.has(`${newRow},${newCol}`)) {
                currentRow = newRow;
                currentCol = newCol;
                pathCells.add(`${currentRow},${currentCol}`);
                continue;
            } else {
                // If we can't move right, we're stuck - break out
                break;
            }
        }
        
        // Choose a move, preferring right movement
        const [dr, dc] = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        // Move to the new position
        currentRow += dr;
        currentCol += dc;
        pathCells.add(`${currentRow},${currentCol}`);
    }
    
    // Ensure the path reaches the right edge
    if (currentCol < 8) {
        // Add a straight line to the right edge
        for (let col = currentCol + 1; col <= 8; col++) {
            pathCells.add(`${currentRow},${col}`);
        }
    }
    
    // Calculate how many cells per 3x3 block are used by the path
    // This is for debugging to ensure path distribution is reasonable
    const blocksStats = {};
    for (let blockRow = 0; blockRow < 3; blockRow++) {
        for (let blockCol = 0; blockCol < 3; blockCol++) {
            let count = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const row = blockRow * 3 + i;
                    const col = blockCol * 3 + j;
                    if (pathCells.has(`${row},${col}`)) {
                        count++;
                    }
                }
            }
            blocksStats[`${blockRow},${blockCol}`] = count;
        }
    }
    
    console.log("Path distribution per block:", blocksStats);
    
    // Reset completion tracking when path changes
    completedRows.clear();
    completedColumns.clear();
    completedGrids.clear();
    
    // Convert the path to an array for compatibility with existing code
    const pathArray = Array.from(pathCells).map(pos => pos.split(',').map(Number));
    
    console.log(`BoardManager: Generated enemy path with ${pathArray.length} cells`);
    
    return pathArray;
}

/**
 * Check if a given Sudoku puzzle is solvable using backtracking
 * @param {Array} puzzle - Current puzzle state
 * @returns {boolean} Whether the puzzle is solvable
 */
function isSudokuSolvable(puzzle) {
    // First identify cells that are not on the path and are empty
    const emptyPlayableCells = [];
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (puzzle[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
                emptyPlayableCells.push([row, col]);
            }
        }
    }
    
    // If no empty cells, the puzzle is already solved
    if (emptyPlayableCells.length === 0) {
        return true;
    }
    
    console.log(`Checking if puzzle is solvable with ${emptyPlayableCells.length} empty cells`);
    
    // Use backtracking to try to solve the puzzle
    return solveWithBacktracking(puzzle, emptyPlayableCells, 0);
}

/**
 * Attempt to solve a Sudoku puzzle using backtracking
 * @param {Array} puzzle - Current puzzle state
 * @param {Array} emptyCells - Array of empty cell coordinates [row, col]
 * @param {number} index - Current index in emptyCells
 * @returns {boolean} Whether the puzzle is solvable
 */
function solveWithBacktracking(puzzle, emptyCells, index) {
    // If we've filled all empty cells, the puzzle is solved
    if (index >= emptyCells.length) {
        return true;
    }
    
    // Get the current empty cell
    const [row, col] = emptyCells[index];
    
    // Try each possible value
    for (let num = 1; num <= 9; num++) {
        // Check if this value is valid in this position
        if (isValidMoveForTest(puzzle, row, col, num)) {
            // Place the value
            puzzle[row][col] = num;
            
            // Recursively try to solve the rest of the puzzle
            if (solveWithBacktracking(puzzle, emptyCells, index + 1)) {
                return true;
            }
            
            // If we couldn't solve it, backtrack
            puzzle[row][col] = 0;
        }
    }
    
    // If no value worked, this puzzle is not solvable
    return false;
}

/**
 * Emergency puzzle generation with a minimal path
 * Used as a fallback when normal generation fails
 */
function emergencyPuzzleGeneration() {
    console.log("BoardManager: Using emergency puzzle generation");
    
    // Generate a complete solution
    solution = generateCompleteSolution();
    
    // Create a very simple path along the top edge only
    pathCells.clear();
    for (let i = 0; i < 9; i++) {
        pathCells.add(`0,${i}`); // Top row
    }
    
    // Create very easy puzzle with many revealed cells
    let cellsToReveal = 45; // Show many cells
    const { puzzle, fixed } = createPuzzleFromSolution(solution, pathCells, cellsToReveal);
    
    // Set the board and fixed cells
    board = puzzle;
    fixedCells = fixed;
}


/**
 * Check if a move is valid for our testing purpose
 * Similar to isValidMove but takes a puzzle as parameter
 */
function isValidMoveForTest(puzzle, row, col, value) {
    // Check row
    for (let i = 0; i < 9; i++) {
        if (i !== col && puzzle[row][i] === value) {
            return false;
        }
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
        if (i !== row && puzzle[i][col] === value) {
            return false;
        }
    }
    
    // Check 3x3 box
    let boxRow = Math.floor(row / 3) * 3;
    let boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if ((boxRow + i !== row || boxCol + j !== col) && 
                puzzle[boxRow + i][boxCol + j] === value) {
                return false;
            }
        }
    }
    
    return true;
}



    
    /**
     * Check if a move is valid according to Sudoku rules
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} value - Value to check
     * @returns {boolean} Whether the move is valid
     */
    function isValidMove(row, col, value) {
        // Create a temporary board with the move
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[row][col] = value;
        
        // Check row
        for (let i = 0; i < 9; i++) {
            if (i !== col && tempBoard[row][i] === value) {
                return false;
            }
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (i !== row && tempBoard[i][col] === value) {
                return false;
            }
        }
        
        // Check 3x3 box
        let boxRow = Math.floor(row / 3) * 3;
        let boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if ((boxRow + i !== row || boxCol + j !== col) && 
                    tempBoard[boxRow + i][boxCol + j] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Set the value of a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} value - Value to set
     * @returns {boolean} Whether the move was valid
     */
    function setCellValue(row, col, value) {
      // Validate row and column
      if (row < 0 || row > 8 || col < 0 || col > 8) {
        console.error(`BoardManager: Invalid cell position (${row}, ${col})`);
        return false;
      }
      
      // Debug output for tower placement
      if (value > 0) {
        console.debug(`BoardManager: Tower placed at (${row}, ${col}) with value ${value}`);
        console.debug(`BoardManager: Correct value at this position is ${solution[row][col]}`);
        if (value !== solution[row][col]) {
          console.debug(`BoardManager: MISMATCH - Tower value does not match solution!`);
        } else {
          console.debug(`BoardManager: MATCH - Tower value matches solution.`);
        }
      }
      
      // Check if the cell is fixed
      if (fixedCells[row][col]) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on a fixed Sudoku cell!");
        return false;
      }
      
      // Check if the cell is on the enemy path
      if (pathCells.has(`${row},${col}`)) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on the enemy path!");
        return false;
      }
      
      // If we're clearing a cell (value = 0), always allow it
      if (value === 0) {
        board[row][col] = 0;
        
        // Check for completions after clearing a cell
        checkUnitCompletion();
        
        // Publish event
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
        
        return true;
      }
      
      // Check if the move is valid according to Sudoku rules
      // But only provide a warning instead of preventing placement
      if (!isValidMove(row, col, value)) {
        // Generate warning but STILL ALLOW placement
        EventSystem.publish(GameEvents.SUDOKU_CELL_INVALID, { row, col, value });
        
        // Get valid numbers for better user feedback
        const validNumbers = getPossibleValues(row, col);
        if (validNumbers.length > 0) {
          EventSystem.publish(GameEvents.STATUS_MESSAGE,
            `Warning: Tower placement violates Sudoku rules. This tower will be removed after the wave with 50% refund. Valid options: ${validNumbers.join(', ')}`);
        } else {
          EventSystem.publish(GameEvents.STATUS_MESSAGE,
            "Warning: This tower violates Sudoku rules and will be removed after the wave with 50% refund.");
        }
        
        // Set the cell value ANYWAY - this is the key difference
        board[row][col] = value;
        
        // Publish event
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
        
        // Check for unit completions
        checkUnitCompletion();
        
        return true;
      }
      
      // For valid moves, normal flow continues
      board[row][col] = value;
      
      // Publish event
      EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
      
      // Check for unit completions (rows, columns, grids)
      checkUnitCompletion();
      
      // Check if the Sudoku is complete
      if (isComplete()) {
        EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
      }
      
      return true;
    }

    function isTowerIncorrect(row, col, value) {
      // Check if it matches the solution
      if (solution[row][col] !== value) {
        return true;
      }
      
      return false; // Tower is correct if it matches the solution
    }
    
    /**
     * Get possible values for a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number[]} Array of valid values
     */
    function getPossibleValues(row, col) {
        const possibleValues = [];
        
        // Quick checks before trying numbers
        if (fixedCells[row][col]) {
            return []; // Fixed cells can't be changed
        }
        
        if (pathCells.has(`${row},${col}`)) {
            return []; // Path cells can't have towers
        }
        
        for (let num = 1; num <= 9; num++) {
            if (isValidMove(row, col, num)) {
                possibleValues.push(num);
            }
        }
        
        return possibleValues;
    }
    
    /**
     * Check for completed units (rows, columns, 3x3 grids)
     * Triggers completion bonus events for newly completed units
     */
    function checkUnitCompletion() {
        // Check rows
        for (let row = 0; row < 9; row++) {
            let nonPathCellCount = 0;
            let filledCellCount = 0;
            let fixedCellCount = 0;
            let numberSet = new Set();
            let isComplete = true;
            
            for (let col = 0; col < 9; col++) {
                if (!pathCells.has(`${row},${col}`)) {
                    nonPathCellCount++;
                    
                    if (fixedCells[row][col]) {
                        fixedCellCount++;
                    }
                    
                    if (board[row][col] > 0) {
                        filledCellCount++;
                        numberSet.add(board[row][col]);
                    } else {
                        isComplete = false;
                    }
                }
            }
            
            // Row is complete if all available cells are filled with unique values
            isComplete = isComplete && (filledCellCount === nonPathCellCount) &&
                (numberSet.size === nonPathCellCount) && (nonPathCellCount > 0);
            
            // Only consider a row player-completed if player placed at least one tower
            const playerContributed = (filledCellCount > fixedCellCount);
            
            if (isComplete && !completedRows.has(row)) {
                // Newly completed row
                completedRows.add(row);
                
                // Only trigger bonus if player placed at least one tower
                if (playerContributed) {
                    if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
                        CompletionBonusModule.onUnitCompleted('row', row);
                    }
                }
            } else if (!isComplete && completedRows.has(row)) {
                // No longer complete
                completedRows.delete(row);
            }
        }
        
        // Check columns (similar logic)
        for (let col = 0; col < 9; col++) {
            let nonPathCellCount = 0;
            let filledCellCount = 0;
            let fixedCellCount = 0;
            let numberSet = new Set();
            let isComplete = true;
            
            for (let row = 0; row < 9; row++) {
                if (!pathCells.has(`${row},${col}`)) {
                    nonPathCellCount++;
                    
                    if (fixedCells[row][col]) {
                        fixedCellCount++;
                    }
                    
                    if (board[row][col] > 0) {
                        filledCellCount++;
                        numberSet.add(board[row][col]);
                    } else {
                        isComplete = false;
                    }
                }
            }
            
            isComplete = isComplete && (filledCellCount === nonPathCellCount) &&
                (numberSet.size === nonPathCellCount) && (nonPathCellCount > 0);
            
            const playerContributed = (filledCellCount > fixedCellCount);
            
            if (isComplete && !completedColumns.has(col)) {
                completedColumns.add(col);
                
                if (playerContributed) {
                    if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
                        CompletionBonusModule.onUnitCompleted('column', col);
                    }
                }
            } else if (!isComplete && completedColumns.has(col)) {
                completedColumns.delete(col);
            }
        }
        
        // Check 3x3 grids (similar logic)
        for (let gridRow = 0; gridRow < 3; gridRow++) {
            for (let gridCol = 0; gridCol < 3; gridCol++) {
                let nonPathCellCount = 0;
                let filledCellCount = 0;
                let fixedCellCount = 0;
                let numberSet = new Set();
                let isComplete = true;
                
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const row = gridRow * 3 + i;
                        const col = gridCol * 3 + j;
                        
                        if (!pathCells.has(`${row},${col}`)) {
                            nonPathCellCount++;
                            
                            if (fixedCells[row][col]) {
                                fixedCellCount++;
                            }
                            
                            if (board[row][col] > 0) {
                                filledCellCount++;
                                numberSet.add(board[row][col]);
                            } else {
                                isComplete = false;
                            }
                        }
                    }
                }
                
                isComplete = isComplete && (filledCellCount === nonPathCellCount) &&
                    (numberSet.size === nonPathCellCount) && (nonPathCellCount > 0);
                
                const playerContributed = (filledCellCount > fixedCellCount);
                const gridKey = `${gridRow}-${gridCol}`;
                
                if (isComplete && !completedGrids.has(gridKey)) {
                    completedGrids.add(gridKey);
                    
                    if (playerContributed) {
                        if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
                            CompletionBonusModule.onUnitCompleted('grid', gridKey);
                        }
                    }
                } else if (!isComplete && completedGrids.has(gridKey)) {
                    completedGrids.delete(gridKey);
                }
            }
        }
    }
    
    /**
     * Check if the Sudoku is complete and correct
     * This is the robust implementation from enhanced-sudoku-fix.js
     * @returns {boolean} Whether the Sudoku is complete
     */
    function isComplete() {
  console.log("BoardManager: Checking if Sudoku is complete");
  
  if (!solution || solution.length !== 9) {
    console.warn("BoardManager: Solution is not available or malformed.");
    return false;
  }
  
  const newlyCompletedRows = [];
  const newlyCompletedColumns = [];
  const newlyCompletedGrids = [];
  
  for (let row = 0; row < 9; row++) {
    let rowComplete = true;
    
    for (let col = 0; col < 9; col++) {
      const actual = board[row][col];
      const expected = solution[row][col];
      
      if (actual !== expected) {
        return false;
      }
      
      if (actual < 1 || actual > 9) {
        return false;
      }
    }
    
    // Row is complete
    if (!completedRows.has(row)) {
      completedRows.add(row);
      newlyCompletedRows.push(row);
    }
  }
  
  for (let col = 0; col < 9; col++) {
    let colComplete = true;
    
    for (let row = 0; row < 9; row++) {
      const actual = board[row][col];
      const expected = solution[row][col];
      
      if (actual !== expected) {
        colComplete = false;
        break;
      }
    }
    
    if (colComplete && !completedColumns.has(col)) {
      completedColumns.add(col);
      newlyCompletedColumns.push(col);
    }
  }
  
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      let gridComplete = true;
      const gridKey = `${boxRow}-${boxCol}`;
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const actual = board[row][col];
          const expected = solution[row][col];
          
          if (actual !== expected) {
            gridComplete = false;
            break;
          }
        }
        if (!gridComplete) break;
      }
      
      if (gridComplete && !completedGrids.has(gridKey)) {
        completedGrids.add(gridKey);
        newlyCompletedGrids.push(gridKey);
      }
    }
  }
  
  // Fire completion events
  for (const row of newlyCompletedRows) {
    EventSystem.publish('row:completed', row);
  }
  
  for (const col of newlyCompletedColumns) {
    EventSystem.publish('column:completed', col);
  }
  
  for (const grid of newlyCompletedGrids) {
    EventSystem.publish('grid:completed', grid);
  }
  
  console.log("BoardManager: Sudoku puzzle is COMPLETE!");
  
  if (!window._lastCompletionTime || (Date.now() - window._lastCompletionTime > 5000)) {
    window._lastCompletionTime = Date.now();
  }
  
  return true;
}
/**
 * Debug function to print the full solution grid
 * Add this to board-manager.js
 */
function debugShowSolution() {
    if (!solution || !solution.length) {
        console.log("Solution is not available");
        return;
    }
    
    console.log("%c===== SUDOKU SOLUTION GRID =====", "font-weight: bold; color: blue; font-size: 14px;");
    
    // Create a visual representation of the solution
    let output = "";
    for (let row = 0; row < 9; row++) {
        let rowStr = "";
        if (row % 3 === 0 && row > 0) {
            output += "------+-------+------\n";
        }
        
        for (let col = 0; col < 9; col++) {
            if (col % 3 === 0 && col > 0) {
                rowStr += "| ";
            }
            
            // Mark path cells differently
            if (pathCells.has(`${row},${col}`)) {
                rowStr += "X ";
            } else {
                rowStr += solution[row][col] + " ";
            }
        }
        output += rowStr + "\n";
    }
    
    console.log(output);
    
    // Also output as a 2D array for copy-pasting
    console.log("Solution as array:");
    console.table(solution);
}

// Add to existing init function (findly where EventSystem.publish(GameEvents.SUDOKU_GENERATED, ...) is called
// Add this line right after that:
setTimeout(debugShowSolution, 500);

// Also make it available globally for manual calling
window.debugShowSolution = debugShowSolution;

/**
 * Add keyboard shortcut for displaying solution
 * Add this to board-manager.js or game.js
 */
// Add keyboard shortcut to show solution on Ctrl+Alt+S
document.addEventListener('keydown', function(event) {
    // Check for Ctrl+Alt+S
    if (event.ctrlKey && event.altKey && event.key === 's') {
        event.preventDefault(); // Prevent browser save dialog
        debugShowSolution();
        console.log("%c SOLUTION DISPLAYED! Press Ctrl+Alt+S again to show it again", 
                   "color: green; font-weight: bold");
    }
});

    
    /**
     * Fix any discrepancies between the board and towers
     * Useful for ensuring consistent state
     */
    function fixBoardDiscrepancies() {
        const towers = window.TowersModule ? TowersModule.getTowers() : [];
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
        
        // Fix each discrepancy
        for (const disc of discrepancies) {
            const [row, col] = disc.position;
            const towerType = disc.towerType;
            
            console.log(`BoardManager: Fixing discrepancy at (${row}, ${col}): setting board value to ${towerType}`);
            board[row][col] = towerType;
        }
        
        // Check for completion
        if (discrepancies.length > 0) {
            checkUnitCompletion();
        }
        
        return discrepancies.length;
    }
    
    /**
     * Shuffle an array in place
     * @param {Array} array - Array to shuffle
     */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Get the current board state (returns a copy to prevent direct manipulation)
     * @returns {number[][]} Current board state
     */
    function getBoard() {
        return JSON.parse(JSON.stringify(board));
    }
    
    /**
     * Get the solution (returns a copy to prevent direct manipulation)
     * @returns {number[][]} Solution board
     */
    function getSolution() {
        return JSON.parse(JSON.stringify(solution));
    }
    
    /**
     * Get the fixed cells (returns a copy to prevent direct manipulation)
     * @returns {boolean[][]} Fixed cells
     */
    function getFixedCells() {
        return JSON.parse(JSON.stringify(fixedCells));
    }
    
    /**
     * Get the path cells
     * @returns {Set<string>} Path cells
     */
    function getPathCells() {
        return pathCells;
    }
    
    /**
     * Convert path cells to an array of coordinates
     * @returns {number[][]} Array of [row, col] coordinates
     */
    function getPathArray() {
        return Array.from(pathCells).map(pos => pos.split(',').map(Number));
    }
    
    /**
     * Set the game difficulty
     * @param {string} newDifficulty - The new difficulty (easy, medium, hard)
     */
    function setDifficulty(newDifficulty) {
        if (difficultySettings[newDifficulty]) {
            difficulty = newDifficulty;
        }
    }
    
function toggleDisplayMode(showNumbers) {
  window.Game.displayMode = showNumbers ? 'numbers' : 'sprites';
  
  const cells = document.querySelectorAll('.sudoku-cell');
  const board = BoardManager.getBoard();
  const fixedCells = BoardManager.getFixedCells();
  const pathCells = BoardManager.getPathCells();
  
  cells.forEach(cell => {
    const row = parseInt(cell.getAttribute('data-row'), 10);
    const col = parseInt(cell.getAttribute('data-col'), 10);
    const value = board[row][col];
    
    // Clear content and reset display classes
    cell.innerHTML = '';
    cell.classList.remove('tower-number', 'fixed-block');
    
    // Skip path cells
    if (pathCells.has(`${row},${col}`)) return;
    
    const isFixed = fixedCells[row][col];
    
    if (value === 0) return;
    
    if (showNumbers) {
      // Show numbers for player-placed towers only
      if (!isFixed) {
        const span = document.createElement('span');
        span.textContent = value;
        span.style.fontSize = '18px';
        span.style.color = 'white';
        span.style.fontWeight = 'bold';
        cell.appendChild(span);
        cell.classList.add('tower-number');
      }
    } else {
      // Sprite mode
      if (isFixed) {
        // Show dark green block for fixed numbers
        cell.classList.add('fixed-block');
      } else {
        // Show tower sprite for player-placed towers
        let sprite;
        if (window.TowersModule?.getSpriteForType) {
          sprite = TowersModule.getSpriteForType(value);
        } else {
          sprite = document.createElement('div');
          sprite.classList.add('tower', `tower-${value}`);
        }
        
        if (sprite) {
          cell.appendChild(sprite);
        }
      }
    }
  });
}
    /**
     * Get the completion status of rows, columns, and grids
     * @returns {Object} Completion status
     */
    function getCompletionStatus() {
        return {
            rows: Array.from(completedRows),
            columns: Array.from(completedColumns),
            grids: Array.from(completedGrids)
        };
    }
    
    // Public API
    return {
  init,
  generatePuzzle,
  generateEnemyPath,
  setCellValue,
  getBoard,
  getBoardRaw: () => board,
  getSolution,
  getFixedCells,
  getPathCells,
  getPathArray,
  setDifficulty,
  isValidMove,
  getPossibleValues,
  checkUnitCompletion,
  isComplete,
  getCompletionStatus,
  fixBoardDiscrepancies,
  // ADD THIS LINE:
  toggleDisplayMode
};
})();

// Make module available globally
window.BoardManager = BoardManager;