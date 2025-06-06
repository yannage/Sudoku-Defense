// main-ui-reframe.js
// Handles new UI interactions for the redesigned layout
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const panel = document.getElementById('mission-control');
    const column = panel ? panel.closest('aside.right-column') : null;
    const toggle = document.getElementById('mission-toggle');
    if (panel && column && toggle) {
      const updateLabel = (open) => {
        toggle.textContent = open ? 'Hide Tips' : 'Show Tips';
      };

      toggle.addEventListener('click', function() {
        const wide = window.matchMedia('(min-width: 768px)').matches;
        const target = wide ? column : panel;
        const open = target.classList.toggle('open');
        updateLabel(open);
      });
    }
  });
})();
