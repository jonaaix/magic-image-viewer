import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { linkKind, shouldOpen } from '../../entrypoints/content/clickRules.js';

const page = 'https://example.com/blog/post.html';

describe('linkKind', () => {
    test('treats empty, fragment and javascript links as no link', () => {
        for (const href of [null, '', '  ', '#', '#gallery-3', 'javascript:void(0)', 'JavaScript:open()', 'post.html#photo']) {
            assert.equal(linkKind(href, page), 'none', String(href));
        }
    });

    test('recognises a link to an image file', () => {
        assert.equal(linkKind('/media/full.jpg?v=2', page), 'image');
        assert.equal(linkKind('https://cdn.example.com/x/large.WEBP', page), 'image');
    });

    test('treats everything else as a page', () => {
        assert.equal(linkKind('/blog/next', page), 'page');
        assert.equal(linkKind('https://other.example.com/', page), 'page');
        assert.equal(linkKind('other.html#top', page), 'page');
    });
});

describe('shouldOpen', () => {
    test('opens without a link or with a link to an image file', () => {
        assert.equal(shouldOpen({ link: 'none', altKey: false }), true);
        assert.equal(shouldOpen({ link: 'image', altKey: false }), true);
    });

    test('leaves a page link alone unless Alt is held', () => {
        assert.equal(shouldOpen({ link: 'page', altKey: false }), false);
        assert.equal(shouldOpen({ link: 'page', altKey: true }), true);
    });
});
