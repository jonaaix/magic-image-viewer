import './style.css';
import { createViewer } from './viewer.js';
import { guardKeys } from './keyGuard.js';
import { openOnClick } from './clickToOpen.js';
import { openFromContextMenu } from './contextMenu.js';
import { isImageDocument, showImageDocument } from './imageDocument.js';

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_start',
    cssInjectionMode: 'ui',
    main(ctx) {
        let keys = null;
        const viewer = createViewer(ctx, { onOpened: () => keys.forwardAfterViewer() });
        keys = guardKeys(viewer);
        openFromContextMenu(viewer);

        if (isImageDocument()) {
            showImageDocument(viewer);
        } else {
            openOnClick(viewer);
        }

        if (import.meta.env.MODE === 'test') {
            document.addEventListener('magic-image-viewer:test-open', (event) => {
                const { images, start } = JSON.parse(event.detail);
                viewer.open(images, start);
            });
        }
    },
});
