/**
 * ability-system.js - Adds rogue-like abilities, character classes, and progression
 * This module enhances Sudoku Tower Defense with character selection, special abilities,
 * mana management, and an experience/leveling system.
 */
 
 

const AbilitySystem = (function() {
    // Private variables
    let currentCharacter = null;
    let currentMana = 10;
    let maxMana = 10;
    let playerLevel = 1;
    let playerExperience = 0;
    let experienceToNextLevel = 100;
    let abilities = [];
    let characterSelected = false;

    // Define character classes with their unique abilities
    const characters = {
        strategist: {
            name: "Strategist",
            description: "Master of battlefield control and enemy redirection.",
            icon: "🧠",
            color: "#7e57c2",
            baseMaxMana: 10,
            startingMana: 10,
            uniqueAbility: {
                id: "redirect_path",
                name: "Redirect Path",
                description: "Generates a new path for enemies to follow",
                manaCost: 5,
                icon: "↪️",
                cooldown: 0,
                execute: function() {
                    if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
                        BoardManager.generateEnemyPath();
                        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Enemy path redirected!");
                        return true;
                    } else if (window.SudokuModule && typeof SudokuModule.generateEnemyPath === 'function') {
                        SudokuModule.generateEnemyPath();
                        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Enemy path redirected!");
                        return true;
                    }
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Failed to redirect path!");
                    return false;
                }
            }
        },
        engineer: {
            name: "Engineer",
            description: "Tower specialist focusing on enhancement and efficiency.",
            icon: "⚙️",
            color: "#ff9800",
            baseMaxMana: 10,
            startingMana: 10,
            uniqueAbility: {
                id: "power_surge",
                name: "Power Surge",
                description: "Temporarily doubles all tower damage",
                manaCost: 6,
                icon: "⚡",
                cooldown: 0,
                execute: function() {
                    // Get all towers
                    if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
                        const towers = TowersModule.getTowers();
                        
                        // Temporarily boost each tower's damage
                        towers.forEach(tower => {
                            tower.originalDamage = tower.damage;
                            tower.damage *= 2;
                        });
                        
                        // Show effect indicator
                        showEffectIndicator("Power Surge", "All towers deal 2x damage for 10 seconds!");
                        
                        // Reset after 10 seconds
                        setTimeout(() => {
                            towers.forEach(tower => {
                                if (tower.originalDamage) {
                                    tower.damage = tower.originalDamage;
                                    delete tower.originalDamage;
                                }
                            });
                            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Power Surge ended");
                        }, 10000);
                        
                        return true;
                    }
                    return false;
                }
            }
        },
        tactician: {
            name: "Tactician",
            description: "Combat specialist with powerful offensive abilities.",
            icon: "🎯",
            color: "#f44336",
            baseMaxMana: 10,
            startingMana: 10,
            uniqueAbility: {
                id: "precision_strike",
                name: "Precision Strike",
                description: "Deal heavy damage to all enemies on screen",
                manaCost: 7,
                icon: "💥",
                cooldown: 0,
                execute: function() {
                    if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
                        const enemies = EnemiesModule.getEnemies();
                        let count = 0;
                        
                        // Damage each enemy
                        enemies.forEach(enemy => {
                            const damage = enemy.maxHealth * 0.3; // 30% max health damage
                            if (EnemiesModule.damageEnemy(enemy.id, damage)) {
                                count++;
                            }
                        });
                        
                        // Visual effect
                        showDamageFlash();
                        
                        EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                            `Precision Strike hit ${enemies.length} enemies` + 
                            (count > 0 ? `, defeating ${count}!` : "!"));
                        return true;
                    }
                    return false;
                }
            }
        },
        mystic: {
            name: "Mystic",
            description: "Manipulator of time and space with temporal abilities.",
            icon: "🔮",
            color: "#9c27b0",
            baseMaxMana: 10,
            startingMana: 10,
            uniqueAbility: {
                id: "time_warp",
                name: "Time Warp",
                description: "Slows all enemies by 50% for 8 seconds",
                manaCost: 5,
                icon: "⏱️",
                cooldown: 0,
                execute: function() {
                    if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
                        const enemies = EnemiesModule.getEnemies();
                        
                        // Slow each enemy
                        enemies.forEach(enemy => {
                            enemy.originalSpeed = enemy.speed;
                            enemy.speed *= 0.5; // 50% slower
                        });
                        
                        // Visual effect
                        showEffectIndicator("Time Warp", "Enemies slowed by 50% for 8 seconds!");
                        
                        // Reset after 8 seconds
                        setTimeout(() => {
                            EnemiesModule.getEnemies().forEach(enemy => {
                                if (enemy.originalSpeed) {
                                    enemy.speed = enemy.originalSpeed;
                                    delete enemy.originalSpeed;
                                }
                            });
                            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Time Warp ended");
                        }, 8000);
                        
                        return true;
                    }
                    return false;
                }
            }
        },
        arithmetician: {
            name: "Arithmetician",
            description: "Sudoku specialist with puzzle-solving powers.",
            icon: "🔢",
            color: "#4caf50",
            baseMaxMana: 10,
            startingMana: 10,
            uniqueAbility: {
                id: "number_insight",
                name: "Number Insight",
                description: "Reveals 3 correct cells in the puzzle",
                manaCost: 4,
                icon: "💡",
                cooldown: 0,
                execute: function() {
                    const boardManager = window.BoardManager || window.SudokuModule;
                    if (!boardManager) return false;
                    
                    const board = boardManager.getBoard();
                    const solution = boardManager.getSolution();
                    const pathCells = boardManager.getPathCells();
                    
                    // Find empty cells that aren't on the path
                    const emptyCells = [];
                    
                    for (let row = 0; row < 9; row++) {
                        for (let col = 0; col < 9; col++) {
                            if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
                                emptyCells.push({
                                    row: row,
                                    col: col,
                                    value: solution[row][col]
                                });
                            }
                        }
                    }
                    
                    if (emptyCells.length === 0) {
                        EventSystem.publish(GameEvents.STATUS_MESSAGE, "No empty cells to reveal!");
                        return false;
                    }
                    
                    // Shuffle and take up to 3 cells
                    shuffleArray(emptyCells);
                    const cellsToReveal = emptyCells.slice(0, Math.min(3, emptyCells.length));
                    
                    // Place towers in these cells
                    cellsToReveal.forEach(cell => {
                        if (window.TowersModule && typeof TowersModule.createTower === 'function') {
                            TowersModule.createTower(cell.value, cell.row, cell.col);
                        } else {
                            // Fallback - update the board directly
                            boardManager.setCellValue(cell.row, cell.col, cell.value);
                        }
                        
                        // Highlight the cell
                        const cellElement = document.querySelector(`.sudoku-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
                        if (cellElement) {
                            cellElement.classList.add('ability-highlight');
                            setTimeout(() => {
                                cellElement.classList.remove('ability-highlight');
                            }, 3000);
                        }
                    });
                    
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                        `Revealed ${cellsToReveal.length} correct numbers!`);
                    return true;
                }
            }
        }
    };

    // Common abilities available to all characters
    const commonAbilities = [
        {
            id: "emergency_repair",
            name: "Emergency Repair",
            description: "Gain 1 life",
            manaCost: 8,
            icon: "❤️",
            cooldown: 0,
            execute: function() {
                if (window.PlayerModule && typeof PlayerModule.addLife === 'function') {
                    PlayerModule.addLife(1);
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Gained 1 life!");
                    return true;
                }
                return false;
            }
        },
        {
            id: "gold_rush",
            name: "Gold Rush",
            description: "Gain 50 currency",
            manaCost: 3,
            icon: "💰",
            cooldown: 0,
            execute: function() {
                if (window.PlayerModule && typeof PlayerModule.addCurrency === 'function') {
                    PlayerModule.addCurrency(50);
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Gained 50 currency!");
                    return true;
                }
                return false;
            }
        },
        {
            id: "quick_thinking",
            name: "Quick Thinking",
            description: "Reset all tower cooldowns",
            manaCost: 4,
            icon: "⚡",
            cooldown: 0,
            execute: function() {
                if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
                    const towers = TowersModule.getTowers();
                    let count = 0;
                    
                    towers.forEach(tower => {
                        if (tower.attackCooldown > 0) {
                            tower.attackCooldown = 0;
                            count++;
                        }
                    });
                    
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                        `Reset cooldowns for ${count} towers!`);
                    return count > 0;
                }
                return false;
            }
        },
        {
            id: "clear_mistakes",
            name: "Clear Mistakes",
            description: "Remove all incorrect towers with full refund",
            manaCost: 6,
            icon: "🧹",
            cooldown: 0,
            execute: function() {
                if (window.TowersModule && typeof TowersModule.getTowers === 'function' && 
                    typeof TowersModule.removeTower === 'function') {
                    
                    const towers = TowersModule.getTowers();
                    const boardManager = window.BoardManager || window.SudokuModule;
                    if (!boardManager || typeof boardManager.getSolution !== 'function') return false;
                    
                    const solution = boardManager.getSolution();
                    let count = 0;
                    let refundAmount = 0;
                    
                    // Find incorrect towers
                    const incorrectTowers = towers.filter(tower => {
                        // Skip special towers
                        if (tower.type === 'special') return false;
                        
                        // Check if the tower matches the solution
                        const towerValue = parseInt(tower.type);
                        if (isNaN(towerValue)) return false;
                        
                        const correctValue = solution[tower.row][tower.col];
                        return towerValue !== correctValue;
                    });
                    
                    // Give full refund for each incorrect tower
                    incorrectTowers.forEach(tower => {
                        // Calculate refund (base cost + upgrades)
                        const towerTypeData = TowersModule.getTowerTypeData(tower.type);
                        if (towerTypeData) {
                            const baseCost = towerTypeData.cost;
                            const upgradeCost = baseCost * 0.75 * (tower.level - 1);
                            refundAmount += baseCost + upgradeCost;
                        }
                        
                        // Remove the tower
                        TowersModule.removeTower(tower.id);
                        count++;
                    });
                    
                    // Add refund
                    if (count > 0 && refundAmount > 0 && 
                        window.PlayerModule && typeof PlayerModule.addCurrency === 'function') {
                        PlayerModule.addCurrency(Math.floor(refundAmount));
                    }
                    
                    EventSystem.publish(GameEvents.STATUS_MESSAGE, 
                        `Removed ${count} incorrect towers with ${Math.floor(refundAmount)} currency refund!`);
                    return count > 0;
                }
                return false;
            }
        }
    ];

    /**
     * Initialize the ability system
     */
    function init() {
        console.log("Ability System initializing...");
        
        // Load any saved state
        loadState();
        
        // Create UI
        createUI();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log("Ability System initialized");
    }

    /**
     * Create UI elements for ability system
     */
    function createUI() {
        createStyles();
        createCharacterSelectionUI();
        createAbilityBarUI();
        createExperienceBarUI();
    }

    /**
     * Create CSS styles for the ability system
     */
    // Update this portion of the createStyles function in ability-system.js

function createStyles() {
  if (document.getElementById('ability-system-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ability-system-styles';
  style.textContent = `
        /* Character Selection */
        .character-selection {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .character-selection-content {
            background-color: #1a1a1a;
            border-radius: 10px;
            padding: 20px;
            color: white;
            max-width: 90%;
            width: 90%;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .character-selection-title {
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
            color: gold;
        }
        
        .character-cards {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
            gap: 15px;
            padding-bottom: 15px;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
            scrollbar-width: thin;
            scrollbar-color: #555 #222;
        }
        
        .character-cards::-webkit-scrollbar {
            height: 8px;
        }
        
        .character-cards::-webkit-scrollbar-thumb {
            background-color: #555;
            border-radius: 4px;
        }
        
        .character-cards::-webkit-scrollbar-track {
            background-color: #222;
            border-radius: 4px;
        }
        
        .character-card {
            background-color: #333;
            border-radius: 8px;
            padding: 15px;
            min-width: 220px;
            max-width: 220px;
            flex: 0 0 auto;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            border: 2px solid transparent;
            scroll-snap-align: start;
        }
        
        .character-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .character-card.selected {
            border-color: gold;
        }
        
        .character-icon {
            font-size: 36px;
            text-align: center;
            margin-bottom: 10px;
        }
        
        .character-name {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        
        .character-description {
            font-size: 14px;
            text-align: center;
            margin-bottom: 10px;
            color: #ccc;
            min-height: 60px;
        }
        
        .character-ability {
            background-color: rgba(255, 255, 255, 0.1);
            padding: 8px;
            border-radius: 5px;
        }
        
        .character-ability-title {
            font-size: 14px;
            font-weight: bold;
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .character-ability-icon {
            margin-right: 5px;
        }
        
        .character-ability-description {
            font-size: 12px;
            color: #ccc;
        }
        
        .character-select-button {
            background-color: gold;
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        
        .character-select-button:disabled {
            background-color: #555;
            cursor: not-allowed;
        }
        
        /* Mobile specific adjustments */
        @media (max-width: 768px) {
            .character-selection-content {
                padding: 15px;
                max-height: 90vh;
            }
            
            .character-selection-title {
                font-size: 20px;
                margin-bottom: 15px;
            }
            
            .character-card {
                min-width: 200px;
                max-width: 200px;
                padding: 12px;
            }
            
            .character-icon {
                font-size: 30px;
            }
            
            .character-name {
                font-size: 16px;
            }
            
            .character-description {
                font-size: 12px;
            }
            
            .character-ability-title {
                font-size: 12px;
            }
            
            .character-ability-description {
                font-size: 10px;
            }
            
            .character-select-button {
                padding: 8px 16px;
                font-size: 14px;
            }
        }
        
/* === Updated Scroll Arrows for Character Carousel === */
.scroll-indicator {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    color: white;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s, background-color 0.3s;
    pointer-events: auto;
}

.scroll-indicator:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
}

.scroll-left {
    left: 10px;
}

.scroll-right {
    right: 10px;
}
        
        /* Rest of your existing styles... */
        /* Ability Bar */
        .ability-bar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            padding: 10px;
            display: flex;
            gap: 10px;
            z-index: 900;
        }
            
            .ability-slot {
                width: 60px;
                height: 60px;
                background-color: #333;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                transition: transform 0.1s;
                border: 2px solid transparent;
            }
            
            .ability-slot:hover {
                border-color: white;
            }
            
            .ability-slot.active:hover {
                transform: scale(1.05);
            }
            
            .ability-slot.active {
                border-color: gold;
            }
            
            .ability-slot.inactive {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .ability-icon {
                font-size: 24px;
                margin-bottom: 2px;
            }
            
            .ability-cost {
                font-size: 12px;
                color: #aaf;
                background-color: rgba(0, 0, 0, 0.5);
                padding: 2px 5px;
                border-radius: 10px;
                position: absolute;
                bottom: -5px;
            }
            
            .ability-cooldown {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0%;
                background-color: rgba(100, 100, 255, 0.3);
                border-radius: 0 0 8px 8px;
            }
            
            .ability-tooltip {
                position: absolute;
                bottom: 70px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 12px;
                white-space: nowrap;
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: none;
                z-index: 901;
            }
            
            .ability-slot:hover .ability-tooltip {
                visibility: visible;
                opacity: 1;
            }
            
            /* Mana bar */
            .mana-bar-container {
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                height: 5px;
                background-color: #111;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .mana-bar-fill {
                height: 100%;
                background-color: #4477ff;
                transition: width 0.3s;
            }
            
            .mana-text {
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                color: white;
                white-space: nowrap;
                text-shadow: 0 0 3px black;
            }
            
            /* Experience bar */
            .experience-bar {
                position: fixed;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 5px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 3px;
                overflow: hidden;
                z-index: 899;
            }
            
            .experience-fill {
                height: 100%;
                background-color: #4caf50;
                transition: width 0.3s;
            }
            
            .experience-text {
                position: absolute;
                bottom: -3px;
                left: 0;
                font-size: 10px;
                color: white;
                text-shadow: 0 0 3px black;
                padding: 2px 5px;
            }
            
            .level-up-effect {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, rgba(0, 0, 0, 0) 70%);
                z-index: 898;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.5s;
            }
            
            /* Character indicator */
            .character-indicator {
                position: fixed;
                bottom: 90px;
                right: 10px;
                background-color: rgba(0, 0, 0, 0.7);
                padding: 8px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                color: white;
                font-size: 12px;
                z-index: 899;
            }
            
            .character-indicator-icon {
                font-size: 20px;
                margin-right: 5px;
            }
            
            /* Effects */
            .effect-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                text-align: center;
                z-index: 950;
                pointer-events: none;
                animation: fade-in-out 2.5s forwards;
            }
            
            .effect-indicator-title {
                font-size: 24px;
                margin-bottom: 5px;
                color: gold;
            }
            
            .effect-indicator-desc {
                font-size: 16px;
            }
            
            .damage-flash {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 0, 0, 0.2);
                z-index: 950;
                pointer-events: none;
                animation: flash 0.3s forwards;
            }
            
            .ability-highlight {
                animation: highlight-pulse 1s infinite;
            }
            
            @keyframes highlight-pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
            }
            
            @keyframes fade-in-out {
                0% { opacity: 0; transform: translate(-50%, -70%); }
                10% { opacity: 1; transform: translate(-50%, -50%); }
                80% { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -30%); }
            }
            
            @keyframes flash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Create character selection UI
     */
    /**
 * Create character selection UI with improved mobile support
 */
function createCharacterSelectionUI() {
  if (document.getElementById('character-selection') || characterSelected) return;
  
  const selectionScreen = document.createElement('div');
  selectionScreen.className = 'character-selection';
  selectionScreen.id = 'character-selection';
  
  const content = document.createElement('div');
  content.className = 'character-selection-content';
  
  const title = document.createElement('div');
  title.className = 'character-selection-title';
  title.textContent = 'Choose Your Character';
  
  const scrollLeft = document.createElement('div');
  scrollLeft.className = 'scroll-indicator scroll-left';
  scrollLeft.innerHTML = '←';
  
  const scrollRight = document.createElement('div');
  scrollRight.className = 'scroll-indicator scroll-right';
  scrollRight.innerHTML = '→';
  
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'character-cards';
  
  let selectedCharacterId = null;
  
  Object.entries(characters).forEach(([id, char]) => {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.character = id;
    
    card.innerHTML = `
      <div class="character-icon" style="color: ${char.color}">${char.icon}</div>
      <div class="character-name" style="color: ${char.color}">${char.name}</div>
      <div class="character-description">${char.description}</div>
      <div class="character-ability">
        <div class="character-ability-title">
          <span class="character-ability-icon">${char.uniqueAbility.icon}</span>
          ${char.uniqueAbility.name}
        </div>
        <div class="character-ability-description">${char.uniqueAbility.description}</div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCharacterId = id;
      selectBtn.disabled = false;
    });
    
    cardsContainer.appendChild(card);
  });
  
  scrollLeft.addEventListener('click', () => {
    cardsContainer.scrollBy({ left: -240, behavior: 'smooth' });
  });
  
  scrollRight.addEventListener('click', () => {
    cardsContainer.scrollBy({ left: 240, behavior: 'smooth' });
  });
  
  const selectBtn = document.createElement('button');
  selectBtn.id = 'select-character-btn';
  selectBtn.className = 'character-select-button';
  selectBtn.textContent = 'Select Character';
  selectBtn.disabled = true;
  
  selectBtn.addEventListener('click', () => {
    if (!selectedCharacterId) return;
    const success = AbilitySystem.selectCharacter(selectedCharacterId);
    if (success) selectionScreen.remove();
  });
  
  content.appendChild(title);
  content.appendChild(scrollLeft);
  content.appendChild(scrollRight);
  content.appendChild(cardsContainer);
  content.appendChild(selectBtn);
  selectionScreen.appendChild(content);
  document.body.appendChild(selectionScreen);
  
  // Scroll indicator visibility
  const updateScrollIndicators = () => {
    const scrollLeftVal = cardsContainer.scrollLeft;
    const maxScroll = cardsContainer.scrollWidth - cardsContainer.clientWidth;
    scrollLeft.style.opacity = scrollLeftVal <= 10 ? '0.3' : '1';
    scrollRight.style.opacity = scrollLeftVal >= maxScroll - 10 ? '0.3' : '1';
  };
  
  cardsContainer.addEventListener('scroll', updateScrollIndicators);
  window.addEventListener('resize', updateScrollIndicators);
  setTimeout(updateScrollIndicators, 100);
}
    /**
     * Create ability bar UI
     */
    function createAbilityBarUI() {
        // Check if ability bar already exists
        if (document.getElementById('ability-bar')) return;
        
        const abilityBar = document.createElement('div');
        abilityBar.className = 'ability-bar';
        abilityBar.id = 'ability-bar';
        
        // Initially, the bar will be empty until a character is selected
        abilityBar.innerHTML = `
            <div class="mana-bar-container">
                <div class="mana-bar-fill" style="width: 100%"></div>
            </div>
            <div class="mana-text">Mana: 10/10</div>
        `;
        
        document.body.appendChild(abilityBar);
        
        // Hide until character is selected
        abilityBar.style.display = 'none';
    }

    /**
     * Create experience bar UI
     */
    function createExperienceBarUI() {
        // Check if experience bar already exists
        if (document.getElementById('experience-bar')) return;
        
        const experienceBar = document.createElement('div');
        experienceBar.className = 'experience-bar';
        experienceBar.id = 'experience-bar';
        
        experienceBar.innerHTML = `
            <div class="experience-fill" style="width: 0%"></div>
            <div class="experience-text">Level 1</div>
        `;
        
        document.body.appendChild(experienceBar);
        
        // Create level up effect element
        const levelUpEffect = document.createElement('div');
        levelUpEffect.className = 'level-up-effect';
        levelUpEffect.id = 'level-up-effect';
        document.body.appendChild(levelUpEffect);
        
        // Hide until character is selected
        experienceBar.style.display = 'none';
    }

    /**
     * Create character indicator UI
     */
    function createCharacterIndicatorUI() {
        // Check if indicator already exists
        if (document.getElementById('character-indicator')) return;
        
        const characterIndicator = document.createElement('div');
        characterIndicator.className = 'character-indicator';
        characterIndicator.id = 'character-indicator';
        
        if (currentCharacter) {
            const character = characters[currentCharacter];
            characterIndicator.innerHTML = `
                <div class="character-indicator-icon" style="color: ${character.color}">${character.icon}</div>
                <div class="character-indicator-name">${character.name}</div>
            `;
        }
        
        
        
        document.body.appendChild(characterIndicator);
    }

    /**
     * Load saved state
     */
    /**
 * Load saved state
 */
function loadState() {
  try {
    const savedCharacter = localStorage.getItem('sudoku_td_character');
    if (savedCharacter && characters.hasOwnProperty(savedCharacter)) {
      currentCharacter = savedCharacter;
      characterSelected = true;
    } else {
      currentCharacter = null;
      characterSelected = false;
    }
    
    
    // Load level
    const savedLevel = parseInt(localStorage.getItem('sudoku_td_ability_level'));
    if (!isNaN(savedLevel) && savedLevel > 0) {
      playerLevel = savedLevel;
      maxMana = 10 + Math.floor(playerLevel / 5);
    }
    
    console.log("Ability System: Loaded saved state, character:", currentCharacter, "level:", playerLevel);
  } catch (e) {
  console.error("Error loading ability system state:", e);
  currentCharacter = null;
  characterSelected = false;

  }
}

    /**
     * Select a character
     * @param {string} characterId - ID of the character to select
     */
    function selectCharacter(characterId) {
        if (!characters[characterId]) {
  console.warn("Character not found:", characterId);
  return false;
}
        
        console.log("Selecting character:", characterId);
        
        currentCharacter = characterId;
        characterSelected = true;
        
        const character = characters[characterId];
        
        // Set initial mana
        maxMana = character.baseMaxMana + Math.floor(playerLevel / 5);
        currentMana = character.startingMana;
        
        // Set up abilities
        setupAbilities();
        
        // Save selection
        localStorage.setItem('sudoku_td_character', characterId);
        
        // Show ability bar and experience bar
        const abilityBar = document.getElementById('ability-bar');
        if (abilityBar) abilityBar.style.display = 'flex';
        
        const experienceBar = document.getElementById('experience-bar');
        if (experienceBar) experienceBar.style.display = 'block';
        
        // Create character indicator
        createCharacterIndicatorUI();
        
        return true;
    }

    /**
     * Set up abilities based on selected character
     */
    function setupAbilities() {
        if (!currentCharacter) return;
        
        abilities = [];
        
        // Add character's unique ability
        const uniqueAbility = characters[currentCharacter].uniqueAbility;
        abilities.push(uniqueAbility);
        
        // Add common abilities
        abilities = abilities.concat(commonAbilities);
        
        // Update ability bar UI
        updateAbilityBarUI();
    }

    /**
     * Update ability bar UI with current abilities
     */
    function updateAbilityBarUI() {
        const abilityBar = document.getElementById('ability-bar');
        if (!abilityBar) return;
        
        // Clear existing ability slots
        const existingSlots = abilityBar.querySelectorAll('.ability-slot');
        existingSlots.forEach(slot => slot.remove());
        
        // Add ability slots
        abilities.forEach((ability, index) => {
            const slot = document.createElement('div');
            slot.className = 'ability-slot';
            slot.classList.add(currentMana >= ability.manaCost ? 'active' : 'inactive');
            slot.dataset.abilityIndex = index;
            
            slot.innerHTML = `
                <div class="ability-icon">${ability.icon}</div>
                <div class="ability-cost">${ability.manaCost}</div>
                <div class="ability-tooltip">${ability.name}: ${ability.description}</div>
                <div class="ability-cooldown" style="height: ${ability.cooldown > 0 ? '100%' : '0%'}"></div>
            `;
            
            // Add click handler
            slot.addEventListener('click', function() {
                const abilityIndex = parseInt(this.dataset.abilityIndex);
                if (!isNaN(abilityIndex) && abilityIndex >= 0 && abilityIndex < abilities.length) {
                    useAbility(abilityIndex);
                }
            });
            
            // Insert before mana bar
            const manaBar = abilityBar.querySelector('.mana-bar-container');
            if (manaBar) {
                abilityBar.insertBefore(slot, manaBar);
            } else {
                abilityBar.appendChild(slot);
            }
        });
        
        // Update mana display
        updateManaDisplay();
    }

    /**
     * Update mana display
     */
    function updateManaDisplay() {
        const manaBarFill = document.querySelector('.mana-bar-fill');
        const manaText = document.querySelector('.mana-text');
        
        if (manaBarFill) {
            manaBarFill.style.width = `${(currentMana / maxMana) * 100}%`;
        }
        
        if (manaText) {
            manaText.textContent = `Mana: ${currentMana}/${maxMana}`;
        }
        
        // Update ability slots active/inactive state
        const abilitySlots = document.querySelectorAll('.ability-slot');
        abilitySlots.forEach((slot, index) => {
            if (index < abilities.length) {
                const ability = abilities[index];
                if (currentMana >= ability.manaCost && ability.cooldown <= 0) {
                    slot.classList.remove('inactive');
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('active');
                    slot.classList.add('inactive');
                }
            }
        });
    }

    /**
     * Reset mana to maximum (called after wave completion)
     */
    function resetMana() {
        currentMana = maxMana;
        updateManaDisplay();
        console.log("Ability System: Mana reset to maximum:", currentMana);
    }

    /**
     * Add experience points
     * @param {number} amount - Amount of experience to add
     */
    function addExperience(amount) {
        playerExperience += amount;
        
        // Check for level up
        while (playerExperience >= experienceToNextLevel) {
            levelUp();
        }
        
        // Update experience bar
        updateExperienceBar();
    }

    /**
     * Update experience bar display
     */
    function updateExperienceBar() {
        const experienceFill = document.querySelector('.experience-fill');
        const experienceText = document.querySelector('.experience-text');
        
        if (experienceFill) {
            const percentage = (playerExperience / experienceToNextLevel) * 100;
            experienceFill.style.width = `${percentage}%`;
        }
        
        if (experienceText) {
            experienceText.textContent = `Level ${playerLevel} (${playerExperience}/${experienceToNextLevel})`;
        }
    }

    /**
     * Level up the player
     */
    function levelUp() {
        playerLevel++;
        playerExperience -= experienceToNextLevel;
        
        // Increase experience required for next level
        experienceToNextLevel = Math.floor(100 * Math.pow(1.1, playerLevel - 1));
        
        // Increase max mana every 5 levels
        if (playerLevel % 5 === 0) {
            maxMana++;
            currentMana = maxMana;
            
            // Update mana display
            updateManaDisplay();
        }
        
        // Save level
        localStorage.setItem('sudoku_td_ability_level', playerLevel.toString());
        
        // Show level up effect
        showLevelUpEffect();
        
        console.log(`Ability System: Level up to ${playerLevel}! Max mana: ${maxMana}`);
    }

    /**
     * Show level up effect
     */
    function showLevelUpEffect() {
        const levelUpEffect = document.getElementById('level-up-effect');
        if (levelUpEffect) {
            levelUpEffect.style.opacity = '1';
            
            // Add announcement
            const announcement = document.createElement('div');
            announcement.className = 'effect-indicator';
            announcement.innerHTML = `
                <div class="effect-indicator-title">Level Up!</div>
                <div class="effect-indicator-desc">You are now level ${playerLevel}</div>
            `;
            
            document.body.appendChild(announcement);
            
            // Hide after animation
            setTimeout(() => {
                levelUpEffect.style.opacity = '0';
            }, 3000);
        }
    }

    /**
     * Use an ability
     * @param {number} index - Index of the ability to use
     */
    function useAbility(index) {
        if (index < 0 || index >= abilities.length) return false;
        
        const ability = abilities[index];
        
        // Check mana cost
        if (currentMana < ability.manaCost) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Not enough mana!");
            return false;
        }
        
        // Check cooldown
        if (ability.cooldown > 0) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Ability is on cooldown!");
            return false;
        }
        
        // Execute ability
        console.log(`Using ability: ${ability.name}`);
        const success = ability.execute();
        
        // If ability was used successfully
        if (success) {
            // Spend mana
            currentMana -= ability.manaCost;
            
            // Apply cooldown if specified
            if (ability.cooldownDuration) {
                ability.cooldown = ability.cooldownDuration;
            }
            
            // Update displays
            updateManaDisplay();
            
            return true;
        }
        
        return false;
    }

    /**
     * Show effect indicator
     * @param {string} title - Effect title
     * @param {string} description - Effect description
     */
    function showEffectIndicator(title, description) {
        const indicator = document.createElement('div');
        indicator.className = 'effect-indicator';
        indicator.innerHTML = `
            <div class="effect-indicator-title">${title}</div>
            <div class="effect-indicator-desc">${description}</div>
        `;
        
        document.body.appendChild(indicator);
    }

    /**
     * Show damage flash effect
     */
    function showDamageFlash() {
        const flash = document.createElement('div');
        flash.className = 'damage-flash';
        document.body.appendChild(flash);
        
        // Remove after animation completes
        setTimeout(() => {
            flash.remove();
        }, 300);
    }

    /**
     * Update experience based on score
     * @param {number} score - Current score
     */
    function updateExperienceFromScore(score) {
        // Get last processed score
        const lastScore = parseInt(localStorage.getItem('sudoku_td_last_processed_score') || '0');
        
        // If score increased, add experience
        if (score > lastScore) {
            const newExperience = Math.floor((score - lastScore) / 10);
            if (newExperience > 0) {
                addExperience(newExperience);
            }
            
            // Save processed score
            localStorage.setItem('sudoku_td_last_processed_score', score.toString());
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Cooldown timer
        setInterval(() => {
            let updated = false;
            
            abilities.forEach(ability => {
                if (ability.cooldown > 0) {
                    ability.cooldown -= 0.1; // Reduce cooldown
                    if (ability.cooldown < 0) ability.cooldown = 0;
                    updated = true;
                }
            });
            
            if (updated) {
                // Update cooldown visuals
                const cooldownElements = document.querySelectorAll('.ability-cooldown');
                abilities.forEach((ability, index) => {
                    if (index < cooldownElements.length) {
                        const cooldownElement = cooldownElements[index];
                        const percentage = ability.cooldown / (ability.cooldownDuration || 1) * 100;
                        cooldownElement.style.height = `${percentage}%`;
                    }
                });
                
                // Update ability states
                updateManaDisplay();
            }
        }, 100);
    }

    /**
     * Helper function to shuffle array
     * @param {Array} array - Array to shuffle
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Public API
    return {
        init: init,
        resetMana: resetMana,
        addExperience: addExperience,
        updateExperienceFromScore: updateExperienceFromScore,
        useAbility: useAbility,
        selectCharacter: selectCharacter,
        getCurrentCharacter: function() { return currentCharacter; },
        getPlayerLevel: function() { return playerLevel; },
        getMana: function() { return { current: currentMana, max: maxMana }; }
    };
})();

// Make sure the module is available globally
console.log("Registering AbilitySystem globally");
window.AbilitySystem = AbilitySystem;

// Log availability
console.log("AbilitySystem module registered:", !!window.AbilitySystem);

// Auto-initialize after a delay
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded for ability system");
    
    // Force display character selection if not shown after a delay
    setTimeout(function() {
        console.log("Force checking for character selection");
        if (!AbilitySystem.getCurrentCharacter()) {
            console.log("Character not selected, forcing character selection UI");
            if (typeof AbilitySystem.init === 'function') {
                AbilitySystem.init();
            }
        }
    }, 1000);
});