const path = require('path');

beforeEach(() => {
  global.window = {};
  jest.resetModules();
  // initialize event system
  require(path.join('..', 'app', 'js', 'events.js'));
  global.EventSystem = window.EventSystem;
  global.GameEvents = window.GameEvents;

  // stub BoardManager with generateEnemyPath
  window.BoardManager = {
    generateEnemyPath: jest.fn(() => [[0,0], [0,1]])
  };
  global.BoardManager = window.BoardManager;

  // stub game object
  window.Game = { updateBoard: jest.fn() };
  global.Game = window.Game;

  // require characters
  require(path.join('..', 'app', 'js', 'characters.js'));
});

test('redirect_path updates path and publishes events', () => {
  const { EventSystem, GameEvents } = window;
  const pathUpdates = [];
  const messages = [];
  EventSystem.subscribe(GameEvents.PATH_CHANGED, p => pathUpdates.push(p));
  EventSystem.subscribe(GameEvents.STATUS_MESSAGE, m => messages.push(m));

  const result = window.characters.strategist.uniqueAbility.execute();

  expect(result).toBe(true);
  expect(window.BoardManager.generateEnemyPath).toHaveBeenCalled();
  expect(window.Game.updateBoard).toHaveBeenCalled();
  expect(pathUpdates.length).toBe(1);
  expect(pathUpdates[0]).toEqual([[0,0], [0,1]]);
  expect(messages).toContain('Enemy path redirected!');
});
