import { Ball } from './ball.js';
import { applyMotionForces } from './physics_engine.js';
import { resolveBallCushionCollision } from './cushion_collision.js';
import { tryPocketBall } from './utils.js';
import {
    BALL_RADIUS,
    BALL_RESTITUTION,
    BALL_FRICTION,
    PHYSICS_SUBSTEPS,
    MIN_BOUNCE_DRAW
} from './constants.js';
import { ballBounceDirs } from './physics.js';

const CONTACT_COOLDOWN_STEPS = 4;
const MAX_SIM_STEPS = 3600;
const CUE_MAX_CONTACTS = 2;
const TARGET_PREVIEW_LEN = 72;

function cloneCueBall(cueBall) {
    const c = new Ball(cueBall.x, cueBall.y, { isCueBall: true });
    c.vx = cueBall.vx;
    c.vy = cueBall.vy;
    c.px = cueBall.px;
    c.py = cueBall.py;
    c.sleepFrames = cueBall.sleepFrames;
    return c;
}

function staticObstacles(balls, cueBall) {
    return balls
        .filter(b => b !== cueBall && !b.inPocket && !b.isPocketing())
        .map(b => ({ x: b.x, y: b.y, ball: b }));
}

function applyStrike(simCue, angle, power) {
    simCue.vx = Math.cos(angle) * power;
    simCue.vy = Math.sin(angle) * power;
}

function resolveCueStaticBallCollision(cue, obstacle) {
    const dx = obstacle.x - cue.x;
    const dy = obstacle.y - cue.y;
    const dist = Math.hypot(dx, dy);
    const minDist = BALL_RADIUS * 2;
    if (dist >= minDist - 0.01) return null;

    const nx = (dist > 1e-6 ? dx / dist : 1);
    const ny = (dist > 1e-6 ? dy / dist : 0);
    const overlap = minDist - dist;
    cue.x -= nx * overlap;
    cue.y -= ny * overlap;

    const dot = cue.vx * nx + cue.vy * ny;
    if (dot > 0) {
        return { type: 'ball', x: cue.x, y: cue.y, ball: obstacle.ball };
    }

    const tx = -ny;
    const ty = nx;
    const jn = -(1 + BALL_RESTITUTION) * dot;
    cue.vx += jn * nx;
    cue.vy += jn * ny;

    const vTan = cue.vx * tx + cue.vy * ty;
    cue.vx -= vTan * BALL_FRICTION * tx;
    cue.vy -= vTan * BALL_FRICTION * ty;

    return { type: 'ball', x: cue.x, y: cue.y, ball: obstacle.ball };
}

function resolveStaticBallCollisions(cue, obstacles) {
    let hit = null;
    for (const obstacle of obstacles) {
        const contact = resolveCueStaticBallCollision(cue, obstacle);
        if (contact) hit = contact;
    }
    return hit;
}

function detectWallBounce(cue, prevCue) {
    const speedBefore = Math.hypot(prevCue.vx, prevCue.vy);
    const speedAfter = Math.hypot(cue.vx, cue.vy);
    if (speedBefore < 0.35) return null;

    const dotPrev = prevCue.vx * cue.vx + prevCue.vy * cue.vy;
    if (dotPrev < speedBefore * speedAfter * 0.35) {
        return { type: 'wall', x: cue.x, y: cue.y };
    }
    return null;
}

function stepCueOnly(cue, obstacles, frameScale) {
    const subDt = frameScale / PHYSICS_SUBSTEPS;
    let ballContact = null;

    for (let step = 0; step < PHYSICS_SUBSTEPS; step++) {
        cue.px = cue.x;
        cue.py = cue.y;
        cue.x += cue.vx * subDt;
        cue.y += cue.vy * subDt;
        cue.advanceRoll(subDt);

        const staticHit = resolveStaticBallCollisions(cue, obstacles);
        if (staticHit) ballContact = staticHit;

        resolveBallCushionCollision(cue, cue.px, cue.py, { applyJitter: false });
        const staticHit2 = resolveStaticBallCollisions(cue, obstacles);
        if (staticHit2) ballContact = staticHit2;

        applyMotionForces(cue, subDt);
        tryPocketBall(cue, subDt * PHYSICS_SUBSTEPS);
    }

    return ballContact;
}

function runCueSimulation(simCue, obstacles) {
    const samples = [{ x: simCue.x, y: simCue.y }];
    let firstContactSampleIdx = -1;
    const cueContacts = [];
    let firstBallHit = null;
    let cueCooldown = 0;

    for (let step = 0; step < MAX_SIM_STEPS; step++) {
        const prevCue = { x: simCue.x, y: simCue.y, vx: simCue.vx, vy: simCue.vy };

        const ballContact = stepCueOnly(simCue, obstacles, 1);
        samples.push({ x: simCue.x, y: simCue.y });

        if (simCue.inPocket || simCue.isPocketing()) break;

        if (cueContacts.length < CUE_MAX_CONTACTS) {
            if (cueCooldown > 0) {
                cueCooldown--;
            } else {
                const contact = ballContact || detectWallBounce(simCue, prevCue);
                if (contact) {
                    contact.vx = simCue.vx;
                    contact.vy = simCue.vy;
                    cueContacts.push(contact);
                    cueCooldown = CONTACT_COOLDOWN_STEPS;

                    if (firstContactSampleIdx < 0) {
                        firstContactSampleIdx = samples.length - 1;
                    }

                    if (contact.type === 'ball' && !firstBallHit) {
                        firstBallHit = contact;
                    }
                }
            }
        }

        if (!simCue.isMoving()) break;
    }

    return {
        samples,
        firstContactSampleIdx,
        cueContacts,
        firstBallHit,
        simCue
    };
}

function unitDir(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len <= MIN_BOUNCE_DRAW) return null;
    return { dx: dx / len, dy: dy / len, len };
}

function sliceSamples(samples, startIdx, endIdx) {
    if (!samples.length) return [];
    const start = Math.max(0, startIdx);
    const end = endIdx < 0 ? samples.length : Math.min(samples.length, endIdx + 1);
    if (end <= start) return samples.slice(start, start + 1);
    return samples.slice(start, end);
}

function buildOffPath(sim, angle) {
    const { samples, firstContactSampleIdx, cueContacts, firstBallHit, simCue } = sim;
    const firstContact = cueContacts[0];
    const contactX = firstContact?.x ?? samples[samples.length - 1]?.x ?? simCue.x;
    const contactY = firstContact?.y ?? samples[samples.length - 1]?.y ?? simCue.y;
    const hitType = firstContact?.type ?? 'none';

    const aimSamples = firstContactSampleIdx >= 0
        ? sliceSamples(samples, 0, firstContactSampleIdx)
        : samples;

    let bounceSamples = [];
    if (firstContactSampleIdx >= 0) {
        bounceSamples = sliceSamples(samples, firstContactSampleIdx, samples.length - 1);
    }

    const stop = samples[samples.length - 1] ?? { x: simCue.x, y: simCue.y };
    const hasBounce = bounceSamples.length >= 2;
    const bounceEnd = bounceSamples[bounceSamples.length - 1];
    const bounceStart = bounceSamples[0] ?? { x: contactX, y: contactY };
    const bounceDir = hasBounce
        ? unitDir(bounceStart.x, bounceStart.y, bounceEnd.x, bounceEnd.y)
        : null;

    let hasTargetLine = false;
    let targetDx = 0;
    let targetDy = 0;
    let targetEndX = contactX;
    let targetEndY = contactY;

    if (firstBallHit?.ball) {
        const speed = Math.hypot(firstBallHit.vx, firstBallHit.vy);
        const dx = speed > MIN_BOUNCE_DRAW ? firstBallHit.vx / speed : Math.cos(angle);
        const dy = speed > MIN_BOUNCE_DRAW ? firstBallHit.vy / speed : Math.sin(angle);
        const bounce = ballBounceDirs(dx, dy, contactX, contactY, firstBallHit.ball);
        if (bounce.targetDir) {
            hasTargetLine = true;
            targetDx = bounce.targetDir.dx;
            targetDy = bounce.targetDir.dy;
            targetEndX = contactX + targetDx * TARGET_PREVIEW_LEN;
            targetEndY = contactY + targetDy * TARGET_PREVIEW_LEN;
        }
    }

    return {
        contactX,
        contactY,
        endX: stop.x,
        endY: stop.y,
        hitType,
        fullSamples: samples,
        firstContactSampleIdx,
        aimSamples,
        bounceSamples,
        stopX: stop.x,
        stopY: stop.y,
        hasBounce,
        bounceDx: bounceDir?.dx ?? 0,
        bounceDy: bounceDir?.dy ?? 0,
        bounceEndX: bounceEnd?.x ?? contactX,
        bounceEndY: bounceEnd?.y ?? contactY,
        hasTargetLine,
        targetDx,
        targetDy,
        targetEndX,
        targetEndY,
        simulated: true
    };
}

export function predictPowerTrajectory(angle, cueBall, balls, options) {
    const { power } = options;

    const simCue = cloneCueBall(cueBall);
    const obstacles = staticObstacles(balls, cueBall);
    applyStrike(simCue, angle, power);

    const sim = runCueSimulation(simCue, obstacles);
    return buildOffPath(sim, angle);
}
