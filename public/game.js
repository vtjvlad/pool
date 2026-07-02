const canvas = document.getElementById('billiard-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');
const powerValue = document.getElementById('power-value');
const powerTrack = document.getElementById('power-pull-track');
const powerFill = document.getElementById('power-pull-fill');
const powerThumb = document.getElementById('power-pull-thumb');

const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 440;
const BALL_RADIUS = 11;
const FRICTION = 0.992;
const BALL_RESTITUTION = 0.94;
const CUSHION_RESTITUTION = 0.84;
const MIN_SPEED = 0.04;
const RAIL_WIDTH = 38;
const POCKET_CAPTURE = 28;
const POCKET_OPENING = 21;
const POCKET_JAW = 14;
const POCKET_MAGNET = 0.35;

const CUE_LENGTH = 300;
const CUE_WIDTH = 6;
const MAX_PULL = 115;
const MIN_POWER_PERCENT = 5;
const POWER_FACTOR = 0.11;
const STRIKE_ANIM_BASE_MS = 85;
const IMPACT_FLASH_MS = 180;
const TRAJECTORY_EXTEND = 18;
const BOUNCE_PREVIEW_LEN = 52;
const MIN_BOUNCE_DRAW = 0.08;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const BALL_DEFS = {
    1: { color: '#f1c40f', type: 'solid' },
    2: { color: '#2471a3', type: 'solid' },
    3: { color: '#c0392b', type: 'solid' },
    4: { color: '#8e44ad', type: 'solid' },
    5: { color: '#e67e22', type: 'solid' },
    6: { color: '#1e8449', type: 'solid' },
    7: { color: '#922b21', type: 'solid' },
    8: { color: '#1a1a1a', type: 'eight' },
    9: { color: '#f1c40f', type: 'stripe' },
    10: { color: '#2471a3', type: 'stripe' },
    11: { color: '#c0392b', type: 'stripe' },
    12: { color: '#8e44ad', type: 'stripe' },
    13: { color: '#e67e22', type: 'stripe' },
    14: { color: '#1e8449', type: 'stripe' },
    15: { color: '#922b21', type: 'stripe' }
};

const RACK_ORDER = [
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15]
];

function getPlayArea() {
    return {
        left: RAIL_WIDTH,
        top: RAIL_WIDTH,
        right: CANVAS_WIDTH - RAIL_WIDTH,
        bottom: CANVAS_HEIGHT - RAIL_WIDTH,
        width: CANVAS_WIDTH - RAIL_WIDTH * 2,
        height: CANVAS_HEIGHT - RAIL_WIDTH * 2
    };
}

function getPockets() {
    const play = getPlayArea();
    const midX = play.left + play.width / 2;

    return [
        { x: play.left, y: play.top, kind: 'corner' },
        { x: midX, y: play.top, kind: 'side' },
        { x: play.right, y: play.top, kind: 'corner' },
        { x: play.left, y: play.bottom, kind: 'corner' },
        { x: midX, y: play.bottom, kind: 'side' },
        { x: play.right, y: play.bottom, kind: 'corner' }
    ];
}

function pocketDistance(x, y, pocket) {
    return Math.hypot(x - pocket.x, y - pocket.y);
}

function isInPocketZone(x, y, extra = 0) {
    return getPockets().some(p => pocketDistance(x, y, p) < POCKET_CAPTURE + extra);
}

function isNearPocket(x, y, extra = 0) {
    return isInPocketZone(x, y, extra);
}

function nearPocketOnWall(x, y, wall) {
    const play = getPlayArea();
    const midX = play.left + play.width / 2;
    const zone = POCKET_CAPTURE + BALL_RADIUS;

    if (wall === 'left') {
        return pocketDistance(x, y, { x: play.left, y: play.top }) < zone
            || pocketDistance(x, y, { x: play.left, y: play.bottom }) < zone;
    }
    if (wall === 'right') {
        return pocketDistance(x, y, { x: play.right, y: play.top }) < zone
            || pocketDistance(x, y, { x: play.right, y: play.bottom }) < zone;
    }
    if (wall === 'top') {
        return pocketDistance(x, y, { x: play.left, y: play.top }) < zone
            || pocketDistance(x, y, { x: midX, y: play.top }) < zone
            || pocketDistance(x, y, { x: play.right, y: play.top }) < zone;
    }
    if (wall === 'bottom') {
        return pocketDistance(x, y, { x: play.left, y: play.bottom }) < zone
            || pocketDistance(x, y, { x: midX, y: play.bottom }) < zone
            || pocketDistance(x, y, { x: play.right, y: play.bottom }) < zone;
    }
    return false;
}

function getHeadSpot() {
    const play = getPlayArea();
    return { x: play.left + play.width * 0.25, y: play.top + play.height / 2 };
}

function getFootSpot() {
    const play = getPlayArea();
    return { x: play.left + play.width * 0.75, y: play.top + play.height / 2 };
}

class Ball {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.isCueBall = options.isCueBall || false;
        this.number = options.number || 0;
        this.ballType = options.ballType || (this.isCueBall ? 'cue' : 'solid');
        this.color = options.color || '#ffffff';
        this.inPocket = false;
    }

    draw() {
        if (this.inPocket) return;

        const r = this.radius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + 1.5, this.y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        ctx.restore();

        const grad = ctx.createRadialGradient(
            this.x - r * 0.35, this.y - r * 0.35, r * 0.1,
            this.x, this.y, r
        );

        if (this.isCueBall) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, '#f0f0f0');
            grad.addColorStop(1, '#d0d0d0');
        } else if (this.ballType === 'eight') {
            grad.addColorStop(0, '#444');
            grad.addColorStop(0.5, '#1a1a1a');
            grad.addColorStop(1, '#000');
        } else {
            grad.addColorStop(0, lighten(this.color, 40));
            grad.addColorStop(0.55, this.color);
            grad.addColorStop(1, darken(this.color, 30));
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (this.ballType === 'stripe' && !this.isCueBall) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(this.x - r, this.y - r * 0.42, r * 2, r * 0.84);
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - r, this.y - r * 0.28, r * 2, r * 0.56);
            ctx.restore();
        }

        if (!this.isCueBall) {
            const spotR = r * 0.42;
            ctx.beginPath();
            ctx.arc(this.x, this.y, spotR, 0, Math.PI * 2);
            ctx.fillStyle = this.ballType === 'eight' ? '#ffffff' : '#fafafa';
            ctx.fill();

            ctx.fillStyle = this.ballType === 'eight' ? '#111' : '#222';
            ctx.font = `bold ${r * 0.72}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(this.number), this.x, this.y + 0.5);
        }

        ctx.beginPath();
        ctx.arc(this.x - r * 0.32, this.y - r * 0.32, r * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();
    }

    update() {
        if (this.inPocket) return;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        if (Math.abs(this.vx) < MIN_SPEED) this.vx = 0;
        if (Math.abs(this.vy) < MIN_SPEED) this.vy = 0;

        const play = getPlayArea();

        for (const pocket of getPockets()) {
            const dist = pocketDistance(this.x, this.y, pocket);

            if (dist < POCKET_CAPTURE + BALL_RADIUS && dist > 0.5) {
                const speed = Math.hypot(this.vx, this.vy);
                const pull = POCKET_MAGNET * (1.2 + speed * 0.06);
                this.vx += ((pocket.x - this.x) / dist) * pull;
                this.vy += ((pocket.y - this.y) / dist) * pull;
            }

            if (dist < POCKET_CAPTURE) {
                this.inPocket = true;
                this.vx = 0;
                this.vy = 0;
                if (this.isCueBall) {
                    setTimeout(() => this.respotCueBall(), 600);
                }
                return;
            }
        }

        if (this.x - this.radius < play.left) {
            if (!nearPocketOnWall(this.x, this.y, 'left')) {
                this.x = play.left + this.radius;
                this.vx = -this.vx * CUSHION_RESTITUTION;
            }
        } else if (this.x + this.radius > play.right) {
            if (!nearPocketOnWall(this.x, this.y, 'right')) {
                this.x = play.right - this.radius;
                this.vx = -this.vx * CUSHION_RESTITUTION;
            }
        }

        if (this.y - this.radius < play.top) {
            if (!nearPocketOnWall(this.x, this.y, 'top')) {
                this.y = play.top + this.radius;
                this.vy = -this.vy * CUSHION_RESTITUTION;
            }
        } else if (this.y + this.radius > play.bottom) {
            if (!nearPocketOnWall(this.x, this.y, 'bottom')) {
                this.y = play.bottom - this.radius;
                this.vy = -this.vy * CUSHION_RESTITUTION;
            }
        }
    }

    respotCueBall() {
        const play = getPlayArea();
        const spot = getHeadSpot();
        this.inPocket = false;
        this.x = spot.x;
        this.y = spot.y;
        this.vx = 0;
        this.vy = 0;

        for (const ball of balls) {
            if (ball === this || ball.inPocket) continue;
            const dx = ball.x - this.x;
            const dy = ball.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < this.radius + ball.radius + 2) {
                this.x = play.left + play.width * 0.18;
                this.y = spot.y;
                break;
            }
        }
    }

    isMoving() {
        return Math.hypot(this.vx, this.vy) > MIN_SPEED;
    }
}

function lighten(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + amount);
    const g = Math.min(255, ((n >> 8) & 255) + amount);
    const b = Math.min(255, (n & 255) + amount);
    return `rgb(${r},${g},${b})`;
}

function darken(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 255) - amount);
    const g = Math.max(0, ((n >> 8) & 255) - amount);
    const b = Math.max(0, (n & 255) - amount);
    return `rgb(${r},${g},${b})`;
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
let scoredBalls = new Set();
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

function drawCueStick(tipX, tipY, angle) {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle + Math.PI);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(2, -CUE_WIDTH / 2 + 2, CUE_LENGTH, CUE_WIDTH);

    const bodyGrad = ctx.createLinearGradient(0, -CUE_WIDTH / 2, 0, CUE_WIDTH / 2);
    bodyGrad.addColorStop(0, '#deb887');
    bodyGrad.addColorStop(0.5, '#f5deb3');
    bodyGrad.addColorStop(1, '#a0724a');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(0, -CUE_WIDTH / 2, CUE_LENGTH, CUE_WIDTH);

    ctx.fillStyle = '#111';
    ctx.fillRect(CUE_LENGTH * 0.7, -CUE_WIDTH / 2 - 1, CUE_LENGTH * 0.22, CUE_WIDTH + 2);

    const tipLen = 12;
    ctx.fillStyle = '#4aa3d8';
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
    const play = getPlayArea();
    let bestT = Infinity;
    let wall = null;

    const consider = (t, wallName, valid) => {
        if (t > 0 && valid && t < bestT) {
            bestT = t;
            wall = wallName;
        }
    };

    if (dx < -0.0001) {
        const t = (play.left + radius - ox) / dx;
        const hitX = ox + dx * t;
        const hitY = oy + dy * t;
        consider(t, 'left', hitY >= play.top + radius && hitY <= play.bottom - radius && !nearPocketOnWall(hitX, hitY, 'left'));
    } else if (dx > 0.0001) {
        const t = (play.right - radius - ox) / dx;
        const hitX = ox + dx * t;
        const hitY = oy + dy * t;
        consider(t, 'right', hitY >= play.top + radius && hitY <= play.bottom - radius && !nearPocketOnWall(hitX, hitY, 'right'));
    }
    if (dy < -0.0001) {
        const t = (play.top + radius - oy) / dy;
        const hitX = ox + dx * t;
        const hitY = oy + dy * t;
        consider(t, 'top', hitX >= play.left + radius && hitX <= play.right - radius && !nearPocketOnWall(hitX, hitY, 'top'));
    } else if (dy > 0.0001) {
        const t = (play.bottom - radius - oy) / dy;
        const hitX = ox + dx * t;
        const hitY = oy + dy * t;
        consider(t, 'bottom', hitX >= play.left + radius && hitX <= play.right - radius && !nearPocketOnWall(hitX, hitY, 'bottom'));
    }

    return bestT === Infinity ? null : { t: bestT, wall };
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
        bounceDx = hitWall === 'left' || hitWall === 'right' ? -dx : dx;
        bounceDy = hitWall === 'top' || hitWall === 'bottom' ? -dy : dy;
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
        const bl = Math.hypot(bounceDx, bounceDy);
        if (bl > MIN_BOUNCE_DRAW) {
            bounceDx /= bl;
            bounceDy /= bl;
            hasBounce = true;
        }
        const tl = Math.hypot(targetDx, targetDy);
        if (tl > MIN_BOUNCE_DRAW) {
            targetDx /= tl;
            targetDy /= tl;
            hasTargetLine = true;
        }
    }

    return {
        contactX, contactY, endX, endY, hitType,
        hasBounce, bounceDx, bounceDy,
        bounceEndX: contactX + bounceDx * BOUNCE_PREVIEW_LEN,
        bounceEndY: contactY + bounceDy * BOUNCE_PREVIEW_LEN,
        hasTargetLine, targetDx, targetDy,
        targetEndX: contactX + targetDx * BOUNCE_PREVIEW_LEN,
        targetEndY: contactY + targetDy * BOUNCE_PREVIEW_LEN
    };
}

function drawTrajectory(angle) {
    const path = predictCueTrajectory(angle);
    const startX = cueBall.x + Math.cos(angle) * BALL_RADIUS;
    const startY = cueBall.y + Math.sin(angle) * BALL_RADIUS;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(path.contactX, path.contactY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(path.contactX, path.contactY);
    ctx.lineTo(path.endX, path.endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (path.hasBounce) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.bounceEndX, path.bounceEndY);
        ctx.strokeStyle = 'rgba(120, 210, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (path.hasTargetLine) {
        ctx.beginPath();
        ctx.moveTo(path.contactX, path.contactY);
        ctx.lineTo(path.targetEndX, path.targetEndY);
        ctx.strokeStyle = 'rgba(255, 210, 80, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(aimX, aimY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

function drawPocketHole(pocket) {
    const r = pocket.kind === 'corner' ? POCKET_OPENING + 2 : POCKET_OPENING;
    const innerR = r * 0.45;

    ctx.save();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    const depth = ctx.createRadialGradient(
        pocket.x, pocket.y, innerR * 0.2,
        pocket.x, pocket.y, r + 1
    );
    depth.addColorStop(0, '#000000');
    depth.addColorStop(0.55, '#0a0806');
    depth.addColorStop(1, '#1a1208');

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r, 0, Math.PI * 2);
    ctx.fillStyle = depth;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(25, 15, 8, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(90, 60, 35, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (pocket.kind === 'corner') {
        drawPocketJaws(pocket);
    }

    ctx.restore();
}

function drawPocketJaws(pocket) {
    const play = getPlayArea();
    const jaw = POCKET_JAW;
    ctx.strokeStyle = 'rgba(40, 25, 12, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    if (pocket.x <= play.left + 1 && pocket.y <= play.top + 1) {
        ctx.beginPath();
        ctx.moveTo(pocket.x + jaw, pocket.y - 2);
        ctx.lineTo(pocket.x - 2, pocket.y + jaw);
        ctx.stroke();
    } else if (pocket.x >= play.right - 1 && pocket.y <= play.top + 1) {
        ctx.beginPath();
        ctx.moveTo(pocket.x - jaw, pocket.y - 2);
        ctx.lineTo(pocket.x + 2, pocket.y + jaw);
        ctx.stroke();
    } else if (pocket.x <= play.left + 1 && pocket.y >= play.bottom - 1) {
        ctx.beginPath();
        ctx.moveTo(pocket.x + jaw, pocket.y + 2);
        ctx.lineTo(pocket.x - 2, pocket.y - jaw);
        ctx.stroke();
    } else if (pocket.x >= play.right - 1 && pocket.y >= play.bottom - 1) {
        ctx.beginPath();
        ctx.moveTo(pocket.x - jaw, pocket.y + 2);
        ctx.lineTo(pocket.x + 2, pocket.y - jaw);
        ctx.stroke();
    }
}

function drawRailFrame() {
    const play = getPlayArea();

    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.rect(play.left, play.top, play.width, play.height);

    getPockets().forEach(p => {
        const holeR = p.kind === 'corner' ? POCKET_OPENING + 2 : POCKET_OPENING;
        ctx.moveTo(p.x + holeR, p.y);
        ctx.arc(p.x, p.y, holeR, 0, Math.PI * 2, true);
    });

    const wood = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    wood.addColorStop(0, '#6b4525');
    wood.addColorStop(0.35, '#8a5a32');
    wood.addColorStop(0.65, '#5c3a1e');
    wood.addColorStop(1, '#3a2412');
    ctx.fillStyle = wood;
    ctx.fill('evenodd');

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
}

function drawRailDiamonds() {
    const play = getPlayArea();
    const count = 7;
    const step = play.width / (count + 1);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 1; i <= count; i++) {
        const x = play.left + step * i;
        [{ y: play.top - RAIL_WIDTH * 0.5 }, { y: play.bottom + RAIL_WIDTH * 0.5 }].forEach(pos => {
            ctx.beginPath();
            ctx.moveTo(x, pos.y - 4);
            ctx.lineTo(x + 4, pos.y);
            ctx.lineTo(x, pos.y + 4);
            ctx.lineTo(x - 4, pos.y);
            ctx.closePath();
            ctx.fill();
        });
    }
}

function drawFelt() {
    const play = getPlayArea();

    const felt = ctx.createLinearGradient(play.left, play.top, play.left, play.bottom);
    felt.addColorStop(0, '#1a5f7a');
    felt.addColorStop(0.45, '#1a6b85');
    felt.addColorStop(1, '#145a70');
    ctx.fillStyle = felt;
    ctx.fillRect(play.left, play.top, play.width, play.height);

    const head = getHeadSpot();
    const foot = getFootSpot();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    [head, foot].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    const playLine = play.left + play.width * 0.25;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playLine, play.top + 4);
    ctx.lineTo(playLine, play.bottom - 4);
    ctx.stroke();
}

function drawCushionFacings() {
    const play = getPlayArea();
    const inset = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(play.left + inset, play.top + inset, play.width - inset * 2, play.height - inset * 2);
}

function drawTable() {
    const play = getPlayArea();

    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawFelt();
    drawRailFrame();
    getPockets().forEach(drawPocketHole);
    drawRailDiamonds();
    drawCushionFacings();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(play.left, play.top);
    ctx.lineTo(play.right, play.top);
    ctx.lineTo(play.right, play.bottom);
    ctx.lineTo(play.left, play.bottom);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawCueScene(angle, pullBack) {
    const tipOffset = BALL_RADIUS + 2 + pullBack;
    drawTrajectory(angle);
    drawCueStick(
        cueBall.x - Math.cos(angle) * tipOffset,
        cueBall.y - Math.sin(angle) * tipOffset,
        angle
    );
}

function createRack() {
    const foot = getFootSpot();
    const spacing = BALL_RADIUS * 2.02;
    const colSpacing = Math.sqrt(3) * BALL_RADIUS * 1.01;
    const rackBalls = [];

    RACK_ORDER.forEach((row, rowIdx) => {
        row.forEach((num, colIdx) => {
            const def = BALL_DEFS[num];
            const x = foot.x + rowIdx * colSpacing;
            const y = foot.y + (colIdx - (row.length - 1) / 2) * spacing;
            rackBalls.push(new Ball(x, y, {
                number: num,
                color: def.color,
                ballType: def.type
            }));
        });
    });

    return rackBalls;
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

    updateAimFromPoint(cueBall.x + 140, cueBall.y);
    resetPowerPull();
    isPullingPower = false;
    activePullPointerId = null;
}

function resolveCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= b1.radius + b2.radius || dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = b1.radius + b2.radius - dist;
    b1.x -= nx * overlap / 2;
    b1.y -= ny * overlap / 2;
    b2.x += nx * overlap / 2;
    b2.y += ny * overlap / 2;

    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN > 0) return;

    const impulse = -(1 + BALL_RESTITUTION) * velN / 2;
    b1.vx -= impulse * nx;
    b1.vy -= impulse * ny;
    b2.vx += impulse * nx;
    b2.vy += impulse * ny;
}

function update() {
    updateStrikeAnim();
    updateImpactFlash();

    for (const ball of balls) ball.update();

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
    drawTable();
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
