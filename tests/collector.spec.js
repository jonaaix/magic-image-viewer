import { expect, test, viewer } from './support/extension.js';

const shots = process.env.SHOTS_DIR;
const counter = (page) => viewer(page).locator('span.tabular-nums');
const shownImage = (page) => viewer(page).locator('img.ilg-image');

async function clickToOpen(page, selector) {
    await page.locator(selector).click();
    await expect(viewer(page)).toBeVisible();
    await page.waitForTimeout(450);
}

async function close(page) {
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toBeHidden();
}

async function shownSources(page) {
    const total = Number((await counter(page).textContent()).split('/')[1]);
    const sources = [];

    for (let step = 0; step < total; step++) {
        sources.push(new URL(await shownImage(page).getAttribute('src')).pathname.split('/').pop());
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(400);
    }

    return sources;
}

test.describe('article', () => {
    test('shows exactly the content images, in page order', async ({ page }) => {
        await page.goto('/article.html');
        await clickToOpen(page, 'img[alt="Cliffs at dawn"]');
        shots && (await page.screenshot({ path: `${shots}/article-viewer.png` }));

        await expect(counter(page)).toHaveText('1 / 3');
        expect(await shownSources(page)).toEqual(['photo-1.svg', 'photo-2.svg', 'photo-3.svg']);
    });

    test('takes the caption from the figure', async ({ page }) => {
        await page.goto('/article.html');
        await clickToOpen(page, 'img[alt="Harbour"]');

        await expect(counter(page)).toHaveText('2 / 3');
        await expect(viewer(page).getByText('The harbour at low tide')).toBeVisible();
    });

    for (const selector of ['img[alt="Site logo"]', 'header nav img >> nth=0', 'img.sprite', 'img[alt="Author"]', 'button.share img', 'label img', 'img[alt="Next article"]']) {
        test(`does not open on ${selector}`, async ({ page }) => {
            await page.goto('/article.html');
            await page.locator(selector).click({ force: true, noWaitAfter: true });
            await page.waitForTimeout(400);

            await expect(page.locator('magic-image-viewer [role="dialog"]')).toHaveCount(0);
        });
    }

    test('picks up an image added after the first opening', async ({ page }) => {
        await page.goto('/article.html');
        await clickToOpen(page, 'img[alt="Cliffs at dawn"]');
        await expect(counter(page)).toHaveText('1 / 3');
        await close(page);

        await page.evaluate(() => {
            const figure = document.createElement('figure');
            figure.append(Object.assign(document.createElement('img'), { src: 'images/late.svg', alt: 'Late', className: 'content' }));
            document.querySelector('figure').after(figure);
        });
        await page.locator('img[alt="Late"]').waitFor();
        await clickToOpen(page, 'img[alt="Late"]');

        await expect(counter(page)).toHaveText('2 / 4');
        expect(await shownImage(page).getAttribute('src')).toContain('late.svg');
    });
});

test.describe('sources', () => {
    const shownFile = async (page) => new URL(await shownImage(page).getAttribute('src')).pathname.split('/').pop();

    for (const [selector, file] of [['#srcset', 'photo-5-1600.svg'], ['#picture', 'photo-6-large.svg'], ['#linked', 'photo-8-full.svg'], ['#lazy', 'photo-7-full.svg']]) {
        test(`loads the largest version of ${selector}`, async ({ page }) => {
            await page.goto('/sources.html');
            await page.locator(selector).scrollIntoViewIfNeeded();
            await clickToOpen(page, selector);

            expect(await shownFile(page)).toBe(file);
        });
    }
});

test.describe('fallback', () => {
    test('a link that is not an image file falls back to the picture itself', async ({ page }) => {
        await page.goto('/sources.html');
        await clickToOpen(page, '#file-page');

        await expect(shownImage(page)).toHaveAttribute('src', /images\/late\.svg$/);
    });
});

test.describe('animation', () => {
    async function sampleShownImage(page, duration) {
        return page.evaluate((ms) => new Promise((resolve) => {
            const samples = [];
            const end = performance.now() + ms;
            const tick = () => {
                const image = document.querySelector('magic-image-viewer')?.shadowRoot?.querySelector('img.ilg-image');

                if (image) {
                    const rect = image.getBoundingClientRect();
                    samples.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width });
                }

                performance.now() < end ? requestAnimationFrame(tick) : resolve(samples);
            };
            tick();
        }), duration);
    }

    test('grows out of the clicked picture and shrinks back into it', async ({ page }) => {
        await page.goto('/article.html');
        const target = page.locator('img[alt="Beach"]');
        await target.scrollIntoViewIfNeeded();
        const box = await target.boundingBox();
        const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const nearPicture = (sample) => Math.abs(sample.x - centre.x) < 6 && Math.abs(sample.y - centre.y) < 6 && Math.abs(sample.width - box.width) < box.width * 0.05;

        const opening = sampleShownImage(page, 900);
        await target.click();
        const grow = await opening;

        await expect(counter(page)).toHaveText('3 / 3');
        const firstNear = grow.findIndex(nearPicture);
        expect(firstNear).toBeGreaterThanOrEqual(0);
        expect(grow.at(-1).width).toBeGreaterThan(box.width + 50);
        expect(grow.slice(firstNear).every((sample, index, list) => index === 0 || sample.width >= list[index - 1].width - 0.5)).toBe(true);

        const closing = sampleShownImage(page, 500);
        await page.keyboard.press('Escape');
        const shrink = await closing;

        expect(shrink.length).toBeGreaterThan(3);
        expect(nearPicture(shrink.at(-1))).toBe(true);
    });
});
