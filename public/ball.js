import {
    BALL_RADIUS,
    SLEEP_SPEED,
    SLEEP_SPIN,
    SLIDE_THRESHOLD,
    OBJECT_ENGLISH_VISUAL_SCALE,
    POCKET_FALL_SPEED_REF,
    computePocketFallDuration,
    CUE_RESPOT_DELAY_MS,
    BALL_MASS,
    BALL_MASS_MIN_G,
    BALL_MASS_MAX_G
} from './constants.js';
import { getHeadSpot, getPlaySurface } from './utils.js';
import {
    rotateVec,
    quatMultiply,
    quatNormalize,
    quatConjugate,
    quatFromRotation
} from './math3d.js';

const IDENTITY_QUAT = { w: 1, x: 0, y: 0, z: 0 };
const stripeCanvasCache = new Map();

/** 6 меток на битке — равномерно по «сторонам» сферы (±X, ±Y, ±Z) */
const CUE_MARK_DIRS = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1]
];
const CUE_MARK_SURFACE = 0.9;
const CUE_MARK_SCALE = 0.19;
const CUE_MARK_COLOR = '#c41e3a';

const SPHERE_LIGHT = [0.34, -0.26, 0.9];
/** Включить отрисовку теней под шарами (логика в getTableShadowProfile / drawTableBallShadow). */
const BALL_SHADOWS_ENABLED = false;

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

function drawTableBallShadow(ctx, x, y, r, depthScale, speed) {
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
function rollingVisualMix(ball) {
    if (ball.isCueBall && ball.cueDrawPostHit) return 1;

    const slide = ball.slide || 0;
    if (slide <= 0) return 1;
    if (slide <= SLIDE_THRESHOLD) {
        return clamp(1 - slide / SLIDE_THRESHOLD, 0, 1);
    }
    return 0;
}

function cueDrawApproachRollMix(ball, topSpin, baseRollMix) {
    const slide = ball.slide || 0;
    let mix = baseRollMix;
    if (slide > SLIDE_THRESHOLD) {
        mix = Math.max(mix, 0.95);
    } else if (slide > 0) {
        mix = Math.max(mix, clamp(1 - slide / SLIDE_THRESHOLD * 0.12, 0.88, 1));
    } else if (Math.abs(topSpin) > SLEEP_SPIN) {
        mix = Math.max(mix, 0.9);
    }
    return mix;
}

export function clearCueDrawVisualState(ball) {
    ball.cueDrawApproach = false;
    ball.cueDrawPostHit = false;
}

/** Синхронизирует угловую скорость ω с кинематическим состоянием физики (v, spin, topSpin). */
export function updateBallOmega(ball) {
    const r = ball.radius;
    const vx = ball.vx || 0;
    const vy = ball.vy || 0;
    const speed = Math.hypot(vx, vy);
    const spin = ball.spin || 0;
    const topSpin = ball.topSpin || 0;

    if (ball.isCueBall && ball.cueDrawPostHit) {
        ball.omegaX = speed > 1e-8 ? -vy / r : 0;
        ball.omegaY = speed > 1e-8 ? vx / r : 0;
        ball.omegaZ = spin / r;
        return;
    }

    let rollMix = rollingVisualMix(ball);
    let rollSign = 1;

    if (ball.isCueBall && ball.cueDrawApproach) {
        rollSign = -1;
        rollMix = cueDrawApproachRollMix(ball, topSpin, rollMix);
    }

    let omegaX = 0;
    let omegaY = 0;

    if (speed > 1e-8 && rollMix > 1e-6) {
        omegaX = (-vy / r) * rollMix * rollSign;
        omegaY = (vx / r) * rollMix * rollSign;
    }

    let omegaZ = spin / r;
    if (!ball.isCueBall) {
        omegaZ *= OBJECT_ENGLISH_VISUAL_SCALE;
    }

    const skipTopSpinRoll = ball.isCueBall && ball.cueDrawApproach;
    if (speed > 1e-8 && Math.abs(topSpin) > 1e-8 && rollMix > 1e-6 && !skipTopSpinRoll) {
        const dirX = vx / speed;
        const dirY = vy / speed;
        const topOmega = topSpin / r;
        omegaX += -dirY * topOmega * rollMix;
        omegaY += dirX * topOmega * rollMix;
    }

    ball.omegaX = omegaX;
    ball.omegaY = omegaY;
    ball.omegaZ = omegaZ;
}

export function clearBallOmega(ball) {
    ball.omegaX = 0;
    ball.omegaY = 0;
    ball.omegaZ = 0;
}

export function randomBallMass() {
    const grams = BALL_MASS_MIN_G + Math.random() * (BALL_MASS_MAX_G - BALL_MASS_MIN_G);
    return grams / 1000;
}

export class Ball {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.mass = options.mass ?? BALL_MASS;
        this.isCueBall = options.isCueBall || false;
        this.number = options.number || 0;
        this.ballType = options.ballType || (this.isCueBall ? 'cue' : 'solid');
        this.color = options.color || '#ffffff';
        this.inPocket = false;
        this.pocketFall = null;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        this.omegaX = 0;
        this.omegaY = 0;
        this.omegaZ = 0;
        this.orientation = { ...IDENTITY_QUAT };
        this.px = x;
        this.py = y;
        this.sleepFrames = 0;
        this.lastDirX = 1;
        this.lastDirY = 0;
        this.drawAxisX = 0;
        this.drawAxisY = 0;
        this.cueDrawApproach = false;
        this.cueDrawPostHit = false;
    }

    startPocketFall(pocket) {
        if (this.pocketFall || this.inPocket) return;

        const entrySpeed = Math.hypot(this.vx, this.vy);
        this.pocketFall = {
            pocketX: pocket.x,
            pocketY: pocket.y,
            pocketDrawRadius: pocket.drawRadius ?? pocket.radius,
            startX: this.x,
            startY: this.y,
            startTime: performance.now(),
            duration: computePocketFallDuration(entrySpeed),
            entrySpeed,
            entryAngle: Math.atan2(this.y - pocket.y, this.x - pocket.x),
            depth: 0,
            scale: 1,
            alpha: 1,
            progress: 0
        };
        this.vx = 0;
        this.vy = 0;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        clearBallOmega(this);
        this.drawAxisX = 0;
        this.drawAxisY = 0;
        clearCueDrawVisualState(this);
    }

    updatePocketFall(balls) {
        if (!this.pocketFall) return false;

        const {
            pocketX, pocketY, startX, startY, startTime, duration, entryAngle, entrySpeed
        } = this.pocketFall;
        const t = Math.min((performance.now() - startTime) / duration, 1);
        const speedFactor = clamp(entrySpeed / POCKET_FALL_SPEED_REF, 0.35, 2.6);

        const rollPhase = clamp(0.4 - (speedFactor - 1) * 0.14, 0.22, 0.4);
        const dropStart = clamp(0.3 - (speedFactor - 1) * 0.12, 0.14, 0.3);

        const rollT = Math.min(t / rollPhase, 1);
        const rollEase = rollT * rollT * (3 - 2 * rollT);
        const dropT = t < dropStart ? 0 : Math.min((t - dropStart) / (1 - dropStart), 1);
        const dropEase = dropT * dropT * dropT;

        const perpX = -Math.sin(entryAngle);
        const perpY = Math.cos(entryAngle);
        const wobbleAmp = 1.6 + entrySpeed * 0.09;
        const wobble = Math.sin(t * Math.PI * (3.2 + speedFactor * 0.4)) * (1 - t) * wobbleAmp;

        const baseX = startX + (pocketX - startX) * rollEase;
        const baseY = startY + (pocketY - startY) * rollEase;
        const sinkPull = dropEase * (3.2 + entrySpeed * 0.18);

        this.x = baseX + perpX * wobble + Math.cos(entryAngle) * sinkPull * 0.25;
        this.y = baseY + perpY * wobble + Math.sin(entryAngle) * sinkPull * 0.25;

        this.pocketFall.depth = dropEase;
        this.pocketFall.scale = 1 - dropEase * 0.91;
        this.pocketFall.alpha = 1 - dropEase * 0.97;
        this.pocketFall.progress = t;
        const rollScale = (0.08 + dropEase * 0.34) * speedFactor;
        this.applyRotationVector(
            -Math.sin(entryAngle) * rollScale,
            Math.cos(entryAngle) * rollScale,
            rollScale * 0.35
        );

        if (t < 1) return false;

        const wasCue = this.isCueBall;
        this.pocketFall = null;
        this.inPocket = true;
        if (wasCue) {
            setTimeout(() => this.respotCueBall(balls), CUE_RESPOT_DELAY_MS);
        }
        return true;
    }

    isPocketing() {
        return this.pocketFall !== null;
    }

    applyRotationVector(rx, ry, rz) {
        const delta = quatFromRotation(rx, ry, rz);
        if (delta.w === 1 && delta.x === 0 && delta.y === 0 && delta.z === 0) return;
        this.orientation = quatNormalize(quatMultiply(delta, this.orientation));
    }

    advanceRoll(dt) {
        if (this.inPocket) return;

        this.applyRotationVector(
            (this.omegaX || 0) * dt,
            (this.omegaY || 0) * dt,
            (this.omegaZ || 0) * dt
        );
    }

    projectSurfacePoint(lx, ly, lz, minDepth = 0.1) {
        const [px, py, pz] = rotateVec(this.orientation, lx, ly, lz);
        if (pz < minDepth) return null;

        return {
            x: this.x + px * this.radius,
            y: this.y + py * this.radius,
            depth: pz
        };
    }

    projectSurfacePointFade(lx, ly, lz) {
        const [px, py, pz] = rotateVec(this.orientation, lx, ly, lz);
        if (pz <= 0) return null;

        const fade = Math.min(1, pz / 0.12);
        return {
            x: this.x + px * this.radius,
            y: this.y + py * this.radius,
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
            const point = this.projectSurfacePoint(
                cosLat * Math.cos(t),
                sinLat,
                cosLat * Math.sin(t)
            );
            if (point) points.push(point);
        }

        return points;
    }

    drawStripeSphere(ctx, r, darken = 1) {
        const d = Math.ceil(r * 2);
        const offscreen = getStripeCanvas(d);
        const offCtx = offscreen.getContext('2d');
        const image = offCtx.createImageData(d, d);
        const pixels = image.data;
        const center = r;
        const invQ = quatConjugate(this.orientation);
        const stripeSin = Math.sin(0.66);
        const stripeEdge = 0.045;
        const color = hexToRgb(this.color);
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
        ctx.drawImage(offscreen, this.x - r, this.y - r);
    }

    drawSolidSphere(ctx, r, fillColor, darken = 1, forCue = false) {
        const d = Math.ceil(r * 2);
        const offscreen = getStripeCanvas(d);
        const offCtx = offscreen.getContext('2d');
        const image = offCtx.createImageData(d, d);
        const pixels = image.data;
        const center = r;
        const invQ = quatConjugate(this.orientation);
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
        ctx.drawImage(offscreen, this.x - r, this.y - r);
    }

    drawNumberPatch(ctx, r) {
        const center = this.projectSurfacePointFade(0, 0, 0.93);
        if (!center) return;

        const tangent = this.projectSurfacePoint(0.14, 0, 0.92, 0);
        const textAngle = tangent
            ? Math.atan2(tangent.y - center.y, tangent.x - center.x)
            : 0;
        const fade = center.fade;
        const spotR = r * 0.64 * (0.9 + 0.1 * fade);

        ctx.save();
        ctx.globalAlpha *= fade;

        ctx.beginPath();
        ctx.arc(center.x, center.y, spotR, 0, Math.PI * 2);
        ctx.fillStyle = this.ballType === 'eight' ? '#ffffff' : '#fafafa';
        ctx.fill();

        ctx.translate(center.x, center.y);
        ctx.rotate(textAngle);
        ctx.fillStyle = this.ballType === 'eight' ? '#111' : '#222';
        ctx.font = `bold ${r * 1.05}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(this.number), 0, 0.5);
        ctx.restore();
    }

    drawCueMarks(ctx, r) {
        const marks = CUE_MARK_DIRS.map(([dx, dy, dz]) => {
            const point = this.projectSurfacePoint(
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

    draw(ctx) {
        if (this.inPocket) return;

        const r = this.radius;
        const fall = this.pocketFall;
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

        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale * squash);
        ctx.translate(-this.x, -this.y);

        if (BALL_SHADOWS_ENABLED && shadowDepthScale > 0.01) {
            ctx.save();
            ctx.globalAlpha = 1 - depth * 0.4;
            drawTableBallShadow(ctx, this.x, this.y, r, shadowDepthScale, Math.hypot(this.vx || 0, this.vy || 0));
            ctx.restore();
        }

        let fillColor;
        if (this.isCueBall) {
            fillColor = '#f5f3ee';
        } else if (this.ballType === 'eight') {
            fillColor = '#1a1a1a';
        } else if (this.ballType === 'stripe') {
            fillColor = this.color;
        } else {
            fillColor = this.color;
        }

        const depthDarken = depth > 0.15 ? 1 - depth * 0.45 : 1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.clip();

        if (this.ballType === 'stripe' && !this.isCueBall) {
            this.drawStripeSphere(ctx, r, depthDarken);
        } else {
            this.drawSolidSphere(ctx, r, fillColor, depthDarken, this.isCueBall);
        }

        if (this.isCueBall) {
            this.drawCueMarks(ctx, r);
        } else {
            this.drawNumberPatch(ctx, r);
        }

        ctx.restore();

        const highlightAlpha = 0.55 * (1 - depth * 0.7);
        if (highlightAlpha > 0.05) {
            ctx.beginPath();
            ctx.arc(this.x - r * 0.32, this.y - r * 0.32, r * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
            ctx.fill();
        }

        ctx.restore();
    }

    isMoving() {
        if (this.inPocket) return false;
        if (this.isPocketing()) return true;
        return Math.hypot(this.vx, this.vy) > SLEEP_SPEED;
    }

    respotCueBall(balls) {
        const spot = getHeadSpot();
        this.x = spot.x;
        this.y = spot.y;
        this.vx = 0;
        this.vy = 0;
        this.inPocket = false;
        this.pocketFall = null;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        clearBallOmega(this);
        this.sleepFrames = 0;
        this.orientation = { ...IDENTITY_QUAT };
        this.lastDirX = 1;
        this.lastDirY = 0;
        this.drawAxisX = 0;
        this.drawAxisY = 0;
        clearCueDrawVisualState(this);

        for (const ball of balls) {
            if (ball === this || ball.inPocket) continue;
            const dx = ball.x - this.x;
            const dy = ball.y - this.y;
            const dist = Math.hypot(dx, dy);
            const minDist = this.radius + ball.radius + 2;
            if (dist < minDist && dist > 0) {
                this.x -= (dx / dist) * (minDist - dist);
                this.y -= (dy / dist) * (minDist - dist);
            }
        }
    }
}
