const path = require('path');

afterEach(() => {
  jest.resetModules();
});

function setupDom() {
  global.window = {};
  global.document = {
    getElementById: jest.fn(() => ({ clientWidth: 450, appendChild: jest.fn() })),
    createElement: jest.fn(() => ({ style: {}, getContext: jest.fn(() => ({ clearRect: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(), arc: jest.fn(), fill: jest.fn() })) })),
    addEventListener: jest.fn()
  };
  window.document = global.document;
  window.EventSystem = { subscribe: jest.fn() };
  window.GameEvents = { TOWER_ATTACK: 'attack' };
  global.requestAnimationFrame = jest.fn(cb => {
    if (cb) setTimeout(() => cb(0), 0);
    return 1;
  });
  global.cancelAnimationFrame = jest.fn();
}

describe('CanvasRenderer', () => {
  test('exposes init and start functions', () => {
    setupDom();
    require(path.join('..','app','js','render-canvas.js'));
    expect(window.CanvasRenderer).toBeDefined();
    expect(typeof window.CanvasRenderer.init).toBe('function');
    expect(typeof window.CanvasRenderer.start).toBe('function');
  });
});
