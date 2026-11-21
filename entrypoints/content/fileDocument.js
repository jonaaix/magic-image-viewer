import { FILE_TAB } from '../../utils/messages.js';

const isVideoDocument = () => document.contentType.startsWith('video/');

export function isFileDocument() {
    const type = document.contentType;

    return (type.startsWith('image/') && type !== 'image/svg+xml') || type.startsWith('video/');
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

function silence(video) {
    video.autoplay = false;
    video.muted = true;
    video.pause();
    video.addEventListener('play', () => video.pause());
}

export function showFileDocument(viewer, activation) {
    const show = () => {
        if (!activation.isEnabled() || viewer.isOpen()) {
            return;
        }

        const video = isVideoDocument() ? document.querySelector('video') : null;
        video && silence(video);

        viewer.open([{ src: window.location.href, type: video ? 'video' : 'image' }], 0, { closable: false });
    };

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type === FILE_TAB) {
            sendResponse(true);
        }
    });

    activation.ready.then(() => whenReady(() => whenActivated(show)));
    activation.onChange(show);
    window.addEventListener('pageshow', (event) => event.persisted && show());
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && show());
}
