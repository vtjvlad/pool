import {
    BALL_RESTITUTION,
    ROLLING_FRICTION,
    MIN_SPEED,
    PHYSICS_SUBSTEPS
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { tryPocketBall } from './utils.js';

export function applyRollingFriction(ball, frameFraction) {
    if (ball.inPocket) return;

    const factor = Math.pow(ROLLING_FRICTION, frameFraction);
    ball.vx *= factor;
    ball.vy *= factor;

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0 && speed < MIN_SPEED) {
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
}

export function resolveAllBallCollisions(balls) {
    for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                if (!balls[i].inPocket && !balls[j].inPocket) {
                    resolveCollision(balls[i], balls[j]);
                }
            }
        }
    }
}

export function stepPhysics(balls) {
    const subDt = 1 / PHYSICS_SUBSTEPS;

    for (let step = 0; step < PHYSICS_SUBSTEPS; step++) {
        for (const ball of balls) {
            if (ball.inPocket) continue;
            ball.x += ball.vx * subDt;
            ball.y += ball.vy * subDt;
            ball.advanceRoll(subDt);
        }

        resolveAllBallCollisions(balls);

        for (const ball of balls) {
            if (!ball.inPocket) {
                resolveBallCushionCollision(ball);
            }
        }

        resolveAllBallCollisions(balls);

        for (const ball of balls) {
            applyRollingFriction(ball, subDt);
            if (ball.inPocket) continue;
            if (tryPocketBall(ball) && ball.isCueBall) {
                setTimeout(() => ball.respotCueBall(balls), 600);
            }
        }
    }
}
