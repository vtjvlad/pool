import { BALL_RADIUS, BALL_DEFS, RACK_ORDER } from './constants.js';
import { getFootSpot } from './utils.js';
import { Ball } from './ball.js';

function shuffledRackNumbers() {
    const numbers = Array.from({ length: 15 }, (_, i) => i + 1).filter(n => n !== 8);
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
}

export function createRack() {
    const foot = getFootSpot();
    const spacing = BALL_RADIUS * 2.02;
    const colSpacing = Math.sqrt(3) * BALL_RADIUS * 1.01;
    const rackBalls = [];
    const randomNums = shuffledRackNumbers();
    let randomIdx = 0;

    RACK_ORDER.forEach((row, rowIdx) => {
        row.forEach((num, colIdx) => {
            const isCenter = rowIdx === 2 && colIdx === 1;
            const actualNum = isCenter ? 8 : randomNums[randomIdx++];
            const def = BALL_DEFS[actualNum];
            const x = foot.x + rowIdx * colSpacing;
            const y = foot.y + (colIdx - (row.length - 1) / 2) * spacing;
            rackBalls.push(new Ball(x, y, {
                number: actualNum,
                color: def.color,
                ballType: def.type
            }));
        });
    });

    return rackBalls;
}
