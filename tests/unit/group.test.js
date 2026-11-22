import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findGroup, shapeOf, similarSize } from '../../entrypoints/content/collector/group.js';

function node(localName, children = [], size = null) {
    const element = { localName, children, parentElement: null, size };
    children.forEach((child) => (child.parentElement = element));

    return element;
}

const img = (width = 160, height = 120) => node('img', [], { width, height });
const measures = { counts: () => true, sizeOf: (image) => image.size };
const group = (image) => findGroup(image, measures);

describe('similarSize', () => {
    test('accepts the same width with another height, as in masonry', () => {
        assert.equal(similarSize({ width: 150, height: 60 }, { width: 150, height: 220 }), true);
    });

    test('rejects a much smaller image on both sides', () => {
        assert.equal(similarSize({ width: 300, height: 300 }, { width: 80, height: 30 }), false);
    });

    test('accepts an image whose size is not known yet', () => {
        assert.equal(similarSize({ width: 0, height: 0 }, { width: 300, height: 200 }), true);
    });
});

describe('shapeOf', () => {
    test('names the path down to the only image', () => {
        const image = img();

        assert.equal(shapeOf(node('li', [node('a', [image]), node('h3')]), () => true).key, 'li>a>img');
    });

    test('has no shape with two images', () => {
        assert.equal(shapeOf(node('div', [img(), img()]), () => true), null);
    });
});

describe('findGroup', () => {
    test('takes the siblings of the same shape', () => {
        const images = [img(), img(), img()];
        node('div', images);

        assert.deepEqual(group(images[1]), images);
    });

    test('keeps two galleries in separate sections apart', () => {
        const first = [img(), img()];
        const second = [img(), img()];
        node('main', [node('section', [node('h2'), node('div', first)]), node('section', [node('h2'), node('div', second)])]);

        assert.deepEqual(group(first[0]), first);
    });

    test('joins the rows of a grid', () => {
        const top = [img(), img()];
        const bottom = [img(), img()];
        node('section', [node('h2'), node('div', [node('div', top), node('div', bottom)])]);

        assert.deepEqual(group(bottom[0]), [...top, ...bottom]);
    });

    test('takes scattered figures of an article, not the paragraphs or the avatar', () => {
        const photos = [img(600, 400), img(600, 400)];
        const avatar = img(48, 48);
        node('article', [node('div', [avatar, node('span')]), node('figure', [photos[0]]), node('p'), node('figure', [photos[1], node('figcaption')])]);

        assert.deepEqual(group(photos[1]), photos);
    });

    test('leaves out a sibling of another shape or size', () => {
        const photo = img(300, 300);
        node('div', [photo, img(80, 30), node('a', [img(300, 300)])]);

        assert.equal(group(photo), null);
    });

    test('finds nothing for an image on its own', () => {
        const photo = img();
        node('section', [node('h2'), node('p'), photo]);

        assert.equal(group(photo), null);
    });
});
