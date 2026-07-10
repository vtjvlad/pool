/**
 * LEGACY — Canvas 2D отрисовка.
 * Заменён: public/render/metal_texture.js
 * Дата переноса: 2026-07-10
 */
import { COLORS } from './constants.js';

const TILE_SIZE = 128;
let metalPattern = null;

function buildMetalTile() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    const base = ctx.createLinearGradient(0, 0, 0, TILE_SIZE);
    base.addColorStop(0, COLORS.metalLight);
    base.addColorStop(0.42, COLORS.metalBase);
    base.addColorStop(1, COLORS.metalDark);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    for (let i = 0; i < 48; i++) {
        const y = (i / 48) * TILE_SIZE;
        const alpha = 0.04 + (i % 4) * 0.018;
        ctx.strokeStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(30,36,48,${alpha * 0.9})`;
        ctx.lineWidth = 0.5 + (i % 3) * 0.25;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(TILE_SIZE, y + Math.sin(i * 1.3) * 0.6);
        ctx.stroke();
    }

    for (let i = 0; i < 6; i++) {
        const x = ((i * 19 + 7) % TILE_SIZE);
        ctx.fillStyle = `rgba(255,255,255,${0.03 + (i % 2) * 0.025})`;
        ctx.fillRect(x, 0, 1.2, TILE_SIZE);
    }

    return canvas;
}

export function getMetalPattern(ctx) {
    if (!metalPattern) {
        metalPattern = ctx.createPattern(buildMetalTile(), 'repeat');
    }
    return metalPattern;
}

export function fillMetalTexture(ctx, x, y, width, height, horizontal = true) {
    ctx.save();

    if (horizontal) {
        ctx.fillStyle = getMetalPattern(ctx);
        ctx.fillRect(x, y, width, height);
    } else {
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = getMetalPattern(ctx);
        ctx.fillRect(-height / 2, -width / 2, height, width);
    }

    ctx.restore();
}

export function metalShadeGradient(ctx, x, y, width, height, cornerId) {
    const cx = cornerId === 'tr' || cornerId === 'br' ? x + width : x;
    const cy = cornerId === 'bl' || cornerId === 'br' ? y + height : y;
    const gx = x + width * 0.62;
    const gy = y + height * 0.62;

    const grad = ctx.createLinearGradient(cx, cy, gx, gy);
    grad.addColorStop(0, COLORS.metalLight);
    grad.addColorStop(0.38, COLORS.metalBase);
    grad.addColorStop(1, COLORS.metalDark);
    return grad;
}
