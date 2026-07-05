import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = process.env.GAME_URL || 'http://localhost:3000/';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function getState(page) {
    return page.evaluate(() => window.__poolTest?.state?.() ?? window.__poolTest?.() ?? null);
}

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1000);

    const initial = await getState(page);
    if (!initial?.cue) throw new Error('Game did not boot (__poolTest missing)');

    const canvas = await page.$('#billiard-canvas');
    const box = await canvas.boundingBox();
    const tests = [];

    async function doShot(name, { spinX = 0, spinY = 0, power = 70 } = {}) {
        await page.click('#reset-btn');
        await sleep(500);

        const before = await getState(page);
        const cue = before.cue;

        const spinPad = await page.$('#spin-pad');
        const sBox = await spinPad.boundingBox();
        if (Math.abs(spinX) > 0.01 || Math.abs(spinY) > 0.01) {
            await page.mouse.click(
                sBox.x + sBox.width / 2 + spinX * sBox.width * 0.38,
                sBox.y + sBox.height / 2 + spinY * sBox.height * 0.38
            );
            await sleep(150);
        }

        const scaleX = box.width / 1040;
        const scaleY = box.height / 520;
        const aimPx = box.x + (cue.x + 200) * scaleX;
        const aimPy = box.y + cue.y * scaleY;
        await page.mouse.click(aimPx, aimPy);
        await sleep(200);

        const pBox = await (await page.$('#power-pull-track')).boundingBox();
        const pullY = pBox.y + pBox.height * (1 - power / 100);
        await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height - 5);
        await page.mouse.down();
        await page.mouse.move(pBox.x + pBox.width / 2, pullY, { steps: 12 });
        await page.mouse.up();

        await sleep(150);
        const rightAfterShot = await getState(page);

        let settled = null;
        for (let i = 0; i < 200; i++) {
            await sleep(100);
            const s = await getState(page);
            const moving = s.balls.filter(b => !b.inPocket && b.moving).length;
            if (moving === 0) {
                settled = s;
                break;
            }
        }
        settled ||= await getState(page);

        const cueAfter = settled.cue;
        const travel = cueAfter ? Math.hypot(cueAfter.x - cue.x, cueAfter.y - cue.y) : 0;
        const dotFwd = cueAfter && rightAfterShot.cue
            ? (rightAfterShot.cue.vx * Math.cos(Math.atan2(cueAfter.y - cue.y, cueAfter.x - cue.x)) +
               rightAfterShot.cue.vy * Math.sin(Math.atan2(cueAfter.y - cue.y, cueAfter.x - cue.x)))
            : 0;

        tests.push({
            name,
            spinX, spinY, power,
            impulse: rightAfterShot.cue ? {
                vx: +rightAfterShot.cue.vx.toFixed(2),
                vy: +rightAfterShot.cue.vy.toFixed(2),
                spin: +rightAfterShot.cue.spin.toFixed(3),
                topSpin: +rightAfterShot.cue.topSpin.toFixed(3),
                slide: +rightAfterShot.cue.slide.toFixed(3)
            } : null,
            result: {
                travel: +travel.toFixed(1),
                score: settled.score,
                cueEnd: cueAfter ? {
                    x: +cueAfter.x.toFixed(1), y: +cueAfter.y.toFixed(1),
                    topSpin: +cueAfter.topSpin.toFixed(3), spin: +cueAfter.spin.toFixed(3)
                } : null
            }
        });
    }

    await doShot('center', { power: 75 });
    await doShot('side-right', { spinX: 0.5, power: 70 });
    await doShot('side-left', { spinX: -0.5, power: 70 });
    await doShot('follow', { spinY: -0.5, power: 70 });
    await doShot('draw', { spinY: 0.5, power: 70 });

    await page.screenshot({ path: '/tmp/pool-test-final.png' });

    const center = tests.find(t => t.name === 'center');
    const sideR = tests.find(t => t.name === 'side-right');
    const follow = tests.find(t => t.name === 'follow');
    const draw = tests.find(t => t.name === 'draw');

    const issues = [];
    if (errors.length) issues.push(`JS errors: ${errors.join('; ')}`);
    if (!center?.impulse) issues.push('Center shot failed');
    if (sideR?.impulse && Math.abs(sideR.impulse.spin) < 0.5) issues.push('Side spin too weak on shot');
    if (sideR?.impulse && Math.abs(sideR.impulse.vy) > Math.abs(sideR.impulse.vx) * 0.8) issues.push('Side spin may be too sharp (large lateral velocity)');
    if (follow?.impulse && follow.impulse.topSpin <= 0) issues.push('Follow topSpin sign wrong');
    if (draw?.impulse && draw.impulse.topSpin >= 0) issues.push('Draw topSpin sign wrong');
    if (follow?.result?.travel && draw?.result?.travel && follow.result.travel <= draw.result.travel * 1.05) {
        issues.push(`Follow travel (${follow.result.travel}) not greater than draw (${draw.result.travel})`);
    }

    const report = {
        ok: issues.length === 0,
        issues,
        jsErrors: errors,
        tests,
        screenshot: '/tmp/pool-test-final.png'
    };

    writeFileSync('/tmp/pool-game-test.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    if (!report.ok && errors.length) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
