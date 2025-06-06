const PixiBoard = (function() {
  let app;
  let cellSize = 55;
  let boardContainer;
  let entityContainer;
  let clickHandler = null;
  const towerSprites = {};
  const enemySprites = {};

  function init(options = {}) {
    if (!window.PIXI) {
      console.warn('PIXI not available');
      return;
    }
    cellSize = options.cellSize || cellSize;
    clickHandler = options.onCellClick || null;
    const boardElement = document.getElementById('sudoku-board');
    boardElement.style.position = 'relative';
    const boardSize = boardElement.clientWidth || cellSize * 9;
    cellSize = boardSize / 9;
    app = new PIXI.Application({
      width: boardSize,
      height: boardSize,
      backgroundAlpha: 0
    });
    const canvas = app.view;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    boardElement.appendChild(canvas);

    boardContainer = new PIXI.Container();
    entityContainer = new PIXI.Container();
    app.stage.addChild(boardContainer);
    app.stage.addChild(entityContainer);

    drawGrid();
  }

  function drawGrid() {
    boardContainer.removeChildren();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const g = new PIXI.Graphics();
        g.lineStyle(1, 0x333333, 1);
        g.beginFill(0xffffff, 0); // transparent fill
        g.drawRect(col * cellSize, row * cellSize, cellSize, cellSize);
        g.endFill();
        boardContainer.addChild(g);
      }
    }
  }

  function renderBoard(board, fixedCells, pathCells, towers, isWavePhase) {
    if (!app) return;

    const boardElement = document.getElementById('sudoku-board');
    const size = boardElement.clientWidth;
    if (size && size !== app.renderer.width) {
      cellSize = size / 9;
      app.renderer.resize(size, size);
      drawGrid();
      // resize sprites
      Object.values(towerSprites).forEach(s => {
        s.width = cellSize;
        s.height = cellSize;
        if (typeof s._col === 'number' && typeof s._row === 'number') {
          s.x = s._col * cellSize + cellSize / 2;
          s.y = s._row * cellSize + cellSize / 2;
        }
      });
      Object.values(enemySprites).forEach(s => {
        s.width = cellSize;
        s.height = cellSize;
        if (typeof s._col === 'number' && typeof s._row === 'number') {
          s.x = s._col * cellSize + cellSize / 2;
          s.y = s._row * cellSize + cellSize / 2;
        }
      });
    }

    towers.forEach(updateTowerSprite);
  }

  function addTowerSprite(tower) {
    if (!app) return;
    const texture = PIXI.Texture.from('assets/spritesheet4.png');
    const sprite = new PIXI.Sprite(texture);
    sprite.width = cellSize;
    sprite.height = cellSize;
    sprite.anchor.set(0.5);
    sprite.x = tower.col * cellSize + cellSize / 2;
    sprite.y = tower.row * cellSize + cellSize / 2;
    sprite._row = tower.row;
    sprite._col = tower.col;
    entityContainer.addChild(sprite);
    towerSprites[tower.id] = sprite;
    tower.sprite = sprite;
  }

  function updateTowerSprite(tower) {
    const sprite = towerSprites[tower.id];
    if (sprite) {
      sprite.x = tower.col * cellSize + cellSize / 2;
      sprite.y = tower.row * cellSize + cellSize / 2;
      sprite._row = tower.row;
      sprite._col = tower.col;
    }
  }

  function removeTowerSprite(id) {
    const sprite = towerSprites[id];
    if (sprite) {
      entityContainer.removeChild(sprite);
      sprite.destroy();
      delete towerSprites[id];
    }
  }

  function addEnemySprite(enemy) {
    if (!app) return;
    const texture = PIXI.Texture.from('assets/enemy-sprites.png');
    const sprite = new PIXI.Sprite(texture);
    sprite.width = cellSize;
    sprite.height = cellSize;
    sprite.anchor.set(0.5);
    sprite.x = enemy.col * cellSize + cellSize / 2;
    sprite.y = enemy.row * cellSize + cellSize / 2;
    sprite._row = enemy.row;
    sprite._col = enemy.col;
    entityContainer.addChild(sprite);
    enemySprites[enemy.id] = sprite;
    enemy.sprite = sprite;
  }

  function updateEnemySprite(enemy) {
    const sprite = enemySprites[enemy.id];
    if (sprite) {
      sprite.x = enemy.col * cellSize + cellSize / 2;
      sprite.y = enemy.row * cellSize + cellSize / 2;
      sprite._row = enemy.row;
      sprite._col = enemy.col;
    }
  }

  function removeEnemySprite(id) {
    const sprite = enemySprites[id];
    if (sprite) {
      entityContainer.removeChild(sprite);
      sprite.destroy();
      delete enemySprites[id];
    }
  }

  return {
    init,
    renderBoard,
    addTowerSprite,
    updateTowerSprite,
    removeTowerSprite,
    addEnemySprite,
    updateEnemySprite,
    removeEnemySprite
  };
})();

window.PixiBoard = PixiBoard;
