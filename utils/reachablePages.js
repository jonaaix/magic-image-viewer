const SCRIPTABLE_PROTOCOLS = ['http:', 'https:', 'file:'];
const STORE_PAGES = [/^https:\/\/chromewebstore\.google\.com\//, /^https:\/\/chrome\.google\.com\/webstore/, /^https:\/\/addons\.mozilla\.org\//, /^https:\/\/microsoftedge\.microsoft\.com\/addons/];

export function isReachable(url) {
    if (!url) {
        return false;
    }

    try {
        return SCRIPTABLE_PROTOCOLS.includes(new URL(url).protocol) && !STORE_PAGES.some((page) => page.test(url));
    } catch {
        return false;
    }
}
