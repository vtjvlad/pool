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
    COLLISION_SLIDE_MIN,
    DRAW_COLLISION_KICK,
    DRAW_COLLISION_MAX,
    DRAW_SPIN_TRANSFER,
    DRAW_REVERSE_FACTOR,
    DRAW_FORWARD_BRAKE,
    DRAW_REVERSE_SPEED_THRESHOLD,
    DRAW_MAX_REVERSE_SPEED_SCALE,
    CUE_DRAW_BACK_RATIO,
    OBJECT_DRAW_BRAKE_RATIO,
    FOLLOW_COLLISION_KICK
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
    return base * dt * (0.62 + 0.38 * speedRatio);
}

function isSliding(ball, speed) {
    if ((ball.slide || 0) > SLIDE_THRESHOLD) return true;
    if (speed <= SLEEP_SPEED) return false;
    return Math.abs(ball.topSpin || 0) > SLEEP_SPIN * 3;
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
        loss += CLOTH_SLIDE_DECEL * clamp(-topSpin / LOW_SPEED_THRESHOLD, 0, 0.38) * dt;
    } else if (topSpin > SLEEP_SPIN) {
        loss *= Math.max(0.35, 1 - topSpin / (LOW_SPEED_THRESHOLD * 2.2));
    }

    let nextSpeed = Math.max(0, speed - loss);

    ball.vx = dirX * nextSpeed;
    ball.vy = dirY * nextSpeed;
    nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_SLIDING, 0.12);

    if (nextSpeed > 0) {
        const len = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / len) * nextSpeed;
        ball.vy = (ball.vy / len) * nextSpeed;
    } else {
        stopBall(ball);
        return;
    }

    if (Math.abs(topSpin) > SLEEP_SPIN) {
        const speedFactor = 1 / (1 + nextSpeed / (LOW_SPEED_THRESHOLD * 2.4));
        const resolve = SLIP_RESOLVE_RATE * dt * (1 + slideFactor * 0.6) * speedFactor;
        const delta = Math.min(Math.abs(topSpin), resolve) * Math.sign(topSpin);
        ball.topSpin = topSpin - delta;

        if (topSpin < 0) {
            nextSpeed = Math.max(0, nextSpeed - Math.abs(delta) * DRAW_FORWARD_BRAKE);
            if (nextSpeed > SLEEP_SPEED) {
                ball.vx = dirX * nextSpeed;
                ball.vy = dirY * nextSpeed;
            }

            const reverseThreshold = LOW_SPEED_THRESHOLD * DRAW_REVERSE_SPEED_THRESHOLD;
            const spinLeft = Math.abs(ball.topSpin);
            if (spinLeft > SLEEP_SPIN * 1.5 && nextSpeed < reverseThreshold) {
                const backSpeed = Math.min(
                    spinLeft * DRAW_REVERSE_FACTOR + (reverseThreshold - nextSpeed) * 0.35,
                    LOW_SPEED_THRESHOLD * DRAW_MAX_REVERSE_SPEED_SCALE
                );
                ball.vx = -dirX * backSpeed;
                ball.vy = -dirY * backSpeed;
                ball.slide = Math.max(ball.slide || 0, 0.34);
                ball.topSpin *= 0.72;
                return;
            }
        } else if (topSpin > 0) {
            nextSpeed = Math.max(0, nextSpeed + delta * 0.18);
            ball.vx = dirX * nextSpeed;
            ball.vy = dirY * nextSpeed;
        }
    }

    ball.slide = Math.max(0, slideFactor - SLIDE_RESOLVE_RATE * dt);
    ball.spin *= Math.exp(-SPIN_SLIDE_DAMP * dt);

    if (ball.slide <= SLIDE_THRESHOLD && Math.abs(ball.topSpin) <= SLEEP_SPIN * 3) {
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
    nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_ROLLING, 0.05);

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

function applyTopSpinCollision(striker, other, strikerPreVx, strikerPreVy, nx, ny, impactSpeed) {
    const topSpin = striker.topSpin || 0;
    const preSpeed = Math.hypot(strikerPreVx, strikerPreVy);
    let shotX = nx;
    let shotY = ny;
    if (strikerPreVx * nx + strikerPreVy * ny < 0) {
        shotX = -nx;
        shotY = -ny;
    }
    if (preSpeed > SLEEP_SPEED) {
        shotX = strikerPreVx / preSpeed;
        shotY = strikerPreVy / preSpeed;
    }
    const headOn = Math.abs(shotX * nx + shotY * ny);

    if (topSpin < -SLEEP_SPIN) {
        const drawMag = clamp(-topSpin * DRAW_COLLISION_KICK * headOn, 0, impactSpeed * DRAW_COLLISION_MAX);
        if (drawMag <= SLEEP_SPIN) return;

        const transferred = topSpin * DRAW_SPIN_TRANSFER * Math.max(0.45, headOn);
        other.topSpin = (other.topSpin || 0) + transferred;
        striker.topSpin = topSpin - transferred;

        const cueDraw = drawMag * CUE_DRAW_BACK_RATIO;
        striker.vx -= cueDraw * shotX;
        striker.vy -= cueDraw * shotY;

        const objBrake = drawMag * OBJECT_DRAW_BRAKE_RATIO;
        other.vx -= objBrake * shotX;
        other.vy -= objBrake * shotY;

        const slideBoost = clamp(0.28 + drawMag / Math.max(impactSpeed, 0.1) * 0.42, 0.28, 0.78);
        other.slide = Math.max(other.slide || 0, slideBoost);
        striker.slide = Math.max(striker.slide || 0, slideBoost * 0.72);
        return;
    }

    if (topSpin > SLEEP_SPIN) {
        const followMag = clamp(topSpin * FOLLOW_COLLISION_KICK * headOn, 0, impactSpeed * 0.14);
        other.vx += followMag * shotX;
        other.vy += followMag * shotY;
        striker.topSpin = topSpin * 0.55;
    }
}

export function resolveCollision(b1, b2) {
    const { nx, ny, dist } = collisionNormal(b1, b2);
    if (!separateBalls(b1, b2, nx, ny, dist)) return;

    const b1PreVx = b1.vx;
    const b1PreVy = b1.vy;
    const b2PreVx = b2.vx;
    const b2PreVy = b2.vy;
    const v1nPre = b1PreVx * nx + b1PreVy * ny;
    const v2nPre = b2PreVx * nx + b2PreVy * ny;

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

    const striker = v1nPre > v2nPre ? b1 : b2;
    const other = striker === b1 ? b2 : b1;
    const strikerPreVx = striker === b1 ? b1PreVx : b2PreVx;
    const strikerPreVy = striker === b1 ? b1PreVy : b2PreVy;
    applyTopSpinCollision(striker, other, strikerPreVx, strikerPreVy, nx, ny, impactSpeed);

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
