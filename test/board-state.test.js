import path from 'path';
import { jest } from "@jest/globals";
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createEmptyGrid(val=0){
  return Array.from({length:9},()=>Array(9).fill(val));
}

beforeEach(async () => {
  global.window = {};
  jest.resetModules();

  window.PathGenerator = {
    getPathCells: () => new Set(['1,1'])
  };
  global.PathGenerator = window.PathGenerator;

  await import(pathToFileURL(path.join(__dirname,'..','app','js','board-state.js')));
  await import(pathToFileURL(path.join(__dirname,'..','app','js','puzzle-generator.js')));
});

describe('BoardState basic operations', () => {
  test('setCellValue respects fixed and path cells', () => {
    const solution = window.PuzzleGenerator.generateCompleteSolution();
    const board = createEmptyGrid();
    const fixed = createEmptyGrid(false);
    fixed[0][0] = true;
    window.BoardState.setState(board, solution, fixed);

    const resultFixed = window.BoardState.setCellValue(0,0,5);
    expect(resultFixed).toBe(false);

    const resultPath = window.BoardState.setCellValue(1,1,5);
    expect(resultPath).toBe(false);

    const result = window.BoardState.setCellValue(2,2,7);
    expect(result).toBe(true);
    const boardAfter = window.BoardState.getBoard();
    expect(boardAfter[2][2]).toBe(7);
  });

  test('isComplete detects solved board', () => {
    const solution = window.PuzzleGenerator.generateCompleteSolution();
    window.BoardState.setState(solution, solution, createEmptyGrid(false));
    expect(window.BoardState.isComplete()).toBe(true);
    window.BoardState.setCellValue(0,0,0);
    expect(window.BoardState.isComplete()).toBe(false);
  });
});
