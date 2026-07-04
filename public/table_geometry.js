import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    TABLE
} from './constants.js';

const SX = CANVAS_WIDTH / TABLE.width;
const SY = CANVAS_HEIGHT / TABLE.height;

const CUSHION_FACE = TABLE.cushionWidth * 0.54;
const CORNER_JAW = TABLE.pocketMouth * 0.76;
const SIDE_JAW = TABLE.pocketMouth * 0.63;
const POCKET_JAW = TABLE.pocketMouth * 0.3;
const POCKET_DEPTH = TABLE.pocketRadius * 1.15;

export function toCanvas(x, y) {
    return { x: x * SX, y: y * SY };
}

export function getPlayAreaNorm() {
    const c = TABLE.cushionWidth;
    return {
        left: c,
        top: c,
        right: TABLE.width - c,
        bottom: TABLE.height - c,
        width: TABLE.width - 2 * c,
        height: TABLE.height - 2 * c
    };
}

export function getPlayArea() {
    const p = getPlayAreaNorm();
    const tl = toCanvas(p.left, p.top);
    const br = toCanvas(p.right, p.bottom);
    return {
        left: tl.x,
        top: tl.y,
        right: br.x,
        bottom: br.y,
        width: br.x - tl.x,
        height: br.y - tl.y
    };
}

function pocketDefsNorm() {
    const play = getPlayAreaNorm();
    const mx = TABLE.width / 2;
    const m = TABLE.pocketRadius * 0.22;

    return {
        tl: {
            id: 'tl', kind: 'corner', wall: 'tl',
            anchorX: play.left, anchorY: play.top,
            x: play.left + m, y: play.top + m,
            holeX: play.left - POCKET_DEPTH * 0.55,
            holeY: play.top - POCKET_DEPTH * 0.55
        },
        tm: {
            id: 'tm', kind: 'side', wall: 'top',
            anchorX: mx, anchorY: play.top,
            x: mx, y: play.top + m * 0.5,
            holeX: mx, holeY: play.top - POCKET_DEPTH * 0.65
        },
        tr: {
            id: 'tr', kind: 'corner', wall: 'tr',
            anchorX: play.right, anchorY: play.top,
            x: play.right - m, y: play.top + m,
            holeX: play.right + POCKET_DEPTH * 0.55,
            holeY: play.top - POCKET_DEPTH * 0.55
        },
        br: {
            id: 'br', kind: 'corner', wall: 'br',
            anchorX: play.right, anchorY: play.bottom,
            x: play.right - m, y: play.bottom - m,
            holeX: play.right + POCKET_DEPTH * 0.55,
            holeY: play.bottom + POCKET_DEPTH * 0.55
        },
        bm: {
            id: 'bm', kind: 'side', wall: 'bottom',
            anchorX: mx, anchorY: play.bottom,
            x: mx, y: play.bottom - m * 0.5,
            holeX: mx, holeY: play.bottom + POCKET_DEPTH * 0.65
        },
        bl: {
            id: 'bl', kind: 'corner', wall: 'bl',
            anchorX: play.left, anchorY: play.bottom,
            x: play.left + m, y: play.bottom - m,
            holeX: play.left - POCKET_DEPTH * 0.55,
            holeY: play.bottom + POCKET_DEPTH * 0.55
        }
    };
}

function canvasPocket(p) {
    const hole = toCanvas(p.holeX, p.holeY);
    const anchor = toCanvas(p.anchorX, p.anchorY);
    const mouth = toCanvas(p.x, p.y);
    return {
        ...p,
        anchorX: anchor.x,
        anchorY: anchor.y,
        x: mouth.x,
        y: mouth.y,
        drawX: hole.x,
        drawY: hole.y
    };
}

export function getTableSurface() {
    const playNorm = getPlayAreaNorm();
    const play = getPlayArea();
    const pocketsNorm = pocketDefsNorm();
    const pockets = Object.fromEntries(
        Object.entries(pocketsNorm).map(([k, v]) => [k, canvasPocket(v)])
    );
    const segments = segmentDefsNorm(playNorm, pocketsNorm);
    return { play, playNorm, pockets, segments };
}

export function getPockets() {
    const { pockets } = getTableSurface();
    return [pockets.tl, pockets.tm, pockets.tr, pockets.br, pockets.bm, pockets.bl];
}

export function getPocket(id) {
    return getTableSurface().pockets[id];
}

function segmentDefsNorm(play, pockets) {
    const mx = TABLE.width / 2;
    const my = TABLE.height / 2;
    const J = CORNER_JAW;
    const h = SIDE_JAW;

    return [
        { id: 'tl_chamfer', name: 'Верхний левый скос', kind: 'corner_chamfer', pocketId: 'tl' },
        { id: 'top_left', name: 'Верхний левый прямой борт', kind: 'straight', wall: 'top', x1: play.left + J, y1: play.top, x2: mx - h, y2: play.top },
        { id: 'tm_jaw_left', name: 'Левый скос средней лузы', kind: 'pocket_jaw', pocketId: 'tm', wall: 'top', side: 'left' },
        { id: 'tm_jaw_right', name: 'Правый скос средней лузы', kind: 'pocket_jaw', pocketId: 'tm', wall: 'top', side: 'right' },
        { id: 'top_right', name: 'Верхний правый прямой борт', kind: 'straight', wall: 'top', x1: mx + h, y1: play.top, x2: play.right - J, y2: play.top },
        { id: 'tr_chamfer', name: 'Верхний правый скос', kind: 'corner_chamfer', pocketId: 'tr' },
        { id: 'right_upper', name: 'Правый верхний вертикальный борт', kind: 'straight', wall: 'right', x1: play.right, y1: play.top + J, x2: play.right, y2: my },
        { id: 'right_lower', name: 'Правый нижний вертикальный борт', kind: 'straight', wall: 'right', x1: play.right, y1: my, x2: play.right, y2: play.bottom - J },
        { id: 'br_chamfer', name: 'Нижний правый скос', kind: 'corner_chamfer', pocketId: 'br' },
        { id: 'bottom_right', name: 'Нижний правый прямой борт', kind: 'straight', wall: 'bottom', x1: play.right - J, y1: play.bottom, x2: mx + h, y2: play.bottom },
        { id: 'bm_jaw_right', name: 'Правый скос средней лузы', kind: 'pocket_jaw', pocketId: 'bm', wall: 'bottom', side: 'right' },
        { id: 'bm_jaw_left', name: 'Левый скос средней лузы', kind: 'pocket_jaw', pocketId: 'bm', wall: 'bottom', side: 'left' },
        { id: 'bottom_left', name: 'Нижний левый прямой борт', kind: 'straight', wall: 'bottom', x1: mx - h, y1: play.bottom, x2: play.left + J, y2: play.bottom },
        { id: 'bl_chamfer', name: 'Нижний левый скос', kind: 'corner_chamfer', pocketId: 'bl' },
        { id: 'left_lower', name: 'Левый нижний вертикальный борт', kind: 'straight', wall: 'left', x1: play.left, y1: play.bottom - J, x2: play.left, y2: my },
        { id: 'left_upper', name: 'Левый верхний вертикальный борт', kind: 'straight', wall: 'left', x1: play.left, y1: my, x2: play.left, y2: play.top + J }
    ];
}

export function getRailSegments() {
    return getTableSurface().segments;
}

export function getStraightSegments() {
    return getRailSegments().filter(s => s.kind === 'straight');
}

function insetPoint(x, y, wall) {
    if (wall === 'top') return { x, y: y + CUSHION_FACE };
    if (wall === 'bottom') return { x, y: y - CUSHION_FACE };
    if (wall === 'left') return { x: x + CUSHION_FACE, y };
    if (wall === 'right') return { x: x - CUSHION_FACE, y };
    return { x, y };
}

function insetChamfer(x, y, corner) {
    const d = CUSHION_FACE * 0.707;
    if (corner === 'tl') return { x: x + d, y: y + d };
    if (corner === 'tr') return { x: x - d, y: y + d };
    if (corner === 'bl') return { x: x + d, y: y - d };
    if (corner === 'br') return { x: x - d, y: y - d };
    return { x, y };
}

function quadToCanvas(p1, p2, p3, p4) {
    return [toCanvas(p1.x, p1.y), toCanvas(p2.x, p2.y), toCanvas(p3.x, p3.y), toCanvas(p4.x, p4.y)];
}

/** 16 четырёхугольников подушек бортов для отрисовки */
export function getCushionRenderQuads() {
    const play = getPlayAreaNorm();
    const segments = segmentDefsNorm(play, pocketDefsNorm());
    const pocketsNorm = pocketDefsNorm();
    const J = CORNER_JAW;
    const h = SIDE_JAW;
    const quads = [];

    for (const seg of segments) {
        if (seg.kind === 'straight') {
            const i1 = insetPoint(seg.x1, seg.y1, seg.wall);
            const i2 = insetPoint(seg.x2, seg.y2, seg.wall);
            quads.push({
                id: seg.id,
                name: seg.name,
                wall: seg.wall,
                points: quadToCanvas(
                    { x: seg.x1, y: seg.y1 },
                    { x: seg.x2, y: seg.y2 },
                    i2,
                    i1
                )
            });
        } else if (seg.kind === 'corner_chamfer') {
            const p = pocketsNorm[seg.pocketId];
            const { wall } = p;
            let a, b, corner;
            if (wall === 'tl') { a = { x: play.left, y: play.top + J }; b = { x: play.left + J, y: play.top }; corner = 'tl'; }
            else if (wall === 'tr') { a = { x: play.right - J, y: play.top }; b = { x: play.right, y: play.top + J }; corner = 'tr'; }
            else if (wall === 'br') { a = { x: play.right, y: play.bottom - J }; b = { x: play.right - J, y: play.bottom }; corner = 'br'; }
            else { a = { x: play.left + J, y: play.bottom }; b = { x: play.left, y: play.bottom - J }; corner = 'bl'; }
            quads.push({
                id: seg.id,
                name: seg.name,
                wall,
                points: quadToCanvas(a, b, insetChamfer(b.x, b.y, corner), insetChamfer(a.x, a.y, corner))
            });
        } else if (seg.kind === 'pocket_jaw') {
            const p = pocketsNorm[seg.pocketId];
            const ax = p.anchorX;
            const ay = p.anchorY;
            if (seg.wall === 'top') {
                if (seg.side === 'left') {
                    const a = { x: ax - h, y: ay };
                    const b = { x: ax, y: ay - POCKET_JAW };
                    quads.push({
                        id: seg.id, name: seg.name, wall: 'top',
                        points: quadToCanvas(a, b, insetChamfer(b.x, b.y, 'tl'), insetPoint(a.x, a.y, 'top'))
                    });
                } else {
                    const a = { x: ax, y: ay - POCKET_JAW };
                    const b = { x: ax + h, y: ay };
                    quads.push({
                        id: seg.id, name: seg.name, wall: 'top',
                        points: quadToCanvas(a, b, insetPoint(b.x, b.y, 'top'), insetChamfer(a.x, a.y, 'tr'))
                    });
                }
            } else if (seg.wall === 'bottom') {
                if (seg.side === 'right') {
                    const a = { x: ax + h, y: ay };
                    const b = { x: ax, y: ay + POCKET_JAW };
                    quads.push({
                        id: seg.id, name: seg.name, wall: 'bottom',
                        points: quadToCanvas(a, b, insetChamfer(b.x, b.y, 'br'), insetPoint(a.x, a.y, 'bottom'))
                    });
                } else {
                    const a = { x: ax, y: ay + POCKET_JAW };
                    const b = { x: ax - h, y: ay };
                    quads.push({
                        id: seg.id, name: seg.name, wall: 'bottom',
                        points: quadToCanvas(a, b, insetPoint(b.x, b.y, 'bottom'), insetChamfer(a.x, a.y, 'bl'))
                    });
                }
            }
        }
    }

    return quads;
}

export function getPocketRenderData() {
    const r = TABLE.pocketRadius;
    return getPockets().map(p => ({
        id: p.id,
        kind: p.kind,
        wall: p.wall,
        x: p.drawX,
        y: p.drawY,
        radius: p.kind === 'corner' ? r * SX * 1.05 : r * SX * 0.92,
        collarRadius: TABLE.pocketMouth * SX * 0.55,
        lipX: p.anchorX,
        lipY: p.anchorY
    }));
}

export function tracePlaySurface(path) {
    const { playNorm: play, segments, pockets } = getTableSurface();
    const pocketsNorm = pocketDefsNorm();
    const J = CORNER_JAW;
    const h = SIDE_JAW;

    path.moveTo(toCanvas(play.left, play.top + J).x, toCanvas(play.left, play.top + J).y);

    for (const seg of segments) {
        if (seg.kind === 'corner_chamfer') {
            const p = pocketsNorm[seg.pocketId];
            const { wall } = p;
            if (wall === 'tl') path.lineTo(toCanvas(play.left + J, play.top).x, toCanvas(play.left + J, play.top).y);
            else if (wall === 'tr') path.lineTo(toCanvas(play.right, play.top + J).x, toCanvas(play.right, play.top + J).y);
            else if (wall === 'br') path.lineTo(toCanvas(play.right - J, play.bottom).x, toCanvas(play.right - J, play.bottom).y);
            else path.lineTo(toCanvas(play.left, play.bottom - J).x, toCanvas(play.left, play.bottom - J).y);
        } else if (seg.kind === 'straight') {
            path.lineTo(toCanvas(seg.x2, seg.y2).x, toCanvas(seg.x2, seg.y2).y);
        } else if (seg.kind === 'pocket_jaw') {
            const p = pocketsNorm[seg.pocketId];
            const ax = p.anchorX;
            const ay = p.anchorY;
            if (seg.wall === 'top') {
                if (seg.side === 'left') path.lineTo(toCanvas(ax, ay - POCKET_JAW).x, toCanvas(ax, ay - POCKET_JAW).y);
                else path.lineTo(toCanvas(ax + h, ay).x, toCanvas(ax + h, ay).y);
            } else if (seg.wall === 'bottom') {
                if (seg.side === 'right') path.lineTo(toCanvas(ax, ay + POCKET_JAW).x, toCanvas(ax, ay + POCKET_JAW).y);
                else path.lineTo(toCanvas(ax - h, ay).x, toCanvas(ax - h, ay).y);
            }
        }
    }

    path.closePath();
}

export function traceOuterRail(path) {
    path.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    tracePlaySurface(path);
    getPockets().forEach(p => tracePocketNotch(path, p));
}

function traceCornerNotchNorm(path, pocket, play) {
    const J = CORNER_JAW;
    const d = POCKET_DEPTH;
    const bend = TABLE.pocketMouth * 0.42;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    const pt = (x, y) => {
        const c = toCanvas(x, y);
        path.lineTo(c.x, c.y);
    };
    const mv = (x, y) => {
        const c = toCanvas(x, y);
        path.moveTo(c.x, c.y);
    };

    if (wall === 'tl') {
        mv(ax + J, ay); pt(ax + bend, ay + bend); pt(ax, ay + J); pt(ax - d * 0.62, ay - d * 0.62);
    } else if (wall === 'tr') {
        mv(ax - J, ay); pt(ax - bend, ay + bend); pt(ax, ay + J); pt(ax + d * 0.62, ay - d * 0.62);
    } else if (wall === 'bl') {
        mv(ax + J, ay); pt(ax + bend, ay - bend); pt(ax, ay - J); pt(ax - d * 0.62, ay + d * 0.62);
    } else if (wall === 'br') {
        mv(ax - J, ay); pt(ax - bend, ay - bend); pt(ax, ay - J); pt(ax + d * 0.62, ay + d * 0.62);
    }
    path.closePath();
}

function traceSideNotchNorm(path, pocket) {
    const h = SIDE_JAW;
    const d = POCKET_DEPTH;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    const pt = (x, y) => {
        const c = toCanvas(x, y);
        path.lineTo(c.x, c.y);
    };
    const mv = (x, y) => {
        const c = toCanvas(x, y);
        path.moveTo(c.x, c.y);
    };

    if (wall === 'top') {
        mv(ax - h, ay);
        pt(ax - h * 0.18, ay - POCKET_JAW * 0.55);
        pt(ax, ay - d * 0.72);
        pt(ax + h * 0.18, ay - POCKET_JAW * 0.55);
        pt(ax + h, ay);
    } else if (wall === 'bottom') {
        mv(ax - h, ay);
        pt(ax - h * 0.18, ay + POCKET_JAW * 0.55);
        pt(ax, ay + d * 0.72);
        pt(ax + h * 0.18, ay + POCKET_JAW * 0.55);
        pt(ax + h, ay);
    }
    path.closePath();
}

export function tracePocketNotch(path, pocket) {
    const pocketsNorm = pocketDefsNorm();
    const p = pocketsNorm[pocket.id];
    if (pocket.kind === 'corner') traceCornerNotchNorm(path, p, getPlayAreaNorm());
    else traceSideNotchNorm(path, p);
}

export function pocketAffectsWall(pocket, wall) {
    if (wall === 'left') return pocket.wall === 'tl' || pocket.wall === 'bl';
    if (wall === 'right') return pocket.wall === 'tr' || pocket.wall === 'br';
    if (wall === 'top') return pocket.wall === 'tl' || pocket.wall === 'tr' || pocket.wall === 'top';
    if (wall === 'bottom') return pocket.wall === 'bl' || pocket.wall === 'br' || pocket.wall === 'bottom';
    return false;
}

export function getCushionFacing(segment, insetPx = 4) {
    if (segment.kind !== 'straight') return null;
    const a = toCanvas(segment.x1, segment.y1);
    const b = toCanvas(segment.x2, segment.y2);
    const { wall } = segment;
    if (wall === 'top') return { x1: a.x, y1: a.y + insetPx, x2: b.x, y2: b.y + insetPx };
    if (wall === 'bottom') return { x1: a.x, y1: a.y - insetPx, x2: b.x, y2: b.y - insetPx };
    if (wall === 'left') return { x1: a.x + insetPx, y1: a.y, x2: b.x + insetPx, y2: b.y };
    if (wall === 'right') return { x1: a.x - insetPx, y1: a.y, x2: b.x - insetPx, y2: b.y };
    return null;
}

export function getCornerCushionFacings(insetPx = 4) {
    const play = getPlayAreaNorm();
    const J = CORNER_JAW;
    const tl = toCanvas(play.left, play.top + J);
    const tr = toCanvas(play.right - J, play.top);
    const tr2 = toCanvas(play.right, play.top + J);
    const br = toCanvas(play.right, play.bottom - J);
    const br2 = toCanvas(play.right - J, play.bottom);
    const bl = toCanvas(play.left + J, play.bottom);
    const bl2 = toCanvas(play.left, play.bottom - J);
    const tl2 = toCanvas(play.left + J, play.top);
    const tlInset = toCanvas(play.left, play.top + J);
    return [
        { x1: tlInset.x + insetPx, y1: tlInset.y + insetPx, x2: tl2.x + insetPx, y2: tl2.y + insetPx },
        { x1: tr.x, y1: tr.y + insetPx, x2: tr2.x - insetPx, y2: tr2.y + insetPx },
        { x1: br.x - insetPx, y1: br.y - insetPx, x2: br2.x - insetPx, y2: br2.y - insetPx },
        { x1: bl.x + insetPx, y1: bl.y - insetPx, x2: bl2.x + insetPx, y2: bl2.y - insetPx }
    ];
}

// Legacy exports used by utils
export const CORNER_JAW_ALONG = CORNER_JAW * SX;
export const SIDE_NOTCH_HALF = SIDE_JAW * SX;

export function traceCornerNotch(path, pocket) { tracePocketNotch(path, pocket); }
export function traceSideNotch(path, pocket) { tracePocketNotch(path, pocket); }
export function traceFeltPocketCut(path, pocket) { tracePocketNotch(path, pocket); }

/** Сегменты подушек для физики (canvas coords, нормаль внутрь стола) */
export function getCushionCollisionSegments() {
    const play = getPlayAreaNorm();
    const pocketsNorm = pocketDefsNorm();
    const segDefs = segmentDefsNorm(play, pocketsNorm);
    const h = SIDE_JAW;
    const segments = [];

    let ax = play.left;
    let ay = play.top + CORNER_JAW;

    function emit(x2, y2, meta = {}) {
        const a = toCanvas(ax, ay);
        const b = toCanvas(x2, y2);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len >= 0.5) {
            segments.push({
                x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                nx: -dy / len,
                ny: dx / len,
                ...meta
            });
        }
        ax = x2;
        ay = y2;
    }

    for (const seg of segDefs) {
        if (seg.kind === 'corner_chamfer') {
            const p = pocketsNorm[seg.pocketId];
            if (p.wall === 'tl') emit(play.left + CORNER_JAW, play.top, { pocketId: seg.pocketId });
            else if (p.wall === 'tr') emit(play.right, play.top + CORNER_JAW, { pocketId: seg.pocketId });
            else if (p.wall === 'br') emit(play.right - CORNER_JAW, play.bottom, { pocketId: seg.pocketId });
            else emit(play.left, play.bottom - CORNER_JAW, { pocketId: seg.pocketId });
        } else if (seg.kind === 'straight') {
            emit(seg.x2, seg.y2, { wall: seg.wall });
        } else if (seg.kind === 'pocket_jaw') {
            const p = pocketsNorm[seg.pocketId];
            if (seg.wall === 'top') {
                if (seg.side === 'left') emit(p.anchorX, p.anchorY - POCKET_JAW, { pocketId: seg.pocketId, jaw: true });
                else emit(p.anchorX + h, p.anchorY, { pocketId: seg.pocketId, jaw: true });
            } else if (seg.wall === 'bottom') {
                if (seg.side === 'right') emit(p.anchorX, p.anchorY + POCKET_JAW, { pocketId: seg.pocketId, jaw: true });
                else emit(p.anchorX - h, p.anchorY, { pocketId: seg.pocketId, jaw: true });
            }
        }
    }

    return segments;
}
