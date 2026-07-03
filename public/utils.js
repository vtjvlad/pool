import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    RAIL_WIDTH, 
    POCKET_RECESS, 
    SIDE_NOTCH_HALF, 
    CORNER_JAW_ALONG, 
    POCKET_CAPTURE, 
    BALL_RADIUS 
} from './constants.js';

export function getPlayArea() {
    return {
        left: RAIL_WIDTH,
        top: RAIL_WIDTH,
        right: CANVAS_WIDTH - RAIL_WIDTH,
        bottom: CANVAS_HEIGHT - RAIL_WIDTH,
        width: CANVAS_WIDTH - RAIL_WIDTH * 2,
        height: CANVAS_HEIGHT - RAIL_WIDTH * 2
    };
}

export function getPockets() {
    const play = getPlayArea();
    const mx = play.left + play.width / 2;
    const d = POCKET_RECESS;

    return [
        { kind: 'corner', wall: 'tl', anchorX: play.left, anchorY: play.top, x: play.left - d * 0.62, y: play.top - d * 0.62 },
        { kind: 'side', wall: 'top', anchorX: mx, anchorY: play.top, x: mx, y: play.top - d },
        { kind: 'corner', wall: 'tr', anchorX: play.right, anchorY: play.top, x: play.right + d * 0.62, y: play.top - d * 0.62 },
        { kind: 'corner', wall: 'bl', anchorX: play.left, anchorY: play.bottom, x: play.left - d * 0.62, y: play.bottom + d * 0.62 },
        { kind: 'side', wall: 'bottom', anchorX: mx, anchorY: play.bottom, x: mx, y: play.bottom + d },
        { kind: 'corner', wall: 'br', anchorX: play.right, anchorY: play.bottom, x: play.right + d * 0.62, y: play.bottom + d * 0.62 }
    ];
}

export function traceCornerNotch(path, pocket) {
    const J = CORNER_JAW_ALONG;
    const d = POCKET_RECESS;
    const bend = 11;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    if (wall === 'tl') {
        path.moveTo(ax + J, ay);
        path.lineTo(ax + bend, ay + bend);
        path.lineTo(ax, ay + J);
        path.lineTo(ax - d, ay - d);
        path.closePath();
    } else if (wall === 'tr') {
        path.moveTo(ax - J, ay);
        path.lineTo(ax - bend, ay + bend);
        path.lineTo(ax, ay + J);
        path.lineTo(ax + d, ay - d);
        path.closePath();
    } else if (wall === 'bl') {
        path.moveTo(ax + J, ay);
        path.lineTo(ax + bend, ay - bend);
        path.lineTo(ax, ay - J);
        path.lineTo(ax - d, ay + d);
        path.closePath();
    } else if (wall === 'br') {
        path.moveTo(ax - J, ay);
        path.lineTo(ax - bend, ay - bend);
        path.lineTo(ax, ay - J);
        path.lineTo(ax + d, ay + d);
        path.closePath();
    }
}

export function traceSideNotch(path, pocket) {
    const h = SIDE_NOTCH_HALF;
    const d = POCKET_RECESS;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    if (wall === 'top') {
        path.moveTo(ax - h, ay);
        path.lineTo(ax - h * 0.55, ay - d * 0.45);
        path.lineTo(ax, ay - d);
        path.lineTo(ax + h * 0.55, ay - d * 0.45);
        path.lineTo(ax + h, ay);
        path.closePath();
    } else if (wall === 'bottom') {
        path.moveTo(ax - h, ay);
        path.lineTo(ax - h * 0.55, ay + d * 0.45);
        path.lineTo(ax, ay + d);
        path.lineTo(ax + h * 0.55, ay + d * 0.45);
        path.lineTo(ax + h, ay);
        path.closePath();
    }
}

export function pocketDistance(x, y, pocket) {
    return Math.hypot(x - pocket.x, y - pocket.y);
}

export function isInPocketZone(x, y, extra = 0) {
    return getPockets().some(p => pocketDistance(x, y, p) < POCKET_CAPTURE + extra);
}

export function isNearPocket(x, y, extra = 0) {
    return isInPocketZone(x, y, extra);
}

export function nearPocketOnWall(x, y, wall) {
    const zone = POCKET_CAPTURE + BALL_RADIUS;
    return getPockets().some(p => {
        if (wall === 'left' && (p.wall === 'tl' || p.wall === 'bl')) {
            return pocketDistance(x, y, p) < zone;
        }
        if (wall === 'right' && (p.wall === 'tr' || p.wall === 'br')) {
            return pocketDistance(x, y, p) < zone;
        }
        if (wall === 'top' && (p.wall === 'tl' || p.wall === 'tr' || p.wall === 'top')) {
            return pocketDistance(x, y, p) < zone;
        }
        if (wall === 'bottom' && (p.wall === 'bl' || p.wall === 'br' || p.wall === 'bottom')) {
            return pocketDistance(x, y, p) < zone;
        }
        return false;
    });
}

export function getHeadSpot() {
    const play = getPlayArea();
    return { x: play.left + play.width * 0.25, y: play.top + play.height / 2 };
}

export function getFootSpot() {
    const play = getPlayArea();
    return { x: play.left + play.width * 0.75, y: play.top + play.height / 2 };
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
