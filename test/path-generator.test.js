import path from 'path';
import { jest } from "@jest/globals";
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

beforeEach(async () => {
  global.window = {};
  jest.resetModules();
  await import(pathToFileURL(path.join(__dirname,'..','app','js','path-generator.js')));
});

describe('PathGenerator.generateEnemyPath', () => {
  test('creates a path from column 0 to 8 with unique cells', () => {
    const pathArr = window.PathGenerator.generateEnemyPath(13);
    expect(pathArr[0][1]).toBe(0);
    const last = pathArr[pathArr.length-1];
    expect(last[1]).toBe(8);
    const set = new Set(pathArr.map(p=>p.join(',')));
    expect(set.size).toBe(pathArr.length);
  });
});
