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

    if (chamferEndAngle != null) {
        const runEnd = chamferRunAlongEdge(t, chamferEndAngle);
        ox2 = ix2 - tx * runEnd;
        oy2 = iy2 - ty * runEnd;
        lines.push({ x1: x2, y1: y2, x2: ox2, y2: oy2 });
    }

    if (chamferStartAngle != null) {
        const runStart = chamferRunAlongEdge(t, chamferStartAngle);
        ox1 = ix1 + tx * runStart;
        oy1 = iy1 + ty * runStart;
        lines.push({ x1: ox1, y1: oy1, x2: x1, y2: y1 });
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

function drawRubberStrip(ctx, line) {
    const { nx, ny, tx, ty } = edgeNormal(line.x1, line.y1, line.x2, line.y2);
    const t = RUBBER_THICKNESS;
    const { x1, y1, x2, y2, chamferStartAngle, chamferEndAngle } = line;

    const ix1 = x1 + nx * t;
    const iy1 = y1 + ny * t;
    const ix2 = x2 + nx * t;
    const iy2 = y2 + ny * t;

    const grad = ctx.createLinearGradient(x1, y1, ix1, iy1);
    grad.addColorStop(0, COLORS.rubberDark);
    grad.addColorStop(0.35, COLORS.rubber);
    grad.addColorStop(1, COLORS.rubberLight);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    if (chamferEndAngle != null) {
        const runEnd = chamferRunAlongEdge(t, chamferEndAngle);
        ctx.lineTo(ix2 - tx * runEnd, iy2 - ty * runEnd);
    } else {
        ctx.lineTo(ix2, iy2);
    }

    ctx.lineTo(ix1, iy1);

    if (chamferStartAngle != null) {
        const runStart = chamferRunAlongEdge(t, chamferStartAngle);
        ctx.lineTo(ix1 + tx * runStart, iy1 + ty * runStart);
    }

    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ix1, iy1);
    ctx.lineTo(ix2, iy2);
    ctx.strokeStyle = COLORS.rubberHighlight;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = COLORS.rubberShadow;
    ctx.lineWidth = 1.2;
    ctx.stroke();
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
