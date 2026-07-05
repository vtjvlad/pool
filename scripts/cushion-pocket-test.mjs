import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = process.env.GAME_URL || 'http://localhost:3000/';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function runScenario(page, name, setup, fire, expect) {
    const result = await page.evaluate(({ setup, fire }) => {
        const t = window.__poolTest;
        t.setup(setup);
        t.fire(fire);
        return t.simulate(5000);
    }, { setup, fire });

    const issues = [];
    if (expect.minBounces != null && result.bounces < expect.minBounces) {
        issues.push(`ожидалось отскоков ≥ ${expect.minBounces}, получено ${result.bounces}`);
    }
    if (expect.maxBounces != null && result.bounces > expect.maxBounces) {
        issues.push(`слишком много отскоков: ${result.bounces} > ${expect.maxBounces}`);
    }
    if (expect.pocketed && !result.pocketed && !result.objectPocketed) {
        issues.push('шар не попал в лузу');
    }
    if (expect.noEscape && result.escaped) {
        issues.push(`шар вылетел за стол (${result.events.find(e => e.type === 'escaped')?.x}, ${result.events.find(e => e.type === 'escaped')?.y})`);
    }
    if (expect.finalInBounds) {
        const s = result.final.cue;
        const surf = await page.evaluate(() => window.__poolTest.playSurface());
        const r = 11;
        if (s && !s.inPocket && !s.pocketing) {
            if (s.x < surf.left - r || s.x > surf.right + r || s.y < surf.top - r || s.y > surf.bottom + r) {
                issues.push(`финальная позиция вне стола: (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
            }
        }
    }
    if (expect.returnedY != null && result.final.cue && !result.pocketed) {
        const dy = result.final.cue.y - setup.cueY;
        if (Math.sign(dy) !== Math.sign(expect.returnedY) || Math.abs(dy) < 20) {
            issues.push(`нет возврата по Y: dy=${dy.toFixed(1)}, ожидали знак ${expect.returnedY}`);
        }
    }
    if (expect.returnedX != null && result.final.cue && !result.pocketed) {
        const dx = result.final.cue.x - setup.cueX;
        if (Math.sign(dx) !== Math.sign(expect.returnedX) || Math.abs(dx) < 20) {
            issues.push(`нет возврата по X: dx=${dx.toFixed(1)}, ожидали знак ${expect.returnedX}`);
        }
    }
    if (expect.minTravel != null) {
        const path = result.path;
        if (path.length < 2) {
            issues.push('шар почти не двигался');
        } else {
            const start = path[0];
            const end = path[path.length - 1];
            const travel = Math.hypot(end.x - start.x, end.y - start.y);
            if (travel < expect.minTravel) {
                issues.push(`пройдено ${travel.toFixed(0)}px < ${expect.minTravel}px`);
            }
        }
    }
    if (expect.nearPocket) {
        const pockets = await page.evaluate(() => window.__poolTest.pockets());
        const p = pockets.find(pk => pk.id === expect.nearPocket);
        const cue = result.final.cue;
        if (p && cue && (cue.inPocket || cue.pocketing || result.pocketed)) {
            // ok
        } else if (p && cue) {
            const d = Math.hypot(cue.x - p.x, cue.y - p.y);
            if (d > p.r + 30 && !result.pocketed) {
                issues.push(`далеко от лузы ${expect.nearPocket}: ${d.toFixed(0)}px`);
            }
        }
    }

    return { name, ok: issues.length === 0, issues, bounces: result.bounces, pocketed: result.pocketed || result.objectPocketed, escaped: result.escaped, events: result.events.slice(0, 6), final: result.final.cue };
}

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(800);

    const meta = await page.evaluate(() => ({
        pockets: window.__poolTest.pockets(),
        surface: window.__poolTest.playSurface()
    }));

    const cx = (meta.surface.left + meta.surface.right) / 2;
    const cy = (meta.surface.top + meta.surface.bottom) / 2;
    const tl = meta.pockets.find(p => p.id === 'tl');
    const tm = meta.pockets.find(p => p.id === 'tm');
    const br = meta.pockets.find(p => p.id === 'br');
    const bl = meta.pockets.find(p => p.id === 'bl');

    const scenarios = [];

    // --- БОРТА: прямые отскоки (не по центру X/Y — чтобы не попасть в среднюю лузу) ---
    scenarios.push(await runScenario(page, 'борт_верх', { cueX: cx - 180, cueY: cy + 140 }, { angle: -Math.PI / 2, power: 55 }, { minBounces: 1, noEscape: true, finalInBounds: true }));
    scenarios.push(await runScenario(page, 'борт_низ', { cueX: cx + 180, cueY: cy - 140 }, { angle: Math.PI / 2, power: 55 }, { minBounces: 1, noEscape: true, finalInBounds: true }));
    scenarios.push(await runScenario(page, 'борт_левый', { cueX: cx + 160, cueY: cy }, { angle: Math.PI, power: 55 }, { minBounces: 1, returnedX: 1, noEscape: true, finalInBounds: true }));
    scenarios.push(await runScenario(page, 'борт_правый', { cueX: cx - 160, cueY: cy }, { angle: 0, power: 55 }, { minBounces: 1, returnedX: -1, noEscape: true, finalInBounds: true }));

    // --- СКОСЫ (угловые chamfer/wedge): удар в угол ---
    scenarios.push(await runScenario(page, 'скос_угол_tl', { cueX: cx - 80, cueY: cy - 60 }, { angle: Math.atan2(tl.y - (cy - 60), tl.x - (cx - 80)), power: 50 }, { minBounces: 1, noEscape: true, finalInBounds: true }));
    scenarios.push(await runScenario(page, 'скос_угол_br', { cueX: cx + 80, cueY: cy + 60 }, { angle: Math.atan2(br.y - (cy + 60), br.x - (cx + 80)), power: 50 }, { minBounces: 1, noEscape: true, finalInBounds: true }));

    // --- Двойной отскок (банк) ---
    scenarios.push(await runScenario(page, 'двойной_борт', { cueX: cx, cueY: cy + 100 }, { angle: -Math.PI / 2 - 0.35, power: 65 }, { minBounces: 2, noEscape: true, finalInBounds: true }));

    // --- Борт + боковой винт (throw от борта) ---
    scenarios.push(await runScenario(page, 'борт_винт_бок', { cueX: cx - 150, cueY: cy + 120 }, { angle: -Math.PI / 2, power: 50, spinX: 0.6 }, { minBounces: 1, noEscape: true, finalInBounds: true }));

    // --- Максимальная сила по диагонали — не вылетает ---
    scenarios.push(await runScenario(page, 'диагональ_макс', { cueX: cx - 100, cueY: cy + 80 }, { angle: -Math.PI / 4, power: 100 }, { noEscape: true, finalInBounds: true, minBounces: 1 }));

    // --- ЛУЗЫ: угловые ---
    scenarios.push(await runScenario(page, 'луза_tl_медленно', { cueX: tl.x + 35, cueY: tl.y + 55 }, { angle: Math.atan2(tl.y - (tl.y + 55), tl.x - (tl.x + 35)), power: 22 }, { pocketed: true, noEscape: true }));
    scenarios.push(await runScenario(page, 'луза_br_медленно', { cueX: br.x - 35, cueY: br.y - 55 }, { angle: Math.atan2(br.y - (br.y - 55), br.x - (br.x - 35)), power: 22 }, { pocketed: true, noEscape: true }));

    // --- ЛУЗЫ: средние ---
    scenarios.push(await runScenario(page, 'луза_tm', { cueX: tm.x, cueY: tm.y + 90 }, { angle: -Math.PI / 2, power: 28 }, { pocketed: true, noEscape: true }));
    scenarios.push(await runScenario(page, 'луза_bm', { cueX: meta.pockets.find(p => p.id === 'bm').x, cueY: meta.pockets.find(p => p.id === 'bm').y - 90 }, { angle: Math.PI / 2, power: 28 }, { pocketed: true, noEscape: true }));

    // --- Банк в лузу через нижний борт ---
    scenarios.push(await runScenario(page, 'банк_в_bl', { cueX: cx + 200, cueY: cy - 120 }, { angle: Math.atan2(bl.y - (cy - 120), bl.x - (cx + 200)) + 0.55, power: 62 }, { minBounces: 1, noEscape: true }));

    // --- Средняя луза при ударе по центру (должна ловить) ---
    scenarios.push(await runScenario(page, 'луза_tm_по_центру', { cueX: cx, cueY: cy + 140 }, { angle: -Math.PI / 2, power: 55 }, { pocketed: true, noEscape: true }));

    // --- Объектный шар в лузу ---
    const objPocket = await page.evaluate(() => {
        const t = window.__poolTest;
        const p = t.pockets().find(pk => pk.id === 'tr');
        t.setup({
            cueX: p.x - 70,
            cueY: p.y + 50,
            extraBalls: [{ x: p.x - 8, y: p.y + 18, number: 3 }]
        });
        t.fire({ angle: Math.atan2((p.y + 18) - (p.y + 50), (p.x - 8) - (p.x - 70)), power: 35 });
        return t.simulate(4000);
    });
    scenarios.push({
        name: 'объект_в_лузу_tr',
        ok: objPocket.objectPocketed || objPocket.pocketed,
        issues: (objPocket.objectPocketed || objPocket.pocketed) ? [] : ['объектный шар не забит'],
        bounces: objPocket.bounces,
        pocketed: objPocket.objectPocketed || objPocket.pocketed,
        escaped: objPocket.escaped,
        events: objPocket.events.slice(0, 6),
        final: objPocket.final.cue
    });

    // --- Шар не должен застревать у борта (должен остановиться) ---
    const stuck = await page.evaluate(() => {
        const t = window.__poolTest;
        const s = t.playSurface();
        const cx = (s.left + s.right) / 2;
        t.setup({ cueX: cx, cueY: s.top + 40 });
        t.fire({ angle: Math.PI / 2 + 0.02, power: 30 });
        const sim = t.simulate(6000);
        const cue = sim.final.cue;
        const microMoving = cue && !cue.inPocket && (Math.abs(cue.vx) > 0.01 || Math.abs(cue.vy) > 0.01);
        return { microMoving, cue };
    });
    scenarios.push({
        name: 'нет_застревания_у_борта',
        ok: !stuck.microMoving,
        issues: stuck.microMoving ? ['шар микродвижется у борта после остановки'] : [],
        bounces: 0,
        pocketed: false,
        escaped: false,
        events: [],
        final: stuck.cue
    });

    // --- UI: реальный удар в борт через мышь ---
    await page.click('#reset-btn');
    await sleep(400);
    const uiBefore = await page.evaluate(() => window.__poolTest.state());
    const canvas = await page.$('#billiard-canvas');
    const box = await canvas.boundingBox();
    const scaleX = box.width / 1040;
    const scaleY = box.height / 520;
    const cueUi = uiBefore.cue;
    // прицел влево
    await page.mouse.click(box.x + (cueUi.x - 200) * scaleX, box.y + cueUi.y * scaleY);
    await sleep(200);
    const pBox = await (await page.$('#power-pull-track')).boundingBox();
    await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + 8);
    await page.mouse.down();
    await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height * 0.75, { steps: 15 });
    await sleep(50);
    await page.mouse.up();
    await sleep(300);
    for (let i = 0; i < 200; i++) {
        await sleep(80);
        const st = await page.evaluate(() => window.__poolTest.state());
        if (!st.balls.some(b => !b.inPocket && b.moving)) break;
    }
    const uiAfter = await page.evaluate(() => window.__poolTest.state());
    const uiTravel = Math.hypot(uiAfter.cue.x - cueUi.x, uiAfter.cue.y - cueUi.y);
    scenarios.push({
        name: 'ui_удар_в_левый_борт',
        ok: uiTravel > 80 && !errors.length,
        issues: uiTravel <= 80 ? [`малое смещение битка: ${uiTravel.toFixed(0)}px`] : [],
        bounces: null,
        pocketed: uiAfter.cue.inPocket,
        escaped: false,
        events: [],
        final: uiAfter.cue
    });

    await page.screenshot({ path: '/tmp/pool-cushion-pocket-test.png', fullPage: false });

    const failed = scenarios.filter(s => !s.ok);
    const report = {
        ok: failed.length === 0 && errors.length === 0,
        jsErrors: errors,
        meta,
        summary: {
            total: scenarios.length,
            passed: scenarios.filter(s => s.ok).length,
            failed: failed.length
        },
        scenarios,
        screenshot: '/tmp/pool-cushion-pocket-test.png'
    };

    writeFileSync('/tmp/pool-cushion-pocket-test.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    process.exit(report.ok ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
