import {
    BALL_RESTITUTION,
    BALL_FRICTION,
    ROLLING_FRICTION,
    LOW_SPEED_FRICTION,
    LOW_SPEED_THRESHOLD,
    MIN_SPEED,
    PHYSICS_SUBSTEPS,
    COLLISION_PASSES,
    SPIN_DECAY,
    TOP_SPIN_ROLLING_ASSIST,
    TOP_SPIN_ROLLING_DRAG
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { tryPocketBall } from './utils.js';

function setSpeed(ball, speed, directionX, directionY) {
    ball.vx = directionX * speed;
    ball.vy = directionY * speed;
}

export function applyRollingFriction(ball, frameFraction) {
    if (ball.inPocket) return;

    const speed = Math.hypot(ball.vx, ball.vy);
    const spinFactor = Math.pow(SPIN_DECAY, frameFraction);

    ball.spin *= spinFactor;
    ball.topSpin *= spinFactor;

    if (speed <= 0) return;

    const dirX = ball.vx / speed;
    const dirY = ball.vy / speed;
    const friction = speed < LOW_SPEED_THRESHOLD ? LOW_SPEED_FRICTION : ROLLING_FRICTION;
    let factor = Math.pow(friction, frameFraction);

    if (ball.topSpin > 0) {
        factor += ball.topSpin * TOP_SPIN_ROLLING_ASSIST * frameFraction;
    } else if (ball.topSpin < 0) {
        factor *= Math.max(0, 1 + ball.topSpin * TOP_SPIN_ROLLING_DRAG * frameFraction);
    }

    const nextSpeed = speed * Math.min(factor, 0.999);
    if (nextSpeed < MIN_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.topSpin = 0;
        return;
    }

    setSpeed(ball, nextSpeed, dirX, dirY);
}

export function resolveCollision(b1, b2) {
    let dx = b2.x - b1.x;
    let dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;
    if (dist >= minDist) return;

    let normalDist = dist;
    if (dist === 0) {
        dx = b2.px - b1.px;
        dy = b2.py - b1.py;
        normalDist = Math.hypot(dx, dy);
        if (normalDist === 0) {
            dx = 1;
            dy = 0;
            normalDist = 1;
        }
    }

    const nx = dx / normalDist;
    const ny = dy / normalDist;
    const overlap = minDist - dist;

    b1.x -= nx * overlap * 0.5;
    b1.y -= ny * overlap * 0.5;
    b2.x += nx * overlap * 0.5;
    b2.y += ny * overlap * 0.5;

    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN >= 0) return;

    const impulse = -(1 + BALL_RESTITUTION) * velN * 0.5;
    b1.vx -= impulse * nx;
    b1.vy -= impulse * ny;
    b2.vx += impulse * nx;
    b2.vy += impulse * ny;

    const tx = -ny;
    const ty = nx;
    const postRvx = b2.vx - b1.vx;
    const postRvy = b2.vy - b1.vy;
    const velT = postRvx * tx + postRvy * ty;
    const frictionImpulse = velT * BALL_FRICTION;
    b1.vx += frictionImpulse * tx * 0.5;
    b1.vy += frictionImpulse * ty * 0.5;
    b2.vx -= frictionImpulse * tx * 0.5;
    b2.vy -= frictionImpulse * ty * 0.5;
}

export function resolveAllBallCollisions(balls) {
    for (let pass = 0; pass < COLLISION_PASSES; pass++) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const a = balls[i];
                const b = balls[j];
                if (a.inPocket || b.inPocket || a.isPocketing() || b.isPocketing()) continue;
                resolveCollision(a, b);
            }
        }
    }
}

export function updatePocketAnimations(balls) {
    for (const ball of balls) {
        ball.updatePocketFall(balls);
    }
}

export function stepPhysics(balls) {
    const subDt = 1 / PHYSICS_SUBSTEPS;

    for (let step = 0; step < PHYSICS_SUBSTEPS; step++) {
        for (const ball of balls) {
            if (ball.inPocket || ball.isPocketing()) continue;
            ball.px = ball.x;
            ball.py = ball.y;
            ball.x += ball.vx * subDt;
            ball.y += ball.vy * subDt;
            ball.advanceRoll(subDt);
        }

        resolveAllBallCollisions(balls);

        for (const ball of balls) {
            if (!ball.inPocket && !ball.isPocketing()) {
                resolveBallCushionCollision(ball, ball.px, ball.py);
            }
        }

        resolveAllBallCollisions(balls);

        for (const ball of balls) {
            if (ball.inPocket || ball.isPocketing()) continue;
            applyRollingFriction(ball, subDt);
            tryPocketBall(ball);
        }
    }
}
