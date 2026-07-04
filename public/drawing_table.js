import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    RAIL_WIDTH
} from './constants.js';
import { 
    getPlayArea, 
    getPockets, 
    getHeadSpot, 
    getFootSpot, 
    tracePocketNotch,
    traceFeltPocketCut,
    getStraightSegments,
    getCornerCushionFacings,
    getCushionFacing
} from './utils.js';
import { drawAllPockets, drawAllPocketOverlays, drawFeltPocketShadows } from './drawing_pockets.js';

export function drawRailFrame(ctx) {
    const play = getPlayArea();

    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.rect(play.left, play.top, play.width, play.height);

    getPockets().forEach(pocket => tracePocketNotch(ctx, pocket));

    const wood = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    wood.addColorStop(0, '#6b4525');
    wood.addColorStop(0.35, '#8a5a32');
    wood.addColorStop(0.65, '#5c3a1e');
    wood.addColorStop(1, '#3a2412');
    ctx.fillStyle = wood;
    ctx.fill('evenodd');

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
}

export function drawRailDiamonds(ctx) {
    const play = getPlayArea();
    const count = 7;
    const step = play.width / (count + 1);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 1; i <= count; i++) {
        const x = play.left + step * i;
        [{ y: play.top - RAIL_WIDTH * 0.5 }, { y: play.bottom + RAIL_WIDTH * 0.5 }].forEach(pos => {
            ctx.beginPath();
            ctx.moveTo(x, pos.y - 4);
            ctx.lineTo(x + 4, pos.y);
            ctx.lineTo(x, pos.y + 4);
            ctx.lineTo(x - 4, pos.y);
            ctx.closePath();
            ctx.fill();
        });
    }
}

export function drawFelt(ctx) {
    const play = getPlayArea();

    ctx.beginPath();
    ctx.rect(play.left, play.top, play.width, play.height);
    getPockets().forEach(pocket => traceFeltPocketCut(ctx, pocket));

    const felt = ctx.createLinearGradient(play.left, play.top, play.left, play.bottom);
    felt.addColorStop(0, '#1a5f7a');
    felt.addColorStop(0.45, '#1a6b85');
    felt.addColorStop(1, '#145a70');
    ctx.fillStyle = felt;
    ctx.fill('evenodd');

    const head = getHeadSpot();
    const foot = getFootSpot();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    [head, foot].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    const playLine = play.left + play.width * 0.25;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playLine, play.top + 4);
    ctx.lineTo(playLine, play.bottom - 4);
    ctx.stroke();
}

function strokeFacing(ctx, facing) {
    if (!facing) return;
    ctx.beginPath();
    ctx.moveTo(facing.x1, facing.y1);
    ctx.lineTo(facing.x2, facing.y2);
    ctx.stroke();
}

export function drawCushionFacings(ctx) {
    const inset = 4;

    ctx.save();
    ctx.strokeStyle = 'rgba(210, 175, 115, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    getStraightSegments().forEach(seg => strokeFacing(ctx, getCushionFacing(seg, inset)));

    getCornerCushionFacings(inset).forEach(corner => {
        ctx.beginPath();
        ctx.moveTo(corner.x1, corner.y1);
        ctx.lineTo(corner.x2, corner.y2);
        ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);

    getStraightSegments().forEach(seg => strokeFacing(ctx, getCushionFacing(seg, inset)));

    getCornerCushionFacings(inset).forEach(corner => {
        ctx.beginPath();
        ctx.moveTo(corner.x1, corner.y1);
        ctx.lineTo(corner.x2, corner.y2);
        ctx.stroke();
    });

    ctx.setLineDash([]);
    ctx.restore();
}

export function drawTable(ctx) {
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawFelt(ctx);
    drawFeltPocketShadows(ctx);
    drawRailFrame(ctx);
    drawCushionFacings(ctx);
    drawRailDiamonds(ctx);
    drawAllPockets(ctx);
    drawAllPocketOverlays(ctx);
}
