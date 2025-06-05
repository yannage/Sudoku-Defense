const PathGenerator = (function() {
  let pathCells = new Set();

  function generateEnemyPath(maxLength = 13) {
    pathCells.clear();
    let row = Math.floor(Math.random() * 9);
    let col = 0;
    pathCells.add(`${row},${col}`);

    while (col < 8 && pathCells.size < maxLength) {
      const moves = [];
      if (row > 0) moves.push([row-1,col]);
      if (row < 8) moves.push([row+1,col]);
      moves.push([row,col+1]);
      const [r,c] = moves[Math.floor(Math.random()*moves.length)];
      row = r; col = c;
      pathCells.add(`${row},${col}`);
    }

    while(col < 8){
      col++;
      pathCells.add(`${row},${col}`);
    }

    return exportPath();
  }

  function exportPath() {
    return Array.from(pathCells).map(p => p.split(',').map(Number));
  }

  function getPathCells() { return pathCells; }
  function getPathArray() { return exportPath(); }

  return { generateEnemyPath, exportPath, getPathCells, getPathArray };
})();

if (typeof window !== 'undefined') window.PathGenerator = PathGenerator;


export {};
