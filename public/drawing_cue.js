import { 
    BALL_RADIUS, 
    CUE_LENGTH, 
    CUE_WIDTH, 
    POCKET_OPENING 
} from './constants.js';

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

export function drawTrajectory(ctx, angle, cueBall, aimX, aimY, path) {
    const startX = cueBall.x + Math.cos(angle) * BALL_RADIUS;
    const startY = cueBall.y + Math.sin(angle) * BALL_RADIUS;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(path.contactX, path.contactY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(path.contactX, path.contactY);
    ctx.lineTo(path.endX, path.endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (path.hasBounce) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.bounceEndX, path.bounceEndY);
        ctx.strokeStyle = 'rgba(120, 210, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (path.hasTargetLine) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.targetEndX, path.targetEndY);
        ctx.strokeStyle = 'rgba(255, 210, 80, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(aimX, aimY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}
