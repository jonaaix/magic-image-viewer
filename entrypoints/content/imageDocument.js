import { openAlone } from './galleryOpener.js';

export function isImageDocument() {
    return document.contentType.startsWith('image/') && document.contentType !== 'image/svg+xml';
}

function whenReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

export function showImageDocument(viewer, activation) {
    const image = () => document.querySelector('img');
    const show = () => openAlone(viewer, window.location.href, image());

    activation.ready.then(() => whenReady(() => activation.isSiteEnabled() && show()));

    window.addEventListener('click', (event) => {
        if (!activation.isSiteEnabled() || event.button !== 0 || viewer.isOpen() || event.composedPath()[0] !== image()) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        show();
    }, true);
}
