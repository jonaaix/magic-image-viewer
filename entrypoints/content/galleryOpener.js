import { collectImages } from './collector/index.js';
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

export function openInGallery(viewer, image) {
    const { entries, indexOf } = collectImages();
    const start = indexOf(image);

    if (start === -1) {
        return false;
    }

    const elements = entries.map((entry) => entry.element);
    viewer.open(entries.map((entry) => entry.item), start, { origin: originOf(elements), originRadius: radiusOf(image) });

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
