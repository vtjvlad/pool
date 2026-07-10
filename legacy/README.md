# legacy/

Архив устаревшего кода. **Не подключается** к dev/build через Vite.

## Содержимое

| Файл | Описание |
|---|---|
| `index.js` | Старый static HTTP-сервер (`node index.js`). Заменён `npm run dev` (Vite). |
| `const-legacy.js` | Справочник вытесненных констант (старый формат). |
| `visual-legacy.js` | Справочник вытесненной **отрисовки** Canvas 2D с комментариями (было / вызывалось / заменено). |
| `drawing_table.js` | Canvas 2D стол → `public/render/drawing_table.js` |
| `drawing_cue.js` | Canvas 2D кий/прицел → `public/render/drawing_cue.js` |
| `wood_texture.js`, `metal_texture.js`, `pocket_texture.js` | Текстуры Canvas 2D → `public/render/` |
| `cushions_draw.js`, `cushion_rubber_draw.js` | Отрисовка бортов/резины → `public/render/` |

## Правила

- Целые устаревшие файлы → `legacy/`
- Отдельные функции/константы → `visual-legacy.js` с комментарием: **назначение / было в / вызывалось / заменено**
- Новый код не должен импортировать файлы из этой папки
