import { test as base, chromium, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../.output/chrome-mv3-test', import.meta.url));

export const test = base.extend({
    context: async ({ viewport }, use) => {
        const context = await chromium.launchPersistentContext('', {
            channel: 'chromium',
            viewport,
            args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
        });

        await use(context);
        await context.close();
    },
    page: async ({ context }, use) => {
        await use(context.pages()[0] ?? (await context.newPage()));
    },
});

export { expect };

export const viewer = (page) => page.locator('magic-image-viewer').getByRole('dialog');

export async function openViewer(page, start = 0) {
    await page.evaluate((index) => window.openViewer(index), start);
    await expect(viewer(page)).toBeVisible();
    await expect(viewer(page).locator('img.ilg-image')).toHaveAttribute('style', /scale\(1\)/);
    await page.waitForTimeout(450);
}
