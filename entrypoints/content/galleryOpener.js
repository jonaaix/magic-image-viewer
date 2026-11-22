import { collectAlone, collectGallery } from './collector/index.js';
import { cornerRadius } from './collector/rules.js';

function onScreen(rect) {
    return rect.width > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function originOf(elements) {
    return (index) => {
        const element = elements[index];

        if (!element?.isConnected) {
            return null;
        }

        const rect = element.getBoundingClientRect();

        return onScreen(rect) ? rect : null;
    };
}

function radiusOf(element) {
    const rect = element.getBoundingClientRect();

    return cornerRadius(getComputedStyle(element).borderTopLeftRadius, rect.width, rect.height);
}

function show(viewer, image, { entries, start }, options = {}) {
    const items = entries.map((entry) => entry.item);
    const opened = viewer.open(items, start, { origin: originOf(entries.map((entry) => entry.element)), originRadius: radiusOf(image), ...options });

    return { items, opened };
}

function addGroupLater(viewer, image, shown) {
    requestAnimationFrame(() => setTimeout(() => {
        if (!viewer.shows(shown)) {
            return;
        }

        const { entries, start } = collectGallery(image);

        if (entries.length > 1) {
            viewer.replace(entries.map((entry) => entry.item), start, { origin: originOf(entries.map((entry) => entry.element)) });
        }
    }));
}

export function openInGallery(viewer, image) {
    const alone = collectAlone(image);

    if (alone.start === -1) {
        return false;
    }

    const { items, opened } = show(viewer, image, alone, { reserveThumbnails: true });
    opened.then(() => addGroupLater(viewer, image, items));

    return true;
}

export function openAlone(viewer, src, element = null) {
    const item = { src, alt: element?.alt || undefined };

    if (!element?.isConnected) {
        viewer.open([item], 0);

        return;
    }

    viewer.open([item], 0, { origin: originOf([element]), originRadius: radiusOf(element) });
}
