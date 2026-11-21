import { expect, label, test, viewer } from './support/extension.js';

const shownImage = (page) => viewer(page).locator('img.ilg-image');

test.describe('an image file in its own tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/images/photo.png');
    });

    test('shows the viewer at once', async ({ page }) => {
        await expect(viewer(page)).toBeVisible();
        await expect(shownImage(page)).toHaveAttribute('src', /photo\.png$/);
    });

    test('stays open: no close button, Escape and a click beside the image do nothing', async ({ page }) => {
        await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
        await page.waitForTimeout(450);

        await expect(viewer(page).getByRole('button', { name: await label(page, 'close') })).toHaveCount(0);
        await page.keyboard.press('Escape');
        await page.mouse.click(8, 400);
        await page.waitForTimeout(600);

        await expect(viewer(page)).toBeVisible();
    });

    test('stays open after a downward drag', async ({ page }) => {
        await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
        await page.waitForTimeout(450);
        const box = await shownImage(page).boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 300, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(600);

        await expect(viewer(page)).toBeVisible();
    });

    test('zooms and downloads', async ({ page }) => {
        await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
        await page.waitForTimeout(450);

        await viewer(page).getByRole('button', { name: await label(page, 'zoomIn') }).click();
        await expect(shownImage(page)).not.toHaveAttribute('style', /scale\(1\)/);

        const download = page.waitForEvent('download');
        await viewer(page).getByRole('button', { name: await label(page, 'download') }).click();

        const file = await download;
        expect(file.suggestedFilename()).toBe('photo.png');
        expect(await file.failure()).toBeNull();
    });
});

test('an SVG file in its own tab is left alone', async ({ page }) => {
    await page.goto('/images/photo-1.svg');
    await page.waitForTimeout(500);

    await expect(page.locator('magic-image-viewer')).toHaveCount(0);
});

test('a video file in its own tab plays only in the viewer', async ({ page }) => {
    await page.goto('/videos/clip.webm');

    await expect(viewer(page).locator('video')).toHaveCount(1);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => {
        const native = document.querySelector('body video');

        return { paused: native.paused, muted: native.muted };
    })).toEqual({ paused: true, muted: true });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(viewer(page)).toBeVisible();
});

test.describe('a file tab uses the whole screen', () => {
    const EDGE = 24;

    async function settledBox(page, file) {
        await page.goto(`/images/${file}`);
        await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
        await page.waitForTimeout(450);

        return shownImage(page).boundingBox();
    }

    for (const file of ['landscape.jpg', 'portrait.jpg']) {
        test(`${file} fills the screen up to the edge`, async ({ page }) => {
            const box = await settledBox(page, file);
            const { width, height } = page.viewportSize();
            const gaps = [width - 2 * EDGE - box.width, height - 2 * EDGE - box.height];

            expect(Math.min(...gaps.map(Math.abs))).toBeLessThan(2);
            expect(Math.min(...gaps)).toBeGreaterThan(-2);
        });
    }

    test('the bars fade when idle and return on movement, the image stays put', async ({ page }) => {
        const before = await settledBox(page, 'landscape.jpg');
        const bar = viewer(page).locator('.ilg-island').first().locator('..');
        await page.mouse.move(640, 360);

        await expect(bar).toHaveCSS('opacity', '0', { timeout: 5000 });
        await page.mouse.move(300, 300);
        await page.mouse.move(320, 320);
        await expect(bar).toHaveCSS('opacity', '1');

        expect(await shownImage(page).boundingBox()).toEqual(before);
    });
});

test('a single file shows no counter and keeps its toolbar icons steady', async ({ page }) => {
    await page.goto('/images/landscape.jpg');
    await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
    await page.waitForTimeout(450);

    await expect(viewer(page).locator('span.tabular-nums')).toHaveCount(0);

    const zoom = viewer(page).locator('.ilg-tool').first();
    await zoom.click();
    await page.waitForTimeout(60);
    expect(await zoom.locator('svg').evaluate((icon) => icon.getBoundingClientRect().width)).toBe(20);
});

test('a toolbar tooltip stays while the pointer moves over its button', async ({ page }) => {
    await page.goto('/images/landscape.jpg');
    await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
    await page.waitForTimeout(450);
    const zoom = viewer(page).locator('.ilg-tool').first();
    const box = await zoom.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(viewer(page).getByRole('tooltip')).toHaveText(await label(page, 'zoomIn'));
    await page.mouse.move(box.x + box.width / 2 + 3, box.y + box.height / 2 + 2);
    await page.waitForTimeout(300);

    await expect(viewer(page).getByRole('tooltip')).toHaveText(await label(page, 'zoomIn'));
});

test.describe('the zoom button', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/images/landscape.jpg');
        await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
        await page.waitForTimeout(450);
    });

    const width = async (page) => (await shownImage(page).boundingBox()).width;
    const zoomButton = (page) => viewer(page).locator('.ilg-tool').first();
    const settle = (page) => page.waitForTimeout(600);

    test('shows the image at actual size, then fits it again', async ({ page }) => {
        const fitted = await width(page);

        await zoomButton(page).click();
        await settle(page);
        expect(Math.round(await width(page))).toBe(2400);

        await zoomButton(page).click();
        await settle(page);
        expect(await width(page)).toBeCloseTo(fitted, 0);
    });

    test('fits the image again after zooming with the wheel', async ({ page }) => {
        const fitted = await width(page);
        await page.mouse.move(640, 360);
        await page.mouse.wheel(0, -200);
        await settle(page);
        expect(await width(page)).toBeGreaterThan(fitted * 1.1);

        await zoomButton(page).click();
        await settle(page);
        expect(await width(page)).toBeCloseTo(fitted, 0);
    });

    test('a click on the image still zooms two and a half times', async ({ page }) => {
        const fitted = await width(page);

        await page.mouse.click(640, 360);
        await settle(page);

        expect(await width(page)).toBeCloseTo(fitted * 2.5, 0);
    });
});
