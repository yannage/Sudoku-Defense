/**
 * SaveSystem Module - Handles saving and loading game data using cookies
 * This module provides functionality to store player scores and other game data persistently
 */

const SaveSystem = (function() {
    // Cookie names
    const COOKIES = {
        HIGH_SCORE: 'sudoku_td_high_score',
        CURRENT_SCORE: 'sudoku_td_current_score',
        LAST_LEVEL: 'sudoku_td_last_level',
        LAST_WAVE: 'sudoku_td_last_wave',
        DIFFICULTY: 'sudoku_td_difficulty'
    };
    
    // Default cookie expiration in days
    const COOKIE_EXPIRATION_DAYS = 3650;
    
    /**
     * Set a cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiration days
     */
    function setCookie(name, value, days = COOKIE_EXPIRATION_DAYS) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
        console.log(`Cookie set: ${name}=${value}`);
    }
    
    /**
     * Get a cookie value
     * @param {string} name - Cookie name
     * @returns {string} Cookie value or empty string if not found
     */
    function getCookie(name) {
        const cookieName = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return "";
    }
    
    /**
     * Save current score
     * Updates both current score and high score if needed
     */
    function saveScore() {
        if (!PlayerModule) {
            console.error("PlayerModule not available for saving score");
            return;
        }
        
        const currentScore = PlayerModule.getState().score;
        const highScore = getHighScore();
        
        // Save current score
        setCookie(COOKIES.CURRENT_SCORE, currentScore);
        
        // Update high score if current score is higher
        if (currentScore > highScore) {
            setCookie(COOKIES.HIGH_SCORE, currentScore);
            console.log(`New high score saved: ${currentScore}`);
        }
        
        // Save level and wave info
        if (LevelsModule) {
            setCookie(COOKIES.LAST_LEVEL, LevelsModule.getCurrentLevel());
            setCookie(COOKIES.LAST_WAVE, LevelsModule.getCurrentWave());
            setCookie(COOKIES.DIFFICULTY, LevelsModule.getDifficulty());
        }
    }
    
    /**
     * Get high score
     * @returns {number} High score
     */
    function getHighScore() {
        const highScore = getCookie(COOKIES.HIGH_SCORE);
        return highScore ? parseInt(highScore) : 0;
    }
    
    /**
     * Get last saved state
     * @returns {Object} Last saved state
     */
    function getLastSavedState() {
        return {
            highScore: getHighScore(),
            currentScore: parseInt(getCookie(COOKIES.CURRENT_SCORE)) || 0,
            lastLevel: parseInt(getCookie(COOKIES.LAST_LEVEL)) || 1,
            lastWave: parseInt(getCookie(COOKIES.LAST_WAVE)) || 1,
            difficulty: getCookie(COOKIES.DIFFICULTY) || 'medium'
        };
    }
    
    /**
     * Clear all saved data
     */
    function clearSavedData() {
        setCookie(COOKIES.HIGH_SCORE, '', 0);
        setCookie(COOKIES.CURRENT_SCORE, '', 0);
        setCookie(COOKIES.LAST_LEVEL, '', 0);
        setCookie(COOKIES.LAST_WAVE, '', 0);
        setCookie(COOKIES.DIFFICULTY, '', 0);
        console.log("All saved game data cleared");
    }
    
    /**
     * Initialize event listeners for automatic saving
     */
    function initEventListeners() {
        // Save on score change
        EventSystem.subscribe(GameEvents.SCORE_CHANGE, function(newScore) {
            setCookie(COOKIES.CURRENT_SCORE, newScore);
            
            // Update high score if needed
            const highScore = getHighScore();
            if (newScore > highScore) {
                setCookie(COOKIES.HIGH_SCORE, newScore);
            }
        });
        
        // Save on wave completion
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
            saveScore();
        });
        
        // Save on game over
        EventSystem.subscribe(GameEvents.GAME_OVER, function() {
            saveScore();
        });
        
        // Also save periodically (every 30 seconds)
        setInterval(saveScore, 30000);
    }
    
    // Initialize immediately
    initEventListeners();
    
    // Public API
    return {
        saveScore,
        getHighScore,
        getLastSavedState,
        clearSavedData
    };
})();

// Make the module globally available
window.SaveSystem = SaveSystem;