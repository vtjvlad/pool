import CanvasKitInit from 'canvaskit-wasm';
import wasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url';

const FONT_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@v2.004/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
const FETCH_TIMEOUT_MS = 20000;

export async function loadCanvasKit() {
    return CanvasKitInit({ locateFile: () => wasmUrl });
}

export function createCanvasSurface(CK, offscreenCanvas) {
    let surf = CK.MakeCanvasSurface(offscreenCanvas);
    if (surf) return surf;

    if (typeof CK.MakeSWCanvasSurface === 'function') {
        surf = CK.MakeSWCanvasSurface(offscreenCanvas);
        if (surf) return surf;
    }

    return null;
}

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export async function loadTypeface(CK, onProgress) {
    try {
        onProgress?.('Шрифт (локальный)…');
        const local = await fetchWithTimeout(new URL('../fonts/NotoSans-Regular.ttf', import.meta.url), 8000);
        if (local.ok) {
            const bytes = await local.arrayBuffer();
            const face = CK.Typeface.MakeFreeTypeFaceFromData(bytes);
            if (face) return face;
        }
    } catch {
        // CDN fallback
    }

    try {
        onProgress?.('Шрифт (CDN)…');
        const res = await fetchWithTimeout(FONT_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = await res.arrayBuffer();
        const face = CK.Typeface.MakeFreeTypeFaceFromData(bytes);
        if (face) return face;
    } catch {
        // optional
    }

    return null;
}

export function flushSurface(surface) {
    surface?.flush();
}

export function destroyCanvasKitResources({ surface, ctx, invalidateCaches }) {
    invalidateCaches?.();
    ctx?.destroy();
    surface?.delete();
}
