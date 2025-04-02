/**
 * Direct update for completion-bonus.js to use BoardManager
 * This provides a more complete implementation that can be applied to the whole file
 */

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
            console.log(`Loaded ${completedPuzzles.length / 2} completed puzzles from storage`);
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
        // CSS styles here remain unchanged
        // ...
        
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
        // Implementation remains unchanged
        // ...
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
        
        // Create cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'trophy-cell';;
                
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
        console.log("Showing celebration screen");
        
        // Save current puzzle
        const trophy = savePuzzleAsTrophy();
        
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
                    <p>Puzzle added to your Trophy Room!</p>
                </div>
                <div class="celebration-puzzle" id="celebration-puzzle"></div>
                <div class="celebration-footer">
                    <button class="celebration-button" id="continue-button">Continue to Next Level</button>
                    <button class="celebration-button secondary" id="view-trophies-button">View Trophy Room</button>
                </div>
            </div>
        `;
        
        // Show container
        container.classList.add('active');
        
        // Create confetti
        createConfetti(container);
        
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
        console.debug("trying to close trophy room");
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeCelebration();
            });
        }
        
        const continueButton = document.getElementById('continue-button');
        if (continueButton) {
            continueButton.addEventListener('click', () => {
                closeCelebration();
                // Resume game if needed
                if (window.Game && typeof Game.resume === 'function') {
                    Game.resume();
                }
            });
        }
        
        const viewTrophiesButton = document.getElementById('view-trophies-button');
        if (viewTrophiesButton) {
            viewTrophiesButton.addEventListener('click', () => {
                closeCelebration();
                showTrophyRoom();
            });
        }
        
        // Pause game while showing celebration
        if (window.Game && typeof Game.pause === 'function') {
            Game.pause();
        }
    }
    
    // Close celebration screen
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
    
function closeTrophyRoom() {
  const container = document.getElementById('trophy-room');
  if (container) {
    const content = container.querySelector('.trophy-content');
    if (content) content.classList.remove('active');
    
    setTimeout(() => {
      container.classList.remove('active');
      container.innerHTML = ''; // Optional: Clear it completely
    }, 300);
  }
  
  if (window.Game && typeof Game.resume === 'function') {
    Game.resume();
  }
}

// Make sure it's available globally
window.closeTrophyRoom = closeTrophyRoom;
    
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
        
        // Create trophy room button
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
    
    // Hook into game events
    function hookEvents() {
        console.log("Hooking into game events");
        
        // Use BoardManager's checkUnitCompletion for consistency
        // This ensures that unit completions are detected consistently
        const originalCheckUnitCompletion = window.BoardManager 
            ? BoardManager.checkUnitCompletion 
            : (window.SudokuModule ? SudokuModule.checkUnitCompletion : null);
        
        if (originalCheckUnitCompletion) {
            // We'll let this function continue to work normally
            // Our event hooks below will catch the completion events
        }
        
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
        applyEffects: applyEffects
    };
    
    // Initialize
    init();
})();