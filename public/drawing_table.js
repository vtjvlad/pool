import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants.js';
import { getHeadSpot, getFootSpot } from './utils.js';

export function drawTable(ctx) {
    const felt = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    felt.addColorStop(0, COLORS.feltLight);
    felt.addColorStop(0.5, COLORS.felt);
    felt.addColorStop(1, COLORS.feltDark);
    ctx.fillStyle = felt;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const baulk = CANVAS_WIDTH * 0.25;
    ctx.strokeStyle = COLORS.baulkLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baulk, 6);
    ctx.lineTo(baulk, CANVAS_HEIGHT - 6);
    ctx.stroke();

    ctx.fillStyle = COLORS.baulkLine;
    [getHeadSpot(), getFootSpot()].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });
}
