/** Парсинг CSS-цвета в RGBA 0..1 для CanvasKit. */
export function parseColorInput(input) {
    if (!input) return [0, 0, 0, 1];
    if (typeof input === 'object' && input.__skiaShader) {
        return null;
    }
    if (typeof input !== 'string') return [0, 0, 0, 1];

    const s = input.trim();
    if (s.startsWith('#')) {
        const hex = s.slice(1);
        const n = parseInt(hex.length === 3
            ? hex.split('').map(c => c + c).join('')
            : hex, 16);
        return [
            ((n >> 16) & 255) / 255,
            ((n >> 8) & 255) / 255,
            (n & 255) / 255,
            1
        ];
    }

    const rgba = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (rgba) {
        return [
            Number(rgba[1]) / 255,
            Number(rgba[2]) / 255,
            Number(rgba[3]) / 255,
            rgba[4] !== undefined ? Number(rgba[4]) : 1
        ];
    }

    return [0, 0, 0, 1];
}

export function blendModeFromComposite(op, CK) {
    switch (op) {
        case 'destination-out': return CK.BlendMode.DstOut;
        case 'screen': return CK.BlendMode.Screen;
        case 'multiply': return CK.BlendMode.Multiply;
        case 'source-over':
        default: return CK.BlendMode.SrcOver;
    }
}

export function withPaint(CK, setup, drawFn) {
    const paint = new CK.Paint();
    paint.setAntiAlias(true);
    setup(paint);
    drawFn(paint);
    paint.delete();
}

export function withPath(CK, drawFn) {
    const builder = new CK.PathBuilder();
    drawFn(builder);
    builder.delete();
}

export function fontSizeFromCss(fontStr) {
    const m = String(fontStr || '').match(/(\d+(?:\.\d+)?)px/);
    return m ? Number(m[1]) : 10;
}
