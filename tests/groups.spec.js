import { chooseMenuEntry, expect, test, viewer } from './support/extension.js';

const counter = (page) => viewer(page).locator('span.tabular-nums');
const shownImage = (page) => viewer(page).locator('img.ilg-image');
const shownFile = async (page) => {
    const url = new URL(await shownImage(page).getAttribute('src'));

    return url.pathname.split('/').pop() + url.search;
};

async function open(page, alt) {
    const image = page.getByAltText(alt, { exact: true });
    await image.scrollIntoViewIfNeeded();
    await image.click();
    await expect(viewer(page)).toBeVisible();
    await page.waitForTimeout(450);
}

async function shownFiles(page) {
    const total = Number((await counter(page).textContent()).split('/')[1]);
    const files = [];

    for (let step = 0; step < total; step++) {
        files.push(await shownFile(page));
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(400);
    }

    return files;
}

test.beforeEach(async ({ page }) => {
    await page.goto('/groups.html');
});

test('two galleries on one page each open only their own images', async ({ page }) => {
    await open(page, 'First 2');
    await expect(counter(page)).toHaveText('2 / 3');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toBeHidden();

    await open(page, 'Second 1');
    await expect(counter(page)).toHaveText('1 / 2');
    expect(await shownFiles(page)).toEqual(['photo-4.svg?second', 'photo-1.svg?second']);
});

test('a grid of several rows is one gallery', async ({ page }) => {
    await open(page, 'Row 3');

    await expect(counter(page)).toHaveText('3 / 4');
});

test('masonry columns with changing heights are one gallery, small tiles included', async ({ page }) => {
    await open(page, 'Masonry 2');

    await expect(counter(page)).toHaveText('2 / 4');
    expect(await shownFiles(page)).toContain('photo-3.svg?masonry');
});

test('the main product image opens the gallery of its preview strip', async ({ page }) => {
    await open(page, 'Product');
    await expect(counter(page)).toHaveText('1 / 2');
    await expect.poll(() => shownFile(page)).toBe('photo-8-full.svg');
    await page.keyboard.press('Escape');
    await expect(viewer(page)).toBeHidden();

    await open(page, 'Thumb 2');
    await expect(counter(page)).toHaveText('2 / 2');
    await expect.poll(() => shownFile(page)).toBe('photo-6-large.svg');
});

test('an image without siblings of its shape opens alone', async ({ page }) => {
    await open(page, 'Single');

    await expect(counter(page)).toHaveCount(0);
});

test('a carousel with cloned slides lists every slide once', async ({ page }) => {
    await open(page, 'Slide 1');

    await expect(counter(page)).toHaveText('2 / 3');
    expect(await shownFile(page)).toBe('photo-1.svg?slide');
});

test('the context menu opens the group of the image', async ({ page }) => {
    await chooseMenuEntry(page, page.getByAltText('Row 2', { exact: true }));

    await expect(counter(page)).toHaveText('2 / 4');
});
