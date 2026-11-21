import { expect, test, viewer } from './support/extension.js';

const counter = (page) => viewer(page).locator('span.tabular-nums');
const siteLog = (page) => page.evaluate(() => window.siteLog);
const noViewer = (page) => expect(page.locator('magic-image-viewer [role="dialog"]')).toHaveCount(0);

test.beforeEach(async ({ page }) => {
    await page.goto('/lightboxes.html');
});

test.describe('site lightboxes stay closed, ours opens', () => {
    const patterns = [
        ['listener on the image', '#direct', '1 / 8'],
        ['delegated listener on document', '#delegated', '2 / 8'],
        ['mousedown trigger', '#mousedown', '3 / 8'],
        ['pointerup trigger', '#pointerup', '4 / 8'],
        ['anchor on the image file', '#anchor img', '5 / 8'],
        ['hash link with script', '#hash img', '6 / 8'],
        ['overlay above the image', '#cover', '7 / 8'],
    ];

    for (const [name, selector, position] of patterns) {
        test(name, async ({ page }) => {
            await page.locator(selector).click();

            await expect(viewer(page)).toBeVisible();
            await expect(counter(page)).toHaveText(position);
            expect(await siteLog(page)).toEqual([]);
            await expect(page.locator('#site-lightbox')).toBeHidden();
        });
    }

    test('the anchor on the image file shows the linked file', async ({ page }) => {
        await page.locator('#anchor img').click();

        await expect(viewer(page).locator('img.ilg-image')).toHaveAttribute('src', /photo-8-full\.svg$/);
    });
});

test.describe('links to other pages', () => {
    test('a plain click navigates', async ({ page }) => {
        await page.locator('#page-link img').click();

        await expect(page).toHaveURL(/other\.html$/);
    });

    test('an Alt-click opens the viewer and stays on the page', async ({ page }) => {
        await page.locator('#page-link img').click({ modifiers: ['Alt'] });

        await expect(viewer(page)).toBeVisible();
        await expect(counter(page)).toHaveText('8 / 8');
        await page.waitForTimeout(300);
        await expect(page).toHaveURL(/lightboxes\.html$/);
    });

    test('a modifier click other than Alt is left to the browser', async ({ page }) => {
        await page.locator('#direct').click({ modifiers: ['Shift'] });
        await page.waitForTimeout(300);

        await noViewer(page);
        expect(await siteLog(page)).toEqual(['direct']);
    });
});

test.describe('special cases', () => {
    test('a repeated image opens at its first entry', async ({ page }) => {
        await page.locator('#duplicate').click();

        await expect(counter(page)).toHaveText('1 / 8');
        expect(await siteLog(page)).toEqual([]);
    });

    test('an image in editable content is left alone', async ({ page }) => {
        await page.locator('#editable').click();
        await page.waitForTimeout(300);

        await noViewer(page);
        expect(await siteLog(page)).toEqual(['editable-click']);
    });

    test('a content image can still be dragged', async ({ page }) => {
        await page.locator('#direct').dragTo(page.locator('#drop'));
        await page.waitForTimeout(300);

        await noViewer(page);
        expect(await siteLog(page)).toContain('dragstart:direct');
    });

    test('a right click reaches the page and opens nothing', async ({ page }) => {
        await page.locator('#direct').click({ button: 'right' });
        await page.waitForTimeout(300);

        await noViewer(page);
        expect(await siteLog(page)).toEqual(['contextmenu:direct']);
    });

    test('clicks keep working normally once the viewer is open', async ({ page }) => {
        await page.locator('#direct').click();
        await expect(counter(page)).toHaveText('1 / 8');
        await page.waitForTimeout(450);

        await viewer(page).getByRole('button', { name: 'Next image' }).click();
        await expect(counter(page)).toHaveText('2 / 8');
        await viewer(page).getByRole('button', { name: 'Close' }).click();
        await expect(viewer(page)).toBeHidden();
        expect(await siteLog(page)).toEqual([]);
    });
});
