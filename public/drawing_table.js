import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, DEBUG_DRAW_RUBBER } from './constants.js';
import { drawCushionSegments, drawCornerBehindSegments } from './cushions.js';
import { drawRubberGums, drawRubberShadows } from './cushion_rubber.js';
import { drawPocketTexture, drawPocketRim } from './pocket_texture.js';
import { getHeadSpot, getFootSpot, getPockets, getPlaySurface } from './utils.js';

function cutPocketHole(ctx, pocket) {
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
    ctx.fill();
}

export function drawTable(ctx) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const surface = getPlaySurface();
    const felt = ctx.createLinearGradient(0, surface.top, 0, surface.bottom);
    felt.addColorStop(0, COLORS.feltLight);
    felt.addColorStop(0.5, COLORS.felt);
    felt.addColorStop(1, COLORS.feltDark);
    ctx.fillStyle = felt;
    ctx.fillRect(surface.left, surface.top, surface.width, surface.height);

    drawRubberShadows(ctx);
    drawCushionSegments(ctx);
    drawCornerBehindSegments(ctx);
    if (DEBUG_DRAW_RUBBER) {
        drawRubberGums(ctx);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    getPockets().forEach(p => cutPocketHole(ctx, p));
    ctx.restore();

    getPockets().forEach(p => {
        drawPocketTexture(ctx, p);
        drawPocketRim(ctx, p);
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
}
