import { IMAGE_FILE } from './rules.js';
import { originalOf } from './sizeVariants.js';

const OPENERS = { '[': ']', '{': '}' };
const CLOSERS = { ']': '[', '}': '{' };
const URL_PATTERN = /(?:https?:)?\/\/[^\s"'<>\\,()]+/g;
const SIZE_HINTS = [/\._[^/]*?(?:S[LXY]|U[SXY])(\d+)/i, /-(\d+)x\d+\.[a-z]+$/i, /_(\d+)x\d*(?:@\dx)?\.[a-z]+$/i, /[?&](?:w|width)=(\d+)/i];
const MIN_STEM_LENGTH = 6;

function unescaped(text) {
    return text.replaceAll('\\/', '/').replace(/\\u002F/gi, '/');
}

function absolute(url, base) {
    try {
        const resolved = new URL(url, base);

        return IMAGE_FILE.test(resolved.pathname) ? resolved.href : null;
    } catch {
        return null;
    }
}

function identity(url) {
    return originalOf(url) ?? url;
}

function sizeHint(url) {
    return Math.max(0, ...SIZE_HINTS.map((pattern) => Number(pattern.exec(url)?.[1] ?? 0)));
}

function stemOf(url) {
    try {
        const name = new URL(identity(url)).pathname.split('/').pop();

        return name.replace(IMAGE_FILE, '');
    } catch {
        return '';
    }
}

function imageUrls(text, base) {
    return [...unescaped(text).matchAll(URL_PATTERN)].map(([url]) => absolute(url, base)).filter(Boolean);
}

function arrayStartBefore(text, from) {
    for (let index = from - 1, depth = 0; index >= 0; index--) {
        const char = text[index];

        if (CLOSERS[char]) {
            depth++;
        } else if (OPENERS[char] && depth > 0) {
            depth--;
        } else if (char === '[') {
            return index;
        }
    }

    return -1;
}

function enclosingArray(text, from) {
    const start = arrayStartBefore(text, from);

    if (start === -1) {
        return null;
    }

    const elements = [];
    let depth = 0;
    let element = start + 1;

    for (let index = start; index < text.length; index++) {
        const char = text[index];

        if (OPENERS[char]) {
            depth++;
        } else if (CLOSERS[char] && --depth === 0) {
            elements.push(text.slice(element, index));

            return { start, elements };
        } else if (char === ',' && depth === 1) {
            elements.push(text.slice(element, index));
            element = index + 1;
        }
    }

    return null;
}

function photoOf(urls) {
    const best = urls.reduce((top, url) => (sizeHint(url) > sizeHint(top) ? url : top), urls[0]);
    const key = identity(best);
    const sizes = urls.filter((url) => identity(url) === key).sort((a, b) => sizeHint(b) - sizeHint(a));
    const thumb = urls.reduce((low, url) => (sizeHint(url) && (!sizeHint(low) || sizeHint(url) < sizeHint(low)) ? url : low), urls[0]);

    return { key, sources: [...new Set([key, ...sizes])], thumb, identities: new Set(urls.map(identity)) };
}

function photosAround(text, at, base) {
    for (let from = at; from > 0;) {
        const array = enclosingArray(text, from);

        if (!array) {
            return null;
        }

        const photos = array.elements.map((element) => imageUrls(element, base)).filter((urls) => urls.length).map(photoOf);

        if (photos.length >= 2 && new Set(photos.map((photo) => photo.key)).size >= 2) {
            return photos;
        }

        from = array.start;
    }

    return null;
}

export function galleryInText(text, shownUrls, base) {
    const shown = new Set(shownUrls.filter(Boolean).map(identity));
    const stems = [...new Set([...shown].map(stemOf))].filter((stem) => stem.length >= MIN_STEM_LENGTH);

    for (const stem of stems) {
        for (let at = text.indexOf(stem); at !== -1; at = text.indexOf(stem, at + stem.length)) {
            const photos = photosAround(text, at, base);
            const start = photos?.findIndex((photo) => [...photo.identities].some((key) => shown.has(key))) ?? -1;

            if (start !== -1) {
                return { photos, start };
            }
        }
    }

    return null;
}

export function embeddedGallery(image) {
    const shownUrls = [image.currentSrc, image.src];

    for (const script of document.querySelectorAll('script:not([src])')) {
        const found = galleryInText(script.textContent, shownUrls, document.baseURI);

        if (found) {
            return found;
        }
    }

    return null;
}
