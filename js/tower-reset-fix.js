/**
 * tower-reset-fix.js - Ensures towers are properly cleared when a new Sudoku puzzle is generated
 * Add this file to your HTML after all other scripts
 */

(function() {
    console.log("Applying tower reset fix...");

    // Only proceed if required modules exist
    if (!window.SudokuModule || !window.TowersModule || !window.Game) {
        console.error("Required modules not found! Cannot apply tower reset fix.");
        return;
    }

    // Override the generatePuzzle function to clear towers when a new puzzle is generated
    const originalGeneratePuzzle = SudokuModule.generatePuzzle;
    SudokuModule.generatePuzzle = function() {
        console.log("TOWER RESET: Clearing all towers before generating new puzzle");
        
        // Clear all towers first
        if (TowersModule && typeof TowersModule.getTowers === 'function') {
            const towers = TowersModule.getTowers();
            
            // Create a copy of the array because we'll be modifying it while iterating
            const towersToRemove = [...towers];
            
            console.log(`TOWER RESET: Removing ${towersToRemove.length} towers`);
            
            // Remove each tower
            towersToRemove.forEach(tower => {
                if (tower && tower.id && typeof TowersModule.removeTower === 'function') {
                    TowersModule.removeTower(tower.id);
                }
            });
        }
        
        // Initialize the towers module
        if (TowersModule && typeof TowersModule.init === 'function') {
            TowersModule.init();
        }
        
        // Call the original function
        originalGeneratePuzzle.apply(this, arguments);
        
        // Force a board update to ensure the visual state matches the data state
        if (Game && typeof Game.updateBoard === 'function') {
            setTimeout(() => {
                console.log("TOWER RESET: Forcing board update after puzzle generation");
                Game.updateBoard();
            }, 50);
        }
    };

    // Also hook into the SUDOKU_COMPLETE event to ensure board is reset properly
    EventSystem.subscribe(GameEvents.SUDOKU_COMPLETE, function() {
        console.log("TOWER RESET: SUDOKU_COMPLETE event detected");
        
        // Add a small delay to ensure reset happens after the completion is processed
        setTimeout(() => {
            console.log("TOWER RESET: Forcing board update after completion");
            if (Game && typeof Game.updateBoard === 'function') {
                Game.updateBoard();
            }
        }, 500);
    });

    console.log("Tower reset fix applied successfully!");
})();