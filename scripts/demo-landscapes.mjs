import { mkdirSync, writeFileSync } from 'node:fs';

const WIDTH = 1600;
const HEIGHT = 1067;

const SCENES = [
    { name: 'dawn', sky: ['#fde68a', '#f472b6'], sun: '#fff7ed', layers: ['#c084fc', '#7c3aed', '#3b0764'] },
    { name: 'lake', sky: ['#bae6fd', '#38bdf8'], sun: '#ffffff', layers: ['#5eead4', '#0f766e', '#134e4a'], water: '#0ea5e9' },
    { name: 'dunes', sky: ['#fed7aa', '#fb923c'], sun: '#fff1f2', layers: ['#fdba74', '#ea580c', '#7c2d12'] },
    { name: 'forest', sky: ['#d9f99d', '#4ade80'], sun: '#f7fee7', layers: ['#86efac', '#15803d', '#052e16'] },
    { name: 'night', sky: ['#1e1b4b', '#312e81'], sun: '#e0e7ff', layers: ['#4338ca', '#312e81', '#0f172a'] },
    { name: 'coast', sky: ['#e0f2fe', '#7dd3fc'], sun: '#fffbeb', layers: ['#fcd34d', '#0284c7', '#075985'], water: '#0369a1' },
];

function ridge(seed, base, amplitude) {
    const points = [];

    for (let x = 0; x <= WIDTH; x += 80) {
        const y = base - amplitude * (0.5 + 0.5 * Math.sin(x / 210 + seed) * Math.cos(x / 370 + seed * 2));
        points.push(`${x},${y.toFixed(1)}`);
    }

    return `0,${HEIGHT} ${points.join(' ')} ${WIDTH},${HEIGHT}`;
}

function scene({ name, sky, sun, layers, water }, index) {
    const ridges = layers.map((colour, layer) => `<polygon points="${ridge(index * 3 + layer, 620 + layer * 150, 260 - layer * 60)}" fill="${colour}"/>`);
    const lake = water ? `<rect y="${HEIGHT - 220}" width="${WIDTH}" height="220" fill="${water}" opacity="0.85"/>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs><linearGradient id="sky-${name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky-${name})"/>
    <circle cx="${1100 - index * 90}" cy="${300 + (index % 3) * 40}" r="120" fill="${sun}" opacity="0.9"/>
    ${ridges.join('\n    ')}
    ${lake}
</svg>
`;
}

const folder = new URL('../store/demo/images/', import.meta.url);
mkdirSync(folder, { recursive: true });
SCENES.forEach((entry, index) => writeFileSync(new URL(`${entry.name}.svg`, folder), scene(entry, index)));
