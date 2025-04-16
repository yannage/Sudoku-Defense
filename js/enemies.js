/**
 * enemies.js - Handles enemy generation, movement, and behavior
 * This module creates and manages enemy entities in the tower defense game
 * MODIFIED: Enemies now follow the grid cells exactly and match grid cell size
 */

const EnemiesModule = (function() {
    // Private variables
    let enemies = [];
    let enemyId = 0;
    let waveNumber = 1;
    let isWaveActive = false;
    let spawnInterval = null;
    let enemiesRemaining = 0;
    let path = [];
    let cellSize = 0;
    
    // Enemy types with their properties - FIXED EMOJIS
    /**
 * Enhanced enemy types with specialized behaviors
 * Each enemy type forces different tactical decisions from the player
 */
const enemyTypes = {
  // Early game enemies (simple but distinct)
  1: {
    emoji: '1️⃣',
    name: "Scout",
    health: 60,
    speed: 1.1,
    reward: 15,
    points: 5,
    behavior: "basic", // Basic movement pattern
    description: "Fast scout with low health"
  },
  2: {
    emoji: '2️⃣',
    name: "Soldier",
    health: 90,
    speed: 0.9,
    reward: 18,
    points: 7,
    behavior: "basic",
    description: "Balanced enemy with moderate health and speed"
  },
  3: {
    emoji: '3️⃣',
    name: "Armored",
    health: 80,
    speed: 0.8,
    reward: 21,
    points: 9,
    behavior: "armored", // Reduces damage taken by 30%
    armorValue: 0.3, // 30% damage reduction
    description: "Damage resistant enemy that's vulnerable to pierce towers"
  },
  4: {
    emoji: '4️⃣',
    name: "Rusher",
    health: 70,
    speed: 0.7, // Starts slow
    reward: 24,
    points: 11,
    behavior: "accelerate", // Increases speed as it takes damage
    speedRamp: 0.015, // Per percent of health lost
    maxSpeedMultiplier: 2.5, // Maximum speed multiplier
    description: "Accelerates dramatically as it takes damage"
  },
  5: {
    emoji: '5️⃣',
    name: "Splitter",
    health: 120,
    speed: 0.8,
    reward: 27,
    points: 13,
    behavior: "split", // Splits into two smaller enemies when killed
    splitInto: [1, 1], // Splits into two type 1 enemies
    description: "Splits into two smaller enemies when destroyed"
  },
  
  // Mid-game enemies (introduce more mechanics)
  6: {
    emoji: '6️⃣',
    name: "Medic",
    health: 100,
    speed: 0.9,
    reward: 30,
    points: 15,
    behavior: "heal", // Heals nearby enemies
    healRadius: 2, // Cells
    healAmount: 8, // HP per pulse
    healInterval: 3, // Seconds between heals
    description: "Heals nearby enemies - high priority target"
  },
  7: {
    emoji: '7️⃣',
    name: "Phantom",
    health: 110,
    speed: 1.0,
    reward: 33,
    points: 17,
    behavior: "phasing", // Periodically becomes immune to damage
    phaseInterval: 4, // Seconds between phases
    phaseDuration: 2, // Seconds of immunity
    description: "Periodically phases to become immune to damage"
  },
  8: {
    emoji: '8️⃣',
    name: "Teleporter",
    health: 90,
    speed: 1.0,
    reward: 36,
    points: 19,
    behavior: "teleport", // Occasionally jumps ahead on path
    teleportChance: 0.15, // 15% chance each second
    teleportDistance: 3, // Cells to jump ahead
    description: "Randomly teleports forward along the path"
  },
  9: {
    emoji: '9️⃣',
    name: "Commander",
    health: 130,
    speed: 0.8,
    reward: 39,
    points: 21,
    behavior: "buff", // Buffs nearby enemies
    buffRadius: 2, // Cells
    buffEffect: { speedBoost: 0.3 }, // 30% speed boost to nearby enemies
    description: "Increases the speed of nearby enemies"
  },
  
  // Special enemies (mini-bosses and bosses)
  'swarm_lord': {
    emoji: '🐝',
    name: "Swarm Lord",
    health: 300,
    speed: 0.6,
    reward: 80,
    points: 40,
    behavior: "summoner", // Periodically spawns smaller enemies
    summonType: 1, // Type 1 enemies
    summonCount: 3, // Number per summon
    summonInterval: 6, // Seconds between summons
    scale: 1.2, // Visual size multiplier
    isMinibloss: true,
    description: "Mini-boss that summons swarms of fast scouts"
  },
  'titan': {
    emoji: '🪨',
    name: "Titan",
    health: 450,
    speed: 0.4,
    reward: 90,
    points: 45,
    behavior: "tank", // Extremely high health, very slow
    damageReduction: 0.4, // 40% damage reduction
    vulnerabilityHitcount: 5, // After 5 hits, becomes vulnerable
    scale: 1.3,
    isMinibloss: true,
    description: "Mini-boss with extremely high health but very slow movement"
  },
  'numeromancer': {
    emoji: '🧙',
    name: "Numeromancer",
    health: 350,
    speed: 0.7,
    reward: 100,
    points: 50,
    behavior: "scrambler", // Can disable towers temporarily
    disableRadius: 2, // Cells
    disableDuration: 4, // Seconds
    disableInterval: 8, // Seconds between disables
    scale: 1.2,
    isMinibloss: true,
    description: "Mini-boss that temporarily disables nearby towers"
  },
  'boss': {
    emoji: '👹',
    name: "Void Devourer",
    health: 800,
    speed: 0.5,
    reward: 150,
    points: 100,
    behavior: "multiphase", // Has multiple phases with different behaviors
    phases: [
      { behavior: "tank", threshold: 0.7 }, // First 30% of health
      { behavior: "rage", threshold: 0.4, speedBoost: 0.5 }, // Next 30% of health
      { behavior: "desperate", threshold: 0 } // Final 40% of health
    ],
    scale: 1.5, // Visual size multiplier
    isBoss: true,
    description: "Main boss with multiple phases and devastating abilities"
  }
};

/**
 * Strategic wave patterns for different gameplay feels
 * Inspired by the pacing of roguelikes like Balatro and Dead Cells
 */
const wavePatterns = {
  // Early waves (learning/introduction)
  introduction: {
    name: "Introduction",
    composition: [1, 1, 1, 2, 2],
    spacing: 1.5, // Seconds between enemies
    pattern: "linear", // Regular spacing
    description: "Basic enemies to learn the game"
  },
  
  // Regular waves
  balanced: {
    name: "Balanced Assault",
    composition: [2, 3, 2, 4, 3, 2],
    spacing: 1.2,
    pattern: "linear",
    description: "Balanced mix of different enemy types"
  },
  swarm: {
    name: "Swarm",
    composition: [1, 1, 1, 1, 1, 2, 1, 1, 1, 1],
    spacing: 0.6, // Enemies come quickly
    pattern: "accelerating", // Gets faster
    description: "Large number of weaker enemies attacking in rapid succession"
  },
  armored: {
    name: "Armored Division",
    composition: [3, 3, 2, 3, 3],
    spacing: 1.5,
    pattern: "grouped", // Groups of enemies with pauses
    groupSize: 2,
    pauseBetweenGroups: 3, // Seconds
    description: "Groups of armored enemies with high damage resistance"
  },
  elite: {
    name: "Elite Squad",
    composition: [4, 6, 7, 9, 8],
    spacing: 2.0,
    pattern: "linear",
    description: "Fewer but more powerful enemies with special abilities"
  },
  
  // Specialty waves
  healers: {
    name: "Healing Corps",
    composition: [2, 6, 2, 6, 3, 6],
    spacing: 1.3,
    pattern: "grouped",
    groupSize: 3,
    pauseBetweenGroups: 2,
    description: "Medic enemies that heal others - target them first!"
  },
  commanders: {
    name: "Command Structure",
    composition: [9, 2, 2, 9, 2, 2],
    spacing: 1.2,
    pattern: "hierarchy", // Important enemies first, then fodder
    description: "Commander enemies boosting the speed of their followers"
  },
  teleporters: {
    name: "Blink Squad",
    composition: [8, 8, 8, 8, 8],
    spacing: 2.0,
    pattern: "unpredictable", // Random spacing
    description: "Teleporting enemies that can skip ahead on the path"
  },
  
  // Mini-boss waves
  swarmLord: {
    name: "Swarm Lord's Legion",
    composition: [2, 2, 'swarm_lord', 2, 2],
    spacing: 1.5,
    pattern: "boss_centered", // Mini-boss in the middle
    description: "A Swarm Lord with escort units"
  },
  titanAssault: {
    name: "Titan's Advance",
    composition: [4, 'titan', 4],
    spacing: 2.0,
    pattern: "boss_centered",
    description: "A heavily armored Titan with support"
  },
  numeromancerRaid: {
    name: "Numeromancer's Raid",
    composition: [7, 7, 'numeromancer', 7, 7],
    spacing: 1.8,
    pattern: "boss_centered",
    description: "A dangerous Numeromancer with phasing guards"
  },
  
  // Boss wave
  bossWave: {
    name: "Final Confrontation",
    composition: [9, 6, 'boss', 6, 9],
    spacing: 2.5,
    pattern: "dramatic", // Long pause before boss
    description: "The Void Devourer with powerful escorts"
  }
};

/**
 * Strategic wave progression that creates a satisfying difficulty curve
 * Follows principles from roguelikes with breather waves between challenges
 * @param {number} waveNumber - Current wave number
 * @returns {Object} Wave pattern to use
 */
function getWavePattern(waveNumber) {
  // Early waves for learning
  if (waveNumber === 1) {
    return wavePatterns.introduction;
  }
  
  // Boss waves every 10 waves
  if (waveNumber % 10 === 0) {
    return wavePatterns.bossWave;
  }
  
  // Mini-boss waves at intervals
  if (waveNumber % 10 === 7) {
    // Rotate between mini-bosses based on wave number
    const miniBoss = waveNumber % 30;
    if (miniBoss === 7) return wavePatterns.swarmLord;
    if (miniBoss === 17) return wavePatterns.titanAssault;
    if (miniBoss === 27) return wavePatterns.numeromancerRaid;
  }
  
  // Regular wave progression with breather waves after challenges
  const waveInSet = waveNumber % 10;
  
  // Harder waves leading up to boss/mini-boss
  if (waveInSet === 6 || waveInSet === 9) {
    return wavePatterns.elite;
  }
  
  // Breather waves after challenging encounters
  if (waveInSet === 8 || waveInSet === 1) {
    return wavePatterns.balanced;
  }
  
  // Specialty waves at strategic points
  if (waveInSet === 3) return wavePatterns.swarm;
  if (waveInSet === 4) return wavePatterns.armored;
  if (waveInSet === 5) return wavePatterns.healers;
  if (waveInSet === 2) return wavePatterns.commanders;
  
  // Default to balanced for any other wave
  return wavePatterns.balanced;
}

/**
 * Start a wave with the enhanced pattern-based system
 * Creates more interesting and strategic enemy encounters
 */
function startWave() {
  console.log("Starting consolidated wave system for wave", waveNumber);
  
  if (isWaveActive) {
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Wave already in progress!");
    return;
  }
  
  // === Update and validate path ===
  if (!path || path.length === 0) {
    const boardManager = window.BoardManager;
    if (boardManager?.getPathArray) {
      path = boardManager.getPathArray();
      console.log("Updated path from BoardManager:", path);
    }
  }
  
  // Emergency path generation
  if (!path || !Array.isArray(path) || path.length === 0) {
    console.warn("Path undefined or empty. Attempting emergency generation...");
    if (window.BoardManager?.generateEnemyPath) {
      path = BoardManager.generateEnemyPath();
      if (!path || path.length === 0) {
        console.error("Emergency path generation failed!");
        return;
      } else {
        console.log("Emergency path generated successfully:", path);
      }
    } else {
      return;
    }
  }
  
  // Fix string-based path format
  if (typeof path[0] === 'string') {
    path = path.map(pos => pos.split(',').map(Number));
    console.log("Fixed path format:", path);
  }
  
  // Final format validation
  let validFormat = path.every(p => Array.isArray(p) && p.length === 2);
  if (!validFormat) {
    console.error("Invalid path format:", path);
    EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot start wave: Invalid path format!");
    return;
  }
  
  // === Get wave pattern & adjust difficulty ===
  const wavePattern = getWavePattern(waveNumber); // e.g., { name: "Swarm", composition: [1, 2, 3, "boss"] }
  const difficultyAdjustment = calculateDynamicDifficulty(); // Optional difficulty tweaks
  
  // Announce and setup wave
  announceWave(wavePattern);
  enemiesRemaining = wavePattern.composition.length;
  isWaveActive = true;
  
  EventSystem.publish(GameEvents.WAVE_START, {
    waveNumber: waveNumber,
    enemyCount: enemiesRemaining,
    waveName: wavePattern.name
  });
  
  EventSystem.publish(GameEvents.STATUS_MESSAGE, `Wave ${waveNumber} started! Enemies: ${enemiesRemaining}`);
  
  // Start spawning using the pattern
  setupSpawning(wavePattern, wavePattern.composition, difficultyAdjustment);
}

/**
 * Set up enemy spawning based on wave pattern
 * @param {Object} pattern - The wave pattern to use
 * @param {Array} composition - Array of enemy types to spawn
 * @param {Object} adjustment - Difficulty adjustments
 */
function setupSpawning(pattern, composition, adjustment) {
  let enemiesSpawned = 0;
  let nextSpawnTime = 0;
  
  // Clear any existing interval
  if (spawnInterval) {
    clearInterval(spawnInterval);
  }
  
  // Create a spawn controller that handles different patterns
  spawnInterval = setInterval(() => {
    if (enemiesSpawned >= composition.length) {
      clearInterval(spawnInterval);
      spawnInterval = null;
      return;
    }
    
    // Determine if it's time to spawn next enemy
    const currentTime = Date.now() / 1000; // In seconds
    if (currentTime < nextSpawnTime) {
      return;
    }
    
    // Determine enemy type from composition
    const enemyType = composition[enemiesSpawned];
    
    // Create the enemy with difficulty adjustments
    const enemy = createEnemy(enemyType, adjustment);
    
    if (enemy) {
      console.log(`Spawned enemy ${enemiesSpawned+1}/${composition.length}: ${enemy.name}`);
      enemiesSpawned++;
      
      // Determine next spawn time based on pattern
      const baseSpacing = pattern.spacing * (adjustment.spawn_rate || 1.0);
      let spacing = baseSpacing;
      
      switch (pattern.pattern) {
        case "accelerating":
          // Speed up spawning as wave progresses
          spacing = baseSpacing * (1 - (enemiesSpawned / composition.length * 0.5));
          break;
          
        case "grouped":
          // Groups of enemies with pauses between groups
          if (enemiesSpawned % pattern.groupSize === 0) {
            spacing = pattern.pauseBetweenGroups || 3;
          }
          break;
          
        case "boss_centered":
          // Special timing for boss waves - dramatic pause before/after boss
          const isBossType = typeof enemyType === 'string' &&
            (enemyType === 'boss' ||
              enemyTypes[enemyType]?.isMinibloss ||
              enemyTypes[enemyType]?.isBoss);
          if (isBossType) {
            spacing = baseSpacing * 2; // Dramatic pause before boss
          } else if (enemiesSpawned > 0 &&
            (typeof composition[enemiesSpawned - 1] === 'string') &&
            (composition[enemiesSpawned - 1] === 'boss' ||
              enemyTypes[composition[enemiesSpawned - 1]]?.isMinibloss ||
              enemyTypes[composition[enemiesSpawned - 1]]?.isBoss)) {
            spacing = baseSpacing * 2; // Dramatic pause after boss
          }
          break;
          
        case "dramatic":
          // Dramatic timing for special waves
          const isBoss = typeof enemyType === 'string' && enemyType === 'boss';
          if (isBoss) {
            spacing = 4; // Long dramatic pause before main boss
            // Add dramatic effect
            showDramaticBossEntrance();
          }
          break;
          
        case "unpredictable":
          // Random timing
          spacing = baseSpacing * (0.5 + Math.random());
          break;
          
        case "hierarchy":
          // Important enemies with followers
          spacing = baseSpacing;
          break;
          
        default: // "linear"
          spacing = baseSpacing;
          break;
      }
      
      nextSpawnTime = currentTime + spacing;
    }
  }, 100); // Check every 100ms for precise timing
}

/**
 * Create a dramatic visual effect for boss entrance
 */
function showDramaticBossEntrance() {
  // Add screen shake effect
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.classList.add('screen-shake');
    setTimeout(() => {
      gameContainer.classList.remove('screen-shake');
    }, 1000);
  }
  
  // Add dramatic message
  EventSystem.publish(GameEvents.STATUS_MESSAGE, "BOSS APPROACHING!");
  
  // Play sound effect if available
  if (window.AudioManager) {
    AudioManager.play('boss_warning');
  }
}

/**
 * Announce the upcoming wave with useful information
 * @param {Object} wavePattern - The wave pattern being used
 */
function announceWave(wavePattern) {
  // Create a descriptive message about the wave
  let message = `Wave ${waveNumber}: ${wavePattern.name}`;
  
  // Add extra info for special waves
  if (wavePattern.name.includes("Boss") ||
    wavePattern.composition.includes('boss') ||
    wavePattern.composition.includes('titan') ||
    wavePattern.composition.includes('swarm_lord') ||
    wavePattern.composition.includes('numeromancer')) {
    message += " - DANGER!";
  }
  
  EventSystem.publish(GameEvents.STATUS_MESSAGE, message);
  
  // Show wave info briefly as an overlay
  showWaveInfo(wavePattern);
}

/**
 * Show a brief wave info overlay with strategic information
 * @param {Object} wavePattern - The wave pattern to display
 */
function showWaveInfo(wavePattern) {
  // Create wave info element
  const waveInfo = document.createElement('div');
  waveInfo.className = 'wave-info-overlay';
  
  // Create content based on wave type
  let enemyPreview = '';
  wavePattern.composition.forEach(type => {
    if (typeof type === 'number') {
      enemyPreview += enemyTypes[type].emoji + ' ';
    } else {
      enemyPreview += enemyTypes[type].emoji + ' ';
    }
  });
  
  waveInfo.innerHTML = `
        <div class="wave-info-content">
            <div class="wave-info-title">Wave ${waveNumber}: ${wavePattern.name}</div>
            <div class="wave-info-description">${wavePattern.description}</div>
            <div class="wave-info-enemies">${enemyPreview}</div>
        </div>
    `;
  
  // Add to DOM
  document.body.appendChild(waveInfo);
  
  // Show with animation
  setTimeout(() => {
    waveInfo.classList.add('active');
  }, 50);
  
  // Remove after 3 seconds
  setTimeout(() => {
    waveInfo.classList.remove('active');
    setTimeout(() => {
      waveInfo.remove();
    }, 500);
  }, 3000);
}

/**
 * Calculate dynamic difficulty adjustments based on player performance
 * Makes the game more engaging by adapting to player skill level
 * @returns {Object} Difficulty adjustment factors
 */
function calculateDynamicDifficulty() {
  // Initialize adjustment factors
  let adjustment = {
    health: 1.0,
    speed: 1.0,
    spawn_rate: 1.0
  };
  
  // Only apply after several waves so we have performance data
  if (waveNumber < 3) {
    return adjustment;
  }
  
  try {
    // Get player performance metrics
    const metrics = getPlayerPerformanceMetrics();
    
    // Adjust based on tower efficiency
    if (metrics.averageTowerEfficiency > 0.8) {
      // Player is very efficient with tower placement
      adjustment.health *= 1.15;
      adjustment.speed *= 1.1;
    } else if (metrics.averageTowerEfficiency < 0.4) {
      // Player is struggling with tower placement
      adjustment.health *= 0.9;
    }
    
    // Adjust based on lives lost
    if (metrics.livesLostLastWave > 0) {
      // Player lost lives in the last wave
      adjustment.health *= 0.95;
      adjustment.spawn_rate *= 0.95;
    } else if (metrics.noLivesLostStreak > 2) {
      // Player hasn't lost lives in several waves
      adjustment.speed *= 1.1;
    }
    
    // Adjust based on game progression
    adjustment.health *= (1 + (waveNumber - 1) * 0.05); // +5% health per wave
    
    // Cap adjustments to prevent extreme difficulty swings
    adjustment.health = Math.max(0.7, Math.min(adjustment.health, 1.5));
    adjustment.speed = Math.max(0.8, Math.min(adjustment.speed, 1.3));
    adjustment.spawn_rate = Math.max(0.7, Math.min(adjustment.spawn_rate, 1.2));
    
    console.log("Dynamic difficulty adjustments:", adjustment);
    return adjustment;
  } catch (e) {
    console.error("Error calculating dynamic difficulty:", e);
    return adjustment; // Return default adjustment on error
  }
}

/**
 * Get metrics about player performance for dynamic difficulty
 * @returns {Object} Performance metrics
 */
function getPlayerPerformanceMetrics() {
  // Default metrics
  const metrics = {
    averageTowerEfficiency: 0.6, // Default middle value
    livesLostLastWave: 0,
    noLivesLostStreak: 0
  };
  
  // Get actual metrics if possible
  if (window.PlayerModule && typeof PlayerModule.getState === 'function') {
    const playerState = PlayerModule.getState();
    
    // Store historical data if not already initialized
    if (!window._playerHistory) {
      window._playerHistory = {
        prevLives: playerState.lives,
        livesLostPerWave: [],
        noLivesLostStreak: 0
      };
    }
    
    // Calculate lives lost in last wave
    const livesBefore = window._playerHistory.prevLives;
    const livesNow = playerState.lives;
    const livesLost = Math.max(0, livesBefore - livesNow);
    
    // Update history
    window._playerHistory.livesLostPerWave.push(livesLost);
    window._playerHistory.prevLives = livesNow;
    
    // Update no-lives-lost streak
    if (livesLost === 0) {
      window._playerHistory.noLivesLostStreak++;
    } else {
      window._playerHistory.noLivesLostStreak = 0;
    }
    
    // Keep only last 5 waves of history
    if (window._playerHistory.livesLostPerWave.length > 5) {
      window._playerHistory.livesLostPerWave.shift();
    }
    
    // Calculate metrics from history
    metrics.livesLostLastWave = livesLost;
    metrics.noLivesLostStreak = window._playerHistory.noLivesLostStreak;
  }
  
  // Estimate tower efficiency (this could be enhanced with more data)
  if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
    const towers = TowersModule.getTowers();
    if (towers.length > 0) {
      // Simple heuristic: correct towers / total towers
      const correctTowers = towers.filter(t => t.matchesSolution).length;
      metrics.averageTowerEfficiency = correctTowers / towers.length;
    }
  }
  
  return metrics;
}
    
    /**
     * Initialize the enemies module
     * @param {Object} options - Initialization options
     */
    function init(options = {}) {
  enemies = [];
  enemyId = 0;
  waveNumber = 1;
  isWaveActive = false;
  enemiesRemaining = 0;
  cellSize = options.cellSize || 55; // Default cell size
  
  // Get initial path
  if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
    path = BoardManager.getPathArray();
    console.log("EnemiesModule initialized with path from BoardManager:", path);
  } else if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
    path = BoardManager.getPathArray();
    console.log("EnemiesModule initialized with path from BoardManager:", path);
  } else {
    console.warn("EnemiesModule: No path provider available!");
    path = [];
  }
  
  // Stop any active spawn interval
  if (spawnInterval) {
    clearInterval(spawnInterval);
    spawnInterval = null;
  }
}
    
    /**
     * Create a new enemy
     * @param {number|string} type - Enemy type
     * @returns {Object} The created enemy
     */
    /**
 * Create an enemy with enhanced behaviors
 * @param {number|string} type - Enemy type
 * @param {Object} adjustment - Difficulty adjustment factors
 * @returns {Object} The created enemy
 */
function createEnemy(type, adjustment = { health: 1.0, speed: 1.0 }) {
  console.log(`Creating enhanced enemy of type ${type}`);
  
  const typeData = enemyTypes[type] || enemyTypes[1];
  
  if (!path || path.length < 2) {
    console.error("Cannot create enemy: path is invalid!", path);
    return null;
  }
  
  const startCell = path[0];
  const nextCell = path[1] || startCell;
  
  if (!Array.isArray(startCell) || startCell.length !== 2) {
    console.error("Invalid start cell in path:", startCell);
    return null;
  }
  
  // Apply difficulty adjustments and wave scaling
  const scaledHealth = typeData.health * adjustment.health * (1 + (waveNumber - 1) * 0.1);
  const scaledSpeed = typeData.speed * adjustment.speed;
  
  // Create the enhanced enemy
  const enemy = {
    id: `enemy_${++enemyId}`,
    type: type,
    name: typeData.name,
    emoji: typeData.emoji,
    health: scaledHealth,
    maxHealth: scaledHealth,
    speed: scaledSpeed,
    baseSpeed: scaledSpeed, // Store base speed for effects
    reward: typeData.reward,
    points: typeData.points,
    
    // Enhanced properties
    behavior: typeData.behavior || "basic",
    behaviorData: {}, // For behavior-specific data
    statusEffects: [],
    resistances: typeData.resistances || [],
    scale: typeData.scale || 1.0,
    
    // Path tracking
    currentPathIndex: 0,
    previousPathIndex: 0,
    progress: 0.01,
    row: startCell[0] + (nextCell[0] - startCell[0]) * 0.01,
    col: startCell[1] + (nextCell[1] - startCell[1]) * 0.01,
    active: true,
    
    // Initialize behavior-specific properties
    ...initializeBehavior(typeData)
  };
  
  console.log(`Enhanced enemy created at position: (${enemy.row}, ${enemy.col})`);
  
  enemies.push(enemy);
  EventSystem.publish(GameEvents.ENEMY_SPAWN, enemy);
  
  return enemy;
}

/**
 * Initialize behavior-specific properties for an enemy
 * @param {Object} typeData - Enemy type data
 * @returns {Object} Behavior-specific properties
 */
function initializeBehavior(typeData) {
  const props = {};
  
  switch (typeData.behavior) {
    case "armored":
      props.damageReduction = typeData.armorValue || 0.3;
      break;
      
    case "accelerate":
      props.speedRamp = typeData.speedRamp || 0.01;
      props.maxSpeedMultiplier = typeData.maxSpeedMultiplier || 2.0;
      break;
      
    case "split":
      props.splitInto = typeData.splitInto || [1, 1];
      props.hasSplit = false;
      break;
      
    case "heal":
      props.healRadius = typeData.healRadius || 2;
      props.healAmount = typeData.healAmount || 10;
      props.healInterval = typeData.healInterval || 3;
      props.lastHealTime = 0;
      break;
      
    case "phasing":
      props.phaseInterval = typeData.phaseInterval || 4;
      props.phaseDuration = typeData.phaseDuration || 2;
      props.lastPhaseTime = 0;
      props.isPhased = false;
      break;
      
    case "teleport":
      props.teleportChance = typeData.teleportChance || 0.1;
      props.teleportDistance = typeData.teleportDistance || 2;
      props.lastTeleportCheck = 0;
      break;
      
    case "buff":
      props.buffRadius = typeData.buffRadius || 2;
      props.buffEffect = typeData.buffEffect || { speedBoost: 0.2 };
      props.lastBuffTime = 0;
      break;
      
    case "summoner":
      props.summonType = typeData.summonType || 1;
      props.summonCount = typeData.summonCount || 2;
      props.summonInterval = typeData.summonInterval || 8;
      props.lastSummonTime = 0;
      break;
      
    case "scrambler":
      props.disableRadius = typeData.disableRadius || 2;
      props.disableDuration = typeData.disableDuration || 4;
      props.disableInterval = typeData.disableInterval || 8;
      props.lastDisableTime = 0;
      break;
      
    case "multiphase":
      props.phases = typeData.phases || [];
      props.currentPhase = 0;
      break;
  }
  
  return props;
}

// Add a direct debug function to check path availability
window.debugEnemyPath = function() {
  let boardManagerPath = window.BoardManager && typeof BoardManager.getPathArray === 'function' ?
    BoardManager.getPathArray() :
    null;
  
  let BoardManagerPath = window.BoardManager && typeof BoardManager.getPathArray === 'function' ?
    BoardManager.getPathArray() :
    null;
  
  let currentEnemiesPath = window.EnemiesModule && EnemiesModule.path ?
    EnemiesModule.path :
    null;
  
  console.log("Path from BoardManager:", boardManagerPath);
  console.log("Path from BoardManager:", BoardManagerPath);
  console.log("Current path in EnemiesModule:", currentEnemiesPath);
  
  // Add explicit check to see if the path is usable
  if (currentEnemiesPath && currentEnemiesPath.length > 0) {
    console.log("EnemiesModule has a valid path with " + currentEnemiesPath.length + " cells");
    return true;
  } else {
    console.error("EnemiesModule path is missing or empty!");
    return false;
  }
};

// Expose path publicly for debugging
window.getEnemyPath = function() {
  return path;
};

    /**
     * Update all enemies
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
   /**
 * Update all enemies with their special behaviors
 * @param {number} deltaTime - Time elapsed since last update in seconds
 */
function update(deltaTime) {
  if (!isWaveActive) {
    return;
  }
  
  const currentTime = Date.now() / 1000; // Current time in seconds
  let activeEnemies = 0;
  
  // Process each enemy's behavior
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    
    if (!enemy.active) {
      continue;
    }
    
    activeEnemies++;
    
    // Process behavior effects before movement
    updateEnemyBehavior(enemy, deltaTime, currentTime);
    
    // Process status effects
    updateStatusEffects(enemy, deltaTime);
    
    // Move enemy along the path
    moveEnemy(enemy, deltaTime);
    
    // Publish enemy move event
    EventSystem.publish(GameEvents.ENEMY_MOVE, enemy);
  }
  
  // Check if wave is complete (no active enemies and none remaining to spawn)
  if (activeEnemies === 0 && enemiesRemaining === 0 && !spawnInterval) {
    waveComplete();
  }
}

/**
 * Update an enemy's special behavior
 * @param {Object} enemy - The enemy to update
 * @param {number} deltaTime - Time elapsed since last update
 * @param {number} currentTime - Current game time in seconds
 */
function updateEnemyBehavior(enemy, deltaTime, currentTime) {
  switch (enemy.behavior) {
    case "armored":
      // Armored enemies have passive damage reduction
      // No active update needed
      break;
      
    case "accelerate":
      // Increase speed based on missing health
      const healthPercent = enemy.health / enemy.maxHealth;
      const speedMultiplier = 1 + ((1 - healthPercent) * enemy.speedRamp * 100);
      enemy.speed = enemy.baseSpeed * Math.min(speedMultiplier, enemy.maxSpeedMultiplier);
      break;
      
    case "heal":
      // Periodically heal nearby enemies
      if (currentTime - enemy.lastHealTime >= enemy.healInterval) {
        healNearbyEnemies(enemy, currentTime);
        enemy.lastHealTime = currentTime;
      }
      break;
      
    case "phasing":
      // Periodically become immune to damage
      if (!enemy.isPhased && currentTime - enemy.lastPhaseTime >= enemy.phaseInterval) {
        // Start phase
        enemy.isPhased = true;
        enemy.lastPhaseTime = currentTime;
        
        // Add visual effect
        const enemyEl = document.getElementById(enemy.id);
        if (enemyEl) enemyEl.classList.add('phased');
      }
      else if (enemy.isPhased && currentTime - enemy.lastPhaseTime >= enemy.phaseDuration) {
        // End phase
        enemy.isPhased = false;
        
        // Remove visual effect
        const enemyEl = document.getElementById(enemy.id);
        if (enemyEl) enemyEl.classList.remove('phased');
      }
      break;
      
    case "teleport":
      // Randomly teleport forward
      if (currentTime - enemy.lastTeleportCheck >= 1) { // Check once per second
        if (Math.random() < enemy.teleportChance) {
          teleportEnemy(enemy);
        }
        enemy.lastTeleportCheck = currentTime;
      }
      break;
      
    case "buff":
      // Buff nearby enemies
      if (currentTime - enemy.lastBuffTime >= 1) { // Apply buffs every second
        buffNearbyEnemies(enemy);
        enemy.lastBuffTime = currentTime;
      }
      break;
      
    case "summoner":
      // Summon additional enemies
      if (currentTime - enemy.lastSummonTime >= enemy.summonInterval) {
        summonEnemies(enemy);
        enemy.lastSummonTime = currentTime;
      }
      break;
      
    case "scrambler":
      // Disable nearby towers
      if (currentTime - enemy.lastDisableTime >= enemy.disableInterval) {
        disableNearbyTowers(enemy, currentTime);
        enemy.lastDisableTime = currentTime;
      }
      break;
      
    case "multiphase":
      // Check for phase transitions
      updateBossPhase(enemy);
      break;
  }
}

/**
 * Update status effects on an enemy
 * @param {Object} enemy - The enemy to update
 * @param {number} deltaTime - Time elapsed since last update
 */
function updateStatusEffects(enemy, deltaTime) {
  if (!enemy.statusEffects || !Array.isArray(enemy.statusEffects)) {
    enemy.statusEffects = [];
    return;
  }
  
  // Process each status effect
  for (let i = enemy.statusEffects.length - 1; i >= 0; i--) {
    const effect = enemy.statusEffects[i];
    
    // Decrease duration
    effect.timeRemaining -= deltaTime;
    
    // Apply effect
    switch (effect.type) {
      case "slow":
        // Effect is applied when added/removed
        break;
        
      case "poison":
        // Apply damage over time
        effect.tickTimer = (effect.tickTimer || 0) + deltaTime;
        if (effect.tickTimer >= 0.5) { // Damage every 0.5 seconds
          enemy.health -= effect.damage;
          effect.tickTimer -= 0.5;
          
          // Visual feedback
          const enemyEl = document.getElementById(enemy.id);
          if (enemyEl) {
            enemyEl.classList.add('poison-tick');
            setTimeout(() => {
              enemyEl.classList.remove('poison-tick');
            }, 300);
          }
        }
        break;
        
      case "stun":
        // Effect is applied when added/removed
        break;
    }
    
    // Remove expired effects
    if (effect.timeRemaining <= 0) {
      // Apply cleanup effects
      if (effect.type === "slow" && enemy.originalSpeed) {
        enemy.speed = enemy.originalSpeed;
        delete enemy.originalSpeed;
      }
      else if (effect.type === "stun" && enemy.originalSpeed) {
        enemy.speed = enemy.originalSpeed;
        delete enemy.originalSpeed;
      }
      
      // Remove from array
      enemy.statusEffects.splice(i, 1);
      
      // Remove visual indicators
      const enemyEl = document.getElementById(enemy.id);
      if (enemyEl) {
        if (effect.type === "slow") enemyEl.classList.remove('slowed');
        if (effect.type === "poison") enemyEl.classList.remove('poisoned');
        if (effect.type === "stun") enemyEl.classList.remove('stunned');
      }
    }
  }
}

/**
 * Heal nearby enemies
 * @param {Object} healer - The healing enemy
 * @param {number} currentTime - Current game time
 */
function healNearbyEnemies(healer, currentTime) {
    // Find nearby enemies
    const nearbyEnemies = enemies.filter(enemy => {
        if (!enemy.active || enemy.id === healer.id) return false;
        
        // Calculate distance
        const dx = enemy.row - healer.row;
        const dy = enemy.col - healer.col;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        return distance <= healer.healRadius;
    });
    
    // Heal each nearby enemy
    if (nearbyEnemies.length > 0) {
        nearbyEnemies.forEach(enemy => {
            const healAmount = healer.healAmount;
            enemy.health = Math.min(enemy.health + healAmount, enemy.maxHealth);
            
            // Show heal effect
            const enemyEl = document.getElementById(enemy.id);
            if (enemyEl) {
                // Add healing effect class
                enemyEl.classList.add('healing');
                
                // Create healing indicator
                const healText = document.createElement('div');
                healText.className = 'healing-text';
                healText.textContent = '+' + healAmount;
                enemyEl.appendChild(healText);
                
                // Remove effects after animation
                setTimeout(() => {
                    enemyEl.classList.remove('healing');
                    healText.remove();
                }, 1000);
            }
        });
        
        // Show healing pulse from healer
        const healerEl = document.getElementById(healer.id);
        if (healerEl) {
            healerEl.classList.add('healing-pulse');
            setTimeout(() => {
                healerEl.classList.remove('healing-pulse');
            }, 1000);
        }
    }
}

/**
 * Teleport an enemy forward on the path
 * @param {Object} enemy - The enemy to teleport
 */
function teleportEnemy(enemy) {
    // Calculate target path index
    const targetIndex = Math.min(
        enemy.currentPathIndex + enemy.teleportDistance,
        path.length - 1
    );
    
    // Skip if already at the end
    if (targetIndex === enemy.currentPathIndex) return;
    
    // Set new position
    enemy.previousPathIndex = enemy.currentPathIndex;
    enemy.currentPathIndex = targetIndex;
    enemy.progress = 0;
    
    // Update coordinates
    const targetCell = path[targetIndex];
    enemy.row = targetCell[0];
    enemy.col = targetCell[1];
    
    // Show teleport effect
    const enemyEl = document.getElementById(enemy.id);
    if (enemyEl) {
        enemyEl.classList.add('teleporting');
        
        // Flash effect at new position
        setTimeout(() => {
            enemyEl.classList.remove('teleporting');
            enemyEl.classList.add('teleport-arrival');
            setTimeout(() => {
                enemyEl.classList.remove('teleport-arrival');
            }, 300);
        }, 200);
    }
}

/**
 * Buff nearby enemies
 * @param {Object} commander - The commander enemy
 */
function buffNearbyEnemies(commander) {
    // Find nearby enemies
    const nearbyEnemies = enemies.filter(enemy => {
        if (!enemy.active || enemy.id === commander.id) return false;
        
        // Calculate distance
        const dx = enemy.row - commander.row;
        const dy = enemy.col - commander.col;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        return distance <= commander.buffRadius;
    });
    
    // Apply buff to each nearby enemy
    nearbyEnemies.forEach(enemy => {
        // Speed buff
        if (commander.buffEffect.speedBoost) {
            if (!enemy.hasSpeedBuff) {
                enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                enemy.speed = enemy.originalSpeed * (1 + commander.buffEffect.speedBoost);
                enemy.hasSpeedBuff = true;
                
                // Show buff connection
                showBuffLink(commander, enemy);
            }
        }
    });
    
    // Show command aura
    const commanderEl = document.getElementById(commander.id);
    if (commanderEl && nearbyEnemies.length > 0) {
        commanderEl.classList.add('commanding');
        setTimeout(() => {
            commanderEl.classList.remove('commanding');
        }, 500);
    }
}

/**
 * Show buff link between commander and buffed enemy
 * @param {Object} source - Commander enemy
 * @param {Object} target - Target enemy
 */
function showBuffLink(source, target) {
    // Create buff link element
    const buffLink = document.createElement('div');
    buffLink.className = 'buff-link';
    buffLink.id = `buff-link-${source.id}-${target.id}`;
    
    // Calculate position and size
    const sx = source.col * cellSize + cellSize / 2;
    const sy = source.row * cellSize + cellSize / 2;
    const tx = target.col * cellSize + cellSize / 2;
    const ty = target.row * cellSize + cellSize / 2;
    
    // Calculate angle and length
    const dx = tx - sx;
    const dy = ty - sy;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx*dx + dy*dy);
    
    // Set style
    buffLink.style.position = 'absolute';
    buffLink.style.left = `${sx}px`;
    buffLink.style.top = `${sy}px`;
    buffLink.style.width = `${length}px`;
    buffLink.style.height = '2px';
    buffLink.style.backgroundColor = 'rgba(255, 215, 0, 0.5)';
    buffLink.style.transform = `rotate(${angle}deg)`;
    buffLink.style.transformOrigin = '0 0';
    buffLink.style.zIndex = '5';
    
    // Add to container
    const projectileContainer = document.getElementById('projectile-container');
    if (projectileContainer) {
        projectileContainer.appendChild(buffLink);
        
        // Remove after a short time
        setTimeout(() => {
            buffLink.remove();
        }, 1000);
    }
}

/**
 * Summon additional enemies
 * @param {Object} summoner - The summoner enemy
 */
function summonEnemies(summoner) {
    // Only summon if we're not too close to the end
    if (summoner.currentPathIndex > path.length - 5) return;
    
    // Summon enemies
    for (let i = 0; i < summoner.summonCount; i++) {
        // Create minion at summoner's position
        const minion = createEnemy(summoner.summonType);
        if (minion) {
            // Position at summoner
            minion.currentPathIndex = summoner.currentPathIndex;
            minion.row = summoner.row;
            minion.col = summoner.col;
            
            // Add summon visual effect
            const minionEl = document.getElementById(minion.id);
            if (minionEl) {
                minionEl.classList.add('summoned');
                setTimeout(() => {
                    minionEl.classList.remove('summoned');
                }, 1000);
            }
        }
    }
    
    // Increment enemies remaining counter
    enemiesRemaining += summoner.summonCount;
    
    // Show summon effect
    const summonerEl = document.getElementById(summoner.id);
    if (summonerEl) {
        summonerEl.classList.add('summoning');
        setTimeout(() => {
            summonerEl.classList.remove('summoning');
        }, 1000);
    }
}

/**
 * Disable nearby towers
 * @param {Object} scrambler - The scrambler enemy
 * @param {number} currentTime - Current game time
 */
function disableNearbyTowers(scrambler, currentTime) {
    if (!window.TowersModule || typeof TowersModule.getTowers !== 'function') {
        return;
    }
    
    // Get all towers
    const towers = TowersModule.getTowers();
    
    // Find towers in range
    const towersInRange = towers.filter(tower => {
        const dx = tower.row - scrambler.row;
        const dy = tower.col - scrambler.col;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        return distance <= scrambler.disableRadius;
    });
    
    // Disable towers
    if (towersInRange.length > 0) {
        towersInRange.forEach(tower => {
            // Store original damage if not already stored
            if (!tower.originalDamageDisabled) {
                tower.originalDamageDisabled = tower.damage;
                tower.damage = 0; // Disable tower
                tower.disabledUntil = currentTime + scrambler.disableDuration;
                
                // Show disabled effect
                const towerEl = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                if (towerEl) {
                    towerEl.classList.add('disabled-tower');
                    
                    // Remove effect when re-enabled
                    setTimeout(() => {
                        if (tower.originalDamageDisabled) {
                            tower.damage = tower.originalDamageDisabled;
                            delete tower.originalDamageDisabled;
                        }
                        towerEl.classList.remove('disabled-tower');
                    }, scrambler.disableDuration * 1000);
                }
            }
        });
        
        // Show scramble effect
        const scramblerEl = document.getElementById(scrambler.id);
        if (scramblerEl) {
            scramblerEl.classList.add('scrambling');
            setTimeout(() => {
                scramblerEl.classList.remove('scrambling');
            }, 1000);
        }
    }
}

/**
 * Check if a boss should change phases
 * @param {Object} boss - The boss enemy
 */
function updateBossPhase(boss) {
    if (!boss.phases || !Array.isArray(boss.phases)) return;
    
    // Calculate health percentage
    const healthPercent = boss.health / boss.maxHealth;
    
    // Check if we should move to the next phase
    const currentPhase = boss.currentPhase;
    const nextPhase = currentPhase + 1;
    
    if (nextPhase < boss.phases.length && 
        healthPercent <= boss.phases[nextPhase].threshold) {
        
        // Transition to new phase
        boss.currentPhase = nextPhase;
        const newPhase = boss.phases[nextPhase];
        
        // Apply phase effects
        if (newPhase.behavior === "rage") {
            // Speed boost in rage phase
            boss.speed = boss.baseSpeed * (1 + (newPhase.speedBoost || 0.5));
            
            // Visual effect for rage
            const bossEl = document.getElementById(boss.id);
            if (bossEl) {
                bossEl.classList.add('enraged');
                
                // Show phase transition effect
                showBossPhaseTransition(boss, "Enraged!");
            }
        }
        else if (newPhase.behavior === "desperate") {
            // Final phase - summon and speed boost
            boss.speed = boss.baseSpeed * 1.3;
            
            // Summon minions if this is the final phase
            if (nextPhase === boss.phases.length - 1) {
                // Big summoning wave
                const minionCount = 4;
                for (let i = 0; i < minionCount; i++) {
                    createEnemy(3); // Type 3 enemies
                }
                enemiesRemaining += minionCount;
            }
            
            // Visual effect
            const bossEl = document.getElementById(boss.id);
            if (bossEl) {
                bossEl.classList.add('desperate');
                
                // Show phase transition effect
                showBossPhaseTransition(boss, "Desperate Phase!");
            }
        }
    }
}

/**
 * Show boss phase transition effect
 * @param {Object} boss - The boss enemy
 * @param {string} message - Phase message to display
 */
function showBossPhaseTransition(boss, message) {
    // Create screen flash
    const flash = document.createElement('div');
    flash.className = 'boss-phase-flash';
    document.body.appendChild(flash);
    
    // Create phase announcement
    const announcement = document.createElement('div');
    announcement.className = 'boss-phase-announcement';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after animation
    setTimeout(() => {
        flash.remove();
        announcement.remove();
    }, 2000);
    
    // Show status message
    EventSystem.publish(GameEvents.STATUS_MESSAGE, `Boss: ${message}`);
}
    
    /**
     * Move an enemy along the path
     * @param {Object} enemy - The enemy to move
     * @param {number} deltaTime - Time elapsed since last update
     */
function moveEnemy(enemy, deltaTime) {
    if (enemy.currentPathIndex >= path.length - 1) {
        // Enemy reached the end of the path
        enemyReachedEnd(enemy);
        return;
    }
    
    // Calculate movement speed based on enemy speed and deltaTime
    // Adjust this multiplier to control overall movement speed
    const moveSpeed = enemy.speed * 0.8 * deltaTime;
    
    // Get current and next cells in path
    const currentCell = path[enemy.currentPathIndex];
    const nextCell = path[enemy.currentPathIndex + 1];
    
    // Update progress along current path segment
    enemy.progress += moveSpeed;
    
    // Move to next path segment if progress is complete
    if (enemy.progress >= 1) {
        enemy.previousPathIndex = enemy.currentPathIndex;
        enemy.currentPathIndex++;
        enemy.progress = 0; // Reset progress for the next segment
        
        // Check if enemy reached the end
        if (enemy.currentPathIndex >= path.length - 1) {
            enemyReachedEnd(enemy);
            return;
        }
        
        // Update references to current and next cells
        const newCurrentCell = path[enemy.currentPathIndex];
        const newNextCell = path[enemy.currentPathIndex + 1] || newCurrentCell;
        
        // Update the enemy's exact position
        enemy.row = newCurrentCell[0];
        enemy.col = newCurrentCell[1];
    } else {
        // Calculate interpolated position between cells for smoother movement
        // Linear interpolation between current and next cell
        enemy.row = currentCell[0] + (nextCell[0] - currentCell[0]) * enemy.progress;
        enemy.col = currentCell[1] + (nextCell[1] - currentCell[1]) * enemy.progress;
    }
}
    
    /**
     * Handle an enemy reaching the end of the path
     * @param {Object} enemy - The enemy that reached the end
     */
    function enemyReachedEnd(enemy) {
        enemy.active = false;
        
        // Remove from enemies array
        enemies = enemies.filter(e => e.id !== enemy.id);
        
        // Publish event
        EventSystem.publish(GameEvents.ENEMY_REACHED_END, enemy);
        
        // Decrement enemies remaining
        enemiesRemaining--;
    }
    
    /**
     * Damage an enemy
     * @param {string} enemyId - ID of the enemy to damage
     * @param {number} damage - Amount of damage to deal
     * @returns {boolean} Whether the enemy was killed
     */
    /**
 * Damage an enemy with enhanced behavior
 * @param {string} enemyId - ID of the enemy to damage
 * @param {number} damage - Amount of damage to deal
 * @returns {boolean} Whether the enemy was killed
 */
function damageEnemy(enemyId, damage) {
  const enemy = enemies.find(e => e.id === enemyId);
  
  if (!enemy || !enemy.active) {
    return false;
  }
  
  // Check for phasing immunity
  if (enemy.isPhased) {
    // Show immune effect
    const enemyEl = document.getElementById(enemy.id);
    if (enemyEl) {
      enemyEl.classList.add('damage-immune');
      setTimeout(() => {
        enemyEl.classList.remove('damage-immune');
      }, 300);
    }
    return false;
  }
  
  // Apply damage reduction for armored enemies
  let effectiveDamage = damage;
  if (enemy.behavior === "armored" || enemy.damageReduction) {
    const reduction = enemy.damageReduction || 0.3;
    effectiveDamage = damage * (1 - reduction);
    
    // Show reduced damage effect
    const enemyEl = document.getElementById(enemy.id);
    if (enemyEl) {
      enemyEl.classList.add('damage-reduced');
      setTimeout(() => {
        enemyEl.classList.remove('damage-reduced');
      }, 300);
    }
  }
  
  // Apply damage
  enemy.health -= effectiveDamage;
  
  // Publish enemy damage event
  EventSystem.publish(GameEvents.ENEMY_DAMAGE, {
    enemy: enemy,
    damage: effectiveDamage,
    originalDamage: damage
  });
  
  // Check if enemy is defeated
  if (enemy.health <= 0) {
    // Handle split behavior before defeating
    if (enemy.behavior === "split" && !enemy.hasSplit) {
      splitEnemy(enemy);
      enemy.hasSplit = true; // Prevent multiple splits
    }
    
    defeatEnemy(enemy);
    return true;
  }
  
  return false;
}

/**
 * Split an enemy into smaller enemies
 * @param {Object} enemy - The enemy to split
 */
function splitEnemy(enemy) {
  // Get split types
  const splitTypes = enemy.splitInto || [1, 1];
  
  // Create split enemies
  splitTypes.forEach(type => {
    const splitEnemy = createEnemy(type);
    if (splitEnemy) {
      // Position at the same location
      splitEnemy.currentPathIndex = enemy.currentPathIndex;
      splitEnemy.row = enemy.row;
      splitEnemy.col = enemy.col;
      
      // Add slight random offset for visual clarity
      splitEnemy.row += (Math.random() * 0.4) - 0.2;
      splitEnemy.col += (Math.random() * 0.4) - 0.2;
      
      // Show split effect
      const splitEnemyEl = document.getElementById(splitEnemy.id);
      if (splitEnemyEl) {
        splitEnemyEl.classList.add('split-spawn');
        setTimeout(() => {
          splitEnemyEl.classList.remove('split-spawn');
        }, 800);
      }
    }
  });
  
  // Increase enemies remaining
  enemiesRemaining += splitTypes.length;
  
  // Show split effect at original enemy
  const enemyEl = document.getElementById(enemy.id);
  if (enemyEl) {
    enemyEl.classList.add('splitting');
  }
}

/**
 * Defeat an enemy with enhanced effects
 * @param {Object} enemy - The enemy to defeat
 */
function defeatEnemy(enemy) {
  enemy.active = false;
  
  // Remove from enemies array
  enemies = enemies.filter(e => e.id !== enemy.id);
  
  // Calculate bonus for mini-bosses and bosses
  let bonusReward = 0;
  let bonusPoints = 0;
  
  if (enemy.isMinibloss) {
    bonusReward = 30;
    bonusPoints = 20;
  } else if (enemy.isBoss) {
    bonusReward = 100;
    bonusPoints = 50;
  }
  
  // Publish enemy defeated event with bonuses
  EventSystem.publish(GameEvents.ENEMY_DEFEATED, {
    enemy: enemy,
    reward: enemy.reward + bonusReward,
    points: enemy.points + bonusPoints
  });
  
  // Show defeat effect
  showDefeatEffect(enemy);
  
  // Decrement enemies remaining
  enemiesRemaining--;
}

/**
 * Show defeat effect for an enemy
 * @param {Object} enemy - The defeated enemy
 */
function showDefeatEffect(enemy) {
  const enemyEl = document.getElementById(enemy.id);
  if (!enemyEl) return;
  
  // Add defeat animation class
  enemyEl.classList.add('defeated');
  
  // Create particles for more impressive effect
  if (enemy.isMinibloss || enemy.isBoss) {
    createDefeatParticles(enemy, enemyEl);
  }
  
  // Remove element after animation
  setTimeout(() => {
    enemyEl.remove();
  }, 800);
}

/**
 * Create particle effects for defeated important enemies
 * @param {Object} enemy - The defeated enemy
 * @param {HTMLElement} enemyEl - The enemy element
 */
function createDefeatParticles(enemy, enemyEl) {
  const projectileContainer = document.getElementById('projectile-container');
  if (!projectileContainer) return;
  
  // Get enemy position
  const rect = enemyEl.getBoundingClientRect();
  const boardRect = document.getElementById('sudoku-board').getBoundingClientRect();
  
  const centerX = enemy.col * cellSize + cellSize / 2;
  const centerY = enemy.row * cellSize + cellSize / 2;
  
  // Create particles
  const particleCount = enemy.isBoss ? 20 : 10;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'defeat-particle';
    
    // Random position offset from center
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 20;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    // Set style
    particle.style.position = 'absolute';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = enemy.isBoss ? '#ff5500' : '#ffaa00';
    particle.style.zIndex = '30';
    
    // Add animation with random parameters
    particle.style.animation = `particle-fly ${0.5 + Math.random() * 0.5}s forwards`;
    particle.style.setProperty('--angle', `${angle}rad`);
    particle.style.setProperty('--distance', `${30 + Math.random() * 30}px`);
    
    // Add to container
    projectileContainer.appendChild(particle);
    
    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, 1500);
  }
}
    
    /**
     * Defeat an enemy
     * @param {Object} enemy - The enemy to defeat
     */
    function defeatEnemy(enemy) {
        enemy.active = false;
        
        // Remove from enemies array
        enemies = enemies.filter(e => e.id !== enemy.id);
        
        // Publish enemy defeated event
        EventSystem.publish(GameEvents.ENEMY_DEFEATED, {
            enemy: enemy,
            reward: enemy.reward,
            points: enemy.points
        });
        
        // Decrement enemies remaining
        enemiesRemaining--;
    }
    
    /**
     * Handle wave completion
     */
    function waveComplete() {
    isWaveActive = false;
    
    // Clear any enemies that might still be around
    enemies = [];
    
    // Publish wave complete event first, before incrementing
    // This way LevelsModule can handle the increment
    EventSystem.publish(GameEvents.WAVE_COMPLETE, {
        waveNumber: waveNumber
    });
    
    // Generate new path for the next wave immediately
    setTimeout(() => {
        // Use BoardManager if available, otherwise fallback to BoardManager
        if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
            const newPath = BoardManager.generateEnemyPath();
            path = newPath;
            
            // Notify other modules of the path change
            EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
                pathCells: newPath
            });
            
            // Also publish a specific event for path updates
            EventSystem.publish('path:updated', newPath);
        }
        else if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
            // Clear existing path
            const pathCells = BoardManager.getPathCells();
            if (pathCells && typeof pathCells.clear === 'function') {
                pathCells.clear();
            }
            
            // Generate new path
            BoardManager.generateEnemyPath();
            console.log("New path generated after wave completion");
            
            // Update the board to show the new path
            if (window.Game && typeof Game.updateBoard === 'function') {
                Game.updateBoard();
            }
            
            // Notify other modules of the path change
            if (typeof BoardManager.getPathArray === 'function') {
                const newPath = BoardManager.getPathArray();
                EventSystem.publish(GameEvents.SUDOKU_GENERATED, {
                    pathCells: newPath
                });
                
                // Also publish a specific event for path updates
                EventSystem.publish('path:updated', newPath);
            }
        }
    }, 500); // Short delay to make sure the wave completion processing is done
}

    /**
     * Set the wave number
     * @param {number} num - New wave number
     */
    function setWaveNumber(num) {
        if (typeof num === 'number' && num > 0) {
            waveNumber = num;
            console.log("EnemiesModule wave number set to: " + waveNumber);
        }
    }
    
    /**
     * Get all active enemies
     * @returns {Object[]} Array of active enemies
     */
    function getEnemies() {
        return enemies.filter(e => e.active);
    }
    
    /**
     * Get the current wave number
     * @returns {number} Current wave number
     */
    function getWaveNumber() {
        return waveNumber;
    }
    
    /**
     * Check if a wave is currently active
     * @returns {boolean} Whether a wave is active
     */
    function isWaveInProgress() {
        return isWaveActive;
    }
    
    /**
     * Get the cell size
     * @returns {number} Cell size in pixels
     */
    function getCellSize() {
        return cellSize;
    }
    
    /**
     * Set the cell size
     * @param {number} size - Cell size in pixels
     */
    function setCellSize(size) {
        cellSize = size;
    }
    
    /**
 * This code needs to be added to make the status effects visible on enemies.
 * Add this to the end of your enemies.js file or at the end of your game.js file
 * where the renderEnemies function is defined.
 */

// Apply status effect visuals to enemies
function applyStatusEffectsVisuals() {
  // First find all enemy elements
  const enemyElements = document.querySelectorAll('.enemy');
  
  // Check if we have any enemies
  if (!enemyElements.length) return;
  
  // Get all enemies from the module
  if (!window.EnemiesModule || typeof EnemiesModule.getEnemies !== 'function') return;
  
  const enemies = EnemiesModule.getEnemies();
  
  // Match enemies to their elements
  enemies.forEach(enemy => {
    const enemyElement = document.getElementById(enemy.id);
    if (!enemyElement) return;
    
    // Clear previous status classes first
    enemyElement.classList.remove('poisoned', 'slowed', 'stunned');
    
    // Check for status effects and apply the appropriate class
    if (enemy.poisoned) {
      enemyElement.classList.add('poisoned');
    }
    
    if (enemy.slowed) {
      enemyElement.classList.add('slowed');
    }
    
    if (enemy.stunned) {
      enemyElement.classList.add('stunned');
    }
    
    // Check for statusEffects array (used in the comprehensive implementation)
    if (enemy.statusEffects && Array.isArray(enemy.statusEffects) && enemy.statusEffects.length > 0) {
      enemy.statusEffects.forEach(effect => {
        if (effect.type === 'poison') {
          enemyElement.classList.add('poisoned');
        } else if (effect.type === 'slow') {
          enemyElement.classList.add('slowed');
        } else if (effect.type === 'stun') {
          enemyElement.classList.add('stunned');
        }
      });
    }
  });
}

// Call this every frame to update the status effect visuals
function injectStatusEffectVisuals() {
  // Method 1: Override the render function in game.js
  if (window.Game && typeof Game.render === 'function') {
    const originalRender = Game.render;
    Game.render = function() {
      // Call the original render function
      originalRender.apply(this, arguments);
      // Then apply our status effect visuals
      applyStatusEffectsVisuals();
    };
  }
  
  // Method 2: Override the renderEnemies function in game.js
  if (window.Game && typeof Game.renderEnemies === 'function') {
    const originalRenderEnemies = Game.renderEnemies;
    Game.renderEnemies = function() {
      // Call the original renderEnemies function
      originalRenderEnemies.apply(this, arguments);
      // Then apply our status effect visuals
      applyStatusEffectsVisuals();
    };
  }
  
  // Method 3: Set up a recurring interval if we can't override the render functions
  if ((!window.Game || typeof Game.render !== 'function') &&
    (!window.Game || typeof Game.renderEnemies !== 'function')) {
    setInterval(applyStatusEffectsVisuals, 100); // Update 10 times per second
  }
  
  console.log("Status effect visuals enabled");
}

// Additional CSS for the status effect indicators
function addStatusEffectStyles() {
  // Check if styles already exist
  if (document.getElementById('status-effect-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'status-effect-styles';
  styles.textContent = `
        /* Poisoned enemy */
        .enemy.poisoned {
            box-shadow: 0 0 8px #00ff00 !important;
            position: relative;
        }
        
        .enemy.poisoned::after {
            content: "☢️";
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 12px;
            z-index: 35;
        }
        
        /* Slowed enemy */
        .enemy.slowed {
            box-shadow: 0 0 8px #00ffff !important;
            position: relative;
            filter: brightness(0.7);
            transition: transform 0.5s !important; /* Make movement visibly slower */
        }
        
        .enemy.slowed::after {
            content: "🐌";
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 12px;
            z-index: 35;
        }
        
        /* Stunned enemy */
        .enemy.stunned {
            box-shadow: 0 0 8px #ffff00 !important;
            position: relative;
            animation: shake 0.5s infinite;
        }
        
        .enemy.stunned::after {
            content: "💫";
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 12px;
            z-index: 35;
        }
        
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
    `;
  
  document.head.appendChild(styles);
}

// Initialize everything
(function() {
  // Add the styles
  addStatusEffectStyles();
  
  // Set up the visual update system
  injectStatusEffectVisuals();
  
  // Also hook into GameEvents.TOWER_ATTACK to apply status effects
  EventSystem.subscribe(GameEvents.TOWER_ATTACK, function(data) {
    if (!data || !data.enemy || !data.tower) return;
    
    // Get tower type
    const towerType = data.tower.type;
    
    // Apply status effects based on tower type
    if (towerType === '2') { // Slowing tower
      data.enemy.slowed = true;
      
      // Save original speed if not already saved
      if (typeof data.enemy.originalSpeed === 'undefined') {
        data.enemy.originalSpeed = data.enemy.speed;
        data.enemy.speed *= 0.7; // Reduce speed by 30%
      }
      
      // Clear the effect after 3 seconds
      setTimeout(() => {
        if (data.enemy && data.enemy.active) {
          data.enemy.slowed = false;
          
          // Restore original speed
          if (typeof data.enemy.originalSpeed !== 'undefined') {
            data.enemy.speed = data.enemy.originalSpeed;
            delete data.enemy.originalSpeed;
          }
        }
      }, 3000);
    }
    else if (towerType === '4') { // Poison tower
      data.enemy.poisoned = true;
      
      // Apply damage over time
      let ticksRemaining = 5;
      const poisonInterval = setInterval(() => {
        if (!data.enemy || !data.enemy.active || ticksRemaining <= 0) {
          clearInterval(poisonInterval);
          
          // Make sure to remove the poisoned flag if the enemy is still active
          if (data.enemy && data.enemy.active) {
            data.enemy.poisoned = false;
          }
          return;
        }
        
        // Apply poison damage
        if (EnemiesModule && typeof EnemiesModule.damageEnemy === 'function') {
          EnemiesModule.damageEnemy(data.enemy.id, 5); // 5 damage per tick
        }
        
        ticksRemaining--;
      }, 1000); // Tick every second
    }
    else if (towerType === '6' && Math.random() < 0.25) { // Stun tower with 25% chance
      data.enemy.stunned = true;
      
      // Save original speed if not already saved
      if (typeof data.enemy.originalSpeed === 'undefined') {
        data.enemy.originalSpeed = data.enemy.speed;
        data.enemy.speed = 0; // Stop movement
      }
      
      // Clear the effect after 1 second
      setTimeout(() => {
        if (data.enemy && data.enemy.active) {
          data.enemy.stunned = false;
          
          // Restore original speed
          if (typeof data.enemy.originalSpeed !== 'undefined') {
            data.enemy.speed = data.enemy.originalSpeed;
            delete data.enemy.originalSpeed;
          }
        }
      }, 1000);
    }
  });
})();
    
    /**
     * Initialize event listeners
     */
    function initEventListeners() {
  // Listen for game initialization
  EventSystem.subscribe(GameEvents.GAME_INIT, function(options) {
    init(options);
  });
  
  // Listen for new game
  EventSystem.subscribe(GameEvents.GAME_START, function() {
    init();
  });
  
  // Listen for Sudoku board generation to get the path
  EventSystem.subscribe(GameEvents.SUDOKU_GENERATED, function(data) {
    if (data.pathCells) {
      path = data.pathCells;
    }
  });
  
  // Listen for specific path updates
  EventSystem.subscribe('path:updated', function(newPath) {
    if (newPath && Array.isArray(newPath)) {
      path = newPath;
    }
  });
  
  // Listen for BoardManager initialization
  if (window.BoardManager) {
    EventSystem.subscribe('boardmanager:initialized', function() {
      console.log("EnemiesModule: BoardManager initialized, updating path");
      path = BoardManager.getPathArray();
    });
  }
}
    // Initialize event listeners
    initEventListeners();
    
    // Public API
    return {
        init,
        startWave,
        update,
        damageEnemy,
        getEnemies,
        getWaveNumber,
        setWaveNumber,
        isWaveInProgress,
        getCellSize,
        setCellSize
    };
})();

// Make module available globally
window.EnemiesModule = EnemiesModule;

window.debugEnemyPath = function() {
  console.log("========= ENEMY PATH DEBUG =========");
  console.log("EnemiesModule.path:", EnemiesModule.path);
  
  const boardManager = window.BoardManager;
  if (boardManager && typeof boardManager.getPathArray === 'function') {
    console.log("BoardManager.getPathArray():", boardManager.getPathArray());
  }
  
  if (window.BoardManager && typeof BoardManager.getPathArray === 'function') {
    console.log("BoardManager.getPathArray():", BoardManager.getPathArray());
  }
  
  if (EnemiesModule.path && EnemiesModule.path.length > 0) {
    console.log("Path elements format check:");
    for (let i = 0; i < Math.min(EnemiesModule.path.length, 5); i++) {
      console.log(`Element ${i}:`, EnemiesModule.path[i],
        "Is Array:", Array.isArray(EnemiesModule.path[i]));
    }
    return true;
  } else {
    console.log("No path available or empty path!");
    return false;
  }
};