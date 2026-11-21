const rootFontSize = new URLSearchParams(window.location.search).get('root-font-size');

if (rootFontSize) {
    document.documentElement.style.fontSize = rootFontSize;
}

window.pageKeys = [];

for (const type of ['keydown', 'keyup', 'keypress']) {
    document.addEventListener(type, (event) => window.pageKeys.push(`document-capture:${type}:${event.key}`), true);
    document.addEventListener(type, (event) => window.pageKeys.push(`document:${type}:${event.key}`));
    window.addEventListener(type, (event) => window.pageKeys.push(`window:${type}:${event.key}`));
}

window.openViewer = (start = 0) => {
    const images = [1, 2, 3, 4].map((number) => ({
        src: new URL(`images/photo-${number}.svg`, window.location.href).href,
        caption: `Photo ${number}`,
    }));

    document.dispatchEvent(new CustomEvent('magic-image-viewer:test-open', { detail: JSON.stringify({ images, start }) }));
};
