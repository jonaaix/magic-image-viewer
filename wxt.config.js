import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { shadowRootCss } from './build/shadowRootCss.js';

export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    manifest: ({ browser }) => ({
        name: 'Magic Image Viewer',
        description: '__MSG_extDescription__',
        default_locale: 'en',
        permissions: ['contextMenus', 'storage', 'activeTab'],
        icons: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 96: 'icons/96.png', 128: 'icons/128.png' },
        action: { default_icon: { 16: 'icons/16.png', 24: 'icons/24.png', 32: 'icons/32.png' } },
        ...(browser === 'firefox' && {
            browser_specific_settings: {
                gecko: {
                    id: 'magic-image-viewer@jonaaix.github.io',
                    strict_min_version: '140.0',
                    data_collection_permissions: { required: ['none'] },
                },
            },
        }),
    }),
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
