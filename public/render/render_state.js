import { IMPACT_FLASH_MS, BALL_RADIUS, DEBUG_DRAW_RUBBER } from '../constants.js';
import { getPockets } from '../utils.js';

export function serializeBall(ball) {
    if (!ball) return null;
    const fall = ball.pocketFall;
    return {
        x: ball.x,
        y: ball.y,
        radius: ball.radius,
        orientation: ball.orientation ? { ...ball.orientation } : { w: 1, x: 0, y: 0, z: 0 },
        ballType: ball.ballType,
        color: ball.color,
        number: ball.number,
        isCueBall: !!ball.isCueBall,
        inPocket: !!ball.inPocket,
        pocketFall: fall ? {
            pocketX: fall.pocketX,
            pocketY: fall.pocketY,
            pocketDrawRadius: fall.pocketDrawRadius,
            scale: fall.scale,
            alpha: fall.alpha,
            depth: fall.depth
        } : null
    };
}

export function buildRenderState({
    balls,
    cueBall,
    strikeAnim,
    impactFlash,
    aimX,
    aimY,
    aimAngle,
    spinOffsetX,
    spinOffsetY,
    aimLineVariant,
    aimModifierEnabled,
    canShowCue,
    getPullFromPower,
    predictAimPath,
    getCueTipPosition
}) {
    let cue = null;

    if (strikeAnim) {
        const tip = getCueTipPosition(cueBall, strikeAnim.angle, strikeAnim.currentPull, spinOffsetX, spinOffsetY);
        const path = predictAimPath(strikeAnim.angle);
        cue = {
            visible: true,
            angle: strikeAnim.angle,
            pullBack: strikeAnim.currentPull,
            tipX: tip.x,
            tipY: tip.y,
            aimX,
            aimY,
            spinOffsetX,
            spinOffsetY,
            trajectory: path,
            aimLineVariant: path.simulated ? 'off' : (aimModifierEnabled ? 'off' : aimLineVariant),
            aimModifierEnabled
        };
    } else if (canShowCue) {
        const angle = aimAngle;
        const pullBack = getPullFromPower();
        const tip = getCueTipPosition(cueBall, angle, pullBack, spinOffsetX, spinOffsetY);
        const path = predictAimPath(angle);
        cue = {
            visible: true,
            angle,
            pullBack,
            tipX: tip.x,
            tipY: tip.y,
            aimX,
            aimY,
            spinOffsetX,
            spinOffsetY,
            trajectory: path,
            aimLineVariant: path.simulated ? 'off' : (aimModifierEnabled ? 'off' : aimLineVariant),
            aimModifierEnabled
        };
    }

    let flash = null;
    if (impactFlash) {
        const t = (performance.now() - impactFlash.startTime) / IMPACT_FLASH_MS;
        if (t < 1) {
            flash = { x: impactFlash.x, y: impactFlash.y, t };
        }
    }

    return {
        balls: balls.map(serializeBall),
        cue,
        impactFlash: flash,
        debug: { drawRubber: DEBUG_DRAW_RUBBER }
    };
}

export function serializePockets() {
    return getPockets().map(p => ({
        x: p.x,
        y: p.y,
        drawRadius: p.drawRadius
    }));
}
