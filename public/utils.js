import { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, POCKET_RADIUS, POCKET_MAGNET_RADIUS, POCKET_INSET, MID_POCKET_INSET, POCKET_MAGNET } from './constants.js';

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

export function getPockets() {
    const play = getPlayArea();
    const mx = play.left + play.width / 2;
    const inset = POCKET_INSET;
    return [
        { id: 'tl', x: play.left + inset, y: play.top + inset, wall: 'left' },
        { id: 'tm', x: mx, y: play.top + MID_POCKET_INSET, wall: 'top' },
        { id: 'tr', x: play.right - inset, y: play.top + inset, wall: 'right' },
        { id: 'bl', x: play.left + inset, y: play.bottom - inset, wall: 'left' },
        { id: 'bm', x: mx, y: play.bottom - MID_POCKET_INSET, wall: 'bottom' },
        { id: 'br', x: play.right - inset, y: play.bottom - inset, wall: 'right' }
    ];
}

function pocketAffectsWall(pocket, wall) {
    if (wall === 'left') return pocket.id === 'tl' || pocket.id === 'bl';
    if (wall === 'right') return pocket.id === 'tr' || pocket.id === 'br';
    if (wall === 'top') return pocket.id === 'tl' || pocket.id === 'tm' || pocket.id === 'tr';
    if (wall === 'bottom') return pocket.id === 'bl' || pocket.id === 'bm' || pocket.id === 'br';
    return false;
}

export function nearPocketOnWall(x, y, wall) {
    const gap = POCKET_RADIUS + BALL_RADIUS;
    return getPockets().some(p => {
        if (!pocketAffectsWall(p, wall)) return false;
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

        if (dist < POCKET_MAGNET_RADIUS && dist > 0.5) {
            const speed = Math.hypot(ball.vx, ball.vy);
            ball.vx += (dx / dist) * POCKET_MAGNET * (1 + speed * 0.05);
            ball.vy += (dy / dist) * POCKET_MAGNET * (1 + speed * 0.05);
        }

        if (dist < POCKET_RADIUS) {
            ball.inPocket = true;
            ball.vx = 0;
            ball.vy = 0;
            return true;
        }
    }
    return false;
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
