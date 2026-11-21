import { SHOW_IMAGE, SITE_STATE } from '../utils/messages.js';
import { enabledSetting } from '../utils/settings.js';
import { isReachable } from '../utils/reachablePages.js';

const MENU_ID = 'show-in-viewer';
const BADGE_COLOUR = '#6b7280';
const ACTION_ICON_SIZES = [16, 24, 32];

async function showInViewer({ srcUrl, frameId }, tab) {
    try {
        await browser.tabs.sendMessage(tab.id, { type: SHOW_IMAGE, src: srcUrl, inTopFrame: frameId === 0 }, { frameId: 0 });
    } catch {
        if (!isReachable(srcUrl)) {
            return;
        }

        // The page was open before the extension was installed or is one content scripts cannot reach.
        await browser.tabs.create({ url: srcUrl, index: tab.index + 1, openerTabId: tab.id });
    }
}

function badgeText(active) {
    return active ? '' : browser.i18n.getMessage('badgeOff');
}

function iconPath(active) {
    return Object.fromEntries(ACTION_ICON_SIZES.map((size) => [size, `/icons/${active ? '' : 'off/'}${size}.png`]));
}

async function showState(active, tabId = undefined) {
    const target = tabId === undefined ? {} : { tabId };
    await Promise.all([
        browser.action.setBadgeText({ ...target, text: badgeText(active) }),
        browser.action.setIcon({ ...target, path: iconPath(active) }),
    ]);
}

async function applyEnabled(enabled) {
    await browser.contextMenus.removeAll();

    if (enabled) {
        browser.contextMenus.create({ id: MENU_ID, title: browser.i18n.getMessage('showInViewer'), contexts: ['image'] });
    }

    await showState(enabled);
}

export default defineBackground(() => {
    browser.action.setBadgeBackgroundColor({ color: BADGE_COLOUR });

    browser.runtime.onInstalled.addListener(async () => applyEnabled(await enabledSetting.getValue()));
    browser.runtime.onStartup.addListener(async () => applyEnabled(await enabledSetting.getValue()));
    enabledSetting.watch((enabled) => applyEnabled(enabled));

    browser.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === MENU_ID && tab?.id !== undefined) {
            showInViewer(info, tab);
        }
    });

    browser.runtime.onMessage.addListener((message, sender) => {
        if (message?.type === SITE_STATE && sender.tab?.id !== undefined && sender.frameId === 0) {
            showState(message.active, sender.tab.id);
        }
    });

    if (import.meta.env.MODE === 'test') {
        globalThis.showInViewer = showInViewer;
    }
});
