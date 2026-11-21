import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const demo = join(root, 'store/demo');
const output = join(root, 'store/screenshots');
const PORT = 5195;
const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml' };
const VIEWPORT = { width: 1280, height: 800 };

const server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://localhost').pathname)).replace(/^([/\\])+/, '');

    try {
        const body = await readFile(join(demo, path || 'index.html'));
        response.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'text/html' });
        response.end(body);
    } catch {
        response.writeHead(404);
        response.end();
    }
}).listen(PORT);

const pageUrl = `http://localhost:${PORT}/`;

function launch(build) {
    const extension = join(root, '.output', build);

    return chromium.launchPersistentContext('', {
        channel: 'chromium',
        viewport: VIEWPORT,
        args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
}

async function settle(page, ms = 900) {
    await page.waitForTimeout(ms);
}

mkdirSync(output, { recursive: true });

// ----- Viewer, opened by a click on a page photo -----
const context = await launch('chrome-mv3');
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(pageUrl);
await settle(page, 400);
const plainPage = await page.screenshot();
await page.getByAltText('Mountain lake').click();
await settle(page);
await page.mouse.move(640, 400);
await page.screenshot({ path: join(output, '01-viewer.png') });
await page.locator('magic-image-viewer').getByRole('dialog').locator('.ilg-tool').first().click();
await settle(page);
await page.screenshot({ path: join(output, '02-zoom.png') });
await context.close();

// ----- Popup over the page; the test build lets the popup take the page address from its URL -----
const testContext = await launch('chrome-mv3-test');
const worker = testContext.serviceWorkers()[0] ?? (await testContext.waitForEvent('serviceworker'));
const popup = testContext.pages()[0] ?? (await testContext.newPage());
await popup.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html?url=${encodeURIComponent(pageUrl)}`);
await settle(popup, 400);
const popupShot = await popup.locator('main').screenshot();

const dataUrl = (buffer) => `data:image/png;base64,${buffer.toString('base64')}`;
await popup.setViewportSize(VIEWPORT);
await popup.setContent(`<style>body{margin:0;width:1280px;height:800px;background:url(${dataUrl(plainPage)}) no-repeat}img{position:absolute;top:12px;right:16px;border-radius:12px;box-shadow:0 12px 40px rgb(0 0 0/.25),0 0 0 1px rgb(0 0 0/.08)}</style><img src="${dataUrl(popupShot)}">`);
await popup.screenshot({ path: join(output, '03-popup.png') });

// ----- Store icon (96 px artwork, 16 px transparent padding) and small promo tile -----
const icon = readFileSync(join(root, 'assets/icon/variant-a.svg'), 'utf8');
await popup.setViewportSize({ width: 128, height: 128 });
await popup.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:96px;height:96px;margin:16px}</style>${icon}`);
await popup.screenshot({ path: join(output, '../icon-128.png'), omitBackground: true });

await popup.setViewportSize({ width: 440, height: 280 });
await popup.setContent(`<style>body{margin:0;width:440px;height:280px;display:flex;align-items:center;gap:20px;padding:0 32px;box-sizing:border-box;background:linear-gradient(135deg,#1e1b4b,#4c1d95);font-family:system-ui,sans-serif;color:#fff}svg{width:96px;height:96px;flex:none}b{display:block;font-size:26px;letter-spacing:-.01em}span{display:block;margin-top:6px;font-size:15px;color:#ddd6fe}</style>${icon}<div><b>Magic Image Viewer</b><span>Any image on any page, full screen.</span></div>`);
await popup.screenshot({ path: join(output, '../promo-440x280.png') });

await testContext.close();
server.close();
