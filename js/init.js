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
        
        // 3. Add high score styles
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
        
        // 4. Fix LevelsModule to not restart after 5 waves
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
        
        // 5. Add completion modal trigger
        EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
            const currentLevel = LevelsModule.getCurrentLevel();
            const currentScore = PlayerModule.getState().score;
            
            // Show level complete notification after the score is updated
            setTimeout(() => {
                if (window.showLevelComplete) {
                    window.showLevelComplete(currentLevel, currentScore);
                }
            }, 500);
        });
        
        console.log("Game fixes and enhancements applied successfully!");
    }
    
    // Load our custom modules and apply fixes
    setTimeout(applyGameFixes, 500);
    
    // Force a UI refresh to display high score
    setTimeout(() => {
        if (Game && Game.updateUI) {
            Game.updateUI();
        }
    }, 1000);
});