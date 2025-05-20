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
        
        // Apply grid layout to container
        const gameContainer = document.querySelector('#game-container');
        if (gameContainer) {
            gameContainer.style.display = 'grid';
        }
        
        // Check if we're in horizontal orientation
        applyOrientationOptimizations();
        
        // Fix for cut-off board cells
        fixSudokuBoardLayout();
        
        // Setup touch input optimizations
        setupTouchOptimizations();
        
        // Create floating "Start Wave" button for easier access
        createFloatingStartWaveButton();
        
        console.log("Steam Deck optimizations applied");
    }
    
    // Create floating "Start Wave" button for easier access on Steam Deck
    function createFloatingStartWaveButton() {
        // Check if it already exists
        if (document.getElementById('steam-deck-start-wave')) {
            return;
        }
        
        // Create the floating button container if it doesn't exist
        let floatingControls = document.querySelector('.steam-deck-controls');
        if (!floatingControls) {
            floatingControls = document.createElement('div');
            floatingControls.className = 'steam-deck-controls';
            document.body.appendChild(floatingControls);
        }
        
        // Add a floating start wave button
        const startWaveBtn = document.createElement('button');
        startWaveBtn.id = 'steam-deck-start-wave';
        startWaveBtn.className = 'steam-deck-control-btn start-wave-btn';
        startWaveBtn.innerHTML = '▶️'; // Play emoji
        startWaveBtn.title = 'Start Wave';
        startWaveBtn.style.backgroundColor = '#4CAF50';
        startWaveBtn.style.width = '48px';
        startWaveBtn.style.height = '48px';
        startWaveBtn.style.fontSize = '24px';
        
        // Position it in a better spot
        startWaveBtn.style.position = 'fixed';
        startWaveBtn.style.bottom = '70px';
        startWaveBtn.style.right = '10px';
        startWaveBtn.style.zIndex = '1000';
        startWaveBtn.style.borderRadius = '50%';
        startWaveBtn.style.border = 'none';
        startWaveBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        
        // Event listener to trigger the main start wave button
        startWaveBtn.addEventListener('click', function() {
            const mainStartWaveBtn = document.getElementById('start-wave');
            if (mainStartWaveBtn) {
                mainStartWaveBtn.click();
                // Add feedback on press
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            }
        });
        
        // Add it to the document
        document.body.appendChild(startWaveBtn);
        
        // Hide it during setup
        const setupMenu = document.getElementById('setup-menu');
        if (setupMenu && window.getComputedStyle(setupMenu).display !== 'none') {
            startWaveBtn.style.display = 'none';
            
            // Show it once setup is complete
            const startGameBtn = document.getElementById('start-game-btn');
            if (startGameBtn) {
                startGameBtn.addEventListener('click', function() {
                    setTimeout(() => {
                        startWaveBtn.style.display = 'block';
                    }, 500);
                });
            }
        }
    }
    
    // Fix Sudoku board layout specifically for Steam Deck
    function fixSudokuBoardLayout() {
        const sudokuBoard = document.getElementById('sudoku-board');
        if (!sudokuBoard) return;
        
        // Make sure the board doesn't get cut off
        const cellHeight = Math.floor(sudokuBoard.offsetHeight / 9);
        
        // Adjust cells to fit properly
        const cells = sudokuBoard.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.style.height = `${cellHeight}px`;
        });
        
        // Fix font size issues within cells
        const computedStyle = getComputedStyle(cells[0]);
        const cellWidth = parseFloat(computedStyle.width);
        
        // Dynamically adjust font size based on cell dimensions
        const idealFontSize = Math.min(cellWidth * 0.5, cellHeight * 0.7);
        cells.forEach(cell => {
            cell.style.fontSize = `${idealFontSize}px`;
        });
        
        // Keep mission control visible
        const missionControl = document.getElementById('mission-control');
        if (missionControl) {
            missionControl.style.maxHeight = `${sudokuBoard.offsetHeight}px`;
        }
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
        
        // Adjust mission control based on orientation
        const missionControl = document.getElementById('mission-control');
        if (missionControl) {
            if (isLandscape) {
                missionControl.style.maxHeight = '100%';
            } else {
                missionControl.style.maxHeight = '150px';
            }
        }
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
        
        if (toggleMission) {
            toggleMission.addEventListener('click', function() {
                const missionControl = document.getElementById('mission-control');
                if (missionControl) {
                    missionControl.style.display = 
                        missionControl.style.display === 'none' ? 'block' : 'none';
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
    
    // Fix for specific UI elements that might be cut off
    function fixCutOffElements() {
        // Fix for mana bar and other bottom elements
        const manaElements = document.querySelectorAll('[id^="mana-"]');
        manaElements.forEach(el => {
            if (el) {
                el.style.fontSize = '10px';
                el.style.height = '8px';
                el.style.lineHeight = '8px';
                el.style.marginTop = '0';
                el.style.marginBottom = '0';
            }
        });
        
        // Ensure tower selection is visible and properly sized
        const towerOptions = document.querySelectorAll('.tower-option');
        towerOptions.forEach(option => {
            option.style.minWidth = '30px';
            option.style.maxWidth = '30px';
            option.style.height = '30px';
            option.style.fontSize = '1rem';
            option.style.padding = '2px';
        });
        
        // Adjust game controls buttons
        const buttons = document.querySelectorAll('#game-controls button');
        buttons.forEach(button => {
            button.style.padding = '5px 8px';
            button.style.height = '32px';
            button.style.minHeight = '32px';
        });
        
        // Ensure game info is visible
        const gameInfo = document.getElementById('game-info');
        if (gameInfo) {
            gameInfo.style.marginTop = '2px';
            gameInfo.style.marginBottom = '2px';
            gameInfo.style.fontSize = '0.85rem';
        }
        
        // Make the Start Wave button more prominent
        const startWaveBtn = document.getElementById('start-wave');
        if (startWaveBtn) {
            startWaveBtn.style.backgroundColor = '#4CAF50';
            startWaveBtn.style.color = 'white';
            startWaveBtn.style.fontWeight = 'bold';
            startWaveBtn.style.minHeight = '36px';
        }
    }
    
    // Listen for resizing to adjust the layout dynamically
    function handleResize() {
        if (document.body.classList.contains('steam-deck')) {
            fixSudokuBoardLayout();
            applyOrientationOptimizations();
            fixCutOffElements();
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
                    
                    // Update the floating Start Wave button visibility based on phase
                    const floatingStartWave = document.getElementById('steam-deck-start-wave');
                    if (floatingStartWave) {
                        // Show only during Sudoku phase, hide during battle
                        const currentPhase = phaseIndicator.textContent.toLowerCase();
                        if (currentPhase.includes('sudoku')) {
                            floatingStartWave.style.display = 'block';
                        } else if (currentPhase.includes('battle')) {
                            floatingStartWave.style.display = 'none';
                        }
                    }
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
                    document.body.classList.remove('steam-deck');
                    const controls = document.querySelector('.steam-deck-controls');
                    if (controls) {
                        controls.style.display = 'none';
                    }
                    // Remove floating start wave button
                    const floatingStartWave = document.getElementById('steam-deck-start-wave');
                    if (floatingStartWave) {
                        floatingStartWave.remove();
                    }
                } else if (!document.body.classList.contains('steam-deck') && value === 'steam-deck') {
                    applySteamDeckMode();
                }
            });
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
                        
                        switch (dpadDirection) {
                            case "right":
                                currentIndex = (currentIndex + 1) % allTowers.length;
                                break;
                            case "left":
                                currentIndex = (currentIndex - 1 + allTowers.length) % allTowers.length;
                                break;
                            // Handle up/down for 3x3 grid of tower options
                            case "up":
                                currentIndex = (currentIndex - 3 + allTowers.length) % allTowers.length;
                                break;
                            case "down":
                                currentIndex = (currentIndex + 3) % allTowers.length;
                                break;
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
            fixCutOffElements();
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
                document.body.classList.remove('steam-deck');
                const controls = document.querySelector('.steam-deck-controls');
                if (controls) {
                    controls.style.display = 'none';
                }
                const floatingStartWave = document.getElementById('steam-deck-start-wave');
                if (floatingStartWave) {
                    floatingStartWave.remove();
                }
                localStorage.setItem('display-mode', 'normal');
            }
        },
        isSteamDeck: detectSteamDeck,
        fixLayout: handleResize
    };
})();