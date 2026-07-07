import {
    BALL_RADIUS,
    CUE_LENGTH,
    CUE_WIDTH,
    COLORS,
    BOUNCE_PREVIEW_LEN_GHOST
} from './constants.js';

export function drawCueStick(ctx, tipX, tipY, angle) {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle + Math.PI);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(2, -CUE_WIDTH / 2 + 2, CUE_LENGTH, CUE_WIDTH);

    const bodyGrad = ctx.createLinearGradient(0, -CUE_WIDTH / 2, 0, CUE_WIDTH / 2);
    bodyGrad.addColorStop(0, COLORS.cueStick);
    bodyGrad.addColorStop(0.5, '#f5deb3');
    bodyGrad.addColorStop(1, COLORS.cueStickDark);
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(0, -CUE_WIDTH / 2, CUE_LENGTH, CUE_WIDTH);

    ctx.fillStyle = '#111';
    ctx.fillRect(CUE_LENGTH * 0.7, -CUE_WIDTH / 2 - 1, CUE_LENGTH * 0.22, CUE_WIDTH + 2);

    const tipLen = 12;
    ctx.fillStyle = '#4aa3d8';
    ctx.fillRect(-tipLen, -CUE_WIDTH / 2 + 1, tipLen, CUE_WIDTH - 2);
    ctx.restore();
}

export function drawSpinMark(ctx, cueBall, aimAngle, spinOffsetX, spinOffsetY) {
    if (Math.abs(spinOffsetX) < 0.04 && Math.abs(spinOffsetY) < 0.04) return;

    const r = BALL_RADIUS;
    const perpX = -Math.sin(aimAngle);
    const perpY = Math.cos(aimAngle);
    const backX = -Math.cos(aimAngle);
    const backY = -Math.sin(aimAngle);
    const mx = cueBall.x + backX * r + perpX * spinOffsetX * r * 0.9 + backX * spinOffsetY * r * 0.35;
    const my = cueBall.y + backY * r + perpY * spinOffsetX * r * 0.9 + backY * spinOffsetY * r * 0.35;

    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = '#2a8aff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
}

export function getCueTipPosition(cueBall, angle, pullBack, spinOffsetX, spinOffsetY) {
    const r = BALL_RADIUS;
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const backX = -Math.cos(angle);
    const backY = -Math.sin(angle);
    const contactX = cueBall.x + backX * r + perpX * spinOffsetX * r * 0.9 + backX * spinOffsetY * r * 0.35;
    const contactY = cueBall.y + backY * r + perpY * spinOffsetX * r * 0.9 + backY * spinOffsetY * r * 0.35;
    const tipOffset = 2 + pullBack;
    return {
        x: contactX - Math.cos(angle) * tipOffset,
        y: contactY - Math.sin(angle) * tipOffset
    };
}

function drawCueBallGhost(ctx, x, y, alpha = 1) {
    const r = BALL_RADIUS;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + r * 0.35, y, r * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(196, 30, 58, 0.55)';
    ctx.fill();
    ctx.restore();
}

function drawObjectBallGhost(ctx, ball) {
    const r = BALL_RADIUS;
    const { x, y, color, ballType } = ball;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (ballType === 'stripe') {
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.fill();
    }

    ctx.restore();
}

function drawHitBallGhosts(ctx, path, showTargetGhost = true) {
    if (path.hitType === 'ball' || path.hitType === 'wall') {
        drawCueBallGhost(ctx, path.contactX, path.contactY);
    }
    if (showTargetGhost && path.hitType === 'ball' && path.hitBall) {
        drawObjectBallGhost(ctx, path.hitBall);
    }
}

function strokeLine(ctx, x1, y1, x2, y2, color, width, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
}

function drawOffTrajectory(ctx, startX, startY, path) {
    const bounceLen = BOUNCE_PREVIEW_LEN_GHOST;

    strokeLine(ctx, startX, startY, path.contactX, path.contactY, COLORS.aimLine, 1.5);
    strokeLine(ctx, path.contactX, path.contactY, path.endX, path.endY, COLORS.aimLineGhost, 1);

    if (path.hasBounce) {
        strokeLine(
            ctx,
            path.contactX,
            path.contactY,
            path.contactX + path.bounceDx * bounceLen,
            path.contactY + path.bounceDy * bounceLen,
            'rgba(120, 210, 255, 0.8)',
            1.5
        );
    }

    if (path.hasTargetLine) {
        strokeLine(
            ctx,
            path.contactX,
            path.contactY,
            path.contactX + path.targetDx * bounceLen,
            path.contactY + path.targetDy * bounceLen,
            'rgba(255, 210, 80, 0.75)',
            1.2
        );
    }

    drawHitBallGhosts(ctx, path, false);
}

function segmentAlpha(index, total) {
    if (total <= 1) return 1;
    return 0.45 + (0.55 * (total - index)) / total;
}

function drawOnTrajectory(ctx, startX, startY, path) {
    const cueSegments = path.cueSegments ?? [];
    const targetSegments = path.targetSegments ?? [];

    if (cueSegments.length > 0) {
        const first = cueSegments[0];
        strokeLine(ctx, startX, startY, first.x2, first.y2, COLORS.aimLine, 1.5);
        for (let i = 1; i < cueSegments.length; i++) {
            const seg = cueSegments[i];
            strokeLine(
                ctx,
                seg.x1,
                seg.y1,
                seg.x2,
                seg.y2,
                'rgba(120, 210, 255, 0.85)',
                1.4,
                segmentAlpha(i, cueSegments.length)
            );
        }
    }

    for (let i = 0; i < targetSegments.length; i++) {
        const seg = targetSegments[i];
        strokeLine(
            ctx,
            seg.x1,
            seg.y1,
            seg.x2,
            seg.y2,
            'rgba(255, 210, 80, 0.8)',
            1.2,
            segmentAlpha(i, targetSegments.length)
        );
    }

    drawHitBallGhosts(ctx, path);
}

export function drawTrajectory(ctx, angle, cueBall, aimX, aimY, path, variant = 'off') {
    const startX = cueBall.x + Math.cos(angle) * BALL_RADIUS;
    const startY = cueBall.y + Math.sin(angle) * BALL_RADIUS;

    ctx.save();
    if (variant === 'on') {
        drawOnTrajectory(ctx, startX, startY, path);
    } else {
        drawOffTrajectory(ctx, startX, startY, path);
    }

    ctx.beginPath();
    ctx.arc(aimX, aimY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}
