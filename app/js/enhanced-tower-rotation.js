/**
 * Tower Rotation Integration
 * 
 * This script integrates the tower rotation systems with the game's core modules.
 * It handles loading order issues and ensures compatibility with existing systems.
 */

(function() {
  console.log("Setting up Tower Rotation Integration");
  
  // Configuration flag - set to true to use the enhanced version with barrels
  const USE_ENHANCED_BARREL_VERSION = true;
  
  /**
   * Initialize the tower rotation system
   */
  function initTowerRotation() {
    console.log("Initializing Tower Rotation System");
    
    // Check if required modules are available
    if (!window.TowersModule || !window.EventSystem) {
      console.warn("Required modules not fully loaded. Delaying tower rotation initialization...");
      setTimeout(initTowerRotation, 500);
      return;
    }
    //test
loadEnhancedBarrelSystem();
    
    // Setup event handling for game state changes
    setupEventHandlers();
  }

  /**
   * Load the enhanced tower rotation system with barrels
   */
  function loadEnhancedBarrelSystem() {
    // Check if required modules exist
    if (!window.TowersModule || !window.EventSystem) {
      console.warn("Required modules not found for Enhanced Tower Rotation");
      return;
    }
    
    console.log("Initializing Enhanced Tower Rotation System");
    
    // Styles are defined in CSS
    
    // Define sprite positions for each tower type
    const spritePositions = {
      1: { x: 0, y: 0 },
      2: { x: -32, y: 0 },
      3: { x: -64, y: 0 },
      4: { x: 0, y: -32 },
      5: { x: -32, y: -32 },
      6: { x: -64, y: -32 },
      7: { x: 0, y: -64 },
      8: { x: -32, y: -64 },
      9: { x: -64, y: -64 }
    };
    
    // Track towers that need rotation
    const activeRotations = {};
    
    /**
     * Add barrel elements to towers
     */
    function addBarrelsToTowers() {
      // Get all tower elements
      const towerElements = document.querySelectorAll('.tower');
      
      towerElements.forEach(towerElement => {
        // Skip if already has a barrel
        if (towerElement.querySelector('.tower-barrel')) return;
        
        // Get tower type from the parent cell's data attribute or the tower's class
        let towerType = 1; // Default to type 1
        const cellElement = towerElement.closest('.sudoku-cell');
        if (cellElement) {
          const cellValue = cellElement.getAttribute('data-value');
          if (cellValue && !isNaN(parseInt(cellValue))) {
            towerType = parseInt(cellValue);
          }
        }
        
        // For tower classes like 'tower-1', 'tower-2', etc.
        const towerClassMatch = Array.from(towerElement.classList)
          .find(cls => cls.startsWith('tower-') && !isNaN(parseInt(cls.replace('tower-', ''))));
        if (towerClassMatch) {
          towerType = parseInt(towerClassMatch.replace('tower-', ''));
        }
        
        // Create barrel element
        const barrelElement = document.createElement('div');
        barrelElement.className = 'tower-barrel';
        barrelElement.setAttribute('data-type', towerType);
        
        // Set the background image and position based on tower type
        const spritePos = spritePositions[towerType] || spritePositions[1];
        barrelElement.style.backgroundImage = 'url("assets/aimsheet3.png")';
        barrelElement.style.backgroundSize = '96px 96px';
        barrelElement.style.backgroundPosition = `${spritePos.x}px ${spritePos.y}px`;
        barrelElement.style.backgroundRepeat = 'no-repeat';
        barrelElement.style.imageRendering = 'pixelated';
        
        towerElement.appendChild(barrelElement);
      });
    }
    
    /**
     * Calculate angle between tower and enemy
     * @param {Object} tower - The tower
     * @param {Object} enemy - The enemy
     * @returns {number} Angle in degrees
     */
    function calculateAngle(tower, enemy) {
      const dx = enemy.col - tower.col;
      const dy = enemy.row - tower.row;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return angle;
    }
    
    /**
     * Rotate tower to face enemy
     * @param {Object} tower - The tower
     * @param {Object} enemy - The enemy
     */
    function rotateTowerToFaceEnemy(tower, enemy) {
      if (!tower || !enemy) return;
      
      // Find the tower element
      const cellElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
      if (!cellElement) return;
      
      const towerElement = cellElement.querySelector('.tower');
      if (!towerElement) return;
      
      // Make sure the tower has a barrel
      let barrelElement = towerElement.querySelector('.tower-barrel');
      if (!barrelElement) {
        // Add barrel if missing
        const spritePos = spritePositions[tower.type] || spritePositions[1];
        barrelElement = document.createElement('div');
        barrelElement.className = 'tower-barrel';
        barrelElement.setAttribute('data-type', tower.type);
        barrelElement.style.backgroundImage = 'url("assets/aimsheet3.png")';
        barrelElement.style.backgroundSize = '96px 96px';
        barrelElement.style.backgroundPosition = `${spritePos.x}px ${spritePos.y}px`;
        barrelElement.style.backgroundRepeat = 'no-repeat';
        barrelElement.style.imageRendering = 'pixelated';
        
        towerElement.appendChild(barrelElement);
      }
      
      // Calculate angle
      const angle = calculateAngle(tower, enemy);
      
barrelElement.style.setProperty('--rotation', `${angle}deg`);
barrelElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(1.3)`;
      
      // Add attacking animation
      barrelElement.classList.add('attacking');
      setTimeout(() => {
        barrelElement.classList.remove('attacking');
      }, 300);
      
      // Store the rotation state
      activeRotations[tower.id] = {
        angle: angle,
        timestamp: Date.now()
      };
    }
    
    /**
     * Update rotations and reset inactive ones
     */
    function updateRotations() {
      const now = Date.now();
      
      // Check all active rotations
      Object.entries(activeRotations).forEach(([towerId, data]) => {
        // Reset rotation after 2 seconds of inactivity
        if (now - data.timestamp > 2000) {
          delete activeRotations[towerId];
          
          // Find the tower
          const towers = TowersModule.getTowers();
          const tower = towers.find(t => t.id === towerId);
          if (!tower) return;
          
          // Find the tower element
          const cellElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
          if (!cellElement) return;
          
          const barrelElement = cellElement.querySelector('.tower-barrel');
          if (!barrelElement) return;
          
          // Reset rotation with transition
          barrelElement.style.transition = 'transform 0.5s ease-out';
          barrelElement.style.transform = 'translate(-50%, -50%) rotate(0deg)';
          
          // Remove transition after animation completes
          setTimeout(() => {
            barrelElement.style.transition = '';
          }, 500);
        }
      });
    }
    
    /**
     * Handle tower attacks to rotate towers
     */
    function handleTowerAttack(data) {
      if (!data || !data.tower || !data.enemy) return;
      
      // Rotate tower to face enemy
      rotateTowerToFaceEnemy(data.tower, data.enemy);
    }
    
    // Subscribe to tower attack events
    EventSystem.subscribe(GameEvents.TOWER_ATTACK, handleTowerAttack);
    
    // Set up interval to add barrels to new towers
    setInterval(addBarrelsToTowers, 500);
    
    // Set up interval to update rotations
    setInterval(updateRotations, 500);
    
    // Initial setup for any existing towers
    addBarrelsToTowers();
    
    console.log("Enhanced Tower Rotation System initialized");
  }
  
  /**
   * Set up event handlers for game state changes
   */
  function setupEventHandlers() {
    // Re-initialize after waves
    EventSystem.subscribe(GameEvents.WAVE_COMPLETE, function() {
      setTimeout(() => {
        if (USE_ENHANCED_BARREL_VERSION) {
          addBarrelsToTowers();
        }
      }, 500);
    });
    
    // Re-initialize after board changes
    EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function() {
      setTimeout(() => {
        if (USE_ENHANCED_BARREL_VERSION) {
          addBarrelsToTowers();
        }
      }, 500);
    });
    
    // Re-initialize after tower placement
    EventSystem.subscribe(GameEvents.TOWER_PLACED, function() {
      setTimeout(() => {
        if (USE_ENHANCED_BARREL_VERSION) {
          addBarrelsToTowers();
        }
      }, 200);
    });
    
    // Handle display mode toggle
    if (window.BoardManager && typeof BoardManager.toggleDisplayMode === 'function') {
      const originalToggleMode = BoardManager.toggleDisplayMode;
      BoardManager.toggleDisplayMode = function(showNumbers) {
        // Call original function
        originalToggleMode.call(this, showNumbers);
        
        // Re-add barrels after mode change
        setTimeout(() => {
          if (USE_ENHANCED_BARREL_VERSION && !showNumbers) {
            addBarrelsToTowers();
          }
        }, 100);
      };
    }
  }

  /**
   * Function to add barrels to all towers
   * Used by both the event handlers and utility function
   */
  function addBarrelsToTowers() {
    const towerElements = document.querySelectorAll('.tower');
    towerElements.forEach(towerElement => {
      // Skip if already has a barrel
      if (towerElement.querySelector('.tower-barrel')) return;
      
      // Get tower type from the parent cell's data attribute or the tower's class
      let towerType = 1; // Default to type 1
      const cellElement = towerElement.closest('.sudoku-cell');
      if (cellElement) {
        const cellValue = cellElement.getAttribute('data-value');
        if (cellValue && !isNaN(parseInt(cellValue))) {
          towerType = parseInt(cellValue);
        }
      }
      
      // For tower classes like 'tower-1', 'tower-2', etc.
      const towerClassMatch = Array.from(towerElement.classList)
        .find(cls => cls.startsWith('tower-') && !isNaN(parseInt(cls.replace('tower-', ''))));
      if (towerClassMatch) {
        towerType = parseInt(towerClassMatch.replace('tower-', ''));
      }
      
      // Create barrel element
      const barrelElement = document.createElement('div');
      barrelElement.className = 'tower-barrel';
      barrelElement.setAttribute('data-type', towerType);
      
      // Set the background image and position based on tower type
      const spritePos = spritePositions[towerType] || { x: 0, y: 0 };
      barrelElement.style.backgroundImage = 'url("assets/aimsheet3.png")';
      barrelElement.style.backgroundSize = '96px 96px';
      barrelElement.style.backgroundPosition = `${spritePos.x}px ${spritePos.y}px`;
      barrelElement.style.backgroundRepeat = 'no-repeat';
      barrelElement.style.imageRendering = 'pixelated';
      
      towerElement.appendChild(barrelElement);
    });
    return towerElements.length;
  }
  
  // Initialize the tower rotation system after a delay to ensure other modules are loaded
  setTimeout(initTowerRotation, 1000);
  
  // Expose utilities to the global scope for debugging
  window.TowerRotationUtils = {
    initialize: initTowerRotation,
    addBarrelsToAllTowers: function() {
      const count = addBarrelsToTowers();
      return `Added barrels to ${count} towers`;
    }
  };
})();

export {};
