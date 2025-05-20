/**
 * steam-deck.js - Handles Steam Deck layout optimization and controls
 * This module manages Steam Deck-specific UI layouts and interactions
 */

const SteamDeckModule = (function() {
    // Configuration
    const STEAM_DECK_WIDTH = 1280;
    const STEAM_DECK_HEIGHT = 800;
    
    // State variables
    let currentZoom = 1.0;
    const zoomIncrement = 0.05;
    const maxZoom = 1.2;
    const minZoom = 0.8;
    let lastTap = 0;
    let missionControlVisible = true;
    
    /**
     * Initialize the Steam Deck optimizations
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
        console.log("Initializing Steam Deck module...");
        
        // Check if user selected Steam Deck mode or if auto-detection matches
        const savedDisplayMode = localStorage.getItem('display-mode');
        const isSteamDeck = detectSteamDeck();
        
        console.log("Saved display mode:", savedDisplayMode);
        console.log("Auto-detected Steam Deck:", isSteamDeck);
        
        if (savedDisplayMode === 'steam-deck' || (savedDisplayMode !== 'normal' && isSteamDeck)) {
            console.log("Applying Steam Deck mode...");
            applySteamDeckMode();
            
            // Setup additional optimizations
            setupZoomControls();
            optimizeUIElements();
            
            // Add resize listener
            window.addEventListener('resize', handleResize);
            
            // Initial layout adjustment
            setTimeout(handleResize, 200);
        }
        
        // Setup display options in settings menu
        setupDisplayOptions();
        
        // Watch for phase changes to readjust the layout
        watchForPhaseChanges();
        
        console.log("Steam Deck module initialized");
    }
    
    /**
     * Check if device is likely a Steam Deck
     * @returns {boolean} Whether device is likely a Steam Deck
     */
    function detectSteamDeck() {
        // Screen resolution check
        const isSteamDeckResolution = 
            (window.innerWidth <= STEAM_DECK_WIDTH && window.innerHeight <= STEAM_DECK_HEIGHT) ||
            (window.innerWidth <= STEAM_DECK_HEIGHT && window.innerHeight <= STEAM_DECK_WIDTH);
            
        // User agent check
        const ua = navigator.userAgent.toLowerCase();
        const containsSteamTerms = ua.includes('steam') || ua.includes('valve');
        
        // Gamepad check
        const hasGamepads = navigator.getGamepads && 
                           navigator.getGamepads().some(gp => gp && gp.id && gp.id.toLowerCase().includes('valve'));
        
        return isSteamDeckResolution || containsSteamTerms || hasGamepads;
    }
    
    /**
     * Apply Steam Deck optimizations
     */
    function applySteamDeckMode() {
        console.log("Applying Steam Deck mode...");
        
        // Add CSS class to body
        document.body.classList.add('steam-deck');
        
        // Show Steam Deck controls
        const controls = document.querySelector('.steam-deck-controls');
        if (controls) {
            controls.style.display = 'flex';
        }
        
        // Check if we're in the Steam browser
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('steam') || ua.includes('valve')) {
            document.body.classList.add('steam-deck-browser');
        }
        
        // Rearrange the layout for Steam Deck
        rearrangeLayout();
        
        // Check if we're in horizontal orientation
        applyOrientationOptimizations();
        
        // Setup touch input optimizations
        setupTouchOptimizations();
        
        console.log("Steam Deck optimizations applied");
    }
    
    /**
     * Rearrange the layout for Steam Deck
     */
    function rearrangeLayout() {
        console.log("Rearranging layout for Steam Deck...");
        
        // Get the main elements
        const gameContainer = document.getElementById('game-container');
        const sudokuBoard = document.getElementById('sudoku-board');
        const missionControl = document.getElementById('mission-control');
        const towerSelection = document.getElementById('tower-selection');
        const gameInfo = document.getElementById('game-info');
        const gameControls = document.getElementById('game-controls');
        
        if (!gameContainer || !sudokuBoard) {
            console.error("Cannot find game container or sudoku board");
            return;
        }
        
        console.log("Found game elements:", { gameContainer, sudokuBoard });
        
        // Create left panel
        let leftPanel = document.getElementById('left-panel');
        if (!leftPanel) {
            leftPanel = document.createElement('div');
            leftPanel.id = 'left-panel';
            leftPanel.className = 'steam-deck-left-panel';
            gameContainer.appendChild(leftPanel);
            console.log("Created left panel");
        }
        
        // Create right panel
        let rightPanel = document.getElementById('right-panel');
        if (!rightPanel) {
            rightPanel = document.createElement('div');
            rightPanel.id = 'right-panel';
            rightPanel.className = 'steam-deck-right-panel';
            gameContainer.appendChild(rightPanel);
            console.log("Created right panel");
        }
        
        // Create center panel
        let centerPanel = document.getElementById('center-panel');
        if (!centerPanel) {
            centerPanel = document.createElement('div');
            centerPanel.id = 'center-panel';
            centerPanel.className = 'steam-deck-center-panel';
            gameContainer.appendChild(centerPanel);
            console.log("Created center panel");
        }
        
        // Move elements to panels
        if (sudokuBoard.parentNode !== centerPanel) {
            centerPanel.appendChild(sudokuBoard);
            console.log("Moved sudoku board to center panel");
        }
        
        if (missionControl && missionControl.parentNode !== rightPanel) {
            rightPanel.appendChild(missionControl);
            console.log("Moved mission control to right panel");
        }
        
        if (towerSelection && towerSelection.parentNode !== leftPanel) {
            towerSelection.classList.add('vertical-tower-selection');
            leftPanel.appendChild(towerSelection);
            console.log("Moved tower selection to left panel");
        }
        
        if (gameControls && gameControls.parentNode !== leftPanel) {
            gameControls.classList.add('vertical-game-controls');
            leftPanel.appendChild(gameControls);
            console.log("Moved game controls to left panel");
        }
        
        if (gameInfo && gameInfo.parentNode !== leftPanel) {
            leftPanel.appendChild(gameInfo);
            console.log("Moved game info to left panel");
        }
        
        // Set grid layout
        gameContainer.style.display = 'grid';
        gameContainer.style.gridTemplateColumns = 'minmax(150px, 20%) minmax(auto, 60%) minmax(180px, 20%)';
        gameContainer.style.gridTemplateRows = 'auto 1fr';
        gameContainer.style.gridTemplateAreas = 
            '"header header header" ' +
            '"left-panel center-panel right-panel"';
        
        // Set the sudoku board to be square
        sudokuBoard.style.aspectRatio = '1';
        sudokuBoard.style.width = '100%';
        sudokuBoard.style.height = 'auto';
        
        // Setup mission control toggle
        setupMissionControlToggle();
        
        // Fix sizing for all cells
        fixSudokuBoardLayout();
        
        console.log("Layout rearrangement complete");
    }
    
    /**
     * Setup toggle for mission control
     */
    function setupMissionControlToggle() {
        console.log("Setting up mission control toggle...");
        const toggleMission = document.getElementById('toggle-mission');
        if (toggleMission) {
            toggleMission.addEventListener('click', function() {
                const missionControl = document.getElementById('mission-control');
                const rightPanel = document.getElementById('right-panel');
                
                if (missionControl) {
                    if (missionControlVisible) {
                        missionControl.style.display = 'none';
                        rightPanel.style.display = 'none';
                        missionControlVisible = false;
                        console.log("Mission control hidden");
                    } else {
                        missionControl.style.display = 'block';
                        rightPanel.style.display = 'block';
                        missionControlVisible = true;
                        console.log("Mission control shown");
                    }
                }
            });
            console.log("Mission control toggle setup complete");
        } else {
            console.warn("Mission control toggle button not found");
        }
    }
    
    /**
     * Fix Sudoku board layout for Steam Deck
     */
    function fixSudokuBoardLayout() {
        console.log("Fixing Sudoku board layout...");
        const sudokuBoard = document.getElementById('sudoku-board');
        if (!sudokuBoard) {
            console.error("Sudoku board not found");
            return;
        }
        
        // Make sure the board is square
        const boardSize = Math.min(
            sudokuBoard.offsetWidth,
            window.innerHeight * 0.7
        );
        
        sudokuBoard.style.width = `${boardSize}px`;
        sudokuBoard.style.height = `${boardSize}px`;
        console.log("Set board size to:", boardSize);
        
        // Calculate cell height
        const cellHeight = Math.floor(boardSize / 9);
        
        // Adjust cells to fit properly
        const cells = sudokuBoard.querySelectorAll('.sudoku-cell');
        console.log(`Found ${cells.length} cells`);
        cells.forEach(cell => {
            cell.style.height = `${cellHeight}px`;
            cell.style.width = `${cellHeight}px`;
        });
        
        // Dynamically adjust font size based on cell dimensions
        const idealFontSize = Math.max(16, Math.min(cellHeight * 0.6, 24));
        cells.forEach(cell => {
            cell.style.fontSize = `${idealFontSize}px`;
        });
        console.log("Cell sizing complete. Font size:", idealFontSize);
    }
    
    /**
     * Apply optimizations based on orientation
     */
    function applyOrientationOptimizations() {
        console.log("Applying orientation optimizations...");
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
            console.log("Applied landscape mode");
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
            console.log("Applied portrait mode");
        }
        
        // Adjust layout based on orientation
        const gameContainer = document.getElementById('game-container');
        
        if (isLandscape) {
            if (gameContainer) {
                gameContainer.style.gridTemplateColumns = 'minmax(150px, 20%) minmax(auto, 60%) minmax(180px, 20%)';
                gameContainer.style.gridTemplateRows = 'auto 1fr';
                gameContainer.style.gridTemplateAreas = 
                    '"header header header" ' +
                    '"left-panel center-panel right-panel"';
                console.log("Applied landscape grid layout");
            }
        } else {
            // Portrait mode
            if (gameContainer) {
                gameContainer.style.gridTemplateColumns = '1fr';
                gameContainer.style.gridTemplateRows = 'auto auto 1fr auto';
                gameContainer.style.gridTemplateAreas = 
                    '"header" ' +
                    '"center-panel" ' +
                    '"right-panel" ' +
                    '"left-panel"';
                console.log("Applied portrait grid layout");
            }
        }
        
        // Fix sizing after orientation change
        setTimeout(fixSudokuBoardLayout, 100);
    }
    
    /**
     * Setup touch input optimizations
     */
    function setupTouchOptimizations() {
        console.log("Setting up touch optimizations...");
        document.body.classList.add('touch-input-active');
        
        // Prevent double tap to zoom
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            const DOUBLE_TAP_THRESHOLD = 300;
            if (lastTap && (now - lastTap) < DOUBLE_TAP_THRESHOLD) {
                e.preventDefault();
            }
            lastTap = now;
        }, false);
        
        // Prevent pinch zoom
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Fix for text selection on long press
        document.addEventListener('contextmenu', function(e) {
            if (document.body.classList.contains('steam-deck')) {
                e.preventDefault();
                return false;
            }
        });
        
        // Make tower options larger for touch
        const towerOptions = document.querySelectorAll('.tower-option');
        towerOptions.forEach(option => {
            option.classList.add('touch-friendly');
        });
        console.log("Touch optimizations complete");
    }
    
    /**
     * Setup zoom controls
     */
    function setupZoomControls() {
        console.log("Setting up zoom controls...");
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        
        if (zoomIn) {
            zoomIn.addEventListener('click', function() {
                if (currentZoom < maxZoom) {
                    currentZoom += zoomIncrement;
                    applyZoom();
                    console.log("Zoomed in to:", currentZoom);
                }
            });
        } else {
            console.warn("Zoom-in button not found");
        }
        
        if (zoomOut) {
            zoomOut.addEventListener('click', function() {
                if (currentZoom > minZoom) {
                    currentZoom -= zoomIncrement;
                    applyZoom();
                    console.log("Zoomed out to:", currentZoom);
                }
            });
        } else {
            console.warn("Zoom-out button not found");
        }
        console.log("Zoom controls setup complete");
    }
    
    /**
     * Apply zoom level to sudoku board
     */
    function applyZoom() {
        console.log("Applying zoom level:", currentZoom);
        const sudokuBoard = document.getElementById('sudoku-board');
        if (sudokuBoard) {
            sudokuBoard.style.transform = `scale(${currentZoom})`;
            sudokuBoard.style.transformOrigin = 'center center';
        } else {
            console.error("Sudoku board not found for zoom application");
        }
    }
    
    /**
     * Optimize UI elements for Steam Deck
     */
    function optimizeUIElements() {
        console.log("Optimizing UI elements...");
        // Make game controls more touch-friendly
        const buttons = document.querySelectorAll('#game-controls button');
        buttons.forEach(button => {
            button.classList.add('touch-friendly-button');
        });
        
        // Style tower selection for vertical layout
        const towerOptions = document.querySelectorAll('.tower-option');
        towerOptions.forEach(option => {
            option.classList.add('vertical-option');
        });
        
        // Fix font sizes for better readability
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.style.fontSize = '14px';
        }
        
        // Fix for mana display
        const manaElements = document.querySelectorAll('[id^="mana-"]');
        manaElements.forEach(el => {
            if (el) {
                el.style.fontSize = '12px';
                el.style.height = '10px';
            }
        });
        console.log("UI elements optimized");
    }
    
    /**
     * Handle resize events
     */
    function handleResize() {
        console.log("Handling resize event");
        if (document.body.classList.contains('steam-deck')) {
            applyOrientationOptimizations();
            fixSudokuBoardLayout();
            optimizeUIElements();
        }
    }
    
    /**
     * Watch for phase changes
     */
    function watchForPhaseChanges() {
        console.log("Setting up phase change watcher...");
        // Use MutationObserver to watch for changes to the phase indicator
        const phaseIndicator = document.getElementById('phase-indicator');
        if (phaseIndicator) {
            const observer = new MutationObserver(function(mutations) {
                // When phase changes, readjust the layout
                if (document.body.classList.contains('steam-deck')) {
                    console.log("Phase change detected, readjusting layout");
                    // Wait a moment for the UI to update
                    setTimeout(handleResize, 100);
                }
            });
            
            observer.observe(phaseIndicator, { 
                childList: true,
                characterData: true,
                subtree: true
            });
            console.log("Phase change observer installed");
        } else {
            console.warn("Phase indicator not found for observation");
        }
    }
    
    /**
     * Setup display options in the settings menu
     */
    function setupDisplayOptions() {
        console.log("Setting up display options...");
        const displayOptions = document.querySelectorAll('[data-option="display"]');
        displayOptions.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const tooltipEl = document.getElementById('display-tooltip');
                
                console.log("Display option selected:", value);
                
                // Update tooltip text
                if (tooltipEl) {
                    if (value === 'steam-deck') {
                        tooltipEl.textContent = 'Steam Deck: Optimized layout for Steam Deck\'s display and controls.';
                    } else {
                        tooltipEl.textContent = 'Normal: Standard display for desktop and mobile devices.';
                    }
                }
                
                // Update localStorage preference
                localStorage.setItem('display-mode', value);
                
                // Toggle Steam Deck mode if we're already in the game
                if (document.body.classList.contains('steam-deck') && value !== 'steam-deck') {
                    // Remove Steam Deck mode
                    document.body.classList.remove('steam-deck');
                    
                    // Hide Steam Deck controls
                    const controls = document.querySelector('.steam-deck-controls');
                    if (controls) {
                        controls.style.display = 'none';
                    }
                    
                    // Restore original layout
                    restoreOriginalLayout();
                    console.log("Reverted to normal mode");
                    
                } else if (!document.body.classList.contains('steam-deck') && value === 'steam-deck') {
                    applySteamDeckMode();
                    console.log("Applied Steam Deck mode from display options");
                }
            });
        });
        console.log("Display options setup complete");
    }
    
    /**
     * Restore the original layout
     */
    function restoreOriginalLayout() {
        console.log("Restoring original layout...");
        // Get key elements
        const gameContainer = document.getElementById('game-container');
        const sudokuBoard = document.getElementById('sudoku-board');
        const missionControl = document.getElementById('mission-control');
        const towerSelection = document.getElementById('tower-selection');
        const gameInfo = document.getElementById('game-info');
        const gameControls = document.getElementById('game-controls');
        const leftPanel = document.getElementById('left-panel');
        const centerPanel = document.getElementById('center-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (!gameContainer) {
            console.error("Game container not found");
            return;
        }
        
        // Reset game container styles
        gameContainer.style.display = 'flex';
        gameContainer.style.flexDirection = 'column';
        gameContainer.style.gridTemplateColumns = '';
        gameContainer.style.gridTemplateRows = '';
        gameContainer.style.gridTemplateAreas = '';
        
        // Move elements back to original positions
        if (sudokuBoard) {
            gameContainer.appendChild(sudokuBoard);
            sudokuBoard.style.width = '100%';
            sudokuBoard.style.height = 'auto';
            sudokuBoard.style.transform = 'scale(1)';
            sudokuBoard.style.aspectRatio = '1';
            console.log("Moved sudoku board back to container");
        }
        
        if (missionControl) {
            gameContainer.appendChild(missionControl);
            missionControl.style.display = 'block';
            missionControl.style.position = 'absolute';
            missionControl.style.right = '20px';
            missionControl.style.top = '100px';
            console.log("Moved mission control back to container");
        }
        
        if (towerSelection) {
            gameContainer.appendChild(towerSelection);
            towerSelection.classList.remove('vertical-tower-selection');
            console.log("Moved tower selection back to container");
        }
        
        if (gameControls) {
            gameContainer.appendChild(gameControls);
            gameControls.classList.remove('vertical-game-controls');
            console.log("Moved game controls back to container");
        }
        
        if (gameInfo) {
            gameContainer.appendChild(gameInfo);
            console.log("Moved game info back to container");
        }
        
        // Remove panels if they exist
        if (leftPanel) {
            leftPanel.remove();
            console.log("Removed left panel");
        }
        
        if (centerPanel && centerPanel.parentNode === gameContainer) {
            // Move children back to container before removing
            while (centerPanel.firstChild) {
                gameContainer.appendChild(centerPanel.firstChild);
            }
            centerPanel.remove();
            console.log("Removed center panel");
        }
        
        if (rightPanel) {
            rightPanel.remove();
            console.log("Removed right panel");
        }
        
        // Reset all tower options
        const towerOptions = document.querySelectorAll('.tower-option');
        towerOptions.forEach(option => {
            option.classList.remove('vertical-option', 'touch-friendly');
            option.style = ''; // Clear inline styles
        });
        
        // Reset all buttons
        const buttons = document.querySelectorAll('#game-controls button');
        buttons.forEach(button => {
            button.classList.remove('touch-friendly-button');
            button.style = ''; // Clear inline styles
        });
        
        // Reset cell styles
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.style = ''; // Clear inline styles
        });
        
        console.log("Original layout restoration complete");
    }
    
    /**
     * Toggle Steam Deck mode
     * @param {boolean} enable - Whether to enable Steam Deck mode
     */
    function toggleSteamDeckMode(enable) {
        console.log("Toggling Steam Deck mode:", enable);
        if (enable) {
            applySteamDeckMode();
            localStorage.setItem('display-mode', 'steam-deck');
        } else {
            restoreOriginalLayout();
            document.body.classList.remove('steam-deck');
            const controls = document.querySelector('.steam-deck-controls');
            if (controls) {
                controls.style.display = 'none';
            }
            localStorage.setItem('display-mode', 'normal');
        }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM loaded, initializing Steam Deck module");
        init();
    });
    
    // Public API
    return {
        init,
        applySteamDeckMode,
        rearrangeLayout,
        toggleSteamDeckMode,
        isSteamDeck: detectSteamDeck,
        fixLayout: handleResize
    };
})();

// Make module available globally
window.SteamDeckModule = SteamDeckModule;