import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    RAIL_WIDTH, 
    CUE_LENGTH, 
    CUE_WIDTH, 
    BALL_RADIUS, 
    POCKET_OPENING, 
    CORNER_JAW_ALONG, 
    SIDE_NOTCH_HALF, 
    POCKET_RECESS 
} from './constants.js';
import { 
    getPlayArea, 
    getPockets, 
    getHeadSpot, 
    getFootSpot, 
    traceCornerNotch, 
    traceSideNotch 
} from './utils.js';

export function drawRailFrame(ctx) {
    const play = getPlayArea();

    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.rect(play.left, play.top, play.width, play.height);

    getPockets().forEach(pocket => {
        if (pocket.kind === 'corner') {
            traceCornerNotch(ctx, pocket);
        } else {
            traceSideNotch(ctx, pocket);
        }
    });

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

    const felt = ctx.createLinearGradient(play.left, play.top, play.left, play.bottom);
    felt.addColorStop(0, '#1a5f7a');
    felt.addColorStop(0.45, '#1a6b85');
    felt.addColorStop(1, '#145a70');
    ctx.fillStyle = felt;
    ctx.fillRect(play.left, play.top, play.width, play.height);

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

export function drawCushionFacings(ctx) {
    const play = getPlayArea();
    const mx = play.left + play.width / 2;
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;
    const inset = 4;

    ctx.save();
    ctx.strokeStyle = 'rgba(210, 175, 115, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(play.left + J, play.top + inset);
    ctx.lineTo(mx - h, play.top + inset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mx + h, play.top + inset);
    ctx.lineTo(play.right - J, play.top + inset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(play.left + J, play.bottom - inset);
    ctx.lineTo(mx - h, play.bottom - inset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mx + h, play.bottom - inset);
    ctx.lineTo(play.right - J, play.bottom - inset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(play.left + inset, play.top + J);
    ctx.lineTo(play.left + inset, play.bottom - J);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(play.right - inset, play.top + J);
    ctx.lineTo(play.right - inset, play.bottom - J);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.strokeRect(play.left + 1, play.top + 1, play.width - 2, play.height - 2);
    ctx.setLineDash([]);
    ctx.restore();
}

export function drawTable(ctx) {
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawFelt(ctx);
    drawRailFrame(ctx);
    getPockets().forEach(pocket => drawPocketHole(ctx, pocket));
    drawCushionFacings(ctx);
    drawRailDiamonds(ctx);
}
