import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    RUBBER_THICKNESS,
    COLORS
} from './constants.js';
import { getRubberInnerEdges } from './cushions.js';
import { getPlaySurface } from './utils.js';

const CUSHION_SHADOW_DEPTH = 9;

const PLAY_CENTER_X = CANVAS_WIDTH / 2;
const PLAY_CENTER_Y = CANVAS_HEIGHT / 2;

function edgeNormal(x1, y1, x2, y2) {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const edx = x2 - x1;
    const edy = y2 - y1;
    let nx = -edy / len;
    let ny = edx / len;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    if ((PLAY_CENTER_X - mx) * nx + (PLAY_CENTER_Y - my) * ny < 0) {
        nx = -nx;
        ny = -ny;
    }

    return { nx, ny, tx: edx / len, ty: edy / len };
}

function chamferRunAlongEdge(thickness, angleDeg) {
    return thickness / Math.tan(angleDeg * Math.PI / 180);
}

function rubberCollisionLinesFrom(line) {
    const { nx, ny, tx, ty } = edgeNormal(line.x1, line.y1, line.x2, line.y2);
    const t = RUBBER_THICKNESS;
    const { x1, y1, x2, y2, chamferStartAngle, chamferEndAngle } = line;
    const ix1 = x1 + nx * t;
    const iy1 = y1 + ny * t;
    const ix2 = x2 + nx * t;
    const iy2 = y2 + ny * t;
    const lines = [];

    let ox1 = ix1;
    let oy1 = iy1;
    let ox2 = ix2;
    let oy2 = iy2;
    const minCurve = 0.5;
    const maxCurve = t * 0.85;

    if (chamferEndAngle != null) {
        const runEnd = chamferRunAlongEdge(t, chamferEndAngle);
        ox2 = ix2 - tx * runEnd;
        oy2 = iy2 - ty * runEnd;
        const curve = Math.min(runEnd * 0.65, maxCurve);
        const chamferDx = ox2 - x2;
        const chamferDy = oy2 - y2;
        const chamferLen = Math.hypot(chamferDx, chamferDy) || 1;
        const chamferUx = chamferDx / chamferLen;
        const chamferUy = chamferDy / chamferLen;
        const curveSafe = Math.min(curve, chamferLen * 0.45);
        const hasCurve = curveSafe >= minCurve;

        if (hasCurve) {
            const chamferCutX = ox2 - chamferUx * curveSafe;
            const chamferCutY = oy2 - chamferUy * curveSafe;
            const edgeCutX = ox2 - tx * curveSafe;
            const edgeCutY = oy2 - ty * curveSafe;

            lines.push({ x1: x2, y1: y2, x2: chamferCutX, y2: chamferCutY });
            lines.push({ x1: chamferCutX, y1: chamferCutY, x2: edgeCutX, y2: edgeCutY });
            ox2 = edgeCutX;
            oy2 = edgeCutY;
        } else {
            lines.push({ x1: x2, y1: y2, x2: ox2, y2: oy2 });
        }
    }

    if (chamferStartAngle != null) {
        const runStart = chamferRunAlongEdge(t, chamferStartAngle);
        ox1 = ix1 + tx * runStart;
        oy1 = iy1 + ty * runStart;
        const curve = Math.min(runStart * 0.65, maxCurve);
        const chamferDx = x1 - ox1;
        const chamferDy = y1 - oy1;
        const chamferLen = Math.hypot(chamferDx, chamferDy) || 1;
        const chamferUx = chamferDx / chamferLen;
        const chamferUy = chamferDy / chamferLen;
        const curveSafe = Math.min(curve, chamferLen * 0.45);
        const hasCurve = curveSafe >= minCurve;

        if (hasCurve) {
            const edgeCutX = ox1 + tx * curveSafe;
            const edgeCutY = oy1 + ty * curveSafe;
            const chamferCutX = ox1 + chamferUx * curveSafe;
            const chamferCutY = oy1 + chamferUy * curveSafe;

            lines.push({ x1: edgeCutX, y1: edgeCutY, x2: chamferCutX, y2: chamferCutY });
            lines.push({ x1: chamferCutX, y1: chamferCutY, x2: x1, y2: y1 });
            ox1 = edgeCutX;
            oy1 = edgeCutY;
        } else {
            lines.push({ x1: ox1, y1: oy1, x2: x1, y2: y1 });
        }
    }

    lines.push({ x1: ox1, y1: oy1, x2: ox2, y2: oy2 });
    return lines;
}

export function getRubberCollisionEdges() {
    const lines = [];
    for (const line of getRubberInnerEdges()) {
        const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
        if (len < 0.5) continue;
        lines.push(...rubberCollisionLinesFrom(line));
    }
    return lines;
}

function drawRubberShadowOnFelt(ctx, line) {
    const { nx, ny } = edgeNormal(line.x1, line.y1, line.x2, line.y2);
    const depth = CUSHION_SHADOW_DEPTH;
    const { x1, y1, x2, y2 } = line;

    const grad = ctx.createLinearGradient(
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        (x1 + x2) / 2 + nx * depth,
        (y1 + y2) / 2 + ny * depth
    );
    grad.addColorStop(0, COLORS.cushionFeltShadow);
    grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 + nx * depth, y2 + ny * depth);
    ctx.lineTo(x1 + nx * depth, y1 + ny * depth);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
}

export function drawRubberShadows(ctx) {
    const surface = getPlaySurface();

    ctx.save();
    ctx.beginPath();
    ctx.rect(surface.left, surface.top, surface.width, surface.height);
    ctx.clip();

    for (const line of getRubberInnerEdges()) {
        const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
        if (len < 0.5) continue;
        drawRubberShadowOnFelt(ctx, line);
    }

    ctx.restore();
}

function createRubberFillGradient(ctx, line, nx, ny, t) {
    const { x1, y1, x2, y2, side } = line;
    const ix1 = x1 + nx * t;
    const iy1 = y1 + ny * t;
    const palettes = COLORS.rubberPalettes;

    if (side === 'top' || side === 'bottom') {
        const pal = palettes[side];
        const grad = ctx.createLinearGradient(x1, y1, ix1, iy1);
        grad.addColorStop(0, pal.dark);
        grad.addColorStop(0.42, pal.mid);
        grad.addColorStop(1, pal.light);
        return grad;
    }

    const topP = palettes.top;
    const botP = palettes.bottom;
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, topP.dark);
    grad.addColorStop(0.22, topP.light);
    grad.addColorStop(0.78, botP.mid);
    grad.addColorStop(1, botP.light);
    return grad;
}

function traceRubberInnerEdge(ctx, points) {
    const {
        hasEndCurve,
        hasStartCurve,
        innerEndX,
        innerEndY,
        innerStartX,
        innerStartY,
        beforeEndCurveX,
        beforeEndCurveY,
        afterEndCurveX,
        afterEndCurveY,
        beforeStartCurveX,
        beforeStartCurveY,
        afterStartCurveX,
        afterStartCurveY
    } = points;

    ctx.moveTo(hasEndCurve ? afterEndCurveX : innerEndX, hasEndCurve ? afterEndCurveY : innerEndY);
    ctx.lineTo(beforeStartCurveX, beforeStartCurveY);
    if (hasStartCurve) {
        ctx.quadraticCurveTo(innerStartX, innerStartY, afterStartCurveX, afterStartCurveY);
    } else {
        ctx.lineTo(innerStartX, innerStartY);
    }
}

function drawRubberStrip(ctx, line) {
    const { nx, ny, tx, ty } = edgeNormal(line.x1, line.y1, line.x2, line.y2);
    const t = RUBBER_THICKNESS;
    const { x1, y1, x2, y2, chamferStartAngle, chamferEndAngle } = line;

    const ix1 = x1 + nx * t;
    const iy1 = y1 + ny * t;
    const ix2 = x2 + nx * t;
    const iy2 = y2 + ny * t;

    const runEnd = chamferEndAngle != null ? chamferRunAlongEdge(t, chamferEndAngle) : 0;
    const runStart = chamferStartAngle != null ? chamferRunAlongEdge(t, chamferStartAngle) : 0;
    const innerEndX = chamferEndAngle != null ? ix2 - tx * runEnd : ix2;
    const innerEndY = chamferEndAngle != null ? iy2 - ty * runEnd : iy2;
    const innerStartX = chamferStartAngle != null ? ix1 + tx * runStart : ix1;
    const innerStartY = chamferStartAngle != null ? iy1 + ty * runStart : iy1;
    const minCurve = 0.5;
    const maxCurve = t * 0.35;
    const startCurve = chamferStartAngle != null ? Math.min(runStart * 0.65, maxCurve) : 0;
    const endCurve = chamferEndAngle != null ? Math.min(runEnd * 0.65, maxCurve) : 0;
    const hasStartCurve = startCurve >= minCurve;
    const hasEndCurve = endCurve >= minCurve;

    const endChamferDx = innerEndX - x2;
    const endChamferDy = innerEndY - y2;
    const endChamferLen = Math.hypot(endChamferDx, endChamferDy) || 1;
    const endChamferUx = endChamferDx / endChamferLen;
    const endChamferUy = endChamferDy / endChamferLen;
    const endCurveSafe = Math.min(endCurve, endChamferLen * 0.45);

    const startChamferDx = x1 - innerStartX;
    const startChamferDy = y1 - innerStartY;
    const startChamferLen = Math.hypot(startChamferDx, startChamferDy) || 1;
    const startChamferUx = startChamferDx / startChamferLen;
    const startChamferUy = startChamferDy / startChamferLen;
    const startCurveSafe = Math.min(startCurve, startChamferLen * 0.45);

    const beforeEndCurveX = hasEndCurve ? innerEndX - endChamferUx * endCurveSafe : innerEndX;
    const beforeEndCurveY = hasEndCurve ? innerEndY - endChamferUy * endCurveSafe : innerEndY;
    const afterEndCurveX = hasEndCurve ? innerEndX - tx * endCurveSafe : innerEndX;
    const afterEndCurveY = hasEndCurve ? innerEndY - ty * endCurveSafe : innerEndY;

    const beforeStartCurveX = hasStartCurve ? innerStartX + tx * startCurveSafe : innerStartX;
    const beforeStartCurveY = hasStartCurve ? innerStartY + ty * startCurveSafe : innerStartY;
    const afterStartCurveX = hasStartCurve ? innerStartX + startChamferUx * startCurveSafe : innerStartX;
    const afterStartCurveY = hasStartCurve ? innerStartY + startChamferUy * startCurveSafe : innerStartY;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(beforeEndCurveX, beforeEndCurveY);
    if (hasEndCurve) {
        ctx.quadraticCurveTo(innerEndX, innerEndY, afterEndCurveX, afterEndCurveY);
    } else {
        ctx.lineTo(innerEndX, innerEndY);
    }
    ctx.lineTo(beforeStartCurveX, beforeStartCurveY);
    if (hasStartCurve) {
        ctx.quadraticCurveTo(innerStartX, innerStartY, afterStartCurveX, afterStartCurveY);
    } else {
        ctx.lineTo(innerStartX, innerStartY);
    }
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.fillStyle = createRubberFillGradient(ctx, line, nx, ny, t);
    ctx.fill();

    const edgePoints = {
        hasEndCurve,
        hasStartCurve,
        innerEndX,
        innerEndY,
        innerStartX,
        innerStartY,
        beforeEndCurveX,
        beforeEndCurveY,
        afterEndCurveX,
        afterEndCurveY,
        beforeStartCurveX,
        beforeStartCurveY,
        afterStartCurveX,
        afterStartCurveY
    };

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';

    ctx.beginPath();
    traceRubberInnerEdge(ctx, edgePoints);
    ctx.strokeStyle = COLORS.rubberFeltEdge;
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.beginPath();
    traceRubberInnerEdge(ctx, edgePoints);
    ctx.strokeStyle = COLORS.rubberHighlight;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = COLORS.rubberShadow;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
}

export function drawRubberGums(ctx) {
    ctx.save();
    for (const line of getRubberInnerEdges()) {
        const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
        if (len < 0.5) continue;
        drawRubberStrip(ctx, line);
    }
    ctx.restore();
}
