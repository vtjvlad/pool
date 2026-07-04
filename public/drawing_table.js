import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants.js';
import {
    getPlayArea,
    traceOuterRail,
    tracePlaySurface
} from './table_geometry.js';
import {
    getCushionQuads,
    getRailDiamonds,
    getTableMarkings
} from './table_graphics.js';
import { drawAllPockets } from './drawing_pockets.js';

function fillBackground(ctx) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawWoodRails(ctx) {
    ctx.beginPath();
    traceOuterRail(ctx);

    const wood = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    wood.addColorStop(0, COLORS.railWoodLight);
    wood.addColorStop(0.4, COLORS.railWood);
    wood.addColorStop(1, COLORS.railWoodDark);
    ctx.fillStyle = wood;
    ctx.fill('evenodd');

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, CANVAS_WIDTH - 1.5, CANVAS_HEIGHT - 1.5);
}

function drawFelt(ctx) {
    const play = getPlayArea();

    ctx.beginPath();
    tracePlaySurface(ctx);

    const felt = ctx.createLinearGradient(play.left, play.top, play.left, play.bottom);
    felt.addColorStop(0, COLORS.feltLight);
    felt.addColorStop(0.45, COLORS.felt);
    felt.addColorStop(1, COLORS.feltDark);
    ctx.fillStyle = felt;
    ctx.fill();

    ctx.beginPath();
    tracePlaySurface(ctx);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawCushions(ctx) {
    getCushionQuads().forEach(quad => {
        const [p1, p2, p3, p4] = quad.points;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();

        const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
        const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
        const grad = ctx.createLinearGradient(cx, cy - 8, cx, cy + 8);
        grad.addColorStop(0, COLORS.cushionLight);
        grad.addColorStop(0.5, COLORS.cushion);
        grad.addColorStop(1, COLORS.cushionDark);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = COLORS.cushionEdge;
        ctx.lineWidth = 0.8;
        ctx.stroke();
    });
}

function drawRailDiamonds(ctx) {
    ctx.fillStyle = COLORS.railDiamond;
    getRailDiamonds().forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawMarkings(ctx) {
    const { baulkLine, headSpot, footSpot, centerSpot } = getTableMarkings();
    const play = getPlayArea();

    ctx.strokeStyle = COLORS.baulkLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baulkLine, play.top + 6);
    ctx.lineTo(baulkLine, play.bottom - 6);
    ctx.stroke();

    ctx.fillStyle = COLORS.baulkLine;
    [headSpot, footSpot, centerSpot].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function drawTable(ctx) {
    fillBackground(ctx);
    drawWoodRails(ctx);
    drawFelt(ctx);
    drawCushions(ctx);
    drawAllPockets(ctx);
    drawRailDiamonds(ctx);
    drawMarkings(ctx);
}
