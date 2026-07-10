/**
 * LEGACY — Canvas 2D отрисовка.
 * Заменён: public/render/drawing_cue.js
 * Дата переноса: 2026-07-10
 */
import {
    BALL_RADIUS,
    CUE_LENGTH,
    CUE_WIDTH,
    COLORS,
    BOUNCE_PREVIEW_LEN_GHOST,
    OFF_TARGET_PREVIEW_LEN
} from './constants.js';

function taperedSegmentPath(ctx, x0, x1, halfW0, halfW1) {
    ctx.beginPath();
    ctx.moveTo(x0, -halfW0);
    ctx.lineTo(x1, -halfW1);
    ctx.lineTo(x1, halfW1);
    ctx.lineTo(x0, halfW0);
    ctx.closePath();
}

function fillTaperedSegment(ctx, x0, x1, halfW0, halfW1, fillStyle) {
    taperedSegmentPath(ctx, x0, x1, halfW0, halfW1);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function strokeTaperedSegment(ctx, x0, x1, halfW0, halfW1, strokeStyle, lineWidth) {
    taperedSegmentPath(ctx, x0, x1, halfW0, halfW1);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

function drawCueWoodGrain(ctx, x0, x1, halfW) {
    const span = x1 - x0;
    if (span < 8) return;

    ctx.save();
    taperedSegmentPath(ctx, x0, x1, halfW * 0.92, halfW * 1.02);
    ctx.clip();

    const grainCount = Math.max(6, Math.floor(span / 24));
    for (let i = 0; i < grainCount; i++) {
        const t = (i + 0.5) / grainCount;
        const gx = x0 + span * t;
        const wave = Math.sin(t * Math.PI * 3.6) * halfW * 0.2;
        ctx.beginPath();
        ctx.moveTo(gx, -halfW * 0.75 + wave);
        ctx.lineTo(gx + span * 0.07, halfW * 0.75 + wave * 0.35);
        ctx.strokeStyle = 'rgba(58, 32, 8, 0.14)';
        ctx.lineWidth = 0.55;
        ctx.stroke();
    }
    ctx.restore();
}

function drawCueWrapTexture(ctx, x0, x1, halfW) {
    ctx.save();
    taperedSegmentPath(ctx, x0, x1, halfW * 0.96, halfW * 1.04);
    ctx.clip();

    const rings = Math.max(6, Math.floor((x1 - x0) / 6.5));
    for (let i = 0; i <= rings; i++) {
        const t = i / rings;
        const rx = x0 + (x1 - x0) * t;
        const rw = halfW * (0.9 + t * 0.16);
        ctx.beginPath();
        ctx.moveTo(rx, -rw);
        ctx.lineTo(rx, rw);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 0, 0, 0.32)' : 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 0.65;
        ctx.stroke();
    }

    const diamonds = Math.max(3, Math.floor((x1 - x0) / 22));
    for (let i = 0; i < diamonds; i++) {
        const t = (i + 0.5) / diamonds;
        const dx = x0 + (x1 - x0) * t;
        const ds = halfW * 0.22;
        ctx.beginPath();
        ctx.moveTo(dx, -ds);
        ctx.lineTo(dx + ds * 0.7, 0);
        ctx.lineTo(dx, ds);
        ctx.lineTo(dx - ds * 0.7, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(196, 30, 58, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 220, 180, 0.18)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
    }
    ctx.restore();
}

function drawMetalRing(ctx, x, halfW0, halfW1, width = 3) {
    const ringGrad = ctx.createLinearGradient(0, -halfW1, 0, halfW1);
    ringGrad.addColorStop(0, COLORS.metalLight);
    ringGrad.addColorStop(0.4, COLORS.metalBase);
    ringGrad.addColorStop(0.75, COLORS.metalDark);
    ringGrad.addColorStop(1, 'rgba(255,255,255,0.35)');
    fillTaperedSegment(ctx, x, x + width, halfW0, halfW1, ringGrad);
    strokeTaperedSegment(ctx, x, x + width, halfW0, halfW1, 'rgba(255,255,255,0.28)', 0.45);
}

function drawButtJewel(ctx, x, halfW) {
    const r = halfW * 0.42;
    const jewelGrad = ctx.createRadialGradient(x - r * 0.25, -r * 0.25, r * 0.1, x, 0, r);
    jewelGrad.addColorStop(0, '#ff6b8a');
    jewelGrad.addColorStop(0.45, '#c41e3a');
    jewelGrad.addColorStop(0.85, '#6b0f1f');
    jewelGrad.addColorStop(1, '#2a0810');
    ctx.beginPath();
    ctx.arc(x, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = jewelGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 220, 200, 0.45)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - r * 0.28, -r * 0.28, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
}

export function drawCueStick(ctx, tipX, tipY, angle) {
    const len = CUE_LENGTH;
    const tipHalf = CUE_WIDTH * 0.27;
    const ferruleHalf = CUE_WIDTH * 0.35;
    const shaftHalf = CUE_WIDTH * 0.44;
    const wrapHalf = CUE_WIDTH * 0.52;
    const buttHalf = CUE_WIDTH * 0.62;

    const tipLen = 10;
    const ferruleLen = 15;
    const ferruleStart = tipLen;
    const ferruleEnd = ferruleStart + ferruleLen;
    const wrapStart = len * 0.64;
    const wrapEnd = len * 0.88;
    const buttStart = wrapEnd;
    const jewelX = len - 5;

    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle + Math.PI);

    ctx.save();
    ctx.translate(4, 3);
    ctx.globalAlpha = 0.18;
    taperedSegmentPath(ctx, 0, len, tipHalf, buttHalf);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.globalAlpha = 0.08;
    taperedSegmentPath(ctx, 2, len + 2, tipHalf * 0.9, buttHalf * 0.95);
    ctx.fill();
    ctx.restore();

    const tipGrad = ctx.createLinearGradient(0, -tipHalf, 0, tipHalf);
    tipGrad.addColorStop(0, '#8ed8ff');
    tipGrad.addColorStop(0.4, '#4db5e8');
    tipGrad.addColorStop(0.75, '#2a8ec4');
    tipGrad.addColorStop(1, '#1a6a96');
    fillTaperedSegment(ctx, 0, ferruleStart, tipHalf * 0.8, tipHalf, tipGrad);

    const ferruleGrad = ctx.createLinearGradient(0, -ferruleHalf, 0, ferruleHalf);
    ferruleGrad.addColorStop(0, COLORS.metalLight);
    ferruleGrad.addColorStop(0.3, COLORS.metalBase);
    ferruleGrad.addColorStop(0.65, COLORS.metalDark);
    ferruleGrad.addColorStop(1, COLORS.metalEdge);
    fillTaperedSegment(ctx, ferruleStart, ferruleEnd, tipHalf, ferruleHalf, ferruleGrad);
    drawMetalRing(ctx, ferruleEnd - 2.5, ferruleHalf * 0.98, ferruleHalf, 2.5);

    const woodGrad = ctx.createLinearGradient(0, -shaftHalf, 0, shaftHalf);
    woodGrad.addColorStop(0, '#b8844a');
    woodGrad.addColorStop(0.22, COLORS.cueStick);
    woodGrad.addColorStop(0.48, '#f8e8c8');
    woodGrad.addColorStop(0.72, '#e0c090');
    woodGrad.addColorStop(1, COLORS.cueStickDark);
    fillTaperedSegment(ctx, ferruleEnd, wrapStart, ferruleHalf, shaftHalf, woodGrad);
    drawCueWoodGrain(ctx, ferruleEnd + 8, wrapStart - 6, shaftHalf);

    const wrapGrad = ctx.createLinearGradient(0, -wrapHalf, 0, wrapHalf);
    wrapGrad.addColorStop(0, '#2a2218');
    wrapGrad.addColorStop(0.35, '#12100e');
    wrapGrad.addColorStop(0.65, '#0a0908');
    wrapGrad.addColorStop(1, '#302820');
    fillTaperedSegment(ctx, wrapStart, wrapEnd, shaftHalf, wrapHalf, wrapGrad);
    drawCueWrapTexture(ctx, wrapStart, wrapEnd, wrapHalf);
    drawMetalRing(ctx, wrapStart - 1.5, shaftHalf * 1.02, shaftHalf * 1.04, 2);
    drawMetalRing(ctx, wrapEnd - 1, wrapHalf * 1.02, wrapHalf * 1.04, 2);

    const buttGrad = ctx.createLinearGradient(0, -buttHalf, 0, buttHalf);
    buttGrad.addColorStop(0, '#9a6838');
    buttGrad.addColorStop(0.35, COLORS.woodLight);
    buttGrad.addColorStop(0.7, '#c99552');
    buttGrad.addColorStop(1, COLORS.woodDark);
    fillTaperedSegment(ctx, buttStart, len, wrapHalf, buttHalf, buttGrad);
    drawButtJewel(ctx, jewelX, buttHalf);

    ctx.save();
    taperedSegmentPath(ctx, ferruleEnd, wrapStart, ferruleHalf * 0.5, shaftHalf * 0.5);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(ferruleEnd + 6, -shaftHalf * 0.32);
    ctx.lineTo(len * 0.52, -shaftHalf * 0.32);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ferruleEnd + 20, shaftHalf * 0.18);
    ctx.lineTo(len * 0.45, shaftHalf * 0.18);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();

    taperedSegmentPath(ctx, 0, len, tipHalf, buttHalf);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, tipHalf * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#6ec8f0';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.4;
    ctx.stroke();

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

export function getCueTipPosition(cueBall, angle, pullBack, spinOffsetX = 0, spinOffsetY = 0) {
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
