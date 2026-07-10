import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    RUBBER_THICKNESS
} from './constants.js';
import { getRubberInnerEdges } from './cushions.js';

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
