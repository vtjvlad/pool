import { POCKET_LAYOUT_RADIUS, CUSHION_DEPTH, CUSHION_POCKET_GAP, CORNER_CUSHION_POCKET_GAP, CENTRAL_CUSHION_POCKET_GAP, CUSHION_CHAMFER, RUBBER_CENTER_CHAMFER_ANGLE, RUBBER_CORNER_CHAMFER_ANGLE, COLORS } from './constants.js';
import { getPlayArea, getLayoutPockets } from './utils.js';
import { fillWoodTexture } from './wood_texture.js';
import { fillMetalTexture, metalShadeGradient } from './metal_texture.js';

/** Пары соседних луз на каждой стороне стола — один сегмент борта между ними. */
const CUSHION_CHAINS = {
    top: [['tl', 'tm'], ['tm', 'tr']],
    bottom: [['bl', 'bm'], ['bm', 'br']],
    left: [['tl', 'bl']],
    right: [['tr', 'br']]
};

const CORNER_POCKETS = new Set(['tl', 'tr', 'bl', 'br']);
const CENTRAL_POCKETS = new Set(['tm', 'bm']);

function pocketById() {
    return Object.fromEntries(getLayoutPockets().map(pocket => [pocket.id, pocket]));
}

function isCornerPocket(id) {
    return CORNER_POCKETS.has(id);
}

function isCentralPocket(id) {
    return CENTRAL_POCKETS.has(id);
}

function pocketEndGap(pocketId) {
    if (isCornerPocket(pocketId)) return CORNER_CUSHION_POCKET_GAP;
    if (isCentralPocket(pocketId)) return CENTRAL_CUSHION_POCKET_GAP;
    return CUSHION_POCKET_GAP;
}

function horizontalSegment(side, pocketA, pocketB, play) {
    const x = pocketA.x + POCKET_LAYOUT_RADIUS + pocketEndGap(pocketA.id);
    const width = pocketB.x - POCKET_LAYOUT_RADIUS - pocketEndGap(pocketB.id) - x;
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
    const y = pocketA.y + POCKET_LAYOUT_RADIUS + pocketEndGap(pocketA.id);
    const height = pocketB.y - POCKET_LAYOUT_RADIUS - pocketEndGap(pocketB.id) - y;
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

/** Металлическая рамка в углах за лузами — только отрисовка, без физики и резины. */
function cornerBehindSegments(play) {
    const pockets = pocketById();
    const gap = pocketId => POCKET_LAYOUT_RADIUS + pocketEndGap(pocketId);
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
            width: tl.x + gap('tl') - play.left,
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
            height: tl.y + gap('tl') - play.top,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-tr-top',
            side: 'top',
            pocketIds: ['tr'],
            x: tr.x - gap('tr'),
            y: play.top,
            width: play.right - (tr.x - gap('tr')),
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
            height: tr.y + gap('tr') - play.top,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-bl-left',
            side: 'left',
            pocketIds: ['bl'],
            x: play.left,
            y: bl.y - gap('bl'),
            width: CUSHION_DEPTH,
            height: play.bottom - (bl.y - gap('bl')),
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-bl-bottom',
            side: 'bottom',
            pocketIds: ['bl'],
            x: play.left,
            y: play.bottom - CUSHION_DEPTH,
            width: bl.x + gap('bl') - play.left,
            height: CUSHION_DEPTH,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-br-bottom',
            side: 'bottom',
            pocketIds: ['br'],
            x: br.x - gap('br'),
            y: play.bottom - CUSHION_DEPTH,
            width: play.right - (br.x - gap('br')),
            height: CUSHION_DEPTH,
            chamferStart: true,
            chamferEnd: true
        },
        {
            id: 'cushion-corner-br-right',
            side: 'right',
            pocketIds: ['br'],
            x: play.right - CUSHION_DEPTH,
            y: br.y - gap('br'),
            width: CUSHION_DEPTH,
            height: play.bottom - (br.y - gap('br')),
            chamferStart: true,
            chamferEnd: true
        }
    ];
}

export function getCornerBehindSegments() {
    return cornerBehindSegments(getPlayArea());
}

/** Треугольный клин между L-образными сегментами — «челюсть» угловой лузы. */
function cornerPocketWedges(play) {
    const pockets = pocketById();
    const d = CUSHION_DEPTH;
    const railEnd = id => POCKET_LAYOUT_RADIUS + pocketEndGap(id) + (
        id === 'tl' || id === 'bl' ? pockets[id].x : play.right - pockets[id].x
    );
    const railEndY = id => POCKET_LAYOUT_RADIUS + pocketEndGap(id) + (
        id === 'tl' || id === 'tr' ? pockets[id].y : play.bottom - pockets[id].y
    );
    const jaw = end => end + CUSHION_CHAMFER;

    return [
        {
            id: 'cushion-corner-tl-wedge',
            corner: 'tl',
            points: [
                { x: d, y: d },
                { x: jaw(railEnd('tl')), y: d },
                { x: d, y: jaw(railEndY('tl')) }
            ]
        },
        {
            id: 'cushion-corner-tr-wedge',
            corner: 'tr',
            points: [
                { x: play.right - d, y: d },
                { x: play.right - jaw(railEnd('tr')), y: d },
                { x: play.right - d, y: jaw(railEndY('tr')) }
            ]
        },
        {
            id: 'cushion-corner-bl-wedge',
            corner: 'bl',
            points: [
                { x: d, y: play.bottom - d },
                { x: d, y: play.bottom - jaw(railEndY('bl')) },
                { x: jaw(railEnd('bl')), y: play.bottom - d }
            ]
        },
        {
            id: 'cushion-corner-br-wedge',
            corner: 'br',
            points: [
                { x: play.right - d, y: play.bottom - d },
                { x: play.right - d, y: play.bottom - jaw(railEndY('br')) },
                { x: play.right - jaw(railEnd('br')), y: play.bottom - d }
            ]
        }
    ];
}

export function getCornerBehindWedges() {
    return cornerPocketWedges(getPlayArea());
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

function pocketRubberChamferAngle(pocketId) {
    if (isCentralPocket(pocketId)) return RUBBER_CENTER_CHAMFER_ANGLE;
    if (isCornerPocket(pocketId)) return RUBBER_CORNER_CHAMFER_ANGLE;
    return null;
}

function rubberEdgeLinesForSegment(segment) {
    const { x, y, width, height, side, chamferStart, chamferEnd, pocketIds } = segment;
    const c = chamferSize(segment);
    const w = width;
    const h = height;
    let line;

    if (side === 'top') {
        line = {
            x1: chamferStart ? x + c : x,
            y1: y + h,
            x2: chamferEnd ? x + w - c : x + w,
            y2: y + h
        };
    } else if (side === 'bottom') {
        line = {
            x1: chamferStart ? x + c : x,
            y1: y,
            x2: chamferEnd ? x + w - c : x + w,
            y2: y
        };
    } else if (side === 'left') {
        line = {
            x1: x + w,
            y1: chamferStart ? y + c : y,
            x2: x + w,
            y2: chamferEnd ? y + h - c : y + h
        };
    } else {
        line = {
            x1: x,
            y1: chamferStart ? y + c : y,
            x2: x,
            y2: chamferEnd ? y + h - c : y + h
        };
    }

    line.chamferStartAngle = pocketRubberChamferAngle(pocketIds[0]);
    line.chamferEndAngle = pocketRubberChamferAngle(pocketIds[1]);
    line.side = side;
    return [line];
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

function drawSegmentList(ctx, segments) {
    for (const segment of segments) {
        if (segment.width <= 0 || segment.height <= 0) continue;
        drawSegmentBody(ctx, segment);
        drawSegmentInnerEdge(ctx, segment);
    }
}

function wedgeBounds(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY
    };
}

function drawWedgeBody(ctx, wedge) {
    const { points, corner } = wedge;
    const { x, y, width, height } = wedgeBounds(points);
    const isTop = corner === 'tl' || corner === 'tr';

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.clip();

    const shade = isTop
        ? ctx.createLinearGradient(x, y, x, y + height)
        : ctx.createLinearGradient(x, y, x, y + height);

    if (corner === 'tl' || corner === 'bl') {
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
    fillWoodTexture(ctx, x, y, width, height, true);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawWedgeInnerEdge(ctx, wedge) {
    const a = wedge.points[1];
    const b = wedge.points[2];
    ctx.save();
    ctx.strokeStyle = COLORS.woodEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
}

function drawWedgeList(ctx, wedges) {
    for (const wedge of wedges) {
        drawWedgeBody(ctx, wedge);
        drawWedgeInnerEdge(ctx, wedge);
    }
}

function cornerIdFromSegment(segment) {
    const id = segment.pocketIds?.[0];
    if (id === 'tl' || id === 'tr' || id === 'bl' || id === 'br') return id;
    return 'tl';
}

function drawCornerSegmentBody(ctx, segment) {
    const { x, y, width, height, side } = segment;
    const isHorizontal = side === 'top' || side === 'bottom';
    const cornerId = cornerIdFromSegment(segment);

    ctx.save();
    ctx.beginPath();
    traceSegmentOutline(ctx, segment);
    ctx.clip();

    ctx.fillStyle = metalShadeGradient(ctx, x, y, width, height, cornerId);
    ctx.fillRect(x, y, width, height);

    ctx.globalAlpha = 0.88;
    fillMetalTexture(ctx, x, y, width, height, isHorizontal);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawCornerSegmentInnerEdge(ctx, segment) {
    ctx.save();
    ctx.strokeStyle = COLORS.metalEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    traceInnerEdge(ctx, segment);
    ctx.stroke();
    ctx.restore();
}

function drawCornerSegmentList(ctx, segments) {
    for (const segment of segments) {
        if (segment.width <= 0 || segment.height <= 0) continue;
        drawCornerSegmentBody(ctx, segment);
        drawCornerSegmentInnerEdge(ctx, segment);
    }
}

function drawCornerWedgeBody(ctx, wedge) {
    const { points, corner } = wedge;
    const { x, y, width, height } = wedgeBounds(points);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = metalShadeGradient(ctx, x, y, width, height, corner);
    ctx.fillRect(x, y, width, height);

    ctx.globalAlpha = 0.88;
    fillMetalTexture(ctx, x, y, width, height, true);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawCornerWedgeInnerEdge(ctx, wedge) {
    const a = wedge.points[1];
    const b = wedge.points[2];
    ctx.save();
    ctx.strokeStyle = COLORS.metalShadow;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
}

function drawCornerWedgeList(ctx, wedges) {
    for (const wedge of wedges) {
        drawCornerWedgeBody(ctx, wedge);
        drawCornerWedgeInnerEdge(ctx, wedge);
    }
}

/** Псевдо-борт в углах — металл, без физики и резины. */
export function drawCornerBehindSegments(ctx) {
    drawCornerSegmentList(ctx, getCornerBehindSegments());
    drawCornerWedgeList(ctx, getCornerBehindWedges());
}

export function drawCushionSegments(ctx) {
    drawSegmentList(ctx, getCushionSegments());
}
