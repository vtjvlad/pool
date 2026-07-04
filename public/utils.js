import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export function getPlayArea() {
    return {
        left: 0,
        top: 0,
        right: CANVAS_WIDTH,
        bottom: CANVAS_HEIGHT,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    };
}

export function getHeadSpot() {
    const play = getPlayArea();
    return { x: play.left + play.width * 0.25, y: play.top + play.height / 2 };
}

export function getFootSpot() {
    const play = getPlayArea();
    return { x: play.left + play.width * 0.75, y: play.top + play.height / 2 };
}

export function lighten(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + amount);
    const g = Math.min(255, ((n >> 8) & 255) + amount);
    const b = Math.min(255, (n & 255) + amount);
    return `rgb(${r},${g},${b})`;
}

export function darken(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 255) - amount);
    const g = Math.max(0, ((n >> 8) & 255) - amount);
    const b = Math.max(0, (n & 255) - amount);
    return `rgb(${r},${g},${b})`;
}
