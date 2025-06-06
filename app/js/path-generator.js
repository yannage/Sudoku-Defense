const PathGenerator = (function() {
  let pathCells = new Set();

  function generateEnemyPath(maxLength = 13) {
    pathCells.clear();
    let row = Math.floor(Math.random() * 9);
    let col = 0;
    pathCells.add(`${row},${col}`);

    while (col < 8 && pathCells.size < maxLength) {
      // optionally move vertically before advancing right
      if (Math.random() < 0.5 && pathCells.size < maxLength - 1) {
        const directions = [];
        if (row > 0) directions.push(-1);
        if (row < 8) directions.push(1);
        if (directions.length) {
          row += directions[Math.floor(Math.random() * directions.length)];
          pathCells.add(`${row},${col}`);
        }
      }

      if (col < 8 && pathCells.size < maxLength) {
        col++;
        pathCells.add(`${row},${col}`);
      }
    }

    while (col < 8) {
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
