const MissionControl = (function() {
  let updateInterval = null;
  
  function start() {
    updateTips();
    updateInterval = setInterval(updateTips, 20000);
  }
  
  function stop() {
    clearInterval(updateInterval);
  }
  
  function updateTips() {
    const current = BoardManager.getBoard();
    const solution = BoardManager.getSolution();
    
    let allTips = [
      ...oneMissingInRow(current),
      ...oneMissingInCol(current),
      ...oneMissingInGrid(current),
      ...twoMissingInRow(current),
      ...twoMissingInCol(current),
      ...numberAlmostUsed(current, solution),
      ...missingNumberCompletely(current),
      ...numberUnderused(current),
      ...nearlyFullUnits(current),
      ...digitMissingInGrid(current)
    ];
    
    allTips.sort((a, b) => a.weight - b.weight);
    const selected = shuffle(allTips).slice(0, 3);
    
    const tipList = document.getElementById('mission-tips');
    if (!tipList) return;
    
    tipList.innerHTML = '';
    selected.forEach((tip, index) => {
      const li = document.createElement('li');
      li.textContent = `Mission Control: ${tip.text}`;
      tipList.appendChild(li);
      
      if (index < selected.length - 1) {
        const divider = document.createElement('li');
        divider.textContent = '==============================';
        divider.style.color = '#666';
        divider.style.fontFamily = 'monospace';
        divider.style.textAlign = 'center';
        tipList.appendChild(divider);
      }
    });
  }
  
  function shuffle(arr) {
    return arr.map(v => [v, Math.random()])
      .sort((a, b) => a[1] - b[1])
      .map(v => v[0]);
  }
  
  // === HINT MODULES WITH COMMANDER TONE ===
  
  function oneMissingInRow(board) {
    const tips = [];
    board.forEach((row, r) => {
      const empties = row.reduce((acc, val, c) => val === 0 ? [...acc, c] : acc, []);
      if (empties.length === 1) {
        tips.push({
          weight: 1,
          text: `Set your sights on Row ${r + 1}, rookie. One spot left—make it count.`
        });
      }
    });
    return tips;
  }
  
  function oneMissingInCol(board) {
    const tips = [];
    for (let c = 0; c < 9; c++) {
      const empties = [];
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === 0) empties.push(r);
      }
      if (empties.length === 1) {
        tips.push({
          weight: 1,
          text: `Column ${c + 1} has a hole waiting to be filled. Don’t make me draw it for you.`
        });
      }
    }
    return tips;
  }
  
  function oneMissingInGrid(board) {
    const tips = [];
    for (let grid = 0; grid < 9; grid++) {
      const rowBase = Math.floor(grid / 3) * 3;
      const colBase = (grid % 3) * 3;
      let empties = 0;
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (board[rowBase + r][colBase + c] === 0) empties++;
        }
      }
      
      if (empties === 1) {
        tips.push({
          weight: 1,
          text: `Grid ${grid + 1} is one move from secure. Don’t leave it hanging.`
        });
      }
    }
    return tips;
  }
  
  function twoMissingInRow(board) {
    const tips = [];
    board.forEach((row, r) => {
      const emptyCount = row.filter(n => n === 0).length;
      if (emptyCount === 2) {
        tips.push({
          weight: 2,
          text: `Eyes on Row ${r + 1}. Two blanks left. You clear that, you gain ground.`
        });
      }
    });
    return tips;
  }
  
  function twoMissingInCol(board) {
    const tips = [];
    for (let c = 0; c < 9; c++) {
      let emptyCount = 0;
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === 0) emptyCount++;
      }
      if (emptyCount === 2) {
        tips.push({
          weight: 2,
          text: `Column ${c + 1} is soft with just two blanks. Lock it down. Now.`
        });
      }
    }
    return tips;
  }
  
  function numberAlmostUsed(current, solution) {
    const tips = [];
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (current[r][c] === num) count++;
        }
      }
      if (count === 7 || count === 8) {
        tips.push({
          weight: 3,
          text: `Almost done placing the ${num}s. Clean it up—HQ hates loose ends.`
        });
      }
    }
    return tips;
  }
  
  // === NEW EDUCATIONAL MODULES ===
  
  function missingNumberCompletely(current) {
    const tips = [];
    for (let num = 1; num <= 9; num++) {
      let found = false;
      for (let r = 0; r < 9; r++) {
        if (current[r].includes(num)) {
          found = true;
          break;
        }
      }
      if (!found) {
        tips.push({
          weight: 4,
          text: `We’ve got zero ${num}s on the field. Start scouting good landing zones — they’re overdue.`
        });
      }
    }
    return tips;
  }
  
  function numberUnderused(current) {
    const tips = [];
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (current[r][c] === num) count++;
        }
      }
      if (count >= 1 && count <= 3) {
        tips.push({
          weight: 4,
          text: `${num}s are rare in the wild right now — just ${count} on the board. Look where they could belong.`
        });
      }
    }
    return tips;
  }
  
  function nearlyFullUnits(current) {
    const tips = [];
    for (let i = 0; i < 9; i++) {
      const rowCount = current[i].filter(n => n !== 0).length;
      if (rowCount >= 7) {
        tips.push({
          weight: 3,
          text: `Row ${i + 1} is mostly locked in. Only a few gaps left — that’s prime territory.`
        });
      }
      
      let colCount = 0;
      for (let r = 0; r < 9; r++) {
        if (current[r][i] !== 0) colCount++;
      }
      if (colCount >= 7) {
        tips.push({
          weight: 3,
          text: `Column ${i + 1} is 75% done. You’re close to cracking it.`
        });
      }
    }
    return tips;
  }
  
  function digitMissingInGrid(current) {
    const tips = [];
    for (let num = 1; num <= 9; num++) {
      for (let grid = 0; grid < 9; grid++) {
        const rowBase = Math.floor(grid / 3) * 3;
        const colBase = (grid % 3) * 3;
        let found = false;
        
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (current[rowBase + r][colBase + c] === num) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        
        if (!found) {
          tips.push({
            weight: 4,
            text: `No sign of ${num}s in Grid ${grid + 1}. That’s a blind spot worth investigating.`
          });
        }
      }
    }
    return tips;
  }
  
  return { start, stop };
})();

// Attach to window
window.MissionControl = MissionControl;


EventSystem.subscribe("PHASE_STARTED", (phase) => {
  if (phase === "sudoku") {
    MissionControl.start();
  } else {
    MissionControl.stop();
  }
});