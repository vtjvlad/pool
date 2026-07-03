import { 
    BALL_RADIUS, 
    POCKET_OPENING, 
    CORNER_JAW_ALONG, 
    SIDE_NOTCH_HALF, 
    POCKET_RECESS 
} from './constants.js';
import { 
    getPlayArea, 
    traceCornerNotch, 
    traceSideNotch 
} from './utils.js';

export function drawPocketHole(ctx, pocket) {
    const r = POCKET_OPENING;

    ctx.save();

    ctx.beginPath();
    if (pocket.kind === 'corner') {
        traceCornerNotch(ctx, pocket);
    } else {
        traceSideNotch(ctx, pocket);
    }
    ctx.fillStyle = '#0a0604';
    ctx.fill();

    const depth = ctx.createRadialGradient(
        pocket.x, pocket.y, 1,
        pocket.x, pocket.y, r + 4
    );
    depth.addColorStop(0, '#000000');
    depth.addColorStop(0.55, '#080604');
    depth.addColorStop(1, '#1a1208');

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r, 0, Math.PI * 2);
    ctx.fillStyle = depth;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(30, 18, 10, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    drawPocketJaws(ctx, pocket);
    ctx.restore();
}

function drawPocketJaws(ctx, pocket) {
    const play = getPlayArea();
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    ctx.strokeStyle = 'rgba(55, 35, 18, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (wall === 'tl') {
        ctx.beginPath();
        ctx.moveTo(ax + J, ay);
        ctx.lineTo(ax + 10, ay + 10);
        ctx.lineTo(ax, ay + J);
        ctx.stroke();
    } else if (wall === 'tr') {
        ctx.beginPath();
        ctx.moveTo(ax - J, ay);
        ctx.lineTo(ax - 10, ay + 10);
        ctx.lineTo(ax, ay + J);
        ctx.stroke();
    } else if (wall === 'bl') {
        ctx.beginPath();
        ctx.moveTo(ax + J, ay);
        ctx.lineTo(ax + 10, ay - 10);
        ctx.lineTo(ax, ay - J);
        ctx.stroke();
    } else if (wall === 'br') {
        ctx.beginPath();
        ctx.moveTo(ax - J, ay);
        ctx.lineTo(ax - 10, ay - 10);
        ctx.lineTo(ax, ay - J);
        ctx.stroke();
    } else if (wall === 'top') {
        ctx.beginPath();
        ctx.moveTo(ax - h, ay);
        ctx.quadraticCurveTo(ax - h * 0.4, ay - POCKET_RECESS * 0.35, ax, ay - POCKET_RECESS * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + h, ay);
        ctx.quadraticCurveTo(ax + h * 0.4, ay - POCKET_RECESS * 0.35, ax, ay - POCKET_RECESS * 0.15);
        ctx.stroke();
    } else if (wall === 'bottom') {
        ctx.beginPath();
        ctx.moveTo(ax - h, ay);
        ctx.quadraticCurveTo(ax - h * 0.4, ay + POCKET_RECESS * 0.35, ax, ay + POCKET_RECESS * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + h, ay);
        ctx.quadraticCurveTo(ax + h * 0.4, ay + POCKET_RECESS * 0.35, ax, ay + POCKET_RECESS * 0.15);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(200, 165, 110, 0.35)';
    ctx.lineWidth = 1.2;
    const inset = 4;
    if (wall === 'tl' || wall === 'tr') {
        const x1 = wall === 'tl' ? play.left + inset : play.right - inset;
        const x2 = wall === 'tl' ? ax + J : ax - J;
        ctx.beginPath();
        ctx.moveTo(x2, play.top + inset);
        ctx.lineTo(x1, play.top + inset);
        ctx.stroke();
    }
    if (wall === 'bl' || wall === 'br') {
        const x1 = wall === 'bl' ? play.left + inset : play.right - inset;
        const x2 = wall === 'bl' ? ax + J : ax - J;
        ctx.beginPath();
        ctx.moveTo(x2, play.bottom - inset);
        ctx.lineTo(x1, play.bottom - inset);
        ctx.stroke();
    }
}
