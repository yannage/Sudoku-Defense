/**
 * Enhanced Mission Control System
 * Provides intelligent, contextual hints for Sudoku puzzle solving
 */
const MissionControl = (function() {
  let updateInterval = null;
  let previousTips = new Set(); // Track recently shown tips to avoid repetition
  
  function start() {
  updateTips();
  updateInterval = setInterval(updateTips, 60000); // 1 minute
}
  
  function stop() {
    clearInterval(updateInterval);
  }
  
  function updateTips() {
    const current = BoardManager.getBoard();
    const solution = BoardManager.getSolution();
    const pathCells = BoardManager.getPathCells();
    
    // Generate all possible tips with priority weights
    let allTips = [
      // High priority tactical tips
      ...findEasyPlacements(current, solution, pathCells),
      ...findNakedSingles(current, pathCells),
      ...findHiddenSingles(current, pathCells),
      ...findAlmostCompletedUnits(current, pathCells),
      
      // Medium priority strategic tips
      ...findNumberWithFewPositions(current, pathCells),
      ...suggestScanningTechnique(current, pathCells),
      ...findNearlyFullUnits(current, pathCells),
      
      // Lower priority general guidance
      ...suggestNextFocus(current, pathCells)
    ];
    
    // Filter out previously shown tips to avoid repetition
    allTips = allTips.filter(tip => !previousTips.has(tip.id));
    
    // If we're running low on fresh tips, clear history
    if (allTips.length < 3) {
      previousTips.clear();
      allTips = [
        ...findEasyPlacements(current, solution, pathCells),
        ...findNakedSingles(current, pathCells),
        ...findHiddenSingles(current, pathCells),
        ...findAlmostCompletedUnits(current, pathCells),
        ...findNumberWithFewPositions(current, pathCells),
        ...suggestScanningTechnique(current, pathCells),
        ...findNearlyFullUnits(current, pathCells),
        ...suggestNextFocus(current, pathCells)
      ];
    }
    
    // Sort by priority weight (lower is higher priority)
    allTips.sort((a, b) => a.weight - b.weight);
    
    // Select 3 tips with different focus areas if possible
    const selected = selectDiverseTips(allTips, 3);
    
    // Add selected tips to recently shown set
    selected.forEach(tip => previousTips.add(tip.id));
    
    // Keep set size manageable
    if (previousTips.size > 15) {
      // Convert to array, remove oldest entries
      const tipsArray = Array.from(previousTips);
      previousTips = new Set(tipsArray.slice(tipsArray.length - 10));
    }
    
    const tipList = document.getElementById('mission-tips');
    if (!tipList) return;
    
    tipList.innerHTML = '';
    selected.forEach((tip, index) => {
      const li = document.createElement('li');
      li.textContent = tip.text;
      li.style.padding = '8px 0';
      
      // Add visual indicator for tip type
      const icon = document.createElement('span');
      icon.textContent = getTipIcon(tip.type);
      icon.style.marginRight = '8px';
      icon.style.fontSize = '16px';
      li.prepend(icon);
      
      // Add location hint styling if applicable
      if (tip.location) {
        const locationSpan = document.createElement('span');
        locationSpan.textContent = tip.location;
        locationSpan.style.fontWeight = 'bold';
        locationSpan.style.color = '#4caf50';
        
        // Replace placeholder with styled location
        li.innerHTML = li.innerHTML.replace(tip.location, locationSpan.outerHTML);
      }
      
      tipList.appendChild(li);
      
      if (index < selected.length - 1) {
        const divider = document.createElement('li');
        divider.innerHTML = '<hr style="border: none; border-top: 1px solid #444; margin: 5px 0;">';
        tipList.appendChild(divider);
      }
    });
  }
  
  // Helper function to select diverse tips
  function selectDiverseTips(tips, count) {
    const selected = [];
    const typesUsed = new Set();
    
    // First pass - try to get diverse tip types
    for (const tip of tips) {
      if (selected.length >= count) break;
      
      if (!typesUsed.has(tip.type)) {
        selected.push(tip);
        typesUsed.add(tip.type);
      }
    }
    
    // Second pass - fill remaining slots with highest priority remaining tips
    if (selected.length < count) {
      const remaining = tips.filter(tip => !selected.includes(tip));
      selected.push(...remaining.slice(0, count - selected.length));
    }
    
    return selected;
  }
  
  function getTipIcon(type) {
    switch(type) {
      case 'direct': return '🎯';
      case 'tactical': return '⚔️';
      case 'strategic': return '🧠';
      case 'technique': return '🔍';
      case 'focus': return '🔆';
      default: return '💡';
    }
  }
  
  // Find cells with only one possible value (naked singles)
  function findNakedSingles(board, pathCells) {
    const tips = [];
    const nakedSingleLocations = [];
    
    // Search for cells with only one possible value
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0 || pathCells.has(`${row},${col}`)) continue;
        
        const possibleValues = getPossibleValues(board, row, col, pathCells);
        if (possibleValues.length === 1) {
          nakedSingleLocations.push({
            row, 
            col, 
            value: possibleValues[0]
          });
        }
      }
    }
    
    // Generate tips from the findings
    if (nakedSingleLocations.length > 0) {
      // Select one to hint about specifically
      const hintCell = nakedSingleLocations[Math.floor(Math.random() * nakedSingleLocations.length)];
      const locationText = `R${hintCell.row + 1}C${hintCell.col + 1}`;
      
      tips.push({
        id: `naked-single-${hintCell.row}-${hintCell.col}`,
        type: 'direct',
        weight: 1,
        location: locationText,
        text: `I've spotted a cell at ${locationText} that can only contain one possible value. This is what experts call a "naked single".`
      });
      
      // If there are multiple naked singles, add a general tip
      if (nakedSingleLocations.length > 1) {
        tips.push({
          id: `naked-singles-count-${nakedSingleLocations.length}`,
          type: 'tactical',
          weight: 2,
          text: `There are ${nakedSingleLocations.length} cells on the grid that can only contain one possible value. Finding these "naked singles" is the easiest way to make progress.`
        });
      }
    }
    
    return tips;
  }
  
  // Find easy placements using solution (careful not to be too direct)
  function findEasyPlacements(board, solution, pathCells) {
    const tips = [];
    
    // Look for places where a specific number would be easy to deduce
    for (let num = 1; num <= 9; num++) {
      const numLocations = [];
      
      // Count how many of this number are already placed
      let placedCount = 0;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === num) {
            placedCount++;
          } else if (board[row][col] === 0 && solution[row][col] === num && !pathCells.has(`${row},${col}`)) {
            // This is a valid location for the number in the solution
            numLocations.push({row, col});
          }
        }
      }
      
      // Only give hints for numbers that are already partially placed
      if (placedCount >= 3 && numLocations.length > 0) {
        // Find a location that would be relatively easy to deduce
        const easyLocations = numLocations.filter(loc => {
          return isEasyToDetect(board, loc.row, loc.col, num, pathCells);
        });
        
        if (easyLocations.length > 0) {
          const loc = easyLocations[Math.floor(Math.random() * easyLocations.length)];
          
          // Determine which unit (row, column, or box) makes this deduction clearest
          const {unitType, unitIndex} = findBestUnitForHint(board, loc.row, loc.col, num, pathCells);
          
          // Create a hint pointing to the unit rather than the exact cell
          let locationText = '';
          let tipText = '';
          
          switch(unitType) {
            case 'row':
              locationText = `Row ${loc.row + 1}`;
              tipText = `${locationText} has only one possible position for the number ${num}. Check where it already appears in this row's related units.`;
              break;
            case 'col':
              locationText = `Column ${loc.col + 1}`;
              tipText = `${locationText} has only one possible position for the number ${num}. Check which cells are already eliminated by existing placements.`;
              break;
            case 'box':
              const boxRow = Math.floor(loc.row / 3);
              const boxCol = Math.floor(loc.col / 3);
              locationText = `Box ${boxRow * 3 + boxCol + 1}`;
              tipText = `${locationText} has only one possible position for the number ${num}. Look at where ${num} already appears in related rows and columns.`;
              break;
          }
          
          tips.push({
            id: `easy-place-${num}-${loc.row}-${loc.col}`,
            type: 'tactical',
            weight: 1,
            location: locationText,
            text: tipText
          });
        }
      }
    }
    
    return tips;
  }
  
  // Find hidden singles (where a number can only go in one spot in a unit)
  function findHiddenSingles(board, pathCells) {
    const tips = [];
    const hiddenSingles = [];
    
    // Check rows for hidden singles
    for (let row = 0; row < 9; row++) {
      for (let num = 1; num <= 9; num++) {
        let possiblePositions = [];
        
        // Skip if number already exists in row
        let alreadyExists = false;
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === num) {
            alreadyExists = true;
            break;
          }
        }
        if (alreadyExists) continue;
        
        // Find possible positions for this number in the row
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0 && !pathCells.has(`${row},${col}`) && 
              canPlaceNumber(board, row, col, num, pathCells)) {
            possiblePositions.push(col);
          }
        }
        
        // If there's only one possible position, we have a hidden single
        if (possiblePositions.length === 1) {
          hiddenSingles.push({
            row, 
            col: possiblePositions[0],
            num,
            unitType: 'row',
            unitIndex: row
          });
        }
      }
    }
    
    // Check columns for hidden singles
    for (let col = 0; col < 9; col++) {
      for (let num = 1; num <= 9; num++) {
        let possiblePositions = [];
        
        // Skip if number already exists in column
        let alreadyExists = false;
        for (let row = 0; row < 9; row++) {
          if (board[row][col] === num) {
            alreadyExists = true;
            break;
          }
        }
        if (alreadyExists) continue;
        
        // Find possible positions for this number in the column
        for (let row = 0; row < 9; row++) {
          if (board[row][col] === 0 && !pathCells.has(`${row},${col}`) && 
              canPlaceNumber(board, row, col, num, pathCells)) {
            possiblePositions.push(row);
          }
        }
        
        // If there's only one possible position, we have a hidden single
        if (possiblePositions.length === 1) {
          hiddenSingles.push({
            row: possiblePositions[0], 
            col,
            num,
            unitType: 'column',
            unitIndex: col
          });
        }
      }
    }
    
    // Check boxes for hidden singles
    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const boxRow = Math.floor(boxIndex / 3) * 3;
      const boxCol = (boxIndex % 3) * 3;
      
      for (let num = 1; num <= 9; num++) {
        let possiblePositions = [];
        
        // Skip if number already exists in box
        let alreadyExists = false;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (board[boxRow + r][boxCol + c] === num) {
              alreadyExists = true;
              break;
            }
          }
          if (alreadyExists) break;
        }
        if (alreadyExists) continue;
        
        // Find possible positions for this number in the box
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow + r;
            const col = boxCol + c;
            if (board[row][col] === 0 && !pathCells.has(`${row},${col}`) && 
                canPlaceNumber(board, row, col, num, pathCells)) {
              possiblePositions.push({row, col});
            }
          }
        }
        
        // If there's only one possible position, we have a hidden single
        if (possiblePositions.length === 1) {
          hiddenSingles.push({
            row: possiblePositions[0].row, 
            col: possiblePositions[0].col,
            num,
            unitType: 'box',
            unitIndex: boxIndex
          });
        }
      }
    }
    
    // Generate tips from the findings
    if (hiddenSingles.length > 0) {
      // Select one to hint about
      const hint = hiddenSingles[Math.floor(Math.random() * hiddenSingles.length)];
      
      let unitName = '';
      switch(hint.unitType) {
        case 'row': unitName = `Row ${hint.unitIndex + 1}`; break;
        case 'column': unitName = `Column ${hint.unitIndex + 1}`; break;
        case 'box': unitName = `Box ${hint.unitIndex + 1}`; break;
      }
      
      tips.push({
        id: `hidden-single-${hint.row}-${hint.col}-${hint.num}`,
        type: 'tactical',
        weight: 2,
        location: unitName,
        text: `In ${unitName}, the number ${hint.num} can only go in one position. This pattern is called a "hidden single" - the number is hidden among other possibilities.`
      });
      
      // If there are multiple hidden singles, add a general tip
      if (hiddenSingles.length > 1) {
        tips.push({
          id: `hidden-singles-count-${hiddenSingles.length}`,
          type: 'technique',
          weight: 3,
          text: `Try looking for "hidden singles" - cases where a specific number can only go in one position within a row, column, or box. I've spotted ${hiddenSingles.length} of these on the board.`
        });
      }
    }
    
    return tips;
  }
  
  // Find almost completed units (rows, columns, boxes)
  function findAlmostCompletedUnits(board, pathCells) {
    const tips = [];
    
    // Check rows
    for (let row = 0; row < 9; row++) {
      const emptyCells = [];
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
          emptyCells.push(col);
        }
      }
      
      if (emptyCells.length === 2) {
        tips.push({
          id: `almost-row-${row}`,
          type: 'focus',
          weight: 2,
          location: `Row ${row + 1}`,
          text: `Row ${row + 1} is nearly complete with only two cells left to fill. Focus here for a quick win.`
        });
      }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
      const emptyCells = [];
      for (let row = 0; row < 9; row++) {
        if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
          emptyCells.push(row);
        }
      }
      
      if (emptyCells.length === 2) {
        tips.push({
          id: `almost-col-${col}`,
          type: 'focus',
          weight: 2,
          location: `Column ${col + 1}`,
          text: `Column ${col + 1} needs just two more numbers. Examine the rest of the column to determine what's missing.`
        });
      }
    }
    
    // Check boxes
    for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
      const boxRow = Math.floor(boxIndex / 3) * 3;
      const boxCol = (boxIndex % 3) * 3;
      
      const emptyCells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow + r;
          const col = boxCol + c;
          if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
            emptyCells.push({row, col});
          }
        }
      }
      
      if (emptyCells.length === 2) {
        tips.push({
          id: `almost-box-${boxIndex}`,
          type: 'focus',
          weight: 2,
          location: `Box ${boxIndex + 1}`,
          text: `Box ${boxIndex + 1} is just two numbers away from completion. Look at the related rows and columns to deduce what fits.`
        });
      }
    }
    
    return tips;
  }
  
  // Find numbers with few remaining positions
  function findNumberWithFewPositions(board, pathCells) {
    const tips = [];
    
    for (let num = 1; num <= 9; num++) {
      // Count how many of this number are already placed
      let placedCount = 0;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === num) {
            placedCount++;
          }
        }
      }
      
      if (placedCount >= 6 && placedCount <= 8) {
        const remaining = 9 - placedCount;
        
        tips.push({
          id: `number-almost-complete-${num}-${placedCount}`,
          type: 'focus',
          weight: 3,
          text: `Almost done with the number ${num}! Only ${remaining} more to place. Scan the grid to see which ${remaining} units are missing this number.`
        });
      }
    }
    
    return tips;
  }
  
  // Suggest scanning technique
  function suggestScanningTechnique(board, pathCells) {
    const tips = [];
    
    // Find an underutilized number (3-5 placed)
    for (let num = 1; num <= 9; num++) {
      let placedCount = 0;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === num) {
            placedCount++;
          }
        }
      }
      
      if (placedCount >= 3 && placedCount <= 5) {
        tips.push({
          id: `scanning-technique-${num}`,
          type: 'technique',
          weight: 4,
          text: `Try the "scanning technique" with the number ${num}. Find all existing ${num}s, then mentally note which rows, columns, and boxes must exclude ${num}. The intersections will reveal new placements.`
        });
        break; // Only add one of these tips
      }
    }
    
    return tips;
  }
  
  // Find nearly full units
  function findNearlyFullUnits(board, pathCells) {
    const tips = [];
    
    // Count filled cells in each unit type
    const rowCounts = Array(9).fill(0);
    const colCounts = Array(9).fill(0);
    const boxCounts = Array(9).fill(0);
    
    // Count filled cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0) {
          rowCounts[row]++;
          colCounts[col]++;
          
          const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
          boxCounts[boxIndex]++;
        }
      }
    }
    
    // Find units with 6-7 filled cells (not too easy, not too hard)
    for (let i = 0; i < 9; i++) {
      if (rowCounts[i] >= 6 && rowCounts[i] <= 7) {
        tips.push({
          id: `focus-row-${i}`,
          type: 'strategic',
          weight: 4,
          location: `Row ${i + 1}`,
          text: `Row ${i + 1} is well underway with ${rowCounts[i]} cells filled. Focus here for steady progress.`
        });
      }
      
      if (colCounts[i] >= 6 && colCounts[i] <= 7) {
        tips.push({
          id: `focus-col-${i}`,
          type: 'strategic',
          weight: 4,
          location: `Column ${i + 1}`,
          text: `Column ${i + 1} has good progress with ${colCounts[i]} cells filled. A few more deductions should complete it.`
        });
      }
      
      if (boxCounts[i] >= 6 && boxCounts[i] <= 7) {
        tips.push({
          id: `focus-box-${i}`,
          type: 'strategic',
          weight: 4,
          location: `Box ${i + 1}`,
          text: `Box ${i + 1} is ${boxCounts[i]}/9 complete. Filling this box could unlock possibilities elsewhere.`
        });
      }
    }
    
    return tips;
  }
  
  // Suggest next focus area
  function suggestNextFocus(board, pathCells) {
    const tips = [];
    
    // Consider the big picture - what numbers have the fewest placements?
    const numberCounts = Array(10).fill(0); // Index 0 not used
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] > 0) {
          numberCounts[board[row][col]]++;
        }
      }
    }
    
    // Find the least frequent number that has at least one placement
    let leastFreqNum = 0;
    let minCount = 10;
    
    for (let num = 1; num <= 9; num++) {
      if (numberCounts[num] > 0 && numberCounts[num] < minCount) {
        minCount = numberCounts[num];
        leastFreqNum = num;
      }
    }
    
    if (leastFreqNum > 0 && minCount < 5) {
      tips.push({
        id: `focus-number-${leastFreqNum}`,
        type: 'strategic',
        weight: 5,
        text: `The number ${leastFreqNum} appears only ${minCount} times on the board. Focus on finding new placements for this number to make significant progress.`
      });
    }
    
    // Find the next move that would unlock the most possibilities
    let maxImpactCell = null;
    let maxImpactScore = 0;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
          const possibilities = getPossibleValues(board, row, col, pathCells);
          if (possibilities.length >= 2 && possibilities.length <= 3) {
            // This is a cell with a few possibilities - could have high impact
            const impactScore = calculateImpactScore(board, row, col, pathCells);
            if (impactScore > maxImpactScore) {
              maxImpactScore = impactScore;
              maxImpactCell = {row, col};
            }
          }
        }
      }
    }
    
    if (maxImpactCell && maxImpactScore > 5) {
      tips.push({
        id: `strategic-impact-${maxImpactCell.row}-${maxImpactCell.col}`,
        type: 'strategic',
        weight: 4,
        location: `R${maxImpactCell.row + 1}C${maxImpactCell.col + 1}`,
        text: `The area around ${`R${maxImpactCell.row + 1}C${maxImpactCell.col + 1}`} is a strategic hotspot. Resolving this cell would unlock several other positions.`
      });
    }
    
    return tips;
  }
  
  // ===== HELPER FUNCTIONS =====
  
  // Get possible values for a cell
  function getPossibleValues(board, row, col, pathCells) {
    if (board[row][col] !== 0 || pathCells.has(`${row},${col}`)) {
      return [];
    }
    
    const possible = [];
    for (let num = 1; num <= 9; num++) {
      if (canPlaceNumber(board, row, col, num, pathCells)) {
        possible.push(num);
      }
    }
    
    return possible;
  }
  
  // Check if number can be placed at position
  function canPlaceNumber(board, row, col, num, pathCells) {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }
    
    // Check box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[boxRow + r][boxCol + c] === num) return false;
      }
    }
    
    return true;
  }
  
  // Calculate how easy it would be to detect this number
  function isEasyToDetect(board, row, col, num, pathCells) {
    // Count how many other cells in this row, column, box could hold this number
    let rowPossibilities = 0;
    let colPossibilities = 0;
    let boxPossibilities = 0;
    
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] === 0 && !pathCells.has(`${row},${c}`) && 
          canPlaceNumber(board, row, c, num, pathCells)) {
        rowPossibilities++;
      }
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] === 0 && !pathCells.has(`${r},${col}`) && 
          canPlaceNumber(board, r, col, num, pathCells)) {
        colPossibilities++;
      }
    }
    
    // Check box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const currRow = boxRow + r;
        const currCol = boxCol + c;
        if ((currRow !== row || currCol !== col) && 
            board[currRow][currCol] === 0 && 
            !pathCells.has(`${currRow},${currCol}`) && 
            canPlaceNumber(board, currRow, currCol, num, pathCells)) {
          boxPossibilities++;
        }
      }
    }
    
    // It's easy to detect if there are few other possibilities in at least one unit
    return rowPossibilities <= 1 || colPossibilities <= 1 || boxPossibilities <= 1;
  }
  
// Find which unit makes this hint clearest (continued)
function findBestUnitForHint(board, row, col, num, pathCells) {
  let rowPossibilities = 0;
  let colPossibilities = 0;
  let boxPossibilities = 0;
  
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === 0 && !pathCells.has(`${row},${c}`) &&
      canPlaceNumber(board, row, c, num, pathCells)) {
      rowPossibilities++;
    }
  }
  
  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === 0 && !pathCells.has(`${r},${col}`) &&
      canPlaceNumber(board, r, col, num, pathCells)) {
      colPossibilities++;
    }
  }
  
  // Check box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currRow = boxRow + r;
      const currCol = boxCol + c;
      if ((currRow !== row || currCol !== col) &&
        board[currRow][currCol] === 0 &&
        !pathCells.has(`${currRow},${currCol}`) &&
        canPlaceNumber(board, currRow, currCol, num, pathCells)) {
        boxPossibilities++;
      }
    }
  }
  
  // Return the unit with fewest alternatives
  if (rowPossibilities <= colPossibilities && rowPossibilities <= boxPossibilities) {
    return { unitType: 'row', unitIndex: row };
  } else if (colPossibilities <= boxPossibilities) {
    return { unitType: 'col', unitIndex: col };
  } else {
    return { unitType: 'box', unitIndex: boxIndex };
  }
}

// Calculate impact score for a cell (how many other cells it affects)
function calculateImpactScore(board, row, col, pathCells) {
  // Count how many empty cells share a unit with this cell
  let impactScore = 0;
  
  // Count in row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === 0 && !pathCells.has(`${row},${c}`)) {
      impactScore++;
    }
  }
  
  // Count in column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === 0 && !pathCells.has(`${r},${col}`)) {
      impactScore++;
    }
  }
  
  // Count in box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currRow = boxRow + r;
      const currCol = boxCol + c;
      if ((currRow !== row || currCol !== col) &&
        board[currRow][currCol] === 0 &&
        !pathCells.has(`${currRow},${currCol}`)) {
        impactScore++;
      }
    }
  }
  
  // Multiply by the inverse of number of possibilities
  // (fewer possibilities = higher impact)
  const possibilities = getPossibleValues(board, row, col, pathCells);
  if (possibilities.length > 0) {
    impactScore = impactScore * (10 / possibilities.length);
  }
  
  return impactScore;
}

return { start, stop };
})();

// Attach to window
window.MissionControl = MissionControl;

// Listen for phase changes
EventSystem.subscribe("PHASE_STARTED", (phase) => {
  if (phase === "sudoku") {
    MissionControl.start();
  } else {
    MissionControl.stop();
  }
});