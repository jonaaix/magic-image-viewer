import { originalOf } from '../collector/sizeVariants.js';
import { photoEntries } from '../collector/photoEntries.js';

const HOST = /(^|\.)amazon\.[a-z.]+$/i;
const MARKER = "'colorImages'";
const INITIAL = /^\s*:\s*\{\s*'initial'\s*:\s*(?:A\.\$\.parseJSON\(')?/;

function balancedArray(text, start) {
    let depth = 0;
    let quoted = false;

    for (let index = start; index < text.length; index++) {
        const char = text[index];

        if (quoted) {
            if (char === '\\') {
                index++;
            } else if (char === '"') {
                quoted = false;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === '[') {
            depth++;
        } else if (char === ']' && --depth === 0) {
            return text.slice(start, index + 1);
        }
    }

    return null;
}

function largestOf(sizes) {
    return Object.entries(sizes ?? {}).sort(([, a], [, b]) => b[0] * b[1] - a[0] * a[1])[0]?.[0] ?? null;
}

function identity(url) {
    return url ? (originalOf(url) ?? url) : null;
}

export function readPhotos(text) {
    const at = text.indexOf(MARKER);

    if (at === -1) {
        return [];
    }

    const prefix = INITIAL.exec(text.slice(at + MARKER.length));

    if (!prefix) {
        return [];
    }

    const json = balancedArray(text, at + MARKER.length + prefix[0].length);

    try {
        return JSON.parse(json.replaceAll("\\'", "'"))
            .map((photo) => ({
                sources: [...new Set([identity(photo.hiRes), photo.hiRes, largestOf(photo.main), photo.large].filter(Boolean))],
                thumb: photo.thumb ?? undefined,
                alt: photo.altText ?? undefined,
            }))
            .filter((photo) => photo.sources.length);
    } catch {
        return [];
    }
}

export function indexOfShown(photos, shownSources) {
    const shown = new Set(shownSources.map(identity).filter(Boolean));

    return photos.findIndex((photo) => [...photo.sources, photo.thumb].some((source) => shown.has(identity(source))));
}

function photosOfPage() {
    for (const script of document.scripts) {
        if (script.textContent.includes(MARKER)) {
            const photos = readPhotos(script.textContent);

            if (photos.length) {
                return photos;
            }
        }
    }

    return [];
}

export const amazon = {
    matches: (hostname) => HOST.test(hostname),
    gallery(image) {
        const photos = photosOfPage();
        const start = indexOfShown(photos, [image.currentSrc, image.getAttribute('src')]);

        if (start === -1) {
            return null;
        }

        return photoEntries(photos, start, image);
    },
};
