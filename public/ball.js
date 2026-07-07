import {
    BALL_RADIUS,
    SLEEP_SPEED,
    POCKET_FALL_MS,
    CUE_RESPOT_DELAY_MS
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
        sphereCanvasCache.set(size, canvas);
    }
    return sphereCanvasCache.get(size);
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

function dist3d(ax, ay, az, bx, by, bz) {
    const dx = ax - bx;
    const dy = ay - by;
    const dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function applyLighting(r, g, b, nx, ny, nz) {
    const lx = LIGHT_DIR.x / LIGHT_LEN;
    const ly = LIGHT_DIR.y / LIGHT_LEN;
    const lz = LIGHT_DIR.z / LIGHT_LEN;
    const diffuse = Math.max(0, nx * lx + ny * ly + nz * lz);

    const hx = HALF_VEC.x / HALF_LEN;
    const hy = HALF_VEC.y / HALF_LEN;
    const hz = HALF_VEC.z / HALF_LEN;
    const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 24);

    const shade = 0.35 + 0.65 * diffuse;
    const sr = Math.min(255, r * shade + spec * 115);
    const sg = Math.min(255, g * shade + spec * 115);
    const sb = Math.min(255, b * shade + spec * 115);
    return [sr | 0, sg | 0, sb | 0];
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

    projectSurfacePoint(lx, ly, lz) {
        const [px, py, pz] = rotateVec(this.orientation, lx, ly, lz);
        if (pz < 0.1) return null;

        return {
            x: this.x + px * this.radius,
            y: this.y + py * this.radius,
            depth: pz
        };
    }

    getBaseColor(lx, ly, lz) {
        const numDist = dist3d(lx, ly, lz, NUMBER_CENTER.x, NUMBER_CENTER.y, NUMBER_CENTER.z);
        if (numDist < NUMBER_RADIUS) {
            return this.ballType === 'eight' ? [255, 255, 255] : [250, 250, 248];
        }

        if (this.ballType === 'eight') {
            return [26, 26, 26];
        }

        if (this.ballType === 'stripe') {
            const white = [252, 252, 250];
            const color = hexToRgb(this.color);
            const inStripe = Math.abs(ly) <= STRIPE_SIN;
            let rgb = inStripe ? color : white;

            const edgeDist = Math.abs(Math.abs(ly) - STRIPE_SIN);
            if (edgeDist < STRIPE_EDGE) {
                const edge = (1 - edgeDist / STRIPE_EDGE) * 0.3;
                rgb = rgb.map(c => c * (1 - edge));
            }
            return rgb;
        }

        return hexToRgb(this.color);
    }

    drawSphereSurface(ctx, r) {
        const d = Math.ceil(r * 3);
        const offscreen = getSphereCanvas(d);
        const offCtx = offscreen.getContext('2d');
        const image = offCtx.createImageData(d, d);
        const pixels = image.data;
        const center = d / 2;
        const pixelR = d / 2;
        const invQ = quatConjugate(this.orientation);

        for (let y = 0; y < d; y++) {
            for (let x = 0; x < d; x++) {
                const idx = (y * d + x) * 4;
                const dx = x - center + 0.5;
                const dy = y - center + 0.5;
                const distSq = dx * dx + dy * dy;
                if (distSq > pixelR * pixelR) {
                    pixels[idx + 3] = 0;
                    continue;
                }

                const nx = dx / pixelR;
                const ny = dy / pixelR;
                const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
                const [lx, ly, lz] = rotateVec(invQ, nx, ny, nz);

                let rgb;
                if (this.isCueBall) {
                    const markDist = dist3d(lx, ly, lz, CUE_MARK_CENTER.x, CUE_MARK_CENTER.y, CUE_MARK_CENTER.z);
                    if (markDist < CUE_MARK_RADIUS) {
                        rgb = [196, 30, 58];
                    } else {
                        rgb = [255, 255, 252];
                    }
                } else {
                    rgb = this.getBaseColor(lx, ly, lz);
                }

                const lit = applyLighting(rgb[0], rgb[1], rgb[2], nx, ny, nz);
                pixels[idx] = lit[0];
                pixels[idx + 1] = lit[1];
                pixels[idx + 2] = lit[2];
                pixels[idx + 3] = 255;
            }
        }

        offCtx.putImageData(image, 0, 0);
        ctx.drawImage(offscreen, this.x - r, this.y - r, r * 2, r * 2);
    }

    drawNumberText(ctx, r) {
        const center = this.projectSurfacePoint(NUMBER_CENTER.x, NUMBER_CENTER.y, NUMBER_CENTER.z);
        if (!center || center.depth < 0.25) return;

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
        ctx.scale(1, center.depth);
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

        this.drawSphereSurface(ctx, r);

        if (this.isCueBall) {
            this.drawCueMarks(ctx, r);
        } else {
            this.drawNumberPatch(ctx, r);
            if (this.ballType !== 'stripe') {
                this.drawMeridians(ctx);
            }
        }

        ctx.restore();
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
