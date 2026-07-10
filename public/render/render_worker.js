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

function postProgress(text) {
    self.postMessage({ type: 'progress', text });
}

function postError(err) {
    const message = err?.message || String(err);
    self.postMessage({ type: 'error', message });
}

function invalidateAllCaches() {
    invalidateTablePicture();
    invalidateWoodPattern();
    invalidateMetalPattern();
    invalidatePocketSprites();
    clearBallImageCache();
    if (ctx) buildTablePicture(ctx);
}

async function initRenderer(offscreenCanvas, width, height) {
    postProgress('CanvasKit WASM…');
    CK = await loadCanvasKit();

    postProgress('Surface…');
    surface = createCanvasSurface(CK, offscreenCanvas);
    if (!surface) {
        throw new Error('CanvasKit: не удалось создать surface (WebGL/SW)');
    }

    const skCanvas = surface.getCanvas();
    ctx = new Skia2DContext(skCanvas, CK, width, height);

    postProgress('Шрифт…');
    typeface = await loadTypeface(CK, postProgress);

    postProgress('Стол…');
    initRenderEngine(ctx, typeface);
    buildTablePicture(ctx);
}

self.addEventListener('error', (event) => {
    postError(event.error || new Error(event.message || 'Worker script error'));
});

self.addEventListener('unhandledrejection', (event) => {
    postError(event.reason);
});

self.onmessage = async (event) => {
    const msg = event.data;
    try {
        if (msg.type === 'init') {
            await initRenderer(msg.canvas, msg.width ?? CANVAS_WIDTH, msg.height ?? CANVAS_HEIGHT);
            self.postMessage({ type: 'ready' });
            return;
        }

        if (msg.type === 'invalidate_table') {
            invalidateAllCaches();
            return;
        }

        if (msg.type === 'frame') {
            if (!ctx || !surface) return;
            const t0 = msg.profile ? performance.now() : 0;
            drawFrame(ctx, msg.state, typeface);
            flushSurface(surface);
            if (msg.profile) {
                const workerMs = performance.now() - t0;
                self.postMessage({
                    type: 'profile',
                    workerMs,
                    serializeMs: msg.profile.serializeMs
                });
            }
            return;
        }

        if (msg.type === 'destroy') {
            destroyCanvasKitResources({
                surface,
                ctx,
                invalidateCaches: invalidateAllCaches
            });
            ctx = null;
            surface = null;
            CK = null;
            typeface = null;
        }
    } catch (err) {
        postError(err);
    }
};
