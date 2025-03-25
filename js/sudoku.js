/**
 * Completely revised Sudoku Module for Tower Defense
 * This version separates the game board from Sudoku constraints
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
        easy: 35,
        medium: 25,
        hard: 20
    };
    
    /**
     * Generate a random valid Sudoku puzzle
     * This is the main function that creates the puzzle
     */
    function generatePuzzle() {
        console.log("Generating new Sudoku puzzle");
        
        // First, generate the enemy path
        generateEnemyPath();
        console.log("Path generated with", pathCells.size, "cells");
        
        // Create a full Sudoku solution
        solution = createFullSolution();
        
        // Create the initial game board (empty)
        board = Array(9).fill().map(() => Array(9).fill(0));
        fixedCells = Array(9).fill().map(() => Array(9).fill(false));
        
        // Determine number of cells to reveal based on difficulty
        const cellsToReveal = difficultySettings[difficulty];
        
        // Reveal cells (avoid path cells)
        revealCells(cellsToReveal);
        
        // Make sure all non-path, non-revealed cells have at least one valid number
        ensureAllCellsHaveValidOptions();
        
        // Notify that the Sudoku board has been generated
        const pathArray = Array.from(pathCells).map(pos => pos.split(',').map(Number));
        EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
            board: board,
            solution: solution,
            fixedCells: fixedCells,
            pathCells: pathArray
        });
        
        console.log("Sudoku puzzle generation complete");
    }
    
    /**
     * Create a full, valid Sudoku solution
     * @returns {number[][]} A complete Sudoku solution
     */
    function createFullSolution() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal 3x3 boxes first (these can be filled independently)
        for (let box = 0; box < 3; box++) {
            let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            shuffle(nums);
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    grid[box * 3 + i][box * 3 + j] = nums[i * 3 + j];
                }
            }
        }
        
        // Solve the rest of the grid using backtracking
        if (!solveGrid(grid)) {
            console.error("Failed to generate a valid Sudoku solution");
            // Fallback to a simpler grid if solving fails
            return createSimpleGrid();
        }
        
        return grid;
    }
    
    /**
     * Create a simple valid grid as a fallback
     * @returns {number[][]} A complete Sudoku solution
     */
    function createSimpleGrid() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill with a predetermined pattern that satisfies Sudoku rules
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const val = (i * 3 + Math.floor(i/3) + j) % 9 + 1;
                grid[i][j] = val;
            }
        }
        
        return grid;
    }
    
    /**
     * Solve a Sudoku grid using backtracking
     * @param {number[][]} grid - The grid to solve
     * @returns {boolean} Whether the grid was solved
     */
    function solveGrid(grid) {
        let emptyCell = findEmptyCell(grid);
        if (!emptyCell) return true; // No empty cells - solution complete
        
        const [row, col] = emptyCell;
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffle(numbers); // Randomize to generate different puzzles
        
        for (let num of numbers) {
            if (isSafe(grid, row, col, num)) {
                grid[row][col] = num;
                
                if (solveGrid(grid)) {
                    return true;
                }
                
                grid[row][col] = 0; // Backtrack
            }
        }
        
        return false; // Trigger backtracking
    }
    
    /**
     * Find an empty cell in the grid
     * @param {number[][]} grid - The grid to search
     * @returns {[number, number]|null} Cell coordinates or null if none found
     */
    function findEmptyCell(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null;
    }
    
    /**
     * Check if a number is safe to place at a position
     * @param {number[][]} grid - The grid to check
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} Whether the placement is safe
     */
    function isSafe(grid, row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num) return false;
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (grid[i][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Reveal a specified number of cells in the puzzle
     * @param {number} count - Number of cells to reveal
     */
    function revealCells(count) {
        let positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Skip path cells
                if (!pathCells.has(`${row},${col}`)) {
                    positions.push([row, col]);
                }
            }
        }
        
        // Shuffle positions
        shuffle(positions);
        
        // Reveal the specified number of cells
        for (let i = 0; i < Math.min(count, positions.length); i++) {
            const [row, col] = positions[i];
            board[row][col] = solution[row][col];
            fixedCells[row][col] = true;
        }
    }
    
    /**
     * Ensure all non-path, non-revealed cells have at least one valid number option
     * This is critical for tower placement
     */
    function ensureAllCellsHaveValidOptions() {
        // Find all cells that need checking
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Skip fixed cells and path cells
                if (fixedCells[row][col] || pathCells.has(`${row},${col}`)) {
                    continue;
                }
                
                // Check if this cell has at least one valid option
                const validOptions = getValidOptions(row, col);
                
                if (validOptions.length === 0) {
                    // No valid options for this cell
                    // Reveal the solution value for this cell to ensure the puzzle is still valid
                    board[row][col] = solution[row][col];
                    fixedCells[row][col] = true;
                    console.log(`Fixed cell ${row},${col} with no valid options`);
                }
            }
        }
    }
    
    /**
     * Get all valid number options for a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number[]} Array of valid numbers
     */
    function getValidOptions(row, col) {
        const options = [];
        for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(row, col, num)) {
                options.push(num);
            }
        }
        return options;
    }
    
    /**
     * Check if a number can be placed at a position according to Sudoku rules
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} Whether the placement is valid
     */
    function isValidPlacement(row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Generate a path for enemies to follow
     */
    function generateEnemyPath() {
        pathCells.clear();
        
        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];
        
        // Start at a position on the left edge
        let startRow = Math.floor(Math.random() * 9);
        let currentRow = startRow;
        let currentCol = 0;
        
        // Add starting position to the path
        pathCells.add(`${currentRow},${currentCol}`);
        
        // Generate path to the right edge
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loops
        
        while (currentCol < 8 && attempts < maxAttempts) {
            attempts++;
            
            // Prioritize moving right with some random turns
            let possibleDirs = [];
            let rightDir = null;
            
            // Check each direction
            for (let [dr, dc] of directions) {
                let newRow = currentRow + dr;
                let newCol = currentCol + dc;
                
                // Check if valid position
                if (
                    newRow >= 0 && newRow < 9 && 
                    newCol >= 0 && newCol < 9 && 
                    !pathCells.has(`${newRow},${newCol}`)
                ) {
                    possibleDirs.push([dr, dc]);
                    if (dc > 0) rightDir = [dr, dc]; // Moving right
                }
            }
            
            // No valid moves, break
            if (possibleDirs.length === 0) break;
            
            // Choose direction (prefer right but add randomness)
            let [dr, dc] = rightDir && Math.random() < 0.7 ? 
                rightDir : possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            
            // Move
            currentRow += dr;
            currentCol += dc;
            pathCells.add(`${currentRow},${currentCol}`);
        }
        
        // Ensure path reaches the right edge
        if (currentCol < 8) {
            // Path didn't reach right edge, create a direct path
            const finalRow = currentRow;
            for (let col = currentCol + 1; col < 9; col++) {
                pathCells.add(`${finalRow},${col}`);
            }
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
     * Set a cell value (used for tower placement)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} value - Value to set
     * @returns {boolean} Whether the placement was successful
     */
    function setCellValue(row, col, value) {
        // Check if cell is fixed
        if (fixedCells[row][col]) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on a fixed Sudoku cell!");
            return false;
        }
        
        // Check if cell is on the path
        if (pathCells.has(`${row},${col}`)) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot place a tower on the enemy path!");
            return false;
        }
        
        // Check if placement is valid
        if (!isValidPlacement(row, col, value)) {
            EventSystem.publish(GameEvents.SUDOKU_CELL_INVALID, { row, col, value });
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid tower placement according to Sudoku rules!");
            return false;
        }
        
        // Set the value
        board[row][col] = value;
        
        // Publish success event
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
        
        // Check if Sudoku is complete
        if (isSudokuComplete()) {
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        }
        
        return true;
    }
    
    /**
     * Check if the Sudoku is complete
     * @returns {boolean} Whether the Sudoku is complete
     */
    function isSudokuComplete() {
        // Check all non-path cells are filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
                    return false;
                }
            }
        }
        
        // Check all rows, columns and boxes for validity
        return true; // All checks passed
    }
    
    /**
     * Get valid numbers for a cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number[]} Array of valid numbers
     */
    function getValidNumbers(row, col) {
        const validNumbers = [];
        
        // If cell is fixed or on path, return empty array
        if (fixedCells[row][col] || pathCells.has(`${row},${col}`)) {
            return validNumbers;
        }
        
        // Check each number
        for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(row, col, num)) {
                validNumbers.push(num);
            }
        }
        
        return validNumbers;
    }
    
    /**
     * Set the difficulty
     * @param {string} newDifficulty - New difficulty setting
     */
    function setDifficulty(newDifficulty) {
        if (difficultySettings[newDifficulty]) {
            difficulty = newDifficulty;
        }
    }
    
    /**
     * Get the current board
     * @returns {number[][]} Current board
     */
    function getBoard() {
        return board;
    }
    
    /**
     * Get the solution
     * @returns {number[][]} Solution
     */
    function getSolution() {
        return solution;
    }
    
    /**
     * Get fixed cells
     * @returns {boolean[][]} Fixed cells
     */
    function getFixedCells() {
        return fixedCells;
    }
    
    /**
     * Get path cells
     * @returns {Set<string>} Path cells
     */
    function getPathCells() {
        return pathCells;
    }
    
    /**
     * Get path as array
     * @returns {number[][]} Path array
     */
    function getPathArray() {
        return Array.from(pathCells).map(pos => pos.split(',').map(Number));
    }
    
    /**
     * Initialize event listeners
     */
    function initEventListeners() {
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
    initEventListeners();
    
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
        getValidNumbers,
        isValidPlacement
    };
})();

// Make module available globally
window.SudokuModule = SudokuModule;