import {
    MAX_SPIN_OFFSET,
    SPIN_SIDE_POWER,
    SPIN_TOP_POWER,
    SLIDE_FROM_OFFSET,
    SLIDE_FROM_SIDE_SCALE,
    SQUIRT_FACTOR,
    SPIN_TIP_EFFICIENCY,
    SPIN_STRENGTH,
    spinSpeedEffectiveness,
    drawSpeedEffectiveness
} from './constants.js';

export function spinOffsetNormalized(spinOffsetX, spinOffsetY) {
    return {
        offX: spinOffsetX / MAX_SPIN_OFFSET,
        offY: spinOffsetY / MAX_SPIN_OFFSET
    };
}

export function hasSignificantSpin(spinOffsetX, spinOffsetY) {
    const { offX, offY } = spinOffsetNormalized(spinOffsetX, spinOffsetY);
    return Math.hypot(offX, offY) > 0.04;
}

/** Применяет винт к шару. Возвращает false, если винт в пределах мёртвой зоны. */
export function applySpinToBall(cueBall, power, angle, spinOffsetX, spinOffsetY) {
    const { offX, offY } = spinOffsetNormalized(spinOffsetX, spinOffsetY);
    const offCenter = Math.hypot(offX, offY);

    if (offCenter <= 0.04) {
        cueBall.slide = 0;
        cueBall.topSpin = 0;
        cueBall.spin = 0;
        return false;
    }

    const tipEff = 1 - offCenter * SPIN_TIP_EFFICIENCY;
    const sideOff = Math.sign(offX) * Math.pow(Math.abs(offX), 0.9);
    const topOff = Math.sign(offY) * Math.pow(Math.abs(offY), 0.88);
    const speedEff = spinSpeedEffectiveness(power);
    const drawEff = drawSpeedEffectiveness(power);
    const topSpeedEff = Math.abs(topOff) > 0.04 ? drawEff : 1;

    cueBall.spin = sideOff * SPIN_SIDE_POWER * power * tipEff * speedEff * SPIN_STRENGTH;
    cueBall.topSpin = -topOff * SPIN_TOP_POWER * power * tipEff * topSpeedEff * SPIN_STRENGTH;

    const slideFromSide = Math.abs(sideOff) * SLIDE_FROM_OFFSET * SLIDE_FROM_SIDE_SCALE;
    const slideFromTop = Math.abs(topOff) * 0.88;
    cueBall.slide = Math.min(1, Math.max(slideFromSide, slideFromTop) + offCenter * 0.16);

    if (Math.abs(sideOff) > 0.05) {
        const squirtAngle = -sideOff * SQUIRT_FACTOR * (0.5 + power * 0.055) * speedEff * SPIN_STRENGTH;
        const shotAngle = angle + squirtAngle;
        cueBall.vx = Math.cos(shotAngle) * power;
        cueBall.vy = Math.sin(shotAngle) * power;
    }

    return true;
}
