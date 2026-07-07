import {
    BALL_RADIUS,
    SLEEP_SPEED,
    POCKET_FALL_SPEED_REF,
    computePocketFallDuration,
    CUE_RESPOT_DELAY_MS,
    BALL_MASS,
    BALL_MASS_MIN_G,
    BALL_MASS_MAX_G
} from './constants.js';
import { getHeadSpot } from './utils.js';

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

function getStripeCanvas(size) {
    if (!stripeCanvasCache.has(size)) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        stripeCanvasCache.set(size, canvas);
    }
    return stripeCanvasCache.get(size);
}

function quatNormalize(q) {
    const len = Math.hypot(q.w, q.x, q.y, q.z) || 1;
    return { w: q.w / len, x: q.x / len, y: q.y / len, z: q.z / len };
}

function quatMultiply(a, b) {
    return {
        w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    };
}

function quatConjugate(q) {
    return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rotateVec(q, x, y, z) {
    const tx = 2 * (q.y * z - q.z * y);
    const ty = 2 * (q.z * x - q.x * z);
    const tz = 2 * (q.x * y - q.y * x);
    return [
        x + q.w * tx + (q.y * tz - q.z * ty),
        y + q.w * ty + (q.z * tx - q.x * tz),
        z + q.w * tz + (q.x * ty - q.y * tx)
    ];
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
        this.orientation = { ...IDENTITY_QUAT };
        this.px = x;
        this.py = y;
        this.sleepFrames = 0;
        this.lastDirX = 1;
        this.lastDirY = 0;
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
        this.advanceRoll((0.08 + dropEase * 0.34) * speedFactor);

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

    advanceRoll(frameFraction) {
        if (this.inPocket) return;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed < 1e-8) return;

        const angle = (speed * frameFraction) / this.radius;
        const half = angle * 0.5;
        const s = Math.sin(half);
        const c = Math.cos(half);
        const axisX = -this.vy / speed;
        const axisY = this.vx / speed;
        const delta = { w: c, x: axisX * s, y: axisY * s, z: 0 };

        this.orientation = quatNormalize(quatMultiply(delta, this.orientation));
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

    drawStripeSphere(ctx, r) {
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

                const inStripe = Math.abs(ly) <= stripeSin;
                let rgb = inStripe ? color : white;

                const edgeDist = Math.abs(Math.abs(ly) - stripeSin);
                if (edgeDist < stripeEdge) {
                    const edge = (1 - edgeDist / stripeEdge) * 0.3;
                    rgb = rgb.map(c => c * (1 - edge));
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
        const shadowAlpha = fall ? 0.35 * (1 - depth * 0.85) : 0.35;

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

        if (shadowAlpha > 0.02) {
            ctx.save();
            ctx.globalAlpha = shadowAlpha * (1 - depth * 0.4);
            ctx.beginPath();
            ctx.arc(this.x + 1.5, this.y + 2, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fill();
            ctx.restore();
        }

        let fillColor;
        if (this.isCueBall) {
            fillColor = '#ffffff';
        } else if (this.ballType === 'eight') {
            fillColor = '#1a1a1a';
        } else if (this.ballType === 'stripe') {
            fillColor = '#fcfcfa';
        } else {
            fillColor = this.color;
        }

        if (depth > 0.15) {
            const darken = 1 - depth * 0.45;
            if (fillColor.startsWith('#')) {
                const n = parseInt(fillColor.slice(1), 16);
                const rr = Math.round(((n >> 16) & 255) * darken);
                const gg = Math.round(((n >> 8) & 255) * darken);
                const bb = Math.round((n & 255) * darken);
                fillColor = `rgb(${rr},${gg},${bb})`;
            }
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.clip();

        if (this.ballType === 'stripe' && !this.isCueBall) {
            this.drawStripeSphere(ctx, r);
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
        this.sleepFrames = 0;
        this.orientation = { ...IDENTITY_QUAT };
        this.lastDirX = 1;
        this.lastDirY = 0;

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
