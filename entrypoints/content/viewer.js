import { createApp, h, nextTick, ref, shallowRef, watch } from 'vue';
import { Lightbox } from '@aaix/laravel-islands-gallery/vue';
import { lightboxLabels } from './lightboxLabels.js';

const HOST_NAME = 'magic-image-viewer';

const HOST_STYLE = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    overflow: 'visible',
    right: 'auto',
    bottom: 'auto',
    margin: '0',
    padding: '0',
    border: '0',
    background: 'transparent',
    'max-width': 'none',
    'max-height': 'none',
    display: 'block',
    'z-index': '2147483647',
};

const CLOSE_ANIMATION_MS = 400;

function pin(host) {
    for (const [property, value] of Object.entries(HOST_STYLE)) {
        host.style.setProperty(property, value, 'important');
    }
}

export function createViewer(ctx, { onOpened }) {
    const images = shallowRef([]);
    const options = shallowRef({});
    const index = ref(null);
    const labels = lightboxLabels();
    let ui = null;

    function fallBack(position, failed) {
        const item = images.value[position];

        if (item?.src !== failed || !item.fallbacks?.length) {
            return;
        }

        const [src, ...fallbacks] = item.fallbacks;
        images.value = images.value.with(position, { ...item, src, fallbacks });
        probe(position);
    }

    function probe(position) {
        const item = images.value[position];

        if (!item?.fallbacks?.length) {
            return;
        }

        const image = new Image();
        image.onerror = () => fallBack(position, item.src);
        image.src = item.src;
    }

    watch(index, (position) => {
        if (position !== null) {
            [position - 1, position, position + 1].forEach(probe);
        }
    });

    function raise() {
        const host = ui?.shadowHost;

        if (!host?.isConnected) {
            return;
        }

        host.setAttribute('popover', 'manual');

        if (host.matches(':popover-open')) {
            host.hidePopover();
        }

        host.showPopover();
    }

    function lower() {
        setTimeout(() => {
            const host = ui?.shadowHost;

            if (index.value === null && host?.matches(':popover-open')) {
                host.hidePopover();
            }
        }, CLOSE_ANIMATION_MS);
    }

    watch(index, (position, previous) => {
        if (position === null) {
            lower();
        } else if (previous === null) {
            nextTick(raise);
        }
    });

    document.addEventListener('toggle', (event) => {
        if (index.value !== null && event.newState === 'open' && event.target !== ui?.shadowHost) {
            raise();
        }
    }, true);

    let mounting = null;

    function ensureMounted() {
        if (!ui?.shadowHost.isConnected) {
            mounting ??= mount().finally(() => (mounting = null));
        }

        return mounting ?? Promise.resolve();
    }

    async function mount() {
        ui?.remove();
        ui = await createShadowRootUi(ctx, {
            name: HOST_NAME,
            position: 'inline',
            anchor: () => document.documentElement,
            onMount(container, shadow, host) {
                pin(host);
                const app = createApp({
                    render: () => h(Lightbox, {
                        ...options.value,
                        images: images.value,
                        labels,
                        index: index.value,
                        teleport: false,
                        'onUpdate:index': (value) => (index.value = value),
                    }),
                });
                app.mount(container);

                return app;
            },
            onRemove: (app) => app?.unmount(),
        });
        ui.mount();
    }

    return {
        prepare: () => ensureMounted(),
        isOpen: () => index.value !== null,
        owns: (event) => !!ui && event.composedPath().includes(ui.shadowHost),
        async open(list, start = 0, { origin = null, originRadius = 0, closable = true, immersive = false, reserveThumbnails = false } = {}) {
            await ensureMounted();
            options.value = { origin, originRadius, closable, immersive, reserveThumbnails };
            images.value = list;
            index.value = start;
            await nextTick();
            onOpened();
        },
        shows: (list) => index.value !== null && images.value === list,
        replace(list, start, { origin }) {
            options.value = { ...options.value, origin };
            images.value = list;
            index.value = start;
        },
        close() {
            index.value = null;
        },
    };
}
