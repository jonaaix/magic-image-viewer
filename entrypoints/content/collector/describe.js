import { FULL_SIZE_ATTRIBUTES, LAZY_SRCSET_ATTRIBUTES } from './rules.js';
import { controlAround } from '../controls.js';

const CONTROLS = 'button, [role="button"], input, select, textarea, label, option';

function absolute(url) {
    if (!url) {
        return null;
    }

    try {
        return new URL(url, document.baseURI).href;
    } catch {
        return null;
    }
}

function absoluteSrcset(srcset) {
    return (srcset ?? '')
        .split(/,\s+(?=\S)/)
        .map((entry) => {
            const [url, ...rest] = entry.trim().split(/\s+/);

            return [absolute(url), ...rest].join(' ');
        })
        .join(', ');
}

function isRendered(element) {
    if (element.getClientRects().length === 0) {
        return false;
    }

    const style = getComputedStyle(element);

    return style.visibility !== 'hidden' && style.opacity !== '0';
}

function srcsetOf(element) {
    return [element.getAttribute('srcset'), ...LAZY_SRCSET_ATTRIBUTES.map((name) => element.getAttribute(name))].find(Boolean) ?? null;
}

export function describe(element) {
    const rect = element.getBoundingClientRect();
    const loaded = element.complete && element.naturalWidth > 1;
    const picture = element.parentElement?.localName === 'picture' ? element.parentElement : null;
    const sources = picture ? [...picture.querySelectorAll(':scope > source')] : [];
    const attributes = Object.fromEntries(FULL_SIZE_ATTRIBUTES.map((name) => [name, absolute(element.getAttribute(name))]));

    return {
        width: rect.width,
        height: rect.height,
        visible: isRendered(element),
        laidOut: element.getClientRects().length > 0,
        pending: !loaded && (element.loading === 'lazy' || FULL_SIZE_ATTRIBUTES.some((name) => element.hasAttribute(name)) || LAZY_SRCSET_ATTRIBUTES.some((name) => element.hasAttribute(name))),
        inControl: !!controlAround(element, CONTROLS) || element.isContentEditable,
        src: absolute(element.getAttribute('src')) ?? '',
        currentSrc: loaded ? element.currentSrc || null : null,
        srcset: absoluteSrcset(srcsetOf(element)),
        sourceSrcsets: sources.map((source) => absoluteSrcset(srcsetOf(source))),
        attributes,
        link: absolute(element.closest('a[href]')?.getAttribute('href')),
        alt: element.getAttribute('alt') || null,
        caption: element.closest('figure')?.querySelector('figcaption')?.textContent.trim() || null,
    };
}
