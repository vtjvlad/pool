import { COLORS } from './constants.js';
import { getPocketRenderData } from './table_graphics.js';

function drawPocketHole(ctx, pocket) {
    const { x, y, radius, kind, lipX, lipY, collarRadius } = pocket;

    ctx.save();

    const hole = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.2);
    hole.addColorStop(0, COLORS.pocket);
    hole.addColorStop(0.55, '#0a0a0a');
    hole.addColorStop(1, 'rgba(10,10,10,0)');

    ctx.beginPath();
    if (kind === 'side') {
        ctx.ellipse(x, y, radius, radius * 1.05, 0, 0, Math.PI * 2);
    } else {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = hole;
    ctx.fill();

    ctx.beginPath();
    if (kind === 'side') {
        ctx.ellipse(x, y, radius, radius * 1.05, 0, 0, Math.PI * 2);
    } else {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.strokeStyle = COLORS.pocketCollar;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    if (lipX != null && lipY != null) {
        ctx.beginPath();
        ctx.arc(lipX, lipY, collarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.pocketLip;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    ctx.restore();
}

export function drawAllPockets(ctx) {
    getPocketRenderData().forEach(pocket => drawPocketHole(ctx, pocket));
}
