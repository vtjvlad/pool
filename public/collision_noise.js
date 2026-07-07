import { COLLISION_NORMAL_JITTER, LOW_SPEED_THRESHOLD } from './constants.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function jitterScale(impactSpeed) {
    const { minImpactSpeed, minSpeedFactor, slowSpeedScale } = COLLISION_NORMAL_JITTER;
    if (impactSpeed <= minImpactSpeed) return 0;

    const speedFactor = clamp(impactSpeed / 8, minSpeedFactor, 1);
    const slowFactor = impactSpeed < LOW_SPEED_THRESHOLD ? slowSpeedScale : 1;
    return speedFactor * slowFactor;
}

/** Слегка поворачивает нормаль столкновения в пределах maxDeg * speedScale */
export function jitterCollisionNormal(nx, ny, kind, impactSpeed, enabled = COLLISION_NORMAL_JITTER.enabled) {
    if (!enabled) return { nx, ny };
    if (!COLLISION_NORMAL_JITTER.enabled) return { nx, ny };

    const scale = jitterScale(impactSpeed);
    if (scale <= 0) return { nx, ny };

    const maxDeg = kind === 'cushion'
        ? COLLISION_NORMAL_JITTER.cushionMaxDeg
        : COLLISION_NORMAL_JITTER.ballMaxDeg;
    const angle = (Math.random() * 2 - 1) * maxDeg * (Math.PI / 180) * scale;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
        nx: nx * cos - ny * sin,
        ny: nx * sin + ny * cos
    };
}
