import { chromium } from '@playwright/test';
import { expect, test, viewer } from './support/extension.js';

const counter = (page) => viewer(page).locator('span.tabular-nums');
const shownImage = (page) => viewer(page).locator('img.ilg-image');
const galleriesReady = (page) => page.evaluate(() => new Promise((resolve) => document.addEventListener('magic-image-viewer:test-galleries-ready', resolve, { once: true })));
const withoutPrecompute = (page) => page.addInitScript(() => document.documentElement.setAttribute('data-test-no-precompute', ''));
const loadTime = (page) => page.evaluate(() => performance.getEntriesByType('navigation')[0].loadEventEnd);

async function timeToViewer(page, alt) {
    const started = Date.now();
    await page.getByAltText(alt, { exact: true }).click();
    await expect(shownImage(page)).toBeVisible();

    return Date.now() - started;
}

test.describe('a page with thousands of images', () => {
    test('opens at once right after loading, before the galleries are known', async ({ page }) => {
        await withoutPrecompute(page);
        await page.goto('/many.html');

        const elapsed = await timeToViewer(page, 'Tile 5');
        console.log(`viewer visible without galleries: ${elapsed} ms`);

        expect(elapsed).toBeLessThan(400);
        await expect(counter(page)).toHaveText('5 / 3000');
    });

    test('opens at once with the galleries prepared in idle time', async ({ page }) => {
        const ready = galleriesReady(page).catch(() => null);
        await page.goto('/many.html');
        await ready;

        const elapsed = await timeToViewer(page, 'Tile 5');
        console.log(`viewer visible with galleries: ${elapsed} ms`);

        expect(elapsed).toBeLessThan(400);
        await expect(counter(page)).toHaveText('5 / 3000');
        await expect(viewer(page).locator('.ilg-thumbnail')).toHaveCount(81);
    });

    test('preparing the galleries causes no task over 50 ms after loading', async ({ page }) => {
        await page.goto('/many.html');
        await page.evaluate(() => new Promise((resolve) => document.addEventListener('magic-image-viewer:test-galleries-ready', resolve, { once: true })));
        const loaded = await loadTime(page);
        const tasks = await page.evaluate(() => window.longTasks);
        const afterLoad = tasks.filter((task) => task.start >= loaded);
        console.log(`long tasks after load: ${JSON.stringify(afterLoad)}`);

        expect(afterLoad).toEqual([]);
    });

    test('loads as fast as without the extension', async ({ page, baseURL }) => {
        const plainBrowser = await chromium.launch();
        const plain = await plainBrowser.newPage({ viewport: { width: 1280, height: 800 } });
        const plainTimes = [];
        const withTimes = [];

        for (let run = 0; run < 3; run++) {
            await plain.goto(`${baseURL}/many.html`);
            plainTimes.push(await loadTime(plain));
            await page.goto('/many.html');
            withTimes.push(await loadTime(page));
        }

        await plainBrowser.close();
        const median = (list) => [...list].sort((a, b) => a - b)[1];
        console.log(`load without extension: ${median(plainTimes).toFixed(0)} ms, with: ${median(withTimes).toFixed(0)} ms`);

        expect(median(withTimes)).toBeLessThan(median(plainTimes) * 1.25 + 50);
    });
});

test('a group that arrives after opening keeps the image in place and adds counter and strip', async ({ page }) => {
    await withoutPrecompute(page);
    await page.goto('/groups.html');
    await page.getByAltText('First 2', { exact: true }).click();
    await expect(counter(page)).toHaveText('2 / 3');
    await page.waitForTimeout(500);
    const pending = await shownImage(page).boundingBox();
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toBeHidden();

    await page.waitForTimeout(500);
    await page.getByAltText('First 2', { exact: true }).click();
    await expect(counter(page)).toHaveText('2 / 3');
    await page.waitForTimeout(500);
    const cached = await shownImage(page).boundingBox();

    expect(pending).toEqual(cached);
    await expect(viewer(page).locator('.ilg-thumbnail-active')).toBeVisible();
});
