import { chromium } from '@playwright/test';
import { expect, openViewer, test, viewer } from './support/extension.js';

const shots = process.env.SHOTS_DIR;

async function measure(page) {
    return page.evaluate(() => {
        const root = document.querySelector('magic-image-viewer').shadowRoot;
        const style = (selector) => getComputedStyle(root.querySelector(selector));
        const close = root.querySelector('[aria-label="Close"]').getBoundingClientRect();

        return {
            closeButton: { width: close.width, height: close.height },
            counterFontSize: style('.ilg-island.tabular-nums').fontSize,
            counterFont: style('.ilg-island.tabular-nums').fontFamily,
            islandBackdrop: style('.ilg-island').backdropFilter,
            backdropBlur: style('.backdrop-blur-2xl').backdropFilter,
            activeThumbnail: style('.ilg-thumbnail-active').boxShadow,
            imageShadow: style('img.ilg-image').boxShadow,
            imageRadius: style('img.ilg-image').borderRadius,
        };
    });
}

function sameImage(a, b) {
    return Buffer.compare(a, b) === 0;
}

async function pageWithoutExtension(url) {
    const browser = await chromium.launch({ channel: 'chromium' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const snapshot = { image: await page.screenshot({ fullPage: true }), head: await page.evaluate(() => document.head.innerHTML) };
    await browser.close();

    return snapshot;
}

test.describe('isolation', () => {
    test('the aggressive page looks the same with the extension, before and after the viewer', async ({ page, baseURL }) => {
        const baseline = await pageWithoutExtension(`${baseURL}/aggressive.html`);

        await page.goto('/aggressive.html');
        await page.waitForLoadState('networkidle');
        expect(sameImage(await page.screenshot({ fullPage: true }), baseline.image)).toBe(true);

        await openViewer(page);
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toBeHidden();
        await page.mouse.move(0, 0);

        expect(await page.evaluate(() => document.head.innerHTML)).toBe(baseline.head);
        expect(sameImage(await page.screenshot({ fullPage: true }), baseline.image)).toBe(true);
    });

    test('the viewer on the aggressive page matches the viewer on a plain page', async ({ page }) => {
        await page.goto('/plain.html');
        await openViewer(page);
        const plain = await measure(page);
        shots && (await page.screenshot({ path: `${shots}/viewer-plain.png` }));

        await page.goto('/aggressive.html');
        await openViewer(page);
        const aggressive = await measure(page);
        shots && (await page.screenshot({ path: `${shots}/viewer-aggressive.png` }));

        expect(aggressive).toEqual(plain);
    });

    test('Tailwind variables resolve inside the shadow root', async ({ page }) => {
        await page.goto('/aggressive.html');
        await openViewer(page);
        const styles = await measure(page);

        expect(styles.closeButton).toEqual({ width: 36, height: 36 });
        expect(styles.counterFontSize).toBe('14px');
        expect(styles.counterFont).not.toContain('Comic');
        expect(styles.counterFont).toContain('sans-serif');
        expect(styles.islandBackdrop).toContain('blur(16px)');
        expect(styles.backdropBlur).toContain('blur(40px)');
        expect(styles.activeThumbnail).toContain('rgb(255, 255, 255) 0px 0px 0px 2px');
        expect(styles.imageShadow).not.toContain('lime');
        expect(styles.imageRadius).toBe('8px');
    });

    for (const size of ['62.5%', '20px']) {
        test(`sizes stay the same with a root font size of ${size}`, async ({ page }) => {
            await page.goto(`/plain.html?root-font-size=${encodeURIComponent(size)}`);
            await openViewer(page);
            const styles = await measure(page);

            expect(styles.closeButton).toEqual({ width: 36, height: 36 });
            expect(styles.counterFontSize).toBe('14px');
        });
    }
});

test.describe('keys', () => {
    test('the page sees no key while the viewer is open, the viewer still reacts', async ({ page }) => {
        await page.goto('/plain.html');
        await openViewer(page);
        await page.evaluate(() => (window.pageKeys = []));

        for (const key of ['j', 'k', 'f', 'ArrowRight', 'Space']) {
            await page.keyboard.press(key);
        }

        await expect(viewer(page).locator('span.tabular-nums')).toHaveText('2 / 4');
        await page.keyboard.press('Space');
        await page.keyboard.press('Escape');
        await expect(viewer(page)).toBeHidden();

        expect(await page.evaluate(() => window.pageKeys.filter((entry) => !entry.endsWith(':Escape')))).toEqual([]);

        await page.keyboard.press('j');
        expect(await page.evaluate(() => window.pageKeys.filter((entry) => entry.endsWith(':j')).length)).toBeGreaterThan(0);
    });

    test('tab keeps the focus inside the viewer', async ({ page }) => {
        await page.goto('/plain.html');
        await openViewer(page);

        for (let press = 0; press < 25; press++) {
            await page.keyboard.press('Tab');
            expect(await page.evaluate(() => document.activeElement?.localName)).toBe('magic-image-viewer');
        }

        expect(await page.evaluate(() => window.pageKeys.filter((entry) => entry.includes('Tab')))).toEqual([]);
    });
});

test.describe('viewer', () => {
    test('locks the page scroll while open and gives it back', async ({ page }) => {
        await page.goto('/plain.html');
        await openViewer(page);
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');

        await page.keyboard.press('Escape');
        await expect(viewer(page)).toBeHidden();
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('visible');
    });

    test('switches to full screen and back', async ({ page }) => {
        await page.goto('/plain.html');
        await openViewer(page);

        await viewer(page).getByRole('button', { name: 'Full screen' }).click();
        await expect(viewer(page).getByRole('button', { name: 'Exit full screen' })).toBeVisible();
        await viewer(page).getByRole('button', { name: 'Exit full screen' }).click();
        await expect(viewer(page).getByRole('button', { name: 'Full screen' })).toBeVisible();
    });

    test('puts nothing into the page body', async ({ page }) => {
        await page.goto('/plain.html');
        const before = await page.evaluate(() => document.body.children.length);
        await openViewer(page);
        await viewer(page).getByRole('button', { name: 'Close' }).hover();
        await expect(viewer(page).getByRole('tooltip')).toHaveText('Close');

        expect(await page.evaluate(() => document.body.children.length)).toBe(before);
    });

    test('shows a styled tooltip at the button', async ({ page }) => {
        await page.goto('/aggressive.html');
        await openViewer(page);
        const button = viewer(page).getByRole('button', { name: 'Full screen' });
        await button.hover();
        const tooltip = viewer(page).getByRole('tooltip');
        await expect(tooltip).toHaveText('Full screen');
        await page.waitForTimeout(300);
        shots && (await page.screenshot({ path: `${shots}/viewer-tooltip.png`, clip: { x: 900, y: 0, width: 380, height: 120 } }));

        const buttonBox = await button.boundingBox();
        const tooltipBox = await tooltip.boundingBox();
        const style = await tooltip.evaluate((element) => ({ position: getComputedStyle(element).position, fontSize: getComputedStyle(element).fontSize, background: getComputedStyle(element).backgroundColor }));

        expect(style).toMatchObject({ position: 'fixed', fontSize: '12px' });
        expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
        expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(buttonBox.y + buttonBox.height + 50);
        expect(Math.abs(tooltipBox.x + tooltipBox.width / 2 - (buttonBox.x + buttonBox.width / 2))).toBeLessThan(2);
    });
});
