export const MIN_SHORT_SIDE = 100;
export const MIN_LINKED_THUMBNAIL_SIDE = 40;
export const FULL_SIZE_ATTRIBUTES = ['data-zoom-image', 'data-full', 'data-large', 'data-src'];

const IMAGE_FILE = /\.(avif|bmp|gif|jpe?g|jxl|png|svg|webp)$/i;
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

    if (shortSide >= MIN_SHORT_SIDE) {
        return true;
    }

    return shortSide >= MIN_LINKED_THUMBNAIL_SIDE && !!image.link && isImageUrl(image.link);
}

export function largestSource(image) {
    if (image.link && isImageUrl(image.link)) {
        return image.link;
    }

    const fromSrcset = largestCandidate([image.srcset, ...image.sourceSrcsets].flatMap(parseSrcset));

    if (fromSrcset) {
        return fromSrcset;
    }

    const fromAttribute = FULL_SIZE_ATTRIBUTES.map((name) => image.attributes[name]).find(Boolean);

    return fromAttribute ?? image.currentSrc ?? image.src;
}

export function cornerRadius(value, width, height) {
    const amount = parseFloat(value) || 0;

    return value?.trim().endsWith('%') ? (amount / 100) * Math.min(width, height) : amount;
}
