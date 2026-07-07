import { BALL_RADIUS, BALL_DEFS, RACK_ORDER, RACK_POSITION_JITTER } from './constants.js';
import { getFootSpot } from './utils.js';
import { Ball, randomBallMass } from './ball.js';

function shuffledRackNumbers() {
    const solids = [1, 2, 3, 4, 5, 6, 7];
    const stripes = [9, 10, 11, 12, 13, 14, 15];
    const pick = arr => arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
    const leftCorner = pick(solids);
    const rightCorner = pick(stripes);
    const swapCorners = Math.random() < 0.5;
    const corners = swapCorners ? [rightCorner, leftCorner] : [leftCorner, rightCorner];
    const others = [...solids, ...stripes];
    for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
    }

    const numbers = [...corners, ...others];
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return {
        leftCorner: corners[0],
        rightCorner: corners[1],
        pool: numbers.filter(n => n !== corners[0] && n !== corners[1])
    };
}

export function createRack() {
    const foot = getFootSpot();
    const spacing = BALL_RADIUS * 2.02;
    const colSpacing = Math.sqrt(3) * BALL_RADIUS * 1.01;
    const rackBalls = [];
    const randomRack = shuffledRackNumbers();
    let randomIdx = 0;

    RACK_ORDER.forEach((row, rowIdx) => {
        row.forEach((num, colIdx) => {
            const isCenter = rowIdx === 2 && colIdx === 1;
            const isLeftCorner = rowIdx === 4 && colIdx === 0;
            const isRightCorner = rowIdx === 4 && colIdx === 4;
            const actualNum = isCenter
                ? 8
                : isLeftCorner
                    ? randomRack.leftCorner
                    : isRightCorner
                        ? randomRack.rightCorner
                        : randomRack.pool[randomIdx++];
            const def = BALL_DEFS[actualNum];
            const x = foot.x + rowIdx * colSpacing + (Math.random() * 2 - 1) * RACK_POSITION_JITTER;
            const y = foot.y + (colIdx - (row.length - 1) / 2) * spacing + (Math.random() * 2 - 1) * RACK_POSITION_JITTER;
            rackBalls.push(new Ball(x, y, {
                number: actualNum,
                color: def.color,
                ballType: def.type,
                mass: randomBallMass()
            }));
        });
    });

    return rackBalls;
}
