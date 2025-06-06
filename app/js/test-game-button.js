(function() {
  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'test-game-button';
    btn.textContent = 'Test Game';
    Object.assign(btn.style, {
      padding: '8px 16px',
      fontSize: '16px',
      background: '#ff5722',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });

    btn.addEventListener('click', function() {
      btn.style.display = 'none';

      try {
        localStorage.setItem('sudoku_game_settings', JSON.stringify({
          style: 'defense',
          difficulty: 'easy'
        }));
        localStorage.setItem('sudoku_td_character', 'alchemist');
      } catch (e) {
        console.error('Unable to save test game settings', e);
      }

      if (window.AbilitySystem && typeof AbilitySystem.selectCharacter === 'function') {
        AbilitySystem.selectCharacter('alchemist');
      }

      if (window.LevelsModule && typeof LevelsModule.setDifficulty === 'function') {
        LevelsModule.setDifficulty('easy');
      }

      if (window.BoardManager && typeof BoardManager.init === 'function') {
        BoardManager.init({ difficulty: 'easy', style: 'defense' });
      }

      if (window.PhaseManager && typeof PhaseManager.transitionTo === 'function') {
        PhaseManager.transitionTo(PhaseManager.PHASES.SUDOKU);
      }

      if (window.Game && typeof Game.updateUI === 'function') {
        Game.updateUI();
      }
    });

    const controls = document.getElementById('game-controls');
    if (controls) {
      controls.appendChild(btn);
    } else {
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
