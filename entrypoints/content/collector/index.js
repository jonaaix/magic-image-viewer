import { describe } from './describe.js';
import { findGroup } from './group.js';
import { isContentImage, isGroupImage, showsSameImage, sourcesBySize, thumbnailSource } from './rules.js';

export function isContentElement(element) {
    return isContentImage(describe(element));
}

function entriesOf(elements, describeOf) {
    const indexBySource = new Map();
    const indexByElement = new Map();
    const entries = [];

    for (const element of elements) {
        const image = describeOf(element);
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

function cachedDescribe() {
    const cache = new Map();

    return (element) => {
        if (!cache.has(element)) {
            cache.set(element, describe(element));
        }

        return cache.get(element);
    };
}

export function collectImages(root = document) {
    const describeOf = cachedDescribe();

    return entriesOf([...root.querySelectorAll('img')].filter((element) => isContentImage(describeOf(element))), describeOf);
}

export function collectGallery(image) {
    const describeOf = cachedDescribe();
    const measures = { counts: (element) => isGroupImage(describeOf(element)), sizeOf: describeOf };
    const group = findGroup(image, measures);

    if (group) {
        const gallery = entriesOf(group, describeOf);

        return { ...gallery, start: gallery.indexOf(image) };
    }

    const shown = describeOf(image);

    for (const other of document.images) {
        if (other === image || !measures.counts(other) || !showsSameImage(shown, describeOf(other))) {
            continue;
        }

        const preview = findGroup(other, measures);

        if (preview) {
            const gallery = entriesOf(preview, describeOf);

            return { ...gallery, start: gallery.indexOf(other) };
        }
    }

    return collectAlone(image, describeOf);
}

export function collectAlone(image, describeOf = cachedDescribe()) {
    const alone = entriesOf([image], describeOf);

    return { ...alone, start: alone.indexOf(image) };
}
