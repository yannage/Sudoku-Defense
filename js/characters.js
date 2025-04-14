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
      description: "Reveals 1 correct cell in the puzzle",
      manaCost: 4,
      icon: "💡",
      cooldown: 0,
      execute: function() {
        const boardManager = window.BoardManager;
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
        
        // Shuffle and take up to 1 cells
        shuffleArray(emptyCells);
        const cellsToReveal = emptyCells.slice(0, Math.min(1, emptyCells.length));
        
        // Place towers in these cells
        cellsToReveal.forEach(cell => {
          if (window.TowersModule && typeof TowersModule.createTower === 'function') {
            placeTowerWithBoardSync(cell.value, cell.row, cell.col, { free: true });
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
            const boardManager = window.BoardManager;
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
          const boardManager = window.BoardManager;
          
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
        const boardManager = window.BoardManager;
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
            const tower = placeTowerWithBoardSync(cell.value, cell.row, cell.col, { free: true });
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
  completer: {
  name: "Completer",
  description: "Snaps close-to-complete sections into place.",
  icon: "✅",
  color: "#00c853",
  baseMaxMana: 10,
  startingMana: 5,
  uniqueAbility: {
    id: "auto_complete_one_missing",
    name: "Sudoku Finisher",
    description: "Completes any row, column, or 3x3 box missing only one number.",
    manaCost: 6,
    icon: "➕",
    cooldown: 0,
    execute: function() {
      const boardManager = window.BoardManager;
      const board = boardManager.getBoard?.();
      const solution = boardManager.getSolution?.();
      
      if (!board || !solution) return false;
      
      const highlightAndSet = (r, c, value) => {
        TowersModule?.createTower?.(value, r, c, { free: true });
        
        const el = document.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
        if (el) {
          el.classList.add('ability-highlight');
          setTimeout(() => el.classList.remove('ability-highlight'), 3000);
        }
      };
      
      const completeSet = () => {
        // Check rows
        for (let r = 0; r < 9; r++) {
          const rowVals = board[r];
          const missing = rowVals.reduce((acc, val, c) => {
            if (val === 0) acc.push(c);
            return acc;
          }, []);
          if (missing.length === 1) {
            const col = missing[0];
            highlightAndSet(r, col, solution[r][col]);
            return true;
          }
        }
        
        // Check columns
        for (let c = 0; c < 9; c++) {
          const missing = [];
          for (let r = 0; r < 9; r++) {
            if (board[r][c] === 0) missing.push(r);
          }
          if (missing.length === 1) {
            const row = missing[0];
            highlightAndSet(row, c, solution[row][c]);
            return true;
          }
        }
        
        // Check boxes
        for (let boxRow = 0; boxRow < 3; boxRow++) {
          for (let boxCol = 0; boxCol < 3; boxCol++) {
            const missing = [];
            for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
              for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                if (board[r][c] === 0) missing.push({ r, c });
              }
            }
            if (missing.length === 1) {
              const { r, c } = missing[0];
              highlightAndSet(r, c, solution[r][c]);
              return true;
            }
          }
        }
        
        return false;
      };
      
      if (completeSet()) {
        showEffectIndicator("Sudoku Finisher", "Filled in the missing number!");
        return true;
      }
      
      EventSystem.publish(GameEvents.STATUS_MESSAGE, "No nearly complete sets found!");
      return false;
    }
  }
},

solver: {
  name: "Solver",
  description: "Applies logic to deduce safe placements without committing.",
  icon: "🧠",
  color: "#4db6ac",
  baseMaxMana: 9,
  startingMana: 5,
  uniqueAbility: {
    id: "hint_mode",
    name: "Hint Mode",
    description: "Temporarily shows 3 suggested correct values in unused cells.",
    manaCost: 5,
    icon: "💡",
    cooldown: 0,
    execute: function() {
      const boardManager = window.BoardManager;
      const board = boardManager.getBoard?.();
      const solution = boardManager.getSolution?.();
      const path = boardManager.getPathCells?.();
      
      if (!board || !solution || !path) return false;
      
      const hints = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0 && !path.has(`${r},${c}`)) {
            hints.push({ row: r, col: c, value: solution[r][c] });
          }
        }
      }
      
      if (hints.length === 0) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "No valid hint positions found.");
        return false;
      }
      
      shuffleArray(hints);
      const toShow = hints.slice(0, 3);
      toShow.forEach(cell => {
        const el = document.querySelector(`.sudoku-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
        if (el) {
          el.textContent = cell.value;
          el.classList.add('ability-highlight');
          setTimeout(() => {
            el.textContent = '';
            el.classList.remove('ability-highlight');
          }, 5000);
        }
      });
      
      showEffectIndicator("Hint Mode", "Hints shown temporarily.");
      return true;
    }
  }
},
// Speed Solver Character - Rewards fast Sudoku solving with tower damage boosts
// Speed Solver Character - Rewards fast Sudoku solving with tower damage boosts
// Updated to keep damage multiplier visible after timer ends
// Speed Solver Character - With compact top-middle damage indicator
speedSolver: {
  name: "Speed Solver",
  description: "Gains power from quickly solving sections of the puzzle.",
  icon: "⏱️",
  color: "#ff7043",
  baseMaxMana: 9,
  startingMana: 5,
  uniqueAbility: {
    id: "time_challenge",
    name: "Time Challenge",
    description: "Start a 20-second challenge to solve cells. Each correct placement increases tower damage.",
    manaCost: 5,
    icon: "🏃",
    cooldown: 0,
    execute: function() {
      const challengeDuration = 20; // seconds
      let correctPlacements = 0;
      let challengeActive = true;
      
      // Remove any existing damage boost indicator before starting a new challenge
      const existingIndicator = document.getElementById('damage-boost-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      // Add the CSS for the speed challenge
      if (!document.getElementById('speed-solver-styles')) {
        const styles = document.createElement('style');
        styles.id = 'speed-solver-styles';
        styles.textContent = `
          .speed-challenge-timer {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 64px;
            color: #ff7043;
            z-index: 100;
            opacity: 0.7;
            text-shadow: 0 0 10px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: transform 0.2s;
          }
          
          .speed-challenge-timer.warning {
            color: #f44336;
            animation: pulse 0.5s infinite alternate;
          }
          
          @keyframes pulse {
            from { transform: translate(-50%, -50%) scale(1); }
            to { transform: translate(-50%, -50%) scale(1.1); }
          }
          
          .speed-solve-correct {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            color: #4caf50;
            pointer-events: none;
            animation: correct-mark 0.5s forwards;
            z-index: 10;
          }
          
          @keyframes correct-mark {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
          }
          
          .speed-solve-stats {
            position: fixed;
            top: 30%;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.6);
            padding: 10px;
            border-radius: 5px;
            color: white;
            z-index: 99;
            pointer-events: none;
            font-size: 14px;
          }
          
          .tower-damage-boosted {
            animation: damage-boost-pulse 2s infinite alternate;
          }
          
          @keyframes damage-boost-pulse {
            from { filter: drop-shadow(0 0 3px rgba(255, 112, 67, 0.5)); }
            to { filter: drop-shadow(0 0 8px rgba(255, 112, 67, 0.9)); }
          }
          
          .damage-boost-indicator {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 4px 10px;
            border-radius: 15px;
            font-weight: bold;
            z-index: 95;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            font-size: 12px;
            display: flex;
            align-items: center;
            white-space: nowrap;
          }
          
          .damage-boost-indicator .boost-icon {
            color: #ff7043;
            margin-right: 5px;
            font-size: 14px;
          }
          
          .damage-boost-indicator .boost-value {
            color: #ff7043;
            font-weight: bold;
          }
          
          .damage-boost-indicator .boost-time {
            margin-left: 5px;
            opacity: 0.8;
            font-size: 11px;
            font-weight: normal;
          }
          
          .damage-boost-indicator.active {
            border: 1px solid rgba(255, 112, 67, 0.3);
          }
          
          .damage-boost-indicator.active .boost-icon {
            animation: icon-pulse 1s infinite alternate;
          }
          
          @keyframes icon-pulse {
            from { opacity: 0.7; }
            to { opacity: 1; transform: scale(1.1); }
          }
        `;
        document.head.appendChild(styles);
      }
      
      // Create countdown timer UI
      const timerElement = document.createElement('div');
      timerElement.className = 'speed-challenge-timer';
      timerElement.textContent = challengeDuration;
      document.body.appendChild(timerElement);
      
      // Create stats display
      const statsElement = document.createElement('div');
      statsElement.className = 'speed-solve-stats';
      statsElement.innerHTML = `<div>Correct Placements: <span id="correct-count">0</span></div>
                              <div>Damage Boost: <span id="damage-boost">0%</span></div>`;
      document.body.appendChild(statsElement);
      
      // Start the challenge
      let timeRemaining = challengeDuration;
      showEffectIndicator("Speed Challenge Started", "Place as many correct towers as possible in 20 seconds!");
      EventSystem.publish(GameEvents.STATUS_MESSAGE, "Speed Challenge: Place Sudoku numbers as fast as you can!");
      
      // Update timer every second
      const timerInterval = setInterval(() => {
        timeRemaining--;
        timerElement.textContent = timeRemaining;
        
        // Add warning animation for last 5 seconds
        if (timeRemaining <= 5) {
          timerElement.classList.add('warning');
        }
        
        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          endChallenge();
        }
      }, 1000);
      
      // Track tower placements during challenge
      const placementHandler = function(tower) {
        if (!challengeActive) return;
        
        // Get board solution from BoardManager
        const solution = BoardManager.getSolution();
        if (!solution) return;
        
        // Check if placement matches solution
        if (solution[tower.row][tower.col] === parseInt(tower.type)) {
          correctPlacements++;
          
          // Update stats display
          const correctCountElement = document.getElementById('correct-count');
          if (correctCountElement) {
            correctCountElement.textContent = correctPlacements;
          }
          
          const damageBoostElement = document.getElementById('damage-boost');
          if (damageBoostElement) {
            damageBoostElement.textContent = `${Math.round(correctPlacements * 5)}%`;
          }
          
          // Visual feedback
          const cellElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
          if (cellElement) {
            const mark = document.createElement('div');
            mark.className = 'speed-solve-correct';
            mark.textContent = '✓';
            cellElement.appendChild(mark);
            
            // Remove after animation
            setTimeout(() => {
              if (mark.parentNode === cellElement) {
                cellElement.removeChild(mark);
              }
            }, 500);
          }
        }
      };
      
      // Subscribe to tower placement event
      EventSystem.subscribe(GameEvents.TOWER_PLACED, placementHandler);
      
      function endChallenge() {
        challengeActive = false;
        
        // Remove timer and stats elements
        if (timerElement.parentNode) {
          timerElement.parentNode.removeChild(timerElement);
        }
        
        if (statsElement.parentNode) {
          statsElement.parentNode.removeChild(statsElement);
        }
        
        // Apply tower damage boost based on performance
        const damageBoost = 1 + (correctPlacements * 0.05); // 5% per correct placement
        const boostPercentage = Math.round((damageBoost-1)*100);
        
        if (correctPlacements > 0) {
          const towers = TowersModule.getTowers();
          towers.forEach(tower => {
            // Store original damage if not already stored
            tower.originalDamage = tower.originalDamage || tower.damage;
            // Apply damage boost
            tower.damage = Math.floor(tower.originalDamage * damageBoost);
            
            // Add visual indicator to boosted towers
            const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
            if (towerElement) {
              towerElement.classList.add('tower-damage-boosted');
            }
          });
          
          // Create compact damage boost indicator
          const boostIndicator = document.createElement('div');
          boostIndicator.id = 'damage-boost-indicator';
          boostIndicator.className = 'damage-boost-indicator active';
          boostIndicator.innerHTML = `
            <span class="boost-icon">⚡</span>
            Damage <span class="boost-value">+${boostPercentage}%</span>
            <span class="boost-time">30s</span>
          `;
          document.body.appendChild(boostIndicator);
          
          // Show challenge results
          showEffectIndicator("Challenge Complete", 
            `${correctPlacements} correct placements! Towers deal +${boostPercentage}% damage for 30s!`);
          
          // Update the countdown timer in the indicator
          let boostTimeRemaining = 30;
          const boostTimerInterval = setInterval(() => {
            boostTimeRemaining--;
            
            // Update time display
            const timeElement = boostIndicator.querySelector('.boost-time');
            if (timeElement) {
              timeElement.textContent = `${boostTimeRemaining}s`;
            }
            
            if (boostTimeRemaining <= 0) {
              clearInterval(boostTimerInterval);
              
              // Don't remove indicator, just update it and remove active state
              boostIndicator.classList.remove('active');
              boostIndicator.innerHTML = `
                <span class="boost-icon">⚡</span>
                Damage <span class="boost-value">+${boostPercentage}%</span>
              `;
              
              // Reset towers damage
              const currentTowers = TowersModule.getTowers();
              currentTowers.forEach(tower => {
                if (tower.originalDamage) {
                  tower.damage = tower.originalDamage;
                  delete tower.originalDamage;
                  
                  // Remove visual indicator
                  const towerElement = document.querySelector(`.sudoku-cell[data-row="${tower.row}"][data-col="${tower.col}"]`);
                  if (towerElement) {
                    towerElement.classList.remove('tower-damage-boosted');
                  }
                }
              });
              
              EventSystem.publish(GameEvents.STATUS_MESSAGE, "Speed Solver damage boost ended");
            }
          }, 1000);
        } else {
          showEffectIndicator("Challenge Failed", "No correct placements made!");
          
          // Create minimal indicator showing 0% boost
          const boostIndicator = document.createElement('div');
          boostIndicator.id = 'damage-boost-indicator';
          boostIndicator.className = 'damage-boost-indicator';
          boostIndicator.innerHTML = `
            <span class="boost-icon">⚡</span>
            Damage <span class="boost-value">+0%</span>
          `;
          document.body.appendChild(boostIndicator);
        }
        
        return true;
      }
      
      return true;
    }
  }
},
// Visualizer Character - Shows heat maps of rows, columns, or grids with few cells left
visualizer: {
  name: "Visualizer",
  description: "Uses pattern recognition to identify nearly completed sections.",
  icon: "👁️‍🗨️",
  color: "#4db6ac",
  baseMaxMana: 8,
  startingMana: 4,
  uniqueAbility: {
    id: "heat_vision",
    name: "Heat Vision",
    description: "Highlights up to 3 rows, columns, or grids that are closest to completion.",
    manaCost: 4,
    icon: "🔍",
    cooldown: 0,
    execute: function() {
      // Add the CSS for heat vision if not already added
      if (!document.getElementById('visualizer-styles')) {
        const styles = document.createElement('style');
        styles.id = 'visualizer-styles';
        styles.textContent = `
          .heat-vision-highlight-1 {
            background-color: rgba(76, 175, 80, 0.3) !important;
            position: relative;
          }
          
          .heat-vision-highlight-2 {
            background-color: rgba(255, 193, 7, 0.3) !important;
            position: relative;
          }
          
          .heat-vision-highlight-3 {
            background-color: rgba(244, 67, 54, 0.3) !important;
            position: relative;
          }
          
          .heat-vision-highlight-1::after,
          .heat-vision-highlight-2::after,
          .heat-vision-highlight-3::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            animation: heat-pulse 2s infinite;
            pointer-events: none;
            z-index: 4;
          }
          
          .heat-vision-highlight-1::after {
            box-shadow: inset 0 0 8px rgba(76, 175, 80, 0.7);
          }
          
          .heat-vision-highlight-2::after {
            box-shadow: inset 0 0 8px rgba(255, 193, 7, 0.7);
          }
          
          .heat-vision-highlight-3::after {
            box-shadow: inset 0 0 8px rgba(244, 67, 54, 0.7);
          }
          
          @keyframes heat-pulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.3; }
          }
          
          .cells-remaining {
            position: absolute;
            top: 2px;
            right: 2px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 1px 3px;
            border-radius: 3px;
            font-size: 10px;
            z-index: 5;
          }
          
          .heat-vision-legend {
            position: fixed;
            top: 20%;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            color: white;
            z-index: 99;
            font-size: 12px;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
          }
          
          .legend-color {
            width: 15px;
            height: 15px;
            margin-right: 5px;
            border-radius: 3px;
          }
          
          .legend-color-1 {
            background-color: rgba(76, 175, 80, 0.7);
          }
          
          .legend-color-2 {
            background-color: rgba(255, 193, 7, 0.7);
          }
          
          .legend-color-3 {
            background-color: rgba(244, 67, 54, 0.7);
          }
        `;
        document.head.appendChild(styles);
      }
      
      // Get board data from BoardManager
      const board = BoardManager.getBoard();
      const pathCells = BoardManager.getPathCells();
      
      if (!board) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Cannot analyze board data!");
        return false;
      }
      
      // Analyze completion status of rows, columns, and grids
      const unitStatus = {
        rows: Array(9).fill().map((_, i) => analyzeUnit('row', i)),
        columns: Array(9).fill().map((_, i) => analyzeUnit('column', i)),
        grids: []
      };
      
      // Analyze 3x3 grids
      for (let gridRow = 0; gridRow < 3; gridRow++) {
        for (let gridCol = 0; gridCol < 3; gridCol++) {
          unitStatus.grids.push({
            type: 'grid',
            index: `${gridRow}-${gridCol}`,
            ...analyzeGrid(gridRow, gridCol)
          });
        }
      }
      
      // Find most promising units (closest to completion but not complete)
      const allUnits = [
        ...unitStatus.rows.map(row => ({ ...row, type: 'row' })),
        ...unitStatus.columns.map(col => ({ ...col, type: 'column' })),
        ...unitStatus.grids
      ].filter(unit => unit.emptyCells > 0); // Only look at incomplete units
      
      // Sort by number of empty cells (ascending)
      allUnits.sort((a, b) => a.emptyCells - b.emptyCells);
      
      // Take up to 3 units that are closest to completion
      const topUnits = allUnits.slice(0, 3);
      
      if (topUnits.length === 0) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "No incomplete sections found!");
        return false;
      }
      
      // Create legend
      const legendElement = document.createElement('div');
      legendElement.className = 'heat-vision-legend';
      legendElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 8px; font-weight: bold;">Heat Vision</div>
        ${topUnits.map((unit, i) => `
          <div class="legend-item">
            <div class="legend-color legend-color-${i+1}"></div>
            <div>${unit.type.charAt(0).toUpperCase() + unit.type.slice(1)} ${unit.index}: ${unit.emptyCells} empty</div>
          </div>
        `).join('')}
        <div style="font-size: 10px; margin-top: 8px;">Heat vision active for 15 seconds</div>
      `;
      document.body.appendChild(legendElement);
      
      // Highlight units
      topUnits.forEach((unit, i) => {
        highlightUnit(unit.type, unit.index, i + 1, unit.emptyCells);
      });
      
      showEffectIndicator("Heat Vision", `Highlighted ${topUnits.length} near-complete sections!`);
      
      // Remove highlights after 15 seconds
      setTimeout(() => {
        // Remove all highlight classes
        document.querySelectorAll('[class*=heat-vision-highlight]').forEach(el => {
          el.classList.remove('heat-vision-highlight-1', 'heat-vision-highlight-2', 'heat-vision-highlight-3');
          const cellsRemaining = el.querySelector('.cells-remaining');
          if (cellsRemaining) {
            cellsRemaining.remove();
          }
        });
        
        // Remove legend
        if (legendElement.parentNode) {
          legendElement.parentNode.removeChild(legendElement);
        }
        
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Heat vision ended");
      }, 15000);
      
      return true;
      
      // Helper function to analyze a row or column
      function analyzeUnit(type, index) {
        let emptyCells = 0;
        let filledCells = 0;
        let emptyCellPositions = [];
        
        if (type === 'row') {
          // Analyze a row
          for (let col = 0; col < 9; col++) {
            if (pathCells && pathCells.has(`${index},${col}`)) {
              // Skip path cells
              continue;
            }
            
            if (board[index][col] === 0) {
              emptyCells++;
              emptyCellPositions.push([index, col]);
            } else {
              filledCells++;
            }
          }
        } else {
          // Analyze a column
          for (let row = 0; row < 9; row++) {
            if (pathCells && pathCells.has(`${row},${index}`)) {
              // Skip path cells
              continue;
            }
            
            if (board[row][index] === 0) {
              emptyCells++;
              emptyCellPositions.push([row, index]);
            } else {
              filledCells++;
            }
          }
        }
        
        return {
          index,
          emptyCells,
          filledCells,
          emptyCellPositions
        };
      }
      
      // Helper function to analyze a 3x3 grid
      function analyzeGrid(gridRow, gridCol) {
        let emptyCells = 0;
        let filledCells = 0;
        let emptyCellPositions = [];
        
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = gridRow * 3 + r;
            const col = gridCol * 3 + c;
            
            if (pathCells && pathCells.has(`${row},${col}`)) {
              // Skip path cells
              continue;
            }
            
            if (board[row][col] === 0) {
              emptyCells++;
              emptyCellPositions.push([row, col]);
            } else {
              filledCells++;
            }
          }
        }
        
        return {
          emptyCells,
          filledCells,
          emptyCellPositions
        };
      }
      
      // Helper function to highlight a unit
      function highlightUnit(type, index, highlightLevel, emptyCells) {
        if (type === 'row') {
          // Highlight cells in a row
          for (let col = 0; col < 9; col++) {
            if (pathCells && pathCells.has(`${index},${col}`)) {
              // Skip path cells
              continue;
            }
            
            const cell = document.querySelector(`.sudoku-cell[data-row="${index}"][data-col="${col}"]`);
            if (cell) {
              cell.classList.add(`heat-vision-highlight-${highlightLevel}`);
              
              // Only add counter to one cell in the unit
              if (col === 0) {
                const counter = document.createElement('div');
                counter.className = 'cells-remaining';
                counter.textContent = emptyCells;
                cell.appendChild(counter);
              }
            }
          }
        } else if (type === 'column') {
          // Highlight cells in a column
          for (let row = 0; row < 9; row++) {
            if (pathCells && pathCells.has(`${row},${index}`)) {
              // Skip path cells
              continue;
            }
            
            const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${index}"]`);
            if (cell) {
              cell.classList.add(`heat-vision-highlight-${highlightLevel}`);
              
              // Only add counter to one cell in the unit
              if (row === 0) {
                const counter = document.createElement('div');
                counter.className = 'cells-remaining';
                counter.textContent = emptyCells;
                cell.appendChild(counter);
              }
            }
          }
        } else if (type === 'grid') {
          // Parse grid index
          const [gridRow, gridCol] = index.split('-').map(Number);
          
          // Highlight cells in a 3x3 grid
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = gridRow * 3 + r;
              const col = gridCol * 3 + c;
              
              if (pathCells && pathCells.has(`${row},${col}`)) {
                // Skip path cells
                continue;
              }
              
              const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
              if (cell) {
                cell.classList.add(`heat-vision-highlight-${highlightLevel}`);
                
                // Only add counter to top-left cell in the grid
                if (r === 0 && c === 0) {
                  const counter = document.createElement('div');
                  counter.className = 'cells-remaining';
                  counter.textContent = emptyCells;
                  cell.appendChild(counter);
                }
              }
            }
          }
        }
      }
    }
  }
},
// Enhanced Beastmaster character ability with multiple animal types
beastmaster: {
  name: "Beastmaster",
  description: "Summons a random beast that attacks enemies on the path.",
  icon: "🐺",
  color: "#8d6e63",
  baseMaxMana: 12,
  startingMana: 8,
  uniqueAbility: {
    id: "summon_beast",
    name: "Summon Beast",
    description: "Summons a random beast (snail, goat, crocodile, or cat) to fight enemies",
    manaCost: 6,
    icon: "🐾",
    cooldown: 0,
    execute: function() {
      // Define animal types with their properties
      const animalTypes = [
        { emoji: "🐌", name: "Snail", damage: 1, speed: 1500, weight: 50 },
        { emoji: "🐐", name: "Goat", damage: 5, speed: 1000, weight: 30 },
        { emoji: "🐊", name: "Crocodile", damage: 10, speed: 800, weight: 15 },
        { emoji: "🐈", name: "Cat", damage: 20, speed: 600, weight: 5 }
      ];
      
      // Weighted random selection function
      function selectRandomAnimal(animals) {
        const totalWeight = animals.reduce((sum, animal) => sum + animal.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const animal of animals) {
          random -= animal.weight;
          if (random <= 0) {
            return animal;
          }
        }
        
        // Fallback (should never happen)
        return animals[0];
      }
      
      // Get the path that enemies follow
      const path = BoardManager.getPathArray();
      
      if (!path || !path.length) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "No path found for beast to follow!");
        return false;
      }
      
      // Choose starting position (last cell of the path)
      const startCell = path[path.length - 1];
      if (!startCell || startCell.length < 2) {
        EventSystem.publish(GameEvents.STATUS_MESSAGE, "Invalid path for beast to follow!");
        return false;
      }
      
      // Select a random animal based on weighted probabilities
      const selectedAnimal = selectRandomAnimal(animalTypes);
      
      // Create the beast
      const beast = {
        id: `beast-${Date.now()}`,
        row: startCell[0],
        col: startCell[1],
        health: 100,
        maxHealth: 100,
        damage: selectedAnimal.damage,
        pathIndex: path.length - 1,
        movingBackwards: true,
        animal: selectedAnimal
      };
      
      // Show effect indicator
      showEffectIndicator("Beast Summoned", 
        `A ${selectedAnimal.name} appears! (${selectedAnimal.damage} damage)`);
      
      // Create beast visual element
      const boardElement = document.getElementById('sudoku-board');
      const cellSize = boardElement.clientWidth / 9;
      
      const beastElement = document.createElement('div');
      beastElement.id = beast.id;
      beastElement.className = 'beast-entity';
      beastElement.innerHTML = selectedAnimal.emoji;
      beastElement.style.position = 'absolute';
      beastElement.style.width = `${cellSize}px`;
      beastElement.style.height = `${cellSize}px`;
      beastElement.style.fontSize = `${cellSize * 0.6}px`;
      beastElement.style.display = 'flex';
      beastElement.style.justifyContent = 'center';
      beastElement.style.alignItems = 'center';
      beastElement.style.transition = `top ${selectedAnimal.speed/1000}s, left ${selectedAnimal.speed/1000}s`;
      beastElement.style.zIndex = '15';
      beastElement.style.filter = 'drop-shadow(0 0 5px gold)';
      
      // Add damage indicator
      const damageIndicator = document.createElement('div');
      damageIndicator.className = 'beast-damage-indicator';
      damageIndicator.textContent = selectedAnimal.damage;
      damageIndicator.style.position = 'absolute';
      damageIndicator.style.top = '2px';
      damageIndicator.style.right = '2px';
      damageIndicator.style.fontSize = '10px';
      damageIndicator.style.background = 'rgba(0,0,0,0.6)';
      damageIndicator.style.color = 'white';
      damageIndicator.style.padding = '1px 3px';
      damageIndicator.style.borderRadius = '3px';
      beastElement.appendChild(damageIndicator);
      
      // Position the beast
      const left = beast.col * cellSize;
      const top = beast.row * cellSize;
      beastElement.style.left = `${left}px`;
      beastElement.style.top = `${top}px`;
      
      // Add to board
      boardElement.appendChild(beastElement);
      
      // Create attack animation
      const attackAnimation = document.createElement('style');
      attackAnimation.textContent = `
        @keyframes beast-attack {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); filter: brightness(1.5) hue-rotate(15deg); }
          100% { transform: scale(1); }
        }
        
        .beast-attacking {
          animation: beast-attack 0.5s ease-in-out;
        }
        
        @keyframes damage-pulse {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.5) sepia(0.5); }
          100% { filter: brightness(1); }
        }
      `;
      document.head.appendChild(attackAnimation);
      
      // Movement and attack logic
      let moveInterval;
      
      function moveBeast() {
        // Check if beast element still exists
        if (!document.getElementById(beast.id)) {
          clearInterval(moveInterval);
          return;
        }
        
        // Move backward through the path (from end to start)
        if (beast.movingBackwards) {
          beast.pathIndex--;
          
          // If reached start of path, start moving south off the grid
          if (beast.pathIndex < 0) {
            beast.pathIndex = 0;
            beast.movingBackwards = false;
            beast.movingSouth = true;
            beast.row = path[0][0]; // Start at the row of the first path cell
            beast.col = path[0][1]; // Start at the column of the first path cell
            
            EventSystem.publish(GameEvents.STATUS_MESSAGE, 
              `The ${selectedAnimal.name} is leaving the board!`);
          } else {
            // Get new position from path
            const newPosition = path[beast.pathIndex];
            beast.row = newPosition[0];
            beast.col = newPosition[1];
          }
        } else if (beast.movingSouth) {
          // Moving south (increasing row number)
          beast.row++;
          
          // If reached beyond the board boundary (row > 8), remove the beast
          if (beast.row > 8) {
            clearInterval(moveInterval);
            
            // Fade out animation
            beastElement.style.transition = 'all 1s';
            beastElement.style.opacity = '0';
            beastElement.style.transform = 'scale(0.5)';
            
            setTimeout(() => {
              if (beastElement.parentNode) {
                beastElement.parentNode.removeChild(beastElement);
              }
            }, 1000);
            
            return;
          }
        }
        
        // Update visual position
        const left = beast.col * cellSize;
        const top = beast.row * cellSize;
        beastElement.style.left = `${left}px`;
        beastElement.style.top = `${top}px`;
        
        // Check for enemies at this position and attack
        attackNearbyEnemies();
      }
      
      function attackNearbyEnemies() {
        // Get all active enemies
        const enemies = EnemiesModule.getEnemies();
        let attacked = false;
        
        // Check each enemy position
        enemies.forEach(enemy => {
          // Calculate distance (using Manhattan distance for grid-based game)
          const rowDist = Math.abs(enemy.row - beast.row);
          const colDist = Math.abs(enemy.col - beast.col);
          const distance = rowDist + colDist;
          
          // Attack if in range (adjacent cell or same cell)
          if (distance <= 1) {
            // Visual attack effect
            beastElement.classList.add('beast-attacking');
            setTimeout(() => {
              beastElement.classList.remove('beast-attacking');
            }, 500);
            
            // Deal damage to enemy
            EnemiesModule.damageEnemy(enemy.id, beast.damage);
            attacked = true;
            
            // Visual damage number
            showDamageNumber(enemy, beast.damage);
          }
        });
        
        return attacked;
      }
      
      function showDamageNumber(enemy, damage) {
        const enemyElement = document.getElementById(enemy.id);
        if (!enemyElement) return;
        
        const damageText = document.createElement('div');
        damageText.className = 'floating-text';
        damageText.textContent = damage;
        
        // Color based on damage amount
        if (damage >= 20) {
          damageText.style.color = '#f44336'; // Red for high damage
          damageText.style.fontSize = '20px';
        } else if (damage >= 10) {
          damageText.style.color = '#ff9800'; // Orange for medium damage
          damageText.style.fontSize = '18px';
        } else if (damage >= 5) {
          damageText.style.color = '#ffeb3b'; // Yellow for low damage
          damageText.style.fontSize = '16px'; 
        } else {
          damageText.style.color = '#ffffff'; // White for very low damage
          damageText.style.fontSize = '14px';
        }
        
        damageText.style.position = 'absolute';
        damageText.style.zIndex = '30';
        damageText.style.fontWeight = 'bold';
        damageText.style.textShadow = '0 0 3px black';
        damageText.style.pointerEvents = 'none';
        
        // Position near the enemy
        const rect = enemyElement.getBoundingClientRect();
        const boardRect = boardElement.getBoundingClientRect();
        
        damageText.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
        damageText.style.top = `${rect.top - boardRect.top}px`;
        
        // Add float-up animation
        damageText.style.animation = 'float-up 1s forwards';
        
        boardElement.appendChild(damageText);
        
        // Remove after animation
        setTimeout(() => {
          if (damageText.parentNode) {
            damageText.parentNode.removeChild(damageText);
          }
        }, 1000);
        
        // Also make enemy flash
        enemyElement.style.animation = 'damage-pulse 0.5s';
        setTimeout(() => {
          enemyElement.style.animation = '';
        }, 500);
      }
      
      // Start moving (give a short delay for initial appearance)
      setTimeout(() => {
        moveInterval = setInterval(moveBeast, selectedAnimal.speed); // Move at animal-specific speed
      }, 500);
      
      // Create a separate interval for checking/attacking enemies more frequently
      const attackInterval = setInterval(() => {
        if (!document.getElementById(beast.id)) {
          clearInterval(attackInterval);
          return;
        }
        
        attackNearbyEnemies();
      }, Math.min(selectedAnimal.speed / 2, 400)); // Attack checks at half the movement speed or 400ms, whichever is faster
      
      return true;
    }
  }
},
pyromancer: {
  name: "Pyromancer",
  description: "Unleashes a wave of fire that burns enemies over time.",
  icon: "🔥",
  color: "#ef5350",
  baseMaxMana: 10,
  startingMana: 4,
  uniqueAbility: {
    id: "fire_wave",
    name: "Fire Wave",
    description: "Deals burn damage (5/sec for 5s) to all enemies.",
    manaCost: 6,
    icon: "♨️",
    cooldown: 0,
    execute: function() {
      if (!EnemiesModule || !EnemiesModule.getEnemies) return false;
      const enemies = EnemiesModule.getEnemies();
      let affected = 0;
      
      enemies.forEach(enemy => {
        affected++;
        const burnInterval = setInterval(() => {
          EnemiesModule.damageEnemy(enemy.id, 5);
        }, 1000);
        setTimeout(() => clearInterval(burnInterval), 5000);
      });
      
      showEffectIndicator("Fire Wave", `Burned ${affected} enemies over time!`);
      return affected > 0;
    }
  }
},

  
  
  
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