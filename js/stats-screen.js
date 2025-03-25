/**
 * Game Statistics Screen - Shows player statistics and achievements
 * Add this to your game and incorporate with a "Stats" button in your UI
 */

const StatsScreen = (function() {
    // Create a modal for displaying stats
    function createStatsModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('stats-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'stats-modal';
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalTitle = document.createElement('h2');
            modalTitle.textContent = 'Game Statistics';
            modalContent.appendChild(modalTitle);
            
            const statsContainer = document.createElement('div');
            statsContainer.id = 'stats-container';
            modalContent.appendChild(statsContainer);
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.onclick = function() {
                modal.classList.remove('active');
            };
            modalContent.appendChild(closeButton);
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        }
        
        return modal;
    }
    
    // Show the stats screen
    function showStats() {
        const modal = createStatsModal();
        const statsContainer = document.getElementById('stats-container');
        
        // Get game stats
        const stats = getGameStats();
        
        // Create stats table
        let statsHtml = '<table class="game-stats-table">';
        statsHtml += '<tr><th colspan="2">Game Progress</th></tr>';
        statsHtml += `<tr><td>Current Level</td><td class="stat-value">${stats.currentLevel}</td></tr>`;
        statsHtml += `<tr><td>Current Wave</td><td class="stat-value">${stats.currentWave}</td></tr>`;
        statsHtml += `<tr><td>Current Score</td><td class="stat-value">${stats.currentScore}</td></tr>`;
        statsHtml += `<tr><td>High Score</td><td class="stat-value stat-highlight">${stats.highScore}</td></tr>`;
        
        // Add currency and lives if available
        if (stats.currency !== undefined) {
            statsHtml += `<tr><td>Currency</td><td class="stat-value">${stats.currency}</td></tr>`;
        }
        
        if (stats.lives !== undefined) {
            statsHtml += `<tr><td>Lives</td><td class="stat-value">${stats.lives}</td></tr>`;
        }
        
        statsHtml += '<tr><th colspan="2">Game Information</th></tr>';
        statsHtml += `<tr><td>Difficulty</td><td class="stat-value">${stats.difficulty}</td></tr>`;
        statsHtml += `<tr><td>Towers Placed</td><td class="stat-value">${stats.towersPlaced}</td></tr>`;
        statsHtml += `<tr><td>Enemies Defeated</td><td class="stat-value">${stats.enemiesDefeated}</td></tr>`;
        statsHtml += '</table>';
        
        // Additional stats or achievements could be added here
        
        statsContainer.innerHTML = statsHtml;
        
        // Show the modal
        modal.classList.add('active');
    }
    
    // Get current game statistics
    function getGameStats() {
        const stats = {
            currentLevel: 1,
            currentWave: 1,
            currentScore: 0,
            highScore: 0,
            difficulty: 'medium',
            towersPlaced: 0,
            enemiesDefeated: 0
        };
        
        // Get data from SaveSystem
        if (window.SaveSystem) {
            const savedState = SaveSystem.getLastSavedState();
            stats.highScore = savedState.highScore || 0;
            stats.currentScore = savedState.currentScore || 0;
            stats.lastLevel = savedState.lastLevel || 1;
            stats.lastWave = savedState.lastWave || 1;
            stats.difficulty = savedState.difficulty || 'medium';
        }
        
        // Get current data from modules if available
        if (window.LevelsModule) {
            stats.currentLevel = LevelsModule.getCurrentLevel();
            stats.currentWave = LevelsModule.getCurrentWave();
            stats.difficulty = LevelsModule.getDifficulty();
        }
        
        if (window.PlayerModule) {
            const playerState = PlayerModule.getState();
            stats.currentScore = playerState.score;
            stats.currency = playerState.currency;
            stats.lives = playerState.lives;
        }
        
        // Count towers and enemies
        if (window.TowersModule) {
            stats.towersPlaced = TowersModule.getTowers().length;
        }
        
        // For enemies defeated, we need to track this separately
        // This is just a placeholder - you would need to implement tracking
        stats.enemiesDefeated = window.gameStats?.enemiesDefeated || 0;
        
        return stats;
    }
    
    // Track game statistics
    function setupStatTracking() {
        // Initialize global tracking object if it doesn't exist
        if (!window.gameStats) {
            window.gameStats = {
                enemiesDefeated: 0,
                wavesCompleted: 0,
                levelsCompleted: 0
            };
        }
        
        // Track enemy defeats
        EventSystem.subscribe(GameEvents.ENEMY_DEFEATED, function() {
            window.gameStats.enemiesDefeated++;
        });
        
        // Track wave completions
        EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
            window.gameStats.wavesCompleted++;
        });
        
        // Track level completions
        EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
            window.gameStats.levelsCompleted++;
        });
    }
    
    // Initialize
    function init() {
        setupStatTracking();
        
        // Add stats button to the game controls
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            const statsButton = document.createElement('button');
            statsButton.id = 'stats-button';
            statsButton.textContent = 'Stats';
            statsButton.onclick = showStats;
            
            // Insert before the last button (new game)
            const newGameButton = document.getElementById('new-game');
            if (newGameButton) {
                gameControls.insertBefore(statsButton, newGameButton);
            } else {
                gameControls.appendChild(statsButton);
            }
        }
    }
    
    // Initialize on DOM content loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for other modules to initialize
        setTimeout(init, 1000);
    });
    
    // Public API
    return {
        showStats,
        getGameStats
    };
})();

// Make accessible globally
window.StatsScreen = StatsScreen;