import { describe } from './describe.js';
import { isContentImage, largestSource } from './rules.js';

export function collectImages(root = document) {
    const seen = new Set();
    const entries = [];

    for (const element of root.querySelectorAll('img')) {
        const image = describe(element);

        if (!isContentImage(image)) {
            continue;
        }

        const src = largestSource(image);

        if (!src || seen.has(src)) {
            continue;
        }

        seen.add(src);
        entries.push({
            element,
            item: {
                src,
                thumb: image.currentSrc ?? src,
                alt: image.alt ?? undefined,
                caption: image.caption ?? undefined,
            },
        });
    }

    return entries;
}
