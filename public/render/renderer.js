import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { Skia2DContext } from './skia_ctx.js';
import {
    loadCanvasKit,
    createCanvasSurface,
    loadTypeface,
    flushSurface,
    destroyCanvasKitResources
} from './canvaskit.js';
import { buildTablePicture, invalidateTablePicture } from './drawing_table.js';
import { invalidateWoodPattern } from './wood_texture.js';
import { invalidateMetalPattern } from './metal_texture.js';
import { invalidatePocketSprites } from './pocket_texture.js';
import { clearBallImageCache } from './ball_renderer.js';
import { drawFrame, initRenderEngine } from './render_engine.js';

let CK = null;
let surface = null;
let ctx = null;
let typeface = null;

export function invalidateRenderCaches() {
    invalidateTablePicture();
    invalidateWoodPattern();
    invalidateMetalPattern();
    invalidatePocketSprites();
    clearBallImageCache();
    if (ctx) buildTablePicture(ctx);
}

export async function initRenderer(canvas, width = CANVAS_WIDTH, height = CANVAS_HEIGHT, onProgress) {
    onProgress?.('CanvasKit WASM…');
    CK = await loadCanvasKit();

    onProgress?.('Surface…');
    surface = createCanvasSurface(CK, canvas);
    if (!surface) {
        throw new Error('CanvasKit: не удалось создать surface (WebGL/SW)');
    }

    const skCanvas = surface.getCanvas();
    ctx = new Skia2DContext(skCanvas, CK, width, height);

    onProgress?.('Шрифт…');
    typeface = await loadTypeface(CK, onProgress);

    onProgress?.('Стол…');
    initRenderEngine(ctx, typeface);
    buildTablePicture(ctx);
}

export function isRendererReady() {
    return !!(ctx && surface);
}

export function renderFrame(state) {
    if (!ctx || !surface) return;
    drawFrame(ctx, state, typeface);
    flushSurface(surface);
}

export function destroyRenderer() {
    destroyCanvasKitResources({
        surface,
        ctx,
        invalidateCaches: invalidateRenderCaches
    });
    ctx = null;
    surface = null;
    CK = null;
    typeface = null;
}
