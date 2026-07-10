import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, DEBUG_DRAW_RUBBER } from '../constants.js';
import { drawCushionSegments, drawCornerBehindSegments } from './cushions_draw.js';
import { drawRubberGums, drawRubberShadows } from './cushion_rubber_draw.js';
import { drawPocketTexture, drawPocketRim } from './pocket_texture.js';
import { getHeadSpot, getFootSpot, getPockets, getPlaySurface } from '../utils.js';
import { wrapSkCanvas } from './skia_ctx.js';

let tablePicture = null;

function cutPocketHole(ctx, pocket) {
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, pocket.drawRadius, 0, Math.PI * 2);
    ctx.fill();
}

function drawTableStatic(ctx, debugDrawRubber = DEBUG_DRAW_RUBBER) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const surface = getPlaySurface();
    const felt = ctx.createLinearGradient(0, surface.top, 0, surface.bottom);
    felt.addColorStop(0, COLORS.feltLight);
    felt.addColorStop(0.5, COLORS.felt);
    felt.addColorStop(1, COLORS.feltDark);
    ctx.fillStyle = felt;
    ctx.fillRect(surface.left, surface.top, surface.width, surface.height);

    drawRubberShadows(ctx);
    drawCushionSegments(ctx);
    drawCornerBehindSegments(ctx);
    if (debugDrawRubber) {
        drawRubberGums(ctx);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    getPockets().forEach(p => cutPocketHole(ctx, p));
    ctx.restore();

    getPockets().forEach(p => {
        drawPocketTexture(ctx, p);
        drawPocketRim(ctx, p);
    });

    const baulk = surface.left + surface.width * 0.25;
    ctx.strokeStyle = COLORS.baulkLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baulk, surface.top + 2);
    ctx.lineTo(baulk, surface.bottom - 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.baulkLine;
    [getHeadSpot(), getFootSpot()].forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function buildTablePicture(ctx) {
    const CK = ctx.CK;
    if (tablePicture) {
        tablePicture.delete();
        tablePicture = null;
    }
    const recorder = new CK.PictureRecorder();
    const bounds = CK.LTRBRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const recCanvas = recorder.beginRecording(bounds);
    const recCtx = wrapSkCanvas(recCanvas, CK, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (ctx._typeface) recCtx.setTypeface(ctx._typeface);
    drawTableStatic(recCtx);
    tablePicture = recorder.finishRecordingAsPicture();
    recorder.delete();
    return tablePicture;
}

export function drawTable(ctx, debugDrawRubber = DEBUG_DRAW_RUBBER) {
    if (tablePicture) {
        ctx.drawPicture(tablePicture);
        return;
    }
    drawTableStatic(ctx, debugDrawRubber);
}

export function invalidateTablePicture() {
    tablePicture?.delete();
    tablePicture = null;
}
