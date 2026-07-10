/**
 * LEGACY — Canvas 2D код отрисовки, заменён CanvasKit в public/render/.
 * Файлы целиком: legacy/drawing_table.js, legacy/drawing_cue.js, legacy/wood_texture.js,
 * legacy/metal_texture.js, legacy/pocket_texture.js, legacy/cushions_draw.js,
 * legacy/cushion_rubber_draw.js
 * Шары (draw): legacy/ball_draw_legacy.js
 */

/**
 * drawSolidSphere / drawStripeSphere / Ball.prototype.draw
 * ─────────────────────────────────────────────────────────
 * Назначение: CPU-растеризация 3D-сфер шаров через createImageData (Canvas 2D).
 * Было в:     public/ball.js
 * Вызывалось: public/main.js → draw() → ball.draw(ctx)
 * Заменено:   public/render/ball_renderer.js → drawBall() (CanvasKit SkImage + worker)
 */
export {
    stripeCanvasCache,
    drawTableBallShadow,
    drawStripeSphere,
    drawSolidSphere,
    drawNumberPatch,
    drawCueMarks,
    draw as drawBallLegacy
} from './ball_draw_legacy.js';

/**
 * drawTable / drawCushionSegments / drawRubberGums
 * ─────────────────────────────────────────────────
 * Назначение: отрисовка стола, бортов, резины, луз (Canvas 2D).
 * Было в:     public/drawing_table.js, cushions.js, cushion_rubber.js
 * Вызывалось: public/main.js → draw() → drawTable(ctx)
 * Заменено:   public/render/drawing_table.js + cushions_draw.js (CanvasKit, worker)
 */
export const LEGACY_TABLE_DRAW_NOTE = 'Moved to public/render/drawing_table.js';

/**
 * drawCueStick / drawTrajectory / drawSpinMark
 * ────────────────────────────────────────────
 * Назначение: кий, линия прицела, метка винта (Canvas 2D).
 * Было в:     public/drawing_cue.js
 * Вызывалось: public/main.js → drawCueScene() → drawTrajectory / drawCueStick
 * Заменено:   public/render/drawing_cue.js (worker); getCueTipPosition → public/cue_utils.js
 */
export const LEGACY_CUE_DRAW_NOTE = 'Moved to public/render/drawing_cue.js';

/**
 * getContext('2d') на main thread
 * ───────────────────────────────
 * Назначение: прямой Canvas 2D контекст на #billiard-canvas.
 * Было в:     public/main.js (const ctx = canvas.getContext('2d'))
 * Заменено:   OffscreenCanvas + public/render/render_worker.js (CanvasKit)
 */
export const LEGACY_MAIN_CTX_NOTE = 'Replaced by OffscreenCanvas worker';

/**
 * drawImpactFlash (Canvas 2D)
 * ───────────────────────────
 * Назначение: вспышка при ударе кием.
 * Было в:     public/main.js → draw()
 * Заменено:   public/render/render_engine.js → drawImpactFlash (worker)
 */
export const LEGACY_IMPACT_FLASH_NOTE = 'Moved to public/render/render_engine.js';
