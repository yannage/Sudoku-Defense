/**
 * sudoku.js - Handles Sudoku puzzle generation and validation
 * This module generates Sudoku puzzles and provides validation functions
 */

const SudokuModule = (function() {
    // Private variables
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let solution = Array(9).fill().map(() => Array(9).fill(0));
    let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
    let difficulty = 'medium'; // easy, medium, hard
    let pathCells = new Set(); // Cells that form the enemy path
    
    // Difficulty settings (number of cells to reveal)
    const difficultySettings = {
        easy: 40,
        medium: 30,
        hard: 25
    };
    
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
     * Count the number of solutions for a puzzle (up to a maximum)
     * @param {number[][]} puzzle - The puzzle to check
     * @param {number} max - Maximum number of solutions to count
     * @returns {number} Number of solutions found (capped at max)
     */
    function countSolutions(puzzle, max) {
        let solutions = 0;
        
        function findSolutions(grid) {
            if (solutions >= max) return;
            
            let emptyCell = findEmptyCell(grid);
            if (!emptyCell) {
                // No empty cells - found a solution
                solutions++;
                return;
            }
            
            const [row, col] = emptyCell;
            
            for (let num = 1; num <= 9; num++) {
                if (isValid(grid, row, col, num)) {
                    grid[row][col] = num;
                    findSolutions(grid);
                    if (solutions >= max) return;
                    grid[row][col] = 0; // Backtrack
                }
            }
        }
        
        findSolutions(JSON.parse(JSON.stringify(puzzle)));
        return solutions;
    }
    
    /**
 * Update for sudoku.js to add dynamic path generation
 * 
 * Replace the existing generateEnemyPath function in the SudokuModule with this version.
 * The new function creates more varied paths that can start and end at different rows.
 */

/**
 * Generate a path for enemies to follow
 * Creates a varied path from a starting point to an end point
 * Path can now start and end at different rows
 */
function generateEnemyPath() {
    pathCells.clear();
    
    const directions = [
        [-1, 0], // up
        [1, 0],  // down
        [0, -1], // left
        [0, 1]   // right
    ];
    
    // Start at a random position on the left edge
    let startRow = Math.floor(Math.random() * 9);
    let currentRow = startRow;
    let currentCol = 0;
    
    // Choose a different end row for more varied paths
    let endRow = Math.floor(Math.random() * 9);
    // Ensure end row is different from start row at least half the time
    if (Math.random() > 0.5) {
        while (endRow === startRow) {
            endRow = Math.floor(Math.random() * 9);
        }
    }
    
    // Mark the starting position
    pathCells.add(`${currentRow},${currentCol}`);
    
    // Generate path to the right edge
    while (currentCol < 8) {
        let possibleDirs = [];
        let priorityDirs = [];
        
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
                possibleDirs.push([dr, dc]);
                
                // Prioritize moving toward the end row
                if (dc > 0) {
                    priorityDirs.push([dr, dc]); // Moving right is always a priority
                }
                
                // Prioritize vertical movement that gets us closer to endRow
                if (dc === 0) { // For vertical moves
                    if ((newRow > currentRow && newRow <= endRow) || // Moving down toward endRow
                        (newRow < currentRow && newRow >= endRow)) { // Moving up toward endRow
                        priorityDirs.push([dr, dc]);
                    }
                }
            }
        }
        
        // If there's no valid direction, try to force move right
        if (possibleDirs.length === 0) {
            // Try forcing a move right even if we've been there
            const forceRight = [0, 1];
            const newRow = currentRow + forceRight[0];
            const newCol = currentCol + forceRight[1];
            
            if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                currentRow = newRow;
                currentCol = newCol;
                pathCells.add(`${currentRow},${currentCol}`);
                continue;
            }
            
            // If we can't force right, we're stuck
            break;
        }
        
        // Choose direction with priority to moving right & toward end row
        let chosenDir;
        
        // If we're far from the target row, focus on vertical movement
        const verticalDistanceToEnd = Math.abs(currentRow - endRow);
        
        if (verticalDistanceToEnd > 0 && currentCol < 6 && Math.random() < 0.7) {
            // Find vertical moves that get us closer to endRow
            const verticalMoves = possibleDirs.filter(([dr, dc]) => {
                return dc === 0 && ((dr > 0 && currentRow < endRow) || (dr < 0 && currentRow > endRow));
            });
            
            if (verticalMoves.length > 0) {
                chosenDir = verticalMoves[Math.floor(Math.random() * verticalMoves.length)];
            }
        }
        
        // If no vertical move was chosen or we're close to endRow, prefer moving right
        if (!chosenDir) {
            if (priorityDirs.length > 0 && Math.random() < 0.8) {
                chosenDir = priorityDirs[Math.floor(Math.random() * priorityDirs.length)];
            } else {
                chosenDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            }
        }
        
        // Move to the new position
        currentRow += chosenDir[0];
        currentCol += chosenDir[1];
        pathCells.add(`${currentRow},${currentCol}`);
        
        // If we've reached the target column (8), ensure we're at or moving toward the end row
        if (currentCol === 8 && currentRow !== endRow) {
            // Add one final move to reach the end row if possible
            if (endRow > currentRow && currentRow < 8) {
                currentRow += 1;
                pathCells.add(`${currentRow},${currentCol}`);
            } else if (endRow < currentRow && currentRow > 0) {
                currentRow -= 1;
                pathCells.add(`${currentRow},${currentCol}`);
            }
        }
    }
    
    // Log path information for debugging
    console.log(`Created path with ${pathCells.size} cells, from row ${startRow} to row ${currentRow} at right edge`);
}
    
    /**
     * Generate a random valid Sudoku puzzle
     */
    function generatePuzzle() {
        console.log("Generating new Sudoku puzzle...");
        
        // Generate the enemy path first
        generateEnemyPath();
        
        // Generate a complete solution
        solution = generateCompleteSolution();
        
        // Determine how many cells to reveal based on difficulty
        let cellsToReveal = difficultySettings[difficulty];
        
        // Create a puzzle from the solution
        const { puzzle, fixed } = createPuzzleFromSolution(solution, pathCells, cellsToReveal);
        
        // Set the board and fixed cells
        board = puzzle;
        fixedCells = fixed;
        
        // Count fixed cells for debugging
        let fixedCount = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (fixedCells[row][col]) fixedCount++;
            }
        }
        console.log(`Generated puzzle with ${fixedCount} fixed cells`);
        
        // Convert pathCells to array format for the event
        const pathArray = Array.from(pathCells).map(pos => pos.split(',').map(Number));
        
        // Notify that the sudoku board has been generated
        EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
            board: board,
            solution: solution,
            fixedCells: fixedCells,
            pathCells: pathArray
        });
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
     * Set the value of a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} value - Value to set
     * @returns {boolean} Whether the move was valid
     */
    function setCellValue(row, col, value) {
        console.log(`Attempting to set cell (${row},${col}) to value ${value}`);
        
        // Check if the cell is fixed
        if (fixedCells[row][col]) {
            console.log("Cell is fixed, cannot modify");
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on a fixed Sudoku cell!");
            return false;
        }
        
        // Check if the cell is on the enemy path
        if (pathCells.has(`${row},${col}`)) {
            console.log("Cell is on path, cannot modify");
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on the enemy path!");
            return false;
        }
        
        // If we're clearing a cell (value = 0), always allow it
        if (value === 0) {
            board[row][col] = 0;
            return true;
        }
        
        // Check if the move is valid
        if (!isValidMove(row, col, value)) {
            console.log("Move is invalid according to Sudoku rules");
            EventSystem.publish(GameEvents.SUDOKU_CELL_INVALID, { row, col, value });
            
            // Get valid numbers for better user feedback
            const validNumbers = getPossibleValues(row, col);
            if (validNumbers.length > 0) {
                EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                    `Invalid tower placement: Cannot place ${value} here. Valid options: ${validNumbers.join(', ')}`);
            } else {
                EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower placement according to Sudoku rules!");
            }
            
            return false;
        }
        
        // Set the cell value
        board[row][col] = value;
        console.log(`Successfully set cell (${row},${col}) to ${value}`);
        
        // Publish event
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
        
        // Check if the Sudoku is complete
        if (isComplete()) {
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        }
        
        return true;
    }
    
    /**
     * Check if the Sudoku is complete and correct
     * @returns {boolean} Whether the Sudoku is complete
     */
    function isComplete() {
        // Check if all non-path cells are filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
                    return false;
                }
            }
        }
        
        // Check if all rows, columns, and boxes are valid
        for (let i = 0; i < 9; i++) {
            // Create sets for validation
            let rowSet = new Set();
            let colSet = new Set();
            let boxSet = new Set();
            
            // Get 3x3 box starting indices
            let boxRow = Math.floor(i / 3) * 3;
            let boxCol = (i % 3) * 3;
            
            for (let j = 0; j < 9; j++) {
                // Skip path cells for row check
                if (!pathCells.has(`${i},${j}`) && board[i][j] !== 0) {
                    rowSet.add(board[i][j]);
                }
                
                // Skip path cells for column check
                if (!pathCells.has(`${j},${i}`) && board[j][i] !== 0) {
                    colSet.add(board[j][i]);
                }
                
                // Skip path cells for box check
                let r = boxRow + Math.floor(j / 3);
                let c = boxCol + (j % 3);
                if (!pathCells.has(`${r},${c}`) && board[r][c] !== 0) {
                    boxSet.add(board[r][c]);
                }
            }
            
            // Calculate how many non-path cells are in each unit
            let rowNonPathCount = 0;
            let colNonPathCount = 0;
            let boxNonPathCount = 0;
            
            for (let j = 0; j < 9; j++) {
                if (!pathCells.has(`${i},${j}`)) rowNonPathCount++;
                if (!pathCells.has(`${j},${i}`)) colNonPathCount++;
                
                let r = boxRow + Math.floor(j / 3);
                let c = boxCol + (j % 3);
                if (!pathCells.has(`${r},${c}`)) boxNonPathCount++;
            }
            
            // Check if all non-path cells have unique values
            if (rowSet.size !== rowNonPathCount) return false;
            if (colSet.size !== colNonPathCount) return false;
            if (boxSet.size !== boxNonPathCount) return false;
        }
        
        return true;
    }
    
    /**
     * Get the current board state
     * @returns {number[][]} Current board state
     */
    function getBoard() {
        return board;
    }
    
    /**
     * Get the solution
     * @returns {number[][]} Solution board
     */
    function getSolution() {
        return solution;
    }
    
    /**
     * Get the fixed cells
     * @returns {boolean[][]} Fixed cells
     */
    function getFixedCells() {
        return fixedCells;
    }
    
    /**
     * Get the path cells
     * @returns {Set<string>} Path cells
     */
    function getPathCells() {
        return pathCells;
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
    
    /**
     * Convert path cells to an array of coordinates
     * @returns {number[][]} Array of [row, col] coordinates
     */
    function getPathArray() {
        return Array.from(pathCells).map(pos => pos.split(',').map(Number));
    }
    
    /**
     * Initialize event listeners
     */
    function init() {
        // Listen for game initialization
        EventSystem.subscribe(GameEvents.GAME_INIT, function() {
            generatePuzzle();
        });
        
        // Listen for new game
        EventSystem.subscribe(GameEvents.GAME_START, function() {
            generatePuzzle();
        });
    }
    
    // Initialize event listeners
    init();
    
    // Public API
    return {
        generatePuzzle,
        setCellValue,
        getBoard,
        getSolution,
        getFixedCells,
        getPathCells,
        getPathArray,
        setDifficulty,
        isValidMove,
        getPossibleValues // Explicitly expose this function
    };
})();

// Make module available globally
window.SudokuModule = SudokuModule;