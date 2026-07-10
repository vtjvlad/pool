/**
 * LEGACY — Canvas 2D отрисовка.
 * Заменён: public/render/wood_texture.js
 * Дата переноса: 2026-07-10
 */
import { COLORS } from './constants.js';

const TILE_SIZE = 128;
let woodPattern = null;

function buildWoodTile() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    const base = ctx.createLinearGradient(0, 0, 0, TILE_SIZE);
    base.addColorStop(0, COLORS.woodLight);
    base.addColorStop(0.45, COLORS.woodBase);
    base.addColorStop(1, COLORS.woodDark);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    for (let i = 0; i < 36; i++) {
        const y = (i / 36) * TILE_SIZE;
        const wave = Math.sin(i * 1.7) * 1.2;
        ctx.strokeStyle = COLORS.woodGrain;
        ctx.lineWidth = 0.6 + (i % 3) * 0.35;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        for (let x = 0; x <= TILE_SIZE; x += 6) {
            ctx.lineTo(x, y + wave + Math.sin(x * 0.11 + i * 0.8) * 1.4);
        }
        ctx.stroke();
    }

    for (let i = 0; i < 5; i++) {
        const y = ((i * 23 + 11) % TILE_SIZE);
        ctx.fillStyle = `rgba(30, 15, 5, ${0.04 + (i % 2) * 0.03})`;
        ctx.fillRect(0, y, TILE_SIZE, 1.5 + (i % 3));
    }

    return canvas;
}

export function getWoodPattern(ctx) {
    if (!woodPattern) {
        woodPattern = ctx.createPattern(buildWoodTile(), 'repeat');
    }
    return woodPattern;
}

export function fillWoodTexture(ctx, x, y, width, height, horizontal) {
    ctx.save();

    if (horizontal) {
        ctx.fillStyle = getWoodPattern(ctx);
        ctx.fillRect(x, y, width, height);
    } else {
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = getWoodPattern(ctx);
        ctx.fillRect(-height / 2, -width / 2, height, width);
    }

    ctx.restore();
}
