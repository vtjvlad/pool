import {
    BALL_RESTITUTION,
    BALL_FRICTION,
    ROLLING_FRICTION,
    LOW_SPEED_FRICTION,
    LOW_SPEED_THRESHOLD,
    MIN_SPEED,
    PHYSICS_SUBSTEPS,
    COLLISION_PASSES
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { tryPocketBall } from './utils.js';

export function applyRollingFriction(ball, frameFraction) {
    if (ball.inPocket) return;

    const speed = Math.hypot(ball.vx, ball.vy);
    const friction = speed < LOW_SPEED_THRESHOLD ? LOW_SPEED_FRICTION : ROLLING_FRICTION;
    const factor = Math.pow(friction, frameFraction);

    ball.vx *= factor;
    ball.vy *= factor;

    const newSpeed = Math.hypot(ball.vx, ball.vy);
    if (newSpeed > 0 && newSpeed < MIN_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
    }
}

export function resolveCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;
    if (dist >= minDist || dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;

    const v1n = b1.vx * nx + b1.vy * ny;
    const v2n = b2.vx * nx + b2.vy * ny;
    const approach1 = Math.max(0, -v1n);
    const approach2 = Math.max(0, v2n);
    const approachSum = approach1 + approach2 + 0.001;
    const share1 = approach1 / approachSum;
    const share2 = approach2 / approachSum;

    b1.x -= nx * overlap * share1;
    b1.y -= ny * overlap * share1;
    b2.x += nx * overlap * share2;
    b2.y += ny * overlap * share2;

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
    const velT = rvx * tx + rvy * ty;
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
