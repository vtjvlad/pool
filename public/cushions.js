import { POCKET_LAYOUT_RADIUS, CUSHION_DEPTH, CUSHION_POCKET_GAP, CUSHION_CHAMFER, COLORS } from './constants.js';
import { getPlayArea, getPockets } from './utils.js';
import { fillWoodTexture } from './wood_texture.js';

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

/*
function cornerBehindSegments(play) {
    const pockets = pocketById();
    const gap = POCKET_LAYOUT_RADIUS + CUSHION_POCKET_GAP;
    const tl = pockets.tl;
    const tr = pockets.tr;
    const bl = pockets.bl;
    const br = pockets.br;

    return [
        {
            id: 'cushion-corner-tl-top',
            side: 'top',
            pocketIds: ['tl'],
            x: play.left,
            y: play.top,
            width: tl.x + gap - play.left,
            height: CUSHION_DEPTH,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-tl-left',
            side: 'left',
            pocketIds: ['tl'],
            x: play.left,
            y: play.top,
            width: CUSHION_DEPTH,
            height: tl.y + gap - play.top,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-tr-top',
            side: 'top',
            pocketIds: ['tr'],
            x: tr.x - gap,
            y: play.top,
            width: play.right - (tr.x - gap),
            height: CUSHION_DEPTH,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-tr-right',
            side: 'right',
            pocketIds: ['tr'],
            x: play.right - CUSHION_DEPTH,
            y: play.top,
            width: CUSHION_DEPTH,
            height: tr.y + gap - play.top,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-bl-left',
            side: 'left',
            pocketIds: ['bl'],
            x: play.left,
            y: bl.y - gap,
            width: CUSHION_DEPTH,
            height: play.bottom - (bl.y - gap),
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-bl-bottom',
            side: 'bottom',
            pocketIds: ['bl'],
            x: play.left,
            y: play.bottom - CUSHION_DEPTH,
            width: bl.x + gap - play.left,
            height: CUSHION_DEPTH,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-br-bottom',
            side: 'bottom',
            pocketIds: ['br'],
            x: br.x - gap,
            y: play.bottom - CUSHION_DEPTH,
            width: play.right - (br.x - gap),
            height: CUSHION_DEPTH,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-br-right',
            side: 'right',
            pocketIds: ['br'],
            x: play.right - CUSHION_DEPTH,
            y: br.y - gap,
            width: CUSHION_DEPTH,
            height: play.bottom - (br.y - gap),
            chamferStart: true,
            chamferEnd: true
        }
    ];
}
*/

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

    // segments.push(...cornerBehindSegments(play));

    return segments;
}

function chamferSize(segment) {
    const limit = Math.min(segment.width, segment.height) / 2 - 0.5;
    return Math.min(CUSHION_CHAMFER, Math.max(0, limit));
}

function innerEdgeLinesForSegment(segment) {
    const { x, y, width, height, side, chamferStart, chamferEnd } = segment;
    const c = chamferSize(segment);
    const w = width;
    const h = height;
    const lines = [];

    if (side === 'top') {
        if (chamferStart) lines.push({ x1: x, y1: y + h - c, x2: x + c, y2: y + h });
        lines.push({
            x1: chamferStart ? x + c : x,
            y1: y + h,
            x2: chamferEnd ? x + w - c : x + w,
            y2: y + h
        });
        if (chamferEnd) lines.push({ x1: x + w - c, y1: y + h, x2: x + w, y2: y + h - c });
    } else if (side === 'bottom') {
        if (chamferStart) lines.push({ x1: x, y1: y + c, x2: x + c, y2: y });
        lines.push({
            x1: chamferStart ? x + c : x,
            y1: y,
            x2: chamferEnd ? x + w - c : x + w,
            y2: y
        });
        if (chamferEnd) lines.push({ x1: x + w - c, y1: y, x2: x + w, y2: y + c });
    } else if (side === 'left') {
        if (chamferStart) lines.push({ x1: x + w - c, y1: y, x2: x + w, y2: y + c });
        lines.push({
            x1: x + w,
            y1: chamferStart ? y + c : y,
            x2: x + w,
            y2: chamferEnd ? y + h - c : y + h
        });
        if (chamferEnd) lines.push({ x1: x + w, y1: y + h - c, x2: x + w - c, y2: y + h });
    } else {
        if (chamferStart) lines.push({ x1: x + c, y1: y, x2: x, y2: y + c });
        lines.push({
            x1: x,
            y1: chamferStart ? y + c : y,
            x2: x,
            y2: chamferEnd ? y + h - c : y + h
        });
        if (chamferEnd) lines.push({ x1: x, y1: y + h - c, x2: x + c, y2: y + h });
    }

    return lines;
}

function rubberEdgeLinesForSegment(segment) {
    const { x, y, width, height, side, chamferStart, chamferEnd } = segment;
    const c = chamferSize(segment);
    const w = width;
    const h = height;

    if (side === 'top') {
        return [{
            x1: chamferStart ? x + c : x,
            y1: y + h,
            x2: chamferEnd ? x + w - c : x + w,
            y2: y + h
        }];
    }
    if (side === 'bottom') {
        return [{
            x1: chamferStart ? x + c : x,
            y1: y,
            x2: chamferEnd ? x + w - c : x + w,
            y2: y
        }];
    }
    if (side === 'left') {
        return [{
            x1: x + w,
            y1: chamferStart ? y + c : y,
            x2: x + w,
            y2: chamferEnd ? y + h - c : y + h
        }];
    }
    return [{
        x1: x,
        y1: chamferStart ? y + c : y,
        x2: x,
        y2: chamferEnd ? y + h - c : y + h
    }];
}

export function getRubberInnerEdges() {
    const lines = [];
    for (const segment of getCushionSegments()) {
        if (segment.width <= 0 || segment.height <= 0) continue;
        lines.push(...rubberEdgeLinesForSegment(segment));
    }
    return lines;
}

export function getCushionInnerEdges() {
    const lines = [];
    for (const segment of getCushionSegments()) {
        if (segment.width <= 0 || segment.height <= 0) continue;
        lines.push(...innerEdgeLinesForSegment(segment));
    }
    return lines;
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

    ctx.save();
    ctx.beginPath();
    traceSegmentOutline(ctx, segment);
    ctx.clip();

    const shade = isHorizontal
        ? ctx.createLinearGradient(x, y, x, y + height)
        : ctx.createLinearGradient(x, y, x + width, y);

    if (side === 'top' || side === 'left') {
        shade.addColorStop(0, COLORS.woodDark);
        shade.addColorStop(0.4, COLORS.woodBase);
        shade.addColorStop(1, COLORS.woodLight);
    } else {
        shade.addColorStop(0, COLORS.woodLight);
        shade.addColorStop(0.6, COLORS.woodBase);
        shade.addColorStop(1, COLORS.woodDark);
    }

    ctx.fillStyle = shade;
    ctx.fillRect(x, y, width, height);

    ctx.globalAlpha = 0.82;
    fillWoodTexture(ctx, x, y, width, height, isHorizontal);
    ctx.globalAlpha = 1;

    ctx.restore();
}

function drawSegmentInnerEdge(ctx, segment) {
    ctx.save();
    ctx.strokeStyle = COLORS.woodEdge;
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
