import {
    BALL_RADIUS,
    MIN_SPEED
} from './constants.js';
import { getHeadSpot, lighten, darken } from './utils.js';

const IDENTITY_QUAT = { w: 1, x: 0, y: 0, z: 0 };
const stripeCanvasCache = new Map();

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

function clamp01(v) {
    return Math.max(0, Math.min(1, v));
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

function shadeStripePixel(lx, ly, lz, baseRgb) {
    const light = 0.56 + 0.44 * clamp01(lz * 0.52 - lx * 0.36 - ly * 0.34);
    return [
        Math.min(255, baseRgb[0] * light),
        Math.min(255, baseRgb[1] * light),
        Math.min(255, baseRgb[2] * light)
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
        this.orientation = { ...IDENTITY_QUAT };
    }

    advanceRoll(frameFraction) {
        if (this.inPocket) return;

        const vx = this.vx;
        const vy = this.vy;
        const speed = Math.hypot(vx, vy);
        if (speed < 1e-8) return;

        const angle = (speed * frameFraction) / this.radius;
        const half = angle * 0.5;
        const s = Math.sin(half);
        const c = Math.cos(half);
        const axisX = -vy / speed;
        const axisY = vx / speed;
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
                const base = inStripe ? color : white;
                let rgb = shadeStripePixel(lx, ly, lz, base);

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
        const spotR = r * 0.56 * center.depth;

        ctx.beginPath();
        ctx.arc(center.x, center.y, spotR, 0, Math.PI * 2);
        ctx.fillStyle = this.ballType === 'eight' ? '#ffffff' : '#fafafa';
        ctx.fill();

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(textAngle);
        ctx.fillStyle = this.ballType === 'eight' ? '#111' : '#222';
        ctx.font = `bold ${r * 0.94 * center.depth}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(this.number), 0, 0.5);
        ctx.restore();
    }

    drawCueMark(ctx, r) {
        const mark = this.projectSurfacePoint(0.5, 0, 0.86);
        if (!mark) return;

        ctx.fillStyle = '#c41e3a';
        ctx.beginPath();
        ctx.arc(mark.x, mark.y, r * 0.11 * mark.depth, 0, Math.PI * 2);
        ctx.fill();
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

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + 1.5, this.y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        ctx.restore();

        const grad = ctx.createRadialGradient(
            this.x - r * 0.35, this.y - r * 0.35, r * 0.1,
            this.x, this.y, r
        );

        if (this.isCueBall) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, '#f0f0f0');
            grad.addColorStop(1, '#d0d0d0');
        } else if (this.ballType === 'eight') {
            grad.addColorStop(0, '#444');
            grad.addColorStop(0.5, '#1a1a1a');
            grad.addColorStop(1, '#000');
        } else if (this.ballType === 'stripe') {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, '#f8f8f8');
            grad.addColorStop(1, '#e8e8e8');
        } else {
            grad.addColorStop(0, lighten(this.color, 40));
            grad.addColorStop(0.55, this.color);
            grad.addColorStop(1, darken(this.color, 30));
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.clip();

        if (this.ballType === 'stripe' && !this.isCueBall) {
            this.drawStripeSphere(ctx, r);
        }

        if (this.isCueBall) {
            this.drawCueMark(ctx, r);
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
    }

    isMoving() {
        return !this.inPocket && Math.hypot(this.vx, this.vy) > MIN_SPEED;
    }

    respotCueBall(balls) {
        const spot = getHeadSpot();
        this.x = spot.x;
        this.y = spot.y;
        this.vx = 0;
        this.vy = 0;
        this.inPocket = false;
        this.orientation = { ...IDENTITY_QUAT };

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
