import { POCKET_RADIUS, CUSHION_DEPTH, CUSHION_POCKET_GAP, COLORS } from './constants.js';
import { getPlayArea, getPockets } from './utils.js';

/** Пары соседних луз на каждой стороне стола — один сегмент борта между ними. */
const CUSHION_CHAINS = {
    top: [['tl', 'tm'], ['tm', 'tr']],
    bottom: [['bl', 'bm'], ['bm', 'br']],
    left: [['tl', 'bl']],
    right: [['tr', 'br']]
};

function pocketById() {
    return Object.fromEntries(getPockets().map(pocket => [pocket.id, pocket]));
}

function horizontalSegment(side, pocketA, pocketB, play) {
    const x = pocketA.x + POCKET_RADIUS + CUSHION_POCKET_GAP;
    const width = pocketB.x - POCKET_RADIUS - CUSHION_POCKET_GAP - x;
    const y = side === 'top' ? play.top : play.bottom - CUSHION_DEPTH;

    return {
        id: `cushion-${side}-${pocketA.id}-${pocketB.id}`,
        side,
        pocketIds: [pocketA.id, pocketB.id],
        x,
        y,
        width,
        height: CUSHION_DEPTH
    };
}

function verticalSegment(side, pocketA, pocketB, play) {
    const y = pocketA.y + POCKET_RADIUS + CUSHION_POCKET_GAP;
    const height = pocketB.y - POCKET_RADIUS - CUSHION_POCKET_GAP - y;
    const x = side === 'left' ? play.left : play.right - CUSHION_DEPTH;

    return {
        id: `cushion-${side}-${pocketA.id}-${pocketB.id}`,
        side,
        pocketIds: [pocketA.id, pocketB.id],
        x,
        y,
        width: CUSHION_DEPTH,
        height
    };
}

/** @returns {Array<{ id: string, side: string, pocketIds: string[], x: number, y: number, width: number, height: number }>} */
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

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);
}

function drawSegmentInnerEdge(ctx, segment) {
    const { x, y, width, height, side } = segment;

    ctx.save();
    ctx.strokeStyle = COLORS.cushionEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();

    if (side === 'top') {
        ctx.moveTo(x, y + height - 0.5);
        ctx.lineTo(x + width, y + height - 0.5);
    } else if (side === 'bottom') {
        ctx.moveTo(x, y + 0.5);
        ctx.lineTo(x + width, y + 0.5);
    } else if (side === 'left') {
        ctx.moveTo(x + width - 0.5, y);
        ctx.lineTo(x + width - 0.5, y + height);
    } else {
        ctx.moveTo(x + 0.5, y);
        ctx.lineTo(x + 0.5, y + height);
    }

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
