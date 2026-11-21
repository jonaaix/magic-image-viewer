import { describe } from './describe.js';
import { isContentImage, sourcesBySize, thumbnailSource } from './rules.js';

export function isContentElement(element) {
    return isContentImage(describe(element));
}

export function collectImages(root = document) {
    const indexBySource = new Map();
    const indexByElement = new Map();
    const entries = [];

    for (const element of root.querySelectorAll('img')) {
        const image = describe(element);

        if (!isContentImage(image)) {
            continue;
        }

        const [src, ...fallbacks] = sourcesBySize(image);

        if (!src) {
            continue;
        }

        if (indexBySource.has(src)) {
            indexByElement.set(element, indexBySource.get(src));
            continue;
        }

        indexBySource.set(src, entries.length);
        indexByElement.set(element, entries.length);
        entries.push({
            element,
            item: {
                src,
                fallbacks,
                thumb: thumbnailSource(image),
                alt: image.alt ?? undefined,
                caption: image.caption ?? undefined,
            },
        });
    }

    return { entries, indexOf: (element) => indexByElement.get(element) ?? -1 };
}
