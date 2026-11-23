import { test } from 'node:test';
import assert from 'node:assert/strict';
import { originalOf } from '../../entrypoints/content/collector/sizeVariants.js';
import { showsSameImage, sourcesBySize } from '../../entrypoints/content/collector/rules.js';

const image = (src) => ({ src, currentSrc: src, srcset: null, sourceSrcsets: [], attributes: {}, link: null });

test('drops the size codes from an Amazon image', () => {
    assert.equal(originalOf('https://m.media-amazon.com/images/I/41UREFBvJhL._AC_SX679_.jpg'), 'https://m.media-amazon.com/images/I/41UREFBvJhL.jpg');
    assert.equal(originalOf('https://m.media-amazon.com/images/I/41UREFBvJhL._AC_US100_.jpg'), 'https://m.media-amazon.com/images/I/41UREFBvJhL.jpg');
});

test('drops Amazon delivery test paths and long processing codes', () => {
    assert.equal(originalOf('https://m.media-amazon.com/images/W/BW_MEDIAX_AVIF_MEASUREMENT_1306696-T4/images/I/71yMBCERSFL._AC_SL1500_.jpg'), 'https://m.media-amazon.com/images/I/71yMBCERSFL.jpg');
    assert.equal(originalOf('https://m.media-amazon.com/images/I/71yMBCERSFL._AC_AIweblab1392912,T2_FMavif_SF1358,1358_PQ60_.jpg?aicid=detailPage-mediaBlock'), 'https://m.media-amazon.com/images/I/71yMBCERSFL.jpg');
});

test('turns a Reddit preview into the uploaded original', () => {
    assert.equal(originalOf('https://preview.redd.it/iilqp8qmjb3i1.jpeg?width=1080&crop=smart&auto=webp&s=3de1c3'), 'https://i.redd.it/iilqp8qmjb3i1.jpeg');
    assert.equal(originalOf('https://preview.redd.it/my-neon-pothos-has-finally-fenestrated-v0-lauub1i4u13i1.jpeg?width=1080&s=f5a1'), 'https://i.redd.it/lauub1i4u13i1.jpeg');
});

test('drops a WordPress dimension suffix', () => {
    assert.equal(originalOf('https://example.com/wp-content/uploads/2024/05/beach-300x200.jpg'), 'https://example.com/wp-content/uploads/2024/05/beach.jpg');
});

test('drops a Shopify size suffix and keeps the version', () => {
    assert.equal(originalOf('https://cdn.shopify.com/s/files/1/0001/products/shoe_400x400@2x.jpg?v=12'), 'https://cdn.shopify.com/s/files/1/0001/products/shoe.jpg?v=12');
    assert.equal(originalOf('https://shop.example/cdn/shop/files/shoe_large.png?v=3'), 'https://shop.example/cdn/shop/files/shoe.png?v=3');
});

test('drops Cloudinary transformations', () => {
    assert.equal(originalOf('https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/q_auto/v1/sample.jpg'), 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg');
});

test('resolves a Next.js image proxy to its source', () => {
    assert.equal(originalOf('https://example.com/_next/image?url=%2Fphotos%2Fcat.jpg&w=640&q=75'), 'https://example.com/photos/cat.jpg');
});

test('drops width and height parameters and keeps the others', () => {
    assert.equal(originalOf('https://images.unsplash.com/photo-123?w=400&h=300&q=80'), 'https://images.unsplash.com/photo-123?q=80');
});

test('leaves an address without a size alone', () => {
    assert.equal(originalOf('https://example.com/photos/cat.jpg'), null);
    assert.equal(originalOf('https://example.com/photos/1920x1080.jpg'), null);
    assert.equal(originalOf('https://example.com/photos/cat.jpg?first'), null);
    assert.equal(originalOf('data:image/png;base64,AAAA'), null);
    assert.equal(originalOf('not a url'), null);
});

test('ranks a guessed original after a linked file and before the other sources', () => {
    const declared = { ...image('https://example.com/a-300x200.jpg'), link: 'https://example.com/full.jpg' };

    assert.deepEqual(sourcesBySize(declared), ['https://example.com/full.jpg', 'https://example.com/a.jpg', 'https://example.com/a-300x200.jpg']);
});

test('two sizes of the same Amazon picture show the same image', () => {
    const main = image('https://m.media-amazon.com/images/I/41UREFBvJhL._AC_SX679_.jpg');
    const thumbnail = image('https://m.media-amazon.com/images/I/41UREFBvJhL._AC_US100_.jpg');
    const other = image('https://m.media-amazon.com/images/I/41yXrK+bqYL._AC_US100_.jpg');

    assert.equal(showsSameImage(main, thumbnail), true);
    assert.equal(showsSameImage(main, other), false);
});
