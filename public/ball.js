import {
    BALL_RADIUS,
    SLEEP_SPEED,
    SLEEP_SPIN,
    SLIDE_THRESHOLD,
    POCKET_FALL_MS,
    CUE_RESPOT_DELAY_MS,
    SPIN_VISUAL_SCALE,
    SPIN_VISUAL_ROLLING_FACTOR
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

export class Ball {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.isCueBall = options.isCueBall || false;
        this.number = options.number || 0;
        this.ballType = options.ballType || (this.isCueBall ? 'cue' : 'solid');
        this.color = options.color || '#ffffff';
        this.inPocket = false;
        this.pocketFall = null;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        this.orientation = { ...IDENTITY_QUAT };
        this.px = x;
        this.py = y;
        this.sleepFrames = 0;
        this.lastDirX = 1;
        this.lastDirY = 0;
    }

    startPocketFall(pocket) {
        if (this.pocketFall || this.inPocket) return;

        this.pocketFall = {
            pocketX: pocket.x,
            pocketY: pocket.y,
            startX: this.x,
            startY: this.y,
            startTime: performance.now(),
            duration: POCKET_FALL_MS
        };
        this.vx = 0;
        this.vy = 0;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
    }

    updatePocketFall(balls) {
        if (!this.pocketFall) return false;

        const { pocketX, pocketY, startX, startY, startTime, duration } = this.pocketFall;
        const t = Math.min((performance.now() - startTime) / duration, 1);
        const sink = t * t * (3 - 2 * t);

        this.x = startX + (pocketX - startX) * sink;
        this.y = startY + (pocketY - startY) * sink;
        this.pocketFall.scale = 1 - sink * 0.88;
        this.pocketFall.alpha = 1 - sink * 0.92;
        this.advanceRoll(sink * 0.08);

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

        const vx = this.vx;
        const vy = this.vy;
        const speed = Math.hypot(vx, vy);
        const sliding = (this.slide || 0) > SLIDE_THRESHOLD;
        const rollingClean = speed > SLEEP_SPEED && !sliding;
        const spinScale = rollingClean
            ? SPIN_VISUAL_SCALE * SPIN_VISUAL_ROLLING_FACTOR
            : SPIN_VISUAL_SCALE;

        if (speed >= 1e-8) {
            const angle = (speed * frameFraction) / this.radius;
            const half = angle * 0.5;
            const s = Math.sin(half);
            const c = Math.cos(half);
            const axisX = -vy / speed;
            const axisY = vx / speed;
            const delta = { w: c, x: axisX * s, y: axisY * s, z: 0 };

            this.orientation = quatNormalize(quatMultiply(delta, this.orientation));
        }

        const spinAngle = (this.spin || 0) * spinScale * frameFraction;
        if (Math.abs(spinAngle) > 1e-8) {
            const half = spinAngle * 0.5;
            const spinDelta = { w: Math.cos(half), x: 0, y: 0, z: Math.sin(half) };
            this.orientation = quatNormalize(quatMultiply(spinDelta, this.orientation));
        }

        const topSpinAngle = (this.topSpin || 0) * spinScale * frameFraction;
        if (Math.abs(topSpinAngle) > 1e-8) {
            let axisX;
            let axisY;
            if (speed >= 1e-8) {
                axisX = -vy / speed;
                axisY = vx / speed;
            } else {
                axisX = -(this.lastDirY ?? 0);
                axisY = this.lastDirX ?? 1;
            }
            const axisLen = Math.hypot(axisX, axisY) || 1;
            axisX /= axisLen;
            axisY /= axisLen;
            const half = topSpinAngle * 0.5;
            const s = Math.sin(half);
            const c = Math.cos(half);
            const topDelta = { w: c, x: axisX * s, y: axisY * s, z: 0 };
            this.orientation = quatNormalize(quatMultiply(topDelta, this.orientation));
        }
    }

    projectSurfacePoint(lx, ly, lz) {
        const [px, py, pz] = rotateVec(this.orientation, lx, ly, lz);
        if (pz < 0.1) return null;

        return {
            x: this.x + px * this.radius,
            y: this.y + py * this.radius,
            depth: pz
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

    drawSurfacePath(ctx, points) {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
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
        const center = this.projectSurfacePoint(0, 0, 0.93);
        if (!center) return;

        const tangent = this.projectSurfacePoint(0.14, 0, 0.92);
        const textAngle = tangent
            ? Math.atan2(tangent.y - center.y, tangent.x - center.x)
            : 0;
        const spotR = r * 0.64 * center.depth;

        ctx.beginPath();
        ctx.arc(center.x, center.y, spotR, 0, Math.PI * 2);
        ctx.fillStyle = this.ballType === 'eight' ? '#ffffff' : '#fafafa';
        ctx.fill();

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(textAngle);
        ctx.fillStyle = this.ballType === 'eight' ? '#111' : '#222';
        ctx.font = `bold ${r * 1.05 * center.depth}px Arial, sans-serif`;
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

    drawMeridians(ctx) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.09)';
        ctx.lineWidth = 0.75;

        for (let i = 0; i < 2; i++) {
            const angle = i * Math.PI * 0.5;
            const points = [];
            for (let j = 0; j <= 24; j++) {
                const t = (j / 24) * Math.PI * 2;
                const point = this.projectSurfacePoint(
                    Math.cos(t) * Math.cos(angle),
                    Math.sin(t),
                    Math.cos(t) * Math.sin(angle)
                );
                if (point) points.push(point);
            }
            this.drawSurfacePath(ctx, points);
        }
    }

    draw(ctx) {
        if (this.inPocket) return;

        const r = this.radius;
        const fall = this.pocketFall;
        const scale = fall ? fall.scale : 1;
        const alpha = fall ? fall.alpha : 1;
        const squash = fall ? 1 - (1 - scale) * 0.3 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (fall) {
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale * squash);
            ctx.translate(-this.x, -this.y);
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + 1.5, this.y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        ctx.restore();

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
            if (this.ballType !== 'stripe') {
                this.drawMeridians(ctx);
            }
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(this.x - r * 0.32, this.y - r * 0.32, r * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();

        ctx.restore();
    }

    isMoving() {
        if (this.inPocket) return false;
        if (this.isPocketing()) return true;
        if (Math.hypot(this.vx, this.vy) > SLEEP_SPEED) return true;
        if (Math.max(Math.abs(this.spin || 0), Math.abs(this.topSpin || 0)) > SLEEP_SPIN) return true;
        if ((this.slide || 0) > SLIDE_THRESHOLD) return true;
        return false;
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
