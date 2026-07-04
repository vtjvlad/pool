import {
    POCKET_OPENING,
    CORNER_JAW_ALONG,
    SIDE_NOTCH_HALF,
    POCKET_RECESS,
    POCKET_RAIL_DEPTH,
    RAIL_WIDTH
} from './constants.js';
import {
    getPockets,
    tracePocketNotch
} from './utils.js';

export function drawFeltPocketShadows(ctx) {
    getPockets().forEach(pocket => {
        const { anchorX: ax, anchorY: ay, wall, kind } = pocket;
        const spread = kind === 'corner' ? 22 : 16;

        ctx.save();
        const shade = ctx.createRadialGradient(ax, ay, 0, ax, ay, spread);
        shade.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
        shade.addColorStop(0.55, 'rgba(0, 0, 0, 0.05)');
        shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shade;

        ctx.beginPath();
        if (kind === 'corner') {
            if (wall === 'tl') {
                ctx.moveTo(ax, ay);
                ctx.arc(ax, ay, spread, 0, Math.PI / 2);
            } else if (wall === 'tr') {
                ctx.moveTo(ax, ay);
                ctx.arc(ax, ay, spread, Math.PI / 2, Math.PI);
            } else if (wall === 'bl') {
                ctx.moveTo(ax, ay);
                ctx.arc(ax, ay, spread, -Math.PI / 2, 0);
            } else if (wall === 'br') {
                ctx.moveTo(ax, ay);
                ctx.arc(ax, ay, spread, Math.PI, Math.PI * 1.5);
            }
            ctx.closePath();
        } else if (wall === 'top') {
            ctx.ellipse(ax, ay - 2, SIDE_NOTCH_HALF * 0.62, spread * 0.45, 0, 0, Math.PI * 2);
        } else if (wall === 'bottom') {
            ctx.ellipse(ax, ay + 2, SIDE_NOTCH_HALF * 0.62, spread * 0.45, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    });
}

export function drawPocketCavity(ctx, pocket) {
    const { drawX: dx, drawY: dy, anchorX: ax, anchorY: ay, kind, wall } = pocket;
    const r = POCKET_OPENING * (kind === 'side' ? 0.88 : 0.92);
    const pad = RAIL_WIDTH + POCKET_RAIL_DEPTH + 8;

    ctx.save();
    tracePocketNotch(ctx, pocket);
    ctx.clip();

    ctx.fillStyle = '#080504';
    ctx.fillRect(dx - pad, dy - pad, pad * 2, pad * 2);

    const wallSheen = ctx.createLinearGradient(ax, ay, dx, dy);
    wallSheen.addColorStop(0, 'rgba(92, 58, 32, 0.75)');
    wallSheen.addColorStop(0.25, 'rgba(48, 28, 16, 0.5)');
    wallSheen.addColorStop(0.7, 'rgba(14, 8, 5, 0.15)');
    wallSheen.addColorStop(1, 'rgba(4, 2, 1, 0)');
    ctx.fillStyle = wallSheen;
    ctx.fillRect(dx - pad, dy - pad, pad * 2, pad * 2);

    const hole = ctx.createRadialGradient(dx, dy, 0, dx, dy, r + 14);
    hole.addColorStop(0, '#000000');
    hole.addColorStop(0.25, '#010101');
    hole.addColorStop(0.55, '#070504');
    hole.addColorStop(0.85, '#120c08');
    hole.addColorStop(1, 'rgba(18, 12, 8, 0)');

    ctx.beginPath();
    if (kind === 'side') {
        ctx.ellipse(dx, dy, r + 2, r + 10, 0, 0, Math.PI * 2);
    } else {
        ctx.arc(dx, dy, r + 10, 0, Math.PI * 2);
    }
    ctx.fillStyle = hole;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(dx, dy, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    const hx = dx + (kind === 'corner' && (wall === 'tr' || wall === 'br') ? r * 0.12 : -r * 0.12);
    const hy = dy + (kind === 'corner' && (wall === 'bl' || wall === 'br') ? -r * 0.1 : -r * 0.14);
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    ctx.restore();

    ctx.save();
    tracePocketNotch(ctx, pocket);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(145, 95, 52, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

export function drawPocketOverlay(ctx, pocket) {
    drawPocketThroat(ctx, pocket);
    drawPocketCushionNoses(ctx, pocket);
}

function drawPocketThroat(ctx, pocket) {
    const { anchorX: ax, anchorY: ay, drawX: dx, drawY: dy, wall, kind } = pocket;
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = 'rgba(8, 4, 2, 0.95)';
    ctx.lineWidth = 3.2;

    if (wall === 'tl') {
        ctx.beginPath();
        ctx.moveTo(ax + J, ay);
        ctx.quadraticCurveTo(ax + 9, ay + 5, ax + 3, ay + 12);
        ctx.quadraticCurveTo(ax + 1, ay + 18, ax, ay + J);
        ctx.stroke();
    } else if (wall === 'tr') {
        ctx.beginPath();
        ctx.moveTo(ax - J, ay);
        ctx.quadraticCurveTo(ax - 9, ay + 5, ax - 3, ay + 12);
        ctx.quadraticCurveTo(ax - 1, ay + 18, ax, ay + J);
        ctx.stroke();
    } else if (wall === 'bl') {
        ctx.beginPath();
        ctx.moveTo(ax + J, ay);
        ctx.quadraticCurveTo(ax + 9, ay - 5, ax + 3, ay - 12);
        ctx.quadraticCurveTo(ax + 1, ay - 18, ax, ay - J);
        ctx.stroke();
    } else if (wall === 'br') {
        ctx.beginPath();
        ctx.moveTo(ax - J, ay);
        ctx.quadraticCurveTo(ax - 9, ay - 5, ax - 3, ay - 12);
        ctx.quadraticCurveTo(ax - 1, ay - 18, ax, ay - J);
        ctx.stroke();
    } else if (wall === 'top') {
        ctx.beginPath();
        ctx.moveTo(ax - h, ay);
        ctx.quadraticCurveTo(ax - h * 0.38, ay - 2, dx - POCKET_OPENING * 0.22, dy + POCKET_OPENING * 0.42);
        ctx.quadraticCurveTo(ax, ay - 5, dx, dy + POCKET_OPENING * 0.38);
        ctx.quadraticCurveTo(ax, ay - 5, dx + POCKET_OPENING * 0.22, dy + POCKET_OPENING * 0.42);
        ctx.quadraticCurveTo(ax + h * 0.38, ay - 2, ax + h, ay);
        ctx.stroke();
    } else if (wall === 'bottom') {
        ctx.beginPath();
        ctx.moveTo(ax - h, ay);
        ctx.quadraticCurveTo(ax - h * 0.38, ay + 2, dx - POCKET_OPENING * 0.22, dy - POCKET_OPENING * 0.42);
        ctx.quadraticCurveTo(ax, ay + 5, dx, dy - POCKET_OPENING * 0.38);
        ctx.quadraticCurveTo(ax, ay + 5, dx + POCKET_OPENING * 0.22, dy - POCKET_OPENING * 0.42);
        ctx.quadraticCurveTo(ax + h * 0.38, ay + 2, ax + h, ay);
        ctx.stroke();
    }

    ctx.strokeStyle = kind === 'corner' ? 'rgba(130, 82, 44, 0.55)' : 'rgba(130, 82, 44, 0.5)';
    ctx.lineWidth = 1.3;
    if (wall === 'tl') {
        ctx.beginPath();
        ctx.moveTo(ax + J - 1, ay + 1);
        ctx.quadraticCurveTo(ax + 7, ay + 6, ax + 2, ay + 13);
        ctx.quadraticCurveTo(ax, ay + 17, ax + 1, ay + J - 1);
        ctx.stroke();
    } else if (wall === 'tr') {
        ctx.beginPath();
        ctx.moveTo(ax - J + 1, ay + 1);
        ctx.quadraticCurveTo(ax - 7, ay + 6, ax - 2, ay + 13);
        ctx.quadraticCurveTo(ax, ay + 17, ax - 1, ay + J - 1);
        ctx.stroke();
    } else if (wall === 'bl') {
        ctx.beginPath();
        ctx.moveTo(ax + J - 1, ay - 1);
        ctx.quadraticCurveTo(ax + 7, ay - 6, ax + 2, ay - 13);
        ctx.quadraticCurveTo(ax, ay - 17, ax + 1, ay - J + 1);
        ctx.stroke();
    } else if (wall === 'br') {
        ctx.beginPath();
        ctx.moveTo(ax - J + 1, ay - 1);
        ctx.quadraticCurveTo(ax - 7, ay - 6, ax - 2, ay - 13);
        ctx.quadraticCurveTo(ax, ay - 17, ax - 1, ay - J + 1);
        ctx.stroke();
    } else if (wall === 'top') {
        ctx.beginPath();
        ctx.moveTo(ax - h + 2, ay + 1);
        ctx.quadraticCurveTo(ax - h * 0.3, ay - 1, dx, dy + POCKET_OPENING * 0.32);
        ctx.quadraticCurveTo(ax + h * 0.3, ay - 1, ax + h - 2, ay + 1);
        ctx.stroke();
    } else if (wall === 'bottom') {
        ctx.beginPath();
        ctx.moveTo(ax - h + 2, ay - 1);
        ctx.quadraticCurveTo(ax - h * 0.3, ay + 1, dx, dy - POCKET_OPENING * 0.32);
        ctx.quadraticCurveTo(ax + h * 0.3, ay + 1, ax + h - 2, ay - 1);
        ctx.stroke();
    }

    ctx.restore();
}

function drawPocketCushionNoses(ctx, pocket) {
    const J = CORNER_JAW_ALONG;
    const h = SIDE_NOTCH_HALF;
    const { anchorX: ax, anchorY: ay, drawX: dx, drawY: dy, wall } = pocket;
    const reach = POCKET_RECESS + POCKET_RAIL_DEPTH * 0.1;

    ctx.save();
    ctx.strokeStyle = 'rgba(28, 17, 9, 0.9)';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';

    if (wall === 'tl') {
        ctx.beginPath();
        ctx.moveTo(ax + J, ay);
        ctx.quadraticCurveTo(ax + 13, ay + 4, ax + 6, ay + 11);
        ctx.quadraticCurveTo(ax + 2, ay + 19, ax, ay + J);
        ctx.stroke();
    } else if (wall === 'tr') {
        ctx.beginPath();
        ctx.moveTo(ax - J, ay);
        ctx.quadraticCurveTo(ax - 13, ay + 4, ax - 6, ay + 11);
        ctx.quadraticCurveTo(ax - 2, ay + 19, ax, ay + J);
        ctx.stroke();
    } else if (wall === 'bl') {
        ctx.beginPath();
        ctx.moveTo(ax + J, ay);
        ctx.quadraticCurveTo(ax + 13, ay - 4, ax + 6, ay - 11);
        ctx.quadraticCurveTo(ax + 2, ay - 19, ax, ay - J);
        ctx.stroke();
    } else if (wall === 'br') {
        ctx.beginPath();
        ctx.moveTo(ax - J, ay);
        ctx.quadraticCurveTo(ax - 13, ay - 4, ax - 6, ay - 11);
        ctx.quadraticCurveTo(ax - 2, ay - 19, ax, ay - J);
        ctx.stroke();
    } else if (wall === 'top') {
        ctx.beginPath();
        ctx.moveTo(ax - h, ay);
        ctx.quadraticCurveTo(ax - h * 0.5, ay - reach * 0.3, dx - POCKET_OPENING * 0.28, dy + reach * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + h, ay);
        ctx.quadraticCurveTo(ax + h * 0.5, ay - reach * 0.3, dx + POCKET_OPENING * 0.28, dy + reach * 0.12);
        ctx.stroke();
    } else if (wall === 'bottom') {
        ctx.beginPath();
        ctx.moveTo(ax - h, ay);
        ctx.quadraticCurveTo(ax - h * 0.5, ay + reach * 0.3, dx - POCKET_OPENING * 0.28, dy - reach * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + h, ay);
        ctx.quadraticCurveTo(ax + h * 0.5, ay + reach * 0.3, dx + POCKET_OPENING * 0.28, dy - reach * 0.12);
        ctx.stroke();
    }

    ctx.restore();
}

export function drawAllPockets(ctx) {
    getPockets().forEach(pocket => drawPocketCavity(ctx, pocket));
}

export function drawAllPocketOverlays(ctx) {
    getPockets().forEach(pocket => drawPocketOverlay(ctx, pocket));
}
