/**
 * Steam Deck Layout Optimization for Sudoku Tower Defense
 * This script restructures the game's DOM to implement the new layout
 * targeting the Steam Deck's 1280×800 resolution
 */

(function() {
    // Check if we should apply Steam Deck layout
    // Either explicitly requested or auto-detected by resolution
function shouldApplySteamDeckLayout() {
    // Force layout on for Steam Deck
    if (navigator.userAgent.toLowerCase().includes('steam') || 
        navigator.userAgent.toLowerCase().includes('valve')) {
        return true;
    }
    
    // Improved resolution detection (Steam Deck is 1280×800 or 800×1280)
    const { width, height } = window.screen;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    
    // Steam Deck resolution check
    if ((minDim >= 790 && minDim <= 810) && (maxDim >= 1270 && maxDim <= 1290)) {
        return true;
    }
    
    // URL parameter check (for testing)
    if (window.location.search.includes('steamdeck=1')) {
        return true;
    }
    
    return false;
}
    
    // Main function to apply Steam Deck optimized layout
    function applySteamDeckLayout() {
        console.log("Applying Steam Deck optimized layout");
        
        // Add the main CSS class to the body
        document.body.classList.add('steam-deck-mode');
        
        // Create the main grid container
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error("Game container not found");
            return;
        }
        
        // Apply new layout structure
        restructureDOM(gameContainer);
        
        // Add the floating controls
        addFloatingControls();
        
        // Apply any runtime adjustments needed
        applyRuntimeAdjustments();
        
        // Listen for orientation changes
        handleOrientationChanges();
        
        console.log("Steam Deck layout applied successfully");
    }
    
    // Restructure the DOM to match our new grid layout
    function restructureDOM(gameContainer) {
        // Store original content
        const originalContent = gameContainer.innerHTML;
        
        // Clear container
        gameContainer.innerHTML = '';
        
        // Extract key elements from original content
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = originalContent;
        
        // Get existing elements to preserve
        const phaseIndicator = tempContainer.querySelector('#phase-indicator') || 
                          createElementWithText('div', 'Current Phase: Sudoku', { id: 'phase-indicator' });
        const gameHeader = tempContainer.querySelector('#game-header') || 
                      createGameHeader();
        const sudokuBoard = tempContainer.querySelector('#sudoku-board');
        const towerSelection = tempContainer.querySelector('#tower-selection');
        const gameInfo = tempContainer.querySelector('#game-info');
        const gameControls = tempContainer.querySelector('#game-controls');
        const missionControl = tempContainer.querySelector('#mission-control') || 
                          createMissionControl();
        
        // Create new layout
        gameContainer.appendChild(phaseIndicator);
        gameContainer.appendChild(gameHeader);
        
        // Create the three-column grid
        const layoutGrid = document.createElement('div');
        layoutGrid.className = 'steam-deck-layout';
        
        // Left column - tower selection and controls
        const leftColumn = document.createElement('div');
        leftColumn.className = 'left-column';
        if (towerSelection) leftColumn.appendChild(towerSelection);
        if (gameInfo) leftColumn.appendChild(gameInfo);
        if (gameControls) leftColumn.appendChild(gameControls);
        
        // Middle column - Sudoku board
        const middleColumn = document.createElement('div');
        middleColumn.className = 'middle-column';
        if (sudokuBoard) middleColumn.appendChild(sudokuBoard);
        
        // Right column - mission control
        const rightColumn = document.createElement('div');
        rightColumn.className = 'right-column';
        rightColumn.appendChild(missionControl);
        
        // Add all columns to the layout grid
        layoutGrid.appendChild(leftColumn);
        layoutGrid.appendChild(middleColumn);
        layoutGrid.appendChild(rightColumn);
        
        // Add the grid to the container
        gameContainer.appendChild(layoutGrid);
    }
    
    // Create floating controls for quick access
    function addFloatingControls() {
        const floatingControls = document.createElement('div');
        floatingControls.className = 'floating-controls';
        
        // Zoom in button
        const zoomInButton = document.createElement('div');
        zoomInButton.className = 'float-button zoom-in';
        zoomInButton.textContent = '+';
        zoomInButton.title = 'Zoom In';
        zoomInButton.addEventListener('click', () => {
            const sudokuBoard = document.getElementById('sudoku-board');
            if (sudokuBoard) {
                const currentScale = parseFloat(sudokuBoard.style.transform?.replace('scale(', '') || 1);
                sudokuBoard.style.transform = `scale(${currentScale + 0.1})`;
            }
        });
        
        // Zoom out button
        const zoomOutButton = document.createElement('div');
        zoomOutButton.className = 'float-button zoom-out';
        zoomOutButton.textContent = '-';
        zoomOutButton.title = 'Zoom Out';
        zoomOutButton.addEventListener('click', () => {
            const sudokuBoard = document.getElementById('sudoku-board');
            if (sudokuBoard) {
                const currentScale = parseFloat(sudokuBoard.style.transform?.replace('scale(', '') || 1);
                if (currentScale > 0.5) {
                    sudokuBoard.style.transform = `scale(${currentScale - 0.1})`;
                }
            }
        });
        
        // Toggle mission control button
        const toggleMissionButton = document.createElement('div');
        toggleMissionButton.className = 'float-button toggle-mission';
        toggleMissionButton.innerHTML = 'ⓘ';
        toggleMissionButton.title = 'Toggle Mission Control';
        toggleMissionButton.addEventListener('click', () => {
            const rightColumn = document.querySelector('.right-column');
            if (rightColumn) {
                rightColumn.classList.toggle('hidden');
                
                // Adjust middle column width when right column is hidden
                const middleColumn = document.querySelector('.middle-column');
                if (middleColumn) {
                    if (rightColumn.classList.contains('hidden')) {
                        middleColumn.style.gridColumn = '2 / 4';
                    } else {
                        middleColumn.style.gridColumn = '';
                    }
                }
            }
        });
        
        // Add buttons to the floating controls
        floatingControls.appendChild(zoomOutButton);
        floatingControls.appendChild(zoomInButton);
        floatingControls.appendChild(toggleMissionButton);
        
        // Add to the document
        document.body.appendChild(floatingControls);
    }
    
    // Apply any runtime adjustments needed
    function applyRuntimeAdjustments() {
        // Make the mission control panel more touch-friendly
        const missionTips = document.querySelectorAll('#mission-tips li');
        missionTips.forEach(tip => {
            tip.style.paddingTop = '8px';
            tip.style.paddingBottom = '8px';
        });
        
        // Adjust event listeners for tower selection to be more touch-friendly
        const towerOptions = document.querySelectorAll('.tower-option');
        towerOptions.forEach(option => {
            // Clone to remove existing event listeners
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            // Add touch-optimized event listener
            newOption.addEventListener('click', function(e) {
                e.preventDefault();
                const towerType = this.dataset.towerType;
                
                // Highlight selected tower
                document.querySelectorAll('.tower-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                // Select tower in game logic
                if (window.PlayerModule && typeof PlayerModule.selectTower === 'function') {
                    PlayerModule.selectTower(towerType);
                }
                
                // Provide haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });
        });
    }
    
    // Handle orientation changes
    function handleOrientationChanges() {
        const mediaQuery = window.matchMedia("(orientation: portrait)");
        
        // Handler function
        const handleOrientationChange = (e) => {
            document.body.classList.toggle('portrait', e.matches);
            document.body.classList.toggle('landscape', !e.matches);
            
            // Adjust layout based on orientation
            adjustLayoutForOrientation(e.matches);
        };
        
        // Set initial orientation
        handleOrientationChange(mediaQuery);
        
        // Listen for changes
        mediaQuery.addEventListener('change', handleOrientationChange);
    }
    
    // Adjust layout based on orientation
    function adjustLayoutForOrientation(isPortrait) {
        if (isPortrait) {
            console.log("Adjusting for portrait orientation");
            // Move mission control to top when in portrait mode
            const rightColumn = document.querySelector('.right-column');
            const missionControl = document.getElementById('mission-control');
            if (rightColumn && missionControl) {
                missionControl.style.maxHeight = '200px';
            }
            
            // Make tower selection more compact
            const towerSelection = document.getElementById('tower-selection');
            if (towerSelection) {
                towerSelection.style.display = 'grid';
                towerSelection.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        } else {
            console.log("Adjusting for landscape orientation");
            // Reset mission control
            const missionControl = document.getElementById('mission-control');
            if (missionControl) {
                missionControl.style.maxHeight = '';
            }
            
            // Reset tower selection
            const towerSelection = document.getElementById('tower-selection');
            if (towerSelection) {
                towerSelection.style.display = 'grid';
                towerSelection.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        }
    }
    
    // Helper functions
    function createElementWithText(tagName, text, attributes = {}) {
        const element = document.createElement(tagName);
        element.textContent = text;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }
    
    function createGameHeader() {
        const header = document.createElement('div');
        header.id = 'game-header';
        
        const score = createElementWithText('div', 'Score: ', { id: 'score' });
        score.appendChild(createElementWithText('span', '0', { id: 'score-value' }));
        
        const lives = createElementWithText('div', 'Lives: ', { id: 'lives' });
        lives.appendChild(createElementWithText('span', '3', { id: 'lives-value' }));
        
        const wave = createElementWithText('div', 'Wave: ', { id: 'wave' });
        wave.appendChild(createElementWithText('span', '1', { id: 'wave-value' }));
        
        header.appendChild(score);
        header.appendChild(lives);
        header.appendChild(wave);
        
        return header;
    }

    function fixStartWaveButton() {
    const startWaveBtn = document.getElementById('start-wave');
    if (startWaveBtn) {
        // Remove existing event listeners by cloning
        const newStartBtn = startWaveBtn.cloneNode(true);
        startWaveBtn.parentNode.replaceChild(newStartBtn, startWaveBtn);
        
        // Add new direct event listener
        newStartBtn.addEventListener('click', function() {
            console.log("Start Wave button clicked");
            if (window.LevelsModule && typeof LevelsModule.startWave === 'function') {
                LevelsModule.startWave();
            } else if (window.Game && typeof Game.startWave === 'function') {
                Game.startWave();
            } else {
                console.error("Cannot find startWave function");
                // Fallback: publish event directly
                if (window.EventSystem && window.GameEvents) {
                    EventSystem.publish(GameEvents.WAVE_START);
                }
            }
        });
    }
}
    
    function createMissionControl() {
        const missionControl = document.createElement('div');
        missionControl.id = 'mission-control';
        
        const title = createElementWithText('h3', 'Mission Control');
        const tipsList = document.createElement('ul');
        tipsList.id = 'mission-tips';
        
        // Add some default tips
        tipsList.appendChild(createElementWithText('li', 'Place towers that match the Sudoku rules.'));
        tipsList.appendChild(createElementWithText('li', 'Complete rows, columns, and 3x3 grids for bonuses.'));
        tipsList.appendChild(createElementWithText('li', 'Upgrade towers for more damage and range.'));
        
        missionControl.appendChild(title);
        missionControl.appendChild(tipsList);
        
        return missionControl;
    }
    
    // Add Steam Deck CSS to page
    function addSteamDeckCSS() {
        const steamDeckCSS = `
            /* Minimal critical CSS for Steam Deck layout */
            body.steam-deck-mode {
                margin: 0;
                padding: 0;
                overflow: hidden;
                width: 100vw;
                height: 100vh;
            }
            
            body.steam-deck-mode #game-container {
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: auto auto 1fr;
                max-width: unset;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
                background-color: transparent;
            }
            
            body.steam-deck-mode .steam-deck-layout {
                display: grid;
                grid-template-columns: minmax(100px, 20%) minmax(350px, 60%) minmax(150px, 20%);
                grid-template-rows: 1fr;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            
            body.steam-deck-mode .left-column,
            body.steam-deck-mode .middle-column,
            body.steam-deck-mode .right-column {
                overflow-y: auto;
                padding: 10px;
            }
            
            body.steam-deck-mode #sudoku-board {
                width: 100%;
                max-width: 100%;
                max-height: 100%;
                aspect-ratio: 1;
                margin: 0 auto;
            }
            
            body.steam-deck-mode #tower-selection {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 15px;
                width: 100%;
            }
            
            body.steam-deck-mode .tower-option {
                width: 100%;
                height: 44px;
                min-height: 44px;
                font-size: 1.5rem;
            }
            
            body.steam-deck-mode #game-controls {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 10px;
                margin-top: 10px;
            }
            
            body.steam-deck-mode #game-controls button,
            body.steam-deck-mode #game-controls select {
                width: 100%;
                min-height: 44px;
                font-size: 1rem;
                padding: 8px 12px;
            }
            
            body.steam-deck-mode .floating-controls {
                position: fixed;
                bottom: 15px;
                right: 15px;
                display: flex;
                gap: 8px;
                z-index: 1000;
            }
            
            body.steam-deck-mode .float-button {
                width: 44px;
                height: 44px;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            }
            
            body.steam-deck-mode.portrait .steam-deck-layout {
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr auto;
            }
            
            body.steam-deck-mode .hidden {
                display: none !important;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = steamDeckCSS;
        document.head.appendChild(style);
    }
    
    // Wait for DOM to be ready
    function initialize() {
        if (shouldApplySteamDeckLayout()) {
            // Add initial CSS
            addSteamDeckCSS();
            
            // If page is already loaded, apply the layout immediately
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(applySteamDeckLayout, 100);
            } else {
                // Otherwise wait for DOM content to be loaded
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(applySteamDeckLayout, 100);
                });
            }
        }
    }
    
    // Launch the initialization
    initialize();
})();