// Steam Deck Optimization JavaScript
// Add this as js/steam-deck.js

(function() {
    // Configuration
    const STEAM_DECK_WIDTH = 1280;
    const STEAM_DECK_HEIGHT = 800;
    
    // State variables
    let currentZoom = 1.0;
    const zoomIncrement = 0.05;
    const maxZoom = 1.2;
    const minZoom = 0.8;
    let lastTap = 0; // Initialize lastTap variable
    let missionControlVisible = true; // Track mission control visibility
    
    // Check if device is likely a Steam Deck
    function detectSteamDeck() {
        // Screen resolution check (approximate)
        const isSteamDeckResolution = 
            (window.innerWidth <= STEAM_DECK_WIDTH && window.innerHeight <= STEAM_DECK_HEIGHT) ||
            (window.innerWidth <= STEAM_DECK_HEIGHT && window.innerHeight <= STEAM_DECK_WIDTH);
            
        // User agent can sometimes help (Steam browser)
        const ua = navigator.userAgent.toLowerCase();
        const containsSteamTerms = ua.includes('steam') || ua.includes('valve');
        
        // Check for gamepads which are likely Steam Deck controls
        const hasGamepads = navigator.getGamepads && 
                           navigator.getGamepads().some(gp => gp && gp.id && gp.id.toLowerCase().includes('valve'));
        
        return isSteamDeckResolution || containsSteamTerms || hasGamepads;
    }
    
    // Apply Steam Deck optimizations
    function applySteamDeckMode() {
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
    
    // Rearrange the layout for Steam Deck
    function rearrangeLayout() {
        // Get the main elements
        const gameContainer = document.getElementById('game-container');
        const sudokuBoard = document.getElementById('sudoku-board');
        const missionControl = document.getElementById('mission-control');
        const towerSelection = document.getElementById('tower-selection');
        const gameInfo = document.getElementById('game-info');
        const gameControls = document.getElementById('game-controls');
        
        if (!gameContainer || !sudokuBoard) return;
        
        // Create left panel
        let leftPanel = document.getElementById('left-panel');
        if (!leftPanel) {
            leftPanel = document.createElement('div');
            leftPanel.id = 'left-panel';
            leftPanel.className = 'steam-deck-left-panel';
            
            // Add left panel to game container
            gameContainer.appendChild(leftPanel);
        }
        
        // Create right panel
        let rightPanel = document.getElementById('right-panel');
        if (!rightPanel) {
            rightPanel = document.createElement('div');
            rightPanel.id = 'right-panel';
            rightPanel.className = 'steam-deck-right-panel';
            
            // Add right panel to game container
            gameContainer.appendChild(rightPanel);
        }
        
        // Create center panel for the board
        let centerPanel = document.getElementById('center-panel');
        if (!centerPanel) {
            centerPanel = document.createElement('div');
            centerPanel.id = 'center-panel';
            centerPanel.className = 'steam-deck-center-panel';
            
            // Add center panel to game container
            gameContainer.appendChild(centerPanel);
        }
        
        // Move the sudoku board to the center panel
        if (sudokuBoard.parentNode !== centerPanel) {
            centerPanel.appendChild(sudokuBoard);
        }
        
        // Move mission control to the right panel
        if (missionControl && missionControl.parentNode !== rightPanel) {
            rightPanel.appendChild(missionControl);
        }
        
        // Move tower selection to the left panel
        if (towerSelection && towerSelection.parentNode !== leftPanel) {
            // Reorient the tower selection to vertical
            towerSelection.classList.add('vertical-tower-selection');
            leftPanel.appendChild(towerSelection);
        }
        
        // Move game controls to the left panel
        if (gameControls && gameControls.parentNode !== leftPanel) {
            gameControls.classList.add('vertical-game-controls');
            leftPanel.appendChild(gameControls);
        }
        
        // Move game info to the left panel
        if (gameInfo && gameInfo.parentNode !== leftPanel) {
            leftPanel.appendChild(gameInfo);
        }
        
        // Set grid layout
        gameContainer.style.display = 'grid';
        gameContainer.style.gridTemplateColumns = 'auto 1fr auto';
        gameContainer.style.gridTemplateRows = 'auto 1fr';
        gameContainer.style.gridTemplateAreas = 
            '"header header header" ' +
            '"left-panel center-panel right-panel"';
        
        // Set the sudoku board to be square
        sudokuBoard.style.aspectRatio = '1';
        sudokuBoard.style.width = '100%';
        sudokuBoard.style.height = 'auto';
        
        // Toggle mission control button
        setupMissionControlToggle();
        
        // Fix sizing for all cells
        fixSudokuBoardLayout();
    }
    
    // Setup toggle for mission control
    function setupMissionControlToggle() {
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
                    } else {
                        missionControl.style.display = 'block';
                        rightPanel.style.display = 'block';
                        missionControlVisible = true;
                    }
                }
            });
        }
    }
    
    // Fix Sudoku board layout specifically for Steam Deck
    function fixSudokuBoardLayout() {
        const sudokuBoard = document.getElementById('sudoku-board');
        if (!sudokuBoard) return;
        
        // Make sure the board is square
        const boardSize = Math.min(
            sudokuBoard.offsetWidth,
            window.innerHeight * 0.7 // Max 70% of viewport height
        );
        
        sudokuBoard.style.width = `${boardSize}px`;
        sudokuBoard.style.height = `${boardSize}px`;
        
        // Calculate cell height
        const cellHeight = Math.floor(boardSize / 9);
        
        // Adjust cells to fit properly
        const cells = sudokuBoard.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.style.height = `${cellHeight}px`;
            cell.style.width = `${cellHeight}px`;
        });
        
        // Fix font size issues within cells
        // Dynamically adjust font size based on cell dimensions
        const idealFontSize = Math.max(16, Math.min(cellHeight * 0.6, 24)); // Min 16px, Max 24px
        cells.forEach(cell => {
            cell.style.fontSize = `${idealFontSize}px`;
        });
    }
    
    function applyOrientationOptimizations() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        }
        
        // Adjust for orientation
        const leftPanel = document.getElementById('left-panel');
        const centerPanel = document.getElementById('center-panel');
        const rightPanel = document.getElementById('right-panel');
        const gameContainer = document.getElementById('game-container');
        
        if (isLandscape) {
            if (gameContainer) {
                gameContainer.style.gridTemplateColumns = 'auto 1fr auto';
                gameContainer.style.gridTemplateRows = 'auto 1fr';
                gameContainer.style.gridTemplateAreas = 
                    '"header header header" ' +
                    '"left-panel center-panel right-panel"';
            }
        } else {
            // Portrait mode (rare on Steam Deck but possible)
            if (gameContainer) {
                gameContainer.style.gridTemplateColumns = '1fr';
                gameContainer.style.gridTemplateRows = 'auto auto 1fr auto';
                gameContainer.style.gridTemplateAreas = 
                    '"header" ' +
                    '"center-panel" ' +
                    '"right-panel" ' +
                    '"left-panel"';
            }
        }
        
        // Fix sizing after orientation change
        fixSudokuBoardLayout();
    }
    
    // Setup touch input optimization
    function setupTouchOptimizations() {
        // Add touch input class to enable larger tap targets
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
    }
    
    // Zoom functionality for Steam Deck
    function setupZoomControls() {
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const toggleMission = document.getElementById('toggle-mission');
        
        if (zoomIn) {
            zoomIn.addEventListener('click', function() {
                if (currentZoom < maxZoom) {
                    currentZoom += zoomIncrement;
                    applyZoom();
                }
            });
        }
        
        if (zoomOut) {
            zoomOut.addEventListener('click', function() {
                if (currentZoom > minZoom) {
                    currentZoom -= zoomIncrement;
                    applyZoom();
                }
            });
        }
    }
    
    function applyZoom() {
        const sudokuBoard = document.getElementById('sudoku-board');
        if (sudokuBoard) {
            sudokuBoard.style.transform = `scale(${currentZoom})`;
            sudokuBoard.style.transformOrigin = 'center center';
        }
    }
    
    // Fix for specific UI elements
    function optimizeUIElements() {
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
    }
    
    // Listen for resizing to adjust the layout dynamically
    function handleResize() {
        if (document.body.classList.contains('steam-deck')) {
            applyOrientationOptimizations();
            fixSudokuBoardLayout();
            optimizeUIElements();
        }
    }
    
    // Watch for phase changes in the game
    function watchForPhaseChanges() {
        // Use MutationObserver to watch for changes to the phase indicator
        const phaseIndicator = document.getElementById('phase-indicator');
        if (phaseIndicator) {
            const observer = new MutationObserver(function(mutations) {
                // When phase changes, readjust the layout
                if (document.body.classList.contains('steam-deck')) {
                    // Wait a moment for the UI to update
                    setTimeout(handleResize, 100);
                }
            });
            
            observer.observe(phaseIndicator, { 
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    }
    
    // Handle display option selection in setup menu
    function setupDisplayOptions() {
        const displayOptions = document.querySelectorAll('[data-option="display"]');
        displayOptions.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const tooltipEl = document.getElementById('display-tooltip');
                
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
                    
                } else if (!document.body.classList.contains('steam-deck') && value === 'steam-deck') {
                    applySteamDeckMode();
                }
            });
        });
    }
    
    // Restore original layout
    function restoreOriginalLayout() {
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
        
        if (!gameContainer) return;
        
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
        }
        
        if (missionControl) {
            gameContainer.appendChild(missionControl);
            missionControl.style.display = 'block';
            missionControl.style.position = 'absolute';
            missionControl.style.right = '20px';
            missionControl.style.top = '100px';
        }
        
        if (towerSelection) {
            gameContainer.appendChild(towerSelection);
            towerSelection.classList.remove('vertical-tower-selection');
        }
        
        if (gameControls) {
            gameContainer.appendChild(gameControls);
            gameControls.classList.remove('vertical-game-controls');
        }
        
        if (gameInfo) {
            gameContainer.appendChild(gameInfo);
        }
        
        // Remove panels if they exist
        if (leftPanel) {
            leftPanel.remove();
        }
        
        if (centerPanel && centerPanel.parentNode === gameContainer) {
            // Move children back to container before removing
            while (centerPanel.firstChild) {
                gameContainer.appendChild(centerPanel.firstChild);
            }
            centerPanel.remove();
        }
        
        if (rightPanel) {
            rightPanel.remove();
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
    }
    
    // Setup Steam Deck controller support
    function setupControllerSupport() {
        let gamepadInterval;
        
        function startGamepadPolling() {
            if (gamepadInterval) return;
            
            gamepadInterval = setInterval(() => {
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                const gamepad = gamepads[0]; // Use first gamepad
                
                if (!gamepad) return;
                
                // A button - Start Wave
                if (gamepad.buttons[0].pressed) {
                    const startWaveBtn = document.getElementById('start-wave');
                    if (startWaveBtn && getComputedStyle(startWaveBtn).display !== 'none') {
                        startWaveBtn.click();
                    }
                }
                
                // B button - Pause
                if (gamepad.buttons[1].pressed) {
                    const pauseBtn = document.getElementById('pause-game');
                    if (pauseBtn) {
                        pauseBtn.click();
                    }
                }
                
                // Use D-pad or left stick for tower selection
                let dpadDirection = null;
                
                // Check D-pad
                if (gamepad.buttons[12].pressed) dpadDirection = "up";
                else if (gamepad.buttons[13].pressed) dpadDirection = "down";
                else if (gamepad.buttons[14].pressed) dpadDirection = "left";
                else if (gamepad.buttons[15].pressed) dpadDirection = "right";
                
                // Check analog stick if no D-pad input
                if (!dpadDirection) {
                    const threshold = 0.5;
                    if (gamepad.axes[1] < -threshold) dpadDirection = "up";
                    else if (gamepad.axes[1] > threshold) dpadDirection = "down";
                    else if (gamepad.axes[0] < -threshold) dpadDirection = "left";
                    else if (gamepad.axes[0] > threshold) dpadDirection = "right";
                }
                
                // Handle tower selection with D-pad/analog
                if (dpadDirection) {
                    const selectedTower = document.querySelector('.tower-option.selected');
                    const allTowers = Array.from(document.querySelectorAll('.tower-option'));
                    
                    if (allTowers.length) {
                        let currentIndex = selectedTower ? allTowers.indexOf(selectedTower) : -1;
                        
                        // In vertical layout, up/down need to be primary controls
                        if (document.body.classList.contains('steam-deck')) {
                            switch (dpadDirection) {
                                case "up":
                                case "left":
                                    currentIndex = (currentIndex - 1 + allTowers.length) % allTowers.length;
                                    break;
                                case "down":
                                case "right":
                                    currentIndex = (currentIndex + 1) % allTowers.length;
                                    break;
                            }
                        } else {
                            // Original horizontal layout
                            switch (dpadDirection) {
                                case "right":
                                    currentIndex = (currentIndex + 1) % allTowers.length;
                                    break;
                                case "left":
                                    currentIndex = (currentIndex - 1 + allTowers.length) % allTowers.length;
                                    break;
                                case "up":
                                    currentIndex = (currentIndex - 3 + allTowers.length) % allTowers.length;
                                    break;
                                case "down":
                                    currentIndex = (currentIndex + 3) % allTowers.length;
                                    break;
                            }
                        }
                        
                        if (currentIndex >= 0) {
                            // Remove selected class from all
                            allTowers.forEach(t => t.classList.remove('selected'));
                            // Add to new selected
                            allTowers[currentIndex].classList.add('selected');
                            allTowers[currentIndex].click();
                        }
                    }
                }
            }, 100);
        }
        
        // Listen for gamepad connections
        window.addEventListener('gamepadconnected', function(e) {
            console.log("Gamepad connected:", e.gamepad.id);
            if (document.body.classList.contains('steam-deck')) {
                startGamepadPolling();
            }
        });
        
        window.addEventListener('gamepaddisconnected', function(e) {
            console.log("Gamepad disconnected");
            if (gamepadInterval) {
                clearInterval(gamepadInterval);
                gamepadInterval = null;
            }
        });
        
        // Start polling if a gamepad is already connected
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (gamepads[0] && document.body.classList.contains('steam-deck')) {
            startGamepadPolling();
        }
    }
    
    // Initialize Steam Deck optimizations
    function init() {
        // Check if user selected Steam Deck mode or if auto-detection matches
        const savedDisplayMode = localStorage.getItem('display-mode');
        const isSteamDeck = detectSteamDeck();
        
        if (savedDisplayMode === 'steam-deck' || (savedDisplayMode !== 'normal' && isSteamDeck)) {
            applySteamDeckMode();
            
            // Setup all the other optimizations
            setupZoomControls();
            optimizeUIElements();
            setupControllerSupport();
            
            // Add resize listener
            window.addEventListener('resize', handleResize);
            
            // Run initial adjustments after a slight delay to ensure everything is rendered
            setTimeout(handleResize, 100);
        }
        
        // Setup display options in settings menu
        setupDisplayOptions();
        
        // Watch for phase changes to readjust the layout
        watchForPhaseChanges();
        
        console.log("Steam Deck optimization module initialized");
    }
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Expose public methods
    window.SteamDeckOptimizer = {
        toggleSteamDeckMode: function(enable) {
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
        },
        isSteamDeck: detectSteamDeck,
        fixLayout: handleResize
    };
})();