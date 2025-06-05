# Sudoku Defense

A browser-based tower defense prototype that mixes Sudoku puzzles with classic tower defense mechanics. All game assets live in the `app/` directory.

## Prerequisites

- **Node.js** v14 or later (used to run a local HTTP server)
- A modern web browser such as Chrome or Firefox

## Launching the game locally

1. Install Node.js if it's not already available.
2. From the repository root, run:

   ```bash
   npm start
   ```

   This command uses `http-server` via `npx` to serve the contents of `app/` on `http://localhost:8080`.
3. Open your browser and navigate to the above address to start playing.

No additional build step is necessary because the project consists entirely of static HTML/JS/CSS files.

## Project structure

```
app/
├── index.html        - Game entry point
├── js/               - JavaScript logic (gameplay, levels, systems)
├── css/              - Stylesheets
│   ├── core/         - Base styles
│   ├── features/     - Optional feature styling
│   ├── gameplay/     - Board, tower, and enemy styles
│   ├── platform/     - Platform-specific overrides
│   └── ui/           - In‑game menus and HUD
├── assets/           - Images, sprites, and fonts
└── art/              - Pyxel project files
```

The `package.json` file includes a `start` script that launches the HTTP server described above.

## Running tests

This project uses [Jest](https://jestjs.io/) for unit testing. After cloning the repository, install dependencies and run:

```bash
npm install
npm test
```

This will execute all test suites located in the `test/` directory.
