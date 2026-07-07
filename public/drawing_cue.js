import {
    BALL_RADIUS,
    CUE_LENGTH,
    CUE_WIDTH,
    COLORS,
    BOUNCE_PREVIEW_LEN_GHOST,
    OFF_TARGET_PREVIEW_LEN
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

export function getCueTipPosition(cueBall, angle, pullBack) {
    const r = BALL_RADIUS;
    const backX = -Math.cos(angle);
    const backY = -Math.sin(angle);
    const contactX = cueBall.x + backX * r;
    const contactY = cueBall.y + backY * r;
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
    } else if (path.simulated && path.hitType === 'none') {
        drawCueBallGhost(ctx, path.stopX, path.stopY);
    }
    if (showTargetGhost && path.hitType === 'ball' && path.hitBall) {
        drawObjectBallGhost(ctx, path.hitBall);
    }
}

function strokeLine(ctx, x1, y1, x2, y2, color, width, alpha = 1, dash = null) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    ctx.restore();
}

/** Пунктир после 2-го касания: с каждым сегментом штрихи реже */
function sparseDashPattern(step) {
    const dash = Math.max(2, 5 - step);
    const gap = 6 + step * 6;
    return [dash, gap];
}

function dashForOnSegment(segmentIndex) {
    if (segmentIndex < 2) return null;
    return sparseDashPattern(segmentIndex - 2);
}

function decimatePoints(points, minDist = 2.5) {
    if (points.length <= 2) return points;
    const out = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const prev = out[out.length - 1];
        if (Math.hypot(points[i].x - prev.x, points[i].y - prev.y) >= minDist || i === points.length - 1) {
            out.push(points[i]);
        }
    }
    return out;
}

function strokePolyline(ctx, points, color, width) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
}

function drawSimulatedAimPath(ctx, startX, startY, path) {
    const samples = decimatePoints(path.fullSamples ?? path.aimSamples ?? []);
    if (samples.length < 1) return;

    const splitAt = path.firstContactSampleIdx ?? -1;
    const hasContact = splitAt >= 0 && path.hitType !== 'none';

    if (hasContact && splitAt < samples.length - 1) {
        const aimPts = [{ x: startX, y: startY }, ...samples.slice(1, splitAt + 1)];
        const bouncePts = samples.slice(splitAt);
        if (aimPts.length >= 2) {
            strokePolyline(ctx, aimPts, COLORS.aimLine, 1.5);
        }
        if (bouncePts.length >= 2) {
            strokePolyline(ctx, bouncePts, 'rgba(120, 210, 255, 0.8)', 1.5);
        }
        return;
    }

    const linePts = [{ x: startX, y: startY }, ...samples.slice(1)];
    if (linePts.length >= 2) {
        strokePolyline(ctx, linePts, COLORS.aimLine, 1.5);
    }
}

function drawOffTrajectory(ctx, startX, startY, path) {
    const bounceLen = BOUNCE_PREVIEW_LEN_GHOST;

    if (path.simulated && (path.fullSamples?.length || path.aimSamples?.length)) {
        drawSimulatedAimPath(ctx, startX, startY, path);

        if (path.hasTargetLine) {
            const tx = path.targetEndX ?? path.contactX + path.targetDx * bounceLen;
            const ty = path.targetEndY ?? path.contactY + path.targetDy * bounceLen;
            strokeLine(
                ctx,
                path.contactX,
                path.contactY,
                tx,
                ty,
                'rgba(255, 210, 80, 0.75)',
                1.2
            );
        }

        drawHitBallGhosts(ctx, path, false);
        return;
    }

    strokeLine(ctx, startX, startY, path.contactX, path.contactY, COLORS.aimLine, 1.5);
    strokeLine(ctx, path.contactX, path.contactY, path.endX, path.endY, COLORS.aimLineGhost, 1);

    if (path.hasBounce) {
        const bx = path.bounceEndX ?? path.contactX + path.bounceDx * bounceLen;
        const by = path.bounceEndY ?? path.contactY + path.bounceDy * bounceLen;
        strokeLine(
            ctx,
            path.contactX,
            path.contactY,
            bx,
            by,
            'rgba(120, 210, 255, 0.8)',
            1.5
        );
    }

    if (path.hasTargetLine) {
        const sx = path.targetStartX ?? path.contactX;
        const sy = path.targetStartY ?? path.contactY;
        const tx = path.targetEndX ?? sx + path.targetDx * OFF_TARGET_PREVIEW_LEN;
        const ty = path.targetEndY ?? sy + path.targetDy * OFF_TARGET_PREVIEW_LEN;
        strokeLine(
            ctx,
            sx,
            sy,
            tx,
            ty,
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

function drawOnTrajectory(ctx, startX, startY, path, variant = 'on') {
    const cueSegments = path.cueSegments ?? [];
    const targetSegments = path.targetSegments ?? [];
    const useSparseDash = variant === 'on';

    if (cueSegments.length > 0) {
        const first = cueSegments[0];
        strokeLine(ctx, startX, startY, first.x2, first.y2, COLORS.aimLine, 1.5);
        for (let i = 1; i < cueSegments.length; i++) {
            const seg = cueSegments[i];
            const dash = useSparseDash ? dashForOnSegment(i) : null;
            strokeLine(
                ctx,
                seg.x1,
                seg.y1,
                seg.x2,
                seg.y2,
                'rgba(120, 210, 255, 0.85)',
                1.4,
                segmentAlpha(i, cueSegments.length),
                dash
            );
        }
    }

    for (let i = 0; i < targetSegments.length; i++) {
        const seg = targetSegments[i];
        const dash = useSparseDash ? dashForOnSegment(i) : null;
        strokeLine(
            ctx,
            seg.x1,
            seg.y1,
            seg.x2,
            seg.y2,
            'rgba(255, 210, 80, 0.8)',
            1.2,
            segmentAlpha(i, targetSegments.length),
            dash
        );
    }

    drawHitBallGhosts(ctx, path);
}

export function drawTrajectory(ctx, angle, cueBall, aimX, aimY, path, variant = 'off', modifierEnabled = false) {
    const startX = cueBall.x + Math.cos(angle) * BALL_RADIUS;
    const startY = cueBall.y + Math.sin(angle) * BALL_RADIUS;

    ctx.save();
    if (variant === 'off') {
        drawOffTrajectory(ctx, startX, startY, path);
    } else {
        drawOnTrajectory(ctx, startX, startY, path, variant);
    }

    ctx.beginPath();
    ctx.arc(aimX, aimY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}
