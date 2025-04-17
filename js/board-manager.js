/**
 * board-manager.js - Centralized board state management system
 * This module serves as the single source of truth for the Sudoku board state
 * and centralizes all board-related functionality.
 */

const BoardManager = (function() {
            let board = Array(9).fill().map(() => Array(9).fill(0));
            let solution = Array(9).fill().map(() => Array(9).fill(0));
            let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
            let pathCells = new Set();
            let difficulty = 'medium';
            let gameStyle = 'defense';
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
    gameStyle = options.style || 'defense';
    completedRows.clear();
    completedColumns.clear();
    completedGrids.clear();
    generatePuzzle(difficulty, gameStyle);
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
    
    
function getPlayableCellsInUnit(unitType, unitIndex) {
  const cells = [];
  
  if (unitType === 'row') {
    for (let col = 0; col < 9; col++) {
      if (!pathCells.has(`${unitIndex},${col}`)) {
        cells.push([unitIndex, col]);
      }
    }
  } else if (unitType === 'column') {
    for (let row = 0; row < 9; row++) {
      if (!pathCells.has(`${row},${unitIndex}`)) {
        cells.push([row, unitIndex]);
      }
    }
  } else if (unitType === 'grid') {
    const [gridRow, gridCol] = unitIndex.split('-').map(Number);
    const startRow = gridRow * 3;
    const startCol = gridCol * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const row = startRow + i;
        const col = startCol + j;
        if (!pathCells.has(`${row},${col}`)) {
          cells.push([row, col]);
        }
      }
    }
  }
  
  return cells;
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
    function generateEnemyPath(maxLength = 13) {
  console.log("BoardManager: Generating enemy path");
  pathCells.clear();
  
  const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, 1] // right
  ];
  
  let currentRow = Math.floor(Math.random() * 9);
  let currentCol = 0;
  const endRow = Math.floor(Math.random() * 9);
  
  pathCells.add(`${currentRow},${currentCol}`);
  
  while (pathCells.size < maxLength && currentCol < 8) {
    let possibleMoves = [];
    
    for (let [dr, dc] of directions) {
      const newRow = currentRow + dr;
      const newCol = currentCol + dc;
      const key = `${newRow},${newCol}`;
      
      if (
        newRow >= 0 && newRow < 9 &&
        newCol >= 0 && newCol < 9 &&
        !pathCells.has(key)
      ) {
        possibleMoves.push([dr, dc]);
      }
    }
    
    if (possibleMoves.length === 0) {
      // Try force-right if stuck
      const forcedCol = currentCol + 1;
      const key = `${currentRow},${forcedCol}`;
      if (forcedCol < 9 && !pathCells.has(key)) {
        currentCol = forcedCol;
        pathCells.add(key);
        continue;
      }
      console.warn("generateEnemyPath: stuck, breaking early");
      break;
    }
    
    const rightMoves = possibleMoves.filter(([_, dc]) => dc > 0);
    const verticalMoves = possibleMoves.filter(([_, dc]) => dc === 0);
    const movesTowardEnd = verticalMoves.filter(([dr]) =>
      (dr > 0 && currentRow < endRow) || (dr < 0 && currentRow > endRow)
    );
    
    const bestMoves = rightMoves.length > 0 ?
      rightMoves :
      (movesTowardEnd.length > 0 ? movesTowardEnd : verticalMoves.length > 0 ? verticalMoves : possibleMoves);
    
    const [dr, dc] = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    currentRow += dr;
    currentCol += dc;
    pathCells.add(`${currentRow},${currentCol}`);
  }
  
  // Extend to right edge if needed
  while (currentCol < 8) {
    currentCol++;
    pathCells.add(`${currentRow},${currentCol}`);
  }
  
  // If not at target row on right edge, go there
  if (currentRow !== endRow) {
    const step = currentRow < endRow ? 1 : -1;
    for (let r = currentRow + step; r !== endRow + step; r += step) {
      pathCells.add(`${r},${currentCol}`);
    }
  }
  
  // Reset completion tracking
  completedRows.clear();
  completedColumns.clear();
  completedGrids.clear();
  
  const pathArray = Array.from(pathCells).map(pos => pos.split(',').map(Number));
  console.log(`BoardManager: Generated enemy path with ${pathArray.length} cells`);
  EventSystem.publish(GameEvents.PATH_CHANGED, pathArray);
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
 */function generatePuzzle(difficulty = 'easy', style = 'defense') {
    console.log(`BoardManager: Generating new Sudoku puzzle with difficulty: ${difficulty}, style: ${style}`);
    
    // Reset completion tracking
    completedRows.clear();
    completedColumns.clear();
    completedGrids.clear();
    pathCells.clear(); // Always clear first to avoid lingering paths from previous runs
    
    let attempts = 0;
    let validPuzzleFound = false;
    
    while (!validPuzzleFound && attempts < 5) {
        attempts++;
        console.log(`BoardManager: Puzzle generation attempt ${attempts}`);
        
        // Only generate path if in defense mode
        if (style === 'defense') {
            let pathLength = 9;
            if (attempts > 3) pathLength = 6;
            generateEnemyPath(pathLength); // This mutates `pathCells`
        } else {
            pathCells.clear(); // Ensure path is empty for basic mode
        }
        
        solution = generateCompleteSolution();
        
        const cellsToReveal = difficultySettings[difficulty] || 30;
        const { puzzle, fixed } = createPuzzleFromSolution(solution, pathCells, cellsToReveal);
        
        validPuzzleFound = isSudokuSolvable(JSON.parse(JSON.stringify(puzzle)));
        
        if (validPuzzleFound) {
            board = puzzle;
            fixedCells = fixed;
            console.log("BoardManager: Valid solvable puzzle generated!");
        } else {
            console.log("BoardManager: Generated puzzle is not solvable, retrying...");
            pathCells.clear();
        }
    }
    
    if (!validPuzzleFound) {
        console.log("BoardManager: Failed after multiple attempts, using fallback");
        emergencyPuzzleGeneration();
    }
    
    // Count and log fixed cells
    let fixedCount = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (fixedCells[row][col]) fixedCount++;
        }
    }
    console.log(`BoardManager: Generated puzzle with ${fixedCount} fixed cells`);
    
    EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
        board: getBoard(),
        solution: getSolution(),
        fixedCells: getFixedCells(),
        pathCells: getPathArray()
    });
    
    setTimeout(() => {
        if (window.TowersModule?.init) TowersModule.init();
        if (window.Game?.updateBoard) Game.updateBoard();
    }, 100);
    
    return board;
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
/**
 * Add these functions to board-manager.js, then replace the setCellValue function 
 * with the updated version below
 */

/**
 * Calculate points for a correct move based on emptiness of row, column, and grid
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {number} Points to award
 */
function calculateMovePoints(row, col) {
    // Base points for a correct placement
    let points = 10;
    
    // Get completion status
    const { rows: completedRows, columns: completedColumns, grids: completedGrids } = getCompletionStatus();
    
    // Calculate grid position
    const gridRow = Math.floor(row / 3);
    const gridCol = Math.floor(col / 3);
    const gridKey = `${gridRow}-${gridCol}`;
    
    // Calculate emptiness bonus
    let emptyCount = 0;
    
    // Check row emptiness (excluding path cells)
    for (let c = 0; c < 9; c++) {
        if (c !== col && !pathCells.has(`${row},${c}`) && board[row][c] === 0) {
            emptyCount++;
        }
    }
    
    // Check column emptiness (excluding path cells)
    for (let r = 0; r < 9; r++) {
        if (r !== row && !pathCells.has(`${r},${col}`) && board[r][col] === 0) {
            emptyCount++;
        }
    }
    
    // Check grid emptiness (excluding path cells)
    const gridStartRow = Math.floor(row / 3) * 3;
    const gridStartCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const gridRow = gridStartRow + r;
            const gridCol = gridStartCol + c;
            if ((gridRow !== row || gridCol !== col) &&
                !pathCells.has(`${gridRow},${gridCol}`) &&
                board[gridRow][gridCol] === 0) {
                emptyCount++;
            }
        }
    }
    
    // Award bonus points based on emptiness
    points += emptyCount * 2;
    
    // Debug output
    console.log(`Tower placement at [${row},${col}]: ${points} points (${emptyCount} empty cells)`);
    
    return points;
}

/**
 * Calculate the penalty for an incorrect move
 * @returns {number} Points to deduct
 */
function calculateIncorrectPenalty() {
    // Base penalty for incorrect placement
    return 15;
}

/**
 * Set the value of a cell - UPDATED VERSION WITH DIRECT PLAYER MODULE INTEGRATION
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} value - Value to set
 * @returns {boolean} Whether the move was valid
 */
/**
 * Add this code block to replace the existing gameStyle === 'basic' condition 
 * in your setCellValue function
 */

if (gameStyle === 'basic') {
    // Check if the placement is correct
    const isCorrect = solution[row][col] === value;
    
    if (isCorrect) {
        // Award points based on emptiness of row, column, and grid
        const pointsAwarded = calculateMovePoints(row, col);
        
        // Direct integration with PlayerModule
        if (window.PlayerModule && typeof PlayerModule.addScore === 'function' && pointsAwarded > 0) {
            PlayerModule.addScore(pointsAwarded);
            
            // Visual feedback
            EventSystem.publish(GameEvents.STATUS_MESSAGE,
                `Correct placement! +${pointsAwarded} points`);
            

        }
    } else {
        // Incorrect number - penalize
        const penalty = calculateIncorrectPenalty();
        
        // Direct integration with PlayerModule
        if (window.PlayerModule && typeof PlayerModule.addScore === 'function') {
            // Check current score to determine actual penalty
            const currentScore = PlayerModule.getState().score;
            const actualPenalty = Math.min(currentScore, penalty);
            
            if (actualPenalty > 0) {
                // Only deduct and show animation if there are points to deduct
                PlayerModule.addScore(-actualPenalty);
                
                // Visual feedback
                EventSystem.publish(GameEvents.STATUS_MESSAGE,
                    `Incorrect number! -${actualPenalty} points`);
                
                // Only show floating animation if points were actually deducted
                if (typeof window.showFloatingScoreText === 'function') {
                    window.showFloatingScoreText(`-${actualPenalty}`, '#f44336');
                }
            } else {
                // Still show message but without point deduction
                EventSystem.publish(GameEvents.STATUS_MESSAGE, "Incorrect number!");
            }
        }
        
        return false;
    }
}

/**
 * For a cleaner complete implementation, this is how the updated 
 * setCellValue function should look when fully replaced:
 */

function setCellValue(row, col, value) {
    if (row < 0 || row > 8 || col < 0 || col > 8) return false;
    if (fixedCells[row][col]) return false;
    if (pathCells.has(`${row},${col}`)) return false;
    
    if (value > 0 && board[row][col] === value) {
        console.log(`Cell already contains value ${value} at [${row},${col}]`);
        return false;
    }
    
    if (value === 0) {
        board[row][col] = 0;
        forceUIUpdate();
        checkUnitCompletion();
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
        return true;
    }
    
    // Handle both game styles in a more consistent way
    if (gameStyle === 'defense' || gameStyle === 'basic') {
        const isCorrect = solution[row][col] === value;
        
        if (isCorrect) {
            // Award points based on emptiness of row, column, and grid
            const pointsAwarded = calculateMovePoints(row, col);
            
            // Direct integration with PlayerModule
            if (window.PlayerModule && typeof PlayerModule.addScore === 'function' && pointsAwarded > 0) {
                PlayerModule.addScore(pointsAwarded);
                
                // Visual feedback
                EventSystem.publish(GameEvents.STATUS_MESSAGE,
                    `Correct placement! +${pointsAwarded} points`);
                
                // Trigger floating score animation
                if (typeof window.showFloatingScoreText === 'function') {
                    window.showFloatingScoreText(`+${pointsAwarded}`, '#4caf50');
                }
            }
        } else {
            // Penalize incorrect placement
            const penalty = calculateIncorrectPenalty();
            
            // Direct integration with PlayerModule
            if (window.PlayerModule && typeof PlayerModule.addScore === 'function') {
                // Check current score to determine actual penalty
                const currentScore = PlayerModule.getState().score;
                const actualPenalty = Math.min(currentScore, penalty);
                
                if (actualPenalty > 0) {
                    // Only deduct and show animation if there are points to deduct
                    PlayerModule.addScore(-actualPenalty);
                    
                    // Visual feedback
                    const message = gameStyle === 'defense' ?
                        `Incorrect placement! -${actualPenalty} points` :
                        `Incorrect number! -${actualPenalty} points`;
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, message);
                    
                    // Only show floating animation if points were actually deducted
                    if (typeof window.showFloatingScoreText === 'function') {
                        window.showFloatingScoreText(`-${actualPenalty}`, '#f44336');
                    }
                } else {
                    // Still show message but without point deduction
                    const message = gameStyle === 'defense' ?
                        "Incorrect placement!" : "Incorrect number!";
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, message);
                }
            }
            
            // For basic mode, return false to prevent the move
            if (gameStyle === 'basic') {
                return false;
            }
        }
    }
    
  

    board[row][col] = value;
    forceUIUpdate();
    
    if (!isValidMove(row, col, value)) {
        EventSystem.publish(GameEvents.SUDOKU_CELL_INVALID, { row, col, value });
        const validNumbers = getPossibleValues(row, col);
        EventSystem.publish(GameEvents.STATUS_MESSAGE,
            validNumbers.length > 0 ?
            `Warning: Tower violates Sudoku rules. Valid options: ${validNumbers.join(', ')}` :
            "Warning: This tower violates Sudoku rules and will be removed after the wave.");
    } else {
        EventSystem.publish(GameEvents.SUDOKU_CELL_VALID, { row, col, value });
    }
    
    setTimeout(() => {
        checkUnitCompletion();
        if (isComplete()) {
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        }
        forceUIUpdate();
    }, 50);
    
    return true;
}

/**
 * Also add this debug function to help troubleshoot
 */
function debugScoring() {
    console.log("=== SCORING SYSTEM DEBUG ===");
    console.log("PlayerModule available:", window.PlayerModule ? "YES" : "NO");
    
    if (window.PlayerModule) {
        console.log("PlayerModule methods:", Object.keys(PlayerModule));
        console.log("Current player state:", PlayerModule.getState());
    }
    
    // Test score calculation
    const testRow = 4;
    const testCol = 4;
    console.log(`Test calculation for cell [${testRow},${testCol}]:`, calculateMovePoints(testRow, testCol));
    
    // Test direct scoring
    if (window.PlayerModule && typeof PlayerModule.addScore === 'function') {
        console.log("Testing score addition...");
        const currentScore = PlayerModule.getState().score;
        PlayerModule.addScore(5);
        const newScore = PlayerModule.getState().score;
        console.log(`Score before: ${currentScore}, after +5: ${newScore}, difference: ${newScore - currentScore}`);
        
        // Reset score
        PlayerModule.addScore(-(newScore - currentScore));
    }
    
    return "Check browser console for debug info";
}

// Make debug function available globally
window.debugScoring = debugScoring;

/**
 * Helper function to force UI updates
 * This ensures the board visually reflects the current state
 */
function forceUIUpdate() {
  if (window.Game && typeof Game.updateBoard === 'function') {
    Game.updateBoard();
  }
}

/**
 * Check unit completion with debounce to prevent double notifications
 */
let lastUnitCompletionCheck = 0;
/**
 * Check for completed units (rows, columns, 3x3 grids)
 * Improved version with animation timing and UI update management
 */
/**
 * Check for completed units (rows, columns, 3x3 grids)
 * Fixed version that correctly accounts for path cells in columns
 */
/**
 * Check for completed units (rows, columns, 3x3 grids)
 * Completely revised version that properly handles path cells and unique value requirements
 */
/**
 * Check for completed units (rows, columns, 3x3 grids)
 * Fixed version that properly handles path cells in Sudoku validation
 */
function checkUnitCompletion() {
  console.log("Checking unit completions");
  
  // Prevent multiple rapid checks with debounce
  const now = Date.now();
  if (now - lastUnitCompletionCheck < 200) {
    return;
  }
  lastUnitCompletionCheck = now;
  
  // Track newly completed units for animations
  const newlyCompletedRows = [];
  const newlyCompletedColumns = [];
  const newlyCompletedGrids = [];
  
  // Force immediate UI update before checking completions
  forceUIUpdate();
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    // Get all playable cells in this row (excluding path cells)
    const playableCells = [];
    const values = new Set(); // Use Set to ensure uniqueness check
    
for (let col = 0; col < 9; col++) {
  playableCells.push([row, col]);
  const value = board[row][col];
  if (value > 0) {
    values.add(value);
  }
}
    
    // Skip rows that have only path cells
    if (playableCells.length === 0) continue;
    
    // A row is complete when:
    // 1. All playable cells have values (number of cells with values equals number of playable cells)
    // 2. All values are unique (Set size equals number of values)
    // 3. The number of unique values equals the number of playable cells
    
    const filledCellCount = playableCells.filter(([r, c]) => board[r][c] > 0).length;
    const isComplete = filledCellCount === playableCells.length && 
                       values.size === playableCells.length;
    
    // Count player-placed cells (non-fixed)
    let playerCellCount = 0;
    playableCells.forEach(([r, c]) => {
      if (!fixedCells[r][c] && board[r][c] > 0) {
        playerCellCount++;
      }
    });
    
    // Player must have contributed at least one cell
    const playerContributed = playerCellCount > 0;
    
    if (isComplete && !completedRows.has(row)) {
      console.log(`Row ${row} complete: ${playableCells.length} cells, ${values.size} unique values`);
      completedRows.add(row);
      if (playerContributed) {
        newlyCompletedRows.push(row);
      }
    } else if (!isComplete && completedRows.has(row)) {
      completedRows.delete(row);
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    // Get all playable cells in this column (excluding path cells)
    const playableCells = [];
    const values = new Set(); // Use Set to ensure uniqueness check
    
    for (let row = 0; row < 9; row++) {
  playableCells.push([row, col]);
  const value = board[row][col];
  if (value > 0) {
    values.add(value);
  }
}
    
    // Skip columns that have only path cells
    if (playableCells.length === 0) continue;
    
    // A column is complete when all playable cells have unique values
    const filledCellCount = playableCells.filter(([r, c]) => board[r][c] > 0).length;
    const isComplete = filledCellCount === playableCells.length && 
                       values.size === playableCells.length;
    
    // Count player-placed cells (non-fixed)
    let playerCellCount = 0;
    playableCells.forEach(([r, c]) => {
      if (!fixedCells[r][c] && board[r][c] > 0) {
        playerCellCount++;
      }
    });
    
    // Player must have contributed at least one cell
    const playerContributed = playerCellCount > 0;
    
    if (isComplete && !completedColumns.has(col)) {
      console.log(`Column ${col} complete: ${playableCells.length} cells, ${values.size} unique values`);
      completedColumns.add(col);
      if (playerContributed) {
        newlyCompletedColumns.push(col);
      }
    } else if (!isComplete && completedColumns.has(col)) {
      completedColumns.delete(col);
    }
  }
  
  // Check grids (3x3 boxes)
  for (let gridRow = 0; gridRow < 3; gridRow++) {
    for (let gridCol = 0; gridCol < 3; gridCol++) {
      // Get all playable cells in this grid (excluding path cells)
      const playableCells = [];
      const values = new Set(); // Use Set to ensure uniqueness check
      
      for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    const row = gridRow * 3 + i;
    const col = gridCol * 3 + j;
    
    playableCells.push([row, col]);
    const value = board[row][col];
    if (value > 0) {
      values.add(value);
    }
  }
}
      
      // Skip grids that have only path cells
      if (playableCells.length === 0) continue;
      
      // A grid is complete when all playable cells have unique values
      const filledCellCount = playableCells.filter(([r, c]) => board[r][c] > 0).length;
      const isComplete = filledCellCount === playableCells.length && 
                         values.size === playableCells.length;
      
      // Count player-placed cells (non-fixed)
      let playerCellCount = 0;
      playableCells.forEach(([r, c]) => {
        if (!fixedCells[r][c] && board[r][c] > 0) {
          playerCellCount++;
        }
      });
      
      // Player must have contributed at least one cell
      const playerContributed = playerCellCount > 0;
      
      const gridKey = `${gridRow}-${gridCol}`;
      
      if (isComplete && !completedGrids.has(gridKey)) {
        console.log(`Grid ${gridKey} complete: ${playableCells.length} cells, ${values.size} unique values`);
        completedGrids.add(gridKey);
        if (playerContributed) {
          newlyCompletedGrids.push(gridKey);
        }
      } else if (!isComplete && completedGrids.has(gridKey)) {
        completedGrids.delete(gridKey);
      }
    }
  }
  
  // One more UI update before triggering animations
  forceUIUpdate();
  
  // Process newly completed units with proper timing delays
  if (newlyCompletedRows.length > 0 || newlyCompletedColumns.length > 0 || newlyCompletedGrids.length > 0) {
    console.log(`New completions found: Rows: ${newlyCompletedRows.length}, Cols: ${newlyCompletedColumns.length}, Grids: ${newlyCompletedGrids.length}`);
  }
  
  // Trigger events and animations for newly completed units
  newlyCompletedRows.forEach((row, index) => {
    setTimeout(() => {
      console.log(`Publishing row:completed for row ${row}`);
      EventSystem.publish('row:completed', row);
    }, 100 * (index + 1)); // Stagger animations if multiple rows completed
  });
  
  newlyCompletedColumns.forEach((col, index) => {
    setTimeout(() => {
      console.log(`Publishing column:completed for column ${col}`);
      EventSystem.publish('column:completed', col);
    }, 100 * (index + 1) + 200); // Delay columns after rows
  });
  
  newlyCompletedGrids.forEach((grid, index) => {
    setTimeout(() => {
      console.log(`Publishing grid:completed for grid ${grid}`);
      EventSystem.publish('grid:completed', grid);
    }, 100 * (index + 1) + 400); // Delay grids after columns
  });
  
  // Schedule final UI update after all animations should be triggered
  const totalCompletions = newlyCompletedRows.length + newlyCompletedColumns.length + newlyCompletedGrids.length;
  if (totalCompletions > 0) {
    setTimeout(forceUIUpdate, 500 + 100 * totalCompletions);
  }
}

/**
 * Check if the Sudoku is complete and correct
 * Fixed version that properly accounts for path cells
 * @returns {boolean} Whether the Sudoku is complete
 */
function isComplete() {
  console.log("BoardManager: Checking if Sudoku is complete");
  
  if (!solution || solution.length !== 9) {
    console.warn("BoardManager: Solution is not available or malformed.");
    return false;
  }
  
  // Check that all non-path cells match the solution
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (pathCells.has(`${row},${col}`)) continue;
      if (board[row][col] !== solution[row][col]) return false;
    }
  }
  
  // Update completed tracking
  for (let row = 0; row < 9; row++) {
    if (![...Array(9)].some((_, col) => !pathCells.has(`${row},${col}`) && board[row][col] === 0)) {
      completedRows.add(row);
    }
  }
  
  for (let col = 0; col < 9; col++) {
    if (![...Array(9)].some((_, row) => !pathCells.has(`${row},${col}`) && board[row][col] === 0)) {
      completedColumns.add(col);
    }
  }
  
  for (let gridRow = 0; gridRow < 3; gridRow++) {
  for (let gridCol = 0; gridCol < 3; gridCol++) {
    let complete = true;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const row = gridRow * 3 + i;
        const col = gridCol * 3 + j;
        if (board[row][col] === 0) {
          complete = false;
        }
      }
    }
    if (complete) completedGrids.add(`${gridRow}-${gridCol}`);
  }
}
  // Mark timestamp if you want this for reward timing
  if (!window._lastCompletionTime || (Date.now() - window._lastCompletionTime > 5000)) {
    window._lastCompletionTime = Date.now();
  }
  
  console.log("BoardManager: Sudoku puzzle is COMPLETE!");
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
     * Check if the Sudoku is complete and correct
     * This is the robust implementation from enhanced-sudoku-fix.js
     * @returns {boolean} Whether the Sudoku is complete
     */
    /**
 * Check if the Sudoku is complete and correct
 * Fixed version that properly accounts for path cells
 * @returns {boolean} Whether the Sudoku is complete
 */
/**
 * Check if the Sudoku is complete and correct
 * Completely revised version that properly handles path cells
 * @returns {boolean} Whether the Sudoku is complete
 */

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
    toggleDisplayMode
};
})();

// Make module available globally
window.BoardManager = BoardManager;