const AMAZON_HOST = /(^|\.)(media-amazon|ssl-images-amazon|images-amazon)\.com$/i;
const AMAZON_SIZE = /\._[^/]+_(\.[a-z0-9]+)$/i;
const AMAZON_DELIVERY_TEST = /^\/images\/W\/[^/]+(?=\/images\/)/;
const SHOPIFY_HOST = /(^|\.)shopify\.com$/i;
const SHOPIFY_SIZE = /_(\d{2,5}x\d{0,5}|x\d{2,5}|pico|icon|thumb|small|compact|medium|large|grande)(@\dx)?(_crop_[a-z]+)?(\.[a-z0-9]+)$/i;
const CLOUDINARY_HOST = /(^|\.)cloudinary\.com$/i;
const CLOUDINARY_TRANSFORMS = /\/upload\/(?:[a-z]{1,2}_[^/]+\/)+/i;
const DIMENSION_SUFFIX = /-\d{2,5}x\d{2,5}(\.[a-z0-9]+)$/i;
const REDDIT_PREVIEW_HOST = 'preview.redd.it';
const REDDIT_ORIGINAL_HOST = 'i.redd.it';
const REDDIT_TITLE_PREFIX = /\/[^/]*-v0-(?=[a-z0-9]+\.[a-z0-9]+$)/i;
const SIZE_PARAMS = ['w', 'h', 'width', 'height'];

function withoutSizePath(url) {
    const path = url.pathname;

    if (AMAZON_HOST.test(url.hostname)) {
        return path.replace(AMAZON_DELIVERY_TEST, '').replace(AMAZON_SIZE, '$1');
    }

    if (SHOPIFY_HOST.test(url.hostname) || path.includes('/cdn/shop/')) {
        return path.replace(SHOPIFY_SIZE, '$4');
    }

    if (CLOUDINARY_HOST.test(url.hostname)) {
        return path.replace(CLOUDINARY_TRANSFORMS, '/upload/');
    }

    return path.replace(DIMENSION_SUFFIX, '$1');
}

function proxiedSource(url) {
    if (url.pathname !== '/_next/image' || !url.searchParams.get('url')) {
        return null;
    }

    return new URL(url.searchParams.get('url'), url).href;
}

export function originalOf(source) {
    let url;

    try {
        url = new URL(source);
    } catch {
        return null;
    }

    if (!url.protocol.startsWith('http')) {
        return null;
    }

    if (url.hostname === REDDIT_PREVIEW_HOST) {
        return `https://${REDDIT_ORIGINAL_HOST}${url.pathname.replace(REDDIT_TITLE_PREFIX, '/')}`;
    }

    const proxied = proxiedSource(url);

    if (proxied) {
        return proxied;
    }

    url.pathname = withoutSizePath(url);

    if (AMAZON_HOST.test(url.hostname)) {
        url.search = '';
    } else if (SIZE_PARAMS.some((name) => url.searchParams.has(name))) {
        SIZE_PARAMS.forEach((name) => url.searchParams.delete(name));
    }

    return url.href === new URL(source).href ? null : url.href;
}
