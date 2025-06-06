const PixiBoard = (function() {
  let app;
  let cellSize = 55;
  let boardContainer;
  let entityContainer;
  let clickHandler = null;
  const towerSprites = {};
  const enemySprites = {};

  let towerBaseTexture;
  let towerBarrelTexture;
  let enemyBaseTexture;

  function init(options = {}) {
    if (!window.PIXI) {
      console.warn('PIXI not available');
      return;
    }

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    cellSize = options.cellSize || cellSize;
    clickHandler = options.onCellClick || null;

    towerBaseTexture = PIXI.BaseTexture.from('assets/spritesheet4.png');
    towerBarrelTexture = PIXI.BaseTexture.from('assets/aimsheet3.png');
    enemyBaseTexture = PIXI.BaseTexture.from('assets/enemy-sprites.png');
    [towerBaseTexture, towerBarrelTexture, enemyBaseTexture].forEach(t => {
      t.scaleMode = PIXI.SCALE_MODES.NEAREST;
    });

    const boardElement = document.getElementById('sudoku-board');
    boardElement.style.position = 'relative';
    const boardSize = boardElement.clientWidth || cellSize * 9;
    cellSize = boardSize / 9;
    app = new PIXI.Application({
      width: boardSize,
      height: boardSize,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });
    const canvas = app.view;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.imageRendering = 'pixelated';
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

  function getTowerTexture(type) {
    if (!towerBaseTexture) return null;
    const w = towerBaseTexture.width / 3;
    const h = towerBaseTexture.height / 3;
    const col = (type - 1) % 3;
    const row = Math.floor((type - 1) / 3);
    return new PIXI.Texture(towerBaseTexture, new PIXI.Rectangle(col * w, row * h, w, h));
  }

  function getBarrelTexture(type) {
    if (!towerBarrelTexture) return null;
    const w = towerBarrelTexture.width / 3;
    const h = towerBarrelTexture.height / 3;
    const col = (type - 1) % 3;
    const row = Math.floor((type - 1) / 3);
    return new PIXI.Texture(towerBarrelTexture, new PIXI.Rectangle(col * w, row * h, w, h));
  }

  function getEnemyTexture(spriteClass) {
    if (!enemyBaseTexture || !spriteClass) return null;
    const match = /enemy-type-(\d+)/.exec(spriteClass);
    const typeNum = match ? parseInt(match[1], 10) : 1;
    const w = enemyBaseTexture.width / 3;
    const h = enemyBaseTexture.height / 4;
    const col = (typeNum - 1) % 3;
    const row = Math.floor((typeNum - 1) / 3);
    return new PIXI.Texture(enemyBaseTexture, new PIXI.Rectangle(col * w, row * h, w, h));
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
      Object.values(towerSprites).forEach(obj => {
        const c = obj.container || obj;
        c.x = c._col * cellSize + cellSize / 2;
        c.y = c._row * cellSize + cellSize / 2;
        if (obj.base) {
          obj.base.width = cellSize;
          obj.base.height = cellSize;
        }
        if (obj.barrel) {
          obj.barrel.width = cellSize;
          obj.barrel.height = cellSize;
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

    towers.forEach(t => {
      if (!towerSprites[t.id]) {
        addTowerSprite(t);
      } else {
        updateTowerSprite(t);
      }
    });

    Object.values(towerSprites).forEach(obj => {
      if (obj.container) {
        obj.container.visible = isWavePhase;
      }
    });
  }

  function addTowerSprite(tower) {
    if (!app) return;
    const container = new PIXI.Container();
    const base = new PIXI.Sprite(getTowerTexture(tower.type));
    const barrel = new PIXI.Sprite(getBarrelTexture(tower.type));
    base.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    barrel.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    base.anchor.set(0.5);
    barrel.anchor.set(0.5);
    base.width = cellSize;
    base.height = cellSize;
    barrel.width = cellSize;
    barrel.height = cellSize;
    container.addChild(base);
    container.addChild(barrel);
    container.x = tower.col * cellSize + cellSize / 2;
    container.y = tower.row * cellSize + cellSize / 2;
    container._row = tower.row;
    container._col = tower.col;
    container._id = tower.id;
    entityContainer.addChild(container);
    towerSprites[tower.id] = { container, base, barrel };
    tower.sprite = container;
  }

  function updateTowerSprite(tower) {
    const obj = towerSprites[tower.id];
    if (obj) {
      const c = obj.container || obj;
      c.x = tower.col * cellSize + cellSize / 2;
      c.y = tower.row * cellSize + cellSize / 2;
      c._row = tower.row;
      c._col = tower.col;
    }
  }

  function removeTowerSprite(id) {
    const obj = towerSprites[id];
    if (obj) {
      const c = obj.container || obj;
      entityContainer.removeChild(c);
      c.destroy({ children: true });
      delete towerSprites[id];
    }
  }

  function addEnemySprite(enemy) {
    if (!app) return;
    const sprite = new PIXI.Sprite(getEnemyTexture(enemy.spriteClass));
    sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
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
