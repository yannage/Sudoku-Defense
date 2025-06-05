// setup-ui.js - ensures setup menu interactions work
(function() {
  function startGame() {
    if (window.PhaseManager && typeof PhaseManager.transitionTo === 'function') {
      if (typeof PhaseManager.applyGameSettings === 'function') {
        PhaseManager.applyGameSettings();
      }
      PhaseManager.transitionTo(PhaseManager.PHASES.INTRO);
    }
  }

  function init() {
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
