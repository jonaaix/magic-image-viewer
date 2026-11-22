import './style.css';
import { createViewer } from './viewer.js';
import { guardKeys } from './keyGuard.js';
import { openOnClick } from './clickToOpen.js';
import { openFromContextMenu } from './contextMenu.js';
import { isFileDocument, showFileDocument } from './fileDocument.js';
import { createActivation } from './activation.js';
import { createGalleryCache } from './collector/galleryCache.js';
import { IMAGE_COUNT } from '../../utils/messages.js';

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_start',
    cssInjectionMode: 'ui',
    main(ctx) {
        let keys = null;
        const viewer = createViewer(ctx, { onOpened: () => keys.forwardAfterViewer() });
        keys = guardKeys(viewer);
        const activation = createActivation();
        activation.onChange(({ enabled }) => !enabled && viewer.close());
        const fileDocument = isFileDocument();
        const testing = import.meta.env.MODE === 'test';
        const galleries = createGalleryCache({
            isEnabled: () => !fileDocument && activation.isEnabled() && !(testing && document.documentElement.hasAttribute('data-test-no-precompute')),
            onIdle: () => !fileDocument && activation.isEnabled() && viewer.prepare(),
            onReady: () => testing && document.dispatchEvent(new CustomEvent('magic-image-viewer:test-galleries-ready')),
        });
        openFromContextMenu(viewer, activation, galleries);

        if (fileDocument) {
            showFileDocument(viewer, activation);
        } else {
            openOnClick(viewer, activation, galleries);
            browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message?.type === IMAGE_COUNT) {
                    sendResponse(galleries.imageCount());
                }
            });
        }

        if (testing) {
            document.addEventListener('magic-image-viewer:test-open', (event) => {
                const { images, start } = JSON.parse(event.detail);
                viewer.open(images, start);
            });
        }
    },
});
