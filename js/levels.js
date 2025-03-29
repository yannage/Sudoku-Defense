/**
 * levels.js - Handles level progression and difficulty scaling
 * This module manages game levels, difficulty, and wave progression
 * MODIFIED: Removed level changes after 5 waves - only changes when Sudoku is complete
 */

const LevelsModule = (function() {
    // Private variables
    let currentLevel = 1;
    let currentWave = 1;
    let difficulty = 'medium'; // easy, medium, hard
    
    // Difficulty settings
    const difficultySettings = {
        easy: {
            enemyHealthMultiplier: 0.8,
            enemySpeedMultiplier: 0.8,
            enemyRewardMultiplier: 1.2,
            waveSize: 8,
            timeBetweenWaves: 15
        },
        medium: {
            enemyHealthMultiplier: 1,
            enemySpeedMultiplier: 1,
            enemyRewardMultiplier: 1,
            waveSize: 10,
            timeBetweenWaves: 10
        },
        hard: {
            enemyHealthMultiplier: 1.2,
            enemySpeedMultiplier: 1.2,
            enemyRewardMultiplier: 0.8,
            waveSize: 12,
            timeBetweenWaves: 8
        }
    };
    
    /**
     * Initialize the levels module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        currentLevel = options.level || 1;
        currentWave = options.wave || 1;
        difficulty = options.difficulty || 'medium';
        
        // Set difficulty in Sudoku module
        SudokuModule.setDifficulty(difficulty);
    }
    
    /**
     * Start a wave
     */
    function startWave() {
    if (EnemiesModule.isWaveInProgress()) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Wave already in progress!");
        return;
    }
    
    // REMOVED: Code that generated a new path when starting a wave
    
    // Make sure the Enemies module is aware of the current path
    if (typeof SudokuModule.getPathArray === 'function') {
        const currentPath = SudokuModule.getPathArray();
        EventSystem.publish('path:updated', currentPath);
    }
    
    // Start the wave in the enemies module
    EnemiesModule.startWave();
}
    
    /**
     * Get the current settings based on level and difficulty
     * @returns {Object} Current game settings
     */
    function getCurrentSettings() {
        const settings = { ...difficultySettings[difficulty] };
        
        // Apply level-based scaling
        settings.enemyHealthMultiplier *= 1 + (currentLevel - 1) * 0.1;
        settings.enemySpeedMultiplier *= 1 + (currentLevel - 1) * 0.05;
        settings.waveSize += Math.floor((currentLevel - 1) * 2);
        
        return settings;
    }
    
    /**
     * Set the game difficulty
     * @param {string} newDifficulty - The new difficulty (easy, medium, hard)
     */
    function setDifficulty(newDifficulty) {
        if (difficultySettings[newDifficulty]) {
            difficulty = newDifficulty;
            SudokuModule.setDifficulty(difficulty);
        }
    }
    
    /**
     * Get the current difficulty
     * @returns {string} Current difficulty
     */
    function getDifficulty() {
        return difficulty;
    }
    
    /**
     * Get the current level
     * @returns {number} Current level
     */
    function getCurrentLevel() {
        return currentLevel;
    }
    
    /**
     * Get the current wave
     * @returns {number} Current wave
     */
    function getCurrentWave() {
        return currentWave;
    }
    
    /**
     * Advance to the next level
     */
    function nextLevel() {
        currentLevel++;
        currentWave = 1;
        
        // Sync wave number with EnemiesModule
        if (window.EnemiesModule && typeof EnemiesModule.setWaveNumber === 'function') {
            EnemiesModule.setWaveNumber(currentWave);
        }
        
        // Generate a new Sudoku puzzle
        SudokuModule.generatePuzzle();
        
        EventSystem.publish(GameEvents.UI_UPDATE, {
            level: currentLevel,
            wave: currentWave
        });
        
        // Save the current score to make sure we have the most up-to-date value
        SaveSystem.saveScore();
        
        EventSystem.publish(GameEvents.STATUS_MESSAGE, `Advanced to Level ${currentLevel}! Sudoku puzzle complete!`);
    }
    
    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Listen for game initialization
        EventSystem.subscribe(GameEvents.GAME_INIT, function(options) {
            init(options);
        });
        
        // Listen for wave completion
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
            // Increment the wave number
            currentWave++;
            
            // Sync wave number with EnemiesModule
            if (window.EnemiesModule && typeof EnemiesModule.setWaveNumber === 'function') {
                EnemiesModule.setWaveNumber(currentWave);
            }
            
            // Update UI
            EventSystem.publish(GameEvents.UI_UPDATE, {
                wave: currentWave
            });
            
            // Show a message about the changing path
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                `Wave ${currentWave} approaching! The enemies will find a new path!`);
        });
        
        // Listen for Sudoku completion to advance to next level
        EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
            // Bonus for completing the Sudoku
            const levelBonus = 150 * currentLevel;
            PlayerModule.addCurrency(levelBonus);
            PlayerModule.addScore(levelBonus * 3);
            
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                `Sudoku puzzle complete! Level ${currentLevel} completed! Bonus: ${levelBonus} currency and ${levelBonus * 3} points!`);
            
            // Wait a bit before advancing to next level
            setTimeout(() => {
                nextLevel();
            }, 3000);
        });
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Public API
    return {
        init,
        startWave,
        getCurrentSettings,
        setDifficulty,
        getDifficulty,
        getCurrentLevel,
        getCurrentWave,
        nextLevel
    };
})();

// Make module available globally
window.LevelsModule = LevelsModule;