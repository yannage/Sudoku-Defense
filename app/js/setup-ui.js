// setup-ui.js - ensures setup menu interactions work
(function() {
  // Local copy of game settings
  var settings = { style: 'defense', difficulty: 'easy' };

  function loadSettings() {
    try {
      var saved = localStorage.getItem('sudoku_game_settings');
      if (saved) {
        settings = Object.assign(settings, JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('sudoku_game_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }

  function updateTooltip(option, value) {
    var tooltip = document.getElementById(option + '-tooltip');
    if (!tooltip) return;

    var text = '';

    if (option === 'style') {
      if (value === 'defense') {
        text = 'Sudoku Defense: Classic Sudoku combined with tower defense gameplay. Place towers to defend against enemy waves.';
      } else if (value === 'basic') {
        text = 'Sudoku Basic: Pure Sudoku gameplay without enemies or tower defense elements. Just solve the puzzle at your own pace.';
      }
    } else if (option === 'difficulty') {
      if (value === 'easy') {
        text = 'Easy: More numbers revealed at the start, perfect for beginners.';
      } else if (value === 'medium') {
        text = 'Intermediate: Balanced challenge with fewer numbers revealed, good for regular players.';
      } else if (value === 'hard') {
        text = 'Expert: Very few numbers revealed, designed for Sudoku masters. Challenging puzzles!';
      }
    }

    tooltip.textContent = text;
  }

  function setActiveOption(option, value) {
    document.querySelectorAll('.setup-option[data-option="' + option + '"]').forEach(function(btn) {
      btn.classList.remove('active');
    });

    var selected = document.querySelector('.setup-option[data-option="' + option + '"][data-value="' + value + '"]');
    if (selected) {
      selected.classList.add('active');
    }
  }

  function optionClicked(event) {
    var option = this.getAttribute('data-option');
    var value = this.getAttribute('data-value');

    setActiveOption(option, value);
    updateTooltip(option, value);

    settings[option] = value;
    saveSettings();
  }

  function attachOptionListeners() {
    document.querySelectorAll('.setup-option').forEach(function(btn) {
      btn.addEventListener('click', optionClicked);
    });
  }

  function startGame() {
    if (window.PhaseManager && typeof PhaseManager.applyGameSettings === 'function') {
      PhaseManager.applyGameSettings();
    }
    if (window.PhaseManager && typeof PhaseManager.transitionTo === 'function') {
      PhaseManager.transitionTo(PhaseManager.PHASES.INTRO);
    }
  }

  function init() {
    loadSettings();
    setActiveOption('style', settings.style);
    setActiveOption('difficulty', settings.difficulty);
    updateTooltip('style', settings.style);
    updateTooltip('difficulty', settings.difficulty);

    attachOptionListeners();

    var btn = document.getElementById('start-game-btn');
    if (btn) {
      btn.addEventListener('click', startGame);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
