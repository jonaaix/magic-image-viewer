import { isImageUrl } from './collector/rules.js';

export function linkKind(href, baseUri) {
    const value = href?.trim() ?? '';

    if (!value || value.startsWith('#') || /^javascript:/i.test(value)) {
        return 'none';
    }

    try {
        const url = new URL(value, baseUri);

        if (url.href.split('#')[0] === baseUri.split('#')[0] && url.hash) {
            return 'none';
        }

        return isImageUrl(url.href) ? 'image' : 'page';
    } catch {
        return 'none';
    }
}

export function shouldOpen({ link, altKey }) {
    return altKey || link !== 'page';
}
