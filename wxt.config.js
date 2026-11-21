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
        ...(browser === 'firefox' && { browser_specific_settings: { gecko: { id: 'magic-image-viewer@jonaaix.github.io' } } }),
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
