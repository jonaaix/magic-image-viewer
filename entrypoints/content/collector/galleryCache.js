import { collectGallery, collectImages, isContentElement } from './index.js';

export const IDLE_BUDGET_MS = 8;
export const IDLE_TIMEOUT_MS = 2000;
export const MUTATION_DEBOUNCE_MS = 300;

const HOST_NAME = 'magic-image-viewer';

function whenIdle(callback) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    } else {
        setTimeout(() => callback({ timeRemaining: () => IDLE_BUDGET_MS }), 50);
    }
}

function whenLoaded(callback) {
    if (document.readyState === 'complete') {
        callback();
    } else {
        window.addEventListener('load', callback, { once: true });
    }
}

const isOwnNode = (node) => node.localName === HOST_NAME;
const isOwnMutation = (record) => isOwnNode(record.target) || [...record.addedNodes, ...record.removedNodes].every(isOwnNode);

export function createGalleryCache({ isEnabled, onIdle = () => {}, onReady = () => {} }) {
    let galleries = new WeakMap();
    let sources = new Set();
    let queue = null;
    let complete = false;
    let scheduled = false;
    let debounce = null;

    function remember(image) {
        const gallery = collectGallery(image);
        const result = { entries: gallery.entries, origins: gallery.entries.map((entry) => entry.element) };

        for (const member of gallery.members) {
            galleries.set(member, { ...result, start: gallery.indexOf(member) });
        }

        if (!galleries.has(image)) {
            galleries.set(image, { ...result, start: gallery.start });
        }
    }

    function visit(image) {
        if (!image.isConnected || !isContentElement(image)) {
            return;
        }

        if (!galleries.has(image)) {
            remember(image);
        }

        const { entries, start } = galleries.get(image);
        entries[start] && sources.add(entries[start].item.src);
    }

    function work(deadline) {
        scheduled = false;

        if (!isEnabled()) {
            return;
        }

        queue ??= [...document.images];
        const end = performance.now() + Math.min(IDLE_BUDGET_MS, Math.max(1, deadline.timeRemaining()));

        while (queue.length && performance.now() < end) {
            visit(queue.shift());
        }

        if (queue.length) {
            schedule();
        } else {
            complete = true;
            onReady();
        }
    }

    function schedule() {
        if (!scheduled) {
            scheduled = true;
            whenIdle(work);
        }
    }

    function invalidate() {
        galleries = new WeakMap();
        sources = new Set();
        queue = null;
        complete = false;
    }

    function watch() {
        new MutationObserver((records) => {
            if (records.every(isOwnMutation)) {
                return;
            }

            invalidate();
            clearTimeout(debounce);
            debounce = setTimeout(schedule, MUTATION_DEBOUNCE_MS);
        }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
    }

    whenLoaded(() => {
        watch();
        schedule();
        whenIdle(onIdle);
    });

    return {
        galleryFor: (image) => galleries.get(image) ?? null,
        galleryNow(image) {
            if (!galleries.has(image)) {
                remember(image);
            }

            return galleries.get(image);
        },
        imageCount: () => (complete ? sources.size : collectImages().entries.length),
    };
}
