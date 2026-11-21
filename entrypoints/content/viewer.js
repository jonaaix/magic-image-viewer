import { createApp, h, nextTick, ref, shallowRef, watch } from 'vue';
import { Lightbox } from '@aaix/laravel-islands-gallery/vue';

const HOST_NAME = 'magic-image-viewer';

const HOST_STYLE = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    overflow: 'visible',
    display: 'block',
    'z-index': '2147483647',
};

function pin(host) {
    for (const [property, value] of Object.entries(HOST_STYLE)) {
        host.style.setProperty(property, value, 'important');
    }
}

export function createViewer(ctx, { onOpened }) {
    const images = shallowRef([]);
    const options = shallowRef({});
    const index = ref(null);
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

    async function ensureMounted() {
        if (ui?.shadowHost.isConnected) {
            return;
        }

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
        isOpen: () => index.value !== null,
        owns: (event) => !!ui && event.composedPath().includes(ui.shadowHost),
        async open(list, start = 0, { origin = null, originRadius = 0 } = {}) {
            await ensureMounted();
            options.value = { origin, originRadius };
            images.value = list;
            index.value = start;
            await nextTick();
            onOpened();
        },
    };
}
