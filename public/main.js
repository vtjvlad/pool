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
    REFERENCE_FPS,
    MAX_PHYSICS_DT,
    AIM_TAP_THRESHOLD_PX,
    AIM_TAP_MAX_MS,
    AIM_MARKER_MIN_DIST,
    AIM_BALL_DEAD_ZONE,
    AIM_SLIDER_SENSITIVITY,
    AIM_WHEEL_SCROLL_PX,
    AIM_SMOOTH_RATE,
    AIM_SMOOTH_RATE_DRAG,
    POWER_SMOOTH_RATE,
    POWER_SMOOTH_RATE_DRAG,
    sliderPosToPower,
    powerToSliderPos,
    POWER_MARK_PERCENTS,
    AIM_LINE_VARIANTS,
    AIM_LINE_LABELS,
    AIM_MODIFIER_STORAGE_KEY,
    AIM_MODIFIER_LABEL,
    BALL_RESTITUTION_PROFILE,
    CUSHION_RESTITUTION_PROFILE,
    PHYSICS_MODE,
    PHYSICS_MODES,
    CUSHION_LIP_SCALE,
    CUSHION_LIP_SCALE_MIN,
    CUSHION_LIP_SCALE_MAX,
    CUSHION_LIP_SCALE_STEP,
    setBallRestitutionProfile,
    setCushionRestitutionProfile,
    setPhysicsMode,
    setCushionLipScale,
    EXTENDED_CUE_MAX_CONTACTS,
    MAX_CUE_MAX_CONTACTS,
    MAX_TARGET_MAX_CONTACTS
} from './constants.js';
import { Ball, randomBallMass } from './ball.js';
import { createRack } from './game_logic.js';
import { stepPhysics, updatePocketAnimations } from './physics_engine.js';
import { invalidateCushionCollisionCache } from './cushion_collision.js';
import { predictCueTrajectory, predictExtendedCueTrajectory } from './physics.js';
import { predictSimulatedTrajectory } from './physics_preview.js';
import { applySpinToBall, hasSignificantSpin } from './spin.js';
import { drawTable } from './drawing_table.js';
import { drawCueStick, drawTrajectory, drawSpinMark, getCueTipPosition } from './drawing_cue.js';
import { getHeadSpot, lighten, darken, getPockets, getPlaySurface } from './utils.js';

// Полностью блокируем браузерный зум: double-tap, pinch, Ctrl/Cmd+wheel и клавиши.
const preventBrowserZoom = e => e.preventDefault();
const zoomBlockOptions = { passive: false, capture: true };
let lastTouchEndAt = 0;

document.addEventListener('dblclick', preventBrowserZoom, zoomBlockOptions);
document.addEventListener('gesturestart', preventBrowserZoom, zoomBlockOptions);
document.addEventListener('gesturechange', preventBrowserZoom, zoomBlockOptions);
document.addEventListener('gestureend', preventBrowserZoom, zoomBlockOptions);
document.addEventListener('touchstart', e => {
    if (e.touches.length > 1) e.preventDefault();
}, zoomBlockOptions);
document.addEventListener('touchmove', e => {
    if (e.touches.length > 1) e.preventDefault();
}, zoomBlockOptions);
document.addEventListener('touchend', e => {
    const now = performance.now();
    if (now - lastTouchEndAt < 350) e.preventDefault();
    lastTouchEndAt = now;
}, zoomBlockOptions);
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, zoomBlockOptions);
window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
    }
}, zoomBlockOptions);

const canvas = document.getElementById('billiard-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');
const powerValue = document.getElementById('power-value');
const powerTrack = document.getElementById('power-pull-track');
const powerMarks = document.getElementById('power-pull-marks');
const powerFill = document.getElementById('power-pull-fill');
const powerThumb = document.getElementById('power-pull-thumb');
const aimTrack = document.getElementById('aim-slider-track');
const aimWheelNotches = document.getElementById('aim-wheel-notches');
const aimDegrees = document.getElementById('aim-degrees');
const aimLineVariantBtn = document.getElementById('aim-line-variant-btn');
const aimModifierBtn = document.getElementById('aim-modifier-btn');
const ballRestitutionBtn = document.getElementById('ball-restitution-btn');
const cushionRestitutionBtn = document.getElementById('cushion-restitution-btn');
const physicsModeBtn = document.getElementById('physics-mode-btn');
const cushionLipBtn = document.getElementById('cushion-lip-btn');
const spinPad = document.getElementById('spin-pad');
const spinThumb = document.getElementById('spin-pad-thumb');
const spinResetBtn = document.getElementById('spin-reset-btn');
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
let aimAngleTarget = 0;
let shotPower = 0;
let shotPowerTarget = 0;
let isPullingPower = false;
let activePullPointerId = null;
let activeCanvasPointerId = null;
let score = 0;
const scoredBalls = new Set();
let strikeAnim = null;
let impactFlash = null;
let isDraggingAimSlider = false;
let activeAimSliderPointerId = null;
let aimSliderLastY = null;
let aimPointer = null;
let aimLineVariant = 'off';
let aimModifierEnabled = false;
let lastFrameTime = performance.now();

let spinOffsetX = 0;
let spinOffsetY = 0;
let isDraggingSpin = false;
let activeSpinPadPointerId = null;

const AIM_LINE_VARIANT_KEY = 'vtj-pool-aim-line-variant';
const BALL_RESTITUTION_PROFILE_KEY = 'vtj-pool-ball-restitution-profile';
const CUSHION_RESTITUTION_PROFILE_KEY = 'vtj-pool-cushion-restitution-profile';
const PHYSICS_MODE_KEY = 'vtj-pool-physics-mode';

function loadAimLineVariant() {
    try {
        const saved = localStorage.getItem(AIM_LINE_VARIANT_KEY);
        const normalized = saved === 'ghost' ? 'off' : saved === 'classic' ? 'on' : saved;
        if (AIM_LINE_VARIANTS.includes(normalized)) aimLineVariant = normalized;
    } catch {
        // ignore storage errors
    }
}

function updateAimLineVariantButton() {
    if (!aimLineVariantBtn) return;
    aimLineVariantBtn.textContent = AIM_LINE_LABELS[aimLineVariant];
    const variantActive = aimLineVariant !== 'off';
    aimLineVariantBtn.classList.toggle('is-active', variantActive && !aimModifierEnabled);
    aimLineVariantBtn.disabled = aimModifierEnabled;
    aimLineVariantBtn.classList.toggle('is-disabled', aimModifierEnabled);
    aimLineVariantBtn.setAttribute(
        'aria-label',
        aimModifierEnabled
            ? 'Вариант прицела: off (при включённом mod доступен только off)'
            : `Вариант прицела: ${AIM_LINE_LABELS[aimLineVariant]}. Нажмите для переключения`
    );
}

function cycleAimLineVariant() {
    if (aimModifierEnabled) return;
    const index = AIM_LINE_VARIANTS.indexOf(aimLineVariant);
    aimLineVariant = AIM_LINE_VARIANTS[(index + 1) % AIM_LINE_VARIANTS.length];
    try {
        localStorage.setItem(AIM_LINE_VARIANT_KEY, aimLineVariant);
    } catch {
        // ignore storage errors
    }
    updateAimLineVariantButton();
}

function loadAimModifier() {
    try {
        const saved = localStorage.getItem(AIM_MODIFIER_STORAGE_KEY);
        if (saved === '1' || saved === 'true') aimModifierEnabled = true;
        else if (saved === '0' || saved === 'false') aimModifierEnabled = false;
        if (aimModifierEnabled) aimLineVariant = 'off';
    } catch {
        // ignore storage errors
    }
}

function updateAimModifierButton() {
    if (!aimModifierBtn) return;
    aimModifierBtn.textContent = AIM_MODIFIER_LABEL;
    aimModifierBtn.classList.toggle('is-active', aimModifierEnabled);
    aimModifierBtn.setAttribute(
        'aria-pressed',
        aimModifierEnabled ? 'true' : 'false'
    );
    aimModifierBtn.setAttribute(
        'aria-label',
        `Модификатор прицела: ${aimModifierEnabled ? 'включён' : 'выключен'}. Нажмите для переключения`
    );
}

function toggleAimModifier() {
    aimModifierEnabled = !aimModifierEnabled;
    if (aimModifierEnabled) {
        aimLineVariant = 'off';
    }
    try {
        localStorage.setItem(AIM_MODIFIER_STORAGE_KEY, aimModifierEnabled ? '1' : '0');
    } catch {
        // ignore storage errors
    }
    updateAimModifierButton();
    updateAimLineVariantButton();
}

function updateBallRestitutionButton() {
    if (!ballRestitutionBtn) return;
    const isSoft = BALL_RESTITUTION_PROFILE === 'soft';
    ballRestitutionBtn.textContent = isSoft ? 'ball:s' : 'ball:t';
    ballRestitutionBtn.classList.toggle('is-active', !isSoft);
    ballRestitutionBtn.setAttribute(
        'aria-label',
        `Профиль упругости шара: ${BALL_RESTITUTION_PROFILE}. Нажмите для переключения`
    );
}

function updateCushionRestitutionButton() {
    if (!cushionRestitutionBtn) return;
    const isSoft = CUSHION_RESTITUTION_PROFILE === 'soft';
    cushionRestitutionBtn.textContent = isSoft ? 'cush:s' : 'cush:t';
    cushionRestitutionBtn.classList.toggle('is-active', !isSoft);
    cushionRestitutionBtn.setAttribute(
        'aria-label',
        `Профиль упругости губ: ${CUSHION_RESTITUTION_PROFILE}. Нажмите для переключения`
    );
}

function loadRestitutionProfiles() {
    try {
        const savedBall = localStorage.getItem(BALL_RESTITUTION_PROFILE_KEY);
        if (savedBall) setBallRestitutionProfile(savedBall);
        const savedCushion = localStorage.getItem(CUSHION_RESTITUTION_PROFILE_KEY);
        if (savedCushion) setCushionRestitutionProfile(savedCushion);
    } catch {
        // ignore storage errors
    }
}

function toggleBallRestitutionProfile() {
    const next = BALL_RESTITUTION_PROFILE === 'soft' ? 'tournament' : 'soft';
    setBallRestitutionProfile(next);
    try {
        localStorage.setItem(BALL_RESTITUTION_PROFILE_KEY, next);
    } catch {
        // ignore storage errors
    }
    updateBallRestitutionButton();
}

function toggleCushionRestitutionProfile() {
    const next = CUSHION_RESTITUTION_PROFILE === 'soft' ? 'tournament' : 'soft';
    setCushionRestitutionProfile(next);
    try {
        localStorage.setItem(CUSHION_RESTITUTION_PROFILE_KEY, next);
    } catch {
        // ignore storage errors
    }
    updateCushionRestitutionButton();
}

function updatePhysicsModeButton() {
    if (!physicsModeBtn) return;
    const short = PHYSICS_MODE === 'balanced' ? 'bal' : PHYSICS_MODE;
    physicsModeBtn.textContent = `mode:${short}`;
    physicsModeBtn.classList.toggle('is-active', PHYSICS_MODE !== 'real');
    physicsModeBtn.setAttribute(
        'aria-label',
        `Режим физики трения: ${PHYSICS_MODE}. Нажмите для переключения`
    );
}

function loadPhysicsMode() {
    try {
        const saved = localStorage.getItem(PHYSICS_MODE_KEY);
        if (saved) setPhysicsMode(saved);
    } catch {
        // ignore storage errors
    }
}

function togglePhysicsMode() {
    const index = PHYSICS_MODES.indexOf(PHYSICS_MODE);
    const next = PHYSICS_MODES[(index + 1) % PHYSICS_MODES.length];
    setPhysicsMode(next);
    try {
        localStorage.setItem(PHYSICS_MODE_KEY, next);
    } catch {
        // ignore storage errors
    }
    updatePhysicsModeButton();
}

function updateCushionLipButton() {
    if (!cushionLipBtn) return;
    const percent = Math.round(CUSHION_LIP_SCALE * 100);
    cushionLipBtn.textContent = `lip:${percent}%`;
    cushionLipBtn.classList.toggle('is-active', percent !== 100);
    cushionLipBtn.setAttribute(
        'aria-label',
        `Ширина губ: ${percent} процентов. Нажмите для увеличения на 10 процентов`
    );
}

function loadCushionLipScale() {
    setCushionLipScale(1.0);
    invalidateCushionCollisionCache();
}

function cycleCushionLipScale() {
    const next = CUSHION_LIP_SCALE + CUSHION_LIP_SCALE_STEP;
    const wrapped = next > CUSHION_LIP_SCALE_MAX ? CUSHION_LIP_SCALE_MIN : next;
    if (!setCushionLipScale(wrapped)) return;
    invalidateCushionCollisionCache();
    updateCushionLipButton();
}

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
    applySpinToBall(cueBall, power, angle, spinOffsetX, spinOffsetY);
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

function shortestAngleDelta(from, to) {
    let delta = normalizeAngle(to) - normalizeAngle(from);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
}

function syncAimMarkerFromAngle() {
    const dist = getAimMarkerDistance();
    aimX = cueBall.x + Math.cos(aimAngle) * dist;
    aimY = cueBall.y + Math.sin(aimAngle) * dist;
}

function snapAimAngle() {
    aimAngle = aimAngleTarget;
    syncAimMarkerFromAngle();
    updateAimSliderVisual();
}

function setAimAngleTarget(angle, instant = false) {
    aimAngleTarget = normalizeAngle(angle);
    if (instant) snapAimAngle();
}

function updateAimSmoothing(frameScale) {
    if (!canShowCue()) return;

    const delta = shortestAngleDelta(aimAngle, aimAngleTarget);
    if (Math.abs(delta) < 0.00005) {
        if (aimAngle !== aimAngleTarget) snapAimAngle();
        return;
    }

    const dragging = isDraggingAimSlider || aimPointer?.mode === 'rotate';
    const rate = dragging ? AIM_SMOOTH_RATE_DRAG : AIM_SMOOTH_RATE;
    const t = 1 - Math.exp(-rate * frameScale / REFERENCE_FPS);
    aimAngle = normalizeAngle(aimAngle + delta * t);
    syncAimMarkerFromAngle();
    updateAimSliderVisual();
}

function updateAimFromPoint(x, y) {
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    if (dx * dx + dy * dy < AIM_BALL_DEAD_ZONE * AIM_BALL_DEAD_ZONE) return;
    aimX = x;
    aimY = y;
    aimAngleTarget = Math.atan2(dy, dx);
    snapAimAngle();
}

function canAdjustAim() {
    return canShowCue();
}

function getPullFromPower() {
    return (shotPower / 100) * MAX_PULL;
}

function updatePowerVisual() {
    const power = Math.max(0, Math.min(100, shotPower));
    const sliderPos = powerToSliderPos(power);
    powerValue.textContent = `${Math.round(power)}%`;
    powerFill.style.height = `${sliderPos}%`;
    powerThumb.style.top = `${sliderPos}%`;
    powerTrack.style.setProperty('--pull-pos', `${sliderPos}%`);
    powerTrack.style.setProperty('--power-pct', String(power / 100));
    powerTrack.classList.toggle('has-power', power > 0.5 || isPullingPower);
}

function initPowerMarks() {
    if (!powerMarks) return;
    powerMarks.replaceChildren();
    for (const power of POWER_MARK_PERCENTS) {
        const mark = document.createElement('div');
        mark.className = 'power-mark';
        mark.style.top = `${powerToSliderPos(power)}%`;

        const line = document.createElement('span');
        line.className = 'power-mark-line';

        const label = document.createElement('span');
        label.className = 'power-mark-label';
        label.textContent = `${power}%`;

        mark.append(line, label);
        powerMarks.appendChild(mark);
    }
}

function snapPower() {
    shotPower = shotPowerTarget;
    updatePowerVisual();
}

function setPowerTarget(percent, instant = false) {
    shotPowerTarget = Math.max(0, Math.min(100, percent));
    if (instant) snapPower();
}

function updatePowerSmoothing(frameScale) {
    if (strikeAnim) return;

    const delta = shotPowerTarget - shotPower;
    if (Math.abs(delta) < 0.01) {
        if (shotPower !== shotPowerTarget) snapPower();
        return;
    }

    const rate = isPullingPower ? POWER_SMOOTH_RATE_DRAG : POWER_SMOOTH_RATE;
    const t = 1 - Math.exp(-rate * frameScale / REFERENCE_FPS);
    shotPower += delta * t;
    updatePowerVisual();
}

function resetPowerPull() {
    setPowerTarget(0, true);
    powerTrack.classList.remove('is-pulling');
}

function powerFromClientY(clientY) {
    const rect = powerTrack.getBoundingClientRect();
    const y = clientY - rect.top;
    const sliderPos = (Math.max(0, Math.min(rect.height, y)) / rect.height) * 100;
    return sliderPosToPower(sliderPos);
}

function allBallsSettled() {
    return balls.every(ball => !ball.isMoving());
}

function canShowCue() {
    return cueBall && !cueBall.inPocket && !cueBall.isPocketing() && allBallsSettled() && !strikeAnim;
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
    isPullingPower = false;
    activePullPointerId = null;
    powerTrack.classList.remove('is-pulling');
    snapPower();
    const power = shotPower;
    if (power >= MIN_POWER_PERCENT && canShowCue()) {
        snapAimAngle();
        startStrike(getPullFromPower(), getAimAngle());
    } else {
        setPowerTarget(0);
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

function getShotPower() {
    return getPullFromPower() * POWER_FACTOR;
}

function predictAimPath(angle) {
    const power = getShotPower();
    const spinActive = hasSignificantSpin(spinOffsetX, spinOffsetY);

    if (aimModifierEnabled || spinActive) {
        let cueMaxContacts = 2;
        if (aimLineVariant === 'max') cueMaxContacts = MAX_CUE_MAX_CONTACTS;
        else if (aimLineVariant !== 'off') cueMaxContacts = EXTENDED_CUE_MAX_CONTACTS;

        return predictSimulatedTrajectory(angle, cueBall, balls, {
            power,
            spinOffsetX,
            spinOffsetY,
            cueMaxContacts
        });
    }
    if (aimLineVariant === 'off') {
        return predictCueTrajectory(angle, cueBall, balls);
    }
    if (aimLineVariant === 'max') {
        return predictExtendedCueTrajectory(angle, cueBall, balls, {
            cueMaxContacts: MAX_CUE_MAX_CONTACTS,
            targetMaxContacts: MAX_TARGET_MAX_CONTACTS
        });
    }
    return predictExtendedCueTrajectory(angle, cueBall, balls);
}

function drawCueScene(angle, pullBack) {
    const tip = getCueTipPosition(cueBall, angle, pullBack, spinOffsetX, spinOffsetY);
    const path = predictAimPath(angle);
    const drawVariant = path.simulated ? 'off' : (aimModifierEnabled ? 'off' : aimLineVariant);
    drawTrajectory(ctx, angle, cueBall, aimX, aimY, path, drawVariant, aimModifierEnabled);
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
    cueBall = new Ball(head.x, head.y, { isCueBall: true, mass: randomBallMass() });
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
    updateAimSmoothing(frameScale);
    updatePowerSmoothing(frameScale);

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

    if (isDraggingSpin && !canShowCue()) {
        isDraggingSpin = false;
        activeSpinPadPointerId = null;
        spinPad.classList.remove('is-dragging');
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
        setAimAngleTarget(aimAngleTarget + delta);
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
    setPowerTarget(powerFromClientY(e.clientY));
});

powerTrack.addEventListener('pointermove', (e) => {
    if (!isPullingPower || e.pointerId !== activePullPointerId) return;
    setPowerTarget(powerFromClientY(e.clientY));
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
    setAimAngleTarget(aimAngleTarget + deltaY * AIM_SLIDER_SENSITIVITY);
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

if (aimLineVariantBtn) {
    aimLineVariantBtn.classList.add('aim-toggle-btn');
    aimLineVariantBtn.addEventListener('click', cycleAimLineVariant);
}

if (aimModifierBtn) {
    aimModifierBtn.classList.add('aim-toggle-btn');
    aimModifierBtn.addEventListener('click', toggleAimModifier);
}

if (ballRestitutionBtn) {
    ballRestitutionBtn.classList.add('aim-toggle-btn');
    ballRestitutionBtn.addEventListener('click', toggleBallRestitutionProfile);
}

if (cushionRestitutionBtn) {
    cushionRestitutionBtn.classList.add('aim-toggle-btn');
    cushionRestitutionBtn.addEventListener('click', toggleCushionRestitutionProfile);
}

if (physicsModeBtn) {
    physicsModeBtn.classList.add('aim-toggle-btn');
    physicsModeBtn.addEventListener('click', togglePhysicsMode);
}

if (cushionLipBtn) {
    cushionLipBtn.classList.add('aim-toggle-btn');
    cushionLipBtn.addEventListener('click', cycleCushionLipScale);
}

resetBtn.addEventListener('click', initGame);

loadAimLineVariant();
loadAimModifier();
loadRestitutionProfiles();
loadPhysicsMode();
loadCushionLipScale();
updateAimLineVariantButton();
updateAimModifierButton();
updateBallRestitutionButton();
updateCushionRestitutionButton();
updatePhysicsModeButton();
updateCushionLipButton();
updateAimSliderVisual();
initPowerMarks();
updateSpinPadVisual();
initGame();
fitGameLayout();
gameLoop();

window.__poolTest = {
    state() {
        const cue = cueBall;
        return {
            balls: balls.map(b => ({
                x: b.x, y: b.y, vx: b.vx, vy: b.vy,
                inPocket: b.inPocket, isCueBall: b.isCueBall, number: b.number,
                moving: b.isMoving(), pocketing: b.isPocketing(),
                spin: b.spin, topSpin: b.topSpin, slide: b.slide || 0
            })),
            score: scoreElement?.textContent ?? '0',
            cue: cue ? {
                x: cue.x, y: cue.y, vx: cue.vx, vy: cue.vy,
                moving: cue.isMoving(), inPocket: cue.inPocket, pocketing: cue.isPocketing(),
                spin: cue.spin, topSpin: cue.topSpin, slide: cue.slide || 0
            } : null
        };
    },

    pockets() {
        return getPockets().map(p => ({ id: p.id, x: p.x, y: p.y, r: p.radius }));
    },

    playSurface() {
        const s = getPlaySurface();
        return { left: s.left, top: s.top, right: s.right, bottom: s.bottom };
    },

    setup({ cueX, cueY, withRack = false, extraBalls = [] } = {}) {
        initGame();
        if (!withRack) {
            balls = balls.filter(b => b.isCueBall);
        }
        cueBall.x = cueX ?? cueBall.x;
        cueBall.y = cueY ?? cueBall.y;
        cueBall.vx = 0;
        cueBall.vy = 0;
        cueBall.spin = 0;
        cueBall.topSpin = 0;
        cueBall.slide = 0;
        cueBall.inPocket = false;
        cueBall.pocketFall = null;
        strikeAnim = null;
        for (const b of extraBalls) {
            balls.push(new Ball(b.x, b.y, { number: b.number ?? 1, color: b.color }));
        }
        resetSpin();
        resetPowerPull();
    },

    fire({ angle, power = 60, spinX = 0, spinY = 0 }) {
        spinOffsetX = spinX * MAX_SPIN_OFFSET;
        spinOffsetY = spinY * MAX_SPIN_OFFSET;
        const pullBack = (power / 100) * MAX_PULL;
        const p = pullBack * POWER_FACTOR;
        cueBall.vx = Math.cos(angle) * p;
        cueBall.vy = Math.sin(angle) * p;
        applySpinToCueBall(p, angle);
    },

    simulate(maxSteps = 4000) {
        const surface = getPlaySurface();
        const r = BALL_RADIUS;
        const events = [];
        const path = [];
        let prevVx = cueBall.vx;
        let prevVy = cueBall.vy;
        let bounceCount = 0;

        for (let step = 0; step < maxSteps; step++) {
            const preX = cueBall.x;
            const preY = cueBall.y;
            stepPhysics(balls, 1);
            updatePocketAnimations(balls);

            const outOfBounds =
                cueBall.x < surface.left - r * 0.5 ||
                cueBall.x > surface.right + r * 0.5 ||
                cueBall.y < surface.top - r * 0.5 ||
                cueBall.y > surface.bottom + r * 0.5;

            if (outOfBounds) {
                events.push({ type: 'escaped', step, x: cueBall.x, y: cueBall.y });
                break;
            }

            const speedBefore = Math.hypot(prevVx, prevVy);
            const dotPrev = prevVx * cueBall.vx + prevVy * cueBall.vy;
            if (speedBefore > 1.2 && dotPrev < 0 && Math.hypot(cueBall.vx, cueBall.vy) > 0.4) {
                bounceCount++;
                events.push({
                    type: 'bounce',
                    step,
                    x: cueBall.x,
                    y: cueBall.y,
                    vx: cueBall.vx,
                    vy: cueBall.vy,
                    n: bounceCount
                });
            }

            if (cueBall.inPocket || cueBall.isPocketing()) {
                events.push({ type: 'pocketed', step, x: cueBall.x, y: cueBall.y });
                break;
            }

            for (const b of balls) {
                if (!b.isCueBall && (b.inPocket || b.isPocketing())) {
                    events.push({ type: 'object_pocketed', step, number: b.number, x: b.x, y: b.y });
                }
            }

            prevVx = cueBall.vx;
            prevVy = cueBall.vy;

            if (step % 8 === 0) {
                path.push({ x: +cueBall.x.toFixed(1), y: +cueBall.y.toFixed(1) });
            }

            const anyMoving = balls.some(b => !b.inPocket && b.isMoving());
            if (!anyMoving) break;
        }

        return {
            events,
            path,
            bounces: events.filter(e => e.type === 'bounce').length,
            pocketed: events.some(e => e.type === 'pocketed'),
            objectPocketed: events.some(e => e.type === 'object_pocketed'),
            escaped: events.some(e => e.type === 'escaped'),
            final: this.state()
        };
    }
};
