const BoardState = (function() {
  let board = Array.from({ length: 9 }, () => Array(9).fill(0));
  let solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  let fixedCells = Array.from({ length: 9 }, () => Array(9).fill(false));
  let completedRows = new Set();
  let completedColumns = new Set();
  let completedGrids = new Set();

  function setState(newBoard, newSolution, newFixed) {
    board = JSON.parse(JSON.stringify(newBoard));
    solution = JSON.parse(JSON.stringify(newSolution));
    fixedCells = JSON.parse(JSON.stringify(newFixed));
    completedRows.clear();
    completedColumns.clear();
    completedGrids.clear();
    checkUnitCompletion();
  }

  function getBoard() { return JSON.parse(JSON.stringify(board)); }
  function getSolution() { return JSON.parse(JSON.stringify(solution)); }
  function getFixedCells() { return JSON.parse(JSON.stringify(fixedCells)); }

  function isValidMove(row, col, value) {
    if (value === 0) return true;
    for (let i=0;i<9;i++) {
      if (i!==col && board[row][i] === value) return false;
      if (i!==row && board[i][col] === value) return false;
    }
    const startRow = Math.floor(row/3)*3;
    const startCol = Math.floor(col/3)*3;
    for (let r=0;r<3;r++) {
      for (let c=0;c<3;c++) {
        const rr=startRow+r, cc=startCol+c;
        if ((rr!==row||cc!==col) && board[rr][cc]===value) return false;
      }
    }
    return true;
  }

  function getPossibleValues(row,col){
    const vals=[];
    for(let n=1;n<=9;n++) if(isValidMove(row,col,n)) vals.push(n);
    return vals;
  }

  function setCellValue(row, col, value) {
    if (row<0||row>8||col<0||col>8) return false;
    if (fixedCells[row][col]) return false;
    if (PathGenerator && PathGenerator.getPathCells && PathGenerator.getPathCells().has(`${row},${col}`)) return false;
    if (value !== 0 && !isValidMove(row,col,value)) return false;
    board[row][col] = value;
    checkUnitCompletion();
    return true;
  }

  function checkUnitCompletion() {
    completedRows.clear();
    completedColumns.clear();
    completedGrids.clear();
    for (let r=0;r<9;r++) {
      const rowSet = new Set();
      const colSet = new Set();
      for (let c=0;c<9;c++) {
        if (board[r][c]>0) rowSet.add(board[r][c]);
        if (board[c][r]>0) colSet.add(board[c][r]);
      }
      if (rowSet.size === 9) completedRows.add(r);
      if (colSet.size === 9) completedColumns.add(r);
    }
    for (let gr=0;gr<3;gr++) {
      for (let gc=0;gc<3;gc++) {
        const vals=new Set();
        for (let r=0;r<3;r++) for (let c=0;c<3;c++) {
          const val=board[gr*3+r][gc*3+c];
          if (val>0) vals.add(val);
        }
        if (vals.size===9) completedGrids.add(`${gr}-${gc}`);
      }
    }
  }

  function isComplete() {
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        if (board[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }

  function getCompletionStatus() {
    return {
      rows: Array.from(completedRows),
      columns: Array.from(completedColumns),
      grids: Array.from(completedGrids)
    };
  }

  function fixBoardDiscrepancies() { return 0; }
  function toggleDisplayMode() {}

  return {
    setState,
    setCellValue,
    getBoard,
    getSolution,
    getFixedCells,
    isValidMove,
    getPossibleValues,
    checkUnitCompletion,
    isComplete,
    getCompletionStatus,
    fixBoardDiscrepancies,
    toggleDisplayMode
  };
})();

if (typeof window !== 'undefined') window.BoardState = BoardState;
