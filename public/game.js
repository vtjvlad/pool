const canvas = document.getElementById('billiard-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');
const powerValue = document.getElementById('power-value');
const powerTrack = document.getElementById('power-pull-track');
const powerFill = document.getElementById('power-pull-fill');
const powerThumb = document.getElementById('power-pull-thumb');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const BALL_RADIUS = 10;
const FRICTION = 0.985;
const POCKET_RADIUS = 25;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

class Ball {
    constructor(x, y, vx, vy, color, isCueBall = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = BALL_RADIUS;
        this.color = color;
        this.isCueBall = isCueBall;
        this.inPocket = false;
    }

    draw() {
        if (this.inPocket) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if (this.inPocket) return;

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x + this.radius > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.radius;
            this.vx *= -1;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1;
        } else if (this.y + this.radius > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.radius;
            this.vy *= -1;
        }

        const pockets = [
            { x: 0, y: 0 },
            { x: CANVAS_WIDTH / 2, y: 0 },
            { x: CANVAS_WIDTH, y: 0 },
            { x: 0, y: CANVAS_HEIGHT },
            { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT },
            { x: CANVAS_WIDTH, y: CANVAS_HEIGHT }
        ];

        for (const pocket of pockets) {
            const dx = this.x - pocket.x;
            const dy = this.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < POCKET_RADIUS) {
                this.inPocket = true;
                this.vx = 0;
                this.vy = 0;
                if (this.isCueBall) {
                    setTimeout(() => {
                        this.inPocket = false;
                        this.x = 200;
                        this.y = CANVAS_HEIGHT / 2;
                        this.vx = 0;
                        this.vy = 0;
                    }, 500);
                }
            }
        }
    }

    isMoving() {
        return Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;
    }
}

const CUE_LENGTH = 280;
const CUE_WIDTH = 7;
const MAX_PULL = 120;
const MIN_POWER_PERCENT = 5;
const POWER_FACTOR = 0.12;
const STRIKE_ANIM_BASE_MS = 90;
const IMPACT_FLASH_MS = 220;
const TRAJECTORY_EXTEND = 22;
const BOUNCE_PREVIEW_LEN = 58;
const MIN_BOUNCE_DRAW = 0.08;

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
let scoredBalls = new Set();
let strikeAnim = null;
let impactFlash = null;

function getAimAngle() {
    return aimAngle;
}

function updateAimFromPoint(x, y) {
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    if (dx * dx + dy * dy < 16) return;

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
    const clamped = Math.max(0, Math.min(rect.height, y));
    return (clamped / rect.height) * 100;
}

function canPullPower() {
    return canShowCue();
}

function canShowCue() {
    return cueBall && !cueBall.inPocket && !cueBall.isMoving() && !strikeAnim;
}

function startStrike(pullBack, angle) {
    strikeAnim = {
        angle,
        pullBack,
        power: pullBack * POWER_FACTOR,
        startTime: performance.now(),
        duration: STRIKE_ANIM_BASE_MS + pullBack * 0.6
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
        impactFlash = {
            x: cueBall.x,
            y: cueBall.y,
            startTime: performance.now()
        };
        strikeAnim = null;
    }
}

function updateImpactFlash() {
    if (!impactFlash) return;
    if (performance.now() - impactFlash.startTime > IMPACT_FLASH_MS) {
        impactFlash = null;
    }
}

function drawImpactFlash() {
    if (!impactFlash) return;

    const elapsed = performance.now() - impactFlash.startTime;
    const t = elapsed / IMPACT_FLASH_MS;
    const radius = BALL_RADIUS + t * 18;
    const alpha = 0.55 * (1 - t);

    ctx.save();
    ctx.beginPath();
    ctx.arc(impactFlash.x, impactFlash.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3 * (1 - t);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(impactFlash.x, impactFlash.y, radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
    ctx.fill();
    ctx.restore();
}

function drawCueStick(tipX, tipY, angle) {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle + Math.PI);

    const shadowOffset = 3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-shadowOffset, -CUE_WIDTH / 2 + shadowOffset, CUE_LENGTH, CUE_WIDTH);

    const bodyGrad = ctx.createLinearGradient(0, -CUE_WIDTH / 2, 0, CUE_WIDTH / 2);
    bodyGrad.addColorStop(0, '#c4956a');
    bodyGrad.addColorStop(0.35, '#e8c9a0');
    bodyGrad.addColorStop(0.65, '#d4a574');
    bodyGrad.addColorStop(1, '#8b6914');

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(0, -CUE_WIDTH / 2, CUE_LENGTH, CUE_WIDTH);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(CUE_LENGTH * 0.72, -CUE_WIDTH / 2 - 1, CUE_LENGTH * 0.18, CUE_WIDTH + 2);

    ctx.fillStyle = '#2c1810';
    ctx.fillRect(CUE_LENGTH * 0.92, -CUE_WIDTH / 2 - 2, CUE_LENGTH * 0.08, CUE_WIDTH + 4);

    const tipLen = 14;
    const tipGrad = ctx.createLinearGradient(0, 0, tipLen, 0);
    tipGrad.addColorStop(0, '#f5f5f5');
    tipGrad.addColorStop(0.6, '#d8d8d8');
    tipGrad.addColorStop(1, '#4a90c2');
    ctx.fillStyle = tipGrad;
    ctx.fillRect(-tipLen, -CUE_WIDTH / 2 + 1, tipLen, CUE_WIDTH - 2);

    ctx.restore();
}

function rayCircleHit(ox, oy, dx, dy, cx, cy, hitRadius) {
    const fx = ox - cx;
    const fy = oy - cy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - hitRadius * hitRadius;
    const disc = b * b - 4 * c;

    if (disc < 0) return null;

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / 2;
    const t2 = (-b + sqrtDisc) / 2;

    if (t1 > 0.001) return t1;
    if (t2 > 0.001) return t2;
    return null;
}

function rayWallHit(ox, oy, dx, dy, radius) {
    let bestT = Infinity;
    let wall = null;

    const consider = (t, wallName, valid) => {
        if (t > 0 && valid && t < bestT) {
            bestT = t;
            wall = wallName;
        }
    };

    if (dx < -0.0001) {
        const t = (radius - ox) / dx;
        const y = oy + dy * t;
        consider(t, 'left', y >= radius && y <= CANVAS_HEIGHT - radius);
    } else if (dx > 0.0001) {
        const t = (CANVAS_WIDTH - radius - ox) / dx;
        const y = oy + dy * t;
        consider(t, 'right', y >= radius && y <= CANVAS_HEIGHT - radius);
    }

    if (dy < -0.0001) {
        const t = (radius - oy) / dy;
        const x = ox + dx * t;
        consider(t, 'top', x >= radius && x <= CANVAS_WIDTH - radius);
    } else if (dy > 0.0001) {
        const t = (CANVAS_HEIGHT - radius - oy) / dy;
        const x = ox + dx * t;
        consider(t, 'bottom', x >= radius && x <= CANVAS_WIDTH - radius);
    }

    if (bestT === Infinity) return null;
    return { t: bestT, wall };
}

function predictCueTrajectory(angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ox = cueBall.x;
    const oy = cueBall.y;

    const wallHit = rayWallHit(ox, oy, dx, dy, BALL_RADIUS);
    let hitT = wallHit ? wallHit.t : null;
    let hitType = wallHit ? 'wall' : null;
    let hitWall = wallHit ? wallHit.wall : null;
    let hitBall = null;

    for (const ball of balls) {
        if (ball === cueBall || ball.inPocket) continue;

        const t = rayCircleHit(ox, oy, dx, dy, ball.x, ball.y, BALL_RADIUS * 2);
        if (t !== null && (hitT === null || t < hitT)) {
            hitT = t;
            hitType = 'ball';
            hitBall = ball;
            hitWall = null;
        }
    }

    if (hitT === null) {
        hitT = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
        hitType = 'none';
    }

    const contactX = ox + dx * hitT;
    const contactY = oy + dy * hitT;
    const endX = ox + dx * (hitT + TRAJECTORY_EXTEND);
    const endY = oy + dy * (hitT + TRAJECTORY_EXTEND);

    let bounceDx = 0;
    let bounceDy = 0;
    let targetDx = 0;
    let targetDy = 0;
    let hasBounce = false;
    let hasTargetLine = false;

    if (hitType === 'wall' && hitWall) {
        bounceDx = dx;
        bounceDy = dy;
        if (hitWall === 'left' || hitWall === 'right') bounceDx = -dx;
        if (hitWall === 'top' || hitWall === 'bottom') bounceDy = -dy;
        hasBounce = true;
    } else if (hitType === 'ball' && hitBall) {
        const nx = hitBall.x - contactX;
        const ny = hitBall.y - contactY;
        const len = Math.hypot(nx, ny) || 1;
        const nxu = nx / len;
        const nyu = ny / len;
        const dot = dx * nxu + dy * nyu;

        bounceDx = dx - dot * nxu;
        bounceDy = dy - dot * nyu;
        targetDx = dot * nxu;
        targetDy = dot * nyu;

        const bounceLen = Math.hypot(bounceDx, bounceDy);
        if (bounceLen > MIN_BOUNCE_DRAW) {
            bounceDx /= bounceLen;
            bounceDy /= bounceLen;
            hasBounce = true;
        }

        const targetLen = Math.hypot(targetDx, targetDy);
        if (targetLen > MIN_BOUNCE_DRAW) {
            targetDx /= targetLen;
            targetDy /= targetLen;
            hasTargetLine = true;
        }
    }

    return {
        ox,
        oy,
        contactX,
        contactY,
        endX,
        endY,
        hitType,
        hitT,
        hasBounce,
        bounceDx,
        bounceDy,
        bounceEndX: contactX + bounceDx * BOUNCE_PREVIEW_LEN,
        bounceEndY: contactY + bounceDy * BOUNCE_PREVIEW_LEN,
        hasTargetLine,
        targetDx,
        targetDy,
        targetEndX: contactX + targetDx * BOUNCE_PREVIEW_LEN,
        targetEndY: contactY + targetDy * BOUNCE_PREVIEW_LEN
    };
}

function drawTrajectory(angle) {
    const path = predictCueTrajectory(angle);
    const startX = path.ox + Math.cos(angle) * BALL_RADIUS;
    const startY = path.oy + Math.sin(angle) * BALL_RADIUS;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(path.contactX, path.contactY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(path.contactX, path.contactY);
    ctx.lineTo(path.endX, path.endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(path.contactX, path.contactY, 5, 0, Math.PI * 2);
    ctx.fillStyle = path.hitType === 'ball' ? 'rgba(255, 220, 100, 0.95)' : 'rgba(180, 220, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(aimX, aimY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (path.hasBounce) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.bounceEndX, path.bounceEndY);
        ctx.strokeStyle = 'rgba(100, 220, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(path.bounceEndX, path.bounceEndY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 220, 255, 0.55)';
        ctx.fill();
    }

    if (path.hasTargetLine) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.targetEndX, path.targetEndY);
        ctx.strokeStyle = 'rgba(255, 200, 80, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore();
}

function drawCueScene(angle, pullBack) {
    const tipGap = 2;
    const tipOffset = BALL_RADIUS + tipGap + pullBack;
    const tipX = cueBall.x - Math.cos(angle) * tipOffset;
    const tipY = cueBall.y - Math.sin(angle) * tipOffset;

    drawTrajectory(angle);
    drawCueStick(tipX, tipY, angle);
}

function initGame() {
    balls = [];
    score = 0;
    scoredBalls.clear();
    strikeAnim = null;
    impactFlash = null;
    activeCanvasPointerId = null;
    scoreElement.innerText = score;

    cueBall = new Ball(200, CANVAS_HEIGHT / 2, 0, 0, 'white', true);
    balls.push(cueBall);

    const colors = ['red', 'yellow', 'blue', 'pink', 'black', 'orange', 'green', 'purple'];
    const startX = 550;
    const startY = CANVAS_HEIGHT / 2;
    const rowSpacing = BALL_RADIUS * 2;
    const colSpacing = Math.sqrt(3) * BALL_RADIUS;

    let colorIdx = 0;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j <= i; j++) {
            const x = startX + i * colSpacing;
            const y = startY + (j - i / 2) * rowSpacing;
            const color = colors[colorIdx % colors.length];
            balls.push(new Ball(x, y, 0, 0, color));
            colorIdx++;
        }
    }

    updateAimFromPoint(cueBall.x + 160, cueBall.y);
    resetPowerPull();
    isPullingPower = false;
    activePullPointerId = null;
}

function resolveCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < b1.radius + b2.radius) {
        const overlap = b1.radius + b2.radius - distance;
        const nx = dx / distance;
        const ny = dy / distance;

        b1.x -= nx * overlap / 2;
        b1.y -= ny * overlap / 2;
        b2.x += nx * overlap / 2;
        b2.y += ny * overlap / 2;

        const rvx = b2.vx - b1.vx;
        const rvy = b2.vy - b1.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal > 0) return;

        const restitution = 1;
        let impulseMagnitude = -(1 + restitution) * velAlongNormal;
        impulseMagnitude /= 2;

        const impulseX = impulseMagnitude * nx;
        const impulseY = impulseMagnitude * ny;

        b1.vx -= impulseX;
        b1.vy -= impulseY;
        b2.vx += impulseX;
        b2.vy += impulseY;
    }
}

function update() {
    updateStrikeAnim();
    updateImpactFlash();

    for (let i = 0; i < balls.length; i++) {
        balls[i].update();
    }

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
            scoreElement.innerText = score;
        }
    });

    if (isPullingPower && !canShowCue()) {
        resetPowerPull();
        isPullingPower = false;
        activePullPointerId = null;
    }
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pockets = [
        { x: 0, y: 0 },
        { x: CANVAS_WIDTH / 2, y: 0 },
        { x: CANVAS_WIDTH, y: 0 },
        { x: 0, y: CANVAS_HEIGHT },
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT },
        { x: CANVAS_WIDTH, y: CANVAS_HEIGHT }
    ];

    pockets.forEach(p => {
        const grad = ctx.createRadialGradient(p.x, p.y, POCKET_RADIUS * 0.5, p.x, p.y, POCKET_RADIUS);
        grad.addColorStop(0, '#000');
        grad.addColorStop(1, '#222');

        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    });

    balls.forEach(ball => ball.draw());
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
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

    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }

    handleCanvasAim(e);
    activeCanvasPointerId = null;
});

canvas.addEventListener('pointercancel', (e) => {
    if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
    activeCanvasPointerId = null;
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

    if (powerTrack.hasPointerCapture(e.pointerId)) {
        powerTrack.releasePointerCapture(e.pointerId);
    }

    releasePowerPull();
}

powerTrack.addEventListener('pointerup', finishPowerPull);
powerTrack.addEventListener('pointercancel', finishPowerPull);

resetBtn.addEventListener('click', initGame);

initGame();
gameLoop();
