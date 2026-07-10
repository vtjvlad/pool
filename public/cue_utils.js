import { BALL_RADIUS } from './constants.js';

/** Позиция наклейки кия относительно битка (без отрисовки). */
export function getCueTipPosition(cueBall, angle, pullBack, spinOffsetX = 0, spinOffsetY = 0) {
    const r = BALL_RADIUS;
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const backX = -Math.cos(angle);
    const backY = -Math.sin(angle);
    const contactX = cueBall.x + backX * r + perpX * spinOffsetX * r * 0.9 + backX * spinOffsetY * r * 0.35;
    const contactY = cueBall.y + backY * r + perpY * spinOffsetX * r * 0.9 + backY * spinOffsetY * r * 0.35;
    const tipOffset = 2 + pullBack;
    return {
        x: contactX - Math.cos(angle) * tipOffset,
        y: contactY - Math.sin(angle) * tipOffset
    };
}
