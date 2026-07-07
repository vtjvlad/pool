import {
    BALL_RADIUS,
    BALL_RESTITUTION,
    BALL_RESTITUTION_SLOW,
    BALL_FRICTION,
    CLOTH_ROLL_DECEL,
    CLOTH_ROLL_SPEED_SCALE,
    CLOTH_SLIDE_DECEL,
    SLIP_RESOLVE_RATE,
    SLIDE_RESOLVE_RATE,
    SLIDE_THRESHOLD,
    SPIN_ROLL_DAMP,
    SPIN_SLIDE_DAMP,
    SPIN_CURVE_WHILE_SLIDING,
    SPIN_CURVE_WHILE_ROLLING,
    LOW_SPEED_THRESHOLD,
    SLEEP_SPEED,
    SLEEP_SPIN,
    SLEEP_FRAMES,
    PHYSICS_SUBSTEPS,
    COLLISION_PASSES,
    BALL_SPIN_CONTACT,
    COLLISION_SLIDE_MIN
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { tryPocketBall } from './utils.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function stopBall(ball) {
    ball.vx = 0;
    ball.vy = 0;
    ball.spin = 0;
    ball.topSpin = 0;
    ball.slide = 0;
}

function wakeBall(ball) {
    ball.sleepFrames = 0;
}

function updateSleepState(ball) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const spin = Math.max(Math.abs(ball.spin), Math.abs(ball.topSpin));
    const sliding = (ball.slide || 0) > SLIDE_THRESHOLD;
    if (speed < SLEEP_SPEED && spin < SLEEP_SPIN && !sliding) {
        ball.sleepFrames = (ball.sleepFrames || 0) + 1;
        if (ball.sleepFrames >= SLEEP_FRAMES) stopBall(ball);
    } else {
        wakeBall(ball);
    }
}

function rollingLoss(speed, dt) {
    const speedRatio = clamp(speed / LOW_SPEED_THRESHOLD, 0, 1);
    const base = CLOTH_ROLL_DECEL + speed * CLOTH_ROLL_SPEED_SCALE;
    return base * dt * (0.5 + 0.5 * speedRatio);
}

function isSliding(ball, speed) {
    if ((ball.slide || 0) > SLIDE_THRESHOLD) return true;
    if (speed <= SLEEP_SPEED) return false;
    return Math.abs(ball.topSpin || 0) > SLEEP_SPIN * 2;
}

function applySideSpinCurve(ball, speed, tanX, tanY, dt, strength, maxTurn) {
    if (Math.abs(ball.spin) <= SLEEP_SPIN || speed <= SLEEP_SPEED) return speed;

    const curve = clamp(
        ball.spin * strength * speed * dt,
        -speed * maxTurn * dt,
        speed * maxTurn * dt
    );
    ball.vx += -tanY * curve;
    ball.vy += tanX * curve;
    return Math.hypot(ball.vx, ball.vy);
}

function integrateSliding(ball, speed, dirX, dirY, tanX, tanY, dt) {
    const slideFactor = clamp(ball.slide || 0, 0, 1);
    let loss = rollingLoss(speed, dt) + CLOTH_SLIDE_DECEL * slideFactor * dt;

    const topSpin = ball.topSpin || 0;
    if (topSpin < -SLEEP_SPIN) {
        loss += CLOTH_SLIDE_DECEL * clamp(-topSpin / LOW_SPEED_THRESHOLD, 0, 0.55) * dt;
    } else if (topSpin > SLEEP_SPIN) {
        loss *= Math.max(0.35, 1 - topSpin / (LOW_SPEED_THRESHOLD * 2.2));
    }

    let nextSpeed = Math.max(0, speed - loss);

    ball.vx = dirX * nextSpeed;
    ball.vy = dirY * nextSpeed;
    nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_SLIDING, 0.06);

    if (nextSpeed > 0) {
        const len = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / len) * nextSpeed;
        ball.vy = (ball.vy / len) * nextSpeed;
    } else {
        stopBall(ball);
        return;
    }

    if (Math.abs(topSpin) > SLEEP_SPIN) {
        const resolve = SLIP_RESOLVE_RATE * dt * (1 + slideFactor * 0.6);
        const delta = Math.min(Math.abs(topSpin), resolve) * Math.sign(topSpin);
        ball.topSpin = topSpin - delta;
        if (topSpin < 0) {
            nextSpeed = Math.max(0, nextSpeed + delta * 0.22);
            ball.vx = dirX * nextSpeed;
            ball.vy = dirY * nextSpeed;
        }
    }

    ball.slide = Math.max(0, slideFactor - SLIDE_RESOLVE_RATE * dt);
    ball.spin *= Math.exp(-SPIN_SLIDE_DAMP * dt);

    if (ball.slide <= SLIDE_THRESHOLD && Math.abs(ball.topSpin) <= SLEEP_SPIN * 2) {
        ball.slide = 0;
        ball.topSpin = 0;
    }
}

function integrateRolling(ball, speed, dirX, dirY, dt) {
    const loss = rollingLoss(speed, dt);
    let nextSpeed = Math.max(0, speed - loss);

    if (nextSpeed <= 0) {
        stopBall(ball);
        return;
    }

    const tanX = -dirY;
    const tanY = dirX;
    ball.vx = dirX * nextSpeed;
    ball.vy = dirY * nextSpeed;
    nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_ROLLING, 0.025);

    if (nextSpeed > SLEEP_SPEED) {
        const len = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / len) * nextSpeed;
        ball.vy = (ball.vy / len) * nextSpeed;
    } else {
        stopBall(ball);
        return;
    }

    ball.spin *= Math.exp(-SPIN_ROLL_DAMP * dt);
    ball.topSpin = 0;
    ball.slide = 0;
}

export function applyMotionForces(ball, dt) {
    if (ball.inPocket || ball.isPocketing()) return;

    let speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= 0) {
        updateSleepState(ball);
        return;
    }

    const dirX = ball.vx / speed;
    const dirY = ball.vy / speed;
    const tanX = -dirY;
    const tanY = dirX;

    if (isSliding(ball, speed)) {
        integrateSliding(ball, speed, dirX, dirY, tanX, tanY, dt);
    } else {
        integrateRolling(ball, speed, dirX, dirY, dt);
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

    const correction = overlap * 0.5;
    b1.x -= nx * correction;
    b1.y -= ny * correction;
    b2.x += nx * correction;
    b2.y += ny * correction;
    return true;
}

export function resolveCollision(b1, b2) {
    const { nx, ny, dist } = collisionNormal(b1, b2);
    if (!separateBalls(b1, b2, nx, ny, dist)) return;

    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN >= 0) return;

    const impactSpeed = -velN;
    const restitution = impactSpeed < LOW_SPEED_THRESHOLD ? BALL_RESTITUTION_SLOW : BALL_RESTITUTION;
    const jn = -(1 + restitution) * velN * 0.5;

    b1.vx -= jn * nx;
    b1.vy -= jn * ny;
    b2.vx += jn * nx;
    b2.vy += jn * ny;

    const tx = -ny;
    const ty = nx;
    const v1t = b1.vx * tx + b1.vy * ty;
    const v2t = b2.vx * tx + b2.vy * ty;
    const surf1 = v1t + (b1.spin || 0) * BALL_SPIN_CONTACT;
    const surf2 = v2t + (b2.spin || 0) * BALL_SPIN_CONTACT;
    const relSurf = surf2 - surf1;

    const jtMax = BALL_FRICTION * jn;
    let jt = clamp(-relSurf / 1.75, -jtMax, jtMax);

    b1.vx -= jt * tx;
    b1.vy -= jt * ty;
    b2.vx += jt * tx;
    b2.vy += jt * ty;

    b1.spin = (b1.spin || 0) + jt * BALL_SPIN_CONTACT;
    b2.spin = (b2.spin || 0) - jt * BALL_SPIN_CONTACT;

    const slideBoost = clamp(COLLISION_SLIDE_MIN + impactSpeed * 0.018, COLLISION_SLIDE_MIN, 0.55);
    b1.slide = Math.max(b1.slide || 0, slideBoost);
    b2.slide = Math.max(b2.slide || 0, slideBoost);

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
            applyMotionForces(ball, subDt);
            tryPocketBall(ball, subDt * PHYSICS_SUBSTEPS);
        }
    }
}
