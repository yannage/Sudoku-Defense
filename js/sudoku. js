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
     * Solve the Sudoku grid using backtracking
     * @param {number[][]} grid - The Sudoku grid to solve
     * @returns {boolean} Whether the puzzle was solved
     */
    function solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Skip filled cells
                if (grid[row][col] !== 0) {
                    continue;
                }
                
                // Try each number
                for (let num = 1; num <= 9; num++) {
                    if (isValid(grid, row, col, num)) {
                        grid[row][col] = num;
                        
                        if (solveSudoku(grid)) {
                            return true;
                        }
                        
                        grid[row][col] = 0; // Backtrack
                    }
                }
                
                return false; // Trigger backtracking
            }
        }
        
        return true; // All cells filled
    }
    
    /**
     * Generate a random valid Sudoku puzzle
     */
    function generatePuzzle() {
        // Start with an empty grid
        solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal boxes first (can be filled independently)
        for (let box = 0; box < 3; box++) {
            let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            shuffle(nums);
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    solution[box * 3 + i][box * 3 + j] = nums[i * 3 + j];
                }
            }
        }
        
        // Solve the rest of the puzzle
        solveSudoku(solution);
        
        // Create the puzzle by removing numbers
        board = JSON.parse(JSON.stringify(solution));
        fixedCells = Array(9).fill().map(() => Array(9).fill(false));
        
        // Determine how many cells to remove based on difficulty
        let cellsToReveal = difficultySettings[difficulty];
        let cellsToRemove = 81 - cellsToReveal;
        
        // Create a list of all positions
        let positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        // Generate path first
        generateEnemyPath();
        
        // Make sure path cells are empty for tower placement
        for (let posStr of pathCells) {
            const [row, col] = posStr.split(',').map(Number);
            board[row][col] = 0;
            fixedCells[row][col] = false;
        }
        
        // Shuffle positions and remove numbers
        shuffle(positions);
        
        let count = 0;
        for (let [row, col] of positions) {
            // Skip path cells
            if (pathCells.has(`${row},${col}`)) {
                continue;
            }
            
            // Set this as a fixed cell in the puzzle
            fixedCells[row][col] = true;
            
            // Move to next position once we've removed enough cells
            count++;
            if (count >= cellsToReveal) {
                break;
            }
        }
        
        // Remove numbers from non-fixed cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (!fixedCells[row][col]) {
                    board[row][col] = 0;
                }
            }
        }
        
        // Notify that the sudoku board has been generated
        EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
            board: board,
            solution: solution,
            fixedCells: fixedCells,
            pathCells: Array.from(pathCells).map(pos => pos.split(',').map(Number))
        });
    }
    
    /**
     * Generate a path for enemies to follow
     * This creates a winding path from a starting point to an end point
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
        
        // Mark the starting position
        pathCells.add(`${currentRow},${currentCol}`);
        
        // Generate path to the right edge
        while (currentCol < 8) {
            // Prioritize moving right, but allow some turns
            let possibleDirs = [];
            let bestDir = null;
            
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
                    
                    // Prefer moving right
                    if (dc > 0) {
                        bestDir = [dr, dc];
                    }
                }
            }
            
            // If there's no valid direction, break
            if (possibleDirs.length === 0) {
                break;
            }
            
            // Choose direction (prefer right if available)
            let [dr, dc] = bestDir || possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            
            // Move to the new position
            currentRow += dr;
            currentCol += dc;
            pathCells.add(`${currentRow},${currentCol}`);
        }
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
     * Check if the Sudoku is complete and correct
     * @returns {boolean} Whether the Sudoku is complete
     */
    function isComplete() {
        // Check if all cells are filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // Check if all rows, columns, and boxes are valid
        for (let i = 0; i < 9; i++) {
            // Check rows
            let rowSet = new Set();
            for (let j = 0; j < 9; j++) {
                rowSet.add(board[i][j]);
            }
            if (rowSet.size !== 9) {
                return false;
            }
            
            // Check columns
            let colSet = new Set();
            for (let j = 0; j < 9; j++) {
                colSet.add(board[j][i]);
            }
            if (colSet.size !== 9) {
                return false;
            }
            
            // Check boxes
            let boxRow = Math.floor(i / 3) * 3;
            let boxCol = (i % 3) * 3;
            let boxSet = new Set();
            
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    boxSet.add(board[boxRow + r][boxCol + c]);
                }
            }
            
            if (boxSet.size !== 9) {
                return false;
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
        
        // Check if the move is valid
        if (!isValidMove(row, col, value)) {
            EventSystem.publish(GameEvents.SUDOKU_CELL_INVALID, { row, col, value });
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower placement according to Sudoku rules!");
            return false;
        }
        
        // Set the cell value
        board[row][col] = value;
        
        // Publish event
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
        
        // Check if the Sudoku is complete
        if (isComplete()) {
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
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
        isValidMove
    };
})();

// Make module available globally
window.SudokuModule = SudokuModule;
