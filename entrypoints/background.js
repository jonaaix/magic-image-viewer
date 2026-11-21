import { SHOW_IMAGE } from '../utils/messages.js';

const MENU_ID = 'show-in-viewer';

async function showInViewer({ srcUrl, frameId }, tab) {
    try {
        await browser.tabs.sendMessage(tab.id, { type: SHOW_IMAGE, src: srcUrl, inTopFrame: frameId === 0 }, { frameId: 0 });
    } catch {
        // The page was open before the extension was installed or is one content scripts cannot reach.
        await browser.tabs.create({ url: srcUrl, index: tab.index + 1, openerTabId: tab.id });
    }
}

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(() => {
        browser.contextMenus.create({ id: MENU_ID, title: browser.i18n.getMessage('showInViewer'), contexts: ['image'] });
    });

    browser.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === MENU_ID && tab?.id !== undefined) {
            showInViewer(info, tab);
        }
    });

    if (import.meta.env.MODE === 'test') {
        globalThis.showInViewer = showInViewer;
    }
});
