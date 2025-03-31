/**
 * direct-celebration.js - Direct implementation of celebration features
 * This script directly adds celebration effects and integrates with the existing code
 * without relying on a separate module system
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
            /* Celebration Container */
            #celebration-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s;
            }
            
            #celebration-container.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            /* Celebration Content */
            .celebration-content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 90%;
                width: 500px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateY(30px);
                opacity: 0;
                transition: transform 0.5s, opacity 0.5s;
                position: relative;
                overflow: hidden;
            }
            
            .celebration-content.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            .celebration-title {
                font-size: 1.8rem;
                margin-bottom: 20px;
                color: #4CAF50;
            }
            
            .celebration-stats {
                margin-bottom: 20px;
                line-height: 1.6;
            }
            
            .celebration-puzzle {
                display: grid;
                grid-template-columns: repeat(9, 1fr);
                gap: 1px;
                background-color: #333;
                margin-bottom: 20px;
                max-width: 300px;
                width: 100%;
                aspect-ratio: 1;
            }
            
            .celebration-cell {
                background-color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 14px;
                position: relative;
            }
            
            .celebration-cell.fixed {
                background-color: #f0f0f0;
            }
            
            .celebration-cell.path {
                background-color: #ffebcc;
            }
            
            .celebration-footer {
                display: flex;
                gap: 10px;
            }
            
            .celebration-button {
                padding: 10px 15px;
                border: none;
                border-radius: 5px;
                background-color: #4CAF50;
                color: white;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.2s;
            }
            
            .celebration-button:hover {
                background-color: #3e8e41;
            }
            
            .celebration-button.secondary {
                background-color: #2196F3;
            }
            
            .celebration-button.secondary:hover {
                background-color: #0b7dda;
            }
            
            /* Confetti */
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                background-color: #f00;
                opacity: 0.8;
                z-index: 1001;
                animation: fall 3s linear forwards;
            }
            
            @keyframes fall {
                0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            
            /* Trophy Room */
            #trophy-room {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s;
            }
            
            #trophy-room.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .trophy-content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 90%;
                width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                transform: translateY(30px);
                opacity: 0;
                transition: transform 0.5s, opacity 0.5s;
            }
            
            .trophy-content.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            .trophy-title {
                font-size: 2rem;
                margin-bottom: 20px;
                color: #ffc107;
            }
            
            .trophy-gallery {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .trophy-item {
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transition: transform 0.2s;
                background-color: #f9f9f9;
            }
            
            .trophy-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .trophy-puzzle {
                display: grid;
                grid-template-columns: repeat(9, 1fr);
                gap: 1px;
                background-color: #333;
                margin-bottom: 10px;
                width: 100%;
                aspect-ratio: 1;
            }
            
            .trophy-info {
                font-size: 0.8rem;
                color: #666;
                margin-top: 5px;
            }
            
            .trophy-date {
                font-weight: bold;
                color: #333;
            }
            
            .trophy-empty {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: #666;
                font-style: italic;
            }
            
            .close-button {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #666;
                cursor: pointer;
                transition: color 0.2s;
            }
            
            .close-button:hover {
                color: #333;
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
            
            // Get board data safely
            if (window.SudokuModule) {
                if (typeof SudokuModule.getBoard === 'function') {
                    const board = SudokuModule.getBoard();
                    if (board && board.length === 9) {
                        currentBoard = JSON.parse(JSON.stringify(board));
                    }
                }
                
                if (typeof SudokuModule.getFixedCells === 'function') {
                    const fixed = SudokuModule.getFixedCells();
                    if (fixed && fixed.length === 9) {
                        fixedCells = JSON.parse(JSON.stringify(fixed));
                    }
                }
                
                if (typeof SudokuModule.getPathCells === 'function') {
                    pathCells = Array.from(SudokuModule.getPathCells() || []);
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
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                       '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', 
                       '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
        
        // Create 100 confetti pieces
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100 + '%';
            const width = Math.random() * 10 + 5 + 'px';
            const height = Math.random() * 10 + 5 + 'px';
            const delay = Math.random() * 2 + 's';
            
            // Apply styles
            confetti.style.backgroundColor = color;
            confetti.style.left = left;
            confetti.style.width = width;
            confetti.style.height = height;
            confetti.style.animationDelay = delay;
            
            // Add to container
            container.appendChild(confetti);
            
            // Remove after animation completes
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }
    
    // Render a puzzle for display
    function renderPuzzleGrid(container, board, fixedCells, pathCells) {
        // Clear container
        container.innerHTML = '';
        
        // Convert path cells to Set if it's an array
        const pathCellsSet = new Set();
        if (Array.isArray(pathCells)) {
            pathCells.forEach(cell => pathCellsSet.add(cell));
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
                cell.className = 'celebration-cell';
                
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
        const closeButton = container.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', closeTrophyRoom);
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
            }, 300);
        }
        
        // Resume game
        if (window.Game && typeof Game.resume === 'function') {
            Game.resume();
        }
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
        
        // Create test button
        const testButton = document.createElement('button');
        testButton.id = 'test-celebration-button';
        testButton.textContent = '🎉 Test';
        testButton.style.backgroundColor = '#ff9800';
        testButton.onclick = showCelebration;
        
        // Add buttons
        const newGameButton = document.getElementById('new-game');
        if (newGameButton) {
            gameControls.insertBefore(trophyButton, newGameButton);
            gameControls.insertBefore(testButton, newGameButton);
        } else {
            gameControls.appendChild(trophyButton);
            gameControls.appendChild(testButton);
        }
    }
    
    // Hook into game events
    function hookEvents() {
        console.log("Hooking into game events");
        
        // Hook into Sudoku complete event
        if (window.EventSystem) {
            EventSystem.subscribe('sudoku:complete', function() {
                console.log("SUDOKU_COMPLETE event received");
                setTimeout(showCelebration, 300);
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
    window.DirectCelebration = {
        showCelebration: showCelebration,
        showTrophyRoom: showTrophyRoom,
        savePuzzleAsTrophy: savePuzzleAsTrophy
    };
    
    // Initialize
    init();
})();