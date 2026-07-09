import {
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
    SIDE_SPIN_SLIDE_THROW,
    SIDE_SPIN_ROLL_THROW,
    LOW_SPEED_THRESHOLD,
    SLEEP_SPEED,
    SLEEP_SPIN,
    SLEEP_FRAMES,
    PHYSICS_SUBSTEPS,
    COLLISION_PASSES,
    BALL_SPIN_CONTACT,
    BALL_SPIN_THROW,
    SIDE_SPIN_COLLISION_THROW,
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
    FOLLOW_COLLISION_KICK,
    CUE_FOLLOW_RATIO,
    SIDE_SPIN_CURVE_MAX_SLIDING,
    SIDE_SPIN_CURVE_MAX_ROLLING,
    SIDE_SPIN_LATERAL_CAP,
    SIDE_SPIN_RESIDUAL_MIX,
    spinSpeedEffectiveness,
    sideSpinTrajectoryEffectiveness,
    drawSpeedEffectiveness
} from './constants.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { jitterCollisionNormal } from './collision_noise.js';
import { tryPocketBall } from './utils.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function settleLinearMotion(ball) {
    ball.vx = 0;
    ball.vy = 0;
}

function stopBall(ball) {
    settleLinearMotion(ball);
    ball.spin = 0;
    ball.topSpin = 0;
    ball.slide = 0;
    ball.drawAxisX = 0;
    ball.drawAxisY = 0;
}

function setDrawAxis(ball, axisX, axisY) {
    const len = Math.hypot(axisX, axisY);
    if (len <= 1e-6) return;
    ball.drawAxisX = axisX / len;
    ball.drawAxisY = axisY / len;
}

function clearDrawAxis(ball) {
    ball.drawAxisX = 0;
    ball.drawAxisY = 0;
}

function getDrawAxis(ball, dirX, dirY) {
    const ax = ball.drawAxisX || 0;
    const ay = ball.drawAxisY || 0;
    const len = Math.hypot(ax, ay);
    if (len > 0.5) return { x: ax / len, y: ay / len };
    return { x: dirX, y: dirY };
}

function decayResidualSpin(ball, dt) {
    if (Math.abs(ball.spin || 0) > SLEEP_SPIN) {
        ball.spin *= Math.exp(-SPIN_ROLL_DAMP * dt);
        if (Math.abs(ball.spin) <= SLEEP_SPIN) ball.spin = 0;
    }
    if (Math.abs(ball.topSpin || 0) > SLEEP_SPIN) {
        ball.topSpin *= Math.exp(-SPIN_SLIDE_DAMP * dt);
        if (Math.abs(ball.topSpin) <= SLEEP_SPIN) ball.topSpin = 0;
    }
    if ((ball.slide || 0) > SLIDE_THRESHOLD) {
        ball.slide = Math.max(0, ball.slide - SLIDE_RESOLVE_RATE * dt);
        if (ball.slide <= SLIDE_THRESHOLD) ball.slide = 0;
    }
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
    if (Math.abs(ball.topSpin || 0) > SLEEP_SPIN * 3) return true;
    if (Math.abs(ball.spin || 0) > SLEEP_SPIN * 2) return true;
    return false;
}

function applySideSpinLateral(ball, speed, tanX, tanY, dt, throwStrength, slideMix) {
    if (Math.abs(ball.spin) <= SLEEP_SPIN || speed <= SLEEP_SPEED || slideMix <= 0) return;

    const trajEff = sideSpinTrajectoryEffectiveness(speed);
    const lateral = ball.spin * throwStrength * trajEff * slideMix * dt;
    const forwardTravel = speed * dt;
    const cap = Math.min(
        speed * SIDE_SPIN_LATERAL_CAP * trajEff * Math.max(dt * 50, 0.5),
        forwardTravel * trajEff * 0.04
    );
    const clamped = clamp(lateral, -cap, cap);

    ball.vx += tanX * clamped;
    ball.vy += tanY * clamped;
}

function applySideSpinCurve(ball, speed, tanX, tanY, dt, strength, maxTurn) {
    if (Math.abs(ball.spin) <= SLEEP_SPIN || speed <= SLEEP_SPEED) return speed;

    const slideFactor = clamp(ball.slide || 0, 0, 1);
    const slideMix = slideFactor > SLIDE_THRESHOLD
        ? 0.5 + slideFactor * 0.5
        : (Math.abs(ball.spin) > SLEEP_SPIN * 2 ? SIDE_SPIN_RESIDUAL_MIX : 0);
    const rollMix = 1 - slideMix;

    applySideSpinLateral(ball, speed, tanX, tanY, dt, SIDE_SPIN_SLIDE_THROW, slideMix);
    applySideSpinLateral(ball, speed, tanX, tanY, dt, SIDE_SPIN_ROLL_THROW, rollMix);

    const slideBoost = 1 + slideFactor * 1.4;
    const trajEff = sideSpinTrajectoryEffectiveness(speed);
    const forwardTravel = speed * dt;
    const curve = clamp(
        ball.spin * strength * speed * trajEff * slideBoost * dt,
        -speed * maxTurn * dt * trajEff,
        speed * maxTurn * dt * trajEff
    );
    const curveCap = forwardTravel * trajEff * 0.04;
    const clampedCurve = clamp(curve, -curveCap, curveCap);
    ball.vx += tanX * clampedCurve;
    ball.vy += tanY * clampedCurve;

    const newSpeed = Math.hypot(ball.vx, ball.vy);
    if (newSpeed > 1e-8) {
        const scale = speed / newSpeed;
        ball.vx *= scale;
        ball.vy *= scale;
    }
    return speed;
}

function integrateSliding(ball, speed, dirX, dirY, tanX, tanY, dt) {
    const slideFactor = clamp(ball.slide || 0, 0, 1);
    const drawAxis = getDrawAxis(ball, dirX, dirY);
    const forwardSpeed = drawAxis.x * ball.vx + drawAxis.y * ball.vy;
    const rollingBack = forwardSpeed < -SLEEP_SPEED;
    const hasDrawAxis = Math.hypot(ball.drawAxisX || 0, ball.drawAxisY || 0) > 0.5;
    const inDrawRollback = rollingBack || hasDrawAxis;

    if (hasDrawAxis && speed <= SLEEP_SPEED * 4) {
        settleLinearMotion(ball);
        ball.topSpin = 0;
        ball.slide = 0;
        clearDrawAxis(ball);
        return;
    }

    let loss = rollingLoss(speed, dt) + CLOTH_SLIDE_DECEL * slideFactor * dt;

    const topSpin = ball.topSpin || 0;
    const speedEff = spinSpeedEffectiveness(speed);
    const drawEff = drawSpeedEffectiveness(speed);
    if (topSpin < -SLEEP_SPIN && !rollingBack) {
        loss += CLOTH_SLIDE_DECEL * clamp(-topSpin / LOW_SPEED_THRESHOLD, 0, 0.48) * dt * drawEff;
    } else if (topSpin > SLEEP_SPIN) {
        loss *= Math.max(0.35, 1 - topSpin * speedEff / (LOW_SPEED_THRESHOLD * 2.2));
    }

    let nextSpeed = Math.max(0, speed - loss);

    ball.vx = dirX * nextSpeed;
    ball.vy = dirY * nextSpeed;
    nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_SLIDING, SIDE_SPIN_CURVE_MAX_SLIDING);

    if (nextSpeed > 0) {
        const len = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / len) * nextSpeed;
        ball.vy = (ball.vy / len) * nextSpeed;
    } else {
        settleLinearMotion(ball);
        nextSpeed = 0;
    }

    if (Math.abs(topSpin) > SLEEP_SPIN) {
        const rollEff = topSpin < 0 ? drawSpeedEffectiveness(nextSpeed) : spinSpeedEffectiveness(nextSpeed);
        const speedFactor = 1 / (1 + nextSpeed / (LOW_SPEED_THRESHOLD * 2.4));
        const gripBoost = 1 + clamp(1 - nextSpeed / LOW_SPEED_THRESHOLD, 0, 0.75);
        const resolveRate = rollingBack ? SLIP_RESOLVE_RATE * 0.42 : SLIP_RESOLVE_RATE;
        const resolve = resolveRate * dt * (1 + slideFactor * 0.75) * speedFactor * gripBoost * rollEff;
        const delta = Math.min(Math.abs(topSpin), resolve) * Math.sign(topSpin);
        ball.topSpin = topSpin - delta;

        if (topSpin < 0) {
            if (!rollingBack) {
                nextSpeed = Math.max(0, nextSpeed - Math.abs(delta) * DRAW_FORWARD_BRAKE * rollEff);
                if (nextSpeed > SLEEP_SPEED) {
                    const len = Math.hypot(ball.vx, ball.vy) || 1;
                    ball.vx = (ball.vx / len) * nextSpeed;
                    ball.vy = (ball.vy / len) * nextSpeed;
                }
            }

            const reverseThreshold = LOW_SPEED_THRESHOLD * DRAW_REVERSE_SPEED_THRESHOLD;
            const spinLeft = Math.abs(ball.topSpin);
            const updatedForwardSpeed = drawAxis.x * ball.vx + drawAxis.y * ball.vy;
            if (
                !rollingBack &&
                !hasDrawAxis &&
                spinLeft > SLEEP_SPIN &&
                nextSpeed < reverseThreshold * (0.72 + rollEff * 0.28) &&
                updatedForwardSpeed >= -SLEEP_SPEED
            ) {
                const backSpeed = Math.min(
                    (spinLeft * DRAW_REVERSE_FACTOR + (reverseThreshold - nextSpeed) * 0.22) * rollEff,
                    LOW_SPEED_THRESHOLD * DRAW_MAX_REVERSE_SPEED_SCALE * rollEff
                );
                setDrawAxis(ball, drawAxis.x, drawAxis.y);
                ball.vx = -drawAxis.x * backSpeed;
                ball.vy = -drawAxis.y * backSpeed;
                ball.slide = Math.max(ball.slide || 0, 0.48);
                ball.topSpin *= 0.62;
                return;
            }
        } else if (topSpin > 0) {
            nextSpeed = Math.max(0, nextSpeed + delta * 0.08 * rollEff);
            const len = Math.hypot(ball.vx, ball.vy) || 1;
            ball.vx = (ball.vx / len) * nextSpeed;
            ball.vy = (ball.vy / len) * nextSpeed;
        }
    }

    const sideSpinHold = Math.abs(ball.spin) > SLEEP_SPIN * 2 ? 0.32 : 1;
    ball.slide = Math.max(0, slideFactor - SLIDE_RESOLVE_RATE * dt * sideSpinHold);
    ball.spin *= Math.exp(-SPIN_SLIDE_DAMP * dt);

    if (inDrawRollback && speed > SLEEP_SPEED * 2) {
        ball.slide = Math.max(ball.slide || 0, SLIDE_THRESHOLD + 0.02);
    }

    if (ball.slide <= SLIDE_THRESHOLD && Math.abs(ball.topSpin) <= SLEEP_SPIN * 3) {
        ball.slide = 0;
        if (!inDrawRollback) ball.topSpin = 0;
    }
}

function integrateRolling(ball, speed, dirX, dirY, dt) {
    const loss = rollingLoss(speed, dt);
    let nextSpeed = Math.max(0, speed - loss);

    if (nextSpeed <= 0) {
        settleLinearMotion(ball);
        decayResidualSpin(ball, dt);
        return;
    }

    const tanX = -dirY;
    const tanY = dirX;
    ball.vx = dirX * nextSpeed;
    ball.vy = dirY * nextSpeed;
    nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_ROLLING, SIDE_SPIN_CURVE_MAX_ROLLING);

    if (nextSpeed > SLEEP_SPEED) {
        const len = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / len) * nextSpeed;
        ball.vy = (ball.vy / len) * nextSpeed;
        ball.spin *= Math.exp(-SPIN_ROLL_DAMP * dt);
        ball.topSpin = 0;
        ball.slide = 0;
    } else {
        settleLinearMotion(ball);
        decayResidualSpin(ball, dt);
    }
}

export function applyMotionForces(ball, dt) {
    if (ball.inPocket || ball.isPocketing()) return;

    let speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= 0) {
        decayResidualSpin(ball, dt);
        updateSleepState(ball);
        return;
    }

    ball.lastDirX = ball.vx / speed;
    ball.lastDirY = ball.vy / speed;

    const dirX = ball.lastDirX;
    const dirY = ball.lastDirY;
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

    const totalMass = b1.mass + b2.mass;
    const share1 = b2.mass / totalMass;
    const share2 = b1.mass / totalMass;
    b1.x -= nx * overlap * share1;
    b1.y -= ny * overlap * share1;
    b2.x += nx * overlap * share2;
    b2.y += ny * overlap * share2;
    return true;
}

function setAlongVelocity(ball, dirX, dirY, alongSpeed) {
    const tx = -dirY;
    const ty = dirX;
    const tang = ball.vx * tx + ball.vy * ty;
    ball.vx = dirX * alongSpeed + tx * tang;
    ball.vy = dirY * alongSpeed + ty * tang;
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
    const speedEff = spinSpeedEffectiveness(impactSpeed);
    const drawEff = drawSpeedEffectiveness(impactSpeed);

    if (topSpin < -SLEEP_SPIN) {
        const drawSpin = -topSpin;
        const drawMag = clamp(drawSpin * DRAW_COLLISION_KICK * headOn * drawEff, 0, impactSpeed * DRAW_COLLISION_MAX * drawEff);
        if (drawMag <= SLEEP_SPIN) return;

        const transferred = topSpin * DRAW_SPIN_TRANSFER * Math.max(0.35, headOn) * drawEff;
        other.topSpin = (other.topSpin || 0) + transferred;
        striker.topSpin = topSpin - transferred;

        const drawBackSpeed = clamp(
            drawSpin * 0.45 * drawEff + impactSpeed * 0.14,
            impactSpeed * 0.28,
            impactSpeed * 0.52 * drawEff
        );
        setDrawAxis(striker, shotX, shotY);
        setAlongVelocity(striker, shotX, shotY, -drawBackSpeed);

        const objBrake = drawMag * OBJECT_DRAW_BRAKE_RATIO;
        other.vx -= objBrake * shotX;
        other.vy -= objBrake * shotY;

        const slideBoost = clamp(0.38 + drawMag / Math.max(impactSpeed, 0.1) * 0.48, 0.38, 0.82);
        other.slide = Math.max(other.slide || 0, slideBoost);
        striker.slide = Math.max(striker.slide || 0, slideBoost * 0.85);
        striker.topSpin = Math.min(striker.topSpin, topSpin * 0.72);
        return;
    }

    if (topSpin > SLEEP_SPIN) {
        const followEff = drawSpeedEffectiveness(impactSpeed);
        const along = striker.vx * shotX + striker.vy * shotY;
        const followMag = clamp(topSpin * FOLLOW_COLLISION_KICK * headOn * followEff, 0, impactSpeed * 0.14 * followEff);
        const followMin = clamp(
            topSpin * 0.38 * followEff + impactSpeed * 0.22,
            impactSpeed * 0.32,
            impactSpeed * 0.52 * followEff
        );
        const targetAlong = Math.max(along, followMin);
        setAlongVelocity(striker, shotX, shotY, targetAlong);
        other.vx += followMag * shotX;
        other.vy += followMag * shotY;
        striker.topSpin = topSpin * 0.42;
        striker.slide = Math.max(striker.slide || 0, 0.36);
    }
}

export function resolveCollision(b1, b2) {
    const { nx: baseNx, ny: baseNy, dist } = collisionNormal(b1, b2);
    if (!separateBalls(b1, b2, baseNx, baseNy, dist)) return;

    const b1PreVx = b1.vx;
    const b1PreVy = b1.vy;
    const b2PreVx = b2.vx;
    const b2PreVy = b2.vy;
    const v1nPre = b1PreVx * baseNx + b1PreVy * baseNy;
    const v2nPre = b2PreVx * baseNx + b2PreVy * baseNy;

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
    const trajEff = sideSpinTrajectoryEffectiveness(impactSpeed);
    const contactEff = Math.max(0.3, Math.sqrt(trajEff));
    const surf1 = v1t + (b1.spin || 0) * BALL_SPIN_CONTACT * contactEff;
    const surf2 = v2t + (b2.spin || 0) * BALL_SPIN_CONTACT * contactEff;
    const relSurf = surf2 - surf1;

    const jtMax = BALL_FRICTION * Math.abs(impulse);
    const jt = clamp(-relSurf / (invMassSum * 1.75), -jtMax, jtMax);

    b1.vx -= jt * tx / b1.mass;
    b1.vy -= jt * ty / b1.mass;
    b2.vx += jt * tx / b2.mass;
    b2.vy += jt * ty / b2.mass;

    b1.spin = (b1.spin || 0) + jt * BALL_SPIN_CONTACT * contactEff;
    b2.spin = (b2.spin || 0) - jt * BALL_SPIN_CONTACT * contactEff;

    const spinThrow = clamp((b1.spin - b2.spin) * BALL_SPIN_THROW * trajEff, -impactSpeed * 0.07 * trajEff, impactSpeed * 0.07 * trajEff);
    if (Math.abs(spinThrow) > 1e-6) {
        b1.vx += spinThrow * tx / b1.mass;
        b1.vy += spinThrow * ty / b1.mass;
        b2.vx -= spinThrow * tx / b2.mass;
        b2.vy -= spinThrow * ty / b2.mass;
    }

    let striker;
    let other;
    if (b1.isCueBall && !b2.isCueBall) {
        striker = b1;
        other = b2;
    } else if (b2.isCueBall && !b1.isCueBall) {
        striker = b2;
        other = b1;
    } else {
        striker = v1nPre > v2nPre ? b1 : b2;
        other = striker === b1 ? b2 : b1;
    }
    const strikerPreVx = striker === b1 ? b1PreVx : b2PreVx;
    const strikerPreVy = striker === b1 ? b1PreVy : b2PreVy;
    applyTopSpinCollision(striker, other, strikerPreVx, strikerPreVy, nx, ny, impactSpeed);

    if (striker.isCueBall && Math.abs(striker.spin || 0) > SLEEP_SPIN) {
        const spinKick = clamp(
            striker.spin * SIDE_SPIN_COLLISION_THROW * trajEff,
            -impactSpeed * 0.32 * trajEff,
            impactSpeed * 0.32 * trajEff
        );
        striker.vx += spinKick * tx;
        striker.vy += spinKick * ty;

        const postSpeed = Math.hypot(striker.vx, striker.vy);
        const minSpeed = impactSpeed * 0.15 * trajEff;
        if (postSpeed > SLEEP_SPEED && postSpeed < minSpeed) {
            const scale = minSpeed / postSpeed;
            striker.vx *= scale;
            striker.vy *= scale;
        }
    }

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
