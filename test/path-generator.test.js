const path = require('path');

beforeEach(() => {
  global.window = {};
  jest.resetModules();
  require(path.join('..','app','js','path-generator.js'));
});

describe('PathGenerator.generateEnemyPath', () => {
  test('creates a path from column 0 to 8 with unique cells', () => {
    const pathArr = window.PathGenerator.generateEnemyPath(13);
    expect(pathArr[0][1]).toBe(0); // start at column 0
    const last = pathArr[pathArr.length-1];
    expect(last[1]).toBe(8); // end column

    // ensure uniqueness
    const set = new Set(pathArr.map(p=>p.join(',')));
    expect(set.size).toBe(pathArr.length);
  });

  test('path moves without diagonal jumps', () => {
    const pathArr = window.PathGenerator.generateEnemyPath(13);
    for (let i = 1; i < pathArr.length; i++) {
      const dr = Math.abs(pathArr[i][0] - pathArr[i - 1][0]);
      const dc = Math.abs(pathArr[i][1] - pathArr[i - 1][1]);
      expect(dr + dc).toBe(1);
    }
  });
});
