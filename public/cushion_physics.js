import { CUSHION_RESTITUTION } from './constants.js';
import { getCushionCollisionSegments, getPockets } from './table_geometry.js';
import { isInPocketThroat } from './utils.js';

let cachedSegments = null;

function getSegments() {
    if (!cachedSegments) cachedSegments = getCushionCollisionSegments();
    return cachedSegments;
}

function segmentBlocksBall(ball, seg) {
    if (!seg.pocketId) return true;
    const pocket = getPockets().find(p => p.id === seg.pocketId);
    return !pocket || !isInPocketThroat(ball.x, ball.y, pocket);
}

function segmentBlocksPoint(x, y, seg) {
    if (!seg.pocketId) return true;
    const pocket = getPockets().find(p => p.id === seg.pocketId);
    return !pocket || !isInPocketThroat(x, y, pocket);
}

function resolveBallSegment(ball, seg, restitution) {
    const { x1, y1, x2, y2, nx, ny } = seg;
    const r = ball.radius;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-8) return false;

    const t = Math.max(0, Math.min(1, ((ball.x - x1) * dx + (ball.y - y1) * dy) / len2));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const sep = (ball.x - cx) * nx + (ball.y - cy) * ny;

    if (sep >= r) return false;

    const pen = r - sep;
    ball.x += nx * pen;
    ball.y += ny * pen;

    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
        ball.vx -= (1 + restitution) * vn * nx;
        ball.vy -= (1 + restitution) * vn * ny;
    }
    return true;
}

/** Отскок шара от всех сегментов подушек */
export function resolveBallCushions(ball) {
    let hit = false;
    for (let iter = 0; iter < 4; iter++) {
        for (const seg of getSegments()) {
            if (!segmentBlocksBall(ball, seg)) continue;
            if (resolveBallSegment(ball, seg, CUSHION_RESTITUTION)) hit = true;
        }
    }
    return hit;
}

function raySegmentHit(ox, oy, dx, dy, radius, seg) {
    const { x1, y1, x2, y2, nx, ny } = seg;
    const lx = x2 - x1;
    const ly = y2 - y1;
    const len2 = lx * lx + ly * ly;
    if (len2 < 1e-8) return null;

    const vn = dx * nx + dy * ny;
    if (Math.abs(vn) < 1e-8) return null;

    const tLine0 = Math.max(0, Math.min(1, ((ox - x1) * lx + (oy - y1) * ly) / len2));
    const px = x1 + tLine0 * lx;
    const py = y1 + tLine0 * ly;

    const t = ((px - ox) * nx + (py - oy) * ny - radius) / vn;
    if (t <= 0.001) return null;

    const hx = ox + dx * t;
    const hy = oy + dy * t;
    if (!segmentBlocksPoint(hx, hy, seg)) return null;

    const tHit = Math.max(0, Math.min(1, ((hx - x1) * lx + (hy - y1) * ly) / len2));
    const qx = x1 + tHit * lx;
    const qy = y1 + tHit * ly;
    const sep = (hx - qx) * nx + (hy - qy) * ny;
    if (sep < radius * 0.85) return null;

    return { t, nx, ny };
}

/** Raycast по подушкам для линии прицела */
export function rayCushionHit(ox, oy, dx, dy, radius) {
    let best = null;

    for (const seg of getSegments()) {
        const hit = raySegmentHit(ox, oy, dx, dy, radius, seg);
        if (hit && (!best || hit.t < best.t)) best = hit;
    }

    return best;
}

export function invalidateCushionCache() {
    cachedSegments = null;
}
