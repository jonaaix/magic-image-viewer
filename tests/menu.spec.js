import { expect, test, viewer } from './support/extension.js';

const counter = (page) => viewer(page).locator('span.tabular-nums');
const shownImage = (page) => viewer(page).locator('img.ilg-image');

async function chooseMenuEntry(page, image, { inFrame = false } = {}) {
    await image.click({ button: 'right' });
    const src = await image.evaluate((element) => element.currentSrc);
    const context = page.context();
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));

    await worker.evaluate(async ({ srcUrl, frameId }) => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        await globalThis.showInViewer({ srcUrl, frameId }, tab);
    }, { srcUrl: src, frameId: inFrame ? 1 : 0 });

    return src;
}

test('an image of the page gallery opens at its place', async ({ page }) => {
    await page.goto('/article.html');

    await chooseMenuEntry(page, page.getByAltText('Harbour'));

    await expect(counter(page)).toHaveText('2 / 4');
});

test('a decorative image opens alone', async ({ page }) => {
    await page.goto('/article.html');

    const src = await chooseMenuEntry(page, page.getByAltText('Site logo'));

    await expect(counter(page)).toHaveText('1 / 1');
    await expect(shownImage(page)).toHaveAttribute('src', src);
});

test('an image inside an iframe opens alone in the page', async ({ page }) => {
    await page.goto('/frames.html');

    const src = await chooseMenuEntry(page, page.frameLocator('#frame').locator('#framed'), { inFrame: true });

    await expect(counter(page)).toHaveText('1 / 1');
    await expect(shownImage(page)).toHaveAttribute('src', src);
});

test('the entry is registered for images', async ({ page }) => {
    const context = page.context();
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));

    const title = await worker.evaluate(() => chrome.i18n.getMessage('showInViewer'));

    expect(title).toBe('Show in Magic Image Viewer');
});

test('a tab without the viewer gets the image in a new tab', async ({ page, baseURL }) => {
    await page.goto('about:blank');
    const context = page.context();
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
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
