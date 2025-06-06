import path from 'path';
import { jest } from "@jest/globals";
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

beforeEach(async () => {
  global.window = {};
  jest.resetModules();
  await import(pathToFileURL(path.join(__dirname,'..','app','js','puzzle-generator.js')));
});

describe('PuzzleGenerator.generateCompleteSolution', () => {
  test('produces a valid completed sudoku', () => {
    const grid = window.PuzzleGenerator.generateCompleteSolution();
    expect(grid).toHaveLength(9);
    grid.forEach(row => expect(row).toHaveLength(9));
    grid.forEach(row => {
      const sorted = [...row].sort();
      expect(sorted).toEqual([1,2,3,4,5,6,7,8,9]);
    });
    for(let c=0;c<9;c++){
      const col = grid.map(r => r[c]).sort();
      expect(col).toEqual([1,2,3,4,5,6,7,8,9]);
    }
  });
});

describe('PuzzleGenerator.createPuzzleFromSolution', () => {
  test('hides cells not to reveal and keeps path cells empty', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const solution = window.PuzzleGenerator.generateCompleteSolution();
    const pathCells = new Set(['0,0','0,1']);
    const { puzzle, fixed } = window.PuzzleGenerator.createPuzzleFromSolution(solution, pathCells, 5);
    expect(puzzle[0][0]).toBe(0);
    expect(puzzle[0][1]).toBe(0);
    expect(fixed[0][0]).toBe(false);
    expect(fixed[0][1]).toBe(false);
    const countFixed = fixed.flat().filter(Boolean).length;
    expect(countFixed).toBe(5);
    Math.random.mockRestore();
  });
});
