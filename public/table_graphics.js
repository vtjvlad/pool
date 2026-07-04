import { TABLE, CANVAS_WIDTH } from './constants.js';
import { getPlayArea } from './table_geometry.js';
import {
    getCushionRenderQuads,
    getPocketRenderData,
    traceOuterRail,
    tracePlaySurface
} from './table_geometry.js';

/** Diamond marker positions on the outer rail (canvas coords) */
export function getRailDiamonds() {
    const area = getPlayArea();
    const midY = (area.top + area.bottom) / 2;
    const inset = TABLE.cushionWidth * (CANVAS_WIDTH / TABLE.width) * 0.55;
    const longSpacing = (area.width - inset * 2) / 6;
    const diamonds = [];

    for (let i = 1; i <= 5; i++) {
        diamonds.push({ x: area.left + inset + longSpacing * i, y: area.top - inset * 0.45 });
        diamonds.push({ x: area.left + inset + longSpacing * i, y: area.bottom + inset * 0.45 });
    }

    diamonds.push({ x: area.left - inset * 0.45, y: midY });
    diamonds.push({ x: area.right + inset * 0.45, y: midY });

    return diamonds;
}

/** 16 именованных четырёхугольников бортов */
export function getCushionQuads() {
    return getCushionRenderQuads();
}

export { getPocketRenderData, traceOuterRail, tracePlaySurface };

/** Baulk line and spot positions (canvas coords) */
export function getTableMarkings() {
    const area = getPlayArea();

    return {
        baulkLine: area.left + area.width * TABLE.kitchenDepth,
        centerSpot: { x: (area.left + area.right) / 2, y: (area.top + area.bottom) / 2 },
        headSpot: { x: area.left + area.width * TABLE.kitchenDepth * 0.55, y: (area.top + area.bottom) / 2 },
        footSpot: { x: area.left + area.width * 0.75, y: (area.top + area.bottom) / 2 }
    };
}
