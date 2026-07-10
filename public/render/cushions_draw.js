import { COLORS, CUSHION_CHAMFER } from '../constants.js';
import { getCushionSegments, getCornerBehindSegments, getCornerBehindWedges } from '../cushions.js';
import { fillWoodTexture } from './wood_texture.js';
import { fillMetalTexture, metalShadeGradient } from './metal_texture.js';

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
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
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
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
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
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
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
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
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
