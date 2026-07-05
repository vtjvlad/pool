import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    LAYOUT_WIDTH,
    LAYOUT_HEIGHT,
    MAX_PULL,
    POWER_FACTOR,
    STRIKE_ANIM_BASE_MS,
    IMPACT_FLASH_MS,
    MIN_POWER_PERCENT,
    BALL_RADIUS,
    MAX_SPIN_OFFSET,
    SPIN_SIDE_POWER,
    SPIN_TOP_POWER,
    SLIDE_FROM_OFFSET,
    REFERENCE_FPS,
    MAX_PHYSICS_DT,
    AIM_TAP_THRESHOLD_PX,
    AIM_TAP_MAX_MS,
    AIM_MARKER_MIN_DIST,
    AIM_BALL_DEAD_ZONE,
    AIM_SLIDER_SENSITIVITY,
    AIM_WHEEL_SCROLL_PX
} from './constants.js';
import { Ball } from './ball.js';
import { createRack } from './game_logic.js';
import { stepPhysics, updatePocketAnimations } from './physics_engine.js';
import { predictCueTrajectory } from './physics.js';
import { drawTable } from './drawing_table.js';
import { drawCueStick, drawTrajectory, drawSpinMark, getCueTipPosition } from './drawing_cue.js';
import { getHeadSpot, lighten, darken } from './utils.js';

const canvas = document.getElementById('billiard-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');
const powerValue = document.getElementById('power-value');
const powerTrack = document.getElementById('power-pull-track');
const powerFill = document.getElementById('power-pull-fill');
const powerThumb = document.getElementById('power-pull-thumb');
const spinPad = document.getElementById('spin-pad');
const spinThumb = document.getElementById('spin-pad-thumb');
const spinResetBtn = document.getElementById('spin-reset-btn');
const aimTrack = document.getElementById('aim-slider-track');
const aimWheelNotches = document.getElementById('aim-wheel-notches');
const aimDegrees = document.getElementById('aim-degrees');
const gameContainer = document.getElementById('game-container');
const gameStage = document.getElementById('game-stage');
const traySlots = document.getElementById('pocketed-tray-slots');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function fitGameLayout() {
    if (!gameContainer || !gameStage) return;
    const availW = gameContainer.clientWidth;
    const availH = gameContainer.clientHeight;
    if (availW <= 0 || availH <= 0) return;

    const scale = Math.min(availW / LAYOUT_WIDTH, availH / LAYOUT_HEIGHT) * 0.9;
    gameStage.style.transform = `scale(${scale})`;
}

let landscapeLockTried = false;

function tryLockLandscape() {
    if (landscapeLockTried) return;
    landscapeLockTried = true;
    // Отключено требование альбомной ориентации
    // screen.orientation?.lock?.('landscape')?.catch(() => {});
}

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
let isDraggingSpin = false;
let activeSpinPadPointerId = null;
let isDraggingAimSlider = false;
let activeAimSliderPointerId = null;
let aimSliderLastY = null;
let aimPointer = null;
let lastFrameTime = performance.now();

const TRAY_CAPACITY = 15;

function resetTray() {
    traySlots.innerHTML = '';
    for (let i = 0; i < TRAY_CAPACITY; i++) {
        const slot = document.createElement('div');
        slot.className = 'tray-slot';
        traySlots.appendChild(slot);
    }
}

function miniBallBackground(ball) {
    if (ball.ballType === 'stripe') {
        return `linear-gradient(180deg,
            #f6f2ea 0%, #f6f2ea 22%,
            ${ball.color} 22%, ${ball.color} 78%,
            #f6f2ea 78%, #f6f2ea 100%)`;
    }
    return `radial-gradient(circle at 32% 28%, ${lighten(ball.color, 70)}, ${ball.color} 60%, ${darken(ball.color, 40)})`;
}

function addBallToTray(ball) {
    const slot = traySlots.querySelector('.tray-slot:not(.filled)');
    if (!slot) return;
    slot.classList.add('filled');
    slot.style.background = miniBallBackground(ball);
    const num = document.createElement('span');
    num.className = 'mini-ball-number';
    num.textContent = ball.number;
    slot.appendChild(num);
}

function updateSpinPadVisual() {
    const percentX = 50 + (spinOffsetX / MAX_SPIN_OFFSET) * 38;
    const percentY = 50 + (spinOffsetY / MAX_SPIN_OFFSET) * 38;
    spinThumb.style.left = `${percentX}%`;
    spinThumb.style.top = `${percentY}%`;
}

function setSpinOffset(localX, localY) {
    const len = Math.hypot(localX, localY);
    if (len > MAX_SPIN_OFFSET) {
        localX = (localX / len) * MAX_SPIN_OFFSET;
        localY = (localY / len) * MAX_SPIN_OFFSET;
    }
    spinOffsetX = localX;
    spinOffsetY = localY;
    updateSpinPadVisual();
}

function resetSpin() {
    setSpinOffset(0, 0);
}

function spinFromPadEvent(e) {
    const rect = spinPad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const radius = rect.width * 0.42;
    setSpinOffset(
        (dx / radius) * MAX_SPIN_OFFSET,
        (dy / radius) * MAX_SPIN_OFFSET
    );
}

function applySpinToCueBall(power, angle) {
    cueBall.spin = spinOffsetX * SPIN_SIDE_POWER * power;
    cueBall.topSpin = -spinOffsetY * SPIN_TOP_POWER * power;
    const offCenter = Math.hypot(spinOffsetX, spinOffsetY) / MAX_SPIN_OFFSET;
    cueBall.slide = Math.min(1, offCenter * SLIDE_FROM_OFFSET);
    resetSpin();
}

function getAimAngle() {
    return aimAngle;
}

function normalizeAngle(angle) {
    while (angle <= -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    return angle;
}

function getAimMarkerDistance() {
    const dist = Math.hypot(aimX - cueBall.x, aimY - cueBall.y);
    return Math.max(AIM_MARKER_MIN_DIST, dist);
}

function aimDegreesLabel(angle) {
    const deg = Math.round((normalizeAngle(angle) * 180 / Math.PI + 360) % 360);
    return `${deg}°`;
}

function updateAimSliderVisual() {
    aimDegrees.textContent = aimDegreesLabel(aimAngle);
    if (aimWheelNotches) {
        aimWheelNotches.style.transform = `translateY(${-normalizeAngle(aimAngle) * AIM_WHEEL_SCROLL_PX}px)`;
    }
}

function setAimAngle(angle) {
    aimAngle = normalizeAngle(angle);
    const dist = getAimMarkerDistance();
    aimX = cueBall.x + Math.cos(aimAngle) * dist;
    aimY = cueBall.y + Math.sin(aimAngle) * dist;
    updateAimSliderVisual();
}

function updateAimFromPoint(x, y) {
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    if (dx * dx + dy * dy < AIM_BALL_DEAD_ZONE * AIM_BALL_DEAD_ZONE) return;
    aimX = x;
    aimY = y;
    aimAngle = Math.atan2(dy, dx);
    updateAimSliderVisual();
}

function canAdjustAim() {
    return canShowCue();
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

function canAdjustSpin() {
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
    aimPointer = null;
    isDraggingAimSlider = false;
    activeAimSliderPointerId = null;
    aimSliderLastY = null;
    scoreElement.textContent = score;
    resetTray();

    const head = getHeadSpot();
    cueBall = new Ball(head.x, head.y, { isCueBall: true });
    balls.push(cueBall);
    balls.push(...createRack());

    updateAimFromPoint(cueBall.x + CANVAS_WIDTH * 0.16, cueBall.y);
    resetPowerPull();
    resetSpin();
    isPullingPower = false;
    activePullPointerId = null;
    lastFrameTime = performance.now();
}

function update(now = performance.now()) {
    const deltaMs = Math.min(now - lastFrameTime, MAX_PHYSICS_DT * 1000);
    lastFrameTime = now;
    const frameScale = (deltaMs / 1000) * REFERENCE_FPS;

    updateStrikeAnim();
    updateImpactFlash();

    stepPhysics(balls, frameScale);
    updatePocketAnimations(balls);

    balls.forEach(ball => {
        if (ball.inPocket && !ball.isCueBall && !scoredBalls.has(ball)) {
            scoredBalls.add(ball);
            score++;
            scoreElement.textContent = score;
            addBallToTray(ball);
        }
    });

    if (isPullingPower && !canShowCue()) {
        resetPowerPull();
        isPullingPower = false;
        activePullPointerId = null;
    }

    if ((isDraggingAimSlider || aimPointer) && !canShowCue()) {
        isDraggingAimSlider = false;
        activeAimSliderPointerId = null;
        aimSliderLastY = null;
        aimTrack.classList.remove('is-dragging');
        activeCanvasPointerId = null;
        aimPointer = null;
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

function gameLoop(now) {
    update(now);
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

function handleCanvasAimMove(e) {
    if (!canShowCue() || !aimPointer) return;
    const pos = canvasPointerPosition(e);
    aimPointer.x = pos.x;
    aimPointer.y = pos.y;

    const moved = Math.hypot(pos.x - aimPointer.startX, pos.y - aimPointer.startY);

    if (aimPointer.mode === 'pending' && moved >= AIM_TAP_THRESHOLD_PX) {
        aimPointer.mode = 'rotate';
        aimPointer.lastAngle = Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);
    }

    if (aimPointer.mode === 'rotate') {
        const pointerAngle = Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);
        let delta = pointerAngle - aimPointer.lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        setAimAngle(aimAngle + delta);
        aimPointer.lastAngle = pointerAngle;
    }
}

function finishCanvasAim(e) {
    if (!aimPointer) return;
    if (e && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

    if (aimPointer.mode === 'pending') {
        const elapsed = performance.now() - aimPointer.startTime;
        const moved = Math.hypot(aimPointer.x - aimPointer.startX, aimPointer.y - aimPointer.startY);
        if (elapsed <= AIM_TAP_MAX_MS && moved < AIM_TAP_THRESHOLD_PX) {
            updateAimFromPoint(aimPointer.x, aimPointer.y);
        }
    }

    activeCanvasPointerId = null;
    aimPointer = null;
}

canvas.addEventListener('pointerdown', (e) => {
    if (!canShowCue()) return;
    tryLockLandscape();
    const pos = canvasPointerPosition(e);
    canvas.setPointerCapture(e.pointerId);
    activeCanvasPointerId = e.pointerId;
    aimPointer = {
        id: e.pointerId,
        startX: pos.x,
        startY: pos.y,
        x: pos.x,
        y: pos.y,
        startTime: performance.now(),
        lastAngle: Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x),
        mode: 'pending'
    };
});

canvas.addEventListener('pointermove', (e) => {
    if (activeCanvasPointerId === null || e.pointerId !== activeCanvasPointerId) return;
    handleCanvasAimMove(e);
});

canvas.addEventListener('pointerup', (e) => {
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    finishCanvasAim(e);
});

canvas.addEventListener('pointercancel', (e) => {
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    finishCanvasAim(e);
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
window.addEventListener('resize', fitGameLayout);
window.addEventListener('orientationchange', () => {
    setTimeout(fitGameLayout, 100);
});

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

spinPad.addEventListener('pointerdown', (e) => {
    if (!canAdjustSpin()) return;
    e.preventDefault();
    spinPad.setPointerCapture(e.pointerId);
    isDraggingSpin = true;
    activeSpinPadPointerId = e.pointerId;
    spinPad.classList.add('is-dragging');
    spinFromPadEvent(e);
});

spinPad.addEventListener('pointermove', (e) => {
    if (!isDraggingSpin || e.pointerId !== activeSpinPadPointerId) return;
    spinFromPadEvent(e);
});

function finishSpinDrag(e) {
    if (!isDraggingSpin || (e && e.pointerId !== activeSpinPadPointerId)) return;
    if (e && spinPad.hasPointerCapture(e.pointerId)) spinPad.releasePointerCapture(e.pointerId);
    isDraggingSpin = false;
    activeSpinPadPointerId = null;
    spinPad.classList.remove('is-dragging');
}

spinPad.addEventListener('pointerup', finishSpinDrag);
spinPad.addEventListener('pointercancel', finishSpinDrag);
spinResetBtn.addEventListener('click', resetSpin);

aimTrack.addEventListener('pointerdown', (e) => {
    if (!canAdjustAim()) return;
    e.preventDefault();
    aimTrack.setPointerCapture(e.pointerId);
    isDraggingAimSlider = true;
    activeAimSliderPointerId = e.pointerId;
    aimSliderLastY = e.clientY;
    aimTrack.classList.add('is-dragging');
});

aimTrack.addEventListener('pointermove', (e) => {
    if (!isDraggingAimSlider || e.pointerId !== activeAimSliderPointerId || aimSliderLastY === null) return;
    const deltaY = e.clientY - aimSliderLastY;
    aimSliderLastY = e.clientY;
    setAimAngle(aimAngle + deltaY * AIM_SLIDER_SENSITIVITY);
});

function finishAimSliderDrag(e) {
    if (!isDraggingAimSlider || (e && e.pointerId !== activeAimSliderPointerId)) return;
    if (e && aimTrack.hasPointerCapture(e.pointerId)) aimTrack.releasePointerCapture(e.pointerId);
    isDraggingAimSlider = false;
    activeAimSliderPointerId = null;
    aimSliderLastY = null;
    aimTrack.classList.remove('is-dragging');
}

aimTrack.addEventListener('pointerup', finishAimSliderDrag);
aimTrack.addEventListener('pointercancel', finishAimSliderDrag);

resetBtn.addEventListener('click', initGame);

updateSpinPadVisual();
updateAimSliderVisual();
initGame();
fitGameLayout();
gameLoop();
