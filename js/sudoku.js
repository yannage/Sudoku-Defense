
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
  const puzzle = JSON.parse(JSON.stringify(solution));
  const fixed = Array(9).fill().map(() => Array(9).fill(false));
  
  let positions = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  
  shuffle(positions);
  let revealed = 0;
  
  // Set path cells to correct value and mark them fixed (readonly)
  for (let pos of pathCells) {
    const [row, col] = pos.split(',').map(Number);
    puzzle[row][col] = solution[row][col];
    fixed[row][col] = true;
  }
  
  // Reveal additional non-path cells
  for (let [row, col] of positions) {
    if (pathCells.has(`${row},${col}`)) continue;
    
    if (revealed < numToReveal) {
      fixed[row][col] = true;
      revealed++;
    } else {
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
     * Generate a path for enemies to follow
     * Creates a non-overlapping path from a starting point to an end point
     */
    function generateEnemyPath() {
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
        
        // Log path information for debugging
        console.log(`Created non-overlapping path with ${pathCells.size} cells, from (${startRow},0) to (${endRow},8)`);
        
        // Reset completion tracking when path changes
        completedRows.clear();
        completedColumns.clear();
        completedGrids.clear();
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
     */
    function generatePuzzle() {
        console.log("Generating new Sudoku puzzle...");
        
        // Reset completion tracking
        completedRows.clear();
        completedColumns.clear();
        completedGrids.clear();
        
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
            
            // Check for completions after clearing a cell
            checkUnitCompletion(row, col);
            
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

// Only check completions if value is correct
if (solution[row][col] === value) {
    checkUnitCompletion(row, col);
}
        
        // Check if the Sudoku is complete
        if (isComplete()) {
            EventSystem.publish(GameEvents.SUDOKU_COMPLETE);
        }
        
        return true;
    }
    
    /**
     * Check for completions after placing a tower
     * @param {number} row - Row where tower was placed
     * @param {number} col - Column where tower was placed
     */
     

/**
 * Modified checkUnitCompletion function for sudoku.js - streamlined version
 */
function checkUnitCompletion() {
  // Track which units were just completed by the player's last action
  let newlyCompletedByPlayer = false;
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    // Count cells and check completeness
    let nonPathCellCount = 0;
    let filledCellCount = 0;
    let fixedCellCount = 0;
    let isComplete = true;
    let numberSet = new Set();
    
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
    
    // Only trigger bonus if this is newly completed and requires player input
    const playerCompleted = isComplete && (filledCellCount > fixedCellCount);
    
    if (isComplete && !completedRows.has(row)) {
      // Newly completed row
      completedRows.add(row);
      
      // Only trigger bonus if player placed at least one tower
      if (playerCompleted) {
        if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
          CompletionBonusModule.onUnitCompleted('row', row);
          newlyCompletedByPlayer = true;
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
    let isComplete = true;
    let numberSet = new Set();
    
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
    
    const playerCompleted = isComplete && (filledCellCount > fixedCellCount);
    
    if (isComplete && !completedColumns.has(col)) {
      completedColumns.add(col);
      
      if (playerCompleted) {
        if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
          CompletionBonusModule.onUnitCompleted('column', col);
          newlyCompletedByPlayer = true;
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
      let isComplete = true;
      let numberSet = new Set();
      
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
      
      const playerCompleted = isComplete && (filledCellCount > fixedCellCount);
      const gridKey = `${gridRow}-${gridCol}`;
      
      if (isComplete && !completedGrids.has(gridKey)) {
        completedGrids.add(gridKey);
        
        if (playerCompleted) {
          if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
            CompletionBonusModule.onUnitCompleted('grid', gridKey);
            newlyCompletedByPlayer = true;
          }
        }
      } else if (!isComplete && completedGrids.has(gridKey)) {
        completedGrids.delete(gridKey);
      }
    }
  }
  
  return newlyCompletedByPlayer; // Optionally return whether any new completions happened
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
        getPossibleValues,
        generateEnemyPath,
        checkUnitCompletion,
        getCompletionStatus
    };
})();

// Make module available globally
window.SudokuModule = SudokuModule;