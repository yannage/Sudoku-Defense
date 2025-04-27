/**
 * phase-manager.js - Handles game phase transitions and states
 * This module manages the different phases of the game and ensures smooth transitions
 */

const PhaseManager = (function() {
    // Current phase
    let currentPhase = null;
    let previousPhase = null;
    
    // Game phases
    const PHASES = {
        SETUP: 'setup',          // New setup phase
        INTRO: 'intro',          // Character selection
        SUDOKU: 'sudoku',        // Puzzle solving
        BATTLE: 'battle',        // Enemy wave
        CELEBRATION: 'celebration', // Victory celebration
        GAME_OVER: 'game_over',     // Game over screen
        HISTORY: 'history'          // History/trophy review
    };

    // Add game settings object (keep it in the phase manager)
    let gameSettings = {
        style: 'defense',     // 'defense' or 'basic'
        difficulty: 'easy'    // 'easy', 'medium', or 'hard'
    };
    
    // Phase transition handlers - IMPORTANT: Define as a complete object
    const phaseHandlers = {
        [PHASES.SETUP]: {
            enter: function() {
                console.log("Entering SETUP phase");
                
                // Hide game elements
                hideGameBoard();
                
                // Load saved settings
                loadGameSettings();
                
                // Show setup menu
                const setupMenu = document.getElementById('setup-menu');
                if (setupMenu) {
                    setupMenu.style.display = 'flex';
                    
                    // Initialize options based on saved settings
                    setActiveOption('style', gameSettings.style);
                    setActiveOption('difficulty', gameSettings.difficulty);
                    updateTooltip('style', gameSettings.style);
                    updateTooltip('difficulty', gameSettings.difficulty);
                    
                    // Setup event listeners (only if not already set up)
                    if (!window._setupListenersInitialized) {
                        initSetupListeners();
                        window._setupListenersInitialized = true;
                    }
                } else {
                    console.error("Setup menu not found in DOM");
                    // If setup menu is missing, proceed to character selection
                    setTimeout(() => {
    transitionTo(PHASES.INTRO);
}, 0);
                }
            },
            exit: function() {
                console.log("Exiting SETUP phase");
                
                // Hide setup menu
                const setupMenu = document.getElementById('setup-menu');
                if (setupMenu) {
                    setupMenu.style.display = 'none';
                }
                

            }
        },
[PHASES.INTRO]: {
    enter: function() {
        console.log("Entering INTRO phase");
        
        if (gameSettings.style === 'basic') {
            console.warn("Basic mode selected — skipping INTRO phase.");
            setTimeout(() => {
    transitionTo(PHASES.SUDOKU);
}, 0);
            return;
        }
        
        hideGameBoard();
        
        if (window.AbilitySystem && typeof AbilitySystem.init === 'function') {
            const existingCharacterSelection = document.getElementById('character-selection');
            if (existingCharacterSelection) {
                existingCharacterSelection.remove();
            }
            
            AbilitySystem.init();
            
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
                
                if (gameSettings.style === 'basic') {
    const characterSelection = document.getElementById('character-selection');
    if (characterSelection) {
        characterSelection.style.display = 'none';
    }
}
                
                showGameBoard();
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
    
    function initSetupListeners() {
        console.log("Initializing setup listeners");
        
        // Option selection buttons
        document.querySelectorAll('.setup-option').forEach(button => {
            button.addEventListener('click', function() {
                const option = this.getAttribute('data-option');
                const value = this.getAttribute('data-value');
                
                console.log(`Option clicked: ${option} = ${value}`);
                
                // Update active button
                setActiveOption(option, value);
                
                // Update tooltip
                updateTooltip(option, value);
                
                // Save setting
                gameSettings[option] = value;
                saveGameSettings();
            });
        });
        
        // Start game button
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', function() {
    console.log("Start Game button clicked");
    
    // Apply selected settings first
    applyGameSettings();
    
    if (gameSettings.style === 'basic') {
        // Skip character selection
const difficulty = gameSettings?.difficulty || 'easy';
const style = gameSettings?.style || 'defense';
if (BoardManager?.init) {
    BoardManager.init({ difficulty, style });
}
        
        // Go directly to Sudoku phase
        setTimeout(() => {
    transitionTo(PHASES.SUDOKU);
}, 0);
    } else {
        // Go to character selection
        setTimeout(() => {
    transitionTo(PHASES.INTRO);
}, 0);
    }
});
        } else {
            console.error("Start game button not found");
        }
    }

    /**
     * Set active class on the appropriate option button
     */
    function setActiveOption(option, value) {
        // Remove active class from all options in this group
        document.querySelectorAll(`.setup-option[data-option="${option}"]`).forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to selected option
        const selectedButton = document.querySelector(`.setup-option[data-option="${option}"][data-value="${value}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    /**
     * Update tooltip text based on selected option
     */
    function updateTooltip(option, value) {
        const tooltip = document.getElementById(`${option}-tooltip`);
        if (!tooltip) return;
        
        let text = '';
        
        if (option === 'style') {
            if (value === 'defense') {
                text = 'Sudoku Defense: Classic Sudoku combined with tower defense gameplay. Place towers to defend against enemy waves.';
            } else if (value === 'basic') {
                text = 'Sudoku Basic: Pure Sudoku gameplay without enemies or tower defense elements. Just solve the puzzle at your own pace.';
            }
        } else if (option === 'difficulty') {
            if (value === 'easy') {
                text = 'Easy: More numbers revealed at the start, perfect for beginners.';
            } else if (value === 'medium') {
                text = 'Intermediate: Balanced challenge with fewer numbers revealed, good for regular players.';
            } else if (value === 'hard') {
                text = 'Expert: Very few numbers revealed, designed for Sudoku masters. Challenging puzzles!';
            }
        }
        
        tooltip.textContent = text;
    }

    /**
     * Load game settings from localStorage
     */
    function loadGameSettings() {
        try {
            const savedSettings = localStorage.getItem('sudoku_game_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                gameSettings = { ...gameSettings, ...parsedSettings };
            }
        } catch (e) {
            console.error("Error loading game settings:", e);
        }
    }

    /**
     * Save game settings to localStorage
     */
    function saveGameSettings() {
        try {
            localStorage.setItem('sudoku_game_settings', JSON.stringify(gameSettings));
        } catch (e) {
            console.error("Error saving game settings:", e);
        }
    }

    /**
     * Apply game settings to the game
     */
    function applyGameSettings() {
        console.log("Applying game settings:", gameSettings);
        
        // Apply difficulty to BoardManager
        if (window.BoardManager && typeof BoardManager.setDifficulty === 'function') {
            BoardManager.setDifficulty(gameSettings.difficulty);
        }
        
        const currencyDisplay = document.getElementById('currency-value')?.parentNode;
if (currencyDisplay) {
    currencyDisplay.style.opacity = '1'; // Fully visible
    currencyDisplay.style.pointerEvents = 'auto';
}
        
        // Apply difficulty to LevelsModule
        if (window.LevelsModule && typeof LevelsModule.setDifficulty === 'function') {
            LevelsModule.setDifficulty(gameSettings.difficulty);
        }
        
        // Apply game style
        if (gameSettings.style === 'basic') {
            setupBasicSudokuMode();
        } else {
            setupDefenseMode();
        }
    }

    /**
     * Set up Basic Sudoku mode
     */
    function setupBasicSudokuMode() {
        console.log("Setting up Basic Sudoku mode");
        
        // Set high currency
        if (window.PlayerModule) {
            if (typeof PlayerModule.setInitialCurrency === 'function') {
                PlayerModule.setInitialCurrency(1000000);
            } else if (typeof PlayerModule.addCurrency === 'function') {
                PlayerModule.addCurrency(1000000);
            }
        }
        
        // Hide defense-specific elements
        const elementsToHide = [
            document.getElementById('start-wave'),
            document.getElementById('wave-value')?.parentNode
        ];
        
        elementsToHide.forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Optional: Hide or modify currency display
const currencyDisplay = document.getElementById('currency-value')?.parentNode;
if (currencyDisplay) {
    currencyDisplay.style.opacity = '0'; // Fully transparent
    currencyDisplay.style.pointerEvents = 'none'; // Prevent hovering or clicks
}
        
        // Add a class to the body for CSS targeting
        document.body.classList.add('basic-mode');
        document.body.classList.remove('defense-mode');
    }

    /**
     * Set up Defense mode
     */
    function setupDefenseMode() {
        console.log("Setting up Sudoku Defense mode");
        
        // Show all defense elements
        const elementsToShow = [
            document.getElementById('start-wave'),
            document.getElementById('wave-value')?.parentNode
        ];
        
        elementsToShow.forEach(element => {
            if (element) {
                element.style.display = '';
            }
        });
        
        // Restore currency display
        const currencyDisplay = document.getElementById('currency-value')?.parentNode;
        if (currencyDisplay) {
            currencyDisplay.style.opacity = '1';
        }
        
        // Update body classes
        document.body.classList.add('defense-mode');
        document.body.classList.remove('basic-mode');
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
        console.log("Starting new game from SETUP phase");
        
        // Save the current score if needed
        if (window.SaveSystem && typeof SaveSystem.saveScore === 'function') {
            SaveSystem.saveScore();
        }
        
        // Clear character selection
        localStorage.removeItem('sudoku_td_character');
        
        // Clear any game over or celebration screens
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.remove();
        }
        
        const celebrationContainer = document.getElementById('celebration-container');
        if (celebrationContainer) {
            celebrationContainer.classList.remove('active');
        }
        
        // Reset game state
        if (window.Game && typeof Game.reset === 'function') {
            Game.reset();
        }
        
        // Start from setup phase
        transitionTo(PHASES.SETUP);
    }
    
    /**
     * Update the phase indicator
     * @param {string} phase - Current phase to display
     */
    function updatePhaseIndicator(phase) {
    const indicator = document.getElementById('phase-indicator');
    if (!indicator) {
        console.warn('Phase indicator element not found in DOM.');
        return;
    }

    const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ');
    indicator.textContent = `Current Phase: ${phaseName}`;

    indicator.className = 'phase-banner'; // reset base class
    indicator.classList.add(phase); // adds phase-specific style
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
                setTimeout(() => {
    transitionTo(PHASES.SUDOKU);
}, 0);
            });
            
            // Character selected event
EventSystem.subscribe('character:selected', function() {
    if (currentPhase === PHASES.INTRO) {
        const difficulty = gameSettings?.difficulty || 'easy';
const style = gameSettings?.style || 'defense';
if (BoardManager?.init) {
    BoardManager.init({ difficulty, style });
}
        setTimeout(() => {
    transitionTo(PHASES.SUDOKU);
}, 0);
    }
});
        }
        
        // Initialize the phase indicator
        updatePhaseIndicator(PHASES.SETUP);
        
        // Start with setup phase
        transitionTo(PHASES.SETUP);
        
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