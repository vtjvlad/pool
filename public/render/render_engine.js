import { BALL_RADIUS } from '../constants.js';
import { drawTable } from './drawing_table.js';
import { drawBall } from './ball_renderer.js';
import {
    drawCueStick,
    drawTrajectory,
    drawSpinMark
} from './drawing_cue.js';

function drawImpactFlash(ctx, flash) {
    if (!flash) return;
    const t = flash.t;
    const alpha = 0.5 * (1 - t);
    ctx.save();
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, BALL_RADIUS + t * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 2.5 * (1 - t);
    ctx.stroke();
    ctx.restore();
}

function drawCueScene(ctx, cueBall, cue, typeface) {
    if (!cue?.visible || !cueBall) return;

    const fakeCueBall = { x: cueBall.x, y: cueBall.y };
    drawTrajectory(
        ctx,
        cue.angle,
        fakeCueBall,
        cue.aimX,
        cue.aimY,
        cue.trajectory,
        cue.aimLineVariant,
        cue.aimModifierEnabled
    );
    drawSpinMark(ctx, fakeCueBall, cue.angle, cue.spinOffsetX, cue.spinOffsetY);
    drawCueStick(ctx, cue.tipX, cue.tipY, cue.angle);
}

export function initRenderEngine(ctx, typeface) {
    ctx.setTypeface(typeface);
    return { ctx, typeface };
}

export function drawFrame(ctx, state, typeface) {
    const { balls, cue, impactFlash } = state;
    const cueBall = balls.find(b => b.isCueBall && !b.inPocket);

    drawTable(ctx, state.debug?.drawRubber);

    for (const ball of balls) {
        if (!ball.pocketFall) drawBall(ctx, ball, typeface);
    }
    for (const ball of balls) {
        if (ball.pocketFall) drawBall(ctx, ball, typeface);
    }

    drawImpactFlash(ctx, impactFlash);

    if (cue) {
        drawCueScene(ctx, cueBall, cue, typeface);
    }
}
