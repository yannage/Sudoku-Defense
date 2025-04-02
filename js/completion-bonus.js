/**
 * Updated completion-bonus.js with fixes for celebration screen issues
 * - Fixes puzzle display to show with celebration message
 * - Hides character abilities during celebration
 * - Makes Continue button reset game and prompt for new character selection
 */
 
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
            
           .celebration - content {
    background - color: #1a1a1a;
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
    
    // Save the current puzzle as a trophy
    function savePuzzleAsTrophy() {
        try {
            // Get current game state with safety checks
            let currentBoard = Array(9).fill().map(() => Array(9).fill(0));
            let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
            let pathCells = [];
            let level = 1;
            let score = 0;
            
            // Get board data from BoardManager with fallback to SudokuModule
            const boardManager = window.BoardManager || window.SudokuModule;
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
        
        // If data wasn't provided, try to get it from BoardManager or SudokuModule
        if (!board) {
            const boardManager = window.BoardManager || window.SudokuModule;
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
    function resetGameAfterCelebration() {
        closeCelebration();
        
        // Reset hasCelebrated flag to allow future celebrations
        hasCelebrated = false;
        
        console.log("Completely restarting game after celebration");
        
        // Clear any stored character
        localStorage.removeItem('sudoku_td_character');
        
        // Add game end indicator
        showGameEndIndicator();
        
        // Force a complete refresh of the game
        setTimeout(() => {
            // Reset game
            if (window.Game && typeof Game.reset === 'function') {
                Game.reset();
            }
            
            // Force character selection screen to appear with full visibility
            setTimeout(() => {
                if (window.AbilitySystem && typeof AbilitySystem.init === 'function') {
                    // First make sure any existing character UI is cleaned up
                    const existingCharacterSelection = document.getElementById('character-selection');
                    if (existingCharacterSelection) {
                        existingCharacterSelection.remove();
                    }
                    
                    //removes the continue button
                    window.skipContinuePrompt = true;
                    
                    // Reinitialize ability system to trigger character selection
                    AbilitySystem.init();
                    
                    // Ensure character selection is visible
                    const newCharacterSelection = document.getElementById('character-selection');
                    if (newCharacterSelection) {
                        newCharacterSelection.style.display = 'flex';
                        newCharacterSelection.style.zIndex = '10000';
                    }
                }
            }, 600);
        }, 200);
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
    function checkUnitCompletions() {
        // Use BoardManager with fallback to SudokuModule
        const boardManager = window.BoardManager || window.SudokuModule;
        if (boardManager && typeof boardManager.checkUnitCompletion === 'function') {
            boardManager.checkUnitCompletion();
        }
    }
    
    // Handle completion of a unit (row, column, or box)
    function onUnitCompleted(unitType, unitIndex) {
        console.log(`Unit completed: ${unitType} ${unitIndex}`);
        
        // Apply bonus effects for completed units
        applyCompletionBonus(unitType, unitIndex);
        
        // Check if the entire board is complete
        const boardManager = window.BoardManager || window.SudokuModule;
        if (boardManager && typeof boardManager.isComplete === 'function') {
            if (boardManager.isComplete()) {
                // Trigger celebration after a short delay
                setTimeout(showCelebration, 500);
            }
        }
    }
    
    // Apply bonus effects for completed units
    function applyCompletionBonus(unitType, unitIndex) {
        // Implementation depends on your game mechanics
        // This is a placeholder that can be customized
        
        let bonusAmount = 50; // Base bonus
        
        // Different bonus amounts based on unit type
        if (unitType === 'row') {
            bonusAmount = 50;
        } else if (unitType === 'column') {
            bonusAmount = 75;
        } else if (unitType === 'grid') {
            bonusAmount = 100;
        }
        
        // Add currency and score
        if (window.PlayerModule) {
            PlayerModule.addCurrency(bonusAmount);
            PlayerModule.addScore(bonusAmount * 2);
            
            // Show message
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                `${unitType.charAt(0).toUpperCase() + unitType.slice(1)} ${unitIndex} completed! Bonus: ${bonusAmount} currency and ${bonusAmount * 2} points!`);
        }
    }
    
    // Apply bonus effects to tower attacks
    function applyEffects(tower, enemy, basePoints, baseCurrency) {
        // Get the completion status from BoardManager
        const boardManager = window.BoardManager || window.SudokuModule;
        let completionStatus = { rows: [], columns: [], grids: [] };
        
        if (boardManager && typeof boardManager.getCompletionStatus === 'function') {
            completionStatus = boardManager.getCompletionStatus();
        }
        
        // Default values (no bonuses)
        let damage = tower.damage;
        let points = basePoints;
        let currency = baseCurrency;
        
        // Apply row completion bonus
        if (completionStatus.rows.includes(tower.row)) {
            damage *= 1.5; // 50% damage bonus
        }
        
        // Apply column completion bonus
        if (completionStatus.columns.includes(tower.col)) {
            points *= 2; // Double points
        }
        
        // Apply grid completion bonus
        const gridRow = Math.floor(tower.row / 3);
        const gridCol = Math.floor(tower.col / 3);
        const gridKey = `${gridRow}-${gridCol}`;
        
        if (completionStatus.grids.includes(gridKey)) {
            currency *= 2; // Double currency
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
    function hookEvents() {
        console.log("Hooking into game events");
        
        // Hook into Sudoku complete event
        if (window.EventSystem) {
            EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
                console.log("SUDOKU_COMPLETE event received");
                setTimeout(showCelebration, 300);
            });
            
            // Subscribe to row completion
            EventSystem.subscribe('row:completed', function(rowIndex) {
                onUnitCompleted('row', rowIndex);
            });
            
            // Subscribe to column completion
            EventSystem.subscribe('column:completed', function(colIndex) {
                onUnitCompleted('column', colIndex);
            });
            
            // Subscribe to grid completion
            EventSystem.subscribe('grid:completed', function(gridKey) {
                onUnitCompleted('grid', gridKey);
            });
        }
        
        // Hook into LevelsModule
        if (window.LevelsModule && typeof LevelsModule.nextLevel === 'function') {
            console.log("Hooking into LevelsModule.nextLevel");
            const originalNextLevel = LevelsModule.nextLevel;
            
            LevelsModule.nextLevel = function() {
                console.log("LevelsModule.nextLevel called");
                
                // Show celebration before advancing level
                showCelebration();
                
                // Delay level advancement
                setTimeout(() => {
                    originalNextLevel.apply(this, arguments);
                }, 500);
            };
        }
    }
    
    // Initialize
    function init() {
        console.log("Initializing direct celebration system");
        
        // Reset celebration flag
        hasCelebrated = false;
        
        // Add styles
        addStyles();
        
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
    window.CompletionBonusModule = {
        showCelebration: showCelebration,
        showTrophyRoom: showTrophyRoom,
        savePuzzleAsTrophy: savePuzzleAsTrophy,
        onUnitCompleted: onUnitCompleted,
        checkUnitCompletions: checkUnitCompletions,
        applyEffects: applyEffects,
        resetGameAfterCelebration: resetGameAfterCelebration
    };
    
    // Make closeTrophyRoom globally available for emergency fixes
    window.closeTrophyRoom = closeTrophyRoom;
    
    // Initialize
    init();
})();