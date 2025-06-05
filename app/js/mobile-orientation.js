(function() {
    function addOrientationSupport() {
        checkOrientation();
        window.addEventListener('orientationchange', function() {
            setTimeout(checkOrientation, 300);
        });
        window.addEventListener('resize', function() {
            checkOrientation();
        });
    }

    function checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        document.body.classList.toggle('portrait', isPortrait);
        document.body.classList.toggle('landscape', !isPortrait);

        const leftColumn = document.querySelector('.left-column');
        const middleColumn = document.querySelector('.middle-column');
        const rightColumn = document.querySelector('.right-column');
        const towerSelection = document.querySelector('#tower-selection, .tower-selection');

        if (isPortrait) {
            if (towerSelection) {
                towerSelection.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
            if (leftColumn && middleColumn && rightColumn) {
                leftColumn.style.gridRow = '3';
                middleColumn.style.gridRow = '2';
                rightColumn.style.gridRow = '1';
                const missionControl = document.querySelector('#mission-control, .mission-control');
                if (missionControl) {
                    missionControl.style.maxHeight = '200px';
                }
            }
        } else {
            if (towerSelection) {
                towerSelection.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
            if (leftColumn && middleColumn && rightColumn) {
                leftColumn.style.gridRow = '';
                middleColumn.style.gridRow = '';
                rightColumn.style.gridRow = '';
                const missionControl = document.querySelector('#mission-control, .mission-control');
                if (missionControl) {
                    missionControl.style.maxHeight = '';
                }
            }
        }
    }

    document.addEventListener('DOMContentLoaded', addOrientationSupport);

    window.addOrientationSupport = addOrientationSupport;
    window.checkOrientation = checkOrientation;
})();


export {};
