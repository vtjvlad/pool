import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    RAIL_WIDTH,
    POCKET_RECESS,
    POCKET_MOUTH_INSET,
    POCKET_RAIL_DEPTH,
    SIDE_NOTCH_HALF,
    CORNER_JAW_ALONG
} from './constants.js';

/** @typedef {'corner' | 'side'} PocketKind */
/** @typedef {'tl' | 'tm' | 'tr' | 'br' | 'bm' | 'bl'} PocketId */
/** @typedef {'straight' | 'corner_chamfer' | 'pocket_jaw'} SegmentKind */

/**
 * Игровая поверхность — схема сегментов (по часовой стрелке от верхнего левого угла):
 *
 * ├── tl_chamfer           — верхний левый скос
 * ├── top_left             — верхний левый прямой борт
 * ├── tm_jaw_left          — левый скос средней (верхней) лузы
 * ├── tm_jaw_right         — правый скос средней (верхней) лузы
 * ├── top_right            — верхний правый прямой борт
 * ├── tr_chamfer           — верхний правый скос
 * ├── right_upper          — правый верхний вертикальный борт
 * ├── right_lower          — правый нижний вертикальный борт
 * ├── br_chamfer           — нижний правый скос
 * ├── bottom_right         — нижний правый прямой борт
 * ├── bm_jaw_right         — правый скос средней (нижней) лузы
 * ├── bm_jaw_left          — левый скос средней (нижней) лузы
 * ├── bottom_left          — нижний левый прямой борт
 * ├── bl_chamfer           — нижний левый скос
 * ├── left_lower           — левый нижний вертикальный борт
 * └── left_upper           — левый верхний вертикальный борт
 *
 * Лузы: tl, tm, tr, br, bm, bl
 */

export function getPlayArea() {
    return {
        left: RAIL_WIDTH,
        top: RAIL_WIDTH,
        right: CANVAS_WIDTH - RAIL_WIDTH,
        bottom: CANVAS_HEIGHT - RAIL_WIDTH,
        width: CANVAS_WIDTH - RAIL_WIDTH * 2,
        height: CANVAS_HEIGHT - RAIL_WIDTH * 2
    };
}

function pocketDefs(play) {
    const mx = play.left + play.width / 2;
    const m = POCKET_MOUTH_INSET;
    const d = POCKET_RECESS + POCKET_RAIL_DEPTH;

    return {
        tl: {
            id: 'tl',
            name: 'Верхняя левая',
            kind: 'corner',
            wall: 'tl',
            anchorX: play.left,
            anchorY: play.top,
            x: play.left + m,
            y: play.top + m,
            drawX: play.left - d * 0.58,
            drawY: play.top - d * 0.58
        },
        tm: {
            id: 'tm',
            name: 'Верхняя центральная',
            kind: 'side',
            wall: 'top',
            anchorX: mx,
            anchorY: play.top,
            x: mx,
            y: play.top + m * 0.55,
            drawX: mx,
            drawY: play.top - d * 0.62
        },
        tr: {
            id: 'tr',
            name: 'Верхняя правая',
            kind: 'corner',
            wall: 'tr',
            anchorX: play.right,
            anchorY: play.top,
            x: play.right - m,
            y: play.top + m,
            drawX: play.right + d * 0.58,
            drawY: play.top - d * 0.58
        },
        br: {
            id: 'br',
            name: 'Нижняя правая',
            kind: 'corner',
            wall: 'br',
            anchorX: play.right,
            anchorY: play.bottom,
            x: play.right - m,
            y: play.bottom - m,
            drawX: play.right + d * 0.58,
            drawY: play.bottom + d * 0.58
        },
        bm: {
            id: 'bm',
            name: 'Нижняя центральная',
            kind: 'side',
            wall: 'bottom',
            anchorX: mx,
            anchorY: play.bottom,
            x: mx,
            y: play.bottom - m * 0.55,
            drawX: mx,
            drawY: play.bottom + d * 0.62
        },
        bl: {
            id: 'bl',
            name: 'Нижняя левая',
            kind: 'corner',
            wall: 'bl',
            anchorX: play.left,
            anchorY: play.bottom,
            x: play.left + m,
            y: play.bottom - m,
            drawX: play.left - d * 0.58,
            drawY: play.bottom + d * 0.58
        }
    };
}

function segmentDefs(play) {
    const mx = play.left + play.width / 2;
    const my = play.top + play.height / 2;
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;

    return [
        {
            id: 'tl_chamfer',
            name: 'Верхний левый скос',
            kind: 'corner_chamfer',
            pocketId: 'tl',
            wall: 'top',
            facing: null
        },
        {
            id: 'top_left',
            name: 'Верхний левый прямой борт',
            kind: 'straight',
            wall: 'top',
            x1: play.left + J,
            y1: play.top,
            x2: mx - h,
            y2: play.top
        },
        {
            id: 'tm_jaw_left',
            name: 'Левый скос средней лузы',
            kind: 'pocket_jaw',
            pocketId: 'tm',
            wall: 'top',
            side: 'left'
        },
        {
            id: 'tm_jaw_right',
            name: 'Правый скос средней лузы',
            kind: 'pocket_jaw',
            pocketId: 'tm',
            wall: 'top',
            side: 'right'
        },
        {
            id: 'top_right',
            name: 'Верхний правый прямой борт',
            kind: 'straight',
            wall: 'top',
            x1: mx + h,
            y1: play.top,
            x2: play.right - J,
            y2: play.top
        },
        {
            id: 'tr_chamfer',
            name: 'Верхний правый скос',
            kind: 'corner_chamfer',
            pocketId: 'tr',
            wall: 'right'
        },
        {
            id: 'right_upper',
            name: 'Правый верхний вертикальный борт',
            kind: 'straight',
            wall: 'right',
            x1: play.right,
            y1: play.top + J,
            x2: play.right,
            y2: my
        },
        {
            id: 'right_lower',
            name: 'Правый нижний вертикальный борт',
            kind: 'straight',
            wall: 'right',
            x1: play.right,
            y1: my,
            x2: play.right,
            y2: play.bottom - J
        },
        {
            id: 'br_chamfer',
            name: 'Нижний правый скос',
            kind: 'corner_chamfer',
            pocketId: 'br',
            wall: 'bottom'
        },
        {
            id: 'bottom_right',
            name: 'Нижний правый прямой борт',
            kind: 'straight',
            wall: 'bottom',
            x1: play.right - J,
            y1: play.bottom,
            x2: mx + h,
            y2: play.bottom
        },
        {
            id: 'bm_jaw_right',
            name: 'Правый скос средней лузы',
            kind: 'pocket_jaw',
            pocketId: 'bm',
            wall: 'bottom',
            side: 'right'
        },
        {
            id: 'bm_jaw_left',
            name: 'Левый скос средней лузы',
            kind: 'pocket_jaw',
            pocketId: 'bm',
            wall: 'bottom',
            side: 'left'
        },
        {
            id: 'bottom_left',
            name: 'Нижний левый прямой борт',
            kind: 'straight',
            wall: 'bottom',
            x1: mx - h,
            y1: play.bottom,
            x2: play.left + J,
            y2: play.bottom
        },
        {
            id: 'bl_chamfer',
            name: 'Нижний левый скос',
            kind: 'corner_chamfer',
            pocketId: 'bl',
            wall: 'left'
        },
        {
            id: 'left_lower',
            name: 'Левый нижний вертикальный борт',
            kind: 'straight',
            wall: 'left',
            x1: play.left,
            y1: play.bottom - J,
            x2: play.left,
            y2: my
        },
        {
            id: 'left_upper',
            name: 'Левый верхний вертикальный борт',
            kind: 'straight',
            wall: 'left',
            x1: play.left,
            y1: my,
            x2: play.left,
            y2: play.top + J
        }
    ];
}

export function getTableSurface() {
    const play = getPlayArea();
    const pockets = pocketDefs(play);
    const segments = segmentDefs(play);
    return { play, pockets, segments };
}

export function getPockets() {
    const { pockets } = getTableSurface();
    return [pockets.tl, pockets.tm, pockets.tr, pockets.br, pockets.bm, pockets.bl];
}

export function getPocket(id) {
    return getTableSurface().pockets[id];
}

export function getRailSegments() {
    return getTableSurface().segments;
}

export function getStraightSegments() {
    return getRailSegments().filter(s => s.kind === 'straight');
}

export function pocketAffectsWall(pocket, wall) {
    if (wall === 'left') return pocket.wall === 'tl' || pocket.wall === 'bl';
    if (wall === 'right') return pocket.wall === 'tr' || pocket.wall === 'br';
    if (wall === 'top') return pocket.wall === 'tl' || pocket.wall === 'tr' || pocket.wall === 'top';
    if (wall === 'bottom') return pocket.wall === 'bl' || pocket.wall === 'br' || pocket.wall === 'bottom';
    return false;
}

export function traceCornerChamfer(path, pocket) {
    const J = CORNER_JAW_ALONG;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    if (wall === 'tl') {
        path.moveTo(ax, ay + J);
        path.lineTo(ax + J, ay);
    } else if (wall === 'tr') {
        path.moveTo(ax - J, ay);
        path.lineTo(ax, ay + J);
    } else if (wall === 'bl') {
        path.moveTo(ax + J, ay);
        path.lineTo(ax, ay - J);
    } else if (wall === 'br') {
        path.moveTo(ax, ay - J);
        path.lineTo(ax - J, ay);
    }
}

export function traceCornerNotch(path, pocket) {
    const J = CORNER_JAW_ALONG;
    const d = POCKET_RECESS + POCKET_RAIL_DEPTH;
    const bend = 13;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    if (wall === 'tl') {
        path.moveTo(ax + J, ay);
        path.quadraticCurveTo(ax + bend, ay + bend * 0.35, ax + bend, ay + bend);
        path.lineTo(ax, ay + J);
        path.quadraticCurveTo(ax - d * 0.35, ay - d * 0.15, ax - d, ay - d);
        path.closePath();
    } else if (wall === 'tr') {
        path.moveTo(ax - J, ay);
        path.quadraticCurveTo(ax - bend, ay + bend * 0.35, ax - bend, ay + bend);
        path.lineTo(ax, ay + J);
        path.quadraticCurveTo(ax + d * 0.35, ay - d * 0.15, ax + d, ay - d);
        path.closePath();
    } else if (wall === 'bl') {
        path.moveTo(ax + J, ay);
        path.quadraticCurveTo(ax + bend, ay - bend * 0.35, ax + bend, ay - bend);
        path.lineTo(ax, ay - J);
        path.quadraticCurveTo(ax - d * 0.35, ay + d * 0.15, ax - d, ay + d);
        path.closePath();
    } else if (wall === 'br') {
        path.moveTo(ax - J, ay);
        path.quadraticCurveTo(ax - bend, ay - bend * 0.35, ax - bend, ay - bend);
        path.lineTo(ax, ay - J);
        path.quadraticCurveTo(ax + d * 0.35, ay + d * 0.15, ax + d, ay + d);
        path.closePath();
    }
}

export function traceSideNotch(path, pocket) {
    const h = SIDE_NOTCH_HALF;
    const d = POCKET_RECESS + POCKET_RAIL_DEPTH;
    const { anchorX: ax, anchorY: ay, wall } = pocket;

    if (wall === 'top') {
        path.moveTo(ax - h, ay);
        path.quadraticCurveTo(ax - h * 0.65, ay - d * 0.25, ax - h * 0.5, ay - d * 0.55);
        path.quadraticCurveTo(ax - h * 0.2, ay - d * 0.85, ax, ay - d);
        path.quadraticCurveTo(ax + h * 0.2, ay - d * 0.85, ax + h * 0.5, ay - d * 0.55);
        path.quadraticCurveTo(ax + h * 0.65, ay - d * 0.25, ax + h, ay);
        path.closePath();
    } else if (wall === 'bottom') {
        path.moveTo(ax - h, ay);
        path.quadraticCurveTo(ax - h * 0.65, ay + d * 0.25, ax - h * 0.5, ay + d * 0.55);
        path.quadraticCurveTo(ax - h * 0.2, ay + d * 0.85, ax, ay + d);
        path.quadraticCurveTo(ax + h * 0.2, ay + d * 0.85, ax + h * 0.5, ay + d * 0.55);
        path.quadraticCurveTo(ax + h * 0.65, ay + d * 0.25, ax + h, ay);
        path.closePath();
    }
}

export function tracePocketNotch(path, pocket) {
    if (pocket.kind === 'corner') traceCornerNotch(path, pocket);
    else traceSideNotch(path, pocket);
}

export function traceFeltPocketCut(path, pocket) {
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;
    const bite = 9;
    const { anchorX: ax, anchorY: ay, wall, kind } = pocket;

    if (kind === 'corner') {
        const bend = 9;
        if (wall === 'tl') {
            path.moveTo(ax + J, ay);
            path.quadraticCurveTo(ax + bend, ay + bend * 0.45, ax + bend, ay + bend);
            path.lineTo(ax, ay + J);
            path.lineTo(ax - bite * 0.35, ay - bite * 0.35);
            path.closePath();
        } else if (wall === 'tr') {
            path.moveTo(ax - J, ay);
            path.quadraticCurveTo(ax - bend, ay + bend * 0.45, ax - bend, ay + bend);
            path.lineTo(ax, ay + J);
            path.lineTo(ax + bite * 0.35, ay - bite * 0.35);
            path.closePath();
        } else if (wall === 'bl') {
            path.moveTo(ax + J, ay);
            path.quadraticCurveTo(ax + bend, ay - bend * 0.45, ax + bend, ay - bend);
            path.lineTo(ax, ay - J);
            path.lineTo(ax - bite * 0.35, ay + bite * 0.35);
            path.closePath();
        } else if (wall === 'br') {
            path.moveTo(ax - J, ay);
            path.quadraticCurveTo(ax - bend, ay - bend * 0.45, ax - bend, ay - bend);
            path.lineTo(ax, ay - J);
            path.lineTo(ax + bite * 0.35, ay + bite * 0.35);
            path.closePath();
        }
    } else if (wall === 'top') {
        path.moveTo(ax - h, ay);
        path.quadraticCurveTo(ax - h * 0.42, ay - bite, ax, ay - bite * 1.05);
        path.quadraticCurveTo(ax + h * 0.42, ay - bite, ax + h, ay);
        path.lineTo(ax + h, ay + 1);
        path.lineTo(ax - h, ay + 1);
        path.closePath();
    } else if (wall === 'bottom') {
        path.moveTo(ax - h, ay);
        path.quadraticCurveTo(ax - h * 0.42, ay + bite, ax, ay + bite * 1.05);
        path.quadraticCurveTo(ax + h * 0.42, ay + bite, ax + h, ay);
        path.lineTo(ax + h, ay - 1);
        path.lineTo(ax - h, ay - 1);
        path.closePath();
    }
}

/** Контур сукна по сегментам (по часовой стрелке). */
export function tracePlaySurface(path) {
    const { play, segments, pockets } = getTableSurface();
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;

    path.moveTo(play.left, play.top + J);

    for (const seg of segments) {
        if (seg.kind === 'corner_chamfer') {
            const p = pockets[seg.pocketId];
            const { anchorX: ax, anchorY: ay, wall } = p;
            if (wall === 'tl') path.lineTo(ax + J, ay);
            else if (wall === 'tr') path.lineTo(ax, ay + J);
            else if (wall === 'br') path.lineTo(ax - J, ay);
            else if (wall === 'bl') path.lineTo(ax, ay - J);
        } else if (seg.kind === 'straight') {
            path.lineTo(seg.x2, seg.y2);
        } else if (seg.kind === 'pocket_jaw') {
            const p = pockets[seg.pocketId];
            const { anchorX: ax, anchorY: ay, wall } = p;
            if (wall === 'top') {
                if (seg.side === 'left') {
                    path.quadraticCurveTo(ax - h * 0.42, ay - 9, ax, ay - 9.45);
                } else {
                    path.quadraticCurveTo(ax + h * 0.42, ay - 9, ax + h, ay);
                }
            } else if (wall === 'bottom') {
                if (seg.side === 'right') {
                    path.quadraticCurveTo(ax + h * 0.42, ay + 9, ax, ay + 9.45);
                } else {
                    path.quadraticCurveTo(ax - h * 0.42, ay + 9, ax - h, ay);
                }
            }
        }
    }

    path.closePath();
}

export function getCushionFacing(segment, inset = 4) {
    if (segment.kind !== 'straight') return null;

    const { wall, x1, y1, x2, y2 } = segment;
    if (wall === 'top') return { x1, y1: y1 + inset, x2, y2: y2 + inset };
    if (wall === 'bottom') return { x1, y1: y1 - inset, x2, y2: y2 - inset };
    if (wall === 'left') return { x1: x1 + inset, y1, x2: x2 + inset, y2 };
    if (wall === 'right') return { x1: x1 - inset, y1, x2: x2 - inset, y2 };
    return null;
}

export function getCornerCushionFacings(inset = 4) {
    const { play, pockets } = getTableSurface();
    const J = CORNER_JAW_ALONG;
    return [
        { pocket: pockets.tl, x1: play.left + inset, y1: play.top + J, x2: play.left + J, y2: play.top + inset },
        { pocket: pockets.tr, x1: play.right - J, y1: play.top + inset, x2: play.right - inset, y2: play.top + J },
        { pocket: pockets.br, x1: play.right - inset, y1: play.bottom - J, x2: play.right - J, y2: play.bottom - inset },
        { pocket: pockets.bl, x1: play.left + J, y1: play.bottom - inset, x2: play.left + inset, y2: play.bottom - J }
    ];
}
