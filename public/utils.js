import {
    POCKET_CAPTURE,
    POCKET_MAGNET,
    BALL_RADIUS,
    CORNER_JAW_ALONG,
    SIDE_NOTCH_HALF
} from './constants.js';
import {
    getPlayArea,
    getPockets,
    getPocket,
    getRailSegments,
    getStraightSegments,
    getTableSurface,
    pocketAffectsWall,
    traceCornerNotch,
    traceSideNotch,
    tracePocketNotch,
    traceFeltPocketCut,
    tracePlaySurface,
    getCushionFacing,
    getCornerCushionFacings,
    getCushionCollisionSegments
} from './table_geometry.js';
import { getTableMarkings } from './table_graphics.js';

export {
    getPlayArea,
    getPockets,
    getPocket,
    getRailSegments,
    getStraightSegments,
    getTableSurface,
    pocketAffectsWall,
    traceCornerNotch,
    traceSideNotch,
    tracePocketNotch,
    traceFeltPocketCut,
    tracePlaySurface,
    getCushionFacing,
    getCornerCushionFacings,
    getCushionCollisionSegments
};

export function pocketDistance(x, y, pocket) {
    return Math.hypot(x - pocket.x, y - pocket.y);
}

export function pocketHoleDistance(x, y, pocket) {
    return Math.hypot(x - pocket.drawX, y - pocket.drawY);
}

export function isInPocketThroat(x, y, pocket) {
    const { anchorX: ax, anchorY: ay, wall, kind } = pocket;
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;
    const r = BALL_RADIUS;

    if (kind === 'corner') {
        if (wall === 'tl') return x < ax + J + r && y < ay + J + r;
        if (wall === 'tr') return x > ax - J - r && y < ay + J + r;
        if (wall === 'bl') return x < ax + J + r && y > ay - J - r;
        if (wall === 'br') return x > ax - J - r && y > ay - J - r;
    } else {
        if (wall === 'top') return Math.abs(x - ax) < h + r && y < ay + J * 0.42;
        if (wall === 'bottom') return Math.abs(x - ax) < h + r && y > ay - J * 0.42;
    }
    return false;
}

export function isInPocketZone(x, y, extra = 0) {
    return getPockets().some(p =>
        isInPocketThroat(x, y, p) && pocketHoleDistance(x, y, p) < POCKET_CAPTURE + BALL_RADIUS + extra
    );
}

export function isNearPocket(x, y, extra = 0) {
    return isInPocketZone(x, y, extra);
}

export function nearPocketOnWall(x, y, wall) {
    return getPockets().some(p => pocketAffectsWall(p, wall) && isInPocketThroat(x, y, p));
}

export function tryPocketBall(ball, onCueRespotted) {
    if (ball.inPocket) return true;

    for (const pocket of getPockets()) {
        if (!isInPocketThroat(ball.x, ball.y, pocket)) continue;

        const dist = pocketHoleDistance(ball.x, ball.y, pocket);
        const cx = pocket.drawX;
        const cy = pocket.drawY;

        if (dist < POCKET_CAPTURE + BALL_RADIUS * 1.8 && dist > 0.5) {
            const speed = Math.hypot(ball.vx, ball.vy);
            const pull = POCKET_MAGNET * (1.2 + speed * 0.06);
            ball.vx += ((cx - ball.x) / dist) * pull;
            ball.vy += ((cy - ball.y) / dist) * pull;
        }

        if (dist < POCKET_CAPTURE) {
            ball.inPocket = true;
            ball.vx = 0;
            ball.vy = 0;
            if (ball.isCueBall && onCueRespotted) {
                setTimeout(onCueRespotted, 600);
            }
            return true;
        }
    }

    return false;
}

export function getHeadSpot() {
    return getTableMarkings().headSpot;
}

export function getFootSpot() {
    return getTableMarkings().footSpot;
}

export function lighten(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + amount);
    const g = Math.min(255, ((n >> 8) & 255) + amount);
    const b = Math.min(255, (n & 255) + amount);
    return `rgb(${r},${g},${b})`;
}

export function darken(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 255) - amount);
    const g = Math.max(0, ((n >> 8) & 255) - amount);
    const b = Math.max(0, (n & 255) - amount);
    return `rgb(${r},${g},${b})`;
}
