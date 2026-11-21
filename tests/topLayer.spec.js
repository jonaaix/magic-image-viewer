import { expect, openViewer, test, viewer } from './support/extension.js';

const shots = process.env.SHOTS_DIR;

const viewerOnTop = (page) => page.evaluate(() => {
    const points = [[0.5, 0.5], [0.5, 0.85], [0.3, 0.3]];

    return points.every(([x, y]) => document.elementFromPoint(innerWidth * x, innerHeight * y)?.localName === 'magic-image-viewer');
});

test.beforeEach(async ({ page }) => {
    await page.goto('/ads.html');
});

test('an ad added on top of everything stays below the viewer', async ({ page }) => {
    await openViewer(page);
    await page.evaluate(() => window.showAd());

    await expect.poll(() => viewerOnTop(page)).toBe(true);
    shots && (await page.screenshot({ path: `${shots}/viewer-over-ad.png` }));
});

test('a popover the page opens afterwards stays below the viewer', async ({ page }) => {
    await openViewer(page);
    await page.evaluate(() => window.showBanner());

    await expect.poll(() => viewerOnTop(page)).toBe(true);
});

test('the viewer leaves the top layer when it closes', async ({ page }) => {
    await openViewer(page);
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toHaveCount(0);

    await expect.poll(() => page.evaluate(() => document.querySelector('magic-image-viewer').matches(':popover-open'))).toBe(false);
});
