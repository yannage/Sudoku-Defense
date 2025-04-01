/**
 * sudoku-compatibility.js
 * This script creates a compatibility layer that provides SudokuModule
 * functions while redirecting to the new BoardManager. This ensures
 * existing code continues to work during the transition.
 */

// Create a SudokuModule compatibility layer if it doesn't exist
window.SudokuModule = window.SudokuModule || (function() {
  console.log("Creating SudokuModule compatibility layer to use BoardManager");
  
  // Check if BoardManager exists
  if (!window.BoardManager) {
    console.error("Neither SudokuModule nor BoardManager is available!");
    return {}; // Return empty object to prevent errors
  }
  
  // Return a proxy object that forwards calls to BoardManager
  return {
    // Core board methods
    getBoard: function() {
      return BoardManager.getBoard();
    },
    
    getSolution: function() {
      return BoardManager.getSolution();
    },
    
    getFixedCells: function() {
      return BoardManager.getFixedCells();
    },
    
    getPathCells: function() {
      return BoardManager.getPathCells();
    },
    
    getPathArray: function() {
      return BoardManager.getPathArray();
    },
    
    // Game actions
    setCellValue: function(row, col, value) {
      return BoardManager.setCellValue(row, col, value);
    },
    
    generatePuzzle: function() {
      return BoardManager.generatePuzzle();
    },
    
    generateEnemyPath: function() {
      return BoardManager.generateEnemyPath();
    },
    
    // Validators and checks
    isValidMove: function(row, col, value) {
      return BoardManager.isValidMove(row, col, value);
    },
    
    getPossibleValues: function(row, col) {
      return BoardManager.getPossibleValues(row, col);
    },
    
    checkUnitCompletion: function() {
      return BoardManager.checkUnitCompletion();
    },
    
    isComplete: function() {
      return BoardManager.isComplete();
    },
    
    // Settings
    setDifficulty: function(difficulty) {
      return BoardManager.setDifficulty(difficulty);
    },
    
    getCompletionStatus: function() {
      return BoardManager.getCompletionStatus();
    }
  };
})();

// Log successful creation of the compatibility layer
console.log("SudokuModule compatibility layer initialized");