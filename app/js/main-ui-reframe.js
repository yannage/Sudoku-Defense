// main-ui-reframe.js
// Handles new UI interactions for the redesigned layout
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const panel = document.getElementById('mission-control');
    const column = panel ? panel.closest('aside.right-column') : null;
    const toggle = document.getElementById('mission-toggle');
    if (panel && column && toggle) {
      const updateLabel = (open) => {
        const wide = window.matchMedia('(min-width: 768px)').matches;
        if (wide) {
          toggle.textContent = open ? 'Hide Tips' : 'Show Tips';
        } else {
          toggle.textContent = open ? '✖' : '☰';
          toggle.setAttribute('aria-label', open ? 'Hide Tips' : 'Show Tips');
        }
      };

      // set initial label
      updateLabel(column.classList.contains('open'));

      toggle.addEventListener('click', function() {
        const wide = window.matchMedia('(min-width: 768px)').matches;
        const target = wide ? column : panel;
        const open = target.classList.toggle('open');
        updateLabel(open);
      });
    }
  });
})();
