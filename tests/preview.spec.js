import { expect, test, viewer } from './support/extension.js';

const shownImage = (page) => viewer(page).locator('img.ilg-image');
const shownFile = async (page) => {
    const url = new URL(await shownImage(page).getAttribute('src'));

    return url.pathname.split('/').pop() + url.search;
};
const box = async (page) => {
    const rect = await shownImage(page).boundingBox();

    return { width: Math.round(rect.width), height: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) };
};

async function clickAndTime(page, selector) {
    await page.goto('/preview.html');
    await page.locator(selector).evaluate((image) => image.decode());
    await expect(page.locator('magic-image-viewer')).toBeAttached();
    const started = Date.now();
    await page.locator(selector).click();
    await expect(shownImage(page)).toBeVisible();

    return Date.now() - started;
}

test('opens at once with the page picture while the full size loads behind it', async ({ page }) => {
    const elapsed = await clickAndTime(page, '#slow');
    console.log(`click to image with a 2 s full size: ${elapsed} ms`);

    expect(elapsed).toBeLessThan(150);
    expect(await shownFile(page)).toBe('landscape.jpg?preview');
    await page.waitForTimeout(600);
    const before = await box(page);

    await expect.poll(() => shownFile(page), { timeout: 4000 }).toBe('landscape.jpg?delay=2000');
    await page.waitForTimeout(100);

    expect(await box(page)).toEqual(before);
});

test('a thumbnail of another shape eases into the shape of the full size', async ({ page }) => {
    await clickAndTime(page, '#square');
    await page.waitForTimeout(600);
    const before = await box(page);

    await expect.poll(() => shownFile(page), { timeout: 4000 }).toBe('landscape.jpg?delay=1500&square');
    await page.waitForTimeout(400);
    const after = await box(page);
    console.log(`square preview ${JSON.stringify(before)} → full size ${JSON.stringify(after)}`);

    expect(before.width).toBe(before.height);
    expect(after.width / after.height).toBeCloseTo(2400 / 1500, 1);
    expect(Math.abs(after.x + after.width / 2 - (before.x + before.width / 2))).toBeLessThan(2);
});

test('a small page picture grows into the full size without shrinking first', async ({ page }) => {
    await page.goto('/preview.html');
    await page.locator('#small').evaluate((image) => image.decode());
    await expect(page.locator('magic-image-viewer')).toBeAttached();
    const samples = page.evaluate(() => new Promise((resolve) => {
        const widths = [];
        const end = performance.now() + 2000;
        let appeared = 0;
        const tick = () => {
            const image = document.querySelector('magic-image-viewer')?.shadowRoot?.querySelector('img.ilg-image');
            const width = image?.getBoundingClientRect().width;

            if (width) {
                appeared ||= performance.now();
                widths.push({ width, at: performance.now() - appeared });
            }

            performance.now() < end ? requestAnimationFrame(tick) : resolve(widths);
        };
        tick();
    }));
    await page.locator('#small').click();
    const shown = await samples;
    const widths = shown.map((sample) => sample.width);
    const opened = shown.filter((sample) => sample.at < 600).at(-1).width;
    const final = widths.at(-1);
    console.log(`small preview opened at ${Math.round(opened)} px, full size ${Math.round(final)} px`);

    expect(await shownFile(page)).toBe('photo-5-1600.svg?delay=800');
    expect(opened).toBeLessThanOrEqual(400);
    expect(final).toBeGreaterThan(opened * 1.5);
    expect(widths.every((width, index) => index === 0 || width >= widths[index - 1] - 0.5)).toBe(true);
    expect(widths.filter((width) => width > opened + 1 && width < final - 1).length).toBeGreaterThan(1);
});

test('a full size that never loads leaves the page picture in place', async ({ page }) => {
    await clickAndTime(page, '#broken');
    await page.waitForTimeout(1500);

    await expect(shownImage(page)).toBeVisible();
    expect(await shownFile(page)).toBe('landscape.jpg?broken');
    expect((await box(page)).width).toBeGreaterThan(600);
});
