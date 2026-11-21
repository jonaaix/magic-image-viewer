import { collectImages, isContentElement } from './collector/index.js';
import { cornerRadius } from './collector/rules.js';
import { CAROUSEL_MARKUP, isSwipeStyle, linkKind, movedTooFar, shouldOpen } from './clickRules.js';

const PRESS_EVENTS = ['pointerdown', 'mousedown', 'touchstart'];
const RELEASE_EVENTS = ['pointerup', 'mouseup', 'touchend'];
const CONTROLS = 'button, [role="button"], input, select, textarea, option, summary, [contenteditable]:not([contenteditable="false"])';
const ANCESTOR_SEARCH_DEPTH = 3;

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

function pointOf(event) {
    const touch = event.changedTouches?.[0];

    return touch ? { x: touch.clientX, y: touch.clientY } : { x: event.clientX, y: event.clientY };
}

function contains(rect, { x, y }) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function imageBelow(top, point) {
    for (const element of document.elementsFromPoint(point.x, point.y)) {
        if (element.localName === 'img') {
            return element;
        }

        if (element.closest(CONTROLS)) {
            return null;
        }
    }

    let scope = top;

    for (let depth = 0; depth < ANCESTOR_SEARCH_DEPTH && scope && scope !== document.body && scope !== document.documentElement; depth++, scope = scope.parentElement) {
        const hit = [...scope.querySelectorAll('img')].find((image) => contains(image.getBoundingClientRect(), point));

        if (hit) {
            return hit;
        }
    }

    return null;
}

function imageOf(event) {
    const top = event.composedPath()[0];

    if (!(top instanceof Element)) {
        return null;
    }

    if (top.localName === 'img') {
        return top;
    }

    if (top.closest(CONTROLS)) {
        return null;
    }

    if (event.type === 'click' && event.detail === 0) {
        return top.closest('a[href]')?.querySelector('img') ?? null;
    }

    return imageBelow(top, pointOf(event));
}

function isPrimary(event) {
    if (event.type.startsWith('touch')) {
        return event.changedTouches?.length === 1;
    }

    return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function claimedImage(event, viewer) {
    if (!isPrimary(event) || viewer.isOpen() || viewer.owns(event) || document.designMode === 'on') {
        return null;
    }

    const image = imageOf(event);

    if (!image || image.isContentEditable || !isContentElement(image)) {
        return null;
    }

    const anchor = event.composedPath()[0].closest?.('a[href]') ?? image.closest('a[href]');
    const link = anchor ? linkKind(anchor.getAttribute('href'), document.baseURI) : 'none';

    return shouldOpen({ link, altKey: event.altKey }) ? image : null;
}

function scrollsSideways(element, style) {
    return element.scrollWidth > element.clientWidth && ['auto', 'scroll'].includes(style.overflowX);
}

function inSwipeRegion(image) {
    if (image.closest(CAROUSEL_MARKUP)) {
        return true;
    }

    for (let element = image; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
        const style = getComputedStyle(element);
        const swipes = isSwipeStyle({
            overflowX: style.overflowX,
            scrollsSideways: scrollsSideways(element, style),
            scrollSnapType: style.scrollSnapType,
            touchAction: style.touchAction,
        });

        if (swipes) {
            return true;
        }
    }

    return false;
}

function open(viewer, image) {
    const { entries, indexOf } = collectImages();
    const start = indexOf(image);

    if (start === -1) {
        return;
    }

    const elements = entries.map((entry) => entry.element);
    viewer.open(entries.map((entry) => entry.item), start, { origin: originOf(elements), originRadius: radiusOf(image) });
}

export function openOnClick(viewer) {
    let press = null;

    for (const type of [...PRESS_EVENTS, ...RELEASE_EVENTS]) {
        window.addEventListener(type, (event) => {
            if (PRESS_EVENTS.includes(type)) {
                press = pointOf(event);
            }

            const image = claimedImage(event, viewer);

            if (image && !inSwipeRegion(image)) {
                event.stopPropagation();
            }
        }, true);
    }

    window.addEventListener('click', (event) => {
        const moved = event.detail > 0 && movedTooFar(press, pointOf(event));
        press = null;
        const image = claimedImage(event, viewer);

        if (!image || (moved && inSwipeRegion(image))) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        if (!moved) {
            open(viewer, image);
        }
    }, true);
}
