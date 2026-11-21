import './style.css';
import { createViewer } from './viewer.js';
import { guardKeys } from './keyGuard.js';

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_start',
    cssInjectionMode: 'ui',
    main(ctx) {
        let keys = null;
        const viewer = createViewer(ctx, { onOpened: () => keys.forwardAfterViewer() });
        keys = guardKeys(viewer);

        if (import.meta.env.MODE === 'test') {
            document.addEventListener('magic-image-viewer:test-open', (event) => {
                const { images, start } = JSON.parse(event.detail);
                viewer.open(images, start);
            });
        }
    },
});
