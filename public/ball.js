import {
    BALL_RADIUS,
    SLEEP_SPEED,
    SLEEP_SPIN,
    SLIDE_THRESHOLD,
    OBJECT_ENGLISH_VISUAL_SCALE,
    POCKET_FALL_SPEED_REF,
    computePocketFallDuration,
    CUE_RESPOT_DELAY_MS,
    BALL_MASS,
    BALL_MASS_MIN_G,
    BALL_MASS_MAX_G
} from './constants.js';
import { getHeadSpot } from './utils.js';
import {
    quatMultiply,
    quatNormalize,
    quatFromRotation
} from './math3d.js';

const IDENTITY_QUAT = { w: 1, x: 0, y: 0, z: 0 };
export function clearCueDrawVisualState(ball) {
    ball.cueDrawApproach = false;
    ball.cueDrawPostHit = false;
}

/** Синхронизирует угловую скорость ω с кинематическим состоянием физики (v, spin, topSpin). */
export function updateBallOmega(ball) {
    const r = ball.radius;
    const vx = ball.vx || 0;
    const vy = ball.vy || 0;
    const speed = Math.hypot(vx, vy);
    const spin = ball.spin || 0;
    const topSpin = ball.topSpin || 0;

    if (ball.isCueBall && ball.cueDrawPostHit) {
        ball.omegaX = speed > 1e-8 ? -vy / r : 0;
        ball.omegaY = speed > 1e-8 ? vx / r : 0;
        ball.omegaZ = spin / r;
        return;
    }

    let rollMix = rollingVisualMix(ball);
    let rollSign = 1;

    if (ball.isCueBall && ball.cueDrawApproach) {
        rollSign = -1;
        rollMix = cueDrawApproachRollMix(ball, topSpin, rollMix);
    }

    let omegaX = 0;
    let omegaY = 0;

    if (speed > 1e-8 && rollMix > 1e-6) {
        omegaX = (-vy / r) * rollMix * rollSign;
        omegaY = (vx / r) * rollMix * rollSign;
    }

    let omegaZ = spin / r;
    if (!ball.isCueBall) {
        omegaZ *= OBJECT_ENGLISH_VISUAL_SCALE;
    }

    const skipTopSpinRoll = ball.isCueBall && ball.cueDrawApproach;
    if (speed > 1e-8 && Math.abs(topSpin) > 1e-8 && rollMix > 1e-6 && !skipTopSpinRoll) {
        const dirX = vx / speed;
        const dirY = vy / speed;
        const topOmega = topSpin / r;
        omegaX += -dirY * topOmega * rollMix;
        omegaY += dirX * topOmega * rollMix;
    }

    ball.omegaX = omegaX;
    ball.omegaY = omegaY;
    ball.omegaZ = omegaZ;
}

export function clearBallOmega(ball) {
    ball.omegaX = 0;
    ball.omegaY = 0;
    ball.omegaZ = 0;
}

export function randomBallMass() {
    const grams = BALL_MASS_MIN_G + Math.random() * (BALL_MASS_MAX_G - BALL_MASS_MIN_G);
    return grams / 1000;
}

export class Ball {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.mass = options.mass ?? BALL_MASS;
        this.isCueBall = options.isCueBall || false;
        this.number = options.number || 0;
        this.ballType = options.ballType || (this.isCueBall ? 'cue' : 'solid');
        this.color = options.color || '#ffffff';
        this.inPocket = false;
        this.pocketFall = null;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        this.omegaX = 0;
        this.omegaY = 0;
        this.omegaZ = 0;
        this.orientation = { ...IDENTITY_QUAT };
        this.px = x;
        this.py = y;
        this.sleepFrames = 0;
        this.lastDirX = 1;
        this.lastDirY = 0;
        this.drawAxisX = 0;
        this.drawAxisY = 0;
        this.cueDrawApproach = false;
        this.cueDrawPostHit = false;
    }

    startPocketFall(pocket) {
        if (this.pocketFall || this.inPocket) return;

        const entrySpeed = Math.hypot(this.vx, this.vy);
        this.pocketFall = {
            pocketX: pocket.x,
            pocketY: pocket.y,
            pocketDrawRadius: pocket.drawRadius ?? pocket.radius,
            startX: this.x,
            startY: this.y,
            startTime: performance.now(),
            duration: computePocketFallDuration(entrySpeed),
            entrySpeed,
            entryAngle: Math.atan2(this.y - pocket.y, this.x - pocket.x),
            depth: 0,
            scale: 1,
            alpha: 1,
            progress: 0
        };
        this.vx = 0;
        this.vy = 0;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        clearBallOmega(this);
        this.drawAxisX = 0;
        this.drawAxisY = 0;
        clearCueDrawVisualState(this);
    }

    updatePocketFall(balls) {
        if (!this.pocketFall) return false;

        const {
            pocketX, pocketY, startX, startY, startTime, duration, entryAngle, entrySpeed
        } = this.pocketFall;
        const t = Math.min((performance.now() - startTime) / duration, 1);
        const speedFactor = clamp(entrySpeed / POCKET_FALL_SPEED_REF, 0.35, 2.6);

        const rollPhase = clamp(0.4 - (speedFactor - 1) * 0.14, 0.22, 0.4);
        const dropStart = clamp(0.3 - (speedFactor - 1) * 0.12, 0.14, 0.3);

        const rollT = Math.min(t / rollPhase, 1);
        const rollEase = rollT * rollT * (3 - 2 * rollT);
        const dropT = t < dropStart ? 0 : Math.min((t - dropStart) / (1 - dropStart), 1);
        const dropEase = dropT * dropT * dropT;

        const perpX = -Math.sin(entryAngle);
        const perpY = Math.cos(entryAngle);
        const wobbleAmp = 1.6 + entrySpeed * 0.09;
        const wobble = Math.sin(t * Math.PI * (3.2 + speedFactor * 0.4)) * (1 - t) * wobbleAmp;

        const baseX = startX + (pocketX - startX) * rollEase;
        const baseY = startY + (pocketY - startY) * rollEase;
        const sinkPull = dropEase * (3.2 + entrySpeed * 0.18);

        this.x = baseX + perpX * wobble + Math.cos(entryAngle) * sinkPull * 0.25;
        this.y = baseY + perpY * wobble + Math.sin(entryAngle) * sinkPull * 0.25;

        this.pocketFall.depth = dropEase;
        this.pocketFall.scale = 1 - dropEase * 0.91;
        this.pocketFall.alpha = 1 - dropEase * 0.97;
        this.pocketFall.progress = t;
        const rollScale = (0.08 + dropEase * 0.34) * speedFactor;
        this.applyRotationVector(
            -Math.sin(entryAngle) * rollScale,
            Math.cos(entryAngle) * rollScale,
            rollScale * 0.35
        );

        if (t < 1) return false;

        const wasCue = this.isCueBall;
        this.pocketFall = null;
        this.inPocket = true;
        if (wasCue) {
            setTimeout(() => this.respotCueBall(balls), CUE_RESPOT_DELAY_MS);
        }
        return true;
    }

    isPocketing() {
        return this.pocketFall !== null;
    }

    applyRotationVector(rx, ry, rz) {
        const delta = quatFromRotation(rx, ry, rz);
        if (delta.w === 1 && delta.x === 0 && delta.y === 0 && delta.z === 0) return;
        this.orientation = quatNormalize(quatMultiply(delta, this.orientation));
    }

    advanceRoll(dt) {
        if (this.inPocket) return;

        this.applyRotationVector(
            (this.omegaX || 0) * dt,
            (this.omegaY || 0) * dt,
            (this.omegaZ || 0) * dt
        );
    }
    isMoving() {
        if (this.inPocket) return false;
        if (this.isPocketing()) return true;
        return Math.hypot(this.vx, this.vy) > SLEEP_SPEED;
    }

    respotCueBall(balls) {
        const spot = getHeadSpot();
        this.x = spot.x;
        this.y = spot.y;
        this.vx = 0;
        this.vy = 0;
        this.inPocket = false;
        this.pocketFall = null;
        this.spin = 0;
        this.topSpin = 0;
        this.slide = 0;
        clearBallOmega(this);
        this.sleepFrames = 0;
        this.orientation = { ...IDENTITY_QUAT };
        this.lastDirX = 1;
        this.lastDirY = 0;
        this.drawAxisX = 0;
        this.drawAxisY = 0;
        clearCueDrawVisualState(this);

        for (const ball of balls) {
            if (ball === this || ball.inPocket) continue;
            const dx = ball.x - this.x;
            const dy = ball.y - this.y;
            const dist = Math.hypot(dx, dy);
            const minDist = this.radius + ball.radius + 2;
            if (dist < minDist && dist > 0) {
                this.x -= (dx / dist) * (minDist - dist);
                this.y -= (dy / dist) * (minDist - dist);
            }
        }
    }
}
