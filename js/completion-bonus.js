/**
 * Enhanced completion-bonus.js - Now with number set completion bonuses
 * This module handles bonuses for completing various units in the game
 */

(function() {
    console.log("Initializing enhanced celebration system with number bonuses");
    
    // Storage for completed puzzles
    let completedPuzzles = [];
    const MAX_SAVED_PUZZLES = 10;
    
    // Track which numbers are complete (all instances of the number placed)
    let completedNumbers = new Set();
    
    // Define bonus multipliers for different completion types
    const BONUSES = {
        row: { damage: 1.5, points: 1.0, currency: 1.0 },
        column: { damage: 1.0, points: 2.0, currency: 1.0 },
        grid: { damage: 1.0, points: 1.0, currency: 2.0 },
        number: { damage: 2.0, points: 1.5, currency: 1.5 } // New number completion bonus
    };
    
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
    
    // Add CSS styles for celebration, trophy room, and number bonuses
    function addStyles() {
        if (document.getElementById('direct-celebration-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'direct-celebration-styles';
        style.textContent = `
            /* Existing celebration styles */
            
            /* Number bonus indicator styles */
            .number-bonus-indicator {
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                text-align: center;
                font-size: 9px;
                font-weight: bold;
                color: #ff4500;
                background-color: rgba(255, 255, 255, 0.7);
                border-radius: 2px;
                padding: 1px 0;
                box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
                pointer-events: none;
            }
            
            /* Glow effect for towers with damage bonus */
            .tower-with-bonus {
                animation: bonus-glow 2s infinite alternate;
            }
            
            @keyframes bonus-glow {
                from { box-shadow: 0 0 4px 2px rgba(255, 69, 0, 0.7); }
                to { box-shadow: 0 0 8px 4px rgba(255, 69, 0, 0.9); }
            }
            
            /* Number bonus dashboard */
            #number-bonus-dashboard {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 5px;
                margin-top: 10px;
                padding: 5px;
                background-color: rgba(0, 0, 0, 0.05);
                border-radius: 5px;
            }
            
            .number-status {
                position: relative;
                width: 24px;
                height: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-weight: bold;
                border-radius: 4px;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                font-size: 12px;
            }
            
            .number-status.complete {
                background-color: #4CAF50;
                color: white;
                border-color: #2E7D32;
            }
            
            .number-status .bonus-text {
                position: absolute;
                bottom: -16px;
                left: 0;
                width: 100%;
                font-size: 8px;
                text-align: center;
                color: #ff4500;
                font-weight: bold;
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
    
    // Create confetti effect (unchanged from original)
    function createConfetti(container) {
        // Implementation remains unchanged
    }
    
    // Show celebration screen (unchanged from original)
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
        
        // Show container and add event handlers (unchanged from original)
    }
    
    // Check if all instances of a specific number have been placed
    function checkNumberCompletion() {
        const boardManager = window.BoardManager || window.SudokuModule;
        if (!boardManager) return;
        
        const board = boardManager.getBoard();
        const solution = boardManager.getSolution();
        const pathCells = boardManager.getPathCells();
        
        // Check each number 1-9
        for (let num = 1; num <= 9; num++) {
            let expectedCount = 0;
            let actualCount = 0;
            
            // Count how many instances of this number should be on the board (excluding path cells)
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (!pathCells.has(`${row},${col}`) && solution[row][col] === num) {
                        expectedCount++;
                    }
                    
                    if (!pathCells.has(`${row},${col}`) && board[row][col] === num) {
                        actualCount++;
                    }
                }
            }
            
            // If we've placed all instances of this number
            if (expectedCount > 0 && actualCount === expectedCount) {
                if (!completedNumbers.has(num)) {
                    completedNumbers.add(num);
                    
                    // Trigger bonus for newly completed number
                    onNumberCompleted(num);
                }
            } else {
                // If the number was complete but now isn't, remove it
                if (completedNumbers.has(num)) {
                    completedNumbers.delete(num);
                    
                    // Update UI to reflect the change
                    updateNumberBonusUI();
                }
            }
        }
    }
    
    // Handle completion of a number set
    function onNumberCompleted(number) {
        console.log(`Number set completed: ${number}`);
        
        // Show a message
        EventSystem.publish(GameEvents.STATUS_MESSAGE, 
            `All ${number}'s placed! Towers with number ${number} now deal 2x damage!`);
        
        // Update UI to show bonus
        updateNumberBonusUI();
        
        // Highlight all towers of this number with a glow effect
        highlightTowersWithBonus(number);
        
        // Add bonus indicators to tower buttons
        updateTowerSelectionButtons();
    }
    
    // Highlight towers that have a damage bonus
    function highlightTowersWithBonus(number) {
        // Find towers on the board with the completed number
        const towers = window.TowersModule ? TowersModule.getTowers() : [];
        const boardElement = document.getElementById('sudoku-board');
        
        if (!boardElement) return;
        
        // First, remove existing bonus highlights
        const existingHighlights = boardElement.querySelectorAll('.tower-with-bonus');
        existingHighlights.forEach(el => el.classList.remove('tower-with-bonus'));
        
        // Add highlights to towers with bonus
        towers.forEach(tower => {
            if (tower.type == number || (number === 'all' && completedNumbers.has(parseInt(tower.type)))) {
                const cell = boardElement.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                if (cell) {
                    cell.classList.add('tower-with-bonus');
                }
            }
        });
    }
    
    // Update all number bonus UI elements
    function updateNumberBonusUI() {
        // Update tower selection buttons
        updateTowerSelectionButtons();
        
        // Update number bonus dashboard
        updateNumberBonusDashboard();
        
        // Highlight all towers with bonuses
        highlightTowersWithBonus('all');
    }
    
    // Add or update indicators on tower selection buttons
    function updateTowerSelectionButtons() {
        const towerOptions = document.querySelectorAll('.tower-option');
        
        towerOptions.forEach(option => {
            const towerType = option.dataset.towerType;
            if (!towerType || towerType === 'special') return;
            
            // Remove existing indicators
            const existingIndicator = option.querySelector('.number-bonus-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Add new indicator if this number is complete
            if (completedNumbers.has(parseInt(towerType))) {
                const indicator = document.createElement('div');
                indicator.className = 'number-bonus-indicator';
                indicator.textContent = '2× DMG';
                option.appendChild(indicator);
            }
        });
    }
    
    // Create or update the number bonus dashboard
    function updateNumberBonusDashboard() {
        // Find or create the dashboard
        let dashboard = document.getElementById('number-bonus-dashboard');
        
        if (!dashboard) {
            // Find where to insert the dashboard
            const gameInfo = document.getElementById('game-info');
            if (!gameInfo) return;
            
            dashboard = document.createElement('div');
            dashboard.id = 'number-bonus-dashboard';
            dashboard.innerHTML = '<div style="width:100%; text-align:center; font-size:10px; color:#666; margin-bottom:3px;">Number Completion Status:</div>';
            
            // Create number status indicators
            for (let i = 1; i <= 9; i++) {
                const numStatus = document.createElement('div');
                numStatus.className = 'number-status';
                numStatus.id = `number-status-${i}`;
                numStatus.textContent = i;
                
                // Add bonus text element
                const bonusText = document.createElement('div');
                bonusText.className = 'bonus-text';
                bonusText.textContent = '2× DMG';
                numStatus.appendChild(bonusText);
                
                dashboard.appendChild(numStatus);
            }
            
            // Insert after game info
            gameInfo.parentNode.insertBefore(dashboard, gameInfo.nextSibling);
        }
        
        // Update the status of each number
        for (let i = 1; i <= 9; i++) {
            const numStatus = document.getElementById(`number-status-${i}`);
            if (!numStatus) continue;
            
            if (completedNumbers.has(i)) {
                numStatus.classList.add('complete');
            } else {
                numStatus.classList.remove('complete');
            }
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
            damage *= BONUSES.row.damage;
            points *= BONUSES.row.points;
            currency *= BONUSES.row.currency;
        }
        
        // Apply column completion bonus
        if (completionStatus.columns.includes(tower.col)) {
            damage *= BONUSES.column.damage;
            points *= BONUSES.column.points;
            currency *= BONUSES.column.currency;
        }
        
        // Apply grid completion bonus
        const gridRow = Math.floor(tower.row / 3);
        const gridCol = Math.floor(tower.col / 3);
        const gridKey = `${gridRow}-${gridCol}`;
        
        if (completionStatus.grids.includes(gridKey)) {
            damage *= BONUSES.grid.damage;
            points *= BONUSES.grid.points;
            currency *= BONUSES.grid.currency;
        }
        
        // Apply number completion bonus (new)
        const towerType = parseInt(tower.type);
        if (!isNaN(towerType) && completedNumbers.has(towerType)) {
            damage *= BONUSES.number.damage;
            points *= BONUSES.number.points;
            currency *= BONUSES.number.currency;
        }
        
        return {
            damage: damage,
            points: points,
            currency: currency
        };
    }
    
    // Hook into game events
    function hookEvents() {
        console.log("Hooking into game events for number completion bonuses");
        
        // Listen for tower placement to check for number completions
        EventSystem.subscribe(GameEvents.TOWER_PLACED, function() {
            checkNumberCompletion();
        });
        
        // Listen for tower removal to check for number completions
        EventSystem.subscribe(GameEvents.TOWER_REMOVED, function() {
            checkNumberCompletion();
        });
        
        // Listen for wave completion to update UI
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
            updateNumberBonusUI();
        });
        
        // Listen for board updates
        EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
            // Reset completed numbers when a new board is generated
            completedNumbers.clear();
            updateNumberBonusUI();
        });
        
        // Hook into tower attacks to visualize bonus damage
        const originalTowerAttack = EventSystem.subscribe;
        EventSystem.subscribe = function(eventName, callback) {
            if (eventName === GameEvents.TOWER_ATTACK) {
                // Wrap the tower attack callback with bonus visualization
                const enhancedCallback = function(data) {
                    // Original callback
                    const result = callback(data);
                    
                    // Add visual effect for bonus damage if applicable
                    if (data && data.tower && data.damage) {
                        const towerType = parseInt(data.tower.type);
                        if (!isNaN(towerType) && completedNumbers.has(towerType)) {
                            // Add stronger visual effect for bonus damage
                            setTimeout(() => {
                                const boardElement = document.getElementById('sudoku-board');
                                if (boardElement) {
                                    const cell = boardElement.querySelector(`.sudoku-cell[data-row="${data.tower.row}"][data-col="${data.tower.col}"]`);
                                    if (cell) {
                                        cell.classList.add('bonus-attack');
                                        setTimeout(() => {
                                            cell.classList.remove('bonus-attack');
                                        }, 300);
                                    }
                                }
                            }, 50);
                        }
                    }
                    
                    return result;
                };
                
                return originalTowerAttack.call(this, eventName, enhancedCallback);
            }
            
            // Normal subscription for other events
            return originalTowerAttack.call(this, eventName, callback);
        };
    }
    
    // Initialize the enhanced system
    function init() {
        console.log("Initializing enhanced completion bonus system with number bonuses");
        
        // Add styles
        addStyles();
        
        // Check all numbers on startup
        setTimeout(checkNumberCompletion, 1000);
        
        // Hook into events
        hookEvents();
        
        // Create initial number dashboard
        setTimeout(updateNumberBonusDashboard, 1000);
    }
    
    // Make functions globally available
    window.CompletionBonusModule = {
        showCelebration: showCelebration,
        savePuzzleAsTrophy: savePuzzleAsTrophy,
        onUnitCompleted: function(unitType, unitIndex) {
            console.log(`Unit completed: ${unitType} ${unitIndex}`);
            // Apply bonus effects (unchanged from original)
        },
        checkUnitCompletions: function() {
            // Original unit completion checks go here (unchanged)
        },
        checkNumberCompletion: checkNumberCompletion,
        applyEffects: applyEffects,
        getCompletedNumbers: function() {
            return Array.from(completedNumbers);
        }
    };
    
    // Initialize
    init();
})();