const CompletionBonusModule = (function() {
    // Bonus types and their multipliers
    const BONUS_TYPES = {
        DAMAGE: {
            multiplier: 1.35,  // 35% damage increase
            icon: '⚔️',
            description: 'Towers do 35% more damage'
        },
        POINTS: {
            multiplier: 2.0,   // Double points from enemies defeated
            icon: '🏆',
            description: 'Double points earned from defeated enemies'
        },
        CURRENCY: {
            multiplier: 1.75,  // 75% more currency
            icon: '💰',
            description: '75% more currency from defeated enemies'
        }
    };
    
    // Track active bonuses
    const rowBonuses = {};     // Format: "row-0": {type: "DAMAGE", expiry: null}
    const columnBonuses = {};  // Format: "col-3": {type: "POINTS", expiry: null}
    const gridBonuses = {};    // Format: "grid-1-2": {type: "CURRENCY", expiry: null}
    
    function onUnitCompleted(unitType, unitIndex) {
        // unitType is "row", "column", or "grid"
        // unitIndex is the index of the unit (for grid, would be "0-1" for example)
        
        // Pause the game (optional)
        Game.pause();
        
        // Display the choice modal
        showBonusChoiceModal(unitType, unitIndex);
    }
    
    function showBonusChoiceModal(unitType, unitIndex) {
        const modal = document.createElement('div');
        modal.className = 'bonus-choice-modal';
        modal.innerHTML = `
            <div class="bonus-choice-content">
                <h3>${capitalizeFirst(unitType)} ${getDisplayIndex(unitType, unitIndex)} Completed!</h3>
                <p>Choose a bonus effect:</p>
                <div class="bonus-options">
                    ${createBonusOptionHTML('DAMAGE', unitType, unitIndex)}
                    ${createBonusOptionHTML('POINTS', unitType, unitIndex)}
                    ${createBonusOptionHTML('CURRENCY', unitType, unitIndex)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners to the buttons
        const buttons = modal.querySelectorAll('.bonus-option-button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const bonusType = this.dataset.bonusType;
                applyBonus(unitType, unitIndex, bonusType);
                modal.remove();
                Game.resume(); // Resume game if it was paused
            });
        });
    }
    
    function createBonusOptionHTML(bonusType, unitType, unitIndex) {
        const bonus = BONUS_TYPES[bonusType];
        return `
            <div class="bonus-option">
                <button class="bonus-option-button" data-bonus-type="${bonusType}">
                    <span class="bonus-icon">${bonus.icon}</span>
                    <span class="bonus-name">${bonusType}</span>
                </button>
                <p class="bonus-description">${bonus.description}</p>
            </div>
        `;
    }
    
    function applyBonus(unitType, unitIndex, bonusType) {
        const bonusKey = `${unitType}-${unitIndex}`;
        const bonusData = {
            type: bonusType,
            expiry: null // Permanent until row is broken
        };
        
        // Store the bonus choice
        if (unitType === 'row') {
            rowBonuses[bonusKey] = bonusData;
        } else if (unitType === 'column') {
            columnBonuses[bonusKey] = bonusData;
        } else if (unitType === 'grid') {
            gridBonuses[bonusKey] = bonusData;
        }
        
        // Apply visual effect to the completed unit
        applyVisualEffect(unitType, unitIndex, bonusType);
        
        // Show confirmation message
        EventSystem.publish(GameEvents.STATUS_MESSAGE, 
            `${capitalizeFirst(unitType)} ${getDisplayIndex(unitType, unitIndex)} bonus: ${BONUS_TYPES[bonusType].description}`);
    }
    
    function applyVisualEffect(unitType, unitIndex, bonusType) {
        // Add visual indicators based on bonus type (borders, glows, etc)
        const color = getBonusColor(bonusType);
        
        // Apply to all cells in the unit
        if (unitType === 'row') {
            const row = parseInt(unitIndex);
            for (let col = 0; col < 9; col++) {
                const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    applyBonusStyles(cell, bonusType, color);
                }
            }
        } else if (unitType === 'column') {
            const col = parseInt(unitIndex);
            for (let row = 0; row < 9; row++) {
                const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    applyBonusStyles(cell, bonusType, color);
                }
            }
        } else if (unitType === 'grid') {
            const [gridRow, gridCol] = unitIndex.split('-').map(Number);
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const row = gridRow * 3 + r;
                    const col = gridCol * 3 + c;
                    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        applyBonusStyles(cell, bonusType, color);
                    }
                }
            }
        }
    }
    
    function applyBonusStyles(cell, bonusType, color) {
        // Clear previous bonus styles
        cell.classList.remove('bonus-damage', 'bonus-points', 'bonus-currency');
        
        // Add appropriate class
        cell.classList.add(`bonus-${bonusType.toLowerCase()}`);
        
        // Apply styles directly for immediate effect
        cell.style.boxShadow = `0 0 8px ${color}`;
        cell.style.border = `2px solid ${color}`;
    }
    
    function getBonusColor(bonusType) {
        switch (bonusType) {
            case 'DAMAGE': return '#ff4d4d'; // Red for damage
            case 'POINTS': return '#4d4dff'; // Blue for points
            case 'CURRENCY': return '#ffd700'; // Gold for currency
            default: return '#ffffff';
        }
    }
    
    // Helper functions for display
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    function getDisplayIndex(unitType, unitIndex) {
        if (unitType === 'grid') {
            const [row, col] = unitIndex.split('-').map(Number);
            return `${row+1},${col+1}`;
        }
        return parseInt(unitIndex) + 1;
    }
    
    // Apply bonus effects
    function applyEffects(tower, enemy, basePoints, baseCurrency) {
        let damageMult = 1.0;
        let pointsMult = 1.0;
        let currencyMult = 1.0;
        
        // Check row bonuses
        const rowKey = `row-${tower.row}`;
        if (rowBonuses[rowKey]) {
            const bonusType = rowBonuses[rowKey].type;
            if (bonusType === 'DAMAGE') damageMult *= BONUS_TYPES.DAMAGE.multiplier;
            if (bonusType === 'POINTS') pointsMult *= BONUS_TYPES.POINTS.multiplier;
            if (bonusType === 'CURRENCY') currencyMult *= BONUS_TYPES.CURRENCY.multiplier;
        }
        
        // Check column bonuses
        const colKey = `column-${tower.col}`;
        if (columnBonuses[colKey]) {
            const bonusType = columnBonuses[colKey].type;
            if (bonusType === 'DAMAGE') damageMult *= BONUS_TYPES.DAMAGE.multiplier;
            if (bonusType === 'POINTS') pointsMult *= BONUS_TYPES.POINTS.multiplier;
            if (bonusType === 'CURRENCY') currencyMult *= BONUS_TYPES.CURRENCY.multiplier;
        }
        
        // Check grid bonuses
        const gridRow = Math.floor(tower.row / 3);
        const gridCol = Math.floor(tower.col / 3);
        const gridKey = `grid-${gridRow}-${gridCol}`;
        if (gridBonuses[gridKey]) {
            const bonusType = gridBonuses[gridKey].type;
            if (bonusType === 'DAMAGE') damageMult *= BONUS_TYPES.DAMAGE.multiplier;
            if (bonusType === 'POINTS') pointsMult *= BONUS_TYPES.POINTS.multiplier;
            if (bonusType === 'CURRENCY') currencyMult *= BONUS_TYPES.CURRENCY.multiplier;
        }
        
        return {
            damage: Math.floor(tower.damage * damageMult),
            points: Math.floor(basePoints * pointsMult),
            currency: Math.floor(baseCurrency * currencyMult)
        };
    }
    
    // Check if a unit is still complete
    function checkUnitCompletion(unitType, unitIndex) {
        const bonusKey = `${unitType}-${unitIndex}`;
        
        // If the unit is no longer complete, remove its bonus
        if (!isUnitComplete(unitType, unitIndex)) {
            if (unitType === 'row' && rowBonuses[bonusKey]) {
                delete rowBonuses[bonusKey];
                removeVisualEffect(unitType, unitIndex);
                return false;
            } else if (unitType === 'column' && columnBonuses[bonusKey]) {
                delete columnBonuses[bonusKey];
                removeVisualEffect(unitType, unitIndex);
                return false;
            } else if (unitType === 'grid' && gridBonuses[bonusKey]) {
                delete gridBonuses[bonusKey];
                removeVisualEffect(unitType, unitIndex);
                return false;
            }
        }
        return true;
    }
    
    // Additional helper methods...
    
    // Public API
    return {
        onUnitCompleted,
        applyEffects,
        checkBoardCompletions: function() {
            // Check all rows, columns, and grids for completions or broken completions
            for (let i = 0; i < 9; i++) {
                checkUnitCompletion('row', i);
                checkUnitCompletion('column', i);
            }
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    checkUnitCompletion('grid', `${row}-${col}`);
                }
            }
        },
        getBonuses: function() {
            return {
                rows: { ...rowBonuses },
                columns: { ...columnBonuses },
                grids: { ...gridBonuses }
            };
        }
    };
})();