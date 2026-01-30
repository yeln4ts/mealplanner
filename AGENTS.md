# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the frontend (Vue 3 + Pinia + Tailwind).
  - `app/src/` holds the app code.
    - `app/src/views/` contains top-level screens: `MealsView.vue`, `GenerateView.vue`, `MenuView.vue`, `DataView.vue`.
    - `app/src/components/` contains shared UI (layout + modals).
    - `app/src/composables/` contains reusable logic (storage, fuzzy match, generator).
    - `app/src/stores/` contains Pinia stores (`mealStore.js`).
    - `app/src/assets/` contains global styles (`main.css`).
  - `app/index.html`, `app/vite.config.js`, `app/tailwind.config.js`, `app/postcss.config.js` configure the build.
  - `app/Dockerfile` builds the frontend image.
- `docker-compose.yml` runs the app and PocketBase in Docker.
- `docs/Meal_Planner_PWA_Product_v2 (1).md` is the PRD.

## Build, Test, and Development Commands
- `cd app && npm install` — install frontend dependencies.
- `cd app && npm run dev` — start Vite dev server (binds `0.0.0.0:5173`).
- `cd app && npm run build` — build production assets into `dist/`.
- `cd app && npm run preview` — serve the production build locally.
- `docker compose up --build` — build and run the dev server in Docker.

## Coding Style & Naming Conventions
- Use 2-space indentation (matches current Vue/JS files).
- Vue single-file components in `PascalCase.vue` (e.g., `MenuView.vue`).
- JavaScript modules use `camelCase` for functions/variables and `kebab-case` for file names in `composables`/`stores` where already established.
- Tailwind utility classes are preferred over custom CSS; keep reusable styles in `app/src/assets/main.css`.

## Testing Guidelines
- No test framework is configured yet. If adding tests, document the runner (e.g., Vitest) and place tests alongside source or in a `tests/` folder.
- Suggested naming: `*.test.js` for unit tests.

## Commit & Pull Request Guidelines
- This repo is not a Git repository yet, so no commit conventions are defined.
- If Git is initialized, use concise, imperative commit messages (e.g., `Add menu generation queue`).
- PRs should include a short summary, screenshots for UI changes, and any manual test notes.

## Configuration & Environment Tips
- App config lives in `app/src/config.js` (e.g., `POCKETBASE_URL`, `MAX_HISTORY_ITEMS`).
- Leave `POCKETBASE_URL` empty for local storage mode.
