import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    MAX_PULL,
    POWER_FACTOR,
    STRIKE_ANIM_BASE_MS,
    IMPACT_FLASH_MS,
    MIN_POWER_PERCENT,
    BALL_RADIUS,
    MAX_SPIN_OFFSET,
    SPIN_SIDE_POWER,
    SPIN_TOP_POWER,
    SPIN_MASSE_FACTOR
} from './constants.js';
import { Ball } from './ball.js';
import { createRack } from './game_logic.js';
import { stepPhysics, updatePocketAnimations } from './physics_engine.js';
import { predictCueTrajectory } from './physics.js';
import { drawTable } from './drawing_table.js';
import { drawCueStick, drawTrajectory, drawSpinMark, getCueTipPosition } from './drawing_cue.js';
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
let spinOffsetX = 0;
let spinOffsetY = 0;
let isAdjustingSpin = false;
let activeSpinPointerId = null;
let lastSpinTapTime = 0;

function resetSpin() {
    spinOffsetX = 0;
    spinOffsetY = 0;
}

function isOnCueBall(x, y) {
    if (!cueBall || !canShowCue()) return false;
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    return dx * dx + dy * dy < (BALL_RADIUS * 1.85) ** 2;
}

function updateSpinFromPoint(x, y) {
    const perpX = -Math.sin(aimAngle);
    const perpY = Math.cos(aimAngle);
    const backX = -Math.cos(aimAngle);
    const backY = -Math.sin(aimAngle);
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    let localX = (dx * perpX + dy * perpY) / BALL_RADIUS;
    let localY = (dx * backX + dy * backY) / BALL_RADIUS;
    const len = Math.hypot(localX, localY);
    if (len > MAX_SPIN_OFFSET) {
        localX = (localX / len) * MAX_SPIN_OFFSET;
        localY = (localY / len) * MAX_SPIN_OFFSET;
    }
    spinOffsetX = localX;
    spinOffsetY = localY;
}

function applySpinToCueBall(power, angle) {
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    cueBall.spin = spinOffsetX * SPIN_SIDE_POWER * power;
    cueBall.topSpin = spinOffsetY * SPIN_TOP_POWER * power;
    cueBall.vx += perpX * spinOffsetX * SPIN_MASSE_FACTOR * power;
    cueBall.vy += perpY * spinOffsetX * SPIN_MASSE_FACTOR * power;
    resetSpin();
}

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
    return cueBall && !cueBall.inPocket && !cueBall.isPocketing() && !cueBall.isMoving() && !strikeAnim;
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
        const power = strikeAnim.power;
        const angle = strikeAnim.angle;
        cueBall.vx = Math.cos(angle) * power;
        cueBall.vy = Math.sin(angle) * power;
        applySpinToCueBall(power, angle);
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
    const tip = getCueTipPosition(cueBall, angle, pullBack, spinOffsetX, spinOffsetY);
    const path = predictCueTrajectory(angle, cueBall, balls);
    drawTrajectory(ctx, angle, cueBall, aimX, aimY, path);
    drawSpinMark(ctx, cueBall, angle, spinOffsetX, spinOffsetY);
    drawCueStick(ctx, tip.x, tip.y, angle);
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
    resetSpin();
    isPullingPower = false;
    activePullPointerId = null;
}

function update() {
    updateStrikeAnim();
    updateImpactFlash();

    stepPhysics(balls);
    updatePocketAnimations(balls);

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
    balls.forEach(ball => {
        if (!ball.isPocketing()) ball.draw(ctx);
    });
    balls.forEach(ball => {
        if (ball.isPocketing()) ball.draw(ctx);
    });
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
    if (!canShowCue() || isAdjustingSpin) return;
    const pos = canvasPointerPosition(e);
    updateAimFromPoint(pos.x, pos.y);
}

function handleSpinAdjust(e) {
    if (!canShowCue()) return;
    const pos = canvasPointerPosition(e);
    updateSpinFromPoint(pos.x, pos.y);
}

canvas.addEventListener('pointerdown', (e) => {
    if (!canShowCue()) return;
    const pos = canvasPointerPosition(e);

    if (isOnCueBall(pos.x, pos.y)) {
        const now = Date.now();
        if (now - lastSpinTapTime <= 300) {
            resetSpin();
            lastSpinTapTime = 0;
            return;
        }
        lastSpinTapTime = now;
        canvas.setPointerCapture(e.pointerId);
        isAdjustingSpin = true;
        activeSpinPointerId = e.pointerId;
        handleSpinAdjust(e);
        return;
    }

    canvas.setPointerCapture(e.pointerId);
    activeCanvasPointerId = e.pointerId;
    handleCanvasAim(e);
});

canvas.addEventListener('pointermove', (e) => {
    if (isAdjustingSpin && e.pointerId === activeSpinPointerId) {
        handleSpinAdjust(e);
        return;
    }
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    handleCanvasAim(e);
});

canvas.addEventListener('pointerup', (e) => {
    if (isAdjustingSpin && e.pointerId === activeSpinPointerId) {
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        isAdjustingSpin = false;
        activeSpinPointerId = null;
        return;
    }
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    handleCanvasAim(e);
    activeCanvasPointerId = null;
});

canvas.addEventListener('pointercancel', (e) => {
    if (isAdjustingSpin && e.pointerId === activeSpinPointerId) {
        isAdjustingSpin = false;
        activeSpinPointerId = null;
        return;
    }
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
