import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isSwipeStyle, linkKind, MAX_TAP_DISTANCE, movedTooFar, shouldOpen } from '../../entrypoints/content/clickRules.js';

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

describe('isSwipeStyle', () => {
    const still = { overflowX: 'visible', scrollsSideways: false, scrollSnapType: 'none', touchAction: 'auto' };

    test('an ordinary block is no swipe region', () => {
        assert.equal(isSwipeStyle(still), false);
        assert.equal(isSwipeStyle({ ...still, touchAction: 'manipulation' }), false);
        assert.equal(isSwipeStyle({ ...still, overflowX: 'auto', scrollsSideways: false }), false);
    });

    test('a sideways scroller, scroll snap or restricted touch action is one', () => {
        assert.equal(isSwipeStyle({ ...still, overflowX: 'auto', scrollsSideways: true }), true);
        assert.equal(isSwipeStyle({ ...still, overflowX: 'scroll', scrollsSideways: true }), true);
        assert.equal(isSwipeStyle({ ...still, scrollSnapType: 'x mandatory' }), true);
        assert.equal(isSwipeStyle({ ...still, touchAction: 'pan-y' }), true);
        assert.equal(isSwipeStyle({ ...still, touchAction: 'none' }), true);
    });
});

describe('movedTooFar', () => {
    test('a tap within the threshold still counts', () => {
        assert.equal(movedTooFar({ x: 0, y: 0 }, { x: 6, y: 8 }), false);
        assert.equal(movedTooFar(null, { x: 300, y: 0 }), false);
    });

    test('a drag beyond the threshold does not', () => {
        assert.equal(movedTooFar({ x: 0, y: 0 }, { x: MAX_TAP_DISTANCE + 1, y: 0 }), true);
    });
});
