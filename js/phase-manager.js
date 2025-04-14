/**
 * phase-manager.js - Handles game phase transitions and states
 * This module manages the different phases of the game and ensures smooth transitions
 */

const PhaseManager = (function() {
    // Game phases
    const PHASES = {
        INTRO: 'intro',             // Character selection
        SUDOKU: 'sudoku',           // Puzzle solving
        BATTLE: 'battle',           // Enemy wave
        CELEBRATION: 'celebration', // Victory celebration
        GAME_OVER: 'game_over',     // Game over screen
        HISTORY: 'history'          // History/trophy review
    };
    
    // Current phase
    let currentPhase = PHASES.INTRO;
    let previousPhase = null;
    
    // Phase transition handlers
    const phaseHandlers = {
        [PHASES.INTRO]: {
            enter: function() {
                console.log("Entering INTRO phase");
                // Hide game elements that shouldn't be visible during intro
                hideGameBoard();
                
                // Show character selection
                if (window.AbilitySystem && typeof AbilitySystem.init === 'function') {
                    // First make sure any existing character UI is cleaned up
                    const existingCharacterSelection = document.getElementById('character-selection');
                    if (existingCharacterSelection) {
                        existingCharacterSelection.remove();
                    }
                    
                    // Reinitialize ability system to trigger character selection
                    AbilitySystem.init();
                    
                    // Ensure character selection is visible
                    const newCharacterSelection = document.getElementById('character-selection');
                    if (newCharacterSelection) {
                        newCharacterSelection.style.display = 'flex';
                        newCharacterSelection.style.zIndex = '10000';
                    }
                }
            },
            exit: function() {
                console.log("Exiting INTRO phase");
                // Hide character selection
                const characterSelection = document.getElementById('character-selection');
                if (characterSelection) {
                    characterSelection.style.display = 'none';
                }
                
                // Show game elements
                showGameBoard();
            }
        },
        [PHASES.SUDOKU]: {
            enter: function() {
                console.log("Entering SUDOKU phase");
                // Show Sudoku board in number mode
                if (window.BoardManager && typeof BoardManager.toggleDisplayMode === 'function') {
                    BoardManager.toggleDisplayMode(true); // true for numbers mode
                }
                
                // Show appropriate UI elements for Sudoku phase
                showSudokuUI();
                
                // Show game abilities
                showGameUI();
            },
            exit: function() {
                console.log("Exiting SUDOKU phase");
                // Nothing specific needed when exiting Sudoku phase
            }
        },
        [PHASES.BATTLE]: {
            enter: function() {
                console.log("Entering BATTLE phase");
                // Switch to sprite mode
                if (window.BoardManager && typeof BoardManager.toggleDisplayMode === 'function') {
                    BoardManager.toggleDisplayMode(false); // false for sprite mode
                }
                
                // Apply ground art to make paths clear
                applyGroundArt();
                
                // Show battle UI elements
                showBattleUI();
            },
            exit: function() {
                console.log("Exiting BATTLE phase");
                // Clean up any battle-specific elements
                removeGroundArt();
            }
        },
        [PHASES.CELEBRATION]: {
            enter: function() {
                console.log("Entering CELEBRATION phase");
                // Show celebration screen
                if (window.CompletionBonusModule && typeof CompletionBonusModule.showCelebration === 'function') {
                    CompletionBonusModule.showCelebration();
                }
                
                // Hide ability bar and other game UI
                hideGameUI();
                
                // Pause the game
                if (window.Game && typeof Game.pause === 'function') {
                    Game.pause();
                }
            },
            exit: function() {
                console.log("Exiting CELEBRATION phase");
                // Close celebration screen
                const celebrationContainer = document.getElementById('celebration-container');
                if (celebrationContainer) {
                    celebrationContainer.classList.remove('active');
                }
                
                // Resume the game if not transitioning to game over
                if (currentPhase !== PHASES.GAME_OVER && window.Game && typeof Game.resume === 'function') {
                    Game.resume();
                }
            }
        },
        [PHASES.GAME_OVER]: {
            enter: function() {
                console.log("Entering GAME_OVER phase");
                // Show game over screen
                showGameOverScreen();
                
                // Hide ability bar and other game UI
                hideGameUI();
                
                // Pause the game
                if (window.Game && typeof Game.pause === 'function') {
                    Game.pause();
                }
            },
            exit: function() {
                console.log("Exiting GAME_OVER phase");
                // Close game over screen
                const gameOverScreen = document.getElementById('game-over-screen');
                if (gameOverScreen) {
                    gameOverScreen.remove();
                }
            }
        },
        [PHASES.HISTORY]: {
            enter: function() {
                console.log("Entering HISTORY phase");
                // Show trophy room
                if (window.CompletionBonusModule && typeof CompletionBonusModule.showTrophyRoom === 'function') {
                    CompletionBonusModule.showTrophyRoom();
                }
                
                // Hide game UI but keep board visible
                hideGameUI();
            },
            exit: function() {
                console.log("Exiting HISTORY phase");
                // Close trophy room
                if (window.closeTrophyRoom) {
                    window.closeTrophyRoom();
                } else if (window.CompletionBonusModule && typeof CompletionBonusModule.closeTrophyRoom === 'function') {
                    CompletionBonusModule.closeTrophyRoom();
                }
            }
        }
    };
    
    // Helper functions
    function hideGameBoard() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
            gameContainer.style.opacity = '0';
            gameContainer.style.transition = 'opacity 0.3s';
        }
    }
    
    function showGameBoard() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.visibility = 'visible';
            gameContainer.style.opacity = '1';
            
            // Re-render the board to ensure it's visible
            if (window.Game && typeof Game.updateBoard === 'function') {
                setTimeout(() => {
                    Game.updateBoard();
                }, 10);
            }
        }
    }
    
    function hideGameUI() {
        // Hide ability bar
        const abilityBar = document.getElementById('ability-bar');
        if (abilityBar) {
            abilityBar.style.display = 'none';
        }
        
        // Hide other UI elements
        const manaBar = document.getElementById('mana-bar-container');
        if (manaBar) {
            manaBar.style.display = 'none';
        }
        
        const manaText = document.getElementById('mana-text');
        if (manaText) {
            manaText.style.display = 'none';
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
    
    function showGameUI() {
        // Show ability bar if a character is selected
        if (window.AbilitySystem && AbilitySystem.getCurrentCharacter()) {
            const abilityBar = document.getElementById('ability-bar');
            if (abilityBar) {
                abilityBar.style.display = 'flex';
            }
            
            // Show other UI elements
            const manaBar = document.getElementById('mana-bar-container');
            if (manaBar) {
                manaBar.style.display = 'block';
            }
            
            const manaText = document.getElementById('mana-text');
            if (manaText) {
                manaText.style.display = 'block';
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
    }
    
    function showSudokuUI() {
        // Show UI elements specific to Sudoku phase
        const towerSelection = document.getElementById('tower-selection');
        if (towerSelection) {
            towerSelection.style.display = 'flex';
        }
    }
    
    function showBattleUI() {
        // Show UI elements specific to battle phase
        const towerSelection = document.getElementById('tower-selection');
        if (towerSelection) {
            towerSelection.style.display = 'flex';
        }
    }
    
    function applyGroundArt() {
        if (window.LevelsModule && typeof LevelsModule.applyGroundArt === 'function') {
            LevelsModule.applyGroundArt();
        } else {
            // Fallback implementation
            const cells = document.querySelectorAll('.sudoku-cell');
            const pathSet = new Set();
            
            if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
                const pathArray = BoardManager.getPathArray();
                pathArray.forEach(([r, c]) => pathSet.add(`${r},${c}`));
            }
            
            cells.forEach(cell => {
                const row = cell.getAttribute('data-row');
                const col = cell.getAttribute('data-col');
                const key = `${row},${col}`;
                
                cell.classList.remove('grass', 'dirt');
                
                if (pathSet.has(key)) {
                    cell.classList.add('dirt');
                } else {
                    cell.classList.add('grass');
                }
            });
        }
    }
    
    function removeGroundArt() {
        if (window.LevelsModule && typeof LevelsModule.removeGroundArt === 'function') {
            LevelsModule.removeGroundArt();
        } else {
            // Fallback implementation
            const cells = document.querySelectorAll('.sudoku-cell');
            cells.forEach(cell => {
                cell.classList.remove('grass', 'dirt');
            });
        }
    }
    
    function showGameOverScreen() {
        // Create game over screen if it doesn't exist
        let gameOverScreen = document.getElementById('game-over-screen');
        if (!gameOverScreen) {
            gameOverScreen = document.createElement('div');
            gameOverScreen.id = 'game-over-screen';
            
            const score = window.PlayerModule ? PlayerModule.getState().score : 0;
            const level = window.LevelsModule ? LevelsModule.getCurrentLevel() : 1;
            const wave = window.LevelsModule ? LevelsModule.getCurrentWave() : 1;
            
            gameOverScreen.innerHTML = `
                <div class="game-over-content">
                    <h2 class="game-over-title">Game Over!</h2>
                    <div class="game-over-stats">
                        <p>Level: ${level}</p>
                        <p>Wave: ${wave}</p>
                        <p>Final Score: ${score}</p>
                        <p>Thanks for playing!</p>
                    </div>
                    <div class="game-over-buttons">
                        <button id="new-game-button" class="game-over-button">New Game</button>
                        <button id="view-history-button" class="game-over-button secondary-button">View Trophies</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(gameOverScreen);
            
            // Add event listeners
            document.getElementById('new-game-button').addEventListener('click', function() {
                startNewGame();
            });
            
            document.getElementById('view-history-button').addEventListener('click', function() {
                PhaseManager.transitionTo(PHASES.HISTORY);
            });
        }
    }
    
    function startNewGame() {
        // First save the score
        if (window.SaveSystem && typeof SaveSystem.saveScore === 'function') {
            SaveSystem.saveScore();
        }
        
        // Clear character selection to force re-selection
        localStorage.removeItem('sudoku_td_character');
        
        // Transition to intro phase
        transitionTo(PHASES.INTRO);
        
        // Reset game state
        setTimeout(() => {
            if (window.Game && typeof Game.reset === 'function') {
                Game.reset();
            } else {
                // Fallback reload
                window.location.reload();
            }
        }, 100);
    }
    
    /**
     * Update the phase indicator
     * @param {string} phase - Current phase to display
     */
    function updatePhaseIndicator(phase) {
        let indicator = document.getElementById('phase-indicator');
        
        if (!indicator) {
            // Create the indicator
            indicator = document.createElement('div');
            indicator.id = 'phase-indicator';
            document.body.insertBefore(indicator, document.body.firstChild);
        }
        
        // Format the phase name for display
        const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ');
        
        // Update indicator text and class
        indicator.textContent = `Current Phase: ${phaseName}`;
        
        // Remove all phase classes and add the current one
        indicator.classList.remove('intro', 'sudoku', 'battle', 'celebration', 'game_over', 'history');
        indicator.classList.add(phase);
    }
    
    /**
     * Transition to a new phase
     * @param {string} newPhase - The new phase to transition to
     */
    function transitionTo(newPhase) {
        // Validate the phase
        let validPhase = false;
        for (const phase in PHASES) {
            if (PHASES[phase] === newPhase) {
                validPhase = true;
                break;
            }
        }
        
        if (!validPhase) {
            console.error(`Invalid phase: ${newPhase}`);
            return;
        }
        
        console.log(`Transitioning from ${currentPhase} to ${newPhase}`);
        
        // Exit current phase
        if (phaseHandlers[currentPhase] && typeof phaseHandlers[currentPhase].exit === 'function') {
            phaseHandlers[currentPhase].exit();
        }
        
        // Update phase
        previousPhase = currentPhase;
        currentPhase = newPhase;
        
        // Enter new phase
        if (phaseHandlers[currentPhase] && typeof phaseHandlers[currentPhase].enter === 'function') {
            phaseHandlers[currentPhase].enter();
        }
        
        // Update the phase indicator
        updatePhaseIndicator(newPhase);
        
        // Publish phase change event
        if (window.EventSystem) {
            EventSystem.publish('phase:changed', { 
                previousPhase: previousPhase, 
                currentPhase: newPhase 
            });
        }
    }
    
    /**
     * Get the current phase
     * @returns {string} Current phase
     */
    function getCurrentPhase() {
        return currentPhase;
    }
    
    /**
     * Initialize the phase manager and set up event subscriptions
     */
    function init() {
        console.log("PhaseManager initializing...");
        
        // Subscribe to game events for phase transitions
        if (window.EventSystem) {
            // Game over event
            EventSystem.subscribe(GameEvents.GAME_OVER, function(data) {
                transitionTo(PHASES.GAME_OVER);
            });
            
            // Sudoku complete event
            EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
                transitionTo(PHASES.CELEBRATION);
            });
            
            // Wave start event
            EventSystem.subscribe(GameEvents.WAVE_START, function() {
                transitionTo(PHASES.BATTLE);
            });
            
            // Wave complete event
            EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
                // Return to Sudoku phase after wave
                transitionTo(PHASES.SUDOKU);
            });
            
            // Character selected event
            EventSystem.subscribe('character:selected', function() {
                // Transition to Sudoku phase when character is selected
                if (currentPhase === PHASES.INTRO) {
                    transitionTo(PHASES.SUDOKU);
                }
            });
        }
        
        // Initialize the phase indicator
        updatePhaseIndicator(PHASES.INTRO);
        
        // Default to intro phase
        transitionTo(PHASES.INTRO);
        
        console.log("PhaseManager initialized");
    }
    
    // Public API
    return {
        init: init,
        transitionTo: transitionTo,
        getCurrentPhase: getCurrentPhase,
        PHASES: PHASES,
        startNewGame: startNewGame,
        updatePhaseIndicator: updatePhaseIndicator
    };
})();

// Make the module available globally
window.PhaseManager = PhaseManager;