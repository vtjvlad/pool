import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, POCKET_RADIUS, POCKET_MAGNET_RADIUS, DEBUG_DRAW_POCKET_MAGNET, DEBUG_DRAW_RUBBER } from './constants.js';
import { drawCushionSegments, drawCornerBehindSegments } from './cushions.js';
import { drawRubberGums } from './cushion_rubber.js';
import { getHeadSpot, getFootSpot, getPockets, getPlaySurface } from './utils.js';

function drawPocketCavity(ctx, x, y) {
    const r = POCKET_RADIUS;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.75, COLORS.pocket);
    grad.addColorStop(1, COLORS.pocketRim);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
}

function cutPocketHole(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, POCKET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
}

function drawPocketMagnetDebug(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 70, 180, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    for (const pocket of getPockets()) {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_MAGNET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
}

export function drawTable(ctx) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    getPockets().forEach(p => drawPocketCavity(ctx, p.x, p.y));

    const surface = getPlaySurface();
    const felt = ctx.createLinearGradient(0, surface.top, 0, surface.bottom);
    felt.addColorStop(0, COLORS.feltLight);
    felt.addColorStop(0.5, COLORS.felt);
    felt.addColorStop(1, COLORS.feltDark);
    ctx.fillStyle = felt;
    ctx.fillRect(surface.left, surface.top, surface.width, surface.height);

    drawCushionSegments(ctx);
    drawCornerBehindSegments(ctx);
    if (DEBUG_DRAW_RUBBER) {
        drawRubberGums(ctx);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    getPockets().forEach(p => cutPocketHole(ctx, p.x, p.y));
    ctx.restore();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    getPockets().forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    });

    const baulk = surface.left + surface.width * 0.25;
    ctx.strokeStyle = COLORS.baulkLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baulk, surface.top + 2);
    ctx.lineTo(baulk, surface.bottom - 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.baulkLine;
    [getHeadSpot(), getFootSpot()].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });

    if (DEBUG_DRAW_POCKET_MAGNET) {
        drawPocketMagnetDebug(ctx);
    }
}
