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

function whenActivated(callback) {
    if (document.prerendering) {
        document.addEventListener('prerenderingchange', callback, { once: true });
    } else {
        callback();
    }
}

export function showImageDocument(viewer, activation) {
    const image = () => document.querySelector('img');
    const show = () => openAlone(viewer, window.location.href, image());
    const showAgain = () => activation.isSiteEnabled() && document.visibilityState === 'visible' && !viewer.isOpen() && show();

    activation.ready.then(() => whenReady(() => whenActivated(() => activation.isSiteEnabled() && show())));
    window.addEventListener('pageshow', (event) => event.persisted && showAgain());
    document.addEventListener('visibilitychange', showAgain);

    window.addEventListener('click', (event) => {
        if (!activation.isSiteEnabled() || event.button !== 0 || viewer.isOpen() || event.composedPath()[0] !== image()) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        show();
    }, true);
}
