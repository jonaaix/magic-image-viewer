import { createApp, h, nextTick, ref, shallowRef } from 'vue';
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
    const index = ref(null);
    let ui = null;

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
        async open(list, start = 0) {
            await ensureMounted();
            images.value = list;
            index.value = start;
            await nextTick();
            onOpened();
        },
    };
}
