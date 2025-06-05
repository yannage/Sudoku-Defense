const path = require('path');

beforeEach(() => {
  global.window = {};
  // Clear cached module to reset EventSystem state
  jest.resetModules();
  require(path.join('..', 'app', 'js', 'events.js'));
});

describe('EventSystem', () => {
  test('subscribe and publish works', () => {
    const callback = jest.fn();
    window.EventSystem.subscribe('test:event', callback);
    window.EventSystem.publish('test:event', 42);
    expect(callback).toHaveBeenCalledWith(42);
  });

  test('clear removes subscribers', () => {
    const callback = jest.fn();
    window.EventSystem.subscribe('clear:event', callback);
    window.EventSystem.clear('clear:event');
    window.EventSystem.publish('clear:event');
    expect(callback).not.toHaveBeenCalled();
  });

  test('clearAll removes all events', () => {
    const callback = jest.fn();
    window.EventSystem.subscribe('a', callback);
    window.EventSystem.subscribe('b', callback);
    window.EventSystem.clearAll();
    window.EventSystem.publish('a');
    window.EventSystem.publish('b');
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('GameEvents', () => {
  test('contains known events', () => {
    expect(window.GameEvents.GAME_START).toBe('game:start');
    expect(typeof window.GameEvents.TOWER_PLACED).toBe('string');
  });
});
