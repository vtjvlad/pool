import { BALL_RADIUS, BALL_DEFS, RACK_ORDER } from './constants.js';
import { getFootSpot } from './utils.js';
import { Ball } from './ball.js';

export function createRack() {
    const foot = getFootSpot();
    const spacing = BALL_RADIUS * 2.02;
    const colSpacing = Math.sqrt(3) * BALL_RADIUS * 1.01;
    const rackBalls = [];

    RACK_ORDER.forEach((row, rowIdx) => {
        row.forEach((num, colIdx) => {
            const def = BALL_DEFS[num];
            const x = foot.x + rowIdx * colSpacing;
            const y = foot.y + (colIdx - (row.length - 1) / 2) * spacing;
            rackBalls.push(new Ball(x, y, {
                number: num,
                color: def.color,
                ballType: def.type
            }));
        });
    });

    return rackBalls;
}
