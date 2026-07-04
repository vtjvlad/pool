import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    MAX_PULL,
    POWER_FACTOR,
    STRIKE_ANIM_BASE_MS,
    IMPACT_FLASH_MS,
    MIN_POWER_PERCENT,
    BALL_RADIUS
} from './constants.js';
import { Ball } from './ball.js';
import { createRack } from './game_logic.js';
import { resolveCollision } from './physics_engine.js';
import { predictCueTrajectory } from './physics.js';
import { drawTable } from './drawing_table.js';
import { drawCueStick, drawTrajectory } from './drawing_cue.js';
import { getHeadSpot } from './utils.js';

const canvas = document.getElementById('billiard-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');
const powerValue = document.getElementById('power-value');
const powerTrack = document.getElementById('power-pull-track');
const powerFill = document.getElementById('power-pull-fill');
const powerThumb = document.getElementById('power-pull-thumb');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let balls = [];
let cueBall;
let aimX = CANVAS_WIDTH / 2;
let aimY = CANVAS_HEIGHT / 2;
let aimAngle = 0;
let shotPower = 0;
let isPullingPower = false;
let activePullPointerId = null;
let activeCanvasPointerId = null;
let score = 0;
const scoredBalls = new Set();
let strikeAnim = null;
let impactFlash = null;

function getAimAngle() {
    return aimAngle;
}

function updateAimFromPoint(x, y) {
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    if (dx * dx + dy * dy < 36) return;
    aimX = x;
    aimY = y;
    aimAngle = Math.atan2(dy, dx);
}

function getPullFromPower() {
    return (shotPower / 100) * MAX_PULL;
}

function updatePowerVisual(percent) {
    shotPower = Math.max(0, Math.min(100, Math.round(percent)));
    powerValue.textContent = `${shotPower}%`;
    powerFill.style.height = `${shotPower}%`;
    powerThumb.style.top = `${shotPower}%`;
}

function resetPowerPull() {
    updatePowerVisual(0);
    powerTrack.classList.remove('is-pulling');
}

function powerFromClientY(clientY) {
    const rect = powerTrack.getBoundingClientRect();
    const y = clientY - rect.top;
    return (Math.max(0, Math.min(rect.height, y)) / rect.height) * 100;
}

function canShowCue() {
    return cueBall && !cueBall.inPocket && !cueBall.isMoving() && !strikeAnim;
}

function canPullPower() {
    return canShowCue();
}

function startStrike(pullBack, angle) {
    strikeAnim = {
        angle,
        pullBack,
        power: pullBack * POWER_FACTOR,
        startTime: performance.now(),
        duration: STRIKE_ANIM_BASE_MS + pullBack * 0.55
    };
    resetPowerPull();
}

function releasePowerPull() {
    if (!isPullingPower) return;
    const power = shotPower;
    isPullingPower = false;
    activePullPointerId = null;
    powerTrack.classList.remove('is-pulling');
    if (power >= MIN_POWER_PERCENT && canShowCue()) {
        startStrike(getPullFromPower(), getAimAngle());
    } else {
        resetPowerPull();
    }
}

function updateStrikeAnim() {
    if (!strikeAnim) return;
    const elapsed = performance.now() - strikeAnim.startTime;
    const progress = Math.min(elapsed / strikeAnim.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    strikeAnim.currentPull = strikeAnim.pullBack * (1 - eased);
    if (progress >= 1) {
        cueBall.vx = Math.cos(strikeAnim.angle) * strikeAnim.power;
        cueBall.vy = Math.sin(strikeAnim.angle) * strikeAnim.power;
        impactFlash = { x: cueBall.x, y: cueBall.y, startTime: performance.now() };
        strikeAnim = null;
    }
}

function updateImpactFlash() {
    if (impactFlash && performance.now() - impactFlash.startTime > IMPACT_FLASH_MS) {
        impactFlash = null;
    }
}

function drawImpactFlash() {
    if (!impactFlash) return;
    const t = (performance.now() - impactFlash.startTime) / IMPACT_FLASH_MS;
    const alpha = 0.5 * (1 - t);
    ctx.save();
    ctx.beginPath();
    ctx.arc(impactFlash.x, impactFlash.y, BALL_RADIUS + t * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 2.5 * (1 - t);
    ctx.stroke();
    ctx.restore();
}

function drawCueScene(angle, pullBack) {
    const tipOffset = BALL_RADIUS + 2 + pullBack;
    const path = predictCueTrajectory(angle, cueBall, balls);
    drawTrajectory(ctx, angle, cueBall, aimX, aimY, path);
    drawCueStick(
        ctx,
        cueBall.x - Math.cos(angle) * tipOffset,
        cueBall.y - Math.sin(angle) * tipOffset,
        angle
    );
}

function initGame() {
    balls = [];
    score = 0;
    scoredBalls.clear();
    strikeAnim = null;
    impactFlash = null;
    activeCanvasPointerId = null;
    scoreElement.textContent = score;

    const head = getHeadSpot();
    cueBall = new Ball(head.x, head.y, { isCueBall: true });
    balls.push(cueBall);
    balls.push(...createRack());

    updateAimFromPoint(cueBall.x + CANVAS_WIDTH * 0.16, cueBall.y);
    resetPowerPull();
    isPullingPower = false;
    activePullPointerId = null;
}

function update() {
    updateStrikeAnim();
    updateImpactFlash();

    for (const ball of balls) ball.update(balls);

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            if (!balls[i].inPocket && !balls[j].inPocket) {
                resolveCollision(balls[i], balls[j]);
            }
        }
    }

    balls.forEach(ball => {
        if (ball.inPocket && !ball.isCueBall && !scoredBalls.has(ball)) {
            scoredBalls.add(ball);
            score++;
            scoreElement.textContent = score;
        }
    });

    if (isPullingPower && !canShowCue()) {
        resetPowerPull();
        isPullingPower = false;
        activePullPointerId = null;
    }
}

function draw() {
    drawTable(ctx);
    balls.forEach(ball => ball.draw(ctx));
    drawImpactFlash();

    if (strikeAnim) {
        drawCueScene(strikeAnim.angle, strikeAnim.currentPull);
        return;
    }
    if (canShowCue()) {
        drawCueScene(getAimAngle(), getPullFromPower());
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function canvasPointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function handleCanvasAim(e) {
    if (!canShowCue()) return;
    const pos = canvasPointerPosition(e);
    updateAimFromPoint(pos.x, pos.y);
}

canvas.addEventListener('pointerdown', (e) => {
    if (!canShowCue()) return;
    canvas.setPointerCapture(e.pointerId);
    activeCanvasPointerId = e.pointerId;
    handleCanvasAim(e);
});

canvas.addEventListener('pointermove', (e) => {
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    handleCanvasAim(e);
});

canvas.addEventListener('pointerup', (e) => {
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    handleCanvasAim(e);
    activeCanvasPointerId = null;
});

canvas.addEventListener('pointercancel', (e) => {
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    activeCanvasPointerId = null;
});

let lastCanvasTouchEnd = 0;
canvas.addEventListener('touchstart', (e) => {
    if (Date.now() - lastCanvasTouchEnd <= 300) {
        e.preventDefault();
    }
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    lastCanvasTouchEnd = Date.now();
}, { passive: false });
canvas.addEventListener('gesturestart', (e) => e.preventDefault());

const VIEWPORT_CONTENT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

function resetViewportScale() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    requestAnimationFrame(() => {
        meta.setAttribute('content', VIEWPORT_CONTENT);
    });
}
resetViewportScale();
window.addEventListener('pageshow', resetViewportScale);

powerTrack.addEventListener('pointerdown', (e) => {
    if (!canPullPower()) return;
    e.preventDefault();
    powerTrack.setPointerCapture(e.pointerId);
    isPullingPower = true;
    activePullPointerId = e.pointerId;
    powerTrack.classList.add('is-pulling');
    updatePowerVisual(powerFromClientY(e.clientY));
});

powerTrack.addEventListener('pointermove', (e) => {
    if (!isPullingPower || e.pointerId !== activePullPointerId) return;
    updatePowerVisual(powerFromClientY(e.clientY));
});

function finishPowerPull(e) {
    if (!isPullingPower || (e && e.pointerId !== activePullPointerId)) return;
    if (powerTrack.hasPointerCapture(e.pointerId)) powerTrack.releasePointerCapture(e.pointerId);
    releasePowerPull();
}

powerTrack.addEventListener('pointerup', finishPowerPull);
powerTrack.addEventListener('pointercancel', finishPowerPull);
resetBtn.addEventListener('click', initGame);

initGame();
gameLoop();
