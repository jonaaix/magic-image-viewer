import { defineConfig } from '@playwright/test';

const port = 5190;

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.js',
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? 'github' : 'list',
    workers: 1,
    use: {
        baseURL: `http://localhost:${port}`,
        viewport: { width: 1280, height: 800 },
    },
    webServer: {
        command: `node tests/support/serve.js ${port}`,
        url: `http://localhost:${port}/plain.html`,
        reuseExistingServer: !process.env.CI,
    },
});
