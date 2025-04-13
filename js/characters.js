/**
 * Updated Characters Object for Sudoku Tower Defense
 * Focuses on single unique ability per character
 */

// Character definitions with single unique ability
const characters = {
  strategist: {
    name: "Strategist",
    description: "Master of battlefield control and enemy redirection.",
    icon: "🧠",
    color: "#7e57c2",
    baseMaxMana: 10,
    startingMana: 5,
    uniqueAbility: {
      id: "redirect_path",
      name: "Redirect Path",
      description: "Generates a new path for enemies to follow",
      manaCost: 5,
      icon: "↪️",
      cooldown: 0,
      execute: function() {
        if (window.BoardManager && typeof BoardManager.generateEnemyPath === 'function') {
          const newPath = BoardManager.generateEnemyPath();
          
          // Notify relevant modules about the path update
          EventSystem.publish(GameEvents.PATH_CHANGED, newPath);
          EventSystem.publish(GameEvents.STATUS_MESSAGE, "Enemy path redirected!");
          
          // Update board to show the new path
          if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
          }
          
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
    startingMana: 5,
    uniqueAbility: {
      id: "power_surge",
      name: "Power Surge",
      description: "Temporarily doubles all tower damage",
      manaCost: 6,
      icon: "⚡",
      cooldown: 0,
      execute: function() {
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
            const currentTowers = TowersModule.getTowers();
            currentTowers.forEach(tower => {
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
    baseMaxMana: 12,
    startingMana: 6,
    uniqueAbility: {
      id: "precision_strike",
      name: "Precision Strike",
      description: "Deal 30% max health damage to all enemies on screen",
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
    startingMana: 5,
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
    baseMaxMana: 8,
    startingMana: 4,
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
            TowersModule.createTower(cell.value, cell.row, cell.col, { free: true });
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
  },
  
  architect: {
    name: "Architect",
    description: "Master builder who specializes in upgrading and reinforcing structures.",
    icon: "🏛️",
    color: "#795548", 
    baseMaxMana: 10,
    startingMana: 5,
    uniqueAbility: {
      id: "fortify_grid",
      name: "Fortify Grid",
      description: "Upgrades 3 random existing towers by one level",
      manaCost: 6,
      icon: "⬆️",
      cooldown: 0,
      execute: function() {
        if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
          const towers = TowersModule.getTowers();
          
          // Filter to get only valid towers (matching Sudoku solution)
          const validTowers = towers.filter(tower => {
            if (tower.type === 'special') return false; // Skip special towers
            const towerValue = parseInt(tower.type);
            if (isNaN(towerValue)) return false;
            
            // Check if tower matches solution using BoardManager
            const boardManager = window.BoardManager || window.SudokuModule;
            if (boardManager && typeof boardManager.getSolution === 'function') {
              const solution = boardManager.getSolution();
              return solution[tower.row][tower.col] === towerValue;
            }
            return true; // If can't verify, assume valid
          });
          
          if (validTowers.length === 0) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "No valid towers to upgrade!");
            return false;
          }
          
          // Shuffle and select up to 3 towers
          shuffleArray(validTowers);
          const towersToUpgrade = validTowers.slice(0, Math.min(3, validTowers.length));
          
          // Upgrade each tower
          towersToUpgrade.forEach(tower => {
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.8);
            tower.range = Math.floor(tower.range * 1.3);
            tower.attackSpeed *= 0.7;
            
            // Highlight the tower
            const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
            if (towerElement) {
              towerElement.classList.add('ability-highlight');
              setTimeout(() => {
                towerElement.classList.remove('ability-highlight');
              }, 3000);
            }
          });
          
          // Visual effect
          showEffectIndicator("Fortify Grid", `Upgraded ${towersToUpgrade.length} towers!`);
          
          // Update board to show upgrades
          if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
          }
          
          return true;
        }
        return false;
      }
    }
  },
  
  oracle: {
    name: "Oracle",
    description: "Seer who can glimpse the future flow of the battlefield.",
    icon: "👁️",
    color: "#3f51b5", 
    baseMaxMana: 8,
    startingMana: 3,
    uniqueAbility: {
      id: "future_sight",
      name: "Future Sight",
      description: "Shows the next 3 waves of enemies",
      manaCost: 3,
      icon: "🔍",
      cooldown: 0,
      execute: function() {
        // Get current wave number
        const currentWave = window.EnemiesModule ? 
          EnemiesModule.getWaveNumber() : 
          (window.LevelsModule ? LevelsModule.getCurrentWave() : 1);
        
        // Generate preview of next 3 waves
        const wavePreview = [];
        
        for (let i = 0; i < 3; i++) {
          const waveNum = currentWave + i + 1;
          const enemyTypes = [];
          
          // Calculate number of enemies based on wave number (same logic as in enemies.js)
          const baseEnemyCount = 6;
          const enemyCount = baseEnemyCount + Math.floor((waveNum - 1) * 3);
          
          // Determine which enemy types to use in this wave
          const availableTypes = Math.min(9, Math.ceil(waveNum / 2));
          
          // Generate simplified enemy composition
          let composition = {};
          for (let j = 0; j < enemyCount; j++) {
            // Determine enemy type - higher waves have more varied and stronger enemies
            let enemyType;
            
            // Boss enemy at the end of each wave (last 10% of enemies)
            if (j >= enemyCount * 0.9 && waveNum % 3 === 0) {
              enemyType = 'boss';
            } else {
              // Random enemy type based on available types
              enemyType = Math.ceil(Math.random() * availableTypes);
            }
            
            composition[enemyType] = (composition[enemyType] || 0) + 1;
          }
          
          // Convert to readable format
          Object.keys(composition).forEach(type => {
            const emoji = type === 'boss' ? '👹' : `${type}️⃣`;
            enemyTypes.push(`${emoji} x${composition[type]}`);
          });
          
          wavePreview.push({
            wave: waveNum,
            count: enemyCount,
            types: enemyTypes
          });
        }
        
        // Show preview
        showWavePreview(wavePreview);
        
        return true;
      }
    }
  },
  
  alchemist: {
    name: "Alchemist",
    description: "Master of transformation who can correct mistakes and turn weaknesses into strengths.",
    icon: "🧪",
    color: "#8bc34a", 
    baseMaxMana: 10,
    startingMana: 5,
    uniqueAbility: {
      id: "transmutation",
      name: "Transmutation",
      description: "Converts an incorrect tower into a correct one",
      manaCost: 5,
      icon: "✨",
      cooldown: 0,
      execute: function() {
        if (window.TowersModule && typeof TowersModule.getTowers === 'function') {
          const towers = TowersModule.getTowers();
          const boardManager = window.BoardManager || window.SudokuModule;
          
          if (!boardManager || typeof boardManager.getSolution !== 'function') return false;
          
          const solution = boardManager.getSolution();
          
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
          
          if (incorrectTowers.length === 0) {
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "No incorrect towers to transmute!");
            return false;
          }
          
          // Choose first incorrect tower to fix
          const towerToFix = incorrectTowers[0];
          const correctValue = solution[towerToFix.row][towerToFix.col];
          
          // Remove the incorrect tower
          TowersModule.removeTower(towerToFix.id);
          
          // Place a new tower with the correct value
          if (typeof TowersModule.createTower === 'function') {
            const newTower = TowersModule.createTower(correctValue, towerToFix.row, towerToFix.col, { free: true });
            
            // Apply the same level upgrade
            if (newTower && towerToFix.level > 1) {
              for (let i = 1; i < towerToFix.level; i++) {
                newTower.level++;
                newTower.damage = Math.floor(newTower.damage * 1.8);
                newTower.range = Math.floor(newTower.range * 1.3);
                newTower.attackSpeed *= 0.7;
              }
            }
            
            // Highlight the new tower
            const towerElement = document.querySelector(`.sudoku-cell[data-row="${towerToFix.row}"][data-col="${towerToFix.col}"]`);
            if (towerElement) {
              towerElement.classList.add('ability-highlight');
              setTimeout(() => {
                towerElement.classList.remove('ability-highlight');
              }, 3000);
            }
          } else {
            // Fallback - update the board directly
            boardManager.setCellValue(towerToFix.row, towerToFix.col, correctValue);
          }
          
          // Visual effect
          showEffectIndicator("Transmutation", `Fixed an incorrect ${towerToFix.type} tower to ${correctValue}!`);
          
          // Update board
          if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
          }
          
          return true;
        }
        return false;
      }
    }
  },
  
  tinkerer: {
    name: "Tinkerer",
    description: "Quick-thinking inventor who creates temporary solutions to immediate problems.",
    icon: "🔧",
    color: "#607d8b", 
    baseMaxMana: 10,
    startingMana: 6,
    uniqueAbility: {
      id: "rapid_deployment",
      name: "Rapid Deployment",
      description: "Places 3 temporary towers at random valid positions",
      manaCost: 6,
      icon: "⚙️",
      cooldown: 0,
      execute: function() {
        const boardManager = window.BoardManager || window.SudokuModule;
        if (!boardManager) return false;
        
        const board = boardManager.getBoard();
        const solution = boardManager.getSolution();
        const pathCells = boardManager.getPathCells();
        
        // Find valid empty cells
        const validCells = [];
        
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0 && !pathCells.has(`${row},${col}`)) {
              validCells.push({
                row: row,
                col: col,
                value: solution[row][col]
              });
            }
          }
        }
        
        if (validCells.length === 0) {
          EventSystem.publish(GameEvents.STATUS_MESSAGE, "No valid positions for temporary towers!");
          return false;
        }
        
        // Shuffle and take up to 3 cells
        shuffleArray(validCells);
        const cellsToUse = validCells.slice(0, Math.min(3, validCells.length));
        const placedTowers = [];
        
        // Place temporary towers
        cellsToUse.forEach(cell => {
          if (window.TowersModule && typeof TowersModule.createTower === 'function') {
            const tower = TowersModule.createTower(cell.value, cell.row, cell.col, { free: true });
            if (tower) {
              tower.isTemporary = true;
              tower.duration = 15; // seconds
              placedTowers.push(tower);
              
              // Add visual indicator
              const towerElement = document.querySelector(`.sudoku-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
              if (towerElement) {
                towerElement.classList.add('temporary-tower');
              }
            }
          }
        });
        
        if (placedTowers.length === 0) {
          EventSystem.publish(GameEvents.STATUS_MESSAGE, "Failed to place temporary towers!");
          return false;
        }
        
        // Set up timer to remove the towers
        setTimeout(() => {
          placedTowers.forEach(tower => {
            if (window.TowersModule && typeof TowersModule.removeTower === 'function') {
              TowersModule.removeTower(tower.id);
              
              // Remove visual indicator
              const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
              if (towerElement) {
                towerElement.classList.remove('temporary-tower');
              }
            }
          });
          
          EventSystem.publish(GameEvents.STATUS_MESSAGE, "Temporary towers expired!");
          
          // Update board
          if (window.Game && typeof Game.updateBoard === 'function') {
            Game.updateBoard();
          }
        }, 15000);
        
        // Visual effect
        showEffectIndicator("Rapid Deployment", `Placed ${placedTowers.length} temporary towers!`);
        
        return true;
      }
    }
  },
  
  chronomancer: {
    name: "Chronomancer",
    description: "Master of time who can momentarily halt the flow of battle.",
    icon: "⏳",
    color: "#e91e63", 
    baseMaxMana: 12,
    startingMana: 4,
    uniqueAbility: {
      id: "time_freeze",
      name: "Time Freeze",
      description: "Completely pauses enemy movement for 5 seconds",
      manaCost: 8,
      icon: "❄️",
      cooldown: 0,
      execute: function() {
        if (window.EnemiesModule && typeof EnemiesModule.getEnemies === 'function') {
          const enemies = EnemiesModule.getEnemies();
          
          // Store original speeds and freeze enemies
          enemies.forEach(enemy => {
            enemy.originalSpeed = enemy.speed;
            enemy.speed = 0; // Complete stop
            
            // Visual effect - add frozen class
            const enemyElement = document.getElementById(enemy.id);
            if (enemyElement) {
              enemyElement.classList.add('frozen');
            }
          });
          
          // Visual effect
          showEffectIndicator("Time Freeze", "All enemies frozen for 5 seconds!");
          
          // Create freeze overlay
          const freezeOverlay = document.createElement('div');
          freezeOverlay.className = 'freeze-overlay';
          freezeOverlay.style.position = 'fixed';
          freezeOverlay.style.top = '0';
          freezeOverlay.style.left = '0';
          freezeOverlay.style.width = '100%';
          freezeOverlay.style.height = '100%';
          freezeOverlay.style.backgroundColor = 'rgba(135, 206, 250, 0.2)';
          freezeOverlay.style.zIndex = '100';
          freezeOverlay.style.pointerEvents = 'none';
          document.body.appendChild(freezeOverlay);
          
          // Reset after 5 seconds
          setTimeout(() => {
            // Restore original speeds
            EnemiesModule.getEnemies().forEach(enemy => {
              if (enemy.originalSpeed) {
                enemy.speed = enemy.originalSpeed;
                delete enemy.originalSpeed;
                
                // Remove visual effects
                const enemyElement = document.getElementById(enemy.id);
                if (enemyElement) {
                  enemyElement.classList.remove('frozen');
                }
              }
            });
            
            // Remove overlay
            if (freezeOverlay.parentNode) {
              freezeOverlay.parentNode.removeChild(freezeOverlay);
            }
            
            EventSystem.publish(GameEvents.STATUS_MESSAGE, "Time Freeze ended");
          }, 5000);
          
          return true;
        }
        return false;
      }
    }
  },
  gambler: {
    name: "Gambler",
    description: "A risk-taker who thrives on luck and chaos.",
    icon: "🎲",
    color: "#ab47bc",
    baseMaxMana: 9,
    startingMana: 4,
    uniqueAbility: {
      id: "lucky_draw",
      name: "Lucky Draw",
      description: "Roll for a reward: gain 100 currency, gain 2 lives, or lose 1 life.",
      manaCost: 4,
      icon: "🎰",
      cooldown: 0,
      execute: function() {
        const roll = Math.random();
        if (roll < 0.33) {
          PlayerModule.addCurrency?.(100);
          showEffectIndicator("Lucky Draw", "You won 100 currency!");
        } else if (roll < 0.66) {
          PlayerModule.addLife?.(2);
          showEffectIndicator("Lucky Draw", "You gained 2 lives!");
        } else {
          PlayerModule.loseLife?.(1);
          showEffectIndicator("Lucky Draw", "Ouch! You lost 1 life!");
        }
        return true;
      }
    }
  },
  
  paladin: {
    name: "Paladin",
    description: "A divine protector who restores hope in battle.",
    icon: "🛡️",
    color: "#fdd835",
    baseMaxMana: 8,
    startingMana: 4,
    uniqueAbility: {
      id: "divine_renewal",
      name: "Divine Renewal",
      description: "Restore 1 life.",
      manaCost: 6,
      icon: "❤️",
      cooldown: 0,
      execute: function() {
        PlayerModule.addLife?.(1);
        showEffectIndicator("Divine Renewal", "1 life restored!");
        return true;
      }
    }
  },
  
  merchant: {
    name: "Merchant",
    description: "A savvy trader who always finds a profit margin.",
    icon: "💰",
    color: "#ffb300",
    baseMaxMana: 8,
    startingMana: 5,
    uniqueAbility: {
      id: "gold_rush",
      name: "Gold Rush",
      description: "Gain 50 currency.",
      manaCost: 3,
      icon: "🪙",
      cooldown: 0,
      execute: function() {
        PlayerModule.addCurrency?.(50);
        showEffectIndicator("Gold Rush", "You gained 50 currency!");
        return true;
      }
    }
  },
  
  hacker: {
    name: "Hacker",
    description: "A tech rogue who rewrites tower systems on the fly.",
    icon: "🖥️",
    color: "#00bcd4",
    baseMaxMana: 9,
    startingMana: 5,
    uniqueAbility: {
      id: "system_reboot",
      name: "System Reboot",
      description: "Reset all tower cooldowns.",
      manaCost: 5,
      icon: "🔁",
      cooldown: 0,
      execute: function() {
        if (TowersModule.getTowers) {
          const towers = TowersModule.getTowers();
          towers.forEach(tower => tower.attackCooldown = 0);
          showEffectIndicator("System Reboot", "All tower cooldowns reset!");
          return true;
        }
        return false;
      }
    }
  }
  
  
};

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

/**
 * Helper function to shuffle an array
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Show wave preview overlay
 * @param {Array} wavePreview - Array of wave preview data
 */
function showWavePreview(wavePreview) {
  // Create preview container
  const container = document.createElement('div');
  container.className = 'wave-preview';
  container.style.position = 'fixed';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  container.style.color = 'white';
  container.style.padding = '20px';
  container.style.borderRadius = '10px';
  container.style.zIndex = '1000';
  container.style.minWidth = '300px';
  container.style.maxWidth = '90%';
  container.style.textAlign = 'center';
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Future Sight';
  title.style.color = '#3f51b5';
  title.style.marginBottom = '15px';
  container.appendChild(title);
  
  // Add wave previews
  wavePreview.forEach(wave => {
    const waveElement = document.createElement('div');
    waveElement.style.margin = '15px 0';
    waveElement.style.padding = '10px';
    waveElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    waveElement.style.borderRadius = '5px';
    
    const waveTitle = document.createElement('div');
    waveTitle.textContent = `Wave ${wave.wave}`;
    waveTitle.style.fontWeight = 'bold';
    waveTitle.style.fontSize = '18px';
    waveTitle.style.marginBottom = '5px';
    waveElement.appendChild(waveTitle);
    
    const waveCount = document.createElement('div');
    waveCount.textContent = `${wave.count} enemies`;
    waveCount.style.marginBottom = '5px';
    waveElement.appendChild(waveCount);
    
    const waveTypes = document.createElement('div');
    waveTypes.textContent = wave.types.join(', ');
    waveElement.appendChild(waveTypes);
    
    container.appendChild(waveElement);
  });
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '15px';
  closeButton.style.backgroundColor = '#3f51b5';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.padding = '8px 16px';
  closeButton.style.borderRadius = '4px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => container.remove();
  container.appendChild(closeButton);
  
  // Add to body
  document.body.appendChild(container);
  
  // Auto close after 15 seconds
  setTimeout(() => {
    if (container.parentNode) {
      container.remove();
    }
  }, 15000);
}

// At the end of characters.js
window.characters = characters;