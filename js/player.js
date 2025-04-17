/**
 * player.js - Handles player state and actions
 * This module manages player resources, score, and lives
 */

const PlayerModule = (function() {
    // Private player state
    let state = {
        lives: 3,
        score: 0,
        currency: 225,
        selectedTower: null
    };
    
    /**
     * Initialize the player state
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        state = {
            lives: options.lives || 3,
            score: options.score || 0,
            currency: options.currency || 225, // Increased from 100
            selectedTower: null
        };
        
        console.log("PlayerModule initialized with currency: " + state.currency);
        
        // Publish initial state
        publishState();
    }
    
    /**
     * Publish the current player state
     */
    function publishState() {
        console.log("Publishing player state: Lives=" + state.lives + ", Currency=" + state.currency);
        
        // Publish complete state
        EventSystem.publish(GameEvents.PLAYER_UPDATE, { ...state });
        
        // Also publish individual state components for direct updates
        EventSystem.publish(GameEvents.LIVES_CHANGE, state.lives);
        EventSystem.publish(GameEvents.SCORE_CHANGE, state.score);
        EventSystem.publish(GameEvents.CURRENCY_CHANGE, state.currency);
    }
    
    /**
     * Add currency to the player
     * @param {number} amount - Amount to add
     */
    function addCurrency(amount) {
        state.currency += amount;
        console.log("Currency added: " + amount + ", New balance: " + state.currency);
        
        // Publish both events for redundancy
        EventSystem.publish(GameEvents.CURRENCY_CHANGE, state.currency);
        EventSystem.publish(GameEvents.PLAYER_UPDATE, { ...state });
    }
    
    /**
     * Spend currency
     * @param {number} amount - Amount to spend
     * @returns {boolean} Whether the transaction was successful
     */
    function spendCurrency(amount) {
        if (state.currency >= amount) {
            state.currency -= amount;
            console.log("Currency spent: " + amount + ", New balance: " + state.currency);
            
            // Publish both events for redundancy
            EventSystem.publish(GameEvents.CURRENCY_CHANGE, state.currency);
            EventSystem.publish(GameEvents.PLAYER_UPDATE, { ...state });
            return true;
        }
        
        console.log("Not enough currency to spend: " + amount + ", Current balance: " + state.currency);
        return false;
    }
    
    /**
     * Add score to the player
     * @param {number} points - Points to add
     */
    /**
 * Update to PlayerModule to properly handle negative scores
 * This should replace the existing addScore function in player.js
 */

/**
 * Add score to the player (can be negative for penalties)
 * Score will never go below 0
 * @param {number} points - Points to add (negative for penalties)
 */
function addScore(points) {
    const prevScore = state.score;
    
    if (points < 0) {
        // For negative points, ensure we don't go below 0
        state.score = Math.max(0, state.score + points);
        console.log(`Score penalty: ${points}, Previous: ${prevScore}, New: ${state.score}`);
    } else {
        state.score += points;
        console.log(`Score added: ${points}, New score: ${state.score}`);
    }
    
    // Publish both events for redundancy
    EventSystem.publish(GameEvents.SCORE_CHANGE, state.score);
    EventSystem.publish(GameEvents.PLAYER_UPDATE, { ...state });
    
    // Add visual indicator for significant point changes
    if (Math.abs(points) >= 20) {
        const message = points > 0 ?
            `+${points} points!` :
            `${points} points`;
        
        const color = points > 0 ? '#4caf50' : '#f44336';
        
        showFloatingScoreText(message, color);
    }
}

/**
 * Show floating score text for visual feedback
 * @param {string} message - Message to display
 * @param {string} color - CSS color for the text
 */
function showFloatingScoreText(message, color) {
    // Create element for score animation
    const scoreText = document.createElement('div');
    scoreText.textContent = message;
    scoreText.style.position = 'fixed';
    scoreText.style.top = '50%';
    scoreText.style.left = '50%';
    scoreText.style.transform = 'translate(-50%, -50%)';
    scoreText.style.color = color;
    scoreText.style.fontWeight = 'bold';
    scoreText.style.fontSize = '24px';
    scoreText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    scoreText.style.zIndex = '9999';
    scoreText.style.pointerEvents = 'none';
    scoreText.style.animation = 'score-float 1.5s forwards';
    
    // Add animation style if not already present
    if (!document.getElementById('score-animation-style')) {
        const style = document.createElement('style');
        style.id = 'score-animation-style';
        style.textContent = `
            @keyframes score-float {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                10% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                20% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -80px) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -100px) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(scoreText);
    
    // Remove after animation
    setTimeout(() => {
        if (scoreText.parentNode) {
            scoreText.parentNode.removeChild(scoreText);
        }
    }, 1500);
}

// Make showFloatingScoreText available to the window for debugging
// and for other modules to use
window.showFloatingScoreText = showFloatingScoreText;
    /**
     * Lose a life
     * @returns {boolean} Whether the player still has lives
     */
    function loseLife() {
        state.lives--;
        console.log("Life lost, Remaining lives: " + state.lives);
        
        // Publish both events for redundancy
        EventSystem.publish(GameEvents.LIVES_CHANGE, state.lives);
        EventSystem.publish(GameEvents.PLAYER_UPDATE, { ...state });
        
        // Check for game over
        if (state.lives <= 0) {
            console.log("Game over triggered");
            EventSystem.publish(GameEvents.GAME_OVER, {
                score: state.score
            });
            return false;
        }
        return true;
    }
    
    /**
     * Add a life to the player
     * @param {number} count - Number of lives to add
     */
    function addLife(count = 1) {
        state.lives += count;
        console.log("Lives added: " + count + ", New lives: " + state.lives);
        
        // Publish both events for redundancy
        EventSystem.publish(GameEvents.LIVES_CHANGE, state.lives);
        EventSystem.publish(GameEvents.PLAYER_UPDATE, { ...state });
    }
    
    /**
     * Set the selected tower
     * @param {string|number|null} towerType - Type of tower selected or null to deselect
     */
    function selectTower(towerType) {
        console.log("Selecting tower type:", towerType);
        state.selectedTower = towerType;
        EventSystem.publish(GameEvents.TOWER_SELECTED, towerType);
    }
    
    /**
     * Get the selected tower
     * @returns {string|number|null} The selected tower type
     */
    function getSelectedTower() {
        return state.selectedTower;
    }
    
    /**
     * Get the current state
     * @returns {Object} Current player state
     */
    function getState() {
        return { ...state };
    }
    
    /**
     * Reset the player state
     */
    function reset() {
        console.log("PlayerModule reset");
        init();
    }
    
    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Listen for game initialization
        EventSystem.subscribe(GameEvents.GAME_INIT, function() {
            reset();
        });
        
        // Listen for new game
        EventSystem.subscribe(GameEvents.GAME_START, function() {
            reset();
        });
        
        // Listen for enemy defeated to add currency and score
        EventSystem.subscribe(GameEvents.ENEMY_DEFEATED, function(data) {
            // Use the points and currency from the event data if available
            const pointsToAdd = data.points || data.enemy.points || 5;
            const currencyToAdd = data.currency || data.enemy.reward || 10;
            
            addCurrency(currencyToAdd);
            addScore(pointsToAdd);
            
            // Log the bonuses if they're different from the base values
            if (data.enemy && 
                (pointsToAdd > data.enemy.points || currencyToAdd > data.enemy.reward)) {
                console.log(`Bonus applied! Points: ${pointsToAdd}, Currency: ${currencyToAdd}`);
            }
        });
        
        // Listen for tower attack event to handle bonus rewards
        EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
            // If the enemy was killed and there are bonus rewards, add them
            if (data.killed && (data.points || data.currency)) {
                // The ENEMY_DEFEATED event will handle the actual reward addition
                // We don't need to duplicate it here
                
                // We could add visual feedback for bonuses here if desired
                if (data.tower && (data.points > 0 || data.currency > 0)) {
                    // Find the tower element for visual feedback
                    const towerElement = document.querySelector(
                        `.sudoku-cell[data-row="${data.tower.row}"][data-col="${data.tower.col}"]`);
                    
                    if (towerElement) {
                        // Add a brief animation or effect to show the bonus
                        towerElement.classList.add('bonus-reward');
                        setTimeout(() => {
                            towerElement.classList.remove('bonus-reward');
                        }, 300);
                    }
                }
            }
        });
        
        // Listen for enemy reaching the end to lose a life
        EventSystem.subscribe(GameEvents.ENEMY_REACHED_END, function() {
            loseLife();
        });
        
        // Listen for wave completion to reward the player
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function(data) {
            const waveBonus = data.waveNumber * 20;
            addCurrency(waveBonus);
            addScore(waveBonus * 2);
            EventSystem.publish(GameEvents.STATUS_MESSAGE, `Wave completed! Bonus: ${waveBonus} currency`);
        });
        
        // Listen for sudoku completion to reward the player
        EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
            const sudokuBonus = 100;
            addCurrency(sudokuBonus);
            addScore(sudokuBonus * 3);
            EventSystem.publish(GameEvents.STATUS_MESSAGE, `Sudoku solved! Bonus: ${sudokuBonus} currency`);
        });
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Public API
    return {
        init,
        addCurrency,
        spendCurrency,
        addScore,
        loseLife,
        addLife,
        selectTower,
        getSelectedTower,
        getState,
        reset
    };
})();

// Make module available globally
window.PlayerModule = PlayerModule;

// Add bonus reward animation styles
(function() {
    // Add CSS for bonus reward animations if not already present
    if (!document.getElementById('bonus-reward-styles')) {
        const style = document.createElement('style');
        style.id = 'bonus-reward-styles';
        style.textContent = `
            @keyframes bonus-reward-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); filter: brightness(1.5); }
                100% { transform: scale(1); }
            }
            
            .bonus-reward {
                animation: bonus-reward-pulse 0.3s ease-in-out;
                z-index: 25;
            }
        `;
        document.head.appendChild(style);
    }
})();