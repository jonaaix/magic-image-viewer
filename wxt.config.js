import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { shadowRootCss } from './build/shadowRootCss.js';

export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    manifest: {
        name: 'Magic Image Viewer',
        description: 'Opens any image on any web page in a full-screen viewer with zoom, pan and a gallery of every picture on the page.',
    },
    vite: () => ({
        plugins: [tailwindcss()],
        resolve: {
            dedupe: ['vue', '@aaix/laravel-islands'],
        },
        css: {
            postcss: { plugins: [shadowRootCss()] },
        },
    }),
});
