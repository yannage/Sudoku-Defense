const PuzzleGenerator = (function() {
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function findEmptyCell(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  function isValid(grid, row, col, num) {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num || grid[x][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    return true;
  }

  function solveSudoku(grid) {
    const cell = findEmptyCell(grid);
    if (!cell) return true;
    const [row, col] = cell;
    for (let num = 1; num <= 9; num++) {
      if (isValid(grid, row, col, num)) {
        grid[row][col] = num;
        if (solveSudoku(grid)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  function generateCompleteSolution() {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let box = 0; box < 3; box++) {
      const nums = [1,2,3,4,5,6,7,8,9];
      shuffle(nums);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          grid[box*3+i][box*3+j] = nums[i*3+j];
        }
      }
    }
    solveSudoku(grid);
    return grid;
  }

  function createPuzzleFromSolution(solution, pathCells, numToReveal) {
    const puzzle = JSON.parse(JSON.stringify(solution));
    const fixed = Array.from({ length: 9 }, () => Array(9).fill(false));
    const positions = [];
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) positions.push([r,c]);
    shuffle(positions);
    for (const pos of pathCells) {
      const [r,c] = pos.split(',').map(Number);
      puzzle[r][c] = 0;
    }
    let revealed = 0;
    for (const [r,c] of positions) {
      if (pathCells.has(`${r},${c}`)) continue;
      if (revealed < numToReveal) {
        fixed[r][c] = true;
        revealed++;
      } else {
        puzzle[r][c] = 0;
      }
    }
    return { puzzle, fixed };
  }

  return { generateCompleteSolution, createPuzzleFromSolution, solveSudoku };
})();

if (typeof window !== 'undefined') window.PuzzleGenerator = PuzzleGenerator;
