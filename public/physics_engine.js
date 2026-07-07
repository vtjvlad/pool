import {
    BALL_RESTITUTION,
    BALL_RESTITUTION_SLOW,
    BALL_FRICTION,
    CLOTH_ROLL_DECEL,
    CLOTH_ROLL_SPEED_SCALE,
    LOW_SPEED_THRESHOLD,
    SLEEP_SPEED,
    SLEEP_FRAMES,
    PHYSICS_SUBSTEPS,
    COLLISION_PASSES
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { jitterCollisionNormal } from './collision_noise.js';
import { tryPocketBall } from './utils.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function stopBall(ball) {
    ball.vx = 0;
    ball.vy = 0;
}

function wakeBall(ball) {
    ball.sleepFrames = 0;
}

function updateSleepState(ball) {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed < SLEEP_SPEED) {
        ball.sleepFrames = (ball.sleepFrames || 0) + 1;
        if (ball.sleepFrames >= SLEEP_FRAMES) stopBall(ball);
    } else {
        wakeBall(ball);
    }
}

function rollingLoss(speed, dt) {
    const speedRatio = clamp(speed / LOW_SPEED_THRESHOLD, 0, 1);
    const base = CLOTH_ROLL_DECEL + speed * CLOTH_ROLL_SPEED_SCALE;
    return base * dt * (0.62 + 0.38 * speedRatio);
}

export function applyMotionForces(ball, dt) {
    if (ball.inPocket || ball.isPocketing()) return;

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= SLEEP_SPEED) {
        updateSleepState(ball);
        return;
    }

    ball.lastDirX = ball.vx / speed;
    ball.lastDirY = ball.vy / speed;

    const nextSpeed = Math.max(0, speed - rollingLoss(speed, dt));
    if (nextSpeed <= SLEEP_SPEED) {
        stopBall(ball);
    } else {
        ball.vx = ball.lastDirX * nextSpeed;
        ball.vy = ball.lastDirY * nextSpeed;
    }

    updateSleepState(ball);
}

function collisionNormal(b1, b2) {
    let dx = b2.x - b1.x;
    let dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) return { nx: dx / dist, ny: dy / dist, dist };

    dx = b2.px - b1.px;
    dy = b2.py - b1.py;
    const prevDist = Math.hypot(dx, dy);
    if (prevDist > 0) return { nx: dx / prevDist, ny: dy / prevDist, dist: 0 };

    return { nx: 1, ny: 0, dist: 0 };
}

function separateBalls(b1, b2, nx, ny, dist) {
    const minDist = b1.radius + b2.radius;
    const overlap = minDist - dist;
    if (overlap <= 0) return false;

    const totalMass = b1.mass + b2.mass;
    const share1 = b2.mass / totalMass;
    const share2 = b1.mass / totalMass;
    b1.x -= nx * overlap * share1;
    b1.y -= ny * overlap * share1;
    b2.x += nx * overlap * share2;
    b2.y += ny * overlap * share2;
    return true;
}

export function resolveCollision(b1, b2) {
    const { nx: baseNx, ny: baseNy, dist } = collisionNormal(b1, b2);
    if (!separateBalls(b1, b2, baseNx, baseNy, dist)) return;

    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velN = rvx * baseNx + rvy * baseNy;
    if (velN >= 0) return;

    const impactSpeed = -velN;
    let nx = baseNx;
    let ny = baseNy;
    ({ nx, ny } = jitterCollisionNormal(nx, ny, 'ball', impactSpeed));

    const velNJ = rvx * nx + rvy * ny;
    if (velNJ >= 0) return;

    const restitution = impactSpeed < LOW_SPEED_THRESHOLD ? BALL_RESTITUTION_SLOW : BALL_RESTITUTION;
    const invMassSum = 1 / b1.mass + 1 / b2.mass;
    const impulse = -(1 + restitution) * velNJ / invMassSum;

    b1.vx -= impulse * nx / b1.mass;
    b1.vy -= impulse * ny / b1.mass;
    b2.vx += impulse * nx / b2.mass;
    b2.vy += impulse * ny / b2.mass;

    const tx = -ny;
    const ty = nx;
    const v1t = b1.vx * tx + b1.vy * ty;
    const v2t = b2.vx * tx + b2.vy * ty;
    const relT = v2t - v1t;

    const jtMax = BALL_FRICTION * Math.abs(impulse);
    const jt = clamp(-relT / invMassSum, -jtMax, jtMax);

    b1.vx -= jt * tx / b1.mass;
    b1.vy -= jt * ty / b1.mass;
    b2.vx += jt * tx / b2.mass;
    b2.vy += jt * ty / b2.mass;

    wakeBall(b1);
    wakeBall(b2);
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

export function stepPhysics(balls, frameScale = 1) {
    const subDt = frameScale / PHYSICS_SUBSTEPS;

    for (let step = 0; step < PHYSICS_SUBSTEPS; step++) {
        for (const ball of balls) {
            if (ball.inPocket || ball.isPocketing()) continue;
            ball.px = ball.x;
            ball.py = ball.y;
            ball.x += ball.vx * subDt;
            ball.y += ball.vy * subDt;
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
            applyMotionForces(ball, subDt);
            tryPocketBall(ball, subDt * PHYSICS_SUBSTEPS);
            ball.advanceRoll(subDt);
        }
    }
}
