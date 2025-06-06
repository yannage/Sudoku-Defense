const PixiDemo = (function() {
    let app;

    function init() {
        if (!window.PIXI) {
            console.warn('PIXI not loaded');
            return;
        }

        const container = document.getElementById('pixi-container');
        if (!container) return;

        app = new PIXI.Application({
            width: 200,
            height: 200,
            transparent: true
        });
        container.appendChild(app.view);

        const square = new PIXI.Graphics();
        square.beginFill(0x66ccff);
        square.drawRect(-25, -25, 50, 50);
        square.endFill();
        square.x = 100;
        square.y = 100;
        app.stage.addChild(square);

        app.ticker.add(() => {
            square.rotation += 0.05;
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', PixiDemo.init);
