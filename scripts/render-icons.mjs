import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const SIZES = [16, 24, 32, 48, 64, 96, 128];
const VARIANT = process.argv[2] ?? 'variant-a';
const source = readFileSync(new URL(`../assets/icon/${VARIANT}.svg`, import.meta.url), 'utf8');
const output = (folder) => new URL(`../public/icons/${folder}`, import.meta.url);

const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage();

for (const [folder, filter] of [['', 'none'], ['off/', 'grayscale(1) opacity(0.55)']]) {
    mkdirSync(output(folder), { recursive: true });

    for (const size of SIZES) {
        await page.setViewportSize({ width: size, height: size });
        await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px;filter:${filter}}</style>${source}`);
        await page.screenshot({ path: new URL(`${size}.png`, output(folder)).pathname, omitBackground: true });
    }
}

await browser.close();
