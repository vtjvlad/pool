import {
    BALL_RADIUS,
    TRAJECTORY_EXTEND,
    BOUNCE_PREVIEW_LEN,
    MIN_BOUNCE_DRAW,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
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

export function predictCueTrajectory(angle, cueBall, balls) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ox = cueBall.x;
    const oy = cueBall.y;

    const wallHit = rayWallHit(ox, oy, dx, dy, BALL_RADIUS);
    let hitT = wallHit ? wallHit.t : null;
    let hitType = wallHit ? 'wall' : null;
    let hitWall = wallHit ? wallHit.wall : null;
    let hitWallNx = wallHit ? wallHit.nx : 0;
    let hitWallNy = wallHit ? wallHit.ny : 0;
    let hitBall = null;

    for (const ball of balls) {
        if (ball === cueBall || ball.inPocket) continue;
        const t = rayCircleHit(ox, oy, dx, dy, ball.x, ball.y, BALL_RADIUS * 2);
        if (t !== null && (hitT === null || t < hitT)) {
            hitT = t;
            hitType = 'ball';
            hitBall = ball;
            hitWall = null;
        }
    }

    if (hitT === null) {
        hitT = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
        hitType = 'none';
    }

    const contactX = ox + dx * hitT;
    const contactY = oy + dy * hitT;
    const endX = ox + dx * (hitT + TRAJECTORY_EXTEND);
    const endY = oy + dy * (hitT + TRAJECTORY_EXTEND);

    let bounceDx = 0;
    let bounceDy = 0;
    let targetDx = 0;
    let targetDy = 0;
    let hasBounce = false;
    let hasTargetLine = false;

    if (hitType === 'wall' && hitWall) {
        const dot = dx * hitWallNx + dy * hitWallNy;
        bounceDx = dx - 2 * dot * hitWallNx;
        bounceDy = dy - 2 * dot * hitWallNy;
        hasBounce = true;
    } else if (hitType === 'ball' && hitBall) {
        const nx = hitBall.x - contactX;
        const ny = hitBall.y - contactY;
        const len = Math.hypot(nx, ny) || 1;
        const nxu = nx / len;
        const nyu = ny / len;
        const dot = dx * nxu + dy * nyu;
        bounceDx = dx - dot * nxu;
        bounceDy = dy - dot * nyu;
        targetDx = dot * nxu;
        targetDy = dot * nyu;
        const bl = Math.hypot(bounceDx, bounceDy);
        if (bl > MIN_BOUNCE_DRAW) {
            bounceDx /= bl;
            bounceDy /= bl;
            hasBounce = true;
        }
        const tl = Math.hypot(targetDx, targetDy);
        if (tl > MIN_BOUNCE_DRAW) {
            targetDx /= tl;
            targetDy /= tl;
            hasTargetLine = true;
        }
    }

    return {
        contactX, contactY, endX, endY, hitType,
        hasBounce, bounceDx, bounceDy,
        bounceEndX: contactX + bounceDx * BOUNCE_PREVIEW_LEN,
        bounceEndY: contactY + bounceDy * BOUNCE_PREVIEW_LEN,
        hasTargetLine, targetDx, targetDy,
        targetEndX: contactX + targetDx * BOUNCE_PREVIEW_LEN,
        targetEndY: contactY + targetDy * BOUNCE_PREVIEW_LEN
    };
}
