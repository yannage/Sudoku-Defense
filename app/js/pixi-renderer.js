const PixiRenderer = (function() {
  let app;
  let boardElement;
  let cellSize = 0;
  let enemyContainer;
  let towerContainer;
  const enemySprites = {};
  const towerSprites = {};
  const textures = { enemies: [], towers: [] };

  function init(boardEl, size) {
    if (!window.PIXI) {
      console.warn('PIXI not loaded');
      return;
    }
    boardElement = boardEl;
    cellSize = size;
    const containerEl = document.getElementById('pixi-container');
    if (!containerEl) return;
    app = new PIXI.Application({
      width: boardEl.clientWidth,
      height: boardEl.clientHeight,
      transparent: true,
    });
    containerEl.style.position = 'absolute';
    containerEl.style.top = '0';
    containerEl.style.left = '0';
    containerEl.style.pointerEvents = 'none';
    containerEl.appendChild(app.view);

    towerContainer = new PIXI.Container();
    enemyContainer = new PIXI.Container();
    app.stage.addChild(towerContainer);
    app.stage.addChild(enemyContainer);

    loadTextures();
  }

  function loadTextures() {
    const enemyBase = PIXI.BaseTexture.from('assets/enemy-sprites.png');
    const eWidth = 256, eHeight = 288;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        textures.enemies.push(new PIXI.Texture(enemyBase, new PIXI.Rectangle(c * eWidth, r * eHeight, eWidth, eHeight)));
      }
    }
    const towerBase = PIXI.BaseTexture.from('assets/spritesheet4.png');
    const tWidth = 32, tHeight = 32;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        textures.towers.push(new PIXI.Texture(towerBase, new PIXI.Rectangle(c * tWidth, r * tHeight, tWidth, tHeight)));
      }
    }
  }

  function getEnemyTexture(type) {
    const idx = Math.max(0, Math.min(textures.enemies.length - 1, type - 1));
    return textures.enemies[idx];
  }

  function getTowerTexture(type) {
    const idx = Math.max(0, Math.min(textures.towers.length - 1, parseInt(type) - 1));
    return textures.towers[idx];
  }

  function addEnemy(enemy) {
    const match = /enemy-type-(\d+)/.exec(enemy.spriteClass || '');
    const type = match ? parseInt(match[1]) : 1;
    const sprite = new PIXI.Sprite(getEnemyTexture(type));
    sprite.anchor.set(0.5);
    enemyContainer.addChild(sprite);
    enemySprites[enemy.id] = sprite;
    updateEnemy(enemy);
  }

  function updateEnemy(enemy) {
    const sprite = enemySprites[enemy.id];
    if (!sprite) return;
    sprite.x = enemy.col * cellSize + cellSize / 2;
    sprite.y = enemy.row * cellSize + cellSize / 2;
    const scale = cellSize / 256;
    sprite.scale.set(scale);
  }

  function removeEnemy(id) {
    const sprite = enemySprites[id];
    if (sprite) {
      enemyContainer.removeChild(sprite);
      sprite.destroy();
      delete enemySprites[id];
    }
  }

  function syncEnemies(enemies) {
    const seen = new Set();
    enemies.forEach(e => {
      if (!enemySprites[e.id]) addEnemy(e);
      updateEnemy(e);
      seen.add(e.id);
    });
    Object.keys(enemySprites).forEach(id => {
      if (!seen.has(id)) removeEnemy(id);
    });
  }

  function towerKey(tower) {
    return `${tower.row}_${tower.col}`;
  }

  function addTower(tower) {
    const sprite = new PIXI.Sprite(getTowerTexture(tower.type));
    sprite.anchor.set(0.5);
    towerContainer.addChild(sprite);
    towerSprites[towerKey(tower)] = sprite;
    updateTower(tower);
  }

  function updateTower(tower) {
    const sprite = towerSprites[towerKey(tower)];
    if (!sprite) return;
    sprite.x = tower.col * cellSize + cellSize / 2;
    sprite.y = tower.row * cellSize + cellSize / 2;
    const scale = cellSize / 32;
    sprite.scale.set(scale);
  }

  function removeTower(key) {
    const sprite = towerSprites[key];
    if (sprite) {
      towerContainer.removeChild(sprite);
      sprite.destroy();
      delete towerSprites[key];
    }
  }

  function syncTowers(towers) {
    const seen = new Set();
    towers.forEach(t => {
      const key = towerKey(t);
      if (!towerSprites[key]) addTower(t);
      updateTower(t);
      seen.add(key);
    });
    Object.keys(towerSprites).forEach(k => {
      if (!seen.has(k)) removeTower(k);
    });
  }

  function resize(size) {
    cellSize = size;
    if (app && boardElement) {
      app.renderer.resize(boardElement.clientWidth, boardElement.clientHeight);
    }
  }

  return { init, syncEnemies, syncTowers, resize };
})();

if (typeof window !== 'undefined') window.PixiRenderer = PixiRenderer;
