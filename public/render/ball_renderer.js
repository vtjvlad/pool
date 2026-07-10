import { rotateVec, quatConjugate } from '../math3d.js';

const SPHERE_LIGHT = [0.34, -0.26, 0.9];
const CUE_MARK_DIRS = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
];
const CUE_MARK_SURFACE = 0.9;
const CUE_MARK_SCALE = 0.19;
const CUE_MARK_COLOR = '#c41e3a';
const CACHE_LIMIT = 200;

const ballImageCache = new Map();
const cacheOrder = [];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
    if (forCue) return clamp(0.76 + 0.24 * ndotl, 0.7, 1.0);
    return clamp(0.72 + 0.28 * ndotl, 0.64, 1.0);
}

function shadeRgb(rgb, factor, darken = 1) {
    const k = factor * darken;
    return rgb.map(c => Math.round(c * k));
}

function quatKey(q) {
    return [q.w, q.x, q.y, q.z].map(v => Math.round(v * 40)).join(',');
}

function cacheSet(key, image) {
    if (ballImageCache.has(key)) {
        ballImageCache.get(key).delete();
    }
    ballImageCache.set(key, image);
    const idx = cacheOrder.indexOf(key);
    if (idx >= 0) cacheOrder.splice(idx, 1);
    cacheOrder.push(key);
    while (cacheOrder.length > CACHE_LIMIT) {
        const old = cacheOrder.shift();
        const img = ballImageCache.get(old);
        img?.delete();
        ballImageCache.delete(old);
    }
}

function projectSurfacePoint(orientation, ballX, ballY, radius, lx, ly, lz, minDepth = 0.1) {
    const [px, py, pz] = rotateVec(orientation, lx, ly, lz);
    if (pz < minDepth) return null;
    return { x: ballX + px * radius, y: ballY + py * radius, depth: pz };
}

function projectSurfacePointFade(orientation, ballX, ballY, radius, lx, ly, lz) {
    const [px, py, pz] = rotateVec(orientation, lx, ly, lz);
    if (pz <= 0) return null;
    const fade = Math.min(1, pz / 0.12);
    return { x: ballX + px * radius, y: ballY + py * radius, depth: pz, fade };
}

function buildSphereImage(CK, r, orientation, fillColor, darken, forCue, isStripe, stripeColor) {
    const d = Math.ceil(r * 2);
    const pixels = new Uint8Array(d * d * 4);
    const center = r;
    const invQ = quatConjugate(orientation);
    const stripeSin = Math.sin(0.66);
    const stripeEdge = 0.045;
    const color = stripeColor ? hexToRgb(stripeColor) : null;
    const white = [252, 252, 250];
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
            const shade = sphereLocalShade(lx, ly, lz, forCue) * darken;

            let rgb;
            if (isStripe) {
                const inStripe = Math.abs(ly) <= stripeSin;
                rgb = shadeRgb(inStripe ? color : white, shade);
                const edgeDist = Math.abs(Math.abs(ly) - stripeSin);
                if (edgeDist < stripeEdge) {
                    const edge = (1 - edgeDist / stripeEdge) * 0.3;
                    rgb = rgb.map(c => Math.round(c * (1 - edge)));
                }
            } else {
                rgb = shadeRgb(base, sphereLocalShade(lx, ly, lz, forCue), darken);
            }

            pixels[idx] = rgb[0];
            pixels[idx + 1] = rgb[1];
            pixels[idx + 2] = rgb[2];
            pixels[idx + 3] = 255;
        }
    }

    const info = {
        width: d,
        height: d,
        colorType: CK.ColorType.RGBA_8888,
        alphaType: CK.AlphaType.Unpremul
    };
    return CK.MakeImage(info, pixels, d * 4);
}

function getSphereImage(CK, ball, r, fillColor, darken, forCue, isStripe) {
    const key = `${ball.ballType}-${fillColor}-${isStripe ? ball.color : ''}-${quatKey(ball.orientation)}-${darken}-${forCue}`;
    if (ballImageCache.has(key)) return ballImageCache.get(key);
    const image = buildSphereImage(CK, r, ball.orientation, fillColor, darken, forCue, isStripe, ball.color);
    if (image) cacheSet(key, image);
    return image;
}

function drawNumberPatch(ctx, ball, r, typeface) {
    const center = projectSurfacePointFade(ball.orientation, ball.x, ball.y, r, 0, 0, 0.93);
    if (!center) return;

    const tangent = projectSurfacePoint(ball.orientation, ball.x, ball.y, r, 0.14, 0, 0.92, 0);
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

    if (typeface) {
        ctx.translate(center.x, center.y);
        ctx.rotate(textAngle);
        ctx.fillStyle = ball.ballType === 'eight' ? '#111' : '#222';
        ctx.font = `bold ${r * 1.05}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.setTypeface(typeface);
        ctx.fillText(String(ball.number), 0, 0.5);
    }
    ctx.restore();
}

function drawCueMarks(ctx, ball, r) {
    const marks = CUE_MARK_DIRS.map(([dx, dy, dz]) =>
        projectSurfacePoint(
            ball.orientation,
            ball.x,
            ball.y,
            r,
            dx * CUE_MARK_SURFACE,
            dy * CUE_MARK_SURFACE,
            dz * CUE_MARK_SURFACE
        )
    ).filter(Boolean);

    marks.sort((a, b) => a.depth - b.depth);
    ctx.fillStyle = CUE_MARK_COLOR;
    for (const mark of marks) {
        ctx.beginPath();
        ctx.arc(mark.x, mark.y, r * CUE_MARK_SCALE * mark.depth, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawBall(ctx, ball, typeface) {
    if (ball.inPocket) return;

    const r = ball.radius;
    const fall = ball.pocketFall;
    const scale = fall ? fall.scale : 1;
    const alpha = fall ? fall.alpha : 1;
    const depth = fall ? fall.depth : 0;
    const squash = fall ? 1 - depth * 0.28 : 1;

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

    let fillColor;
    if (ball.isCueBall) fillColor = '#f5f3ee';
    else if (ball.ballType === 'eight') fillColor = '#1a1a1a';
    else fillColor = ball.color;

    const depthDarken = depth > 0.15 ? 1 - depth * 0.45 : 1;
    const isStripe = ball.ballType === 'stripe' && !ball.isCueBall;
    const image = getSphereImage(
        ctx.CK,
        ball,
        r,
        fillColor,
        depthDarken,
        ball.isCueBall,
        isStripe
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.clip();

    if (image) {
        ctx.drawImage(image, ball.x - r, ball.y - r);
    }

    if (ball.isCueBall) {
        drawCueMarks(ctx, ball, r);
    } else {
        drawNumberPatch(ctx, ball, r, typeface);
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

export function clearBallImageCache() {
    for (const img of ballImageCache.values()) img.delete();
    ballImageCache.clear();
    cacheOrder.length = 0;
}
