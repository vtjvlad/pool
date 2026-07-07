import {
    BALL_RADIUS,
    TRAJECTORY_EXTEND,
    BOUNCE_PREVIEW_LEN,
    MIN_BOUNCE_DRAW,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BALL_BOUNCE,
    BALL_SURFACE_FRICTION,
    CUSHION_BOUNCE,
    CUSHION_TANGENTIAL_DAMPING,
    EXTENDED_CUE_MAX_CONTACTS,
    EXTENDED_TARGET_MAX_CONTACTS,
    MAX_CUE_MAX_CONTACTS,
    MAX_TARGET_MAX_CONTACTS
} from './constants.js';
import { rayCushionHit } from './cushion_collision.js';

export function rayCircleHit(ox, oy, dx, dy, cx, cy, hitRadius) {
    const fx = ox - cx;
    const fy = oy - cy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - hitRadius * hitRadius;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / 2;
    const t2 = (-b + sqrtDisc) / 2;
    if (t1 > 0.001) return t1;
    if (t2 > 0.001) return t2;
    return null;
}

export function rayWallHit(ox, oy, dx, dy, radius) {
    const hit = rayCushionHit(ox, oy, dx, dy, radius);
    if (!hit) return null;

    const absNx = Math.abs(hit.nx);
    const absNy = Math.abs(hit.ny);
    let wall;

    if (absNy > absNx) {
        wall = hit.ny > 0 ? 'top' : 'bottom';
    } else {
        wall = hit.nx > 0 ? 'left' : 'right';
    }

    return { t: hit.t, wall, nx: hit.nx, ny: hit.ny };
}

function findFirstHit(ox, oy, dx, dy, balls, excludeBalls) {
    const wallHit = rayWallHit(ox, oy, dx, dy, BALL_RADIUS);
    let hitT = wallHit ? wallHit.t : null;
    let hitType = wallHit ? 'wall' : null;
    let hitWallNx = wallHit ? wallHit.nx : 0;
    let hitWallNy = wallHit ? wallHit.ny : 0;
    let hitBall = null;

    for (const ball of balls) {
        if (excludeBalls.has(ball) || ball.inPocket) continue;
        const t = rayCircleHit(ox, oy, dx, dy, ball.x, ball.y, BALL_RADIUS * 2);
        if (t !== null && (hitT === null || t < hitT)) {
            hitT = t;
            hitType = 'ball';
            hitBall = ball;
        }
    }

    if (hitT === null) {
        hitT = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
        hitType = 'none';
    }

    return { t: hitT, type: hitType, hitBall, hitWallNx, hitWallNy };
}

function wallBounceDir(dx, dy, nx, ny) {
    const dot = dx * nx + dy * ny;
    let bounceDx = dx - (1 + CUSHION_BOUNCE) * dot * nx;
    let bounceDy = dy - (1 + CUSHION_BOUNCE) * dot * ny;
    const tx = -ny;
    const ty = nx;
    const vTan = bounceDx * tx + bounceDy * ty;
    bounceDx -= vTan * CUSHION_TANGENTIAL_DAMPING * tx;
    bounceDy -= vTan * CUSHION_TANGENTIAL_DAMPING * ty;
    const len = Math.hypot(bounceDx, bounceDy);
    if (len <= MIN_BOUNCE_DRAW) return null;
    return { dx: bounceDx / len, dy: bounceDy / len };
}

export function ballBounceDirs(dx, dy, contactX, contactY, hitBall) {
    const nx = hitBall.x - contactX;
    const ny = hitBall.y - contactY;
    const len = Math.hypot(nx, ny) || 1;
    const nxu = nx / len;
    const nyu = ny / len;
    const dot = dx * nxu + dy * nyu;
    let cueDx = dx - (1 + BALL_BOUNCE) * 0.5 * dot * nxu;
    let cueDy = dy - (1 + BALL_BOUNCE) * 0.5 * dot * nyu;
    const tx = -nyu;
    const ty = nxu;
    const vTan = cueDx * tx + cueDy * ty;
    cueDx -= vTan * BALL_SURFACE_FRICTION * tx;
    cueDy -= vTan * BALL_SURFACE_FRICTION * ty;
    let targetDx = (1 + BALL_BOUNCE) * 0.5 * dot * nxu;
    let targetDy = (1 + BALL_BOUNCE) * 0.5 * dot * nyu;

    let cueDir = null;
    const cueLen = Math.hypot(cueDx, cueDy);
    if (cueLen > MIN_BOUNCE_DRAW) {
        cueDir = { dx: cueDx / cueLen, dy: cueDy / cueLen };
    }

    let targetDir = null;
    const targetLen = Math.hypot(targetDx, targetDy);
    if (targetLen > MIN_BOUNCE_DRAW) {
        targetDir = { dx: targetDx / targetLen, dy: targetDy / targetLen };
    }

    return { cueDir, targetDir };
}

function traceBallPath(ox, oy, dirX, dirY, balls, excludeBalls, maxSegments) {
    const segments = [];
    const contacts = [];
    let x = ox;
    let y = oy;
    let dx = dirX;
    let dy = dirY;
    const excluded = new Set(excludeBalls);
    let firstBallHit = null;

    for (let step = 0; step < maxSegments; step++) {
        const hit = findFirstHit(x, y, dx, dy, balls, excluded);
        const cx = x + dx * hit.t;
        const cy = y + dy * hit.t;
        segments.push({ x1: x, y1: y, x2: cx, y2: cy });

        if (hit.type === 'none') break;

        contacts.push({ x: cx, y: cy, type: hit.type });

        if (hit.type === 'wall') {
            const bounce = wallBounceDir(dx, dy, hit.hitWallNx, hit.hitWallNy);
            if (!bounce) break;
            x = cx;
            y = cy;
            dx = bounce.dx;
            dy = bounce.dy;
            continue;
        }

        const bounce = ballBounceDirs(dx, dy, cx, cy, hit.hitBall);
        if (!firstBallHit) {
            firstBallHit = {
                ball: hit.hitBall,
                contactX: cx,
                contactY: cy,
                targetDir: bounce.targetDir
            };
        }
        excluded.add(hit.hitBall);
        if (!bounce.cueDir) break;
        x = cx;
        y = cy;
        dx = bounce.cueDir.dx;
        dy = bounce.cueDir.dy;
    }

    return { segments, contacts, firstBallHit };
}

function hitBallPreview(ball, x, y) {
    if (!ball) return null;
    return {
        x,
        y,
        color: ball.color,
        ballType: ball.ballType
    };
}

export function predictCueTrajectory(angle, cueBall, balls) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ox = cueBall.x;
    const oy = cueBall.y;
    const hit = findFirstHit(ox, oy, dx, dy, balls, new Set([cueBall]));

    const contactX = ox + dx * hit.t;
    const contactY = oy + dy * hit.t;
    const endX = ox + dx * (hit.t + TRAJECTORY_EXTEND);
    const endY = oy + dy * (hit.t + TRAJECTORY_EXTEND);

    let bounceDx = 0;
    let bounceDy = 0;
    let targetDx = 0;
    let targetDy = 0;
    let hasBounce = false;
    let hasTargetLine = false;

    if (hit.type === 'wall') {
        const bounce = wallBounceDir(dx, dy, hit.hitWallNx, hit.hitWallNy);
        if (bounce) {
            bounceDx = bounce.dx;
            bounceDy = bounce.dy;
            hasBounce = true;
        }
    } else if (hit.type === 'ball' && hit.hitBall) {
        const bounce = ballBounceDirs(dx, dy, contactX, contactY, hit.hitBall);
        if (bounce.cueDir) {
            bounceDx = bounce.cueDir.dx;
            bounceDy = bounce.cueDir.dy;
            hasBounce = true;
        }
        if (bounce.targetDir) {
            targetDx = bounce.targetDir.dx;
            targetDy = bounce.targetDir.dy;
            hasTargetLine = true;
        }
    }

    return {
        contactX,
        contactY,
        endX,
        endY,
        hitType: hit.type,
        hasBounce,
        bounceDx,
        bounceDy,
        bounceEndX: contactX + bounceDx * BOUNCE_PREVIEW_LEN,
        bounceEndY: contactY + bounceDy * BOUNCE_PREVIEW_LEN,
        hasTargetLine,
        targetDx,
        targetDy,
        targetEndX: contactX + targetDx * BOUNCE_PREVIEW_LEN,
        targetEndY: contactY + targetDy * BOUNCE_PREVIEW_LEN
    };
}

export function predictExtendedCueTrajectory(angle, cueBall, balls, limits = {}) {
    const cueMaxContacts = limits.cueMaxContacts ?? EXTENDED_CUE_MAX_CONTACTS;
    const targetMaxContacts = limits.targetMaxContacts ?? EXTENDED_TARGET_MAX_CONTACTS;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const cueTrace = traceBallPath(cueBall.x, cueBall.y, dx, dy, balls, [cueBall], cueMaxContacts);

    let targetSegments = [];
    let targetContacts = [];

    if (cueTrace.firstBallHit?.targetDir) {
        const { ball, targetDir } = cueTrace.firstBallHit;
        const targetTrace = traceBallPath(
            ball.x,
            ball.y,
            targetDir.dx,
            targetDir.dy,
            balls,
            [cueBall, ball],
            targetMaxContacts
        );
        targetSegments = targetTrace.segments;
        targetContacts = targetTrace.contacts;
    }

    const first = cueTrace.segments[0];
    const contactX = first ? first.x2 : cueBall.x + dx * TRAJECTORY_EXTEND;
    const contactY = first ? first.y2 : cueBall.y + dy * TRAJECTORY_EXTEND;

    let hitBall = null;
    if (cueTrace.firstBallHit && targetContacts.length >= 1) {
        const { ball } = cueTrace.firstBallHit;
        const firstContact = targetContacts[0];
        hitBall = hitBallPreview(ball, firstContact.x, firstContact.y);
    }

    return {
        contactX,
        contactY,
        hitType: cueTrace.contacts[0]?.type ?? 'none',
        hitBall,
        cueSegments: cueTrace.segments,
        cueContacts: cueTrace.contacts,
        targetSegments,
        targetContacts
    };
}
