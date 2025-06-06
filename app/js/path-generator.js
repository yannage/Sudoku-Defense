const PathGenerator = (function() {
  let pathCells = new Set();

  function generateEnemyPath(maxLength = 13) {
    pathCells.clear();
    let row = Math.floor(Math.random() * 9);
    let col = 0;
    pathCells.add(`${row},${col}`);

    while (col < 8 && pathCells.size < maxLength) {
      col++; // always progress to the right
      const rows = [row];
      if (row > 0) rows.push(row - 1);
      if (row < 8) rows.push(row + 1);
      row = rows[Math.floor(Math.random() * rows.length)];
      pathCells.add(`${row},${col}`);
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
