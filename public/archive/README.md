# Архив

## game.js

Монолитная версия игры (~1467 строк). Раньше подключалась напрямую из `index.html`.

С июля 2026 заменена модульной точкой входа `main.js`, которая использует:

- `ball.js`, `physics.js`, `physics_engine.js`
- `ball.js`, `physics.js`, `physics_engine.js`
- `drawing_table.js`, `drawing_cue.js`
- `game_logic.js`, `utils.js`, `constants.js`

Файл сохранён для справки и сравнения; в работе приложения не участвует.
