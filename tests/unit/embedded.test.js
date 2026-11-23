import { test } from 'node:test';
import assert from 'node:assert/strict';
import { galleryInText } from '../../entrypoints/content/collector/embedded.js';

const BASE = 'https://shop.example/product/1';
const CDN = 'https://m.media-amazon.com/images/I';

test('finds a plain list of product photos', () => {
    const text = JSON.stringify({ '@type': 'Product', name: 'Pot', image: ['https://shop.example/img/pot-front.jpg', 'https://shop.example/img/pot-side.jpg', 'https://shop.example/img/pot-top.jpg'] });
    const found = galleryInText(text, ['https://shop.example/img/pot-side-600x600.jpg'], BASE);

    assert.equal(found.start, 1);
    assert.deepEqual(found.photos.map((photo) => photo.sources[0]), ['https://shop.example/img/pot-front.jpg', 'https://shop.example/img/pot-side.jpg', 'https://shop.example/img/pot-top.jpg']);
});

test('takes the largest size of each photo from a list of objects', () => {
    const photo = (large, small) => ({ hiRes: `${CDN}/${large}._AC_SL1500_.jpg`, thumb: `${CDN}/${small}._AC_US100_.jpg`, main: { [`${CDN}/${large}._AC_SX679_.jpg`]: [679, 679] } });
    const text = `var data = { 'colorImages': { 'initial': A.$.parseJSON('${JSON.stringify([photo('71oJnprLXxL', '41UREFBvJhL'), photo('71zzQIgpneL', '41yXrKbqYLx')])}') } };`;
    const found = galleryInText(text, [`${CDN}/71zzQIgpneL._AC_SX679_.jpg`], BASE);

    assert.equal(found.start, 1);
    assert.deepEqual(found.photos[1].sources, [`${CDN}/71zzQIgpneL.jpg`, `${CDN}/71zzQIgpneL._AC_SL1500_.jpg`, `${CDN}/71zzQIgpneL._AC_SX679_.jpg`]);
    assert.equal(found.photos[1].thumb, `${CDN}/41yXrKbqYLx._AC_US100_.jpg`);
});

test('steps out of a list that only holds sizes of one photo', () => {
    const text = JSON.stringify({ media: [{ sizes: ['https://cdn.example/sandy-beach-400x300.jpg', 'https://cdn.example/sandy-beach-1600x1200.jpg'] }, { sizes: ['https://cdn.example/forest-400x300.jpg'] }] });
    const found = galleryInText(text, ['https://cdn.example/sandy-beach-400x300.jpg'], BASE);

    assert.equal(found.photos.length, 2);
    assert.equal(found.photos[0].sources[0], 'https://cdn.example/sandy-beach.jpg');
});

test('reads escaped and protocol-relative addresses', () => {
    const text = '{"images":["\\/\\/cdn.shopify.com\\/s\\/files\\/vase-blue.jpg?v=1","\\/\\/cdn.shopify.com\\/s\\/files\\/vase-green.jpg?v=1"]}';
    const found = galleryInText(text, ['https://cdn.shopify.com/s/files/vase-green_400x400.jpg?v=1'], BASE);

    assert.equal(found.start, 1);
    assert.equal(found.photos[0].sources[0], 'https://cdn.shopify.com/s/files/vase-blue.jpg?v=1');
});

test('finds nothing when the shown picture is not in a list of several photos', () => {
    const list = JSON.stringify({ image: ['https://shop.example/img/pot-front.jpg', 'https://shop.example/img/pot-side.jpg'] });

    assert.equal(galleryInText(list, ['https://shop.example/img/banner-wide.jpg'], BASE), null);
    assert.equal(galleryInText(JSON.stringify({ image: 'https://shop.example/img/pot-front.jpg' }), ['https://shop.example/img/pot-front.jpg'], BASE), null);
    assert.equal(galleryInText('no data here', ['https://shop.example/img/pot-front.jpg'], BASE), null);
});
