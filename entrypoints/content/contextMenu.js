import { SHOW_IMAGE } from '../../utils/messages.js';
import { openAlone, openInGallery } from './galleryOpener.js';

function shows(image, src) {
    return image.currentSrc === src || image.src === src;
}

function imageFor(src, lastTarget) {
    if (lastTarget?.localName === 'img' && lastTarget.isConnected && shows(lastTarget, src)) {
        return lastTarget;
    }

    return [...document.images].find((image) => shows(image, src)) ?? null;
}

export function openFromContextMenu(viewer, activation) {
    let lastTarget = null;

    window.addEventListener('contextmenu', (event) => (lastTarget = event.composedPath()[0]), true);

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type !== SHOW_IMAGE) {
            return;
        }

        sendResponse(true);

        if (!activation.isEnabled() || viewer.isOpen()) {
            return;
        }

        const image = message.inTopFrame ? imageFor(message.src, lastTarget) : null;

        if (!image || !openInGallery(viewer, image)) {
            openAlone(viewer, message.src, image);
        }
    });
}
