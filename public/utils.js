import { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, POCKET_INSET, MID_POCKET_INSET, POCKET_CENTER_SHIFT, CORNER_POCKET_CENTER_SHIFT, CORNER_POCKET_RADIUS, CENTRAL_POCKET_RADIUS, POCKET_MAGNET, PLAY_SURFACE_INSET } from './constants.js';

const CENTRAL_POCKET_IDS = new Set(['tm', 'bm']);

function pocketRadius(id) {
    return CENTRAL_POCKET_IDS.has(id) ? CENTRAL_POCKET_RADIUS : CORNER_POCKET_RADIUS;
}

export function getPlayArea() {
    return {
        left: 0,
        top: 0,
        right: CANVAS_WIDTH,
        bottom: CANVAS_HEIGHT,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    };
}

export function getPlaySurface() {
    return {
        left: PLAY_SURFACE_INSET,
        top: PLAY_SURFACE_INSET,
        right: CANVAS_WIDTH - PLAY_SURFACE_INSET,
        bottom: CANVAS_HEIGHT - PLAY_SURFACE_INSET,
        width: CANVAS_WIDTH - PLAY_SURFACE_INSET * 2,
        height: CANVAS_HEIGHT - PLAY_SURFACE_INSET * 2
    };
}

function buildPockets(cornerShift = 0) {
    const play = getPlayArea();
    const mx = play.left + play.width / 2;
    const cornerInset = POCKET_INSET + POCKET_CENTER_SHIFT + cornerShift;
    const midInset = MID_POCKET_INSET + POCKET_CENTER_SHIFT;
    return [
        { id: 'tl', x: play.left + cornerInset, y: play.top + cornerInset, wall: 'left', radius: pocketRadius('tl') },
        { id: 'tm', x: mx, y: play.top + midInset, wall: 'top', radius: pocketRadius('tm') },
        { id: 'tr', x: play.right - cornerInset, y: play.top + cornerInset, wall: 'right', radius: pocketRadius('tr') },
        { id: 'bl', x: play.left + cornerInset, y: play.bottom - cornerInset, wall: 'left', radius: pocketRadius('bl') },
        { id: 'bm', x: mx, y: play.bottom - midInset, wall: 'bottom', radius: pocketRadius('bm') },
        { id: 'br', x: play.right - cornerInset, y: play.bottom - cornerInset, wall: 'right', radius: pocketRadius('br') }
    ];
}

/** Позиции луз для геометрии бортов — без сдвига угловых луз к центру. */
export function getLayoutPockets() {
    return buildPockets(0);
}

export function getPockets() {
    return buildPockets(CORNER_POCKET_CENTER_SHIFT);
}

function pocketAffectsWall(pocket, wall) {
    if (wall === 'left') return pocket.id === 'tl' || pocket.id === 'bl';
    if (wall === 'right') return pocket.id === 'tr' || pocket.id === 'br';
    if (wall === 'top') return pocket.id === 'tl' || pocket.id === 'tm' || pocket.id === 'tr';
    if (wall === 'bottom') return pocket.id === 'bl' || pocket.id === 'bm' || pocket.id === 'br';
    return false;
}

export function nearPocketOnWall(x, y, wall) {
    return getPockets().some(p => {
        if (!pocketAffectsWall(p, wall)) return false;
        const gap = p.radius + BALL_RADIUS;
        if (wall === 'left' || wall === 'right') return Math.abs(y - p.y) < gap;
        return Math.abs(x - p.x) < gap;
    });
}

export function tryPocketBall(ball) {
    if (ball.inPocket) return true;

    for (const pocket of getPockets()) {
        const dx = pocket.x - ball.x;
        const dy = pocket.y - ball.y;
        const dist = Math.hypot(dx, dy);
        if (dist < pocket.radius && dist > 0.5) {
            const speed = Math.hypot(ball.vx, ball.vy);
            ball.vx += (dx / dist) * POCKET_MAGNET * (1 + speed * 0.05);
            ball.vy += (dy / dist) * POCKET_MAGNET * (1 + speed * 0.05);
        }

        if (dist < pocket.radius) {
            ball.inPocket = true;
            ball.vx = 0;
            ball.vy = 0;
            return true;
        }
    }
    return false;
}

export function getHeadSpot() {
    const surface = getPlaySurface();
    return { x: surface.left + surface.width * 0.25, y: surface.top + surface.height / 2 };
}

export function getFootSpot() {
    const surface = getPlaySurface();
    return { x: surface.left + surface.width * 0.75, y: surface.top + surface.height / 2 };
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
