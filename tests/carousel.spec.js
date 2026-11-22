import { expect, test, viewer } from './support/extension.js';

const SWIPE = -150;

const counter = (page) => viewer(page).locator('span.tabular-nums');
const siteLog = (page) => page.evaluate(() => window.siteLog);
const slide = (page, id) => page.evaluate((frame) => window.slides[frame], id);
const noViewer = (page) => expect(page.locator('magic-image-viewer [role="dialog"]')).toHaveCount(0);

async function centreOf(locator) {
    const box = await locator.boundingBox();

    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function dragWithMouse(page, locator, by) {
    const { x, y } = await centreOf(locator);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + by, y, { steps: 10 });
    await page.mouse.up();
}

async function touch(page, locator, by = 0) {
    const { x, y } = await centreOf(locator);
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });

    for (let step = 1; step <= 10 && by !== 0; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (by * step) / 10, y }] });
    }

    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
}

test.beforeEach(async ({ page }) => {
    await page.goto('/carousel.html');
});

test.describe('swiping stays with the page', () => {
    test('a pointer carousel moves with the mouse', async ({ page }) => {
        await dragWithMouse(page, page.getByAltText('Slide 1'), SWIPE);

        expect(await slide(page, 'pointer-carousel')).toBe(1);
        await page.waitForTimeout(300);
        await noViewer(page);
    });

    test('a pointer carousel moves with touch', async ({ page }) => {
        await touch(page, page.getByAltText('Slide 1'), SWIPE);

        await expect.poll(() => slide(page, 'pointer-carousel')).toBe(1);
        await page.waitForTimeout(300);
        await noViewer(page);
    });

    test('a carousel known by its markup moves with the mouse', async ({ page }) => {
        await dragWithMouse(page, page.getByAltText('Slide 4'), SWIPE);

        expect(await slide(page, 'library-carousel')).toBe(1);
        await page.waitForTimeout(300);
        await noViewer(page);
    });
});

test.describe('a tap in a carousel opens our viewer', () => {
    test('with the mouse', async ({ page }) => {
        await page.getByAltText('Slide 1').click();

        await expect(counter(page)).toHaveText('1 / 3');
        expect(await siteLog(page)).toEqual([]);
        expect(await slide(page, 'pointer-carousel')).toBe(0);
    });

    test('with touch', async ({ page }) => {
        await touch(page, page.getByAltText('Slide 4'));

        await expect(counter(page)).toHaveText('1 / 3');
        expect(await siteLog(page)).toEqual([]);
    });
});

test('dragging across an image outside a carousel opens nothing', async ({ page }) => {
    await dragWithMouse(page, page.locator('#free'), SWIPE);
    await page.waitForTimeout(300);

    await noViewer(page);
    expect(await siteLog(page)).toEqual([]);
});
