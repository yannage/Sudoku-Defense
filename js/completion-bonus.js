/**
 * Updated completion-bonus.js with fixes for celebration screen issues
 * - Fixes puzzle display to show with celebration message
 * - Hides character abilities during celebration
 * - Makes Continue button reset game and prompt for new character selection
 */
 
 // Add these variables near the top of your IIFE (after any existing let declarations)
let comboCount = 0;
let comboTimer = null;
let comboBonusMultiplier = 0.2; // 20% bonus per combo level
let comboMaxReached = 0; // Track the highest combo for stats

// Track if we've already shown the celebration to prevent duplicates
let hasCelebrated = false;

(function() {
  console.log("Initializing direct celebration system");
  
  // Storage for completed puzzles
  let completedPuzzles = [];
  const MAX_SAVED_PUZZLES = 10;
  
  // Try to load saved puzzles
  try {
    const savedPuzzles = localStorage.getItem('sudoku_td_completed_puzzles');
    if (savedPuzzles) {
      completedPuzzles = JSON.parse(savedPuzzles);
      console.log(`Loaded ${completedPuzzles.length} completed puzzles from storage`);
    }
  } catch (error) {
    console.error('Error loading completed puzzles:', error);
    completedPuzzles = [];
  }
  
  // Add CSS styles for celebration and trophy room
  function addStyles() {
    if (document.getElementById('direct-celebration-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'direct-celebration-styles';
    style.textContent = `
            /* Celebration Screen */
            #celebration-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000; /* Higher than ability bar */
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s;
            }
            
            #celebration-container.active {
                opacity: 1;
                pointer-events: auto;
            }
            
           .celebration-content {
    background-color: #1a1a1a;
    color: white;
    border-radius: 10px;
    padding: 20px;
    width: 90%;
    max-width: 500px;
    text-align: center;
    position: relative;
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.5s, opacity 0.5s;
    max-height: 90vh;

    /* This ensures content scrolls if too tall */
    overflow-y: auto;

    /* This contains confetti inside the box */
    overflow-x: hidden;
    overflow: hidden;
}
            
            .celebration-content.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            .close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: gray;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
            }
            
            .close-button:hover {
                color: white;
            }
            
            .celebration-title {
                font-size: 28px;
                color: gold;
                margin-bottom: 20px;
            }
            
            .celebration-stats {
                margin-bottom: 20px;
            }
            
            .celebration-stats p {
                margin: 5px 0;
                font-size: 16px;
            }
            
            .celebration-puzzle {
                display: grid;
                grid-template-columns: repeat(9, 30px);
                grid-template-rows: repeat(9, 30px);
                gap: 1px;
                background-color: #333;
                width: fit-content;
                margin: 0 auto 20px auto;
                padding: 5px;
                border-radius: 5px;
            }
            
            /* Ensure puzzles are displayed as squares */
            .trophy-puzzle {
                display: grid;
                grid-template-columns: repeat(9, 30px);
                grid-template-rows: repeat(9, 30px);
                gap: 1px;
                background-color: #333;
                width: fit-content;
                margin: 0 auto;
                padding: 5px;
                border-radius: 5px;
            }
            
            .trophy-cell {
                width: 30px;
                height: 30px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #222;
                font-size: 16px;
                font-weight: bold;
                color: white;
            }
            
            .trophy-cell.fixed {
                background-color: #444;
                font-weight: bold;
            }
            
            .trophy-cell.path {
                background-color: #063;
            }
            
            .celebration-button {
                background-color: var(--primary-color, #4CAF50);
                color: white;
                border: none;
                padding: 10px 15px;
                margin: 10px 5px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.3s;
            }
            
            .celebration-button:hover {
                background-color: var(--primary-dark, #3e8e41);
            }
            
            .celebration-button.secondary {
                background-color: #666;
            }
            
            .celebration-button.secondary:hover {
                background-color: #888;
            }
            
            .celebration-footer {
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            /* Trophy Room Styles */
            #trophy-room {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s;
            }
            
            #trophy-room.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .trophy-content {
                background-color: #1a1a1a;
                color: white;
                border-radius: 10px;
                padding: 20px;
                width: 90%;
                max-width: 800px;
                text-align: center;
                position: relative;
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.5s, opacity 0.5s;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .trophy-content.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            .trophy-title {
                font-size: 24px;
                color: gold;
                margin-bottom: 20px;
            }
            
            .trophy-gallery {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .trophy-item {
                background-color: #222;
                border-radius: 8px;
                padding: 15px;
                width: max-content;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                margin: 0 auto;
            }
            
            .trophy-info {
                margin-top: 10px;
                font-size: 12px;
                color: #ccc;
            }
            
            .trophy-empty {
                padding: 20px;
                color: #ccc;
                font-style: italic;
            }
            
            /* Confetti Animation */
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                background-color: gold;
                opacity: 0.7;
                animation: confetti-fall 4s linear forwards;
            }
            
            @keyframes confetti-fall {
                0% {
                    transform: translateY(-50px) rotate(0deg);
                    opacity: 0.7;
                }
                100% {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
    
    document.head.appendChild(style);
  }
  
  // Add this function to handle the combo system
// Updated function to handle the combo system with proper timer
// Add this to your code to debug the combo system
function debugComboSystem() {
  console.log("=== COMBO SYSTEM DEBUG ===");
  console.log(`Current combo count: ${comboCount}`);
  console.log(`Max combo reached: ${comboMaxReached}`);
  console.log(`Timer active: ${comboTimer !== null}`);
  
  if (comboTimer) {
    // Check when the timer was created
    const now = Date.now();
    const elapsed = now - (window._lastComboTime || now);
    const remaining = Math.max(0, 5000 - elapsed);
    
    console.log(`Time elapsed since last combo: ${elapsed}ms`);
    console.log(`Estimated time remaining: ${remaining}ms`);
  }
  
  return "Check browser console for debug info";
}

// Add this to window for access in console
window.debugComboSystem = debugComboSystem;

// Modify handleCombo to track timer creation time
function handleCombo() {
  // Increment combo
  comboCount++;
  
  // Update max combo if current combo is higher
  if (comboCount > comboMaxReached) {
    comboMaxReached = comboCount;
  }
  
  // Clear existing timer if any
  if (comboTimer) {
    clearTimeout(comboTimer);
  }
  
  // Store the time when this combo was triggered
  window._lastComboTime = Date.now();
  
  // Set new timer (combo expires after 5 seconds)
  comboTimer = setTimeout(() => {
    // Only show message if combo was significant
    if (comboCount > 1) {
      console.log(`Combo ended: ${comboCount}x (Timer completed after 5000ms)`);
      
      // Optional: Show a small visual indication that combo ended
      const message = document.createElement('div');
      message.textContent = `${comboCount}x Combo Ended`;
      message.style.position = 'fixed';
      message.style.top = '50px';
      message.style.left = '50%';
      message.style.transform = 'translateX(-50%)';
      message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      message.style.color = '#ff9800';
      message.style.padding = '5px 10px';
      message.style.borderRadius = '5px';
      message.style.fontWeight = 'bold';
      message.style.fontSize = '14px';
      message.style.zIndex = '9999';
      message.style.animation = 'fadeOut 1.5s forwards';
      document.body.appendChild(message);
      
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 1500);
    }
    
    // Reset combo
    comboCount = 0;
    comboTimer = null;
    window._lastComboTime = null;
    
    // Hide the combo indicator
    const indicator = document.getElementById('combo-indicator');
    if (indicator) {
      indicator.classList.remove('active');
    }
    
  }, 5000); // Explicitly set to 5000ms (5 seconds)
  
  // Log for debugging
  console.log(`Combo increased to ${comboCount}x - Timer set for 5 seconds (${new Date().toLocaleTimeString()})`);
  
  // Return the current combo info
  return {
    count: comboCount,
    multiplier: 1 + (comboCount - 1) * comboBonusMultiplier
  };
}

// Add this function to add styles for the combo system
function addComboStyles() {
  if (document.getElementById('combo-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'combo-styles';
  style.textContent = `
    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    .combo-indicator {
      position: fixed;
      top: 80px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.7);
      color: gold;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease-out, opacity 0.2s ease-out;
      transform: scale(1);
      opacity: 0;
    }
    
    .combo-indicator.active {
      opacity: 1;
    }
    
    .combo-indicator.pulse {
      transform: scale(1.2);
    }
    
    .combo-counter {
      margin-right: 5px;
      font-size: 20px;
      text-shadow: 0 0 5px gold;
    }
    
    .combo-multiplier {
      font-size: 14px;
      color: #ffcc00;
    }
    
    .combo-bar-container {
      position: absolute;
      bottom: -3px;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: rgba(255,255,255,0.3);
      border-radius: 0 0 5px 5px;
      overflow: hidden;
    }
    
    .combo-bar {
      height: 100%;
      width: 100%;
      background-color: gold;
      transform-origin: left;
      animation: combo-timer 5s linear forwards;
    }
    
    @keyframes combo-timer {
      0% { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    
    .combo-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background-color: rgba(0, 0, 0, 0.7);
      color: gold;
      font-size: 24px;
      font-weight: bold;
      padding: 20px 30px;
      border-radius: 10px;
      z-index: 10001;
      text-align: center;
      animation: combo-popup 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      pointer-events: none;
    }
    
    .combo-message.out {
      animation: combo-popout 0.5s forwards;
    }
    
    @keyframes combo-popup {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      70% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes combo-popout {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
}

// Add this function to create and update the combo indicator
// Updated function to create and update the combo indicator with fixed timer
function updateComboIndicator(combo) {
  // Get or create combo indicator
  let indicator = document.getElementById('combo-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'combo-indicator';
    indicator.className = 'combo-indicator';
    
    const counter = document.createElement('div');
    counter.id = 'combo-counter';
    counter.className = 'combo-counter';
    
    const multiplier = document.createElement('div');
    multiplier.id = 'combo-multiplier';
    multiplier.className = 'combo-multiplier';
    
    const barContainer = document.createElement('div');
    barContainer.className = 'combo-bar-container';
    
    indicator.appendChild(counter);
    indicator.appendChild(multiplier);
    indicator.appendChild(barContainer);
    
    document.body.appendChild(indicator);
  }
  
  // Update indicator content
  const counter = document.getElementById('combo-counter');
  const multiplier = document.getElementById('combo-multiplier');
  const barContainer = indicator.querySelector('.combo-bar-container');
  
  // Only show for combos > 1
  if (combo.count <= 1) {
    indicator.classList.remove('active');
    barContainer.innerHTML = '';
    return;
  }
  
  counter.textContent = `${combo.count}×`;
  multiplier.textContent = `${Math.floor(combo.multiplier * 100)}% Bonus`;
  
  indicator.classList.add('active');
  
  // Add pulse animation
  indicator.classList.add('pulse');
  setTimeout(() => {
    indicator.classList.remove('pulse');
  }, 200);
  
  // Reset the timer bar
  barContainer.innerHTML = '';
  const bar = document.createElement('div');
  bar.className = 'combo-bar';
  
  // Explicitly set animation duration to 5s to match the timeout
  bar.style.animationDuration = '5s';
  
  barContainer.appendChild(bar);
}

// Function to show a combo message in the center of the screen
function showComboMessage(combo) {
  // Only show messages for significant combos
  if (combo.count < 3) return;
  
  const message = document.createElement('div');
  message.className = 'combo-message';
  
  // Choose message based on combo level
  let messageText = '';
  if (combo.count >= 7) {
    messageText = `UNSTOPPABLE! ${combo.count}× COMBO!`;
  } else if (combo.count >= 5) {
    messageText = `AMAZING! ${combo.count}× COMBO!`;
  } else if (combo.count >= 3) {
    messageText = `${combo.count}× COMBO!`;
  }
  
  message.textContent = messageText;
  document.body.appendChild(message);
  
  // Remove after a short delay
  setTimeout(() => {
    message.classList.add('out');
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 500);
  }, 1000);
}
  
  // Save the current puzzle as a trophy
  function savePuzzleAsTrophy() {
    try {
      // Get current game state with safety checks
      let currentBoard = Array(9).fill().map(() => Array(9).fill(0));
      let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
      let pathCells = [];
      let level = 1;
      let score = 0;
      
      // Get board data from BoardManager with fallback to BoardManager
      const boardManager = window.BoardManager;
      if (boardManager) {
        if (typeof boardManager.getBoard === 'function') {
          const board = boardManager.getBoard();
          if (board && board.length === 9) {
            currentBoard = JSON.parse(JSON.stringify(board));
          }
        }
        
        if (typeof boardManager.getFixedCells === 'function') {
          const fixed = boardManager.getFixedCells();
          if (fixed && fixed.length === 9) {
            fixedCells = JSON.parse(JSON.stringify(fixed));
          }
        }
        
        if (typeof boardManager.getPathCells === 'function') {
          pathCells = Array.from(boardManager.getPathCells() || []);
        }
      }
      
      // Get level and score safely
      if (window.LevelsModule && typeof LevelsModule.getCurrentLevel === 'function') {
        level = LevelsModule.getCurrentLevel();
      }
      
      if (window.PlayerModule && typeof PlayerModule.getState === 'function') {
        const playerState = PlayerModule.getState();
        if (playerState && typeof playerState.score !== 'undefined') {
          score = playerState.score;
        }
      }
      
      // Create trophy object
      const trophy = {
        date: new Date().toISOString(),
        level: level,
        score: score,
        board: currentBoard,
        fixedCells: fixedCells,
        pathCells: pathCells
      };
      
      // Add to start of array
      completedPuzzles.unshift(trophy);
      
      // Keep array at max size
      if (completedPuzzles.length > MAX_SAVED_PUZZLES) {
        completedPuzzles = completedPuzzles.slice(0, MAX_SAVED_PUZZLES);
      }
      
      // Save to local storage
      localStorage.setItem('sudoku_td_completed_puzzles', JSON.stringify(completedPuzzles));
      
      console.log("Puzzle saved as trophy:", trophy);
      return trophy;
    } catch (error) {
      console.error("Error saving puzzle as trophy:", error);
      return {
        date: new Date().toISOString(),
        level: 1,
        score: 0,
        board: Array(9).fill().map(() => Array(9).fill(0)),
        fixedCells: Array(9).fill().map(() => Array(9).fill(false)),
        pathCells: []
      };
    }
  }
  
  // Create confetti effect
  function createConfetti(container) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 'gold', '#ffffff'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      confetti.style.position = 'absolute';
      confetti.style.top = '0px'; // spawn from top of modal
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.width = Math.random() * 10 + 5 + 'px';
      confetti.style.height = Math.random() * 10 + 5 + 'px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      
      container.appendChild(confetti);
      
      setTimeout(() => {
        if (confetti.parentNode === container) {
          container.removeChild(confetti);
        }
      }, 5000);
    }
  }
  // Render a puzzle for display
  function renderPuzzleGrid(container, board, fixedCells, pathCells) {
    // Clear container
    container.innerHTML = '';
    
    // If data wasn't provided, try to get it from BoardManager or BoardManager
    if (!board) {
      const boardManager = window.BoardManager;
      if (boardManager) {
        board = boardManager.getBoard();
        fixedCells = boardManager.getFixedCells();
        pathCells = boardManager.getPathCells();
      }
    }
    
    // Convert path cells to Set if it's an array
    let pathCellsSet = new Set();
    if (Array.isArray(pathCells)) {
      pathCells.forEach(cell => {
        if (Array.isArray(cell)) {
          // If it's [row, col] format
          pathCellsSet.add(`${cell[0]},${cell[1]}`);
        } else {
          // If it's already a string
          pathCellsSet.add(cell);
        }
      });
    } else if (typeof pathCells === 'object' && pathCells !== null) {
      // If it's already a Set or similar object with a has method
      if (typeof pathCells.has === 'function') {
        pathCellsSet = pathCells;
      }
    }
    
    // Add borders for 3x3 grid lines
    container.style.position = 'relative';
    
    // Create cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'trophy-cell';
        
        // Add 3x3 grid borders
        if (col % 3 === 2 && col < 8) {
          cell.style.borderRight = '2px solid #555';
        }
        if (row % 3 === 2 && row < 8) {
          cell.style.borderBottom = '2px solid #555';
        }
        
        // Add fixed class if needed
        if (fixedCells && fixedCells[row] && fixedCells[row][col]) {
          cell.classList.add('fixed');
        }
        
        // Add path class if needed
        if (pathCellsSet.has(`${row},${col}`)) {
          cell.classList.add('path');
        }
        
        // Set cell value
        if (board && board[row] && typeof board[row][col] !== 'undefined') {
          const value = board[row][col];
          if (value > 0) {
            cell.textContent = value;
          }
        }
        
        container.appendChild(cell);
      }
    }
  }
  
  // Show celebration screen
  function showCelebration() {
    if (hasCelebrated) return; // Prevent duplicate celebrations
    hasCelebrated = true;
    
    console.log("Showing celebration screen");
    const trophy = savePuzzleAsTrophy();
    
    // Hide ability bar if present
    hideAbilityBar();
    
    // Create container if it doesn't exist
    let container = document.getElementById('celebration-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'celebration-container';
      document.body.appendChild(container);
    }
    
    // Create content
    container.innerHTML = `
            <div class="celebration-content">
                <button class="close-button">×</button>
                <h2 class="celebration-title">🎉 Sudoku Complete! 🎉</h2>
                <div class="celebration-stats">
                    <p>Level ${trophy.level} Completed</p>
                    <p>Current Score: ${trophy.score}</p>
                </div>
                <div class="celebration-puzzle" id="celebration-puzzle"></div>
                <div class="celebration-footer">
                    <button class="celebration-button" id="continue-button">Start New Game</button>
                </div>
            </div>
        `;
    
    // Show container
    container.classList.add('active');
    
    // Create confetti
    const content = container.querySelector('.celebration-content');
    if (content) {
      createConfetti(content); // attach confetti to the modal content box
    }
    
    // Add small delay for animation
    setTimeout(() => {
      const content = container.querySelector('.celebration-content');
      if (content) content.classList.add('active');
      
      // Render puzzle
      const puzzleGrid = document.getElementById('celebration-puzzle');
      if (puzzleGrid) {
        renderPuzzleGrid(puzzleGrid, trophy.board, trophy.fixedCells, trophy.pathCells);
      }
    }, 50);
    
    // Add event listeners
    const closeButton = container.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        resetGameAfterCelebration();
      });
    }
    
    const continueButton = document.getElementById('continue-button');
    if (continueButton) {
      continueButton.addEventListener('click', () => {
        resetGameAfterCelebration();
      });
    }
    
    // Pause game while showing celebration
    if (window.Game && typeof Game.pause === 'function') {
      Game.pause();
    }
  }
  
  // Close celebration screen without resetting
  function closeCelebration() {
    const container = document.getElementById('celebration-container');
    if (container) {
      const content = container.querySelector('.celebration-content');
      if (content) content.classList.remove('active');
      
      setTimeout(() => {
        container.classList.remove('active');
      }, 300);
    }
  }
  
  // Reset game and prompt for new character
  /**
 * Updates to completion-bonus.js to integrate with PhaseManager
 * Find these functions in your completion-bonus.js file and modify them
 */

// Update this function to work with PhaseManager
function resetGameAfterCelebration() {
  closeCelebration();
  
  // Reset hasCelebrated flag to allow future celebrations
  hasCelebrated = false;
  
  console.log("Restarting game after celebration");
  
  // Use PhaseManager if available
  if (window.PhaseManager && typeof PhaseManager.startNewGame === 'function') {
    PhaseManager.startNewGame();
  } else {
    // Fall back to original implementation
    localStorage.removeItem('sudoku_td_character');
    showGameEndIndicator();
    
    setTimeout(() => {
      if (window.Game && typeof Game.reset === 'function') {
        Game.reset();
      }
      
      setTimeout(() => {
        if (window.AbilitySystem && typeof AbilitySystem.init === 'function') {
          const existingCharacterSelection = document.getElementById('character-selection');
          if (existingCharacterSelection) {
            existingCharacterSelection.remove();
          }
          
          window.skipContinuePrompt = true;
          AbilitySystem.init();
          
          const newCharacterSelection = document.getElementById('character-selection');
          if (newCharacterSelection) {
            newCharacterSelection.style.display = 'flex';
            newCharacterSelection.style.zIndex = '10000';
          }
        }
      }, 600);
    }, 200);
  }
}


  // Show game end indicator
  function showGameEndIndicator() {
    let indicator = document.getElementById('game-end-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'game-end-indicator';
      indicator.style.position = 'fixed';
      indicator.style.top = '20px';
      indicator.style.left = '50%';
      indicator.style.transform = 'translateX(-50%)';
      indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      indicator.style.color = 'white';
      indicator.style.padding = '10px 20px';
      indicator.style.borderRadius = '5px';
      indicator.style.zIndex = '9000';
      indicator.style.boxShadow = '0 0 10px gold';
      indicator.style.textAlign = 'center';
      indicator.style.animation = 'fadeOut 3s forwards';
      indicator.textContent = 'Starting New Game...';
      
      // Add animation style
      const style = document.createElement('style');
      style.textContent = `
                @keyframes fadeOut {
                    0% { opacity: 1; }
                    70% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
      document.head.appendChild(style);
      
      document.body.appendChild(indicator);
      
      // Remove after animation completes
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 3000);
    }
  }
  
  // Hide ability bar
  function hideAbilityBar() {
    const abilityBar = document.getElementById('ability-bar');
    if (abilityBar) {
      abilityBar.style.display = 'none';
    }
    
    const experienceBar = document.getElementById('experience-bar');
    if (experienceBar) {
      experienceBar.style.display = 'none';
    }
    
    const experienceText = document.getElementById('experience-text');
    if (experienceText) {
      experienceText.style.display = 'none';
    }
    
    const characterIndicator = document.getElementById('character-indicator');
    if (characterIndicator) {
      characterIndicator.style.display = 'none';
    }
  }
  
  // Show trophy room
  function showTrophyRoom() {
    console.log("Showing trophy room");
    
    // Create container if it doesn't exist
    let container = document.getElementById('trophy-room');
    if (!container) {
      container = document.createElement('div');
      container.id = 'trophy-room';
      document.body.appendChild(container);
    }
    
    // Create content
    let content = `
            <div class="trophy-content">
                <button class="close-button">×</button>
                <h2 class="trophy-title">🏆 Your Sudoku Trophies 🏆</h2>
                <div class="trophy-gallery">
        `;
    
    if (completedPuzzles.length === 0) {
      content += `
                <div class="trophy-empty">
                    <p>You haven't completed any Sudoku puzzles yet!</p>
                    <p>Completed puzzles will appear here as trophies.</p>
                </div>
            `;
    } else {
      completedPuzzles.forEach((trophy, index) => {
        const date = new Date(trophy.date);
        const formattedDate = date.toLocaleDateString();
        
        content += `
                    <div class="trophy-item">
                        <div class="trophy-puzzle" id="trophy-puzzle-${index}"></div>
                        <div class="trophy-info">
                            <div class="trophy-date">${formattedDate}</div>
                            <div>Level ${trophy.level}</div>
                            <div>Score: ${trophy.score}</div>
                        </div>
                    </div>
                `;
      });
    }
    
    content += `
                </div>
                <button class="celebration-button" id="close-trophy-room">Close</button>
            </div>
        `;
    
    container.innerHTML = content;
    
    // Show container
    container.classList.add('active');
    
    // Add small delay for animation
    setTimeout(() => {
      const trophyContent = container.querySelector('.trophy-content');
      if (trophyContent) trophyContent.classList.add('active');
      
      // Render trophy puzzles
      completedPuzzles.forEach((trophy, index) => {
        const puzzleGrid = document.getElementById(`trophy-puzzle-${index}`);
        if (puzzleGrid) {
          renderPuzzleGrid(puzzleGrid, trophy.board, trophy.fixedCells, trophy.pathCells);
        }
      });
    }, 50);
    
    // Add event listeners
    const closeButtonTop = container.querySelector('.close-button');
    if (closeButtonTop) {
      closeButtonTop.addEventListener('click', closeTrophyRoom);
    }
    
    const closeButtonBottom = document.getElementById('close-trophy-room');
    if (closeButtonBottom) {
      closeButtonBottom.addEventListener('click', closeTrophyRoom);
    }
    
    // Pause game
    if (window.Game && typeof Game.pause === 'function') {
      Game.pause();
    }
  }
  
  // Close trophy room
  function closeTrophyRoom() {
    const container = document.getElementById('trophy-room');
    if (container) {
      const content = container.querySelector('.trophy-content');
      if (content) content.classList.remove('active');
      
      setTimeout(() => {
        container.classList.remove('active');
        
        // If game has completed, reset it
        if (hasCelebrated) {
          resetGameAfterCelebration();
        } else {
          // Otherwise, just show ability UI again
          showAbilityBar();
          
          // Resume game
          if (window.Game && typeof Game.resume === 'function') {
            Game.resume();
          }
        }
      }, 300);
    }
  }
  
  // Show ability bar (after trophy room is closed)
  function showAbilityBar() {
    const abilityBar = document.getElementById('ability-bar');
    if (abilityBar) {
      abilityBar.style.display = 'flex';
    }
    
    const experienceBar = document.getElementById('experience-bar');
    if (experienceBar) {
      experienceBar.style.display = 'block';
    }
    
    const experienceText = document.getElementById('experience-text');
    if (experienceText) {
      experienceText.style.display = 'block';
    }
    
    const characterIndicator = document.getElementById('character-indicator');
    if (characterIndicator) {
      characterIndicator.style.display = 'flex';
    }
  }
  
  // Directly check unit (row, column, grid) completions using BoardManager
  // Directly check unit (row, column, grid) completions using BoardManager
  function checkUnitCompletions() {}
  
/**
 * Animation Queue System
 * 
 * This modification adds a queue system to handle completion animations
 * so they play one after another instead of simultaneously.
 */

// Create an animation queue system
let animationQueue = [];
let isAnimationRunning = false;

// Process the animation queue
function processAnimationQueue() {
  if (animationQueue.length === 0 || isAnimationRunning) {
    return;
  }
  
  // Get the next animation from the queue
  const nextAnimation = animationQueue.shift();
  isAnimationRunning = true;
  
  console.log(`Processing animation from queue: ${nextAnimation.unitType} ${nextAnimation.unitIndex}`);
  
  // Run the animation
  performUnitAnimation(
    nextAnimation.unitType,
    nextAnimation.unitIndex,
    nextAnimation.bonusAmount
  );
}

// Wrapping function to handle animation completion
function performUnitAnimation(unitType, unitIndex, bonusAmount) {
  // The actual animation implementation (your existing code)
  animateUnitCompletion(unitType, unitIndex, bonusAmount);
  
  // Set a timeout for when the animation is expected to complete
  // This should be slightly longer than your longest animation
  setTimeout(() => {
    isAnimationRunning = false;
    processAnimationQueue(); // Process the next animation in queue
  }, 1500); // Adjust this based on your longest animation duration
}

/**
 * Modified onUnitCompleted function that uses the queue
 */
/**
 * Modified onUnitCompleted function that uses the queue and combo system
 */
function onUnitCompleted(unitType, unitIndex) {
  const key = `${unitType}-${unitIndex}`;
  const now = Date.now();
  
  // Initialize tracking sets if needed
  if (!window._recentCompletions) window._recentCompletions = {};
  if (!window._completedUnitSet) window._completedUnitSet = new Set();
  
  // Skip if already animated before (permanent suppression)
  if (window._completedUnitSet.has(key)) {
    console.log(`Already animated before, skipping: ${key}`);
    return;
  }
  
  // Prevent duplicate triggers within short window (throttling)
  if ((now - (window._recentCompletions[key] || 0)) < 3000) {
    console.log(`Throttled duplicate completion for ${key}`);
    return;
  }
  
  // Update both tracking mechanisms
  window._recentCompletions[key] = now;
  window._completedUnitSet.add(key);
  
  console.log(`Unit completed handler: ${key}`);
  
  // Process combo system
  const combo = handleCombo();
  
  // Determine base bonus amount by unit type
  let baseBonusAmount = 50;
  if (unitType === 'column') baseBonusAmount = 75;
  else if (unitType === 'grid') baseBonusAmount = 100;
  
  // Apply combo multiplier to bonuses
  const bonusAmount = Math.floor(baseBonusAmount * combo.multiplier);
  
  // Apply bonus points and currency
  if (window.PlayerModule) {
    PlayerModule.addCurrency(bonusAmount);
    PlayerModule.addScore(bonusAmount * 2);
    
    // Different message based on combo
    if (combo.count > 1) {
      EventSystem.publish(GameEvents.STATUS_MESSAGE,
        `${combo.count}× COMBO! ${unitType.charAt(0).toUpperCase() + unitType.slice(1)} ${unitIndex} completed! Bonus: ${bonusAmount} currency (${Math.floor(combo.multiplier * 100)}% boost)!`);
    } else {
      EventSystem.publish(GameEvents.STATUS_MESSAGE,
        `${unitType.charAt(0).toUpperCase() + unitType.slice(1)} ${unitIndex} completed! Bonus: ${bonusAmount} currency and ${bonusAmount * 2} points!`);
    }
  }
  
  // Update combo indicator
  updateComboIndicator(combo);
  
  // Show combo message for big combos
  if (combo.count >= 3) {
    showComboMessage(combo);
  }
  
  // Force board update before animation
  if (window.Game && typeof Game.updateBoard === 'function') {
    Game.updateBoard();
  }
  
  // Add to animation queue with combo information
  animationQueue.push({
    unitType: unitType,
    unitIndex: unitIndex,
    bonusAmount: bonusAmount,
    combo: combo.count
  });
  
  // Try to process the queue (will only start if no animation is running)
  processAnimationQueue();
}
  
  /**
   * Add this to your completion-bonus.js file to add lightweight animations
   * for row, column, and grid completions
   */
  
  // === ADD THESE FUNCTIONS INSIDE YOUR MAIN IIFE ===
  
  // Add CSS styles for unit completion animations
  // Add CSS styles for unit completion animations
  // Add CSS styles for unit completion animations with combo support
function addCompletionAnimationStyles() {
  if (document.getElementById('completion-animation-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'completion-animation-styles';
  style.textContent = `
      /* Completion animation styles */
      .cell-completion-glow {
          animation: cell-glow 1.2s ease-in-out;
          z-index: 5;
      }
      
      @keyframes cell-glow {
          0% { box-shadow: inset 0 0 5px rgba(255, 215, 0, calc(0.2 * var(--glow-intensity, 1))); }
          50% { box-shadow: inset 0 0 20px rgba(255, 215, 0, calc(0.8 * var(--glow-intensity, 1))); }
          100% { box-shadow: inset 0 0 5px rgba(255, 215, 0, calc(0.2 * var(--glow-intensity, 1))); }
      }
      
      /* Wave animation for cells */
      .cell-wave-animation {
          animation: cell-wave 0.5s ease-in-out;
          z-index: 5;
      }
      
      @keyframes cell-wave {
          0% { transform: scale(1); }
          50% { transform: scale(var(--wave-scale, 1.2)); background-color: rgba(255, 215, 0, 0.3); }
          100% { transform: scale(1); }
      }
      
      .celebration-sparkle {
          position: absolute;
          color: gold;
          font-size: 16px;
          pointer-events: none;
          z-index: 31;
          animation: sparkle-float 1s forwards ease-out;
      }
      
      @keyframes sparkle-float {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot)); opacity: 0; }
      }
      
      .completion-flash {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 215, 0, 0.15);
          pointer-events: none;
          z-index: 10;
          animation: flash-fade 0.7s forwards ease-out;
      }
      
      @keyframes flash-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
      }
      
      .completion-message {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
          pointer-events: none;
          z-index: 100;
          animation: message-float 1.5s forwards ease-out;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }
      
      @keyframes message-float {
          0% { transform: translate(-50%, 0); opacity: 0; }
          20% { transform: translate(-50%, -10px); opacity: 1; }
          80% { transform: translate(-50%, -20px); opacity: 1; }
          100% { transform: translate(-50%, -30px); opacity: 0; }
      }
  `;
  
  document.head.appendChild(style);
}

  // Show completion message
  function showCompletionMessage(cell, text, bonusAmount) {
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top - 5;
    
    const message = document.createElement('div');
    message.className = 'completion-message';
    message.innerHTML = `${text}<br>+${bonusAmount} 💰`;
    message.style.left = `${centerX}px`;
    message.style.top = `${centerY}px`;
    
    document.body.appendChild(message);
    
    // Remove after animation
    setTimeout(() => {
      message.remove();
    }, 1500);
  }
  // Add this function to your code
function addConnectedLineStyles() {
  if (document.getElementById('connected-line-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'connected-line-styles';
  style.textContent = `
    @keyframes drawLine {
      from { stroke-dashoffset: 1000; }
      to { stroke-dashoffset: 0; }
    }
    
    .completion-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
    }
    
    .completion-line path {
      stroke: gold;
      stroke-width: 3;
      fill: none;
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: drawLine 1.2s forwards ease-in-out;
    }
  `;
  
  document.head.appendChild(style);
}

// Add this function to your code
function drawConnectingLine(cells, unitType) {
  // Create SVG container
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add('completion-line');
  document.body.appendChild(svg);
  
  // Create path through cell centers
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  
  // Sort cells if needed
  if (unitType === 'row' || unitType === 'column') {
    cells.sort((a, b) => {
      const aIndex = parseInt(a.getAttribute(unitType === 'row' ? 'data-col' : 'data-row'));
      const bIndex = parseInt(b.getAttribute(unitType === 'row' ? 'data-col' : 'data-row'));
      return aIndex - bIndex;
    });
  }
  
  // Create path data
  let pathData = "";
  cells.forEach((cell, i) => {
    const rect = cell.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    if (i === 0) pathData += `M ${x} ${y} `;
    else pathData += `L ${x} ${y} `;
  });
  
  // For grid type, complete the shape by connecting back to first point
  if (unitType === 'grid' && cells.length > 0) {
    const firstCell = cells[0];
    const rect = firstCell.getBoundingClientRect();
    pathData += `L ${rect.left + rect.width/2} ${rect.top + rect.height/2}`;
  }
  
  path.setAttribute("d", pathData);
  svg.appendChild(path);
  
  // Remove after animation completes
  setTimeout(() => {
    if (svg.parentNode) {
      svg.parentNode.removeChild(svg);
    }
  }, 2000);
  
  return svg;
}
  
  // Play completion sound
  function playCompletionSound() {
    // Only play one sound at a time
    if (window._playingCompletionSound) return;
    
    // Create sound if it doesn't exist
    if (!window._completionSound) {
      try {
        const sound = new Audio();
        // Short success sound encoded as base64
        sound.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMD4+Pj4+Pj4+Pj4+Pj4+Pj4//////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQAAAAAAAAAAbBEtBs8AAAAAAAAAAAAAAAAAAAAAP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAQAAAMgAICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMD////////////////AwMDAwMDAwMDAwMDAwMDAwP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAQAAAj0AEBAQEBAQEBAQEBAQEBAQICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAABAAAAABAAACAAARERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jKMQAAAP5sAAAAACpuUmVkIFdhdmUgWGZlcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MYxAAAAANIAAAAAAAAAAAAAAAAAAAAAAAAAP/jKMQAAAP5sAAAAABBibkxpdmUgRW5jb2RlcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zGMQAAAAAAAAAA/////////////////////////////////jKMQAAAQ5sAAAAACpodHRwOi8vd3d3LmZyZWVzcGVlY2guaWUAAAAA////////////////////////////////////////8xDEAAAAANIAAw==";
        sound.volume = 0.4;
        window._completionSound = sound;
      } catch (e) {
        console.error("Could not create completion sound:", e);
        return;
      }
    }
    
    // Play the sound
    try {
      window._playingCompletionSound = true;
      window._completionSound.currentTime = 0;
      window._completionSound.play()
        .then(() => {
          setTimeout(() => {
            window._playingCompletionSound = false;
          }, 300);
        })
        .catch(e => {
          window._playingCompletionSound = false;
        });
    } catch (e) {
      window._playingCompletionSound = false;
    }
  }
  
  /**
   * Helper function to get spiral index for grid animations
   * This creates a spiral pattern starting from the center
   */
  function getSpiralIndex(row, col, height, width) {
    // Define spiral directions: right, down, left, up
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0]
    ];
    let dir = 0; // Start going right
    
    // Start at center
    let currRow = Math.floor(height / 2);
    let currCol = Math.floor(width / 2);
    
    // Spiral pattern
    let steps = 1; // Steps in current direction
    let stepCount = 0; // Steps taken in current direction
    let totalSteps = 0; // Total steps taken
    let cellMap = {}; // Map to store [row, col] -> index
    
    // Generate spiral pattern
    while (totalSteps < height * width) {
      cellMap[`${currRow},${currCol}`] = totalSteps;
      totalSteps++;
      
      // Move in current direction
      currRow += directions[dir][0];
      currCol += directions[dir][1];
      stepCount++;
      
      // Change direction if needed
      if (stepCount === steps) {
        stepCount = 0; // Reset step counter
        dir = (dir + 1) % 4; // Change direction
        
        // Increase steps after going left or right (completing half a lap)
        if (dir === 0 || dir === 2) {
          steps++;
        }
      }
    }
    
    // Return the index for the requested position
    const key = `${row},${col}`;
    return cellMap[key] || 0;
  }
  
  /**
   * Enhanced unit animation function - a single function to handle all unit types
   * This function creates wave animations for rows, columns, and grids
   * @param {string} unitType - Type of unit ('row', 'column', or 'grid')
   * @param {*} unitIndex - Index of the unit (row number, column number, or grid key)
   * @param {number} bonusAmount - Currency bonus amount for unit completion
   */
  /**
   * Enhanced unit animation function - a single function to handle all unit types
   * This function creates wave animations for rows, columns, and grids
   * @param {string} unitType - Type of unit ('row', 'column', or 'grid')
   * @param {*} unitIndex - Index of the unit (row number, column number, or grid key)
   * @param {number} bonusAmount - Currency bonus amount for unit completion
   */
  /**
   * Enhanced unit animation function with more reliable UI updates
   * @param {string} unitType - Type of unit ('row', 'column', or 'grid')
   * @param {*} unitIndex - Index of the unit (row number, column number, or grid key)
   * @param {number} bonusAmount - Currency bonus amount for unit completion
   */
function animateUnitCompletion(unitType, unitIndex, bonusAmount, comboCount = 1) {
  console.log(`Animating completion for ${unitType} ${unitIndex} with ${bonusAmount} bonus (Combo: ${comboCount}×)`);
  
  // Get path cells to exclude from animation
  const pathCells = window.BoardManager?.getPathCells?.() || new Set();
  let validCells = [];
  let centerCell = null;
  
  // Different behavior based on unit type
  if (unitType === 'row') {
    // Get all cells in the row
    for (let col = 0; col < 9; col++) {
      if (!pathCells.has(`${unitIndex},${col}`)) {
        const cell = document.querySelector(`.sudoku-cell[data-row="${unitIndex}"][data-col="${col}"]`);
        if (cell) {
          validCells.push({ cell, index: col });
        }
      }
    }
    
    // Sort cells by column index for left-to-right wave
    validCells.sort((a, b) => a.index - b.index);
    
  } else if (unitType === 'column') {
    // Get all cells in the column
    for (let row = 0; row < 9; row++) {
      if (!pathCells.has(`${row},${unitIndex}`)) {
        const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${unitIndex}"]`);
        if (cell) {
          validCells.push({ cell, index: row });
        }
      }
    }
    
    // Sort cells by row index for top-to-bottom wave
    validCells.sort((a, b) => a.index - b.index);
    
  } else if (unitType === 'grid') {
    // Parse grid key to get the starting row and column
    const [gridRow, gridCol] = unitIndex.split('-').map(Number);
    const startRow = gridRow * 3;
    const startCol = gridCol * 3;
    
    // Collect all valid cells in the grid
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = startRow + r;
        const col = startCol + c;
        
        // Skip path cells
        if (pathCells.has(`${row},${col}`)) continue;
        
        const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          // Use spiral order for grid animation
          const spiralIndex = getSpiralIndex(r, c, 3, 3);
          validCells.push({ cell, index: spiralIndex });
        }
      }
    }
    
    // Sort cells by spiral index for spiral wave
    validCells.sort((a, b) => a.index - b.index);
  }
  
  // If no valid cells were found, log and return
  if (validCells.length === 0) {
    console.error(`No valid cells found for ${unitType} ${unitIndex} animation`);
    return;
  }
  
  console.log(`Found ${validCells.length} cells to animate for ${unitType} ${unitIndex}`);
  
  // Choose a center cell for the message (middle cell in the sequence)
  centerCell = validCells[Math.floor(validCells.length / 2)].cell;
  
  // Add initial flash to all cells - brighter for higher combos
  validCells.forEach(({ cell }) => {
    try {
      const flash = document.createElement('div');
      flash.className = 'completion-flash';
      
      // Enhance flash for combos
      if (comboCount > 1) {
        // Increase opacity for higher combos
        const opacity = Math.min(0.15 + (comboCount * 0.03), 0.5);
        flash.style.backgroundColor = `rgba(255, 215, 0, ${opacity})`;
        
        // Add glow for higher combos
        if (comboCount >= 3) {
          flash.style.boxShadow = `0 0 ${comboCount * 2}px gold`;
        }
      }
      
      cell.appendChild(flash);
      
      // Remove after animation
      setTimeout(() => {
        if (flash.parentNode === cell) {
          flash.remove();
        }
      }, 700);
    } catch (e) {
      console.error("Error adding flash overlay:", e);
    }
  });
  
  // Extract just the cell elements for the connecting line
  const cellElements = validCells.map(item => item.cell);
  
  // Draw connecting line with delay - enhanced for combos
  setTimeout(() => {
    try {
      // Create SVG container
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add('completion-line');
      document.body.appendChild(svg);
      
      // Create path through cell centers
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      // Sort cells if needed
      if (unitType === 'row' || unitType === 'column') {
        cellElements.sort((a, b) => {
          const aIndex = parseInt(a.getAttribute(unitType === 'row' ? 'data-col' : 'data-row'));
          const bIndex = parseInt(b.getAttribute(unitType === 'row' ? 'data-col' : 'data-row'));
          return aIndex - bIndex;
        });
      }
      
      // Create path data
      let pathData = "";
      cellElements.forEach((cell, i) => {
        const rect = cell.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        if (i === 0) pathData += `M ${x} ${y} `;
        else pathData += `L ${x} ${y} `;
      });
      
      // For grid type, complete the shape by connecting back to first point
      if (unitType === 'grid' && cellElements.length > 0) {
        const firstCell = cellElements[0];
        const rect = firstCell.getBoundingClientRect();
        pathData += `L ${rect.left + rect.width/2} ${rect.top + rect.height/2}`;
      }
      
      path.setAttribute("d", pathData);
      
      // Enhance line for combos
      if (comboCount > 1) {
        // Thicker line for higher combos
        const strokeWidth = 3 + (comboCount > 5 ? 2 : comboCount > 3 ? 1 : 0);
        path.setAttribute("stroke-width", strokeWidth);
        
        // Different color for higher combos
        if (comboCount >= 7) {
          path.setAttribute("stroke", "#ff5500"); // Orange-Red for high combos
        } else if (comboCount >= 5) {
          path.setAttribute("stroke", "#ff9800"); // Orange for medium combos
        } else if (comboCount >= 3) {
          path.setAttribute("stroke", "#ffc107"); // Amber for low combos
        } else {
          path.setAttribute("stroke", "gold"); // Default gold
        }
        
        // Add glow for higher combos
        if (comboCount >= 3) {
          path.setAttribute("filter", "drop-shadow(0 0 3px gold)");
        }
      } else {
        path.setAttribute("stroke", "gold");
      }
      
      svg.appendChild(path);
      
      // Remove after animation completes
      setTimeout(() => {
        if (svg.parentNode) {
          svg.parentNode.removeChild(svg);
        }
      }, 2000);
    } catch (e) {
      console.error("Error drawing connecting line:", e);
    }
  }, 300);
  
  // Speed up animations for higher combos
  const baseDelay = comboCount > 5 ? 50 : comboCount > 3 ? 60 : comboCount > 1 ? 70 : 80;
  
  // Create wave animation with delay between cells
  validCells.forEach(({ cell }, i) => {
    // Apply wave animation with increasing delay
    setTimeout(() => {
      try {
        // Add the wave animation class
        cell.classList.add('cell-wave-animation');
        
        // Enhanced animation for combos
        if (comboCount > 1) {
          // More dramatic scaling for higher combos
          const scale = 1.2 + (comboCount * 0.05);
          cell.style.setProperty('--wave-scale', scale.toFixed(2));
        }
        
        // Remove the class after animation completes
        setTimeout(() => {
          cell.classList.remove('cell-wave-animation');
          cell.style.removeProperty('--wave-scale');
        }, 500);
        
        // Add glow effect on all cells with slight delay
        setTimeout(() => {
          cell.classList.add('cell-completion-glow');
          
          // Enhanced glow for combos
          if (comboCount > 1) {
            // Brighter glow for higher combos
            const glowIntensity = 0.8 + (comboCount * 0.05);
            cell.style.setProperty('--glow-intensity', glowIntensity.toFixed(2));
          }
          
          // Remove glow after animation
          setTimeout(() => {
            cell.classList.remove('cell-completion-glow');
            cell.style.removeProperty('--glow-intensity');
          }, 1200);
        }, 300);
      } catch (e) {
        console.error("Error animating cell:", e);
      }
    }, i * baseDelay); // Dynamic delay based on combo
  });
  
  // Show celebration sparkles on the center cell with a delay
  setTimeout(() => {
    try {
      if (centerCell) {
        // More sparkles for higher combos
        const sparkleCount = comboCount > 5 ? 8 : comboCount > 3 ? 6 : comboCount > 1 ? 5 : 4;
        
        createSparkles(centerCell, sparkleCount);
        
        // Different messages based on unit type and combo
        let messageText = unitType.charAt(0).toUpperCase() + unitType.slice(1) + " Complete!";
        
        // Add combo info to message
        if (comboCount > 1) {
          messageText = `${comboCount}× COMBO! ${messageText}`;
        }
        
        showCompletionMessage(centerCell, messageText, bonusAmount);
      }
    } catch (e) {
      console.error("Error creating sparkle effects:", e);
    }
  }, 500); // Delayed to happen after line starts drawing
  
  // Play completion sound at the start of the animation
  try {
    playCompletionSound();
  } catch (e) {
    console.error("Error playing completion sound:", e);
  }
}
  /**
   * This function should be updated in the completion-bonus.js file
   * It directly uses DOM queries rather than relying on BoardManager.getPlayableCellsInUnit
   */
  
  // The function to add sparkle effects around a cell
  function createSparkles(cell) {
    if (!cell) {
      console.error("Cannot create sparkles: cell is null or undefined");
      return;
    }
    
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Sparkle emojis
    const sparkles = ['✨', '⭐', '🌟', '💫'];
    
    // Create 4-5 sparkles
    for (let i = 0; i < 4 + Math.floor(Math.random() * 2); i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'celebration-sparkle';
      sparkle.textContent = sparkles[i % sparkles.length];
      
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 180;
      
      sparkle.style.setProperty('--tx', `${tx}px`);
      sparkle.style.setProperty('--ty', `${ty}px`);
      sparkle.style.setProperty('--rot', `${rot}deg`);
      
      sparkle.style.left = `${centerX}px`;
      sparkle.style.top = `${centerY}px`;
      
      document.body.appendChild(sparkle);
      
      // Remove after animation completes
      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.parentNode.removeChild(sparkle);
        }
      }, 1000);
    }
  }
  
  // Helper function to add a flash overlay to the cell
  function addFlashOverlay(cell) {
    if (!cell) {
      console.error("Cannot add flash overlay: cell is null or undefined");
      return;
    }
    
    const flash = document.createElement('div');
    flash.className = 'completion-flash';
    cell.appendChild(flash);
    
    // Remove after animation
    setTimeout(() => {
      if (flash.parentNode === cell) {
        flash.remove();
      }
    }, 700);
  }
  
  
  
  
  // Apply bonus effects to tower attacks
  // Apply bonus effects to tower attacks
  function applyEffects(tower, enemy, basePoints, baseCurrency) {
    // Get the completion status directly from BoardManager (no fallback)
    let completionStatus = { rows: [], columns: [], grids: [] };
    
    if (window.BoardManager && typeof BoardManager.getCompletionStatus === 'function') {
      completionStatus = BoardManager.getCompletionStatus();
      console.log("Retrieved completion status from BoardManager:", completionStatus);
    } else {
      console.warn("BoardManager.getCompletionStatus not available");
    }
    
    // Default values (no bonuses)
    let damage = tower.damage;
    let points = basePoints;
    let currency = baseCurrency;
    
    // Apply row completion bonus
    if (completionStatus.rows.includes(tower.row)) {
      damage *= 1.5; // 50% damage bonus
      console.log(`Row ${tower.row} bonus applied: 50% damage boost`);
    }
    
    // Apply column completion bonus
    if (completionStatus.columns.includes(tower.col)) {
      points *= 2; // Double points
      console.log(`Column ${tower.col} bonus applied: 2x points`);
    }
    
    // Apply grid completion bonus
    const gridRow = Math.floor(tower.row / 3);
    const gridCol = Math.floor(tower.col / 3);
    const gridKey = `${gridRow}-${gridCol}`;
    
    if (completionStatus.grids.includes(gridKey)) {
      currency *= 2; // Double currency
      console.log(`Grid ${gridKey} bonus applied: 2x currency`);
    }
    
    return {
      damage: damage,
      points: points,
      currency: currency
    };
  }
  // Add UI buttons
  function addButtons() {
    const gameControls = document.getElementById('game-controls');
    if (!gameControls) {
      console.error("Game controls not found");
      return;
    }
    
    // Create trophy room button if it doesn't exist
    if (!document.getElementById('trophy-room-button')) {
      const trophyButton = document.createElement('button');
      trophyButton.id = 'trophy-room-button';
      trophyButton.textContent = '🏆 Trophies';
      trophyButton.onclick = showTrophyRoom;
      
      // Add button to controls
      const newGameButton = document.getElementById('new-game');
      if (newGameButton) {
        gameControls.insertBefore(trophyButton, newGameButton);
      } else {
        gameControls.appendChild(trophyButton);
      }
    }
  }
  
  // Hook into game events
  // Hook into game events
  // Add this to the bottom of completion-bonus.js or modify your existing function
  
  /**
   * Hook into game events with explicit animation calls
   */
  function hookEvents() {
    console.log("Hooking into game events with improved animation support");
    
    // Hook into Sudoku complete event
    if (window.EventSystem) {
      // First unsubscribe any existing handlers to prevent duplicates
      try {
        EventSystem.clear('row:completed');
        EventSystem.clear('column:completed');
        EventSystem.clear('grid:completed');
      } catch (e) {
        console.log("Note: Could not clear existing subscriptions");
      }
      
      // Subscribe to unit completion events
      EventSystem.subscribe('row:completed', function(rowIndex) {
        console.log(`Row completion event received: ${rowIndex}`);
        if (typeof onUnitCompleted === 'function') {
          onUnitCompleted('row', rowIndex);
        } else if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
          CompletionBonusModule.onUnitCompleted('row', rowIndex);
        }
      });
      
      EventSystem.subscribe('column:completed', function(colIndex) {
        console.log(`Column completion event received: ${colIndex}`);
        if (typeof onUnitCompleted === 'function') {
          onUnitCompleted('column', colIndex);
        } else if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
          CompletionBonusModule.onUnitCompleted('column', colIndex);
        }
      });
      
      EventSystem.subscribe('grid:completed', function(gridKey) {
        console.log(`Grid completion event received: ${gridKey}`);
        if (typeof onUnitCompleted === 'function') {
          onUnitCompleted('grid', gridKey);
        } else if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
          CompletionBonusModule.onUnitCompleted('grid', gridKey);
        }
      });
      
      // Also allow direct handling through GameEvents
      EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
        console.log("SUDOKU_COMPLETE event received");
        setTimeout(showCelebration, 1000);
      });
      
      console.log("Successfully subscribed to completion events");
    } else {
      console.error("EventSystem not available, completion events won't work!");
    }
    
    // Debug function to manually trigger a unit completion
    window.debugTriggerUnitCompletion = function(type, index) {
      console.log(`Manually triggering ${type} ${index} completion`);
      if (typeof onUnitCompleted === 'function') {
        onUnitCompleted(type, index);
      } else if (window.CompletionBonusModule && typeof CompletionBonusModule.onUnitCompleted === 'function') {
        CompletionBonusModule.onUnitCompleted(type, index);
      } else {
        console.error("Cannot find onUnitCompleted function");
      }
      return "Animation triggered - check console for details";
    };
  }
  
  // Make sure this function is called after everything is initialized
  setTimeout(hookEvents, 1000);
  
  
  
function init() {
  console.log("Initializing direct celebration system");
  
  // Reset celebration flag
  hasCelebrated = false;
  
  // Reset combo tracking
  comboCount = 0;
  comboMaxReached = 0;
  if (comboTimer) {
    clearTimeout(comboTimer);
    comboTimer = null;
  }
  
  // Add styles
  addStyles();
  
  // Add completion animation styles
  addCompletionAnimationStyles();
  
  // Add connected line styles
  addConnectedLineStyles();
  
  // Add combo styles
  addComboStyles();
  
  // Add buttons after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addButtons();
      hookEvents();
    });
  } else {
    addButtons();
    hookEvents();
  }
}
  
  // Make functions globally available
  // Make functions globally available
window.CompletionBonusModule = {
  showCelebration: showCelebration,
  showTrophyRoom: showTrophyRoom,
  savePuzzleAsTrophy: savePuzzleAsTrophy,
  onUnitCompleted: onUnitCompleted,
  checkUnitCompletions: checkUnitCompletions,
  applyEffects: applyEffects,
  resetGameAfterCelebration: resetGameAfterCelebration,
  
  // Add combo system functions to the module
  getComboCount: function() { return comboCount; },
  getMaxCombo: function() { return comboMaxReached; },
  resetCombo: function() {
    comboCount = 0;
    if (comboTimer) {
      clearTimeout(comboTimer);
      comboTimer = null;
    }
    updateComboIndicator({ count: 0, multiplier: 1 });
  }
};
  
  // Make closeTrophyRoom globally available for emergency fixes
  window.closeTrophyRoom = closeTrophyRoom;
  
  // Initialize
  init();
})();