import { originalOf } from './sizeVariants.js';

export const MIN_SHORT_SIDE = 100;
export const MIN_LINKED_THUMBNAIL_SIDE = 40;
export const MIN_GROUP_IMAGE_SIDE = 40;
export const FULL_SIZE_ATTRIBUTES = ['data-zoom-image', 'data-full', 'data-large', 'data-src'];

export const IMAGE_FILE = /\.(avif|bmp|gif|jpe?g|jxl|png|svg|webp)$/i;
const SPRITE = /sprite/i;

export function isImageUrl(url) {
    try {
        return IMAGE_FILE.test(new URL(url).pathname);
    } catch {
        return false;
    }
}

export function parseSrcset(srcset) {
    if (!srcset) {
        return [];
    }

    return srcset
        .split(/,\s+(?=\S)/)
        .map((entry) => entry.trim().split(/\s+/))
        .filter(([url]) => url)
        .map(([url, descriptor = '1x']) => {
            const amount = parseFloat(descriptor);
            const unit = descriptor.slice(-1);

            return { url, width: unit === 'w' ? amount : null, density: unit === 'x' ? amount : null };
        });
}

export function largestCandidate(candidates) {
    const byWidth = candidates.filter((candidate) => candidate.width);
    const pool = byWidth.length ? byWidth : candidates.filter((candidate) => candidate.density);
    const measure = (candidate) => candidate.width ?? candidate.density;

    return pool.reduce((best, candidate) => (!best || measure(candidate) > measure(best) ? candidate : best), null)?.url ?? null;
}

export function isContentImage(image) {
    if (!image.visible || image.inControl || SPRITE.test(image.src)) {
        return false;
    }

    const shortSide = Math.min(image.width, image.height);

    if (image.pending && shortSide === 0) {
        return true;
    }

    if (shortSide >= MIN_SHORT_SIDE) {
        return true;
    }

    return shortSide >= MIN_LINKED_THUMBNAIL_SIDE && !!image.link && isImageUrl(image.link);
}

export function isGroupImage(image) {
    if (!image.visible || image.inControl || SPRITE.test(image.src)) {
        return false;
    }

    const shortSide = Math.min(image.width, image.height);

    return (image.pending && shortSide === 0) || shortSide >= MIN_GROUP_IMAGE_SIDE;
}

export function showsSameImage(a, b) {
    const [largestA] = sourcesBySize(a);
    const [largestB] = sourcesBySize(b);

    return (!!largestA && sourcesBySize(b).includes(largestA)) || (!!largestB && sourcesBySize(a).includes(largestB));
}

export function sourcesBySize(image) {
    const link = image.link && isImageUrl(image.link) ? image.link : null;
    const declared = [
        largestCandidate([image.srcset, ...image.sourceSrcsets].flatMap(parseSrcset)),
        ...FULL_SIZE_ATTRIBUTES.map((name) => image.attributes[name]),
    ].filter(Boolean);
    const shown = [image.currentSrc, image.src].filter(Boolean);
    const originals = [link, ...declared, ...shown].filter(Boolean).map(originalOf).filter(Boolean);

    return [...new Set([link, ...originals, ...declared, ...shown].filter(Boolean))];
}

export function thumbnailSource(image) {
    if (image.currentSrc) {
        return image.currentSrc;
    }

    if (image.src && !image.src.startsWith('data:')) {
        return image.src;
    }

    const link = image.link && isImageUrl(image.link) ? image.link : null;

    return sourcesBySize(image).find((source) => source !== link && !source.startsWith('data:')) ?? image.src;
}

export function largestSource(image) {
    return sourcesBySize(image)[0] ?? null;
}

export function cornerRadius(value, width, height) {
    const amount = parseFloat(value) || 0;

    return value?.trim().endsWith('%') ? (amount / 100) * Math.min(width, height) : amount;
}
