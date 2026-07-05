import {
    BALL_BOUNCE,
    BALL_SURFACE_FRICTION,
    TABLE_DRAG,
    SLIDE_DRAG,
    SLIDING_DECELERATION,
    SLIDE_DECAY,
    SLIDE_TO_ROLL_THRESHOLD,
    ROLLING_DECELERATION,
    LOW_SPEED_DECELERATION,
    LOW_SPEED_THRESHOLD,
    SLEEP_SPEED,
    SLEEP_SPIN,
    SLEEP_FRAMES,
    PHYSICS_SUBSTEPS,
    COLLISION_PASSES,
    SPIN_DECAY,
    SIDE_SPIN_CURVE,
    SIDE_SPIN_THROW,
    TOP_SPIN_ACCEL,
    DRAW_SPIN_BRAKE,
    TOP_SPIN_ROLLING_ACCEL,
    DRAW_SPIN_ROLLING_ACCEL,
    TOP_SPIN_CONVERSION,
    SPIN_TRANSFER,
    MAX_SIDE_SPIN_SPEED_CHANGE,
    MAX_SPIN_SPEED_CHANGE
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { tryPocketBall } from './utils.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function setBallSpeed(ball, speed, directionX, directionY) {
    ball.vx = directionX * speed;
    ball.vy = directionY * speed;
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
    if (speed < SLEEP_SPEED && spin < SLEEP_SPIN && (ball.slide || 0) < SLIDE_TO_ROLL_THRESHOLD) {
        ball.sleepFrames = (ball.sleepFrames || 0) + 1;
        if (ball.sleepFrames >= SLEEP_FRAMES) stopBall(ball);
    } else {
        wakeBall(ball);
    }
}

function applySideSpinCurve(ball, frameFraction) {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= SLEEP_SPEED || Math.abs(ball.spin) <= SLEEP_SPIN) return speed;

    const dirX = ball.vx / speed;
    const dirY = ball.vy / speed;
    const slideBoost = 1 + (ball.slide || 0) * 0.3;
    const curve = clamp(
        ball.spin * SIDE_SPIN_CURVE * speed * frameFraction * slideBoost,
        -speed * MAX_SIDE_SPIN_SPEED_CHANGE * frameFraction,
        speed * MAX_SIDE_SPIN_SPEED_CHANGE * frameFraction
    );
    ball.vx += -dirY * curve;
    ball.vy += dirX * curve;
    return Math.hypot(ball.vx, ball.vy);
}

function applyTopSpinToMotion(ball, speed, dt) {
    if (Math.abs(ball.topSpin) < SLEEP_SPIN || speed <= SLEEP_SPEED) return speed;

    const dirX = ball.vx / speed;
    const dirY = ball.vy / speed;
    const rollAccel = ball.topSpin >= 0 ? TOP_SPIN_ROLLING_ACCEL : DRAW_SPIN_ROLLING_ACCEL;
    const dv = clamp(
        ball.topSpin * rollAccel * dt,
        -speed * MAX_SPIN_SPEED_CHANGE * dt,
        speed * MAX_SPIN_SPEED_CHANGE * dt
    );
    const newSpeed = Math.max(0, speed + dv);
    ball.vx = dirX * newSpeed;
    ball.vy = dirY * newSpeed;
    ball.topSpin -= dv * TOP_SPIN_CONVERSION;
    return newSpeed;
}

function rollingDeceleration(ball, speed, dt) {
    const speedRatio = clamp(speed / LOW_SPEED_THRESHOLD, 0, 1);
    const blend = speedRatio * speedRatio * (3 - 2 * speedRatio);
    const deceleration = LOW_SPEED_DECELERATION + (ROLLING_DECELERATION - LOW_SPEED_DECELERATION) * blend;
    return deceleration * dt * (0.55 + 0.85 * speedRatio);
}

export function applyMotionForces(ball, dt) {
    if (ball.inPocket || ball.isPocketing()) return;

    let speed = Math.hypot(ball.vx, ball.vy);
    const spinFactor = Math.pow(SPIN_DECAY, dt);
    ball.spin *= spinFactor;
    ball.topSpin *= spinFactor;

    if (speed <= 0) {
        updateSleepState(ball);
        return;
    }

    speed = applySideSpinCurve(ball, dt);
    speed = applyTopSpinToMotion(ball, speed, dt);

    const sliding = (ball.slide || 0) > SLIDE_TO_ROLL_THRESHOLD;
    if (sliding) {
        const slideDrag = Math.pow(SLIDE_DRAG, dt);
        const slideLoss = SLIDING_DECELERATION * ball.slide * dt;
        const nextSpeed = Math.max(0, speed * slideDrag - slideLoss);
        if (nextSpeed > 0) {
            const len = Math.hypot(ball.vx, ball.vy) || 1;
            setBallSpeed(ball, nextSpeed, ball.vx / len, ball.vy / len);
        } else {
            stopBall(ball);
            updateSleepState(ball);
            return;
        }
        ball.slide *= Math.pow(SLIDE_DECAY, dt);
        if (ball.slide < SLIDE_TO_ROLL_THRESHOLD) ball.slide = 0;
    } else {
        const drag = Math.pow(TABLE_DRAG, dt);
        const linearLoss = rollingDeceleration(ball, speed, dt);
        const nextSpeed = Math.max(0, speed * drag - linearLoss);
        if (nextSpeed > 0) {
            const len = Math.hypot(ball.vx, ball.vy) || 1;
            setBallSpeed(ball, nextSpeed, ball.vx / len, ball.vy / len);
        } else {
            stopBall(ball);
            updateSleepState(ball);
            return;
        }
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

function applySpinAfterBallHit(ball, other, dirX, dirY, impactSpeed) {
    const spinAmount = Math.max(Math.abs(ball.spin), Math.abs(ball.topSpin));
    if (spinAmount < SLEEP_SPIN || impactSpeed <= 0) return;

    const tx = -dirY;
    const ty = dirX;
    const cap = impactSpeed * MAX_SPIN_SPEED_CHANGE;
    const topScale = ball.topSpin >= 0 ? TOP_SPIN_ACCEL : DRAW_SPIN_BRAKE;
    const topKick = clamp(ball.topSpin * topScale * impactSpeed, -cap, cap);
    const sideKick = clamp(ball.spin * SIDE_SPIN_THROW * impactSpeed, -cap, cap);

    ball.vx += dirX * topKick + tx * sideKick;
    ball.vy += dirY * topKick + ty * sideKick;
    other.spin += ball.spin * SPIN_TRANSFER;
    other.topSpin += Math.max(0, ball.topSpin) * SPIN_TRANSFER * 0.55;
    ball.spin *= 1 - SPIN_TRANSFER;
    ball.topSpin *= 1 - SPIN_TRANSFER;
    ball.slide = Math.min(ball.slide || 0, 0.35);
}

export function resolveCollision(b1, b2) {
    const { nx, ny, dist } = collisionNormal(b1, b2);
    if (!separateBalls(b1, b2, nx, ny, dist)) return;

    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN >= 0) return;

    const impactSpeed = -velN;
    const bounce = impactSpeed < LOW_SPEED_THRESHOLD ? BALL_BOUNCE * 0.78 : BALL_BOUNCE;
    const normalImpulse = -(1 + bounce) * velN * 0.5;

    b1.vx -= normalImpulse * nx;
    b1.vy -= normalImpulse * ny;
    b2.vx += normalImpulse * nx;
    b2.vy += normalImpulse * ny;

    const tx = -ny;
    const ty = nx;
    const tangentSpeed = (b2.vx - b1.vx) * tx + (b2.vy - b1.vy) * ty;
    const tangentImpulse = clamp(
        -tangentSpeed * 0.5,
        -normalImpulse * BALL_SURFACE_FRICTION,
        normalImpulse * BALL_SURFACE_FRICTION
    );

    b1.vx -= tangentImpulse * tx;
    b1.vy -= tangentImpulse * ty;
    b2.vx += tangentImpulse * tx;
    b2.vy += tangentImpulse * ty;

    applySpinAfterBallHit(b1, b2, nx, ny, impactSpeed);
    applySpinAfterBallHit(b2, b1, -nx, -ny, impactSpeed);
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
