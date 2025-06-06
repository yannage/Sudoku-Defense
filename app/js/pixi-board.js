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
    boardElement.innerHTML = '';
    app = new PIXI.Application({
      width: cellSize * 9,
      height: cellSize * 9,
      backgroundAlpha: 0
    });
    boardElement.appendChild(app.view);

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
        g.beginFill(0xffffff);
        g.drawRect(col * cellSize, row * cellSize, cellSize, cellSize);
        g.endFill();
        g.interactive = true;
        g.on('pointerdown', () => {
          if (typeof clickHandler === 'function') {
            clickHandler(row, col);
          }
        });
        boardContainer.addChild(g);
      }
    }
  }

  function renderBoard() {
    // grid visuals currently static; future enhancements could recolor cells
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
    entityContainer.addChild(sprite);
    towerSprites[tower.id] = sprite;
    tower.sprite = sprite;
  }

  function updateTowerSprite(tower) {
    const sprite = towerSprites[tower.id];
    if (sprite) {
      sprite.x = tower.col * cellSize + cellSize / 2;
      sprite.y = tower.row * cellSize + cellSize / 2;
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
    entityContainer.addChild(sprite);
    enemySprites[enemy.id] = sprite;
    enemy.sprite = sprite;
  }

  function updateEnemySprite(enemy) {
    const sprite = enemySprites[enemy.id];
    if (sprite) {
      sprite.x = enemy.col * cellSize + cellSize / 2;
      sprite.y = enemy.row * cellSize + cellSize / 2;
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
