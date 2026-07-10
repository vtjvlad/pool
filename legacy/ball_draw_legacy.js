/**
 * LEGACY — Canvas 2D отрисовка шаров (архив, не подключается к сборке).
 * Заменено: public/render/ball_renderer.js
 * Дата переноса: 2026-07-10
 */
import { BALL_RADIUS } from '../public/constants.js';
import { rotateVec, quatConjugate } from '../public/math3d.js';

/**
 * stripeCanvasCache / getStripeCanvas
 * ───────────────────────────────────
 * Назначение: offscreen canvas для пиксельной сферы (Canvas 2D).
 * Было в:     public/ball.js
 * Заменено:   public/render/ball_renderer.js
 */
export const stripeCanvasCache = new Map();

function getStripeCanvas(size) {
    if (!stripeCanvasCache.has(size)) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        stripeCanvasCache.set(size, canvas);
    }
    return stripeCanvasCache.get(size);
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function parseBallRgb(color) {
    if (color.startsWith('#')) return hexToRgb(color);
    const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return [200, 200, 200];
}

function sphereLocalShade(lx, ly, lz, forCue = false) {
    const [lx0, ly0, lz0] = SPHERE_LIGHT;
    const len = Math.hypot(lx0, ly0, lz0);
    const ndotl = (lx * lx0 + ly * ly0 + lz * lz0) / len;
    if (forCue) {
        return clamp(0.76 + 0.24 * ndotl, 0.7, 1.0);
    }
    return clamp(0.72 + 0.28 * ndotl, 0.64, 1.0);
}

function shadeRgb(rgb, factor, darken = 1) {
    const k = factor * darken;
    return rgb.map(c => Math.round(c * k));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getTableShadowProfile(x, y, r, speed = 0) {
    const surface = getPlaySurface();
    const cx = surface.left + surface.width * 0.5;
    const cy = surface.top + surface.height * 0.5;

    const dx = x - cx;
    const dy = y - cy;
    const nx = dx / Math.max(surface.width * 0.5, 1);
    const ny = dy / Math.max(surface.height * 0.5, 1);
    const edge = clamp(Math.hypot(nx, ny), 0, 1);

    const len = Math.hypot(dx, dy);
    const dirX = len > 1e-6 ? dx / len : 0.7;
    const dirY = len > 1e-6 ? dy / len : 0.3;
    const speedFactor = clamp(speed / 8, 0, 1);

    const distLeft = x - surface.left;
    const distRight = surface.right - x;
    const distTop = y - surface.top;
    const distBottom = surface.bottom - y;
    const minEdgeDist = Math.max(0, Math.min(distLeft, distRight, distTop, distBottom));
    const edgeScale = clamp(minEdgeDist / Math.max(r * 8, 1), 0, 1);
    const nearRail = 1 - edgeScale;
    const railTighten = 1 - nearRail * 0.28;
    const railStretch = 1 + nearRail * 0.42;

    return {
        edge,
        dirX,
        dirY,
        // В центре тень шире/мягче, у бортов — компактнее и контрастнее.
        rx: r * (1.58 - edge * 0.52) * railStretch,
        ry: r * (0.94 - edge * 0.26) * railTighten,
        offset: r * (0.1 + edge * 0.26) * (1 + nearRail * 0.22),
        coreAlpha: 0.03 + edge * 0.22,
        penumbraAlpha: 0.02 + edge * 0.12,
        contactAlpha: (0.045 + edge * 0.11) * (0.65 + speedFactor * 0.35),
        speedFactor,
        nearRail
    };
}

function drawSoftShadowLayer(ctx, cx, cy, rx, ry, angle, innerAlpha, outerAlpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(rx, ry);
    const grad = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 1);
    grad.addColorStop(0, `rgba(0, 0, 0, ${innerAlpha})`);
    grad.addColorStop(0.62, `rgba(0, 0, 0, ${innerAlpha * 0.55})`);
    grad.addColorStop(1, `rgba(0, 0, 0, ${outerAlpha})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function drawTableBallShadow(ctx, x, y, r, depthScale, speed) {
    const shadow = getTableShadowProfile(x, y, r, speed);
    const angle = Math.atan2(shadow.dirY, shadow.dirX);
    const offsetX = shadow.dirX * shadow.offset;
    const offsetY = shadow.dirY * shadow.offset;

    // Базовая тень от всего шара (без сильного смещения).
    drawSoftShadowLayer(
        ctx,
        x,
        y,
        r * (0.98 + shadow.nearRail * 0.06),
        r * (0.58 - shadow.nearRail * 0.06),
        angle,
        (shadow.contactAlpha * 0.9) * depthScale,
        0
    );

    // Контактная тень под шаром — слегка сдвинута по направлению света.
    drawSoftShadowLayer(
        ctx,
        x + offsetX * 0.22,
        y + offsetY * 0.22,
        r * 0.82,
        r * 0.5,
        angle,
        shadow.contactAlpha * depthScale,
        0
    );

    // Основная тень.
    drawSoftShadowLayer(
        ctx,
        x + offsetX,
        y + offsetY,
        shadow.rx,
        shadow.ry,
        angle,
        shadow.coreAlpha * depthScale,
        0
    );

    // Полутень/рассеяние.
    drawSoftShadowLayer(
        ctx,
        x + offsetX * 1.35,
        y + offsetY * 1.35,
        shadow.rx * (1.28 + shadow.nearRail * 0.2),
        shadow.ry * (1.24 - shadow.nearRail * 0.18),
        angle,
        shadow.penumbraAlpha * depthScale,
        0
    );
}

/** Доля визуального качения: только по ball.slide (не по spin — иначе шар «скользит» почти всегда). */
function projectSurfacePoint(ball, lx, ly, lz, minDepth = 0.1) {
        const [px, py, pz] = rotateVec(ball.orientation, lx, ly, lz);
        if (pz < minDepth) return null;

        return {
            x: ball.x + px * ball.radius,
            y: ball.y + py * ball.radius,
            depth: pz
        };
    }

function projectSurfacePointFade(ball, lx, ly, lz) {
        const [px, py, pz] = rotateVec(ball.orientation, lx, ly, lz);
        if (pz <= 0) return null;

        const fade = Math.min(1, pz / 0.12);
        return {
            x: ball.x + px * ball.radius,
            y: ball.y + py * ball.radius,
            depth: pz,
            fade
        };
    }

    sampleSurfaceRing(latitude, segments = 28) {
        const cosLat = Math.cos(latitude);
        const sinLat = Math.sin(latitude);
        const points = [];

        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const point = ball.projectSurfacePoint(
                cosLat * Math.cos(t),
                sinLat,
                cosLat * Math.sin(t)
            );
            if (point) points.push(point);
        }

        return points;
export function drawStripeSphere(ball, ctx, r, darken = 1) {
        const d = Math.ceil(r * 2);
        const offscreen = getStripeCanvas(d);
        const offCtx = offscreen.getContext('2d');
        const image = offCtx.createImageData(d, d);
        const pixels = image.data;
        const center = r;
        const invQ = quatConjugate(ball.orientation);
        const stripeSin = Math.sin(0.66);
        const stripeEdge = 0.045;
        const color = hexToRgb(ball.color);
        const white = [252, 252, 250];

        for (let y = 0; y < d; y++) {
            for (let x = 0; x < d; x++) {
                const idx = (y * d + x) * 4;
                const dx = x - center + 0.5;
                const dy = y - center + 0.5;
                const distSq = dx * dx + dy * dy;
                if (distSq > r * r) {
                    pixels[idx + 3] = 0;
                    continue;
                }

                const sx = dx / r;
                const sy = dy / r;
                const sz = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
                const [lx, ly, lz] = rotateVec(invQ, sx, sy, sz);
                const shade = sphereLocalShade(lx, ly, lz) * darken;

                const inStripe = Math.abs(ly) <= stripeSin;
                let rgb = shadeRgb(inStripe ? color : white, shade);

                const edgeDist = Math.abs(Math.abs(ly) - stripeSin);
                if (edgeDist < stripeEdge) {
                    const edge = (1 - edgeDist / stripeEdge) * 0.3;
                    rgb = rgb.map(c => Math.round(c * (1 - edge)));
                }

                pixels[idx] = rgb[0];
                pixels[idx + 1] = rgb[1];
                pixels[idx + 2] = rgb[2];
                pixels[idx + 3] = 255;
            }
        }

        offCtx.putImageData(image, 0, 0);
        ctx.drawImage(offscreen, ball.x - r, ball.y - r);
    }

export function drawSolidSphere(ball, ctx, r, fillColor, darken = 1, forCue = false) {
        const d = Math.ceil(r * 2);
        const offscreen = getStripeCanvas(d);
        const offCtx = offscreen.getContext('2d');
        const image = offCtx.createImageData(d, d);
        const pixels = image.data;
        const center = r;
        const invQ = quatConjugate(ball.orientation);
        const base = parseBallRgb(fillColor);

        for (let y = 0; y < d; y++) {
            for (let x = 0; x < d; x++) {
                const idx = (y * d + x) * 4;
                const dx = x - center + 0.5;
                const dy = y - center + 0.5;
                const distSq = dx * dx + dy * dy;
                if (distSq > r * r) {
                    pixels[idx + 3] = 0;
                    continue;
                }

                const sx = dx / r;
                const sy = dy / r;
                const sz = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
                const [lx, ly, lz] = rotateVec(invQ, sx, sy, sz);
                const rgb = shadeRgb(base, sphereLocalShade(lx, ly, lz, forCue), darken);

                pixels[idx] = rgb[0];
                pixels[idx + 1] = rgb[1];
                pixels[idx + 2] = rgb[2];
                pixels[idx + 3] = 255;
            }
        }

        offCtx.putImageData(image, 0, 0);
        ctx.drawImage(offscreen, ball.x - r, ball.y - r);
    }

export function drawNumberPatch(ball, ctx, r) {
        const center = projectSurfacePointFade(ball, 0, 0, 0.93);
        if (!center) return;

        const tangent = projectSurfacePoint(ball, 0.14, 0, 0.92, 0);
        const textAngle = tangent
            ? Math.atan2(tangent.y - center.y, tangent.x - center.x)
            : 0;
        const fade = center.fade;
        const spotR = r * 0.64 * (0.9 + 0.1 * fade);

        ctx.save();
        ctx.globalAlpha *= fade;

        ctx.beginPath();
        ctx.arc(center.x, center.y, spotR, 0, Math.PI * 2);
        ctx.fillStyle = ball.ballType === 'eight' ? '#ffffff' : '#fafafa';
        ctx.fill();

        ctx.translate(center.x, center.y);
        ctx.rotate(textAngle);
        ctx.fillStyle = ball.ballType === 'eight' ? '#111' : '#222';
        ctx.font = `bold ${r * 1.05}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ball.number), 0, 0.5);
        ctx.restore();
    }

export function drawCueMarks(ball, ctx, r) {
        const marks = CUE_MARK_DIRS.map(([dx, dy, dz]) => {
            const point = projectSurfacePoint(ball, 
                dx * CUE_MARK_SURFACE,
                dy * CUE_MARK_SURFACE,
                dz * CUE_MARK_SURFACE
            );
            if (!point) return null;
            return point;
        }).filter(Boolean);

        marks.sort((a, b) => a.depth - b.depth);

        ctx.fillStyle = CUE_MARK_COLOR;
        for (const mark of marks) {
            ctx.beginPath();
            ctx.arc(mark.x, mark.y, r * CUE_MARK_SCALE * mark.depth, 0, Math.PI * 2);
            ctx.fill();
        }
    }

export function draw(ball, ctx) {
        if (ball.inPocket) return;

        const r = ball.radius;
        const fall = ball.pocketFall;
        const scale = fall ? fall.scale : 1;
        const alpha = fall ? fall.alpha : 1;
        const depth = fall ? fall.depth : 0;
        const squash = fall ? 1 - depth * 0.28 : 1;
        const shadowDepthScale = fall ? (1 - depth * 0.85) : 1;

        ctx.save();

        if (fall) {
            const clipR = fall.pocketDrawRadius * (1.04 - depth * 0.1);
            ctx.beginPath();
            ctx.arc(fall.pocketX, fall.pocketY, clipR, 0, Math.PI * 2);
            ctx.clip();
        }

        ctx.globalAlpha = alpha * (1 - depth * 0.4);

        ctx.translate(ball.x, ball.y);
        ctx.scale(scale, scale * squash);
        ctx.translate(-ball.x, -ball.y);

        if (BALL_SHADOWS_ENABLED && shadowDepthScale > 0.01) {
            ctx.save();
            ctx.globalAlpha = 1 - depth * 0.4;
            drawTableBallShadow(ctx, ball.x, ball.y, r, shadowDepthScale, Math.hypot(ball.vx || 0, ball.vy || 0));
            ctx.restore();
        }

        let fillColor;
        if (ball.isCueBall) {
            fillColor = '#f5f3ee';
        } else if (ball.ballType === 'eight') {
            fillColor = '#1a1a1a';
        } else if (ball.ballType === 'stripe') {
            fillColor = ball.color;
        } else {
            fillColor = ball.color;
        }

        const depthDarken = depth > 0.15 ? 1 - depth * 0.45 : 1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.clip();

        if (ball.ballType === 'stripe' && !ball.isCueBall) {
            drawStripeSphere(ball, ctx, r, depthDarken);
        } else {
            drawSolidSphere(ball, ctx, r, fillColor, depthDarken, ball.isCueBall);
        }

        if (ball.isCueBall) {
            drawCueMarks(ball, ctx, r);
        } else {
            drawNumberPatch(ball, ctx, r);
        }

        ctx.restore();

        const highlightAlpha = 0.55 * (1 - depth * 0.7);
        if (highlightAlpha > 0.05) {
            ctx.beginPath();
            ctx.arc(ball.x - r * 0.32, ball.y - r * 0.32, r * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
            ctx.fill();
        }

        ctx.restore();
    }