import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allSitesSwitch, backgroundOf, chooseMenuEntry, expect, launchExtension, message, openPopup, siteSwitch, test, viewer } from './support/extension.js';

const OTHER_HOST = 'http://127.0.0.1:5190';

const siteLog = (page) => page.evaluate(() => window.siteLog);
const noViewer = (page) => expect(page.locator('magic-image-viewer [role="dialog"]')).toHaveCount(0);
const badge = async (page) => (await backgroundOf(page.context())).evaluate(() => chrome.action.getBadgeText({}));
const menuExists = async (page) => (await backgroundOf(page.context())).evaluate(() => chrome.contextMenus.update('show-in-viewer', {}).then(() => true, () => false));

async function switchOff(page, control) {
    const popup = await openPopup(page);
    await expect(control(popup)).toBeChecked();
    await control(popup).click();
    await expect(control(popup)).not.toBeChecked();
    await popup.close();
    await page.bringToFront();
}

async function clickOpensOurs(page) {
    await page.locator('#direct').click();
    await expect(viewer(page)).toBeVisible();
    expect(await siteLog(page)).toEqual([]);
}

async function clickOpensSite(page) {
    await page.locator('#direct').click();
    await page.waitForTimeout(300);
    await noViewer(page);
    expect(await siteLog(page)).toEqual(['direct']);
}

test.describe('switched off everywhere', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/lightboxes.html');
        await expect.poll(() => menuExists(page)).toBe(true);
        await switchOff(page, allSitesSwitch);
    });

    test('a click opens the site lightbox again without a reload', async ({ page }) => {
        await clickOpensSite(page);
    });

    test('an image tab shows the browser view', async ({ page }) => {
        await page.goto('/images/photo.png');
        await page.waitForTimeout(800);

        await noViewer(page);
    });

    test('the context menu entry is gone and the icon says off', async ({ page }) => {
        await expect.poll(() => menuExists(page)).toBe(false);
        await expect.poll(() => badge(page)).toBe(await message(page.context(), 'badgeOff'));
    });

    test('switching on again restores everything', async ({ page }) => {
        const popup = await openPopup(page);
        await allSitesSwitch(popup).click();
        await popup.close();

        await clickOpensOurs(page);
        await expect.poll(() => menuExists(page)).toBe(true);
    });
});

test.describe('switched off on one site', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/lightboxes.html');
        await switchOff(page, siteSwitch);
    });

    test('only that host is affected', async ({ page }) => {
        await clickOpensSite(page);

        await page.goto(`${OTHER_HOST}/lightboxes.html`);
        await clickOpensOurs(page);
    });

    test('the choice survives a reload', async ({ page }) => {
        await page.reload();

        await clickOpensSite(page);
    });

    test('the context menu entry still opens the viewer', async ({ page }) => {
        await chooseMenuEntry(page, page.locator('#direct'));

        await expect(viewer(page)).toBeVisible();
    });
});

test('the site choice survives a browser restart', async ({ baseURL }) => {
    const profile = mkdtempSync(join(tmpdir(), 'miv-profile-'));

    try {
        let context = await launchExtension(profile);
        let page = context.pages()[0] ?? (await context.newPage());
        await page.goto(`${baseURL}/lightboxes.html`);
        await switchOff(page, siteSwitch);
        await context.close();

        context = await launchExtension(profile);
        page = context.pages()[0] ?? (await context.newPage());
        await page.goto(`${baseURL}/lightboxes.html`);
        await clickOpensSite(page);
        await context.close();
    } finally {
        rmSync(profile, { recursive: true, force: true });
    }
});

test('a page extensions cannot reach shows a hint instead of the site switch', async ({ page }) => {
    await page.goto('about:blank');
    const popup = await openPopup(page);

    await expect(popup.locator('[data-hint="unreachable"]')).toHaveText(await message(page.context(), 'popup_unavailable'));
    await expect(siteSwitch(popup)).toHaveCount(0);
});
