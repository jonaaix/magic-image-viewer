import './style.css';
import { createViewer } from './viewer.js';
import { guardKeys } from './keyGuard.js';
import { openOnClick } from './clickToOpen.js';
import { openFromContextMenu } from './contextMenu.js';
import { isFileDocument, showFileDocument } from './fileDocument.js';
import { createActivation } from './activation.js';

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
        openFromContextMenu(viewer, activation);

        if (isFileDocument()) {
            showFileDocument(viewer, activation);
        } else {
            openOnClick(viewer, activation);
        }

        if (import.meta.env.MODE === 'test') {
            document.addEventListener('magic-image-viewer:test-open', (event) => {
                const { images, start } = JSON.parse(event.detail);
                viewer.open(images, start);
            });
        }
    },
});
