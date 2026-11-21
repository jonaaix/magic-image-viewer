import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cornerRadius, isContentImage, isImageUrl, largestCandidate, largestSource, parseSrcset } from '../../entrypoints/content/collector/rules.js';

const image = (overrides = {}) => ({
    width: 300,
    height: 200,
    visible: true,
    inControl: false,
    src: 'https://example.com/photo.jpg',
    currentSrc: 'https://example.com/photo.jpg',
    srcset: '',
    sourceSrcsets: [],
    attributes: {},
    link: null,
    ...overrides,
});

describe('isContentImage', () => {
    test('takes a visible image of at least 100 px on its shorter side', () => {
        assert.equal(isContentImage(image({ width: 100, height: 100 })), true);
    });

    test('skips anything shorter than 100 px', () => {
        assert.equal(isContentImage(image({ width: 400, height: 99 })), false);
        assert.equal(isContentImage(image({ width: 48, height: 48 })), false);
        assert.equal(isContentImage(image({ width: 1, height: 1 })), false);
    });

    test('takes a smaller thumbnail when it links to an image file', () => {
        assert.equal(isContentImage(image({ width: 80, height: 60, link: 'https://example.com/large.jpg' })), true);
        assert.equal(isContentImage(image({ width: 80, height: 60, link: 'https://example.com/page' })), false);
    });

    test('skips a linked icon below the thumbnail size', () => {
        assert.equal(isContentImage(image({ width: 24, height: 24, link: 'https://example.com/large.jpg' })), false);
    });

    test('skips hidden images, images in controls and sprites', () => {
        assert.equal(isContentImage(image({ visible: false })), false);
        assert.equal(isContentImage(image({ inControl: true })), false);
        assert.equal(isContentImage(image({ src: 'https://example.com/ui-sprite.png' })), false);
    });
});

describe('isImageUrl', () => {
    test('recognises image files by extension, ignoring the query', () => {
        assert.equal(isImageUrl('https://example.com/a/b.JPG?w=2000'), true);
        assert.equal(isImageUrl('https://example.com/a/b.webp#x'), true);
        assert.equal(isImageUrl('https://example.com/gallery/12'), false);
        assert.equal(isImageUrl('not a url'), false);
    });
});

describe('srcset', () => {
    test('parses width and density descriptors', () => {
        assert.deepEqual(parseSrcset('a.jpg 400w, b.jpg 1600w'), [
            { url: 'a.jpg', width: 400, density: null },
            { url: 'b.jpg', width: 1600, density: null },
        ]);
        assert.deepEqual(parseSrcset('a.jpg, b.jpg 2x'), [
            { url: 'a.jpg', width: null, density: 1 },
            { url: 'b.jpg', width: null, density: 2 },
        ]);
    });

    test('keeps commas inside a URL', () => {
        assert.deepEqual(parseSrcset('https://cdn.example.com/w_400,h_300/a.jpg 400w').map((candidate) => candidate.url), ['https://cdn.example.com/w_400,h_300/a.jpg']);
    });

    test('picks the widest candidate, density only without widths', () => {
        assert.equal(largestCandidate(parseSrcset('a.jpg 400w, c.jpg 2400w, b.jpg 1600w')), 'c.jpg');
        assert.equal(largestCandidate(parseSrcset('a.jpg 1x, b.jpg 3x, c.jpg 2x')), 'b.jpg');
        assert.equal(largestCandidate([]), null);
    });
});

describe('largestSource', () => {
    test('prefers a link to an image file', () => {
        assert.equal(largestSource(image({ link: 'https://example.com/full.jpg', srcset: 'https://example.com/big.jpg 3000w' })), 'https://example.com/full.jpg');
    });

    test('then the largest srcset candidate across the picture sources', () => {
        const picture = image({ srcset: 'https://example.com/s.jpg 400w', sourceSrcsets: ['https://example.com/m.webp 800w, https://example.com/l.webp 2000w'] });

        assert.equal(largestSource(picture), 'https://example.com/l.webp');
    });

    test('then a full-size data attribute, the zoom image first', () => {
        const attributes = { 'data-src': 'https://example.com/lazy.jpg', 'data-zoom-image': 'https://example.com/zoom.jpg' };

        assert.equal(largestSource(image({ attributes })), 'https://example.com/zoom.jpg');
        assert.equal(largestSource(image({ attributes: { 'data-src': 'https://example.com/lazy.jpg' } })), 'https://example.com/lazy.jpg');
    });

    test('ignores a link to another page', () => {
        assert.equal(largestSource(image({ link: 'https://example.com/article' })), 'https://example.com/photo.jpg');
    });

    test('falls back to the loaded source, then to src', () => {
        assert.equal(largestSource(image({ currentSrc: 'https://example.com/current.jpg' })), 'https://example.com/current.jpg');
        assert.equal(largestSource(image({ currentSrc: null })), 'https://example.com/photo.jpg');
    });
});

describe('cornerRadius', () => {
    test('reads pixels and percentages', () => {
        assert.equal(cornerRadius('12px', 300, 200), 12);
        assert.equal(cornerRadius('50%', 300, 200), 100);
        assert.equal(cornerRadius('0px', 300, 200), 0);
        assert.equal(cornerRadius('', 300, 200), 0);
    });
});
