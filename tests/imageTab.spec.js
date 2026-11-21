import { expect, label, test, viewer } from './support/extension.js';

const shownImage = (page) => viewer(page).locator('img.ilg-image');

test.describe('an image opened in its own tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/images/photo.png');
    });

    test('shows the viewer at once', async ({ page }) => {
        await expect(viewer(page)).toBeVisible();
        await expect(shownImage(page)).toHaveAttribute('src', /photo\.png$/);
    });

    test('closes to the browser view and opens again on a click', async ({ page }) => {
        await expect(shownImage(page)).toHaveAttribute('style', /scale\(1\)/);
        await page.waitForTimeout(450);
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toHaveCount(0);

        await page.locator('body > img').click();

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
