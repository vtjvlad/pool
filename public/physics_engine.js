import { 
    BALL_RESTITUTION 
} from './constants.js';

export function resolveCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= b1.radius + b2.radius || dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = b1.radius + b2.radius - dist;
    b1.x -= nx * overlap / 2;
    b1.y -= ny * overlap / 2;
    b2.x += nx * overlap / 2;
    b2.y += ny * overlap / 2;

    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN > 0) return;

    const impulse = -(1 + BALL_RESTITUTION) * velN / 2;
    b1.vx -= impulse * nx;
    b1.vy -= impulse * ny;
    b2.vx += impulse * nx;
    b2.vy += impulse * ny;
}
