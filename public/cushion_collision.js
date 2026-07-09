import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    CUSHION_RESTITUTION,
    CUSHION_RESTITUTION_SLOW,
    CUSHION_FRICTION,
    LOW_SPEED_THRESHOLD,
    CUSHION_THROW,
    CUSHION_SPIN_RETAIN,
    CUSHION_DRAW_KICK,
    SLEEP_SPIN,
    CUSHION_SLIDE,
    sideSpinTrajectoryEffectiveness,
    drawSpeedEffectiveness,
    spinSpeedEffectiveness
} from './constants.js';
import { getCushionInnerEdges } from './cushions.js';
import { getRubberCollisionEdges } from './cushion_rubber.js';
import { jitterCollisionNormal } from './collision_noise.js';
import { updateBallOmega } from './ball.js';

const PLAY_CENTER_X = CANVAS_WIDTH / 2;
const PLAY_CENTER_Y = CANVAS_HEIGHT / 2;

function edgeNormal(line) {
    const mx = (line.x1 + line.x2) / 2;
    const my = (line.y1 + line.y2) / 2;
    const edx = line.x2 - line.x1;
    const edy = line.y2 - line.y1;
    let nx = -edy;
    let ny = edx;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;

    if ((PLAY_CENTER_X - mx) * nx + (PLAY_CENTER_Y - my) * ny < 0) {
        nx = -nx;
        ny = -ny;
    }

    return { nx, ny };
}

function buildCollisionEdges() {
    const withNormals = line => {
        const { nx, ny } = edgeNormal(line);
        return { ...line, nx, ny };
    };

    return [
        ...getRubberCollisionEdges().map(withNormals),
        ...getCushionInnerEdges().map(withNormals)
    ];
}

let cachedCollisionEdges = null;

function getCollisionEdges() {
    if (!cachedCollisionEdges) {
        cachedCollisionEdges = buildCollisionEdges();
    }
    return cachedCollisionEdges;
}

export function invalidateCushionCollisionCache() {
    cachedCollisionEdges = null;
}

function circleSegmentCollision(bx, by, radius, line) {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return null;

    let t = ((bx - line.x1) * dx + (by - line.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = line.x1 + t * dx;
    const closestY = line.y1 + t * dy;
    const distX = bx - closestX;
    const distY = by - closestY;
    const distSq = distX * distX + distY * distY;

    if (distSq >= radius * radius) return null;

    const dist = Math.sqrt(distSq) || 0.0001;
    let nx = distX / dist;
    let ny = distY / dist;

    if (nx * line.nx + ny * line.ny < 0) {
        nx = line.nx;
        ny = line.ny;
    }

    return {
        nx,
        ny,
        overlap: radius - dist
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function applyCushionSpin(ball, nx, ny, preImpactSpeed, preVx, preVy, vx, vy) {
    if (!ball) return { vx, vy };

    const tx = -ny;
    const ty = nx;
    const spin = ball.spin || 0;
    const topSpin = ball.topSpin || 0;
    const speedEff = sideSpinTrajectoryEffectiveness(preImpactSpeed);

    if (Math.abs(spin) > 1e-6) {
        const approachX = preVx / (preImpactSpeed || 1);
        const approachY = preVy / (preImpactSpeed || 1);
        const incidence = Math.abs(approachX * nx + approachY * ny);
        const throwScale = 0.55 + 0.45 * (1 - incidence);
        const throwCap = preImpactSpeed * (0.085 + incidence * 0.028) * speedEff;
        const throwV = clamp(spin * CUSHION_THROW * preImpactSpeed * throwScale * speedEff, -throwCap, throwCap);
        vx += throwV * tx;
        vy += throwV * ty;
        ball.spin = spin * CUSHION_SPIN_RETAIN;
    }

    if (Math.abs(topSpin) > SLEEP_SPIN) {
        const topEff = topSpin < 0 ? drawSpeedEffectiveness(preImpactSpeed) : spinSpeedEffectiveness(preImpactSpeed);
        const inSpeed = Math.hypot(vx, vy) || 1;
        const inDirX = vx / inSpeed;
        const inDirY = vy / inSpeed;
        if (topSpin > 0) {
            const followKick = clamp(topSpin * 0.016 * topEff, 0, preImpactSpeed * 0.023 * topEff);
            vx += followKick * inDirX;
            vy += followKick * inDirY;
            ball.topSpin = topSpin * 0.68;
        } else {
            const drawKick = clamp(topSpin * CUSHION_DRAW_KICK * topEff, -preImpactSpeed * 0.04 * topEff, 0);
            vx += drawKick * inDirX;
            vy += drawKick * inDirY;
            ball.topSpin = topSpin * 0.72;
        }
    }

    ball.slide = Math.max(ball.slide || 0, CUSHION_SLIDE);

    return { vx, vy };
}

function resolveAtPosition(bx, by, vx, vy, r, edges, ball, allowBounce, applyJitter = true) {
    let bounced = false;

    for (let iter = 0; iter < 5; iter++) {
        let best = null;

        for (const edge of edges) {
            const collision = circleSegmentCollision(bx, by, r, edge);
            if (!collision) continue;
            if (!best || collision.overlap > best.collision.overlap) {
                best = { edge, collision };
            }
        }

        if (!best) break;

        const { collision } = best;
        bx += collision.nx * collision.overlap;
        by += collision.ny * collision.overlap;

        let nx = collision.nx;
        let ny = collision.ny;
        const dot = vx * nx + vy * ny;
        if (allowBounce && !bounced && dot < 0) {
            const preImpactSpeed = Math.hypot(vx, vy);
            const preVx = vx;
            const preVy = vy;
            const impactSpeed = -dot;
            ({ nx, ny } = jitterCollisionNormal(nx, ny, 'cushion', impactSpeed, applyJitter));

            const restitution = impactSpeed < LOW_SPEED_THRESHOLD
                ? CUSHION_RESTITUTION_SLOW
                : CUSHION_RESTITUTION;
            const dotJ = vx * nx + vy * ny;
            vx -= (1 + restitution) * dotJ * nx;
            vy -= (1 + restitution) * dotJ * ny;

            const tx = -ny;
            const ty = nx;
            const vTan = vx * tx + vy * ty;
            vx -= vTan * CUSHION_FRICTION * tx;
            vy -= vTan * CUSHION_FRICTION * ty;

            ({ vx, vy } = applyCushionSpin(ball, nx, ny, preImpactSpeed, preVx, preVy, vx, vy));
            bounced = true;
        } else if (dot < 0) {
            vx -= dot * nx;
            vy -= dot * ny;
        }
    }

    return { bx, by, vx, vy };
}

export function resolveBallCushionCollision(ball, prevX, prevY, options = {}) {
    if (ball.inPocket) return;

    const applyJitter = options.applyJitter !== false;

    const edges = getCollisionEdges();
    const r = ball.radius;
    const endX = ball.x;
    const endY = ball.y;
    let bx = endX;
    let by = endY;
    let vx = ball.vx;
    let vy = ball.vy;

    const travel = Math.hypot(endX - prevX, endY - prevY);
    const samples = Math.max(1, Math.ceil(travel / (r * 0.3)));

    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const sx = prevX + (endX - prevX) * t;
        const sy = prevY + (endY - prevY) * t;
        const allowBounce = i === samples;
        const result = resolveAtPosition(sx, sy, vx, vy, r, edges, ball, allowBounce, applyJitter);
        bx = result.bx;
        by = result.by;
        vx = result.vx;
        vy = result.vy;
    }

    ball.x = bx;
    ball.y = by;
    ball.vx = vx;
    ball.vy = vy;
    updateBallOmega(ball);
}

function raySegmentHit(ox, oy, dx, dy, radius, line) {
    const px1 = line.x1 + line.nx * radius;
    const py1 = line.y1 + line.ny * radius;
    const px2 = line.x2 + line.nx * radius;
    const py2 = line.y2 + line.ny * radius;
    const segDx = px2 - px1;
    const segDy = py2 - py1;
    const denom = dx * segDy - dy * segDx;

    if (Math.abs(denom) < 1e-9) return null;

    const t = ((px1 - ox) * segDy - (py1 - oy) * segDx) / denom;
    const u = ((px1 - ox) * dy - (py1 - oy) * dx) / denom;

    if (t > 0.001 && u >= 0 && u <= 1) {
        return { t, nx: line.nx, ny: line.ny };
    }

    return null;
}

export function rayCushionHit(ox, oy, dx, dy, radius) {
    let best = null;

    for (const edge of getCollisionEdges()) {
        const hit = raySegmentHit(ox, oy, dx, dy, radius, edge);
        if (hit && (!best || hit.t < best.t)) {
            best = hit;
        }
    }

    return best;
}
