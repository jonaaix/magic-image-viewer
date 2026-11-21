import { allSitesSwitch, expect, message, openPopup, siteSwitch, test, viewer } from './support/extension.js';

const shots = process.env.SHOTS_DIR;
const status = (popup) => popup.locator('[data-status]');

async function shoot(popup, name) {
    if (!shots) {
        return;
    }

    for (const scheme of ['light', 'dark']) {
        await popup.emulateMedia({ colorScheme: scheme });
        await popup.waitForTimeout(150);
        await popup.locator('main').screenshot({ path: `${shots}/popup-${name}-${scheme}.png` });
    }
}

test('counts the same images the viewer shows', async ({ page }) => {
    await page.goto('/article.html');
    await page.locator('img[alt="Cliffs at dawn"]').click();
    await expect(viewer(page).locator('span.tabular-nums')).toHaveText('1 / 4');
    await page.keyboard.press('Escape');

    const popup = await openPopup(page);

    await expect(status(popup)).toHaveAttribute('data-status', 'active');
    await expect(popup.locator('[data-image-count]')).toHaveText(await popup.evaluate(() => chrome.i18n.getMessage('popup_imagesOther', ['4'])));
    await shoot(popup, 'active');
});

test('says when the viewer is off on this site or everywhere', async ({ page }) => {
    await page.goto('/article.html');
    const popup = await openPopup(page);

    await siteSwitch(popup).click();
    await expect(status(popup)).toHaveText(await message(page.context(), 'popup_statusSiteOff'));
    await expect(popup.locator('[data-image-count]')).toHaveCount(0);
    await shoot(popup, 'site-off');

    await allSitesSwitch(popup).click();
    await expect(status(popup)).toHaveText(await message(page.context(), 'popup_statusAllOff'));
    await shoot(popup, 'all-off');
});

test('shows no count where the viewer cannot run', async ({ page }) => {
    await page.goto('about:blank');
    const popup = await openPopup(page);

    await expect(status(popup)).toHaveAttribute('data-status', 'unavailable');
    await expect(popup.locator('[data-image-count]')).toHaveCount(0);
    await shoot(popup, 'unavailable');
});

test('links to the author, the project and its issues, without a coffee button while no link is set', async ({ page }) => {
    await page.goto('/article.html');
    const popup = await openPopup(page);

    await expect(popup.locator('[data-link="author"]')).toHaveAttribute('href', 'https://github.com/jonaaix');
    await expect(popup.locator('[data-link="issues"]')).toHaveAttribute('href', 'https://github.com/jonaaix/magic-image-viewer/issues');
    await expect(popup.locator('[data-trust="private"]')).toHaveAttribute('href', /PRIVACY\.md$/);
    await expect(popup.locator('[data-link="coffee"]')).toHaveCount(0);
});
