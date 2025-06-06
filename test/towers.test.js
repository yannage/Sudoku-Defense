import path from 'path';
import { jest } from "@jest/globals";
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function setup(){
  global.window = {};
  jest.useFakeTimers();
  jest.resetModules();

  window.EventSystem = { publish: jest.fn(), subscribe: jest.fn() };
  window.GameEvents = { STATUS_MESSAGE:'status', TOWER_PLACED:'placed', TOWER_REMOVED:'removed' };
  global.EventSystem = window.EventSystem;
  global.GameEvents = window.GameEvents;

  global.document = {
    addEventListener: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    querySelector: jest.fn(() => null),
    createElement: jest.fn(() => ({ style:{}, classList:{add:jest.fn(), remove:jest.fn()}, appendChild:jest.fn(), parentNode:null, cloneNode:jest.fn(()=>({})) })),
    body: { appendChild: jest.fn() }
  };
  window.document = global.document;

  const fixed = Array.from({length:9},()=>Array(9).fill(false));
  const pathCells = new Set();
  const board = Array.from({length:9},()=>Array(9).fill(0));
  const solution = Array.from({length:9},()=>Array(9).fill(1));

  window.BoardManager = {
    getFixedCells: () => fixed,
    getPathCells: () => pathCells,
    getSolution: () => solution,
    setCellValue: jest.fn(() => true),
    getBoard: () => board
  };
  global.BoardManager = window.BoardManager;

  window.PlayerModule = {
    getState: jest.fn(() => ({ currency: 100 })),
    spendCurrency: jest.fn(),
    addCurrency: jest.fn()
  };
  global.PlayerModule = window.PlayerModule;

  return import(pathToFileURL(path.join(__dirname,'..','app','js','towers.js'))).then(()=>({fixed, pathCells}));
}

describe('TowersModule placement and removal', () => {
  test('createTower places tower when valid', async () => {
    await setup();
    const tower = window.TowersModule.createTower('1',0,0);
    jest.runOnlyPendingTimers();
    expect(tower).toBeTruthy();
    expect(window.BoardManager.setCellValue).toHaveBeenCalledWith(0,0,1);
    expect(window.TowersModule.getTowerAt(0,0)).toBeTruthy();
  });

  test('createTower fails on fixed cell', async () => {
    const { fixed } = await setup();
    fixed[0][0] = true;
    const tower = window.TowersModule.createTower('1',0,0);
    expect(tower).toBeNull();
    expect(window.BoardManager.setCellValue).not.toHaveBeenCalled();
  });

  test('removeTower clears cell and list', async () => {
    await setup();
    const tower = window.TowersModule.createTower('1',0,0);
    jest.runOnlyPendingTimers();
    const result = window.TowersModule.removeTower(tower.id);
    expect(result).toBe(true);
    expect(window.BoardManager.setCellValue).toHaveBeenLastCalledWith(0,0,0);
    expect(window.TowersModule.getTowerAt(0,0)).toBeUndefined();
  });
});
