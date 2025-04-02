/**
 * init.js - Script to load and initialize game modules in the correct order
 * This file should be included last in the HTML
 */

// Wait for all modules to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Sudoku Tower Defense with save functionality...");
    
    // Ensure all required modules are available
    if (!window.EventSystem) {
        console.error("EventSystem module not found!");
        return;
    }
    
    // Add script tags for our new modules
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    // First, add the SaveSystem module
    const saveSystemScript = document.createElement('script');
    saveSystemScript.innerHTML = SaveSystem.toString().replace('const SaveSystem = ', 'window.SaveSystem = ') + ';';
    document.head.appendChild(saveSystemScript);
    
    // Apply our fixes
    function applyGameFixes() {
        console.log("Applying game fixes and enhancements...");
        
        // 1. Add high score tracking to Game.updateUI
        const originalUpdateUI = Game.updateUI;
        Game.updateUI = function() {
            originalUpdateUI.call(this);
            
            // Update high score if available
            if (window.SaveSystem && typeof SaveSystem.getHighScore === 'function') {
                const highScore = SaveSystem.getHighScore();
                
                // Create or update high score element
                let highScoreElement = document.getElementById('high-score-value');
                if (!highScoreElement) {
                    // If high score element doesn't exist, create it
                    const gameHeader = document.getElementById('game-header');
                    if (gameHeader) {
                        const highScoreDiv = document.createElement('div');
                        highScoreDiv.id = 'high-score';
                        highScoreDiv.innerHTML = 'High Score: <span id="high-score-value">' + highScore + '</span>';
                        gameHeader.appendChild(highScoreDiv);
                        
                        // Add high score styles if not already present
                        if (!document.getElementById('high-score-styles')) {
                            const style = document.createElement('style');
                            style.id = 'high-score-styles';
                            style.textContent = `
                                #high-score {
                                    color: white;
                                    font-weight: bold;
                                }
                                
                                #high-score-value {
                                    color: gold;
                                }
                            `;
                            document.head.appendChild(style);
                        }
                    }
                } else {
                    // Update existing high score element
                    highScoreElement.textContent = highScore;
                }
            }
        };
        
        // 2. Add level completion modal function to window
        window.showLevelComplete = function(level, score) {
            // Create or get the modal
            let modal = document.getElementById('level-complete-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'level-complete-modal';
                modal.className = 'modal';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                
                const modalTitle = document.createElement('h2');
                modalTitle.id = 'level-complete-title';
                modalContent.appendChild(modalTitle);
                
                const modalScore = document.createElement('p');
                modalScore.id = 'level-complete-score';
                modalContent.appendChild(modalScore);
                
                const continueButton = document.createElement('button');
                continueButton.textContent = 'Continue';
                continueButton.onclick = function() {
                    modal.classList.remove('active');
                };
                modalContent.appendChild(continueButton);
                
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
            }
            
            // Update modal content
            document.getElementById('level-complete-title').textContent = `Level ${level} Complete!`;
            document.getElementById('level-complete-score').textContent = `Current Score: ${score}`;
            
            // Show the modal
            modal.classList.add('active');
        };
        
        // 3. Make sure high score is loaded on game start and reset
        const originalReset = Game.reset;
        if (typeof originalReset === 'function') {
            Game.reset = function() {
                // Call original reset
                originalReset.apply(this, arguments);
                
                // Update UI to show high score
                setTimeout(() => {
                    if (typeof Game.updateUI === 'function') {
                        Game.updateUI();
                    }
                }, 100);
            };
        }
        
        // 4. Make sure scores are saved when game ends or browser closes
        window.addEventListener('beforeunload', function() {
            if (window.SaveSystem && typeof SaveSystem.saveScore === 'function') {
                SaveSystem.saveScore();
            }
        });
        
        // 5. Add level completion modal styles
        const style = document.createElement('style');
        style.textContent = `
            #high-score {
                color: white;
                font-weight: bold;
            }
            
            #high-score-value {
                color: gold;
            }
            
            /* Level complete modal styles */
            #level-complete-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 100;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }
            
            #level-complete-modal.active {
                opacity: 1;
                pointer-events: all;
            }
            
            #level-complete-modal .modal-content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
                max-width: 80%;
                transform: translateY(-20px);
                transition: transform 0.3s;
            }
            
            #level-complete-modal.active .modal-content {
                transform: translateY(0);
            }
            
            #level-complete-title {
                color: #4CAF50;
                margin-bottom: 15px;
            }
            
            #level-complete-score {
                font-size: 1.2rem;
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(style);
        
        // 6. Fix LevelsModule to not restart after 5 waves
        // This requires a deeper modification - overriding event handlers
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
            // Check if this is a duplicate subscription
            if (window._waveHandlerFixed) return;
            
            // Increment the wave number
            const currentWave = LevelsModule.getCurrentWave();
            
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
        }, true);
        window._waveHandlerFixed = true;
        
        // 7. Add completion modal trigger
        EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
            const currentLevel = LevelsModule.getCurrentLevel();
            const currentScore = PlayerModule.getState().score;
            
            // Show level complete notification after the score is updated
           /* setTimeout(() => {
                if (window.showLevelComplete) {
                    window.showLevelComplete(currentLevel, currentScore);
                }
            }, 500);*/
        });
        
        // 8. Add debug tools for saving system
        window.debugSaveSystem = {
            // Display current save state in the console
            showSavedData: function() {
                if (!window.SaveSystem) {
                    console.error("SaveSystem not available");
                    return;
                }
                
                const state = SaveSystem.getLastSavedState();
                console.log("%cCurrent Save State:", "color: blue; font-weight: bold;");
                console.table(state);
                return state;
            },
            
            // Force saving the current score
            forceSave: function() {
                if (!window.SaveSystem) {
                    console.error("SaveSystem not available");
                    return;
                }
                
                SaveSystem.saveScore();
                console.log("%cGame state saved!", "color: green; font-weight: bold;");
                return this.showSavedData();
            },
            
            // Set a specific high score (for testing)
            setHighScore: function(score) {
                if (!window.SaveSystem) {
                    console.error("SaveSystem not available");
                    return;
                }
                
                // Direct access to localStorage
                localStorage.setItem('sudoku_td_high_score', score);
                console.log(`%cHigh score set to ${score}`, "color: green; font-weight: bold;");
                
                // Update UI if possible
                if (window.Game && typeof Game.updateUI === 'function') {
                    Game.updateUI();
                }
                
                return this.showSavedData();
            },
            
            // Reset all saved data
            resetAll: function() {
                if (!window.SaveSystem) {
                    console.error("SaveSystem not available");
                    return;
                }
                
                SaveSystem.clearSavedData();
                console.log("%cAll saved data cleared", "color: orange; font-weight: bold;");
                
                // Update UI if possible
                if (window.Game && typeof Game.updateUI === 'function') {
                    Game.updateUI();
                }
                
                return this.showSavedData();
            },
            
            // Fix high score display
            fixHighScoreDisplay: function() {
                const gameHeader = document.getElementById('game-header');
                if (!gameHeader) {
                    console.error("Game header not found");
                    return;
                }
                
                // Remove existing high score if present
                const existingHighScore = document.getElementById('high-score');
                if (existingHighScore) {
                    existingHighScore.remove();
                }
                
                // Create new high score element
                const highScore = SaveSystem.getHighScore();
                const highScoreDiv = document.createElement('div');
                highScoreDiv.id = 'high-score';
                highScoreDiv.innerHTML = 'High Score: <span id="high-score-value">' + highScore + '</span>';
                highScoreDiv.style.color = 'white';
                highScoreDiv.style.fontWeight = 'bold';
                
                // Add to game header
                gameHeader.appendChild(highScoreDiv);
                
                console.log("%cHigh score display fixed", "color: green; font-weight: bold;");
                return highScore;
            }
        };
        
        console.log("Game fixes and enhancements applied successfully!");
    }
    
    // Load saved font preference function - add this to init.js
function loadFontPreference() {
  const savedFont = localStorage.getItem('sudoku_td_font') || 'font-default';
  document.body.classList.add(savedFont);
  
  // Set the dropdown to match if it exists
  const fontSelector = document.getElementById('font-selector');
  if (fontSelector) {
    fontSelector.value = savedFont;
  }
}
// Load our custom modules and apply fixes
setTimeout(applyGameFixes, 500);

// Load font preference - add this line
setTimeout(loadFontPreference, 600);

//clear character 
localStorage.removeItem('sudoku_td_character');

// Initialize ability system after other modules
setTimeout(function() {
  if (window.AbilitySystem && typeof AbilitySystem.init === 'function') {
    console.log("Initializing Ability System from init.js");
    AbilitySystem.init();
  } else {
    console.warn("AbilitySystem not found, ability features will not be available");
  }
}, 1200); // Slightly longer delay than other modules

// Force a UI refresh to display high score
setTimeout(() => {
  if (Game && Game.updateUI) {
    Game.updateUI();
  }
}, 1000);
});