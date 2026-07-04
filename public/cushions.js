import { POCKET_LAYOUT_RADIUS, CUSHION_DEPTH, CUSHION_POCKET_GAP, CUSHION_CHAMFER, COLORS } from './constants.js';
import { getPlayArea, getPockets } from './utils.js';

/** Пары соседних луз на каждой стороне стола — один сегмент борта между ними. */
const CUSHION_CHAINS = {
    top: [['tl', 'tm'], ['tm', 'tr']],
    bottom: [['bl', 'bm'], ['bm', 'br']],
    left: [['tl', 'bl']],
    right: [['tr', 'br']]
};

const CORNER_POCKETS = new Set(['tl', 'tr', 'bl', 'br']);

function pocketById() {
    return Object.fromEntries(getPockets().map(pocket => [pocket.id, pocket]));
}

function isCornerPocket(id) {
    return CORNER_POCKETS.has(id);
}

function horizontalSegment(side, pocketA, pocketB, play) {
    const x = pocketA.x + POCKET_LAYOUT_RADIUS + CUSHION_POCKET_GAP;
    const width = pocketB.x - POCKET_LAYOUT_RADIUS - CUSHION_POCKET_GAP - x;
    const y = side === 'top' ? play.top : play.bottom - CUSHION_DEPTH;

    return {
        id: `cushion-${side}-${pocketA.id}-${pocketB.id}`,
        side,
        pocketIds: [pocketA.id, pocketB.id],
        x,
        y,
        width,
        height: CUSHION_DEPTH,
        chamferStart: isCornerPocket(pocketA.id),
        chamferEnd: isCornerPocket(pocketB.id)
    };
}

function verticalSegment(side, pocketA, pocketB, play) {
    const y = pocketA.y + POCKET_LAYOUT_RADIUS + CUSHION_POCKET_GAP;
    const height = pocketB.y - POCKET_LAYOUT_RADIUS - CUSHION_POCKET_GAP - y;
    const x = side === 'left' ? play.left : play.right - CUSHION_DEPTH;

    return {
        id: `cushion-${side}-${pocketA.id}-${pocketB.id}`,
        side,
        pocketIds: [pocketA.id, pocketB.id],
        x,
        y,
        width: CUSHION_DEPTH,
        height,
        chamferStart: isCornerPocket(pocketA.id),
        chamferEnd: isCornerPocket(pocketB.id)
    };
}

/** @returns {Array<{ id: string, side: string, pocketIds: string[], x: number, y: number, width: number, height: number, chamferStart: boolean, chamferEnd: boolean }>} */
export function getCushionSegments() {
    const play = getPlayArea();
    const pockets = pocketById();
    const segments = [];

    for (const [pocketAId, pocketBId] of CUSHION_CHAINS.top) {
        segments.push(horizontalSegment('top', pockets[pocketAId], pockets[pocketBId], play));
    }
    for (const [pocketAId, pocketBId] of CUSHION_CHAINS.bottom) {
        segments.push(horizontalSegment('bottom', pockets[pocketAId], pockets[pocketBId], play));
    }
    for (const [pocketAId, pocketBId] of CUSHION_CHAINS.left) {
        segments.push(verticalSegment('left', pockets[pocketAId], pockets[pocketBId], play));
    }
    for (const [pocketAId, pocketBId] of CUSHION_CHAINS.right) {
        segments.push(verticalSegment('right', pockets[pocketAId], pockets[pocketBId], play));
    }

    return segments;
}

function chamferSize(segment) {
    const limit = Math.min(segment.width, segment.height) / 2 - 0.5;
    return Math.min(CUSHION_CHAMFER, Math.max(0, limit));
}

function traceSegmentOutline(ctx, segment) {
    const { x, y, width, height, side, chamferStart, chamferEnd } = segment;
    const c = chamferSize(segment);
    const w = width;
    const h = height;

    if (side === 'top') {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        if (chamferEnd) {
            ctx.lineTo(x + w, y + h - c);
            ctx.lineTo(x + w - c, y + h);
        } else {
            ctx.lineTo(x + w, y + h);
        }
        if (chamferStart) {
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
        } else {
            ctx.lineTo(x, y + h);
        }
    } else if (side === 'bottom') {
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        if (chamferEnd) {
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w - c, y);
        } else {
            ctx.lineTo(x + w, y);
        }
        if (chamferStart) {
            ctx.lineTo(x + c, y);
            ctx.lineTo(x, y + c);
        } else {
            ctx.lineTo(x, y);
        }
    } else if (side === 'left') {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        if (chamferEnd) {
            ctx.lineTo(x + w - c, y + h);
            ctx.lineTo(x + w, y + h - c);
        } else {
            ctx.lineTo(x + w, y + h);
        }
        if (chamferStart) {
            ctx.lineTo(x + w, y + c);
            ctx.lineTo(x + w - c, y);
        } else {
            ctx.lineTo(x + w, y);
        }
    } else {
        ctx.moveTo(x + w, y);
        ctx.lineTo(x + w, y + h);
        if (chamferEnd) {
            ctx.lineTo(x + c, y + h);
            ctx.lineTo(x, y + h - c);
        } else {
            ctx.lineTo(x, y + h);
        }
        if (chamferStart) {
            ctx.lineTo(x, y + c);
            ctx.lineTo(x + c, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
}

function traceInnerEdge(ctx, segment) {
    const { x, y, width, height, side, chamferStart, chamferEnd } = segment;
    const c = chamferSize(segment);
    const w = width;
    const h = height;

    if (side === 'top') {
        if (chamferStart) ctx.moveTo(x, y + h - c);
        else ctx.moveTo(x, y + h);
        if (chamferStart) ctx.lineTo(x + c, y + h);
        ctx.lineTo(chamferEnd ? x + w - c : x + w, y + h);
        if (chamferEnd) ctx.lineTo(x + w, y + h - c);
    } else if (side === 'bottom') {
        if (chamferStart) ctx.moveTo(x, y + c);
        else ctx.moveTo(x, y);
        if (chamferStart) ctx.lineTo(x + c, y);
        ctx.lineTo(chamferEnd ? x + w - c : x + w, y);
        if (chamferEnd) ctx.lineTo(x + w, y + c);
    } else if (side === 'left') {
        if (chamferStart) ctx.moveTo(x + w - c, y);
        else ctx.moveTo(x + w, y);
        if (chamferStart) ctx.lineTo(x + w, y + c);
        ctx.lineTo(x + w, chamferEnd ? y + h - c : y + h);
        if (chamferEnd) ctx.lineTo(x + w - c, y + h);
    } else {
        if (chamferStart) ctx.moveTo(x + c, y);
        else ctx.moveTo(x, y);
        if (chamferStart) ctx.lineTo(x, y + c);
        ctx.lineTo(x, chamferEnd ? y + h - c : y + h);
        if (chamferEnd) ctx.lineTo(x + c, y + h);
    }
}

function drawSegmentBody(ctx, segment) {
    const { x, y, width, height, side } = segment;
    const isHorizontal = side === 'top' || side === 'bottom';

    const grad = isHorizontal
        ? ctx.createLinearGradient(x, y, x, y + height)
        : ctx.createLinearGradient(x, y, x + width, y);

    if (side === 'top' || side === 'left') {
        grad.addColorStop(0, COLORS.cushionDark);
        grad.addColorStop(0.45, COLORS.cushion);
        grad.addColorStop(1, COLORS.cushionLight);
    } else {
        grad.addColorStop(0, COLORS.cushionLight);
        grad.addColorStop(0.55, COLORS.cushion);
        grad.addColorStop(1, COLORS.cushionDark);
    }

    ctx.beginPath();
    traceSegmentOutline(ctx, segment);
    ctx.fillStyle = grad;
    ctx.fill();
}

function drawSegmentInnerEdge(ctx, segment) {
    ctx.save();
    ctx.strokeStyle = COLORS.cushionEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    traceInnerEdge(ctx, segment);
    ctx.stroke();
    ctx.restore();
}

export function drawCushionSegments(ctx) {
    for (const segment of getCushionSegments()) {
        if (segment.width <= 0 || segment.height <= 0) continue;
        drawSegmentBody(ctx, segment);
        drawSegmentInnerEdge(ctx, segment);
    }
}
