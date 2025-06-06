/**
 * Simplified BoardManager that delegates to helper modules.
 */
const BoardManager = (function() {
  let difficulty = 'medium';
  let gameStyle = 'defense';
  const difficultySettings = { easy: 40, medium: 30, hard: 25 };

  function init(options = {}) {
    difficulty = options.difficulty || 'medium';
    gameStyle = options.style || 'defense';
    generatePuzzle(difficulty, gameStyle);
  }

  function generatePuzzle(diff = 'easy', style = 'defense') {
    if (style === 'defense') {
      PathGenerator.generateEnemyPath();
    } else {
      PathGenerator.getPathCells().clear();
    }
    const solution = PuzzleGenerator.generateCompleteSolution();
    const cellsToReveal = difficultySettings[diff] || 30;
    const { puzzle, fixed } = PuzzleGenerator.createPuzzleFromSolution(
      solution,
      PathGenerator.getPathCells(),
      cellsToReveal
    );
    BoardState.setState(puzzle, solution, fixed);
    if (typeof EventSystem !== 'undefined') {
      EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
        board: BoardState.getBoard(),
        solution: BoardState.getSolution(),
        fixedCells: BoardState.getFixedCells(),
        pathCells: PathGenerator.getPathArray()
      });
    }
    return BoardState.getBoard();
  }

  function generateEnemyPath(len) {
    const path = PathGenerator.generateEnemyPath(len);
    if (typeof EventSystem !== 'undefined') {
      EventSystem.publish(GameEvents.PATH_CHANGED, path);
    }
    return path;
  }

  return {
    init,
    generatePuzzle,
    generateEnemyPath,
    setCellValue: BoardState.setCellValue,
    getBoard: BoardState.getBoard,
    getSolution: BoardState.getSolution,
    getFixedCells: BoardState.getFixedCells,
    getPathCells: PathGenerator.getPathCells,
    getPathArray: PathGenerator.getPathArray,
    isValidMove: BoardState.isValidMove,
    getPossibleValues: BoardState.getPossibleValues,
    checkUnitCompletion: BoardState.checkUnitCompletion,
    isComplete: BoardState.isComplete,
    getCompletionStatus: BoardState.getCompletionStatus,
    fixBoardDiscrepancies: BoardState.fixBoardDiscrepancies,
    toggleDisplayMode: BoardState.toggleDisplayMode,
    setDifficulty: d => { difficulty = d; }
  };
})();

if (typeof window !== 'undefined') window.BoardManager = BoardManager;


export {};
