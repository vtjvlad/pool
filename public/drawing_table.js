import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, POCKET_RADIUS } from './constants.js';
import { getHeadSpot, getFootSpot, getPockets } from './utils.js';

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

export function drawTable(ctx) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    getPockets().forEach(p => drawPocketCavity(ctx, p.x, p.y));

    const felt = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    felt.addColorStop(0, COLORS.feltLight);
    felt.addColorStop(0.5, COLORS.felt);
    felt.addColorStop(1, COLORS.feltDark);
    ctx.fillStyle = felt;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

    const baulk = CANVAS_WIDTH * 0.25;
    ctx.strokeStyle = COLORS.baulkLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baulk, POCKET_RADIUS + 2);
    ctx.lineTo(baulk, CANVAS_HEIGHT - POCKET_RADIUS - 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.baulkLine;
    [getHeadSpot(), getFootSpot()].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });
}
