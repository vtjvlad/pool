/**
 * LEGACY — Canvas 2D отрисовка.
 * Заменён: public/render/pocket_texture.js
 * Дата переноса: 2026-07-10
 */
import { COLORS } from './constants.js';

const TEX_SIZE = 160;
const spriteCache = new Map();

function buildPocketSprite(radiusKey) {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d');
    const cx = TEX_SIZE / 2;
    const cy = TEX_SIZE / 2;
    const r = TEX_SIZE / 2 - 3;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const lightX = cx - r * 0.28;
    const lightY = cy - r * 0.34;
    const depth = ctx.createRadialGradient(lightX, lightY, r * 0.03, cx, cy + r * 0.06, r);
    depth.addColorStop(0, COLORS.pocketDeep);
    depth.addColorStop(0.22, COLORS.pocket);
    depth.addColorStop(0.52, COLORS.pocketLeather);
    depth.addColorStop(0.78, COLORS.pocketLiner);
    depth.addColorStop(1, COLORS.pocketRim);
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    const spokes = 16;
    for (let i = 0; i < spokes; i++) {
        const angle = (i / spokes) * Math.PI * 2 + 0.08;
        const endX = cx + Math.cos(angle) * r * 0.96;
        const endY = cy + Math.sin(angle) * r * 0.96;
        const ctrlX = cx + Math.cos(angle) * r * 0.48;
        const ctrlY = cy + Math.sin(angle) * r * 0.48 + r * 0.11;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.strokeStyle = COLORS.pocketNet;
        ctx.lineWidth = 1.1;
        ctx.stroke();
    }

    for (let ring = 1; ring <= 5; ring++) {
        const ringR = r * (ring / 6.2);
        const sag = ring * 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy + sag * 0.35, ringR, ringR * (0.92 - ring * 0.015), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(58, 52, 46, ${0.42 - ring * 0.05})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
    }

    for (let i = 0; i < 22; i++) {
        const angle = (i / 22) * Math.PI * 2;
        const dist = r * (0.18 + (i % 5) * 0.11);
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist + dist * 0.08;
        ctx.fillStyle = i % 2 === 0 ? COLORS.pocketNetKnot : COLORS.pocketNetShadow;
        ctx.beginPath();
        ctx.arc(px, py, 0.9 + (i % 3) * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    const abyss = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.52);
    abyss.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
    abyss.addColorStop(0.55, 'rgba(0, 0, 0, 0.72)');
    abyss.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = abyss;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    const lipShadow = ctx.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
    lipShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    lipShadow.addColorStop(0.55, 'rgba(0, 0, 0, 0.55)');
    lipShadow.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = lipShadow;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.12, r * 0.9, -Math.PI * 0.92, -Math.PI * 0.08);
    ctx.stroke();

    ctx.restore();
    return canvas;
}

function getPocketSprite(radius) {
    const key = Math.round(radius * 100);
    if (!spriteCache.has(key)) {
        spriteCache.set(key, buildPocketSprite(key));
    }
    return spriteCache.get(key);
}

export function drawPocketTexture(ctx, pocket) {
    const { x, y, drawRadius: r } = pocket;
    const sprite = getPocketSprite(r);
    const size = r * 2 + 1;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    ctx.restore();
}

export function drawPocketRim(ctx, pocket) {
    const { x, y, drawRadius: r } = pocket;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
    const lip = ctx.createLinearGradient(x - r, y - r, x + r * 0.45, y + r * 0.5);
    lip.addColorStop(0, COLORS.pocketRimLight);
    lip.addColorStop(0.35, COLORS.pocketLiner);
    lip.addColorStop(0.72, COLORS.pocketRim);
    lip.addColorStop(1, COLORS.pocketDeep);
    ctx.strokeStyle = lip;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - r * 0.08, y - r * 0.1, r * 0.86, -Math.PI * 0.9, -Math.PI * 0.12);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
}
