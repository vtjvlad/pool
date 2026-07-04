import { 
    BALL_RADIUS, 
    CUE_LENGTH, 
    CUE_WIDTH, 
    MAX_PULL, 
    POWER_FACTOR, 
    STRIKE_ANIM_BASE_MS, 
    IMPACT_FLASH_MS, 
    TRAJECTORY_EXTEND, 
    BOUNCE_PREVIEW_LEN, 
    MIN_BOUNCE_DRAW,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
} from './constants.js';
import { rayCushionHit } from './cushion_physics.js';

export function drawCueStick(ctx, tipX, tipY, angle) {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle + Math.PI);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(2, -CUE_WIDTH / 2 + 2, CUE_LENGTH, CUE_WIDTH);

    const bodyGrad = ctx.createLinearGradient(0, -CUE_WIDTH / 2, 0, CUE_WIDTH / 2);
    bodyGrad.addColorStop(0, '#deb887');
    bodyGrad.addColorStop(0.5, '#f5deb3');
    bodyGrad.addColorStop(1, '#a0724a');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(0, -CUE_WIDTH / 2, CUE_LENGTH, CUE_WIDTH);

    ctx.fillStyle = '#111';
    ctx.fillRect(CUE_LENGTH * 0.7, -CUE_WIDTH / 2 - 1, CUE_LENGTH * 0.22, CUE_WIDTH + 2);

    const tipLen = 12;
    ctx.fillStyle = '#4aa3d8';
    ctx.fillRect(-tipLen, -CUE_WIDTH / 2 + 1, tipLen, CUE_WIDTH - 2);
    ctx.restore();
}

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
    const cushionHit = rayCushionHit(ox, oy, dx, dy, radius);
    if (cushionHit) {
        return { t: cushionHit.t, wall: 'cushion', nx: cushionHit.nx, ny: cushionHit.ny };
    }
    return null;
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
        if (wallHit && wallHit.nx != null) {
            const dot = dx * wallHit.nx + dy * wallHit.ny;
            bounceDx = dx - 2 * dot * wallHit.nx;
            bounceDy = dy - 2 * dot * wallHit.ny;
        } else {
            bounceDx = hitWall === 'left' || hitWall === 'right' ? -dx : dx;
            bounceDy = hitWall === 'top' || hitWall === 'bottom' ? -dy : dy;
        }
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
