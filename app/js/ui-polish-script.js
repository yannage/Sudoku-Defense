/**
 * Steam Deck UI Polish Script
 * Adds additional refinements and quality-of-life improvements 
 * for the Sudoku Tower Defense game on Steam Deck
 */

(function() {
    // Settings that can be customized
    const config = {
        enableHapticFeedback: true,     // Enable vibration on interactions
        enableZoomGestures: true,       // Allow pinch-to-zoom
        enableSwipeGestures: true,      // Allow swipe for mission panel
        transitionSpeed: 300,           // Animation speed in ms
        useOverscroll: false,           // Enable/disable overscroll effects
        enableSmoothing: true,          // Enable animation smoothing
        useHighContrastMode: false,     // High contrast mode for accessibility
        largeTextMode: false,           // Larger text for better readability
        touchAreaExpansion: 5           // Expand touch areas by this many pixels
    };

    // Apply Steam Deck UI improvements
    function applyUIPolish() {
        // Only run once
        if (window.steamDeckUIPolishApplied) return;
        window.steamDeckUIPolishApplied = true;
        
        console.log("Applying Steam Deck UI polish...");
        
        // Add classes to body
        document.body.classList.add('steam-deck-ui');
        if (config.useHighContrastMode) document.body.classList.add('high-contrast');
        if (config.largeTextMode) document.body.classList.add('large-text');
        
        // Apply improvements
        improveTouch();
        addGestures();
        enhanceVisuals();
        improveTowerSelection();
        optimizeGameControls();
        addGameSpecificImprovements();
        
        // Listen for device rotations
        addOrientationSupport();
        
        console.log("Steam Deck UI polish applied successfully");
    }
    
    /**
     * Improve touch interaction throughout the game
     */
    function improveTouch() {
        // Expand all button touch areas
        const buttons = document.querySelectorAll('button, .tower-option, [role="button"]');
        buttons.forEach(button => {
            // Add touch event handlers
            button.addEventListener('touchstart', function(e) {
                this.classList.add('touch-active');

                // Haptic feedback if available and enabled
                if (config.enableHapticFeedback && navigator.vibrate) {
                    navigator.vibrate(50);
                }

                // Prevent long-press context menu
                e.preventDefault();
            }, { passive: false });

            button.addEventListener('touchend', function(e) {
                this.classList.remove('touch-active');

                // Manually trigger click so regular click handlers fire
                // on touch devices when preventDefault() is used above
                if (!e.defaultPrevented) {
                    this.click();
                }
            });
            
            // Expand touch target area with a pseudo-element if needed
            if (config.touchAreaExpansion > 0) {
                button.style.position = 'relative';
                
                // Use computed style to get the original dimensions
                const style = window.getComputedStyle(button);
                const width = parseFloat(style.width);
                const height = parseFloat(style.height);
                
                // Only apply if the button is smaller than ideal touch target
                if (width < 44 || height < 44) {
                    // Create a pseudo-element for the extended touch area
                    const touchExtensionStyle = document.createElement('style');
                    touchExtensionStyle.textContent = `
                        [data-touch-extended]::before {
                            content: '';
                            position: absolute;
                            top: -${config.touchAreaExpansion}px;
                            left: -${config.touchAreaExpansion}px;
                            right: -${config.touchAreaExpansion}px;
                            bottom: -${config.touchAreaExpansion}px;
                            z-index: -1;
                        }
                    `;
                    document.head.appendChild(touchExtensionStyle);
                    
                    // Add attribute to mark this element
                    button.setAttribute('data-touch-extended', 'true');
                }
            }
        });
        
        // Improve scrolling behavior in scrollable areas
        const scrollableAreas = document.querySelectorAll('.left-column, .right-column, [style*="overflow"]');
        scrollableAreas.forEach(area => {
            area.style.WebkitOverflowScrolling = 'touch'; // Smooth scrolling on iOS
            
            if (!config.useOverscroll) {
                area.style.overscrollBehavior = 'none'; // Prevent overscroll effects
            }
            
            // Add momentum scrolling
            area.addEventListener('touchstart', function() {
                // Mark as being touched (useful for other effects)
                this.setAttribute('data-touching', 'true');
            });
            
            area.addEventListener('touchend', function() {
                this.removeAttribute('data-touching');
            });
        });
        
        // Add touch ripple effect to buttons
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            .touch-ripple {
                position: absolute;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: touch-ripple ${config.transitionSpeed}ms ease-out forwards;
                pointer-events: none;
            }
            
            @keyframes touch-ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
            
            .touch-active {
                transform: scale(0.97);
            }
        `;
        document.head.appendChild(rippleStyle);
        
        // Add ripple effect to clickable elements
        document.addEventListener('touchstart', function(e) {
            if (e.target.closest('button, .tower-option, [role="button"]')) {
                const button = e.target.closest('button, .tower-option, [role="button"]');
                const rect = button.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                const y = e.touches[0].clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.classList.add('touch-ripple');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                button.style.overflow = 'hidden'; // Ensure ripple is contained
                button.appendChild(ripple);
                
                // Remove ripple after animation completes
                setTimeout(() => {
                    if (ripple.parentNode === button) {
                        button.removeChild(ripple);
                    }
                }, config.transitionSpeed);
            }
        }, { passive: true });
    }
    
    /**
     * Add gesture support for common operations
     */
    function addGestures() {
        // Implement pinch-to-zoom for Sudoku board if enabled
        if (config.enableZoomGestures) {
            const sudokuBoard = document.getElementById('sudoku-board');
            if (sudokuBoard) {
                let initialDistance = 0;
                let currentScale = 1;
                
                sudokuBoard.addEventListener('touchstart', function(e) {
                    if (e.touches.length === 2) {
                        initialDistance = getDistance(
                            e.touches[0].clientX, e.touches[0].clientY,
                            e.touches[1].clientX, e.touches[1].clientY
                        );
                    }
                }, { passive: true });
                
                sudokuBoard.addEventListener('touchmove', function(e) {
                    if (e.touches.length === 2) {
                        const currentDistance = getDistance(
                            e.touches[0].clientX, e.touches[0].clientY,
                            e.touches[1].clientX, e.touches[1].clientY
                        );
                        
                        const scaleChange = currentDistance / initialDistance;
                        const newScale = Math.max(0.5, Math.min(2, currentScale * scaleChange));
                        
                        // Apply scale with transformation origin at center
                        this.style.transform = `scale(${newScale})`;
                        this.style.transformOrigin = 'center';
                        
                        // Store the new scale
                        currentScale = newScale;
                        
                        // Update initialDistance for smooth scaling
                        initialDistance = currentDistance;
                        
                        // Prevent default to avoid page zooming
                        e.preventDefault();
                    }
                }, { passive: false });
                
                // Double-tap to reset zoom
                let lastTap = 0;
                sudokuBoard.addEventListener('touchend', function(e) {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    
                    if (tapLength < 300 && tapLength > 0) {
                        // Double tap detected
                        currentScale = 1;
                        this.style.transform = 'scale(1)';
                        e.preventDefault();
                    }
                    
                    lastTap = currentTime;
                });
            }
        }
        
        // Implement swipe gesture for mission panel toggle if enabled
        if (config.enableSwipeGestures) {
            let startX = 0;
            let startY = 0;
            
            document.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            document.addEventListener('touchend', function(e) {
                const deltaX = e.changedTouches[0].clientX - startX;
                const deltaY = e.changedTouches[0].clientY - startY;
                
                // Only count horizontal swipes with minimal vertical movement
                if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
                    const rightColumn = document.querySelector('.right-column');
                    
                    if (rightColumn) {
                        // Swipe from right to left - hide mission panel
                        if (deltaX < -100 && !rightColumn.classList.contains('hidden')) {
                            rightColumn.classList.add('hidden');
                            
                            // Expand middle column
                            const middleColumn = document.querySelector('.middle-column');
                            if (middleColumn) {
                                middleColumn.style.gridColumn = '2 / 4';
                            }
                        }
                        // Swipe from left to right - show mission panel if hidden
                        else if (deltaX > 100 && rightColumn.classList.contains('hidden')) {
                            rightColumn.classList.remove('hidden');
                            
                            // Restore middle column
                            const middleColumn = document.querySelector('.middle-column');
                            if (middleColumn) {
                                middleColumn.style.gridColumn = '';
                            }
                        }
                    }
                }
            }, { passive: true });
        }
    }
    
    /**
     * Enhance visual appearance for better visibility on the Steam Deck
     */
    function enhanceVisuals() {
        // Add smooth transitions
        if (config.enableSmoothing) {
            const transitionStyle = document.createElement('style');
            transitionStyle.textContent = `
                .steam-deck-ui button,
                .steam-deck-ui .tower-option,
                .steam-deck-ui .sudoku-cell {
                    transition: transform ${config.transitionSpeed}ms ease,
                                background-color ${config.transitionSpeed}ms ease,
                                box-shadow ${config.transitionSpeed}ms ease;
                }
                
                .steam-deck-ui .sudoku-cell:hover {
                    transform: scale(1.05);
                    z-index: 2;
                }
                
                .steam-deck-ui .tower-option:hover {
                    transform: scale(1.05);
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                }
                
                .steam-deck-ui button:hover {
                    filter: brightness(1.1);
                }
                
                .steam-deck-ui .right-column,
                .steam-deck-ui .left-column {
                    transition: transform ${config.transitionSpeed}ms ease-in-out,
                                opacity ${config.transitionSpeed}ms ease-in-out;
                }
                
                .steam-deck-ui .hidden {
                    transform: translateX(100%);
                    opacity: 0;
                }
            `;
            document.head.appendChild(transitionStyle);
        }
        
        // Enhance contrast if enabled
        if (config.useHighContrastMode) {
            const highContrastStyle = document.createElement('style');
            highContrastStyle.textContent = `
                .high-contrast .sudoku-cell {
                    background-color: #ffffff;
                    color: #000000;
                    border: 1px solid #000000;
                }
                
                .high-contrast .tower-option {
                    background-color: #ffffff;
                    color: #000000;
                    border: 2px solid #000000;
                }
                
                .high-contrast .tower-option.selected {
                    background-color: #ffff00;
                    border-color: #ff0000;
                }
                
                .high-contrast .game-button {
                    background-color: #0000ff;
                    color: #ffffff;
                    font-weight: bold;
                }
                
                .high-contrast .phase-indicator {
                    background-color: #000000;
                    color: #ffffff;
                }
            `;
            document.head.appendChild(highContrastStyle);
        }
        
        // Enhance text size if enabled
        if (config.largeTextMode) {
            const largeTextStyle = document.createElement('style');
            largeTextStyle.textContent = `
                .large-text {
                    font-size: 120%;
                }
                
                .large-text .sudoku-cell {
                    font-size: 1.5rem;
                }
                
                .large-text .tower-option {
                    font-size: 1.8rem;
                }
                
                .large-text .game-button,
                .large-text .status-message {
                    font-size: 1.2rem;
                }
                
                .large-text .mission-control {
                    font-size: 1.1rem;
                }
            `;
            document.head.appendChild(largeTextStyle);
        }
    }
    
    /**
     * Improve tower selection interface
     */
    function improveTowerSelection() {
        const towerOptions = document.querySelectorAll('.tower-option');
        
        towerOptions.forEach(option => {
            // Add label beneath tower numbers for better identification
            const towerType = option.dataset.towerType;
            
            if (towerType) {
                // Get tower description if available
                let towerDescription = '';
                if (window.TowersModule && typeof TowersModule.getTowerTypeData === 'function') {
                    const typeData = TowersModule.getTowerTypeData(towerType);
                    if (typeData && typeData.description) {
                        towerDescription = typeData.description;
                    }
                }
                
                // Add tooltip
                option.setAttribute('title', towerDescription || `Tower ${towerType}`);
                
                // Add hover tooltip with enhanced information
                const tooltip = document.createElement('div');
                tooltip.className = 'tower-tooltip';
                tooltip.textContent = towerDescription || `Tower ${towerType}`;
                tooltip.style.position = 'absolute';
                tooltip.style.bottom = '-40px';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '5px 10px';
                tooltip.style.borderRadius = '5px';
                tooltip.style.fontSize = '12px';
                tooltip.style.whiteSpace = 'nowrap';
                tooltip.style.zIndex = '10';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.opacity = '0';
                tooltip.style.transition = 'opacity 0.2s';
                
                option.style.position = 'relative';
                option.appendChild(tooltip);
                
                option.addEventListener('mouseenter', () => {
                    tooltip.style.opacity = '1';
                });
                
                option.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                });
            }
        });
    }
    
    /**
     * Optimize game controls
     */
    function optimizeGameControls() {
        // Add visual feedback to Start Wave button
        const startWaveButton = document.querySelector('#start-wave, .start-button');
        if (startWaveButton) {
            const originalBackground = startWaveButton.style.backgroundColor;
            const originalText = startWaveButton.textContent;
            
            // Listen for wave start events
            if (window.EventSystem && GameEvents) {
                EventSystem.subscribe(GameEvents.WAVE_START, function() {
                    startWaveButton.style.backgroundColor = '#888';
                    startWaveButton.textContent = 'Wave Active';
                    startWaveButton.setAttribute('disabled', 'disabled');
                    
                    // Reset button after wave completes
                    const resetButton = function() {
                        startWaveButton.style.backgroundColor = originalBackground;
                        startWaveButton.textContent = originalText;
                        startWaveButton.removeAttribute('disabled');
                    };
                    
                    // Listen for wave complete to re-enable button
                    EventSystem.subscribe(GameEvents.WAVE_COMPLETE, resetButton);
                });
            }
        }
        
        // Make the pause button more intuitive
        const pauseButton = document.querySelector('#pause-game, .pause-button');
        if (pauseButton) {
            // Track pause state
            let isPaused = false;
            
            // Create pause icon
            const pauseIcon = document.createElement('span');
            pauseIcon.innerHTML = '⏸️';
            pauseIcon.style.marginRight = '5px';
            
            // Create play icon
            const playIcon = document.createElement('span');
            playIcon.innerHTML = '▶️';
            playIcon.style.marginRight = '5px';
            playIcon.style.display = 'none';
            
            // Add icons to button
            pauseButton.prepend(pauseIcon);
            pauseButton.prepend(playIcon);
            
            // Toggle icon on click
            pauseButton.addEventListener('click', function() {
                isPaused = !isPaused;
                
                if (isPaused) {
                    pauseButton.textContent = 'Resume';
                    pauseIcon.style.display = 'none';
                    playIcon.style.display = 'inline';
                    pauseButton.prepend(playIcon);
                } else {
                    pauseButton.textContent = 'Pause';
                    pauseIcon.style.display = 'inline';
                    playIcon.style.display = 'none';
                    pauseButton.prepend(pauseIcon);
                }
            });
        }
    }
    
    /**
     * Add game-specific improvements
     */
    function addGameSpecificImprovements() {
        // Dynamic phase indicator color based on game state
        const phaseIndicator = document.querySelector('#phase-indicator, .phase-indicator');
        if (phaseIndicator && window.EventSystem && GameEvents) {
            EventSystem.subscribe(GameEvents.WAVE_START, function() {
                phaseIndicator.style.backgroundColor = 'rgba(244, 67, 54, 0.7)'; // Red for battle phase
                phaseIndicator.textContent = 'Current Phase: Battle';
            });
            
            EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
                phaseIndicator.style.backgroundColor = 'rgba(76, 175, 80, 0.7)'; // Green for Sudoku phase
                phaseIndicator.textContent = 'Current Phase: Sudoku';
            });
        }
        
        // Add status message animations
        const statusMessage = document.querySelector('#status-message, .status-message');
        if (statusMessage && window.EventSystem && GameEvents) {
            EventSystem.subscribe(GameEvents.STATUS_MESSAGE, function(message) {
                // Add animation 
                statusMessage.classList.add('message-animation');
                
                // Remove animation after it completes
                setTimeout(() => {
                    statusMessage.classList.remove('message-animation');
                }, 500);
            });
            
            // Add animation style
            const messageStyle = document.createElement('style');
            messageStyle.textContent = `
                .message-animation {
                    animation: message-flash 0.5s;
                }
                
                @keyframes message-flash {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); background-color: rgba(0, 150, 255, 0.2); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(messageStyle);
        }
    }
    
    /**
     * Utility function to get distance between two touch points
     */
    function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    // Apply the UI polish after the main Steam Deck layout is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for the main Steam Deck layout to be applied
        const checkInterval = setInterval(function() {
            if (document.body.classList.contains('steam-deck-mode')) {
                clearInterval(checkInterval);
                applyUIPolish();
            }
        }, 100);
        
        // Fallback: Apply after a reasonable timeout even if steam-deck-mode isn't found
        setTimeout(function() {
            if (!window.steamDeckUIPolishApplied) {
                applyUIPolish();
            }
        }, 2000);
    });
})();

export {};
