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

function isPlainClick(event) {
    return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

export function openOnClick(viewer) {
    document.addEventListener('click', (event) => {
        const target = event.composedPath()[0];

        if (!isPlainClick(event) || viewer.isOpen() || viewer.owns(event) || target?.localName !== 'img' || target.closest('a[href]')) {
            return;
        }

        const entries = collectImages();
        const start = entries.findIndex((entry) => entry.element === target);

        if (start === -1) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const elements = entries.map((entry) => entry.element);
        viewer.open(entries.map((entry) => entry.item), start, { origin: originOf(elements), originRadius: radiusOf(target) });
    }, true);
}
