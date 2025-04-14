/**
 * Updated Ability System for Sudoku Tower Defense
 * Refactored to support single unique ability per character
 */

const AbilitySystem = (function() {
  let currentCharacter = null;
  let currentMana = 10;
  let maxMana = 10;
  let playerLevel = 1;
  let playerExperience = 0;
  let experienceToNextLevel = 500;
  let characterSelected = false;

  // Import characters definition from the characters object
  // This should be defined in a separate file (characters.js)
  
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
  function createStyles() {
    if (document.getElementById('ability-system-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ability-system-styles';
    style.textContent = `
        /* === Ability Bar - Now positioned at bottom-center with fixed width === */
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
            justify-content: center;
        }
        
        .ability-slot {
            width: 70px;
            height: 70px;
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
            bottom: 80px;
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
        
        /* === Mana Bar - Horizontal at bottom-center === */
        .mana-bar-container {
            position: fixed;
            bottom: 5px;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            height: 10px;
            background-color: #111;
            border-radius: 5px;
            overflow: hidden;
            z-index: 899;
        }
        
        .mana-bar-fill {
            height: 100%;
            background-color: #4477ff;
            transition: width 0.3s;
        }
        
        /* === Experience Bar - Positioned at top-left === */
        .experience-bar {
            position: fixed;
            top: 35px;
            left: 15px;
            width: 200px;
            height: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            overflow: hidden;
            z-index: 899;
        }
        
        .experience-fill {
            height: 100%;
            background-color: #4caf50;
            transition: width 0.3s;
        }
        
        .mana-text, .experience-text {
            position: fixed;
            font-size: 12px;
            color: white;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 2px 6px;
            border-radius: 3px;
            white-space: nowrap;
            z-index: 900;
        }
        
        .mana-text {
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .experience-text {
            top: 15px;
            left: 15px;
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
        
        /* === Character Indicator - Now positioned at top-right === */
        .character-indicator {
            position: fixed;
            top: 10px;
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
        
        /* Visual Effect Classes */
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
        
        .frozen {
            filter: brightness(1.5) sepia(0.5) hue-rotate(180deg);
            animation: freeze-pulse 1.5s infinite !important;
        }
        
        .temporary-tower {
            animation: temporary-pulse 1.5s infinite !important;
        }
        
        @keyframes highlight-pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }
        
        @keyframes freeze-pulse {
            0% { filter: brightness(1.5) sepia(0.5) hue-rotate(180deg); }
            50% { filter: brightness(1.7) sepia(0.7) hue-rotate(200deg); }
            100% { filter: brightness(1.5) sepia(0.5) hue-rotate(180deg); }
        }
        
        @keyframes temporary-pulse {
            0% { box-shadow: 0 0 0 0 rgba(135, 206, 250, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(135, 206, 250, 0); }
            100% { box-shadow: 0 0 0 0 rgba(135, 206, 250, 0); }
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

            .ability-bar {
                bottom: 10px;
                padding: 5px;
            }
            
            .ability-slot {
                width: 60px;
                height: 60px;
            }
            
            .mana-bar-container, .experience-bar {
                height: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Create character selection UI
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
    
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'character-cards';
    
    let selectedCharacterId = null;
    
    // Add scroll indicators
    const scrollLeft = document.createElement('div');
    scrollLeft.className = 'scroll-indicator scroll-left';
    scrollLeft.innerHTML = '←';
    scrollLeft.style.position = 'absolute';
    scrollLeft.style.top = '50%';
    scrollLeft.style.left = '20px';
    scrollLeft.style.transform = 'translateY(-50%)';
    scrollLeft.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    scrollLeft.style.color = 'white';
    scrollLeft.style.width = '30px';
    scrollLeft.style.height = '30px';
    scrollLeft.style.borderRadius = '50%';
    scrollLeft.style.display = 'flex';
    scrollLeft.style.justifyContent = 'center';
    scrollLeft.style.alignItems = 'center';
    scrollLeft.style.cursor = 'pointer';
    scrollLeft.style.zIndex = '10000';
    
    const scrollRight = document.createElement('div');
    scrollRight.className = 'scroll-indicator scroll-right';
    scrollRight.innerHTML = '→';
    scrollRight.style.position = 'absolute';
    scrollRight.style.top = '50%';
    scrollRight.style.right = '20px';
    scrollRight.style.transform = 'translateY(-50%)';
    scrollRight.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    scrollRight.style.color = 'white';
    scrollRight.style.width = '30px';
    scrollRight.style.height = '30px';
    scrollRight.style.borderRadius = '50%';
    scrollRight.style.display = 'flex';
    scrollRight.style.justifyContent = 'center';
    scrollRight.style.alignItems = 'center';
    scrollRight.style.cursor = 'pointer';
    scrollRight.style.zIndex = '10000';
    
    scrollLeft.addEventListener('click', () => {
      cardsContainer.scrollBy({ left: -240, behavior: 'smooth' });
    });
    
    scrollRight.addEventListener('click', () => {
      cardsContainer.scrollBy({ left: 240, behavior: 'smooth' });
    });
    
    // Add character cards
    Object.entries(window.characters || characters).forEach(([id, char]) => {
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
    
    // Update scroll indicators visibility
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
   * Create ability bar UI - simplified for single ability
   */
  function createAbilityBarUI() {
    // Check if ability bar already exists
    if (document.getElementById('ability-bar')) return;
    
    const abilityBar = document.createElement('div');
    abilityBar.className = 'ability-bar';
    abilityBar.id = 'ability-bar';
    
    // Initially, the bar will be empty until a character is selected
    document.body.appendChild(abilityBar);
    
    // Create mana bar separately
    const manaBarContainer = document.createElement('div');
    manaBarContainer.className = 'mana-bar-container';
    manaBarContainer.id = 'mana-bar-container';
    
    const manaBarFill = document.createElement('div');
    manaBarFill.className = 'mana-bar-fill';
    manaBarFill.style.height = '100%';
    manaBarContainer.appendChild(manaBarFill);
    
    document.body.appendChild(manaBarContainer);
    
    // Create mana text separately
    const manaText = document.createElement('div');
    manaText.className = 'mana-text';
    manaText.id = 'mana-text';
    manaText.textContent = 'Mana: 10/10';
    document.body.appendChild(manaText);
    
    // Hide until character is selected
    abilityBar.style.display = 'none';
    manaBarContainer.style.display = 'none';
    manaText.style.display = 'none';
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
    
    const experienceFill = document.createElement('div');
    experienceFill.className = 'experience-fill';
    experienceFill.style.height = '100%';
    experienceBar.appendChild(experienceFill);
    
    document.body.appendChild(experienceBar);
    
    // Create experience text separately
    const experienceText = document.createElement('div');
    experienceText.className = 'experience-text';
    experienceText.id = 'experience-text';
    experienceText.textContent = `Level ${playerLevel} (${playerExperience}/${experienceToNextLevel})`;
    document.body.appendChild(experienceText);
    
    // Create level up effect element
    const levelUpEffect = document.createElement('div');
    levelUpEffect.className = 'level-up-effect';
    levelUpEffect.id = 'level-up-effect';
    document.body.appendChild(levelUpEffect);
    
    // Hide until character is selected
    experienceBar.style.display = 'none';
    experienceText.style.display = 'none';
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
      const character = window.characters[currentCharacter] || characters[currentCharacter];
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
  function loadState() {
    try {
      const savedCharacter = localStorage.getItem('sudoku_td_character');
      if (savedCharacter && (window.characters?.[savedCharacter] || characters?.[savedCharacter])) {
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
        // For new system, calculate max mana based on level
        const characterData = window.characters?.[currentCharacter] || characters?.[currentCharacter];
        if (characterData) {
          maxMana = characterData.baseMaxMana + Math.floor(savedLevel / 5);
        }
      }
      
      console.log("Ability System: Loaded saved state, character:", currentCharacter, "level:", playerLevel);
    } catch (e) {
      console.error("Error loading ability system state:", e);
      currentCharacter = null;
      characterSelected = false;
    }
  }
  
  /**
   * Select a character - updated for single ability system
   * @param {string} characterId - ID of the character to select
   */
  function selectCharacter(characterId) {
    const charactersObject = window.characters || characters;
    
    if (!charactersObject[characterId]) {
      console.warn("Character not found:", characterId);
      return false;
    }
    
    console.log("Selecting character:", characterId);
    
    currentCharacter = characterId;
    characterSelected = true;
    
    const character = charactersObject[characterId];
    
    // Set initial mana
    maxMana = character.baseMaxMana + Math.floor(playerLevel / 5);
    currentMana = character.startingMana;
    
    // Save selection
    localStorage.setItem('sudoku_td_character', characterId);
    
    // Show and update UI elements
    const abilityBar = document.getElementById('ability-bar');
    const manaBarContainer = document.getElementById('mana-bar-container');
    const manaText = document.getElementById('mana-text');
    const experienceBar = document.getElementById('experience-bar');
    const experienceText = document.getElementById('experience-text');
    
    if (abilityBar) abilityBar.style.display = 'flex';
    if (manaBarContainer) manaBarContainer.style.display = 'block';
    if (manaText) manaText.style.display = 'block';
    if (experienceBar) experienceBar.style.display = 'block';
    if (experienceText) experienceText.style.display = 'block';
    
    // Update ability bar with single unique ability
    updateAbilityBarUI();
    
    // Update displays
    updateManaDisplay();
    updateExperienceBar();
    
    // Recreate or update the character indicator
    const existingIndicator = document.getElementById('character-indicator');
    if (existingIndicator) existingIndicator.remove();
    createCharacterIndicatorUI();
    
    return true;
  }
  
  /**
   * Update ability bar UI with character's unique ability
   */
  function updateAbilityBarUI() {
    const abilityBar = document.getElementById('ability-bar');
    if (!abilityBar || !currentCharacter) return;
    
    // Clear existing ability slots
    abilityBar.innerHTML = '';
    
    // Get character data
    const charactersObject = window.characters || characters;
    const character = charactersObject[currentCharacter];
    if (!character) return;
    
    // Get the unique ability
    const ability = character.uniqueAbility;
    
    // Create ability slot
    const slot = document.createElement('div');
    slot.className = 'ability-slot';
    slot.classList.add(currentMana >= ability.manaCost ? 'active' : 'inactive');
    
    slot.innerHTML = `
      <div class="ability-icon">${ability.icon}</div>
      <div class="ability-cost">${ability.manaCost}</div>
      <div class="ability-tooltip">${ability.name}: ${ability.description}</div>
      <div class="ability-cooldown" style="height: ${ability.cooldown > 0 ? '100%' : '0%'}"></div>
    `;
    
    // Add click handler
    slot.addEventListener('click', function() {
      useAbility();
    });
    
    // Add to ability bar
    abilityBar.appendChild(slot);
    
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
    
    // Update ability states
    if (currentCharacter) {
      const charactersObject = window.characters || characters;
      const character = charactersObject[currentCharacter];
      const ability = character?.uniqueAbility;
      
      if (ability) {
        const abilitySlot = document.querySelector('.ability-slot');
        if (abilitySlot) {
          if (currentMana >= ability.manaCost && ability.cooldown <= 0) {
            abilitySlot.classList.remove('inactive');
            abilitySlot.classList.add('active');
          } else {
            abilitySlot.classList.remove('active');
            abilitySlot.classList.add('inactive');
          }
        }
      }
    }
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
    experienceToNextLevel = Math.floor(500 * Math.pow(1.1, playerLevel - 1));
    
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
   * Use the character's unique ability
   */
  function useAbility() {
    if (!currentCharacter) return false;
    
    const charactersObject = window.characters || characters;
    const character = charactersObject[currentCharacter];
    if (!character) return false;
    
    const ability = character.uniqueAbility;
    
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
  
  function placeTowerWithBoardSync(value, row, col, options = {}) {
  const boardManager = window.BoardManager;
  const towersModule = window.TowersModule;
  
  // Place tower in TowersModule (for defense)
  const tower = towersModule?.createTower?.(value, row, col, options);
  
  // Update the board (for Sudoku logic)
  boardManager?.setCellValue?.(row, col, value);
  
  return tower;
}
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Cooldown timer
    setInterval(() => {
      if (!currentCharacter) return;
      
      const charactersObject = window.characters || characters;
      const character = charactersObject[currentCharacter];
      if (!character) return;
      
      const ability = character.uniqueAbility;
      let updated = false;
      
      if (ability.cooldown > 0) {
        ability.cooldown -= 0.1; // Reduce cooldown
        if (ability.cooldown < 0) ability.cooldown = 0;
        updated = true;
      }
      
      if (updated) {
        // Update cooldown visual
        const cooldownElement = document.querySelector('.ability-cooldown');
        if (cooldownElement) {
          const percentage = ability.cooldown / (ability.cooldownDuration || 1) * 100;
          cooldownElement.style.height = `${percentage}%`;
        }
        
        // Update ability state
        updateManaDisplay();
      }
    }, 100);
    
    // Mana regeneration
    setInterval(() => {
      if (!currentCharacter || currentMana >= maxMana) return;
      
      // Add a small amount of mana every second. currently set to 0 to avoid mana regen
      currentMana = Math.min(maxMana, currentMana + 0);
      updateManaDisplay();
    }, 1000);
    
    // Wave completion event
    EventSystem.subscribe(GameEvents.WAVE_COMPLETE, () => {
      resetMana();
    });
    
    // Enemy defeated event
    EventSystem.subscribe(GameEvents.ENEMY_DEFEATED, (data) => {
      if (data && typeof data.reward === 'number') {
        addExperience(data.reward);
      }
    });
  }
  
  /**
   * Helper function to show effect indicator
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
   * Helper function to show damage flash effect
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
  
  // Public API
  return {
    init: init,
    resetMana: resetMana,
    addExperience: addExperience,
    useAbility: useAbility,
    selectCharacter: selectCharacter,
    getCurrentCharacter: function() { return currentCharacter; },
    getPlayerLevel: function() { return playerLevel; },
    getMana: function() { return { current: currentMana, max: maxMana }; },
    showEffectIndicator: showEffectIndicator,
    showDamageFlash: showDamageFlash
  };
})();

// Make sure these helper functions are available globally
window.showEffectIndicator = function(title, description) {
  if (AbilitySystem && typeof AbilitySystem.showEffectIndicator === 'function') {
    AbilitySystem.showEffectIndicator(title, description);
  }
};

window.showDamageFlash = function() {
  if (AbilitySystem && typeof AbilitySystem.showDamageFlash === 'function') {
    AbilitySystem.showDamageFlash();
  }
};

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