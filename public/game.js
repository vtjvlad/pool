const canvas = document.getElementById('billiard-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');
const powerFill = document.getElementById('power-fill');
const powerValue = document.getElementById('power-value');

// Constants
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

        // Add a small highlight to make it look 3D
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

        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Stop if moving very slowly
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;

        // Wall collisions
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

        // Check pocket collision
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
                    // Reset cue ball if it goes in pocket
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
const MIN_PULL_FOR_SHOT = 8;
const POWER_FACTOR = 0.12;
const STRIKE_ANIM_BASE_MS = 90;
const IMPACT_FLASH_MS = 220;

let balls = [];
let cueBall;
let isDragging = false;
let pointerX = CANVAS_WIDTH / 2;
let pointerY = CANVAS_HEIGHT / 2;
let pointerOnCanvas = false;
let activePointerId = null;
let score = 0;
let scoredBalls = new Set();
let strikeAnim = null;
let impactFlash = null;

function getAimAngle() {
    return Math.atan2(cueBall.y - pointerY, cueBall.x - pointerX);
}

function getPullDistance() {
    const angle = getAimAngle();
    const dx = pointerX - cueBall.x;
    const dy = pointerY - cueBall.y;
    const projected = -(dx * Math.cos(angle) + dy * Math.sin(angle));
    return Math.max(0, Math.min(projected - BALL_RADIUS, MAX_PULL));
}

function getPowerPercent(pullBack) {
    return Math.round((pullBack / MAX_PULL) * 100);
}

function updatePowerMeter(pullBack) {
    const percent = getPowerPercent(pullBack);
    powerFill.style.width = `${percent}%`;
    powerValue.textContent = `${percent}%`;
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
    isDragging = false;
    updatePowerMeter(0);
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

function drawCueStick(tipX, tipY, angle, pullBack) {
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

function drawAimGuide(angle, pullBack) {
    const lineLen = 140 + pullBack * 0.4;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    ctx.lineTo(
        cueBall.x + Math.cos(angle) * lineLen,
        cueBall.y + Math.sin(angle) * lineLen
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(
        cueBall.x + Math.cos(angle) * lineLen,
        cueBall.y + Math.sin(angle) * lineLen,
        4,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
    ctx.restore();
}

function initGame() {
    balls = [];
    score = 0;
    scoredBalls.clear();
    isDragging = false;
    strikeAnim = null;
    impactFlash = null;
    activePointerId = null;
    scoreElement.innerText = score;
    updatePowerMeter(0);

    // Cue ball
    cueBall = new Ball(200, CANVAS_HEIGHT / 2, 0, 0, 'white', true);
    balls.push(cueBall);

    // Target balls in a triangle
    const colors = ['red', 'yellow', 'blue', 'pink', 'black', 'orange', 'green', 'purple'];
    const startX = 550;
    const startY = CANVAS_HEIGHT / 2;
    const rowSpacing = BALL_RADIUS * 2;
    const colSpacing = Math.sqrt(3) * BALL_RADIUS;

    let colorIdx = 0;
    for (let i = 0; i < 4; i++) { // 4 rows
        for (let j = 0; j <= i; j++) {
            const x = startX + i * colSpacing;
            const y = startY + (j - i / 2) * rowSpacing;
            const color = colors[colorIdx % colors.length];
            balls.push(new Ball(x, y, 0, 0, color));
            colorIdx++;
        }
    }

    pointerX = cueBall.x + 140;
    pointerY = cueBall.y;
}

function resolveCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < b1.radius + b2.radius) {
        // 1. Resolve overlap to prevent sticking
        const overlap = b1.radius + b2.radius - distance;
        const nx = dx / distance; // normal x
        const ny = dy / distance; // normal y
        
        b1.x -= nx * overlap / 2;
        b1.y -= ny * overlap / 2;
        b2.x += nx * overlap / 2;
        b2.y += ny * overlap / 2;

        // 2. Resolve velocity (elastic collision)
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
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pockets (improved)
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
        const angle = strikeAnim.angle;
        const pullBack = strikeAnim.currentPull;
        const tipGap = 2;
        const tipOffset = BALL_RADIUS + tipGap + pullBack;
        const tipX = cueBall.x - Math.cos(angle) * tipOffset;
        const tipY = cueBall.y - Math.sin(angle) * tipOffset;

        drawAimGuide(angle, pullBack);
        drawCueStick(tipX, tipY, angle, pullBack);
        return;
    }

    if (canShowCue()) {
        const angle = getAimAngle();
        const pullBack = isDragging ? getPullDistance() : 0;
        const tipGap = 2;
        const tipOffset = BALL_RADIUS + tipGap + pullBack;
        const tipX = cueBall.x - Math.cos(angle) * tipOffset;
        const tipY = cueBall.y - Math.sin(angle) * tipOffset;

        drawAimGuide(angle, pullBack);
        drawCueStick(tipX, tipY, angle, pullBack);
        updatePowerMeter(pullBack);
    } else if (!isDragging) {
        updatePowerMeter(0);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function updatePointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    pointerX = (e.clientX - rect.left) * scaleX;
    pointerY = (e.clientY - rect.top) * scaleY;
}

function releaseShot() {
    if (!isDragging) return;

    const pullBack = getPullDistance();
    if (pullBack >= MIN_PULL_FOR_SHOT && canShowCue()) {
        startStrike(pullBack, getAimAngle());
    } else {
        isDragging = false;
        updatePowerMeter(0);
    }
}

canvas.addEventListener('pointerenter', () => {
    pointerOnCanvas = true;
});

canvas.addEventListener('pointerleave', (e) => {
    if (activePointerId !== null) return;

    pointerOnCanvas = false;
    isDragging = false;
    if (!strikeAnim) {
        updatePowerMeter(0);
    }
});

canvas.addEventListener('pointerdown', (e) => {
    if (!canShowCue()) return;

    canvas.setPointerCapture(e.pointerId);
    activePointerId = e.pointerId;
    pointerOnCanvas = true;
    isDragging = true;
    updatePointerPosition(e);
});

canvas.addEventListener('pointermove', (e) => {
    updatePointerPosition(e);
});

canvas.addEventListener('pointerup', (e) => {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }

    updatePointerPosition(e);
    releaseShot();
    activePointerId = null;
});

canvas.addEventListener('pointercancel', (e) => {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    isDragging = false;
    activePointerId = null;
    if (!strikeAnim) {
        updatePowerMeter(0);
    }
});

resetBtn.addEventListener('click', initGame);

initGame();
gameLoop();
