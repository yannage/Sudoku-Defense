// main-ui-reframe.js
// Handles new UI interactions for the redesigned layout
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const panel = document.getElementById('mission-control');
    const toggle = document.getElementById('mission-toggle');
    const menu = document.getElementById('game-menu');
    const menuToggle = document.getElementById('menu-toggle');
    if (panel && toggle) {
      toggle.addEventListener('click', function() {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
          toggle.textContent = 'Hide Tips';
        } else {
          toggle.textContent = 'Show Tips';
        }
      });
    }

    if (menu && menuToggle) {
      menuToggle.addEventListener('click', function() {
        menu.classList.toggle('open');
        menuToggle.textContent = menu.classList.contains('open') ? 'Close Menu' : 'Menu';
      });
    }
  });
})();
