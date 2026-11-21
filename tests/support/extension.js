import { test as base, chromium, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../dist/chrome-mv3-test', import.meta.url));

export function launchExtension(userDataDir = '', options = {}) {
    return chromium.launchPersistentContext(userDataDir, {
        channel: 'chromium',
        viewport: { width: 1280, height: 800 },
        ...options,
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`, ...(options.args ?? [])],
    });
}

export const test = base.extend({
    context: async ({ viewport }, use) => {
        const context = await launchExtension('', viewport ? { viewport } : {});

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

export async function backgroundOf(context) {
    return context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
}

export async function openPopup(page) {
    const context = page.context();
    const worker = await backgroundOf(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html?url=${encodeURIComponent(page.url())}`);
    await expect(popup.locator('main')).toBeVisible();

    return popup;
}

export const allSitesSwitch = (popup) => popup.locator('[data-setting="enabled"] input');
export const siteSwitch = (popup) => popup.locator('[data-setting="site"] input');

export async function chooseMenuEntry(page, image, { inFrame = false } = {}) {
    await image.click({ button: 'right' });
    const src = await image.evaluate((element) => element.currentSrc);
    const context = page.context();
    const worker = await backgroundOf(context);

    await worker.evaluate(async ({ srcUrl, frameId }) => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        await globalThis.showInViewer({ srcUrl, frameId }, tab);
    }, { srcUrl: src, frameId: inFrame ? 1 : 0 });

    return src;
}

export async function message(context, key) {
    return (await backgroundOf(context)).evaluate((name) => chrome.i18n.getMessage(name), key);
}

export function label(page, key) {
    return message(page.context(), `lightbox_${key}`);
}
