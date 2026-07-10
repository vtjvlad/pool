import {
    parseColorInput,
    blendModeFromComposite,
    fontSizeFromCss
} from './skia_helpers.js';

class SkiaGradient {
    constructor(type, CK, coords, stops = []) {
        this.type = type;
        this.CK = CK;
        this.coords = coords;
        this.stops = stops;
        this.__skiaShader = true;
    }

    addColorStop(offset, color) {
        this.stops.push({ offset, color });
    }

    buildShader() {
        const CK = this.CK;
        const colors = this.stops.map(s => CK.Color4f(...parseColorInput(s.color)));
        const positions = this.stops.map(s => s.offset);
        if (this.type === 'linear') {
            const [x0, y0, x1, y1] = this.coords;
            return CK.Shader.MakeLinearGradient(
                [x0, y0],
                [x1, y1],
                colors,
                positions,
                CK.TileMode.Clamp
            );
        }
        const [x0, y0, r0, x1, y1, r1] = this.coords;
        return CK.Shader.MakeTwoPointConicalGradient(
            [x0, y0],
            r0,
            [x1, y1],
            r1,
            colors,
            positions,
            CK.TileMode.Clamp
        );
    }
}

class SkiaPattern {
    constructor(image, repetition) {
        this.image = image;
        this.repetition = repetition;
        this.__skiaShader = true;
    }
}

function copyState(state) {
    return {
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
        compositeOp: state.compositeOp,
        lineJoin: state.lineJoin,
        lineCap: state.lineCap,
        fontStr: state.fontStr,
        textAlign: state.textAlign,
        textBaseline: state.textBaseline,
        dash: state.dash ? [...state.dash] : null
    };
}

export class Skia2DContext {
    constructor(skCanvas, CK, width, height) {
        this._canvas = skCanvas;
        this.CK = CK;
        this._width = width;
        this._height = height;
        this._typeface = null;
        this._stack = [];
        this._path = new CK.PathBuilder();
        this._resetState();
        this._surface = null;
        this.imageSmoothingEnabled = true;
        this.imageSmoothingQuality = 'high';
    }

    setTypeface(typeface) {
        this._typeface = typeface;
    }

    _resetState() {
        this._state = {
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            globalAlpha: 1,
            compositeOp: 'source-over',
            lineJoin: 'miter',
            lineCap: 'butt',
            fontStr: '10px sans-serif',
            textAlign: 'start',
            textBaseline: 'alphabetic',
            dash: null
        };
    }

    get fillStyle() { return this._state.fillStyle; }
    set fillStyle(v) { this._state.fillStyle = v; }
    get strokeStyle() { return this._state.strokeStyle; }
    set strokeStyle(v) { this._state.strokeStyle = v; }
    get lineWidth() { return this._state.lineWidth; }
    set lineWidth(v) { this._state.lineWidth = v; }
    get globalAlpha() { return this._state.globalAlpha; }
    set globalAlpha(v) { this._state.globalAlpha = v; }
    get globalCompositeOperation() { return this._state.compositeOp; }
    set globalCompositeOperation(v) { this._state.compositeOp = v; }
    get lineJoin() { return this._state.lineJoin; }
    set lineJoin(v) { this._state.lineJoin = v; }
    get lineCap() { return this._state.lineCap; }
    set lineCap(v) { this._state.lineCap = v; }
    get font() { return this._state.fontStr; }
    set font(v) { this._state.fontStr = v; }
    get textAlign() { return this._state.textAlign; }
    set textAlign(v) { this._state.textAlign = v; }
    get textBaseline() { return this._state.textBaseline; }
    set textBaseline(v) { this._state.textBaseline = v; }

    save() {
        this._stack.push({
            state: copyState(this._state),
            path: new this.CK.PathBuilder(this._path.snapshot())
        });
        this._canvas.save();
    }

    restore() {
        const item = this._stack.pop();
        if (!item) return;
        this._state = item.state;
        this._path.delete();
        this._path = item.path;
        this._canvas.restore();
    }

    beginPath() {
        this._path.delete();
        this._path = new this.CK.PathBuilder();
    }

    moveTo(x, y) { this._path.moveTo(x, y); }
    lineTo(x, y) { this._path.lineTo(x, y); }
    closePath() { this._path.close(); }
    quadraticCurveTo(cpx, cpy, x, y) { this._path.quadTo(cpx, cpy, x, y); }

    arc(x, y, r, startAngle, endAngle, counterclockwise = false) {
        this._path.arc(x, y, r, startAngle, endAngle, counterclockwise);
    }

    ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, counterclockwise = false) {
        const CK = this.CK;
        if (Math.abs(rotation) < 1e-6 && Math.abs(endAngle - startAngle - Math.PI * 2) < 1e-4) {
            this._path.addOval(CK.LTRBRect(cx - rx, cy - ry, cx + rx, cy + ry));
            return;
        }
        this._path.addOval(CK.LTRBRect(cx - rx, cy - ry, cx + rx, cy + ry));
    }

    rect(x, y, w, h) {
        this._path.addRect(this.CK.XYWHRect(x, y, w, h));
    }

    clip() {
        const path = this._path.snapshot();
        this._canvas.clipPath(path, this.CK.ClipOp.Intersect, true);
        path.delete();
    }

    translate(dx, dy) {
        const m = this.CK.Matrix.translated(dx, dy);
        this._canvas.concat(m);
    }

    rotate(angle) {
        const m = this.CK.Matrix.rotated(angle);
        this._canvas.concat(m);
    }

    scale(sx, sy) {
        const m = this.CK.Matrix.scaled(sx, sy ?? sx);
        this._canvas.concat(m);
    }

    createLinearGradient(x0, y0, x1, y1) {
        return new SkiaGradient('linear', this.CK, [x0, y0, x1, y1]);
    }

    createRadialGradient(x0, y0, r0, x1, y1, r1) {
        return new SkiaGradient('radial', this.CK, [x0, y0, r0, x1, y1, r1]);
    }

    createPattern(source, repetition) {
        const image = source?.getImage?.() ?? source;
        return new SkiaPattern(image, repetition);
    }

    _applyStyleToPaint(paint, style, isStroke) {
        const CK = this.CK;
        paint.setAlphaf(this._state.globalAlpha);
        paint.setBlendMode(blendModeFromComposite(this._state.compositeOp, CK));

        if (style && typeof style === 'object' && style.__skiaShader) {
            if (style instanceof SkiaGradient) {
                const shader = style.buildShader();
                paint.setShader(shader);
                shader.delete();
                return;
            }
            if (style instanceof SkiaPattern && style.image) {
                const shader = style.image.makeShaderCubic(
                    CK.TileMode.Repeat,
                    CK.TileMode.Repeat,
                    1 / 3,
                    1 / 3
                );
                paint.setShader(shader);
                shader.delete();
                return;
            }
        }

        const rgba = parseColorInput(style);
        paint.setColor(CK.Color4f(rgba[0], rgba[1], rgba[2], rgba[3]));
        if (isStroke) {
            paint.setStyle(CK.PaintStyle.Stroke);
            paint.setStrokeWidth(this._state.lineWidth);
            paint.setStrokeJoin(this._lineJoinToSkia(this._state.lineJoin));
            paint.setStrokeCap(this._lineCapToSkia(this._state.lineCap));
            if (this._state.dash) {
                const effect = CK.PathEffect.MakeDash(this._state.dash, 0);
                paint.setPathEffect(effect);
                effect.delete();
            }
        } else {
            paint.setStyle(CK.PaintStyle.Fill);
        }
    }

    _lineJoinToSkia(join) {
        const CK = this.CK;
        if (join === 'round') return CK.StrokeJoin.Round;
        if (join === 'bevel') return CK.StrokeJoin.Bevel;
        return CK.StrokeJoin.Miter;
    }

    _lineCapToSkia(cap) {
        const CK = this.CK;
        if (cap === 'round') return CK.StrokeCap.Round;
        if (cap === 'square') return CK.StrokeCap.Square;
        return CK.StrokeCap.Butt;
    }

    _makeFillPaint() {
        const paint = new this.CK.Paint();
        paint.setAntiAlias(true);
        this._applyStyleToPaint(paint, this._state.fillStyle, false);
        return paint;
    }

    _makeStrokePaint() {
        const paint = new this.CK.Paint();
        paint.setAntiAlias(true);
        this._applyStyleToPaint(paint, this._state.strokeStyle, true);
        return paint;
    }

    fill() {
        const paint = this._makeFillPaint();
        const path = this._path.snapshot();
        this._canvas.drawPath(path, paint);
        path.delete();
        paint.delete();
    }

    stroke() {
        const paint = this._makeStrokePaint();
        const path = this._path.snapshot();
        this._canvas.drawPath(path, paint);
        path.delete();
        paint.delete();
    }

    fillRect(x, y, w, h) {
        const paint = this._makeFillPaint();
        this._canvas.drawRect(this.CK.XYWHRect(x, y, w, h), paint);
        paint.delete();
    }

    setLineDash(segments) {
        this._state.dash = segments ? [...segments] : null;
    }

    _resolveImage(source) {
        if (!source) return null;
        if (source.getImage) return source.getImage();
        return source;
    }

    drawImage(source, ...args) {
        const image = this._resolveImage(source);
        if (!image) return;
        const paint = new this.CK.Paint();
        paint.setAntiAlias(true);
        paint.setAlphaf(this._state.globalAlpha);
        paint.setBlendMode(blendModeFromComposite(this._state.compositeOp, this.CK));

        if (args.length === 2) {
            this._canvas.drawImage(image, args[0], args[1], paint);
        } else if (args.length === 4) {
            const [dx, dy, dw, dh] = args;
            const src = this.CK.XYWHRect(0, 0, image.width(), image.height());
            const dst = this.CK.XYWHRect(dx, dy, dw, dh);
            this._canvas.drawImageRect(image, src, dst, paint);
        }
        paint.delete();
    }

    createImageData(w, h) {
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    }

    putImageData(imageData, x, y) {
        const CK = this.CK;
        const { width, height, data } = imageData;
        const info = {
            width,
            height,
            colorType: CK.ColorType.RGBA_8888,
            alphaType: CK.AlphaType.Unpremul
        };
        const img = CK.MakeImage(info, data, width * 4);
        if (!img) return;
        const paint = new CK.Paint();
        this._canvas.drawImage(img, x, y, paint);
        paint.delete();
        img.delete();
    }

    _getFont() {
        const CK = this.CK;
        const size = fontSizeFromCss(this._state.fontStr);
        return new CK.Font(this._typeface, size);
    }

    _textX(text, x) {
        if (this._state.textAlign === 'center') return x;
        if (this._state.textAlign === 'right' || this._state.textAlign === 'end') return x;
        return x;
    }

    fillText(text, x, y) {
        const font = this._getFont();
        const paint = this._makeFillPaint();
        let drawY = y;
        if (this._state.textBaseline === 'middle') {
            drawY += font.getSize() * 0.35;
        }
        this._canvas.drawText(String(text), this._textX(text, x), drawY, paint, font);
        paint.delete();
        font.delete();
    }

    drawPicture(picture) {
        const paint = new this.CK.Paint();
        this._canvas.drawPicture(picture);
        paint.delete();
    }

    clearCanvas(color) {
        this._canvas.clear(this.CK.Color4f(...parseColorInput(color)));
    }

    getImage() {
        return this._surface?.makeImageSnapshot() ?? null;
    }

    destroy() {
        this._path.delete();
        if (this._surface) {
            this._surface.delete();
            this._surface = null;
        }
    }
}

export function createOffscreenContext(CK, width, height) {
    const surface = CK.MakeSurface(width, height);
    const canvas = surface.getCanvas();
    const ctx = new Skia2DContext(canvas, CK, width, height);
    ctx._surface = surface;
    return ctx;
}

export function wrapSkCanvas(skCanvas, CK, width, height) {
    return new Skia2DContext(skCanvas, CK, width, height);
}
