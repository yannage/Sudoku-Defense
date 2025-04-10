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
    
    // Determine which version to load
    if (USE_ENHANCED_BARREL_VERSION) {
      loadEnhancedBarrelSystem();
    } else {
      loadBasicRotationSystem();
    }
    
    // Setup event handling for game state changes
    setupEventHandlers();
  }
  
  /**
   * Load the basic tower rotation system
   */
  function loadBasicRotationSystem() {
    // Check if TowerAnimationsModule exists
    if (!window.TowerAnimationsModule) {
      console.warn("TowerAnimationsModule not found. Basic rotation system cannot be initialized.");
      return;
    }
    
    // Store the original attackEnemy function to extend it
    const originalAttackEnemy = TowerAnimationsModule.attackEnemy || window.attackEnemy;
    if (!originalAttackEnemy) {
      console.warn("Original attackEnemy function not found");
      return;
    }
    
    // Keep track of tower rotation states
    const towerRotations = {};
    
    /**
     * Calculate angle between tower and enemy
     * @param {Object} tower - The tower object
     * @param {Object} enemy - The enemy object
     * @returns {number} - Angle in degrees
     */
    function calculateAngle(tower, enemy) {
      // Calculate direction vector from tower to enemy
      const dx = enemy.col - tower.col;
      const dy = enemy.row - tower.row;
      
      // Calculate angle in radians, then convert to degrees
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      return angle;
    }
    
    /**
     * Rotate a tower element to face the target
     * @param {Object} tower - The tower object
     * @param {Object} enemy - The enemy object
     */
    function rotateTower(tower, enemy) {
      // Find the tower element
      const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"] .tower`);
      if (!towerElement) return;
      
      // Calculate angle
      const angle = calculateAngle(tower, enemy);
      
      // Apply rotation
      towerElement.style.transition = "transform 0.2s ease-out";
      towerElement.style.transformOrigin = "center center";
      towerElement.style.transform = `rotate(${angle}deg)`;
      
      // Store the rotation state
      towerRotations[tower.id] = {
        angle: angle,
        timestamp: Date.now()
      };
    }
    
    /**
     * Reset tower rotation after a delay if no new attacks
     */
    function setupRotationReset() {
      setInterval(() => {
        const now = Date.now();
        const towerElements = document.querySelectorAll('.tower');
        
        // Loop through all towers with rotations
        Object.entries(towerRotations).forEach(([towerId, data]) => {
          // If rotation is older than 2 seconds, reset it
          if (now - data.timestamp > 2000) {
            // Find the tower by ID
            const tower = window.TowersModule?.getTowers()?.find(t => t.id === towerId);
            if (!tower) return;
            
            // Find the tower element
            const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"] .tower`);
            if (!towerElement) return;
            
            // Reset rotation with transition
            towerElement.style.transition = "transform 0.5s ease-out";
            towerElement.style.transform = "rotate(0deg)";
            
            // Remove from tracking
            delete towerRotations[towerId];
          }
        });
      }, 500); // Check every half second
    }
    
    // Override the attackEnemy function in TowerAnimationsModule
    function enhancedAttackEnemy(tower, enemy) {
      // Rotate the tower to face the enemy
      rotateTower(tower, enemy);
      
      // Call the original function
      if (typeof originalAttackEnemy === 'function') {
        return originalAttackEnemy(tower, enemy);
      }
    }
    
    // Apply our enhancement by overriding the function
    TowerAnimationsModule.attackEnemy = enhancedAttackEnemy;
    
    // Setup rotation reset system
    setupRotationReset();
    
    /**
     * Also catch tower attacks via the event system to ensure we catch all attacks
     */
    EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
      if (data && data.tower && data.enemy) {
        rotateTower(data.tower, data.enemy);
      }
    });
    
    // Add CSS for better tower rotation
    const style = document.createElement('style');
    style.textContent = `
            /* Enhance towers to support better rotation */
            .tower {
                transition: transform 0.2s ease-out;
                transform-origin: center center;
                will-change: transform;
            }
            
            /* Add a small indicator to show the "front" of the tower */
            .tower::after {
                content: '';
                position: absolute;
                top: 1px;
                left: 50%;
                width: 4px;
                height: 4px;
                background-color: #fff;
                border-radius: 50%;
                transform: translateX(-50%);
                opacity: 0.8;
            }
        `;
    document.head.appendChild(style);
    
    console.log("Basic Tower Rotation System initialized");
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
    
    // Add required styles
    const style = document.createElement('style');
    style.textContent = `
      /* Tower barrel styles */
      .tower-barrel {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        z-index: 10;
        transform-origin: center center;
        transition: transform 0.2s ease-out;
        pointer-events: none;
      }
      
      /* Animation for attacking towers */
      @keyframes tower-attack-recoil {
        0% { transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1); }
        20% { transform: translate(-50%, -50%) rotate(var(--rotation)) scale(0.85); }
        100% { transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1); }
      }
      
      .tower-barrel.attacking {
        animation: tower-attack-recoil 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    
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
        barrelElement.style.backgroundImage = 'url("/assets/aimsheet.png")';
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
        barrelElement.style.backgroundImage = 'url("/assets/aimsheet.png")';
        barrelElement.style.backgroundSize = '96px 96px';
        barrelElement.style.backgroundPosition = `${spritePos.x}px ${spritePos.y}px`;
        barrelElement.style.backgroundRepeat = 'no-repeat';
        barrelElement.style.imageRendering = 'pixelated';
        
        towerElement.appendChild(barrelElement);
      }
      
      // Calculate angle
      const angle = calculateAngle(tower, enemy);
      
      // Apply rotation to the barrel
      barrelElement.style.setProperty('--rotation', `${angle}deg`);
      barrelElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      
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
      barrelElement.style.backgroundImage = 'url("/assets/aimsheet.png")';
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