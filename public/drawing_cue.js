import { BALL_RADIUS, CUE_LENGTH, CUE_WIDTH, COLORS } from './constants.js';

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

function drawCueBallGhost(ctx, x, y) {
    const r = BALL_RADIUS;

    ctx.save();
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

export function drawTrajectory(ctx, angle, cueBall, aimX, aimY, path) {
    const startX = cueBall.x + Math.cos(angle) * BALL_RADIUS;
    const startY = cueBall.y + Math.sin(angle) * BALL_RADIUS;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(path.contactX, path.contactY);
    ctx.strokeStyle = COLORS.aimLine;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(path.contactX, path.contactY);
    ctx.lineTo(path.endX, path.endY);
    ctx.strokeStyle = COLORS.aimLineGhost;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (path.hasBounce) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.bounceEndX, path.bounceEndY);
        ctx.strokeStyle = 'rgba(120, 210, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    if (path.hasTargetLine) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.targetEndX, path.targetEndY);
        ctx.strokeStyle = 'rgba(255, 210, 80, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    if (path.hitType === 'ball' || path.hitType === 'wall') {
        drawCueBallGhost(ctx, path.contactX, path.contactY);
    }

    ctx.beginPath();
    ctx.arc(aimX, aimY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}
