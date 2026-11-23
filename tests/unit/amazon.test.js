import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexOfShown, readPhotos } from '../../entrypoints/content/adapters/amazon.js';

const CDN = 'https://m.media-amazon.com/images/I';
const photo = (large, small, altText = null) => ({
    hiRes: `${CDN}/${large}._AC_SL1500_.jpg`,
    thumb: `${CDN}/${small}._AC_US100_.jpg`,
    large: `${CDN}/${small}._AC_.jpg`,
    main: { [`${CDN}/${large}._AC_SX679_.jpg`]: [679, 679], [`${CDN}/${large}._AC_SY355_.jpg`]: [355, 355] },
    altText,
});
const script = (json) => `P.when('A').register('ImageBlockATF', function(A){ var data = { 'colorImages': { 'initial': A.$.parseJSON('${json}')}, 'colorToAsin': {'initial': {}} }; });`;

test('reads every product photo with its largest version first', () => {
    const photos = readPhotos(script(JSON.stringify([photo('71oJ', '41UR'), photo('71zz', '41yX', "Tom's cabinet")]).replace("'", "\\'")));

    assert.equal(photos.length, 2);
    assert.deepEqual(photos[0].sources, [`${CDN}/71oJ.jpg`, `${CDN}/71oJ._AC_SL1500_.jpg`, `${CDN}/71oJ._AC_SX679_.jpg`, `${CDN}/41UR._AC_.jpg`]);
    assert.equal(photos[0].thumb, `${CDN}/41UR._AC_US100_.jpg`);
    assert.equal(photos[1].alt, "Tom's cabinet");
});

test('reads a plain array as well', () => {
    const text = `var data = { 'colorImages': { 'initial': ${JSON.stringify([photo('71oJ', '41UR')])} } };`;

    assert.equal(readPhotos(text).length, 1);
});

test('finds nothing on a page without the photo list or with a broken one', () => {
    assert.deepEqual(readPhotos('var nothing = 1;'), []);
    assert.deepEqual(readPhotos(`'colorImages': { 'initial': A.$.parseJSON('[{"hiRes": ')`), []);
});

test('finds the shown photo by any of its sizes', () => {
    const photos = readPhotos(script(JSON.stringify([photo('71oJ', '41UR'), photo('71zz', '41yX')])));

    assert.equal(indexOfShown(photos, [`${CDN}/71zz._AC_SX466_.jpg`]), 1);
    assert.equal(indexOfShown(photos, [`${CDN}/41UR._AC_US40_.jpg`]), 0);
    assert.equal(indexOfShown(photos, [`${CDN}/99xx._AC_SX466_.jpg`]), -1);
});
