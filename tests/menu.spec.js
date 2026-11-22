import { backgroundOf, chooseMenuEntry, expect, test, viewer } from './support/extension.js';

const counter = (page) => viewer(page).locator('span.tabular-nums');
const shownImage = (page) => viewer(page).locator('img.ilg-image');

test('an image of the page gallery opens at its place', async ({ page }) => {
    await page.goto('/article.html');

    await chooseMenuEntry(page, page.getByAltText('Harbour'));

    await expect(counter(page)).toHaveText('2 / 3');
});

test('a decorative image opens alone', async ({ page }) => {
    await page.goto('/article.html');

    const src = await chooseMenuEntry(page, page.getByAltText('Site logo'));

    await expect(viewer(page)).toBeVisible();
    await expect(counter(page)).toHaveCount(0);
    await expect(shownImage(page)).toHaveAttribute('src', src);
});

test('an image inside an iframe opens alone in the page', async ({ page }) => {
    await page.goto('/frames.html');

    const src = await chooseMenuEntry(page, page.frameLocator('#frame').locator('#framed'), { inFrame: true });

    await expect(viewer(page)).toBeVisible();
    await expect(counter(page)).toHaveCount(0);
    await expect(shownImage(page)).toHaveAttribute('src', src);
});

test('the entry is registered for images', async ({ page }) => {
    const context = page.context();
    const worker = await backgroundOf(context);

    const title = await worker.evaluate(() => chrome.i18n.getMessage('showInViewer'));

    expect(title).toContain('Magic Image Viewer');
});

test('a tab without the viewer gets the image in a new tab', async ({ page, baseURL }) => {
    await page.goto('about:blank');
    const context = page.context();
    const worker = await backgroundOf(context);
    const srcUrl = `${baseURL}/images/photo.png`;

    const opened = context.waitForEvent('page');
    await worker.evaluate(async (src) => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        await globalThis.showInViewer({ srcUrl: src, frameId: 0 }, tab);
    }, srcUrl);
    const tab = await opened;

    await expect(tab).toHaveURL(srcUrl);
    await expect(viewer(tab)).toBeVisible();
});
