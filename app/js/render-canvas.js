const CanvasRenderer = (function() {
  let canvas, ctx;
  let cellSize = 0;
  let animationId = null;
  let lastTime = 0;
  let fps = 0;
  let frameCount = 0;
  let fpsTime = 0;
  const projectiles = [];

  function init(options = {}) {
    const board = document.getElementById('sudoku-board');
    if (!board) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      board.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }
    resize();
    window.addEventListener('resize', resize);
    if (window.EventSystem && window.GameEvents) {
      EventSystem.subscribe(GameEvents.TOWER_ATTACK, onTowerAttack);
    }
  }

  function resize() {
    const board = document.getElementById('sudoku-board');
    if (!board || !canvas) return;
    canvas.width = board.clientWidth;
    canvas.height = board.clientHeight;
    cellSize = canvas.width / 9;
  }

  function start() {
    if (!animationId) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    frameCount++;
    fpsTime += delta;
    if (fpsTime >= 1000) {
      fps = (frameCount * 1000) / fpsTime;
      frameCount = 0;
      fpsTime = 0;
    }
    draw(delta);
    animationId = requestAnimationFrame(loop);
  }

  function draw(delta) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTowers();
    drawEnemies();
    updateProjectiles(delta);
    drawProjectiles();
  }

  function drawTowers() {
    if (!window.TowersModule || !TowersModule.getTowers) return;
    const towers = TowersModule.getTowers();
    ctx.fillStyle = '#008800';
    towers.forEach(t => {
      const x = t.col * cellSize;
      const y = t.row * cellSize;
      ctx.fillRect(x + cellSize * 0.1, y + cellSize * 0.1, cellSize * 0.8, cellSize * 0.8);
    });
  }

  function drawEnemies() {
    if (!window.EnemiesModule || !EnemiesModule.getEnemies) return;
    const enemies = EnemiesModule.getEnemies();
    ctx.fillStyle = '#880000';
    enemies.forEach(e => {
      const x = e.col * cellSize;
      const y = e.row * cellSize;
      ctx.fillRect(x + cellSize * 0.2, y + cellSize * 0.2, cellSize * 0.6, cellSize * 0.6);
    });
  }

  function onTowerAttack(data) {
    if (!data || !data.tower || !data.enemy) return;
    const startX = data.tower.col * cellSize + cellSize / 2;
    const startY = data.tower.row * cellSize + cellSize / 2;
    const projectile = {
      enemyId: data.enemy.id,
      x: startX,
      y: startY,
      progress: 0,
      speed: 0.005
    };
    projectiles.push(projectile);
  }

  function updateProjectiles(delta) {
    if (!window.EnemiesModule || !EnemiesModule.getEnemies) return;
    const enemies = EnemiesModule.getEnemies();
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const enemy = enemies.find(e => e.id === p.enemyId);
      if (!enemy) {
        projectiles.splice(i, 1);
        continue;
      }
      const targetX = enemy.col * cellSize + cellSize / 2;
      const targetY = enemy.row * cellSize + cellSize / 2;
      p.progress += p.speed * delta;
      if (p.progress >= 1) {
        projectiles.splice(i, 1);
        continue;
      }
      p.x += (targetX - p.x) * p.progress;
      p.y += (targetY - p.y) * p.progress;
    }
  }

  function drawProjectiles() {
    ctx.fillStyle = '#ffff00';
    projectiles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function getFPS() {
    return fps;
  }

  function logFPSComparison() {
    if (typeof window.getDOMFPS === 'function') {
      console.log(`DOM FPS: ${window.getDOMFPS().toFixed(1)} Canvas FPS: ${fps.toFixed(1)}`);
    } else {
      console.log(`Canvas FPS: ${fps.toFixed(1)}`);
    }
  }

  return {
    init,
    start,
    stop,
    getFPS,
    logFPSComparison
  };
})();

window.CanvasRenderer = CanvasRenderer;

(function(){
  let last = performance.now();
  let frames = 0;
  let fps = 0;
  function domLoop(now){
    frames++;
    if(now - last >= 1000){
      fps = frames * 1000 / (now - last);
      frames = 0;
      last = now;
    }
    requestAnimationFrame(domLoop);
  }
  requestAnimationFrame(domLoop);
  window.getDOMFPS = function(){ return fps; };
})();

document.addEventListener('DOMContentLoaded', function(){
  if(window.CanvasRenderer){
    CanvasRenderer.init();
    CanvasRenderer.start();
  }
});
