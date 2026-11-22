import { expect, test, viewer } from './support/extension.js';

const counter = (page) => viewer(page).locator('span.tabular-nums');
const shownImage = (page) => viewer(page).locator('img.ilg-image');

async function timeToViewer(page, url, alt) {
    await page.goto(url);
    await page.waitForTimeout(800);
    const started = Date.now();
    await page.getByAltText(alt, { exact: true }).click();
    await expect(shownImage(page)).toBeVisible();

    return Date.now() - started;
}

function sampleShownImage(page, duration) {
    return page.evaluate((ms) => new Promise((resolve) => {
        const samples = [];
        const end = performance.now() + ms;
        const tick = () => {
            const image = document.querySelector('magic-image-viewer')?.shadowRoot?.querySelector('img.ilg-image');

            if (image) {
                const rect = image.getBoundingClientRect();
                samples.push({ x: rect.x + rect.width / 2, width: rect.width });
            }

            performance.now() < end ? requestAnimationFrame(tick) : resolve(samples);
        };
        tick();
    }), duration);
}

test('the time from click to image does not grow with the size of the page', async ({ page }) => {
    const small = await timeToViewer(page, '/groups.html', 'First 2');
    const large = await timeToViewer(page, '/many.html', 'Tile 5');
    console.log(`click to image: ${small} ms on a small page, ${large} ms with 3000 images`);

    expect(large).toBeLessThan(400);
    expect(large).toBeLessThan(small + 150);
    await expect(counter(page)).toHaveText('5 / 3000');
    await expect(viewer(page).locator('.ilg-thumbnail')).toHaveCount(81);
});

test('the group joins the open viewer without moving the image', async ({ page }) => {
    await page.goto('/groups.html');
    const samples = sampleShownImage(page, 1200);
    await page.getByAltText('First 2', { exact: true }).click();
    const shown = await samples;

    await expect(counter(page)).toHaveText('2 / 3');
    await expect(viewer(page).locator('.ilg-thumbnail-active')).toBeVisible();
    const final = shown.at(-1);
    expect(shown.every((sample, index) => index === 0 || sample.width >= shown[index - 1].width - 0.5)).toBe(true);
    expect(shown.every((sample) => Math.abs(sample.x - final.x) < 600)).toBe(true);
    expect(shown.slice(-10).every((sample) => sample.width === final.width && sample.x === final.x)).toBe(true);
});
